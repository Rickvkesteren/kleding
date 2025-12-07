/**
 * StyleMate - Advanced Features
 * Photo processing, AI, Statistics, Weather API, Community, Shop
 */

// ==================== IMAGE PROCESSOR ====================
const ImageProcessor = {
    // Remove background using remove.bg API (free tier: 50 images/month)
    // For production, you'd want your own API key
    async removeBackground(imageBase64) {
        // Client-side background removal using canvas
        // This is a simplified version - for production use remove.bg API
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Simple background detection (white/light backgrounds)
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    
                    // If pixel is close to white/light gray, make transparent
                    if (r > 240 && g > 240 && b > 240) {
                        data[i + 3] = 0; // Set alpha to 0
                    }
                    // Also check for very light colors
                    if (r > 230 && g > 230 && b > 230) {
                        data[i + 3] = Math.max(0, data[i + 3] - 150);
                    }
                }
                
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = imageBase64;
        });
    },

    // Detect dominant colors from image
    async detectColors(imageBase64) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Scale down for faster processing
                const scale = 0.1;
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Color buckets
                const colorCounts = {};
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = Math.round(data[i] / 32) * 32;
                    const g = Math.round(data[i + 1] / 32) * 32;
                    const b = Math.round(data[i + 2] / 32) * 32;
                    const a = data[i + 3];
                    
                    if (a < 128) continue; // Skip transparent
                    
                    const key = `${r},${g},${b}`;
                    colorCounts[key] = (colorCounts[key] || 0) + 1;
                }
                
                // Sort by frequency
                const sorted = Object.entries(colorCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                
                // Convert to color names
                const colors = sorted.map(([rgb]) => {
                    const [r, g, b] = rgb.split(',').map(Number);
                    return this.rgbToColorName(r, g, b);
                });
                
                // Get unique colors
                const uniqueColors = [...new Set(colors)];
                resolve(uniqueColors.slice(0, 3));
            };
            img.src = imageBase64;
        });
    },

    // Convert RGB to closest color name
    rgbToColorName(r, g, b) {
        const colors = {
            white: [255, 255, 255],
            black: [0, 0, 0],
            gray: [128, 128, 128],
            red: [255, 0, 0],
            blue: [0, 0, 255],
            green: [0, 128, 0],
            yellow: [255, 255, 0],
            orange: [255, 165, 0],
            pink: [255, 192, 203],
            purple: [128, 0, 128],
            brown: [139, 69, 19],
            beige: [245, 245, 220],
            navy: [0, 0, 128],
            teal: [0, 128, 128],
            maroon: [128, 0, 0],
            olive: [128, 128, 0],
            coral: [255, 127, 80],
            cream: [255, 253, 208]
        };
        
        let closestColor = 'gray';
        let minDistance = Infinity;
        
        for (const [name, [cr, cg, cb]] of Object.entries(colors)) {
            const distance = Math.sqrt(
                Math.pow(r - cr, 2) + 
                Math.pow(g - cg, 2) + 
                Math.pow(b - cb, 2)
            );
            if (distance < minDistance) {
                minDistance = distance;
                closestColor = name;
            }
        }
        
        return closestColor;
    },

    // Compress image for storage
    async compressImage(imageBase64, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let { width, height } = img;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = imageBase64;
        });
    }
};

