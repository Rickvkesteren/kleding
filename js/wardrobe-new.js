/**
 * StyleMate - Wardrobe Manager
 * Handles clothing management and photo capture
 */

const WardrobeManager = {
    currentFilter: 'all',
    selectedPhoto: null,
    selectedCategory: null,
    selectedColor: null,
    selectedSeason: 'all',

    init() {
        console.log('👕 WardrobeManager initialiseren...');
        this.setupEventListeners();
        this.loadWardrobe();
        this.updateStats();
    },

    setupEventListeners() {
        // Add clothes button
        const addBtn = document.querySelector('.btn-add-clothes');
        if (addBtn) {
            addBtn.addEventListener('click', () => App.showAddClothingModal());
        }
        
        // Category tabs
        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentFilter = tab.dataset.category;
                document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.loadWardrobe();
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.btn-close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.classList.remove('active');
                this.resetForm();
            });
        });
        
        // Photo buttons
        const cameraBtn = document.querySelector('.photo-btn.primary');
        const galleryBtn = document.querySelector('.photo-btn:not(.primary)');
        
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.openCamera());
        }
        
        if (galleryBtn) {
            galleryBtn.addEventListener('click', () => this.openGallery());
        }
        
        // Category options
        document.querySelectorAll('.cat-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.cat-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedCategory = option.dataset.category;
            });
        });
        
        // Color dots
        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                this.selectedColor = dot.dataset.color;
            });
        });
        
        // Season buttons
        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedSeason = btn.dataset.season;
            });
        });
        
        // Save button
        const saveBtn = document.querySelector('.btn-save');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveClothing());
        }
        
        // Modal backdrop click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    this.resetForm();
                }
            });
        });
    },

    loadWardrobe() {
        const grid = document.querySelector('.clothing-grid');
        if (!grid) return;
        
        const items = DataManager.getItemsByCategory(this.currentFilter);
        
        if (items.length === 0) {
            grid.innerHTML = `
                <div class="empty-wardrobe" style="grid-column: 1 / -1;">
                    <div class="empty-illustration">
                        <i class="fas fa-shirt"></i>
                    </div>
                    <h3>Nog geen kleding</h3>
                    <p>Begin met het toevoegen van je eerste kledingstuk</p>
                    <button onclick="App.showAddClothingModal()" class="btn-primary">
                        <i class="fas fa-plus"></i> Toevoegen
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = items.map(item => `
            <div class="clothing-card" data-id="${item.id}" onclick="WardrobeManager.showItemDetail('${item.id}')">
                <img src="${item.image}" alt="${item.name}">
                <div class="clothing-card-info">
                    <h4>${item.name}</h4>
                    <span>${item.color || ''}</span>
                </div>
            </div>
        `).join('');
    },

    updateStats() {
        const stats = DataManager.getStats();
        
        const totalEl = document.getElementById('totalItems');
        const outfitsEl = document.getElementById('totalOutfits');
        const favoritesEl = document.getElementById('favoriteCount');
        
        if (totalEl) totalEl.textContent = stats.total;
        if (outfitsEl) outfitsEl.textContent = stats.outfits;
        if (favoritesEl) favoritesEl.textContent = DataManager.getFavorites().length;
    },

    openCamera() {
        // Create hidden file input for camera
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => this.handleFileSelect(e);
        input.click();
    },

    openGallery() {
        // Create hidden file input for gallery
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => this.handleFileSelect(e);
        input.click();
    },

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            this.selectedPhoto = event.target.result;
            this.updatePhotoPreview();
        };
        reader.readAsDataURL(file);
    },

    updatePhotoPreview() {
        const preview = document.querySelector('.photo-preview');
        if (!preview) return;
        
        if (this.selectedPhoto) {
            preview.innerHTML = `<img src="${this.selectedPhoto}" alt="Preview">`;
            
            // Enable save button
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn) saveBtn.disabled = false;
        } else {
            preview.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-camera"></i>
                    <span>Maak een foto of kies uit galerij</span>
                </div>
            `;
        }
    },

    saveClothing() {
        if (!this.selectedPhoto) {
            alert('Maak eerst een foto van je kledingstuk');
            return;
        }
        
        if (!this.selectedCategory) {
            alert('Selecteer een categorie');
            return;
        }
        
        const nameInput = document.querySelector('.details-form input[type="text"]');
        const name = nameInput?.value || this.generateName();
        
        const item = {
            name: name,
            image: this.selectedPhoto,
            category: this.selectedCategory,
            color: this.selectedColor,
            season: this.selectedSeason
        };
        
        // Save to data
        const savedItem = DataManager.addClothingItem(item);
        
        // Close modal
        const modal = document.getElementById('addClothingModal');
        if (modal) modal.classList.remove('active');
        
        // Show success
        App.showSuccess('Toegevoegd! 👕', 'Je kledingstuk is opgeslagen');
        
        // Refresh wardrobe
        this.resetForm();
        this.loadWardrobe();
        this.updateStats();
    },

    generateName() {
        const categoryNames = {
            outerwear: 'Jas',
            tops: 'Bovenstuk',
            bottoms: 'Onderstuk',
            shoes: 'Schoenen',
            accessories: 'Accessoire'
        };
        
        const colorNames = {
            white: 'Witte',
            black: 'Zwarte',
            gray: 'Grijze',
            navy: 'Navy',
            blue: 'Blauwe',
            green: 'Groene',
            red: 'Rode',
            pink: 'Roze',
            yellow: 'Gele',
            orange: 'Oranje',
            purple: 'Paarse',
            brown: 'Bruine',
            beige: 'Beige'
        };
        
        const color = this.selectedColor ? colorNames[this.selectedColor] || '' : '';
        const category = categoryNames[this.selectedCategory] || 'Kledingstuk';
        
        return `${color} ${category}`.trim();
    },

    resetForm() {
        this.selectedPhoto = null;
        this.selectedCategory = null;
        this.selectedColor = null;
        this.selectedSeason = 'all';
        
        // Reset UI
        const nameInput = document.querySelector('.details-form input[type="text"]');
        if (nameInput) nameInput.value = '';
        
        document.querySelectorAll('.cat-option').forEach(o => o.classList.remove('active'));
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
        
        // Select 'all seasons' by default
        const allSeasonsBtn = document.querySelector('.season-btn[data-season="all"]');
        if (allSeasonsBtn) allSeasonsBtn.classList.add('active');
        
        // Reset photo preview
        this.updatePhotoPreview();
        
        // Disable save button
        const saveBtn = document.querySelector('.btn-save');
        if (saveBtn) saveBtn.disabled = true;
    },

    showItemDetail(itemId) {
        const item = DataManager.getWardrobe().find(i => i.id === itemId);
        if (!item) return;
        
        // Could show a detail modal or edit screen
        console.log('Item detail:', item);
        
        // For now, confirm delete
        if (confirm(`Wil je "${item.name}" verwijderen?`)) {
            DataManager.removeClothingItem(itemId);
            this.loadWardrobe();
            this.updateStats();
            App.showSuccess('Verwijderd', 'Kledingstuk is verwijderd');
        }
    },

    refresh() {
        this.loadWardrobe();
        this.updateStats();
    }
};

// Export
window.WardrobeManager = WardrobeManager;
