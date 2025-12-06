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
        // Simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: #2d3436;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
};

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', () => {
    WardrobeManager.init();
});