// ==================== REAL WEATHER API ====================
const RealWeatherAPI = {
    // OpenWeatherMap free API
    API_KEY: '', // User should set their own key
    
    // Get weather by coordinates
    async getWeatherByCoords(lat, lon) {
        if (!this.API_KEY) {
            // Fallback to mock data if no API key
            return this.getMockWeather();
        }
        
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=nl&appid=${this.API_KEY}`
            );
            const data = await response.json();
            
            return {
                temp: Math.round(data.main.temp),
                feels: Math.round(data.main.feels_like),
                desc: data.weather[0].description,
                condition: this.mapCondition(data.weather[0].main),
                humidity: data.main.humidity,
                wind: data.wind.speed,
                city: data.name
            };
        } catch (error) {
            console.error('Weather API error:', error);
            return this.getMockWeather();
        }
    },

    // Get user's location
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    // Default to Amsterdam
                    resolve({ lat: 52.3676, lon: 4.9041 });
                },
                { timeout: 10000 }
            );
        });
    },

    // Get weather for current location
    async getLocalWeather() {
        const coords = await this.getCurrentLocation();
        return this.getWeatherByCoords(coords.lat, coords.lon);
    },

    // Get 7-day forecast
    async getForecast(lat, lon) {
        if (!this.API_KEY) {
            return this.getMockForecast();
        }
        
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=nl&appid=${this.API_KEY}`
            );
            const data = await response.json();
            
            // Group by day
            const daily = {};
            data.list.forEach(item => {
                const date = item.dt_txt.split(' ')[0];
                if (!daily[date]) {
                    daily[date] = {
                        date,
                        temp: item.main.temp,
                        condition: this.mapCondition(item.weather[0].main),
                        desc: item.weather[0].description
                    };
                }
            });
            
            return Object.values(daily).slice(0, 7);
        } catch (error) {
            return this.getMockForecast();
        }
    },

    mapCondition(apiCondition) {
        const map = {
            'Clear': 'sunny',
            'Clouds': 'cloudy',
            'Rain': 'rainy',
            'Drizzle': 'rainy',
            'Thunderstorm': 'rainy',
            'Snow': 'cold',
            'Mist': 'cloudy',
            'Fog': 'cloudy'
        };
        return map[apiCondition] || 'partly-cloudy';
    },

    getMockWeather() {
        const conditions = ['sunny', 'cloudy', 'rainy', 'partly-cloudy', 'cold'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const temps = { sunny: 22, cloudy: 16, rainy: 12, 'partly-cloudy': 18, cold: 5 };
        
        return {
            temp: temps[condition],
            feels: temps[condition] - 2,
            desc: condition === 'sunny' ? 'Zonnig' : condition === 'rainy' ? 'Regenachtig' : 'Bewolkt',
            condition,
            city: 'Nederland'
        };
    },

    getMockForecast() {
        const days = [];
        const today = new Date();
        const conditions = ['sunny', 'cloudy', 'rainy', 'partly-cloudy'];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            days.push({
                date: date.toISOString().split('T')[0],
                temp: 10 + Math.floor(Math.random() * 15),
                condition: conditions[Math.floor(Math.random() * conditions.length)],
                desc: 'Wisselend bewolkt'
            });
        }
        return days;
    }
};

