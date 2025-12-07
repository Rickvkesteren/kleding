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
    selectedTags: [],
    selectedPrice: null,
    removeBackground: false,

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
                this.selectedCategory = option.dataset.value || option.dataset.category;
                
                // Show details form after selecting category
                const detailsForm = document.getElementById('detailsForm');
                if (detailsForm && this.selectedPhoto) {
                    detailsForm.style.display = 'block';
                }
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
                this.selectedSeason = btn.dataset.value || btn.dataset.season || 'all';
            });
        });
        
        // Tag buttons
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                const tag = btn.dataset.tag;
                if (this.selectedTags.includes(tag)) {
                    this.selectedTags = this.selectedTags.filter(t => t !== tag);
                } else {
                    this.selectedTags.push(tag);
                }
            });
        });
        
        // Remove background toggle
        const bgToggle = document.getElementById('removeBackgroundToggle');
        if (bgToggle) {
            bgToggle.addEventListener('change', (e) => {
                this.removeBackground = e.target.checked;
            });
        }
        
        // Detect color button
        const detectBtn = document.getElementById('detectColorBtn');
        if (detectBtn) {
            detectBtn.addEventListener('click', () => this.detectColor());
        }
        
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
        
        grid.innerHTML = items.map(item => {
            const status = item.status || 'available';
            const statusBadge = this.getStatusBadge(status);
            
            return `
                <div class="clothing-card ${status}" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" onclick="WardrobeManager.showItemDetail('${item.id}')">
                    ${statusBadge}
                    <button class="edit-item-btn" onclick="WardrobeManager.showItemDetail('${item.id}')">
                        <i class="fas fa-pen"></i>
                    </button>
                    <div class="clothing-card-info" onclick="WardrobeManager.showItemDetail('${item.id}')">
                        <h4>${item.name}</h4>
                        <span>${item.color || ''}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Get status badge HTML
    getStatusBadge(status) {
        if (status === 'available') return '';
        
        const badges = {
            washing: '<span class="item-status-badge washing"><i class="fas fa-soap"></i></span>',
            worn: '<span class="item-status-badge worn"><i class="fas fa-clock"></i></span>'
        };
        return badges[status] || '';
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
        const detailsForm = document.getElementById('detailsForm');
        
        if (!preview) return;
        
        if (this.selectedPhoto) {
            preview.innerHTML = `<img src="${this.selectedPhoto}" alt="Preview">`;
            
            // Show details form
            if (detailsForm) {
                detailsForm.style.display = 'block';
            }
            
            // Enable save button if category is also selected
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn && this.selectedCategory) {
                saveBtn.disabled = false;
            }
        } else {
            preview.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-camera"></i>
                    <span>Maak een foto of kies uit galerij</span>
                </div>
            `;
            
            // Hide details form
            if (detailsForm) {
                detailsForm.style.display = 'none';
            }
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
        
        // Get tags from input
        const tagsInput = document.getElementById('itemTags');
        const tagsValue = tagsInput?.value || '';
        const tags = tagsValue.split(',').map(t => t.trim()).filter(t => t.length > 0);
        
        // Get price from input
        const priceInput = document.getElementById('itemPrice');
        const price = priceInput?.value ? parseFloat(priceInput.value) : null;
        
        const item = {
            name: name,
            image: this.selectedPhoto,
            category: this.selectedCategory,
            color: this.selectedColor,
            season: this.selectedSeason,
            tags: tags,
            price: price,
            wearCount: 0,
            lastWorn: null,
            dateAdded: new Date().toISOString()
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
        this.selectedTags = [];
        this.selectedPrice = null;
        
        // Reset UI
        const nameInput = document.querySelector('.details-form input[type="text"]');
        if (nameInput) nameInput.value = '';
        
        // Reset tags and price inputs
        const tagsInput = document.getElementById('itemTags');
        if (tagsInput) tagsInput.value = '';
        
        const priceInput = document.getElementById('itemPrice');
        if (priceInput) priceInput.value = '';
        
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
        const wardrobe = DataManager.getWardrobe();
        const item = wardrobe.find(i => i.id === itemId);
        if (!item) return;
        
        const status = item.status || 'available';
        const wearCount = item.wearCount || 0;
        const lastWorn = item.lastWorn ? new Date(item.lastWorn).toLocaleDateString('nl-NL') : 'Nooit';
        const addedDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('nl-NL') : 'Onbekend';
        
        // Available colors
        const colors = ['zwart', 'wit', 'grijs', 'blauw', 'rood', 'groen', 'geel', 'roze', 'bruin', 'beige', 'navy', 'bordeaux'];
        
        // Available tags
        const allTags = ['casual', 'zakelijk', 'sport', 'feest', 'zomer', 'winter', 'favoriet'];
        const itemTags = item.tags || [];
        
        // Seasons
        const seasons = [
            { value: 'all', label: 'Alle seizoenen', icon: 'fa-infinity' },
            { value: 'summer', label: 'Zomer', icon: 'fa-sun' },
            { value: 'winter', label: 'Winter', icon: 'fa-snowflake' },
            { value: 'spring', label: 'Lente/Herfst', icon: 'fa-leaf' }
        ];
        
        // Create detail modal
        const modal = document.createElement('div');
        modal.className = 'item-detail-modal';
        modal.innerHTML = `
            <div class="item-detail-content">
                <div class="detail-header-bar">
                    <button class="close-detail"><i class="fas fa-arrow-left"></i></button>
                    <span class="header-title">Item Details</span>
                    <button class="save-detail"><i class="fas fa-check"></i></button>
                </div>
                
                <div class="detail-image">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="image-actions">
                        <button class="img-action" id="changePhotoBtn"><i class="fas fa-camera"></i></button>
                    </div>
                </div>
                
                <div class="detail-info-section">
                    <!-- Editable Name -->
                    <div class="edit-field">
                        <label>Naam</label>
                        <input type="text" id="editItemName" value="${item.name}" placeholder="Naam van het item">
                    </div>
                    
                    <!-- Category -->
                    <div class="edit-field">
                        <label>Categorie</label>
                        <div class="category-chips">
                            <button class="cat-chip ${item.category === 'tops' ? 'active' : ''}" data-cat="tops"><i class="fas fa-tshirt"></i> Top</button>
                            <button class="cat-chip ${item.category === 'bottoms' ? 'active' : ''}" data-cat="bottoms"><i class="fas fa-socks"></i> Broek</button>
                            <button class="cat-chip ${item.category === 'outerwear' ? 'active' : ''}" data-cat="outerwear"><i class="fas fa-vest"></i> Jas</button>
                            <button class="cat-chip ${item.category === 'shoes' ? 'active' : ''}" data-cat="shoes"><i class="fas fa-shoe-prints"></i> Schoenen</button>
                            <button class="cat-chip ${item.category === 'accessories' ? 'active' : ''}" data-cat="accessories"><i class="fas fa-gem"></i> Accessoire</button>
                        </div>
                    </div>
                    
                    <!-- Color -->
                    <div class="edit-field">
                        <label>Kleur</label>
                        <div class="color-chips">
                            ${colors.map(c => `
                                <button class="color-chip ${item.color === c ? 'active' : ''}" data-color="${c}" style="--chip-color: ${this.getColorHex(c)}">
                                    ${item.color === c ? '<i class="fas fa-check"></i>' : ''}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Season -->
                    <div class="edit-field">
                        <label>Seizoen</label>
                        <div class="season-chips">
                            ${seasons.map(s => `
                                <button class="season-chip ${(item.season || 'all') === s.value ? 'active' : ''}" data-season="${s.value}">
                                    <i class="fas ${s.icon}"></i> ${s.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Tags -->
                    <div class="edit-field">
                        <label>Labels</label>
                        <div class="tag-chips">
                            ${allTags.map(t => `
                                <button class="tag-chip ${itemTags.includes(t) ? 'active' : ''}" data-tag="${t}">
                                    ${t}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Price -->
                    <div class="edit-field">
                        <label>Aankoopprijs</label>
                        <div class="price-input">
                            <span class="currency">€</span>
                            <input type="number" id="editItemPrice" value="${item.price || ''}" placeholder="0.00" step="0.01">
                        </div>
                    </div>
                    
                    <!-- Brand -->
                    <div class="edit-field">
                        <label>Merk</label>
                        <input type="text" id="editItemBrand" value="${item.brand || ''}" placeholder="bijv. H&M, Zara, Nike">
                    </div>
                    
                    <!-- Stats (read-only) -->
                    <div class="item-statistics">
                        <h4><i class="fas fa-chart-bar"></i> Statistieken</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-num">${wearCount}x</span>
                                <span class="stat-text">Gedragen</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-num">${lastWorn}</span>
                                <span class="stat-text">Laatst</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-num">${addedDate}</span>
                                <span class="stat-text">Toegevoegd</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Status -->
                    <div class="edit-field">
                        <label>Beschikbaarheid</label>
                        <div class="status-chips">
                            <button class="status-chip available ${status === 'available' ? 'active' : ''}" data-status="available">
                                <i class="fas fa-check-circle"></i> Beschikbaar
                            </button>
                            <button class="status-chip washing ${status === 'washing' ? 'active' : ''}" data-status="washing">
                                <i class="fas fa-soap"></i> In de was
                            </button>
                            <button class="status-chip worn ${status === 'worn' ? 'active' : ''}" data-status="worn">
                                <i class="fas fa-clock"></i> Gedragen
                            </button>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="item-actions-section">
                        <button class="action-btn vinted" id="sellVintedBtn">
                            <i class="fas fa-tag"></i>
                            <span>Verkoop op Vinted</span>
                            <i class="fas fa-external-link-alt"></i>
                        </button>
                        
                        <button class="action-btn donate" id="donateBtn">
                            <i class="fas fa-hand-holding-heart"></i>
                            <span>Doneren</span>
                        </button>
                        
                        <button class="action-btn delete" id="deleteItemBtn">
                            <i class="fas fa-trash"></i>
                            <span>Verwijderen</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Store current values for saving
        let editedItem = { ...item };
        
        // Close handlers
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };
        
        modal.querySelector('.close-detail').addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        
        // Save button
        modal.querySelector('.save-detail').addEventListener('click', () => {
            // Get all edited values
            editedItem.name = modal.querySelector('#editItemName').value || item.name;
            editedItem.price = parseFloat(modal.querySelector('#editItemPrice').value) || null;
            editedItem.brand = modal.querySelector('#editItemBrand').value || null;
            
            // Update in wardrobe
            const idx = wardrobe.findIndex(i => i.id === itemId);
            if (idx !== -1) {
                wardrobe[idx] = editedItem;
                DataManager.saveWardrobe(wardrobe);
                this.loadWardrobe();
                this.showToast('✓ Wijzigingen opgeslagen');
            }
            closeModal();
        });
        
        // Category chips
        modal.querySelectorAll('.cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                modal.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                editedItem.category = chip.dataset.cat;
            });
        });
        
        // Color chips
        modal.querySelectorAll('.color-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                modal.querySelectorAll('.color-chip').forEach(c => {
                    c.classList.remove('active');
                    c.innerHTML = '';
                });
                chip.classList.add('active');
                chip.innerHTML = '<i class="fas fa-check"></i>';
                editedItem.color = chip.dataset.color;
            });
        });
        
        // Season chips
        modal.querySelectorAll('.season-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                modal.querySelectorAll('.season-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                editedItem.season = chip.dataset.season;
            });
        });
        
        // Tag chips (multi-select)
        modal.querySelectorAll('.tag-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                chip.classList.toggle('active');
                const tag = chip.dataset.tag;
                editedItem.tags = editedItem.tags || [];
                if (chip.classList.contains('active')) {
                    if (!editedItem.tags.includes(tag)) editedItem.tags.push(tag);
                } else {
                    editedItem.tags = editedItem.tags.filter(t => t !== tag);
                }
            });
        });
        
        // Status chips
        modal.querySelectorAll('.status-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                modal.querySelectorAll('.status-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                editedItem.status = chip.dataset.status;
                DataManager.updateItemStatus(itemId, chip.dataset.status);
                this.loadWardrobe();
            });
        });
        
        // Sell on Vinted
        modal.querySelector('#sellVintedBtn').addEventListener('click', () => {
            // Open Vinted with pre-filled search (item name)
            const searchQuery = encodeURIComponent(item.name);
            window.open(`https://www.vinted.nl/catalog?search_text=${searchQuery}`, '_blank');
            this.showToast('Vinted geopend in nieuw tabblad');
        });
        
        // Donate button
        modal.querySelector('#donateBtn').addEventListener('click', () => {
            if (confirm(`Wil je "${item.name}" markeren als gedoneerd en verwijderen uit je kast?`)) {
                DataManager.removeClothingItem(itemId);
                closeModal();
                this.loadWardrobe();
                this.updateStats();
                this.showToast('🎁 Item gemarkeerd als gedoneerd');
            }
        });
        
        // Delete button
        modal.querySelector('#deleteItemBtn').addEventListener('click', () => {
            if (confirm(`Weet je zeker dat je "${item.name}" wilt verwijderen?`)) {
                DataManager.removeClothingItem(itemId);
                closeModal();
                this.loadWardrobe();
                this.updateStats();
                this.showToast('Item verwijderd');
            }
        });
    },
    
    // Get hex color for color chips
    getColorHex(colorName) {
        const colorMap = {
            'zwart': '#1a1a1a',
            'wit': '#ffffff',
            'grijs': '#808080',
            'blauw': '#3b82f6',
            'rood': '#ef4444',
            'groen': '#22c55e',
            'geel': '#eab308',
            'roze': '#ec4899',
            'bruin': '#92400e',
            'beige': '#d4b896',
            'navy': '#1e3a5f',
            'bordeaux': '#722f37'
        };
        return colorMap[colorName] || '#808080';
    },
    
    showToast(message) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    },

    refresh() {
        this.loadWardrobe();
        this.updateStats();
    }
};

// Export
window.WardrobeManager = WardrobeManager;
