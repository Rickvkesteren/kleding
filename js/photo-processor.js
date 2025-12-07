/**
 * StyleMate - Photo Processor
 * Handles background removal, color detection, and smart cropping
 */

const PhotoProcessor = {
    canvas: null,
    ctx: null,
    
    init() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    },

    /**
     * Process uploaded image with all enhancements
     */
    async processImage(imageData, options = {}) {
        const {
            removeBackground = true,
            detectColor = true,
            smartCrop = true,
            maxSize = 800
        } = options;

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
                // Resize if needed
                let { width, height } = this.calculateSize(img.width, img.height, maxSize);
                this.canvas.width = width;
                this.canvas.height = height;
                this.ctx.drawImage(img, 0, 0, width, height);

                let result = {
                    image: imageData,
                    dominantColor: null,
                    colorName: null,
                    processed: false
                };

                // Detect dominant color first (before background removal)
                if (detectColor) {
                    const colorInfo = this.detectDominantColor();
                    result.dominantColor = colorInfo.hex;
                    result.colorName = colorInfo.name;
                }

                // Remove background
                if (removeBackground) {
                    const processed = await this.removeBackground();
                    if (processed) {
                        result.image = processed;
                        result.processed = true;
                    }
                }

                // Smart crop (center on subject)
                if (smartCrop && result.processed) {
                    const cropped = this.smartCrop();
                    if (cropped) {
                        result.image = cropped;
                    }
                }

                resolve(result);
            };
            img.src = imageData;
        });
    },

    calculateSize(width, height, maxSize) {
        if (width <= maxSize && height <= maxSize) {
            return { width, height };
        }
        
        const ratio = width / height;
        if (width > height) {
            return { width: maxSize, height: Math.round(maxSize / ratio) };
        } else {
            return { width: Math.round(maxSize * ratio), height: maxSize };
        }
    },

    /**
     * Remove background using edge detection and color analysis
     * Uses a simple but effective algorithm for clothing photos
     */
    async removeBackground() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Sample background color from corners
        const bgColors = this.sampleBackgroundColors(data, width, height);
        const avgBgColor = this.averageColor(bgColors);

        // Tolerance for background detection
        const tolerance = 45;

        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Check if pixel is similar to background
            const distance = this.colorDistance(
                { r, g, b },
                avgBgColor
            );

            if (distance < tolerance) {
                // Make transparent
                data[i + 3] = 0;
            } else if (distance < tolerance * 1.5) {
                // Semi-transparent edge
                data[i + 3] = Math.round(255 * (distance - tolerance) / (tolerance * 0.5));
            }
        }

        // Apply edge smoothing
        this.smoothEdges(imageData);

        this.ctx.putImageData(imageData, 0, 0);
        return this.canvas.toDataURL('image/png');
    },

    sampleBackgroundColors(data, width, height) {
        const colors = [];
        const samplePoints = [
            { x: 5, y: 5 },
            { x: width - 5, y: 5 },
            { x: 5, y: height - 5 },
            { x: width - 5, y: height - 5 },
            { x: Math.floor(width / 2), y: 5 },
            { x: 5, y: Math.floor(height / 2) },
            { x: width - 5, y: Math.floor(height / 2) },
            { x: Math.floor(width / 2), y: height - 5 }
        ];

        samplePoints.forEach(point => {
            const idx = (point.y * width + point.x) * 4;
            colors.push({
                r: data[idx],
                g: data[idx + 1],
                b: data[idx + 2]
            });
        });

        return colors;
    },

    averageColor(colors) {
        const sum = colors.reduce((acc, c) => ({
            r: acc.r + c.r,
            g: acc.g + c.g,
            b: acc.b + c.b
        }), { r: 0, g: 0, b: 0 });

        return {
            r: Math.round(sum.r / colors.length),
            g: Math.round(sum.g / colors.length),
            b: Math.round(sum.b / colors.length)
        };
    },

    colorDistance(c1, c2) {
        return Math.sqrt(
            Math.pow(c1.r - c2.r, 2) +
            Math.pow(c1.g - c2.g, 2) +
            Math.pow(c1.b - c2.b, 2)
        );
    },

    smoothEdges(imageData) {
        // Simple edge smoothing using alpha channel
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const alpha = data[idx + 3];

                // If semi-transparent, smooth based on neighbors
                if (alpha > 0 && alpha < 255) {
                    const neighbors = [
                        data[((y - 1) * width + x) * 4 + 3],
                        data[((y + 1) * width + x) * 4 + 3],
                        data[(y * width + x - 1) * 4 + 3],
                        data[(y * width + x + 1) * 4 + 3]
                    ];
                    const avgAlpha = neighbors.reduce((a, b) => a + b, 0) / 4;
                    data[idx + 3] = Math.round((alpha + avgAlpha) / 2);
                }
            }
        }
    },

    /**
     * Smart crop - detect subject bounds and center
     */
    smartCrop() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        const width = this.canvas.width;
        const height = this.canvas.height;

        let minX = width, maxX = 0, minY = height, maxY = 0;
        let hasContent = false;

        // Find bounding box of non-transparent pixels
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (data[idx + 3] > 20) { // Not transparent
                    hasContent = true;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!hasContent) return null;

        // Add padding
        const padding = 20;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(width, maxX + padding);
        maxY = Math.min(height, maxY + padding);

        // Create cropped canvas
        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;
        
        if (cropWidth < 50 || cropHeight < 50) return null;

        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = cropWidth;
        cropCanvas.height = cropHeight;
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCtx.drawImage(
            this.canvas,
            minX, minY, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
        );

        return cropCanvas.toDataURL('image/png');
    },

    /**
     * Detect dominant color from the clothing item
     */
    detectDominantColor() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Color buckets for quantization
        const colorBuckets = {};
        
        // Sample center region more (where clothing likely is)
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const sampleRadius = Math.min(this.canvas.width, this.canvas.height) * 0.35;

        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel for speed
            const pixelIndex = i / 4;
            const x = pixelIndex % this.canvas.width;
            const y = Math.floor(pixelIndex / this.canvas.width);
            
            // Weight center pixels more
            const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (distFromCenter > sampleRadius * 1.5) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];

            // Skip transparent/near-transparent pixels
            if (a < 128) continue;
            
            // Skip very light (likely background) or very dark pixels
            const brightness = (r + g + b) / 3;
            if (brightness > 240 || brightness < 15) continue;

            // Quantize to reduce color space
            const qr = Math.round(r / 32) * 32;
            const qg = Math.round(g / 32) * 32;
            const qb = Math.round(b / 32) * 32;
            
            const key = `${qr},${qg},${qb}`;
            const weight = distFromCenter < sampleRadius ? 2 : 1;
            colorBuckets[key] = (colorBuckets[key] || 0) + weight;
        }

        // Find most common color
        let dominantColor = { r: 128, g: 128, b: 128 };
        let maxCount = 0;

        for (const [key, count] of Object.entries(colorBuckets)) {
            if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = key.split(',').map(Number);
                dominantColor = { r, g, b };
            }
        }

        const hex = this.rgbToHex(dominantColor.r, dominantColor.g, dominantColor.b);
        const name = this.getColorName(dominantColor);

        return { hex, name, rgb: dominantColor };
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Map RGB to nearest color name
     */
    getColorName(rgb) {
        const colors = {
            'zwart': { r: 0, g: 0, b: 0 },
            'wit': { r: 255, g: 255, b: 255 },
            'grijs': { r: 128, g: 128, b: 128 },
            'rood': { r: 200, g: 50, b: 50 },
            'blauw': { r: 50, g: 100, b: 200 },
            'groen': { r: 50, g: 150, b: 50 },
            'geel': { r: 230, g: 200, b: 50 },
            'roze': { r: 230, g: 150, b: 180 },
            'oranje': { r: 230, g: 130, b: 50 },
            'bruin': { r: 140, g: 90, b: 60 },
            'beige': { r: 210, g: 190, b: 160 },
            'navy': { r: 30, g: 40, b: 100 },
            'bordeaux': { r: 120, g: 30, b: 50 }
        };

        let closestColor = 'grijs';
        let minDistance = Infinity;

        for (const [name, color] of Object.entries(colors)) {
            const distance = this.colorDistance(rgb, color);
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = name;
            }
        }

        return closestColor;
    },

    /**
     * Create optimized thumbnail
     */
    createThumbnail(imageData, size = 200) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Calculate crop to make square
                const minDim = Math.min(img.width, img.height);
                const sx = (img.width - minDim) / 2;
                const sy = (img.height - minDim) / 2;
                
                canvas.width = size;
                canvas.height = size;
                
                // Draw centered square crop
                ctx.drawImage(
                    img,
                    sx, sy, minDim, minDim,
                    0, 0, size, size
                );
                
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = imageData;
        });
    }
};

// Initialize on load
PhotoProcessor.init();