// ==================== STATISTICS MANAGER ====================
const StatsManager = {
    // Get wear statistics
    getWearStats() {
        const history = DataManager.getHistory();
        const wardrobe = DataManager.getWardrobe();
        
        // Count wears per item
        const wearCount = {};
        history.forEach(outfit => {
            ['outerwear', 'top', 'bottom', 'shoes'].forEach(slot => {
                if (outfit[slot]?.id) {
                    wearCount[outfit[slot].id] = (wearCount[outfit[slot].id] || 0) + 1;
                }
            });
        });
        
        // Sort items by wear count
        const itemsWithCount = wardrobe.map(item => ({
            ...item,
            wearCount: wearCount[item.id] || 0,
            lastWorn: this.getLastWorn(item.id, history)
        }));
        
        const mostWorn = [...itemsWithCount].sort((a, b) => b.wearCount - a.wearCount).slice(0, 5);
        const leastWorn = [...itemsWithCount].sort((a, b) => a.wearCount - b.wearCount).slice(0, 5);
        const forgotten = itemsWithCount.filter(item => {
            if (!item.lastWorn) return true;
            const daysSinceWorn = (Date.now() - new Date(item.lastWorn).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceWorn > 30;
        });
        
        return { mostWorn, leastWorn, forgotten };
    },

    getLastWorn(itemId, history) {
        for (const outfit of history) {
            for (const slot of ['outerwear', 'top', 'bottom', 'shoes']) {
                if (outfit[slot]?.id === itemId) {
                    return outfit.wornAt;
                }
            }
        }
        return null;
    },

    // Get style analysis
    getStyleAnalysis() {
        const wardrobe = DataManager.getWardrobe();
        const history = DataManager.getHistory();
        
        // Analyze colors
        const colorCount = {};
        wardrobe.forEach(item => {
            if (item.color) {
                colorCount[item.color] = (colorCount[item.color] || 0) + 1;
            }
        });
        
        // Analyze tags/style
        const tagCount = {};
        wardrobe.forEach(item => {
            (item.tags || []).forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        });
        
        // Calculate style percentages
        const totalTags = Object.values(tagCount).reduce((a, b) => a + b, 0) || 1;
        const styleBreakdown = Object.entries(tagCount).map(([tag, count]) => ({
            tag,
            percentage: Math.round((count / totalTags) * 100)
        })).sort((a, b) => b.percentage - a.percentage);
        
        // Favorite colors
        const favoriteColors = Object.entries(colorCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([color]) => color);
        
        // Season distribution
        const seasonCount = { all: 0, summer: 0, winter: 0, spring: 0, autumn: 0 };
        wardrobe.forEach(item => {
            const season = item.season || 'all';
            seasonCount[season] = (seasonCount[season] || 0) + 1;
        });
        
        return {
            totalItems: wardrobe.length,
            totalOutfitsWorn: history.length,
            favoriteColors,
            styleBreakdown,
            seasonDistribution: seasonCount
        };
    },

    // Get total wardrobe value
    getTotalValue() {
        const wardrobe = DataManager.getWardrobe();
        return wardrobe.reduce((total, item) => total + (item.price || 0), 0);
    },

    // Calculate cost per wear
    getCostPerWear() {
        const wardrobe = DataManager.getWardrobe();
        const history = DataManager.getHistory();
        
        const wearCount = {};
        history.forEach(outfit => {
            ['outerwear', 'top', 'bottom', 'shoes'].forEach(slot => {
                if (outfit[slot]?.id) {
                    wearCount[outfit[slot].id] = (wearCount[outfit[slot].id] || 0) + 1;
                }
            });
        });
        
        return wardrobe.map(item => ({
            ...item,
            wearCount: wearCount[item.id] || 0,
            costPerWear: item.price ? (item.price / (wearCount[item.id] || 1)).toFixed(2) : null
        })).filter(item => item.price).sort((a, b) => parseFloat(a.costPerWear) - parseFloat(b.costPerWear));
    }
};

// ==================== AI STYLE MATCHER ====================
const AIStyleMatcher = {
    // Color harmony rules
    colorHarmony: {
        white: ['black', 'navy', 'gray', 'blue', 'beige', 'red', 'pink'],
        black: ['white', 'gray', 'red', 'pink', 'blue', 'beige', 'yellow'],
        gray: ['white', 'black', 'pink', 'blue', 'red', 'purple'],
        navy: ['white', 'beige', 'gray', 'pink', 'brown'],
        blue: ['white', 'gray', 'beige', 'brown', 'orange'],
        red: ['white', 'black', 'gray', 'navy', 'beige'],
        green: ['white', 'beige', 'brown', 'navy', 'gray'],
        beige: ['white', 'navy', 'brown', 'blue', 'green', 'burgundy'],
        brown: ['white', 'beige', 'blue', 'green', 'cream'],
        pink: ['white', 'gray', 'navy', 'black', 'beige'],
        yellow: ['black', 'navy', 'gray', 'white', 'blue'],
        purple: ['white', 'gray', 'black', 'pink', 'beige'],
        orange: ['white', 'navy', 'blue', 'brown', 'beige']
    },

    // Check if colors match
    doColorsMatch(color1, color2) {
        if (!color1 || !color2) return true; // If no color, assume match
        if (color1 === color2) return true; // Same color always matches
        
        const harmonies = this.colorHarmony[color1.toLowerCase()] || [];
        return harmonies.includes(color2.toLowerCase());
    },

    // Get matching colors for an item
    getMatchingColors(color) {
        return this.colorHarmony[color?.toLowerCase()] || [];
    },

    // Suggest outfit based on one item
    suggestOutfit(baseItem) {
        const wardrobe = DataManager.getWardrobe();
        const matchingColors = this.getMatchingColors(baseItem.color);
        
        const suggestions = {
            outerwear: null,
            top: null,
            bottom: null,
            shoes: null
        };
        
        // Set the base item
        if (baseItem.category === 'tops') suggestions.top = baseItem;
        if (baseItem.category === 'bottoms') suggestions.bottom = baseItem;
        if (baseItem.category === 'outerwear') suggestions.outerwear = baseItem;
        if (baseItem.category === 'shoes') suggestions.shoes = baseItem;
        
        // Find matching items for other slots
        const categories = ['outerwear', 'tops', 'bottoms', 'shoes'];
        categories.forEach(cat => {
            const slot = cat === 'tops' ? 'top' : cat === 'bottoms' ? 'bottom' : cat;
            if (suggestions[slot]) return; // Already filled
            
            const options = wardrobe.filter(item => 
                item.category === cat && 
                item.id !== baseItem.id &&
                this.doColorsMatch(baseItem.color, item.color)
            );
            
            if (options.length > 0) {
                suggestions[slot] = options[Math.floor(Math.random() * options.length)];
            }
        });
        
        return suggestions;
    },

    // Get "Complete the look" suggestions from shop
    getShopSuggestions(currentOutfit) {
        const shopItems = ShopManager.items;
        const suggestions = [];
        
        // Find missing slots
        const slots = ['outerwear', 'top', 'bottom', 'shoes'];
        const colors = [];
        
        slots.forEach(slot => {
            const item = currentOutfit[slot];
            if (item?.color) colors.push(item.color);
        });
        
        // Find shop items that match the outfit colors
        shopItems.forEach(item => {
            const matchesAny = colors.some(color => this.doColorsMatch(color, item.color));
            if (matchesAny || colors.length === 0) {
                suggestions.push({
                    ...item,
                    reason: `Past goed bij je ${colors[0] || 'stijl'}`
                });
            }
        });
        
        return suggestions.slice(0, 4);
    },

    // Analyze user's style
    analyzeStyle(wardrobe) {
        const styles = {
            casual: 0,
            formal: 0,
            sporty: 0,
            elegant: 0,
            streetwear: 0
        };
        
        // Simple heuristics based on tags and categories
        wardrobe.forEach(item => {
            const tags = item.tags || [];
            const name = (item.name || '').toLowerCase();
            
            if (tags.includes('casual') || name.includes('t-shirt') || name.includes('jeans')) {
                styles.casual += 2;
            }
            if (tags.includes('formal') || name.includes('blazer') || name.includes('overhemd')) {
                styles.formal += 2;
            }
            if (tags.includes('sport') || name.includes('sneaker') || name.includes('hoodie')) {
                styles.sporty += 2;
            }
            if (name.includes('jurk') || name.includes('hakken') || name.includes('zijde')) {
                styles.elegant += 2;
            }
            if (name.includes('hoodie') || name.includes('cargo') || name.includes('cap')) {
                styles.streetwear += 2;
            }
            
            // Default to casual
            styles.casual += 1;
        });
        
        const total = Object.values(styles).reduce((a, b) => a + b, 0) || 1;
        
        return Object.entries(styles)
            .map(([style, count]) => ({
                style,
                percentage: Math.round((count / total) * 100)
            }))
            .sort((a, b) => b.percentage - a.percentage);
    }
};

// ==================== WEEK PLANNER ====================
const WeekPlanner = {
    STORAGE_KEY: 'stylemate_weekplan',

    getWeekPlan() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    },

    saveWeekPlan(plan) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plan));
    },

    setOutfitForDay(date, outfit) {
        const plan = this.getWeekPlan();
        plan[date] = outfit;
        this.saveWeekPlan(plan);
    },

    getOutfitForDay(date) {
        const plan = this.getWeekPlan();
        return plan[date] || null;
    },

    getWeekOutfits() {
        const plan = this.getWeekPlan();
        const today = new Date();
        const week = [];
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            week.push({
                date: dateStr,
                dayName: date.toLocaleDateString('nl-NL', { weekday: 'long' }),
                outfit: plan[dateStr] || null
            });
        }
        
        return week;
    },

    clearDay(date) {
        const plan = this.getWeekPlan();
        delete plan[date];
        this.saveWeekPlan(plan);
    }
};

