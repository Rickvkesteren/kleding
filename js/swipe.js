/**
 * StyleMate - Swipe Manager
 * Handles Tinder-style swiping for items and sets
 */

const SwipeManager = {
    currentCategory: null,
    currentSource: 'wardrobe', // 'wardrobe' or 'shop'
    items: [],
    currentIndex: 0,
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    threshold: 100,

    init() {
        console.log('👆 SwipeManager initialiseren...');
        this.setupEventListeners();
    },

    startSwipe(category, source = 'wardrobe') {
        this.currentCategory = category;
        this.currentSource = source;
        this.currentIndex = 0;
        
        // Load items
        this.loadItems();
        
        // Update UI
        this.updateHeader();
        this.updateSourceTabs();
        this.renderCurrentCard();
    },

    loadItems() {
        if (this.currentSource === 'wardrobe') {
            const wardrobe = DataManager.getWardrobe();
            this.items = wardrobe.filter(item => 
                item.category === this.currentCategory
            );
        } else {
            // Load from shop
            this.items = ShopManager.items.filter(item => 
                item.category === this.currentCategory
            );
        }
    },

    updateHeader() {
        const categoryEl = document.querySelector('.swipe-category');
        const subtitleEl = document.querySelector('.swipe-subtitle');
        const progressEl = document.querySelector('.swipe-progress');
        
        const categoryNames = {
            tops: 'Bovenstukken',
            bottoms: 'Onderstukken',
            outerwear: 'Jassen',
            shoes: 'Schoenen',
            accessories: 'Accessoires'
        };
        
        if (categoryEl) categoryEl.textContent = categoryNames[this.currentCategory] || this.currentCategory;
        if (subtitleEl) subtitleEl.textContent = this.currentSource === 'wardrobe' ? 'Kies uit je kast' : 'Kies uit de shop';
        if (progressEl) progressEl.textContent = `${this.currentIndex + 1}/${this.items.length}`;
    },

    updateSourceTabs() {
        document.querySelectorAll('.source-tab').forEach(tab => {
            const isActive = tab.dataset.source === this.currentSource;
            tab.classList.toggle('active', isActive);
        });
    },

    renderCurrentCard() {
        const card = document.getElementById('mainSwipeCard');
        const cardImage = document.getElementById('swipeCardImage');
        const cardName = document.getElementById('swipeCardName');
        const cardDetails = document.getElementById('swipeCardDetails');
        const cardBadge = document.getElementById('swipeCardBadge');
        const cardPrice = document.getElementById('swipeCardPrice');
        const emptyState = document.getElementById('swipeEmpty');
        const actionsEl = document.querySelector('.swipe-actions');
        const shopCta = document.getElementById('shopCta');
        
        // Check if we have items left
        if (this.currentIndex >= this.items.length || this.items.length === 0) {
            if (card) card.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            if (actionsEl) actionsEl.style.display = 'none';
            if (shopCta) shopCta.style.display = 'none';
            return;
        }
        
        const item = this.items[this.currentIndex];
        
        // Show elements
        if (card) card.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (actionsEl) actionsEl.style.display = 'flex';
        
        // Update card content
        if (cardImage) cardImage.src = item.image;
        if (cardName) cardName.textContent = item.name;
        if (cardDetails) cardDetails.textContent = item.color || item.brand || '';
        
        const isShop = this.currentSource === 'shop';
        
        // Update badge
        if (cardBadge) {
            cardBadge.innerHTML = isShop 
                ? '<i class="fas fa-shopping-bag"></i> Shop'
                : '<i class="fas fa-home"></i> Eigen';
            cardBadge.className = isShop ? 'card-badge shop' : 'card-badge';
        }
        
        // Update price (only for shop items)
        if (cardPrice) {
            if (isShop && item.price) {
                cardPrice.style.display = 'flex';
                cardPrice.innerHTML = `
                    <span class="price">€${item.price.toFixed(2)}</span>
                    ${item.originalPrice ? `<span class="original-price">€${item.originalPrice.toFixed(2)}</span>` : ''}
                `;
            } else {
                cardPrice.style.display = 'none';
            }
        }
        
        // Show shop CTA for shop items
        if (shopCta) shopCta.style.display = isShop ? 'block' : 'none';
        
        // Update progress
        const progressEl = document.querySelector('.swipe-progress');
        if (progressEl) progressEl.textContent = `${this.currentIndex + 1}/${this.items.length}`;
        
        // Setup drag events for the card
        this.setupCardDrag();
    },

    setupEventListeners() {
        // Source tabs
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentSource = tab.dataset.source;
                this.currentIndex = 0;
                this.loadItems();
                this.updateSourceTabs();
                this.updateHeader();
                this.renderCurrentCard();
            });
        });
        
        // Swipe buttons
        const nopeBtn = document.getElementById('btnSwipeLeft');
        const likeBtn = document.getElementById('btnSwipeRight');
        const undoBtn = document.getElementById('btnUndo');
        
        if (nopeBtn) {
            nopeBtn.addEventListener('click', () => this.handleSwipe('left'));
        }
        
        if (likeBtn) {
            likeBtn.addEventListener('click', () => this.handleSwipe('right'));
        }
        
        if (undoBtn) {
            undoBtn.addEventListener('click', () => this.handleUndo());
        }
        
        // Back button
        const backBtn = document.querySelector('.swipe-header .btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => App.showPage('today'));
        }
    },

    setupCardDrag() {
        const card = document.getElementById('mainSwipeCard');
        if (!card) return;
        
        // Remove existing listeners
        card.replaceWith(card.cloneNode(true));
        const newCard = document.getElementById('mainSwipeCard');
        
        // Touch events
        newCard.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: true });
        newCard.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: true });
        newCard.addEventListener('touchend', (e) => this.handleDragEnd(e));
        
        // Mouse events
        newCard.addEventListener('mousedown', (e) => this.handleDragStart(e));
    },

    handleDragStart(e) {
        const card = document.getElementById('mainSwipeCard');
        if (!card) return;
        
        this.isDragging = true;
        this.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        this.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        card.style.transition = 'none';
    },

    handleDragMove(e) {
        if (!this.isDragging) return;
        
        const card = document.getElementById('mainSwipeCard');
        if (!card) return;
        
        this.currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const diffX = this.currentX - this.startX;
        const diffY = currentY - this.startY;
        
        // Only horizontal movement
        if (Math.abs(diffX) > Math.abs(diffY)) {
            const rotation = diffX * 0.05;
            card.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
            
            // Show overlays
            if (diffX > 50) {
                card.classList.add('swiping-right');
                card.classList.remove('swiping-left');
            } else if (diffX < -50) {
                card.classList.add('swiping-left');
                card.classList.remove('swiping-right');
            } else {
                card.classList.remove('swiping-left', 'swiping-right');
            }
        }
    },

    handleDragEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        
        const card = document.getElementById('mainSwipeCard');
        if (!card) return;
        
        const diffX = this.currentX - this.startX;
        
        card.style.transition = 'transform 0.3s ease';
        
        if (diffX > this.threshold) {
            // Swipe right - like
            this.handleSwipe('right');
        } else if (diffX < -this.threshold) {
            // Swipe left - nope
            this.handleSwipe('left');
        } else {
            // Reset position
            card.style.transform = '';
            card.classList.remove('swiping-left', 'swiping-right');
        }
    },

    handleSwipe(direction) {
        const card = document.getElementById('mainSwipeCard');
        if (!card) return;
        
        const item = this.items[this.currentIndex];
        
        if (direction === 'right') {
            // Animate card out to right
            card.classList.add('animating-right');
            
            setTimeout(() => {
                // Select this item for today's outfit
                if (TodayManager && item) {
                    TodayManager.updateSlot(this.currentCategory, item);
                }
                
                // Reset card and go back to today page
                card.classList.remove('animating-right');
                card.style.transform = '';
                App.showPage('today');
            }, 400);
        } else {
            // Animate card out to left
            card.classList.add('animating-left');
            
            setTimeout(() => {
                // Reset card
                card.classList.remove('animating-left');
                card.style.transform = '';
                
                // Move to next item
                this.currentIndex++;
                this.renderCurrentCard();
            }, 300);
        }
    },

    handleUndo() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCurrentCard();
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SwipeManager.init();
});

// Export
window.SwipeManager = SwipeManager;
