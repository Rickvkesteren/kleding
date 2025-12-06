// Outfits management

const OutfitsManager = {
    init() {
        this.bindEvents();
        this.renderOutfits();
    },

    bindEvents() {
        const createBtn = document.getElementById('createOutfitBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.navigateToSwipe());
        }

        const closeBtn = document.getElementById('closeOutfitModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetailModal());
        }

        const modal = document.getElementById('outfitDetailModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeDetailModal();
                }
            });
        }
    },

    renderOutfits() {
        const grid = document.getElementById('outfitsGrid');
        if (!grid) return;

        const outfits = DataManager.getOutfits();

        if (outfits.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <i class="fas fa-layer-group"></i>
                    <h3>Nog geen outfits</h3>
                    <p>Maak je eerste outfit!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = outfits.map(outfit => this.createOutfitCard(outfit)).join('');

        // Bind click events
        grid.querySelectorAll('.outfit-card').forEach(card => {
            card.addEventListener('click', () => this.showOutfitDetail(card.dataset.id));
        });
    },

    createOutfitCard(outfit) {
        const items = this.getOutfitItems(outfit);
        
        // Create preview grid with up to 4 items
        const previewItems = [];
        ['tops', 'bottoms', 'shoes', 'outerwear'].forEach(category => {
            const item = items[category];
            if (item) {
                if (item.image) {
                    previewItems.push(`<img src="${item.image}" alt="${item.name}">`);
                } else {
                    previewItems.push(`<div class="placeholder"><i class="fas ${item.icon || 'fa-tshirt'}"></i></div>`);
                }
            } else {
                previewItems.push(`<div class="placeholder"></div>`);
            }
        });

        const date = new Date(outfit.dateCreated);
        const dateStr = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

        return `
            <div class="outfit-card" data-id="${outfit.id}">
                <div class="outfit-card-preview">
                    ${previewItems.join('')}
                </div>
                <div class="outfit-card-info">
                    <h4>${outfit.name}</h4>
                    <span>${dateStr} • ${this.getOccasionLabel(outfit.occasion)}</span>
                </div>
            </div>
        `;
    },

    getOutfitItems(outfit) {
        const items = {};
        if (outfit.items) {
            for (const [category, itemId] of Object.entries(outfit.items)) {
                if (itemId) {
                    items[category] = DataManager.getClothingById(itemId);
                }
            }
        }
        return items;
    },

    showOutfitDetail(outfitId) {
        const outfit = DataManager.getOutfitById(outfitId);
        if (!outfit) return;

        const modal = document.getElementById('outfitDetailModal');
        const title = document.getElementById('outfitDetailTitle');
        const content = document.getElementById('outfitDetailContent');

        title.textContent = outfit.name;

        const items = this.getOutfitItems(outfit);
        const itemsHtml = Object.entries(items)
            .filter(([_, item]) => item)
            .map(([category, item]) => {
                const imageContent = item.image 
                    ? `<img src="${item.image}" alt="${item.name}">`
                    : `<div style="width:80px;height:80px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;border-radius:8px;"><i class="fas ${item.icon || 'fa-tshirt'}" style="font-size:2rem;color:#bbb;"></i></div>`;
                
                return `
                    <div class="outfit-detail-item">
                        ${imageContent}
                        <div>
                            <h4>${item.name}</h4>
                            <span>${WardrobeManager.getCategoryLabel(category)}</span>
                        </div>
                    </div>
                `;
            }).join('');

        content.innerHTML = `
            <div class="outfit-detail-items">
                ${itemsHtml}
            </div>
            <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;">
                <button class="btn-secondary" onclick="OutfitsManager.deleteOutfit('${outfit.id}')">
                    <i class="fas fa-trash"></i> Verwijderen
                </button>
                <button class="btn-primary" onclick="OutfitsManager.wearOutfit('${outfit.id}')">
                    <i class="fas fa-check"></i> Draag Vandaag
                </button>
            </div>
        `;

        modal.classList.add('active');
    },

    closeDetailModal() {
        const modal = document.getElementById('outfitDetailModal');
        if (modal) {
            modal.classList.remove('active');
        }
    },

    deleteOutfit(outfitId) {
        if (confirm('Weet je zeker dat je dit outfit wilt verwijderen?')) {
            DataManager.deleteOutfit(outfitId);
            this.closeDetailModal();
            this.renderOutfits();
            WardrobeManager.showNotification('Outfit verwijderd');
        }
    },

    wearOutfit(outfitId) {
        const outfit = DataManager.getOutfitById(outfitId);
        if (outfit) {
            this.closeDetailModal();
            WardrobeManager.showNotification(`Veel plezier met "${outfit.name}"! 🎉`);
        }
    },

    navigateToSwipe() {
        // Navigate to swipe page
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === 'swipe');
        });
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === 'swipePage');
        });
    },

    getOccasionLabel(occasion) {
        const labels = {
            casual: 'Casual',
            work: 'Werk',
            sport: 'Sport',
            party: 'Feest',
            date: 'Date'
        };
        return labels[occasion] || occasion || 'Algemeen';
    },

    saveOutfit(name, items, occasion = 'casual') {
        const outfit = {
            name,
            items,
            occasion
        };
        DataManager.addOutfit(outfit);
        this.renderOutfits();
        return outfit;
    }
};

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', () => {
    OutfitsManager.init();
});