// ==================== WISHLIST MANAGER ====================
const WishlistManager = {
    STORAGE_KEY: 'stylemate_wishlist',

    getWishlist() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    saveWishlist(items) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    },

    addToWishlist(item) {
        const wishlist = this.getWishlist();
        if (!wishlist.find(w => w.id === item.id)) {
            item.addedAt = new Date().toISOString();
            wishlist.push(item);
            this.saveWishlist(wishlist);
        }
        return wishlist;
    },

    removeFromWishlist(itemId) {
        let wishlist = this.getWishlist();
        wishlist = wishlist.filter(item => item.id !== itemId);
        this.saveWishlist(wishlist);
        return wishlist;
    },

    isInWishlist(itemId) {
        return this.getWishlist().some(item => item.id === itemId);
    },

    getTotalValue() {
        return this.getWishlist().reduce((total, item) => total + (item.price || 0), 0);
    }
};

// ==================== COMMUNITY MANAGER ====================
const CommunityManager = {
    // Mock community looks
    communityLooks: [
        {
            id: 'look1',
            user: 'FashionFan123',
            avatar: '👩',
            title: 'Perfect voor kantoor',
            likes: 234,
            items: [
                { name: 'Witte Blouse', image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=200' },
                { name: 'Zwarte Pantalon', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200' }
            ],
            tags: ['werk', 'formal', 'minimalistisch']
        },
        {
            id: 'look2',
            user: 'StyleQueen',
            avatar: '👸',
            title: 'Weekend vibes',
            likes: 189,
            items: [
                { name: 'Oversized Hoodie', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200' },
                { name: 'Mom Jeans', image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200' }
            ],
            tags: ['casual', 'comfy', 'weekend']
        },
        {
            id: 'look3',
            user: 'TrendSetter',
            avatar: '🧑',
            title: 'Date night ready',
            likes: 412,
            items: [
                { name: 'Satijnen Top', image: 'https://images.unsplash.com/photo-1564584217132-2271feaeb3c5?w=200' },
                { name: 'Leren Rok', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0uj3a?w=200' }
            ],
            tags: ['date', 'chic', 'avond']
        }
    ],

    getLooks(filter = 'popular') {
        let looks = [...this.communityLooks];
        
        if (filter === 'popular') {
            looks.sort((a, b) => b.likes - a.likes);
        } else if (filter === 'recent') {
            looks.reverse();
        }
        
        return looks;
    },

    getLooksByTag(tag) {
        return this.communityLooks.filter(look => look.tags.includes(tag));
    },

    likeLook(lookId) {
        const look = this.communityLooks.find(l => l.id === lookId);
        if (look) look.likes++;
        return look;
    },

    // Share outfit (returns shareable data)
    createShareableOutfit(outfit) {
        return {
            id: Date.now().toString(),
            outfit,
            shareUrl: `https://stylemate.app/look/${Date.now()}`,
            shareText: `Check mijn outfit van vandaag! 👗✨ #StyleMate`
        };
    }
};

// ==================== SHARE MANAGER ====================
const ShareManager = {
    async shareOutfit(outfit, platform = 'native') {
        const shareData = CommunityManager.createShareableOutfit(outfit);
        
        if (platform === 'native' && navigator.share) {
            try {
                await navigator.share({
                    title: 'Mijn StyleMate Outfit',
                    text: shareData.shareText,
                    url: shareData.shareUrl
                });
                return { success: true };
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Share failed:', error);
                }
                return { success: false, error };
            }
        }
        
        // Fallback: copy to clipboard
        if (platform === 'copy' || !navigator.share) {
            try {
                await navigator.clipboard.writeText(`${shareData.shareText}\n${shareData.shareUrl}`);
                return { success: true, method: 'clipboard' };
            } catch (error) {
                return { success: false, error };
            }
        }
        
        return { success: false };
    },

    getShareButtons() {
        return [
            { id: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366' },
            { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
            { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2' },
            { id: 'twitter', name: 'Twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
            { id: 'copy', name: 'Kopieer Link', icon: 'fas fa-link', color: '#6366f1' }
        ];
    }
};

// Export all modules
window.ImageProcessor = ImageProcessor;
window.RealWeatherAPI = RealWeatherAPI;
window.StatsManager = StatsManager;
window.AIStyleMatcher = AIStyleMatcher;
window.WeekPlanner = WeekPlanner;
window.WishlistManager = WishlistManager;
window.CommunityManager = CommunityManager;
window.ShareManager = ShareManager;
