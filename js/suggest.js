// Outfit suggestie systeem - Unified Mix & Match Version

const SuggestManager = {
    // State
    currentCategory: 'tops',
    sourceFilter: 'all', // 'all', 'own', 'shop'
    currentOutfit: {
        tops: null,
        bottoms: null,
        shoes: null,
        outerwear: null
    },
    swipeItems: [],
    swipeIndex: 0,
    
    // Webshop URL - Pas dit aan naar je eigen webshop
    WEBSHOP_URL: 'https://jouw-webshop.nl/product/',

    init() {
        this.bindEvents();
        this.updateWeatherContext();
        this.generateInstantOutfit();
        this.loadCategoryItems('tops');
        this.renderTrends();
        this.renderQuickShopSuggestions();
    },

    bindEvents() {
        // Source toggle (Alles/Eigen/Shop)
        document.querySelectorAll('.source-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setSourceFilter(btn.dataset.source));
        });

        // Category pills
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.addEventListener('click', () => this.selectCategory(pill.dataset.category));
        });

        // Outfit slots
        document.querySelectorAll('.outfit-slot').forEach(slot => {
            slot.addEventListener('click', () => this.selectCategory(slot.dataset.cat));
        });

        // Swipe buttons
        const swipeLeft = document.getElementById('suggestSwipeLeft');
        const swipeRight = document.getElementById('suggestSwipeRight');
        const addToWardrobe = document.getElementById('suggestAddToWardrobe');
        
        if (swipeLeft) swipeLeft.addEventListener('click', () => this.swipe('left'));
        if (swipeRight) swipeRight.addEventListener('click', () => this.swipe('right'));
        if (addToWardrobe) addToWardrobe.addEventListener('click', () => this.addCurrentToWardrobe());

        // Shop now button
        const shopNowBtn = document.getElementById('shopNowBtn');
        if (shopNowBtn) shopNowBtn.addEventListener('click', () => this.openShopLink());

        // Outfit actions
        const shuffleBtn = document.getElementById('shuffleOutfitBtn');
        const saveBtn = document.getElementById('saveOutfitBtn');
        
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.shuffleOutfit());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveOutfit());

        // Touch gestures voor swipe card
        this.initTouchGestures();
    },

    // ===== WEATHER =====
    updateWeatherContext() {
        const temp = document.getElementById('weatherTemp')?.textContent || '12°C';
        const desc = document.getElementById('weatherDesc')?.textContent || 'Bewolkt';
        
        const suggestTemp = document.getElementById('suggestWeatherTemp');
        const suggestDesc = document.getElementById('suggestWeatherDesc');
        
        if (suggestTemp) suggestTemp.textContent = temp;
        if (suggestDesc) suggestDesc.textContent = desc;
    },

    // ===== SOURCE FILTER =====
    setSourceFilter(source) {
        this.sourceFilter = source;
        
        document.querySelectorAll('.source-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.source === source);
        });
        
        this.loadCategoryItems(this.currentCategory);
    },

    // ===== CATEGORY SELECTION =====
    selectCategory(category) {
        this.currentCategory = category;
        
        // Update pills
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.classList.toggle('active', pill.dataset.category === category);
        });
        
        // Update outfit slots
        document.querySelectorAll('.outfit-slot').forEach(slot => {
            slot.classList.toggle('active', slot.dataset.cat === category);
        });
        
        this.loadCategoryItems(category);
    },

    // ===== LOAD ITEMS =====
    loadCategoryItems(category) {
        const ownItems = DataManager.getClothingByCategory(category);
        const shopItems = TrendsData.getShoppingItems().filter(item => item.category === category);
        
        let items = [];
        
        if (this.sourceFilter === 'all') {
            // Mix eigen items met shop items
            items = this.mixItems(ownItems, shopItems);
        } else if (this.sourceFilter === 'own') {
            items = ownItems.map(item => ({ ...item, isOwn: true }));
        } else {
            items = shopItems.map(item => ({ ...item, isOwn: false }));
        }
        
        this.swipeItems = items;
        this.swipeIndex = 0;
        this.showCurrentSwipeItem();
    },

    // Mix eigen en shop items door elkaar
    mixItems(ownItems, shopItems) {
        const mixed = [];
        const ownMapped = ownItems.map(item => ({ ...item, isOwn: true }));
        const shopMapped = shopItems.map(item => ({ ...item, isOwn: false }));
        
        // Afwisselend toevoegen
        const maxLen = Math.max(ownMapped.length, shopMapped.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < ownMapped.length) mixed.push(ownMapped[i]);
            if (i < shopMapped.length) mixed.push(shopMapped[i]);
        }
        
        return mixed;
    },

    // ===== SWIPE CARD =====
    showCurrentSwipeItem() {
        const card = document.getElementById('suggestSwipeCard');
        if (!card) return;
        
        if (this.swipeItems.length === 0) {
            card.style.display = 'none';
            return;
        }
        
        card.style.display = 'block';
        const item = this.swipeItems[this.swipeIndex];
        
        // Update card content
        const image = document.getElementById('suggestSwipeImage');
        const name = document.getElementById('suggestItemName');
        const details = document.getElementById('suggestItemDetails');
        const badge = document.getElementById('suggestCardBadge');
        const priceRow = document.getElementById('suggestPriceRow');
        const price = document.getElementById('suggestItemPrice');
        const originalPrice = document.getElementById('suggestOriginalPrice');
        const counter = document.getElementById('suggestCardCounter');
        const shopCta = document.getElementById('shopCtaBar');
        const addBtn = document.getElementById('suggestAddToWardrobe');
        
        if (image) {
            image.src = item.image || this.getPlaceholder(item);
            image.onerror = () => { image.src = this.getPlaceholder(item); };
        }
        
        if (name) name.textContent = item.name;
        if (details) {
            const color = WardrobeManager?.getColorLabel(item.color) || item.color || '';
            const brand = item.brand || '';
            details.innerHTML = `<i class="fas fa-tag"></i> ${color}${brand ? ' • ' + brand : ''}`;
        }
        
        // Badge
        if (badge) {
            if (item.isOwn) {
                badge.className = 'card-badge own';
                badge.innerHTML = '<i class="fas fa-home"></i> Eigen';
            } else {
                badge.className = 'card-badge shop';
                badge.innerHTML = '<i class="fas fa-shopping-bag"></i> Shop';
            }
        }
        
        // Price (alleen voor shop items)
        if (priceRow) {
            if (!item.isOwn && item.price) {
                priceRow.style.display = 'flex';
                if (price) price.textContent = item.price;
                if (originalPrice) {
                    originalPrice.textContent = item.originalPrice || '';
                    originalPrice.style.display = item.originalPrice ? 'inline' : 'none';
                }
            } else {
                priceRow.style.display = 'none';
            }
        }
        
        // Counter
        if (counter) {
            counter.textContent = `${this.swipeIndex + 1}/${this.swipeItems.length}`;
        }
        
        // Shop CTA bar (alleen voor shop items)
        if (shopCta) {
            shopCta.style.display = !item.isOwn ? 'block' : 'none';
        }
        
        // "Ik heb dit al" button (alleen voor shop items)
        if (addBtn) {
            addBtn.style.display = !item.isOwn ? 'flex' : 'none';
        }
        
        // Animate card entrance
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9) translateY(20px)';
        
        requestAnimationFrame(() => {
            card.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            card.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
        });
    },

    getPlaceholder(item) {
        const colorMap = {
            white: '%23f5f5f5', black: '%232d3436', gray: '%23636e72',
            blue: '%230984e3', red: '%23d63031', green: '%2300b894',
            yellow: '%23fdcb6e', orange: '%23e17055', pink: '%23fd79a8',
            purple: '%236c5ce7', brown: '%238b4513', beige: '%23d4a574'
        };
        const bgColor = colorMap[item.color] || '%23dfe6e9';
        const textColor = ['white', 'yellow', 'beige'].includes(item.color) ? '%23333' : '%23fff';
        
        return `data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="350" viewBox="0 0 300 350">
                <rect fill="${bgColor}" width="300" height="350"/>
                <text fill="${textColor}" font-family="Arial" font-size="14" text-anchor="middle" x="150" y="170">${item.name}</text>
            </svg>
        `.trim())}`;
    },

    // ===== SWIPE ACTIONS =====
    swipe(direction) {
        const card = document.getElementById('suggestSwipeCard');
        if (!card || this.swipeItems.length === 0) return;
        
        card.classList.add(direction === 'right' ? 'swiping-right' : 'swiping-left');
        
        setTimeout(() => {
            if (direction === 'right') {
                // Like - add to outfit
                const item = this.swipeItems[this.swipeIndex];
                this.addToOutfit(item);
            }
            
            // Go to next item
            this.swipeIndex = (this.swipeIndex + 1) % this.swipeItems.length;
            card.classList.remove('swiping-right', 'swiping-left');
            this.showCurrentSwipeItem();
        }, 300);
    },

    addToOutfit(item) {
        this.currentOutfit[this.currentCategory] = item;
        this.updateOutfitPreview();
        this.updateColorHarmony();
        
        // Update category pill
        const pill = document.querySelector(`.cat-pill[data-category="${this.currentCategory}"]`);
        if (pill) pill.classList.add('completed');
        
        WardrobeManager?.showNotification(`${item.name} toegevoegd! ✓`);
        
        // Auto advance to next empty category
        this.autoAdvanceCategory();
    },

    updateOutfitPreview() {
        const categories = ['outerwear', 'tops', 'bottoms', 'shoes'];
        
        categories.forEach(cat => {
            const slot = document.getElementById(`preview${this.capitalize(cat)}`);
            if (!slot) return;
            
            const item = this.currentOutfit[cat];
            
            if (item) {
                slot.classList.add('filled');
                slot.classList.toggle('shop-item', !item.isOwn);
                slot.innerHTML = `
                    <img src="${item.image || this.getPlaceholder(item)}" alt="${item.name}">
                    <span class="slot-label">${item.isOwn ? '✓' : '🛒'}</span>
                `;
            } else {
                slot.classList.remove('filled', 'shop-item');
                const icons = { outerwear: 'fa-vest', tops: 'fa-tshirt', bottoms: 'fa-socks', shoes: 'fa-shoe-prints' };
                const labels = { outerwear: 'Jas', tops: 'Top', bottoms: 'Broek', shoes: 'Schoenen' };
                slot.innerHTML = `
                    <div class="slot-empty"><i class="fas ${icons[cat]}"></i></div>
                    <span class="slot-label">${labels[cat]}</span>
                `;
            }
        });
    },

    autoAdvanceCategory() {
        const categories = ['tops', 'bottoms', 'shoes', 'outerwear'];
        const currentIdx = categories.indexOf(this.currentCategory);
        
        for (let i = 1; i <= categories.length; i++) {
            const nextIdx = (currentIdx + i) % categories.length;
            const nextCat = categories[nextIdx];
            
            if (!this.currentOutfit[nextCat]) {
                this.selectCategory(nextCat);
                return;
            }
        }
        
        // All filled
        WardrobeManager?.showNotification('Outfit compleet! 🎉');
        this.triggerConfetti();
    },

    // ===== COLOR HARMONY =====
    updateColorHarmony() {
        const colors = [];
        const colorMap = {
            white: '#f5f5f5', black: '#2d3436', gray: '#636e72',
            blue: '#0984e3', red: '#d63031', green: '#00b894',
            yellow: '#fdcb6e', orange: '#e17055', pink: '#fd79a8',
            purple: '#6c5ce7', brown: '#8b4513', beige: '#d4a574'
        };
        
        Object.values(this.currentOutfit).forEach(item => {
            if (item && item.color) {
                colors.push(colorMap[item.color] || '#dfe6e9');
            }
        });
        
        const dotsContainer = document.getElementById('colorDots');
        const harmonyText = document.getElementById('harmonyText');
        const harmonyContainer = document.getElementById('colorHarmony');
        
        if (dotsContainer) {
            dotsContainer.innerHTML = colors.map(c => 
                `<div class="color-dot" style="background: ${c}"></div>`
            ).join('');
        }
        
        // Simple harmony check
        const isHarmonious = this.checkColorHarmony(colors);
        
        if (harmonyContainer) {
            harmonyContainer.classList.toggle('warning', !isHarmonious);
        }
        
        if (harmonyText) {
            harmonyText.innerHTML = isHarmonious 
                ? '<i class="fas fa-check-circle"></i> Kleuren matchen perfect!'
                : '<i class="fas fa-exclamation-circle"></i> Probeer een neutraal item';
        }
    },

    checkColorHarmony(colors) {
        // Simplified: if less than 4 colors or contains neutral, it's fine
        if (colors.length < 2) return true;
        
        const neutrals = ['#f5f5f5', '#2d3436', '#636e72', '#d4a574'];
        const hasNeutral = colors.some(c => neutrals.includes(c));
        
        if (hasNeutral) return true;
        
        // More than 3 non-neutral colors is busy
        const nonNeutrals = colors.filter(c => !neutrals.includes(c));
        return nonNeutrals.length <= 3;
    },

    // ===== "IK HEB DIT AL" =====
    addCurrentToWardrobe() {
        if (this.swipeItems.length === 0) return;
        
        const item = this.swipeItems[this.swipeIndex];
        if (item.isOwn) return;
        
        // Create new clothing item
        const newItem = {
            name: item.name,
            category: item.category,
            color: item.color || 'gray',
            style: item.style || 'casual',
            season: item.season || 'all',
            brand: item.brand || '',
            image: item.image
        };
        
        DataManager.addClothingItem(newItem);
        WardrobeManager?.showNotification(`${item.name} toegevoegd aan je kast! 🎉`);
        WardrobeManager?.renderClothing();
        
        // Mark as own in current list
        this.swipeItems[this.swipeIndex].isOwn = true;
        this.showCurrentSwipeItem();
    },

    // ===== SHOP LINK =====
    openShopLink() {
        if (this.swipeItems.length === 0) return;
        
        const item = this.swipeItems[this.swipeIndex];
        if (item.isOwn) return;
        
        const link = item.affiliateLink || this.generateShopLink(item);
        window.open(link, '_blank');
    },

    generateShopLink(item) {
        // Genereer link naar je webshop
        const affiliateLinks = {
            'H&M': 'https://www2.hm.com/nl_nl/index.html',
            'ZARA': 'https://www.zara.com/nl/',
            'UNIQLO': 'https://www.uniqlo.com/nl/nl/',
            "LEVI'S": 'https://www.levi.com/NL/nl_NL/',
            'VEJA': 'https://www.veja-store.com/nl/'
        };
        
        return affiliateLinks[item.brand] || 
               `${this.WEBSHOP_URL}?item=${encodeURIComponent(item.name)}`;
    },

    // ===== GENERATE INSTANT OUTFIT =====
    generateInstantOutfit() {
        const allClothing = DataManager.getClothing();
        const shopItems = TrendsData.getShoppingItems();
        const weather = WeatherManager?.getClothingRecommendation() || 'all';
        const needsOuterwear = WeatherManager?.needsOuterwear() || false;
        
        const categories = ['tops', 'bottoms', 'shoes'];
        if (needsOuterwear) categories.unshift('outerwear');
        
        categories.forEach(cat => {
            const ownItems = allClothing.filter(i => i.category === cat);
            
            if (ownItems.length > 0) {
                // Prefer own items
                const scored = ownItems.map(item => ({
                    ...item,
                    isOwn: true,
                    score: this.scoreItem(item, weather)
                })).sort((a, b) => b.score - a.score);
                
                this.currentOutfit[cat] = scored[0];
            } else {
                // Fallback to shop items
                const shopCatItems = shopItems.filter(i => i.category === cat);
                if (shopCatItems.length > 0) {
                    this.currentOutfit[cat] = { ...shopCatItems[0], isOwn: false };
                }
            }
        });
        
        this.updateOutfitPreview();
        this.updateColorHarmony();
    },

    scoreItem(item, weather) {
        let score = Math.random() * 2;
        
        if (item.season === weather || item.season === 'all') score += 3;
        if (item.favorite) score += 2;
        if ((item.wearCount || 0) < 5) score += 1;
        
        return score;
    },

    // ===== SHUFFLE =====
    shuffleOutfit() {
        this.currentOutfit = { tops: null, bottoms: null, shoes: null, outerwear: null };
        
        document.querySelectorAll('.cat-pill').forEach(pill => {
            pill.classList.remove('completed');
        });
        
        this.generateInstantOutfit();
        WardrobeManager?.showNotification('Nieuwe outfit! 🎲');
    },

    // ===== SAVE OUTFIT =====
    saveOutfit() {
        const filledCount = Object.values(this.currentOutfit).filter(i => i !== null).length;
        
        if (filledCount < 2) {
            WardrobeManager?.showNotification('Selecteer minimaal 2 items! 👕👖');
            return;
        }
        
        const name = prompt('Geef je outfit een naam:', 'Mijn Mix & Match');
        if (!name) return;
        
        // Check for shop items
        const hasShopItems = Object.values(this.currentOutfit).some(i => i && !i.isOwn);
        
        if (hasShopItems) {
            const shopItems = Object.values(this.currentOutfit).filter(i => i && !i.isOwn);
            const confirmShop = window.confirm(
                `Deze outfit bevat ${shopItems.length} shop item(s). ` +
                `Wil je deze bestellen via onze webshop?`
            );
            
            if (confirmShop) {
                this.openWebshopCart(shopItems);
            }
        }
        
        // Save outfit
        const items = {};
        for (const [cat, item] of Object.entries(this.currentOutfit)) {
            if (item && item.isOwn) {
                items[cat] = item.id;
            }
        }
        
        OutfitsManager?.saveOutfit(name, items);
        WardrobeManager?.showNotification(`"${name}" opgeslagen! 🎉`);
        this.triggerConfetti();
    },

    openWebshopCart(items) {
        // Open webshop met items in cart
        const itemNames = items.map(i => encodeURIComponent(i.name)).join(',');
        window.open(`${this.WEBSHOP_URL}cart?items=${itemNames}`, '_blank');
    },

    // ===== QUICK SHOP SUGGESTIONS =====
    renderQuickShopSuggestions() {
        const container = document.getElementById('quickShopScroll');
        if (!container) return;
        
        // Get items that complement current outfit
        const suggestions = this.getComplementarySuggestions();
        
        container.innerHTML = suggestions.map(item => `
            <div class="quick-shop-card" onclick="SuggestManager.openItemShop('${item.id || item.name}')">
                <span class="match-badge">Past erbij</span>
                <img src="${item.image}" alt="${item.name}" onerror="this.style.background='#f0f0f0'">
                <div class="quick-shop-card-info">
                    <h5>${item.name}</h5>
                    <span class="brand">${item.brand || ''}</span>
                    <span class="price">${item.price || ''}</span>
                </div>
            </div>
        `).join('');
    },

    getComplementarySuggestions() {
        const shopItems = TrendsData.getShoppingItems();
        const outfitColors = Object.values(this.currentOutfit)
            .filter(i => i && i.color)
            .map(i => i.color);
        
        // Find items with matching colors or accessories
        return shopItems
            .filter(item => 
                item.category === 'accessories' || 
                outfitColors.includes(item.color) ||
                ['white', 'black', 'gray', 'beige'].includes(item.color)
            )
            .slice(0, 8);
    },

    openItemShop(itemId) {
        const item = TrendsData.getShoppingItems().find(i => (i.id || i.name) === itemId);
        if (item) {
            const link = this.generateShopLink(item);
            window.open(link, '_blank');
        }
    },

    // ===== TRENDS =====
    renderTrends() {
        const container = document.getElementById('trendCards');
        if (!container) return;
        
        const trends = TrendsData.getTrends();
        
        container.innerHTML = trends.map(trend => `
            <div class="trend-card" onclick="SuggestManager.applyTrend('${trend.id}')">
                <div style="height:100px;background:linear-gradient(135deg, ${this.getTrendGradient(trend.colors)});display:flex;align-items:center;justify-content:center;">
                    <i class="fas ${trend.icon || 'fa-fire'}" style="font-size:2.5rem;color:white;"></i>
                </div>
                <div class="trend-card-info">
                    <h4>${trend.name}</h4>
                    <span>${trend.description}</span>
                </div>
            </div>
        `).join('');
    },

    getTrendGradient(colors) {
        const colorMap = {
            beige: '#f5f5dc', white: '#ffffff', gray: '#808080',
            black: '#2d3436', red: '#e74c3c', blue: '#3498db',
            yellow: '#f1c40f', green: '#27ae60', brown: '#8b4513'
        };
        
        if (!colors || colors.length === 0) return '#667eea, #764ba2';
        if (colors.length === 1) return `${colorMap[colors[0]] || '#667eea'}, ${colorMap[colors[0]] || '#764ba2'}`;
        
        return colors.slice(0, 2).map(c => colorMap[c] || '#667eea').join(', ');
    },

    applyTrend(trendId) {
        const trend = TrendsData.getTrendById(trendId);
        if (trend) {
            WardrobeManager?.showNotification(`${trend.name} trend toegepast! ✨`);
            this.shuffleOutfit();
        }
    },

    // ===== TOUCH GESTURES =====
    initTouchGestures() {
        const card = document.getElementById('suggestSwipeCard');
        if (!card) return;
        
        let startX = 0, currentX = 0, isDragging = false;
        
        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
            card.style.transition = 'none';
        }, { passive: true });
        
        card.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            const rotation = diff * 0.1;
            
            card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;
            
            if (diff > 50) {
                card.classList.add('swiping-right');
                card.classList.remove('swiping-left');
            } else if (diff < -50) {
                card.classList.add('swiping-left');
                card.classList.remove('swiping-right');
            } else {
                card.classList.remove('swiping-left', 'swiping-right');
            }
        }, { passive: true });
        
        card.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            
            card.style.transition = 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            const diff = currentX - startX;
            
            if (diff > 100) {
                this.swipe('right');
            } else if (diff < -100) {
                this.swipe('left');
            } else {
                card.style.transform = '';
                card.classList.remove('swiping-left', 'swiping-right');
            }
        });
    },

    // ===== CONFETTI =====
    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else {
            // Simple fallback confetti
            const container = document.createElement('div');
            container.className = 'confetti-container';
            container.innerHTML = Array(30).fill('').map(() => 
                `<div class="confetti-piece" style="
                    left: ${Math.random() * 100}%;
                    animation-delay: ${Math.random() * 0.5}s;
                    background: ${['#6366f1', '#f472b6', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)]};
                "></div>`
            ).join('');
            document.body.appendChild(container);
            setTimeout(() => container.remove(), 3000);
        }
    },

    // ===== UTILS =====
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
};

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    SuggestManager.init();
});
