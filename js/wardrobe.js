// Kledingkast functionaliteit

const WardrobeManager = {
    currentFilter: 'all',

    init() {
        this.bindEvents();
        this.renderClothing();
    },

    bindEvents() {
        // Add clothing button
        const addBtn = document.getElementById('addClothingBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openAddModal());
        }

        // Close modal
        const closeBtn = document.getElementById('closeModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeAddModal());
        }

        // Form submit
        const form = document.getElementById('addClothingForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleAddClothing(e));
        }

        // Category filters
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => this.filterByCategory(btn.dataset.category));
        });

        // Image upload preview (gallery)
        const imageInput = document.getElementById('clothingImage');
        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.previewImage(e));
        }

        // Camera input preview
        const cameraInput = document.getElementById('clothingCamera');
        if (cameraInput) {
            cameraInput.addEventListener('change', (e) => this.previewImage(e));
        }

        // URL input preview
        const urlInput = document.getElementById('clothingImageUrl');
        if (urlInput) {
            urlInput.addEventListener('blur', (e) => this.previewUrlImage(e));
        }

        // Close modal on outside click
        const modal = document.getElementById('addClothingModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAddModal();
                }
            });
        }
    },

    renderClothing() {
        const grid = document.getElementById('clothingGrid');
        if (!grid) return;

        const items = DataManager.getClothingByCategory(this.currentFilter);

        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-tshirt"></i>
                    <h3>Je kast is nog leeg</h3>
                    <p>Voeg je eerste kledingstuk toe!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(item => this.createClothingCard(item)).join('');

        // Bind delete events
        grid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteClothing(btn.dataset.id);
            });
        });
    },

    createClothingCard(item) {
        const placeholderSvg = this.getPlaceholderSvg(item);
        const imageContent = item.image 
            ? `<img src="${item.image}" alt="${item.name}" onerror="this.src='${placeholderSvg}'">`
            : `<img src="${placeholderSvg}" alt="${item.name}">`;

        const colorLabel = this.getColorLabel(item.color);
        const favoriteIcon = item.favorite ? '<span class="favorite-badge"><i class="fas fa-heart"></i></span>' : '';
        const wearCount = item.wearCount || 0;
        const wearBadge = wearCount > 0 ? `<span class="wear-badge">${wearCount}x</span>` : '';

        return `
            <div class="clothing-item" data-id="${item.id}">
                ${favoriteIcon}
                ${wearBadge}
                ${imageContent}
                <div class="clothing-item-info">
                    <h4>${item.name}</h4>
                    <span>${colorLabel} • ${this.getCategoryLabel(item.category)}</span>
                </div>
                <button class="delete-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    },

    getPlaceholderSvg(item) {
        const colorMap = {
            white: '%23f5f5f5',
            black: '%232d3436',
            gray: '%23636e72',
            blue: '%230984e3',
            red: '%23d63031',
            green: '%2300b894',
            yellow: '%23fdcb6e',
            orange: '%23e17055',
            pink: '%23fd79a8',
            purple: '%236c5ce7',
            brown: '%238b4513',
            beige: '%23d4a574'
        };
        const bgColor = colorMap[item.color] || '%23dfe6e9';
        const textColor = ['white', 'yellow', 'beige'].includes(item.color) ? '%23333' : '%23fff';
        
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="180" viewBox="0 0 150 180"><rect fill="${bgColor}" width="150" height="180"/><text fill="${textColor}" font-family="Arial" font-size="11" text-anchor="middle" x="75" y="90">${encodeURIComponent(item.name)}</text></svg>`;
        return `data:image/svg+xml,${svg}`;
    },

    filterByCategory(category) {
        this.currentFilter = category;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.renderClothing();
    },

    openAddModal() {
        const modal = document.getElementById('addClothingModal');
        if (modal) {
            modal.classList.add('active');
        }
    },

    closeAddModal() {
        const modal = document.getElementById('addClothingModal');
        if (modal) {
            modal.classList.remove('active');
            // Reset form
            document.getElementById('addClothingForm')?.reset();
            document.getElementById('imagePreview').innerHTML = '';
        }
    },

    handleAddClothing(e) {
        e.preventDefault();

        const name = document.getElementById('clothingName').value;
        const category = document.getElementById('clothingCategory').value;
        const color = document.getElementById('clothingColor').value;
        const style = document.getElementById('clothingStyle').value;
        const season = document.getElementById('clothingSeason').value;
        
        // Get image from file or URL
        const imagePreview = document.getElementById('imagePreview');
        const img = imagePreview.querySelector('img');
        const image = img ? img.src : null;

        const newItem = {
            name,
            category,
            color,
            style,
            season,
            image,
            icon: this.getCategoryIcon(category)
        };

        DataManager.addClothingItem(newItem);
        this.closeAddModal();
        this.renderClothing();

        // Show success message
        this.showNotification('Kledingstuk toegevoegd! 👕');
    },

    deleteClothing(id) {
        if (confirm('Weet je zeker dat je dit item wilt verwijderen?')) {
            DataManager.deleteClothingItem(id);
            this.renderClothing();
            this.showNotification('Item verwijderd');
        }
    },

    previewImage(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    },

    previewUrlImage(e) {
        const url = e.target.value;
        if (url) {
            const preview = document.getElementById('imagePreview');
            const img = new Image();
            img.onload = () => {
                preview.innerHTML = `<img src="${url}" alt="Preview">`;
            };
            img.onerror = () => {
                preview.innerHTML = '<p style="color: #e17055;">Kon afbeelding niet laden</p>';
            };
            img.src = url;
        }
    },

    getCategoryIcon(category) {
        const icons = {
            tops: 'fa-tshirt',
            bottoms: 'fa-socks',
            shoes: 'fa-shoe-prints',
            accessories: 'fa-ring',
            outerwear: 'fa-vest'
        };
        return icons[category] || 'fa-tshirt';
    },

    getCategoryLabel(category) {
        const labels = {
            tops: 'Top',
            bottoms: 'Broek',
            shoes: 'Schoenen',
            accessories: 'Accessoire',
            outerwear: 'Jas'
        };
        return labels[category] || category;
    },

    getColorLabel(color) {
        const labels = {
            white: 'Wit',
            black: 'Zwart',
            gray: 'Grijs',
            blue: 'Blauw',
            red: 'Rood',
            green: 'Groen',
            yellow: 'Geel',
            orange: 'Oranje',
            pink: 'Roze',
            purple: 'Paars',
            brown: 'Bruin',
            beige: 'Beige'
        };
        return labels[color] || color;
    },

    showNotification(message) {
        // Remove existing notification
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        // Create beautiful notification
        const notification = document.createElement('div');
        notification.className = 'toast-notification';
        notification.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">✨</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            color: white;
            padding: 14px 28px;
            border-radius: 50px;
            z-index: 1000;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            font-weight: 500;
            font-size: 0.9rem;
            opacity: 0;
            animation: toastIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        `;

        // Add animation keyframes if not exists
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                @keyframes toastIn {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(100px) scale(0.8);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                }
                @keyframes toastOut {
                    0% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px) scale(0.8);
                    }
                }
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .toast-icon {
                    font-size: 1.1rem;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2500);
    }
};

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', () => {
    WardrobeManager.init();
});
