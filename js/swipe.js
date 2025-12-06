// Swipe functionaliteit voor outfit builder - Verbeterde versie

const SwipeManager = {
    currentCategory: null,
    currentItems: [],
    currentIndex: 0,
    selectedItems: {
        outerwear: null,
        tops: null,
        bottoms: null,
        shoes: null
    },
    suggestedOutfit: null,

    init() {
        this.bindEvents();
        this.generateSmartSuggestion();
    },

    bindEvents() {
        // Category tabs
        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.addEventListener('click', () => this.selectCategory(tab.dataset.category));
        });

        // Swipe buttons
        const leftBtn = document.getElementById('swipeLeft');
        const rightBtn = document.getElementById('swipeRight');
        const skipBtn = document.getElementById('swipeSkip');
        
        if (leftBtn) leftBtn.addEventListener('click', () => this.swipe('left'));
        if (rightBtn) rightBtn.addEventListener('click', () => this.swipe('right'));
        if (skipBtn) skipBtn.addEventListener('click', () => this.skipCategory());

        // Save outfit button
        const saveBtn = document.getElementById('saveSwipeOutfit');
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveOutfit());

        // Reset button
        const resetBtn = document.getElementById('resetOutfitBtn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetOutfit());

        // Accept full outfit button
        const acceptBtn = document.getElementById('acceptFullOutfit');
        if (acceptBtn) acceptBtn.addEventListener('click', () => this.acceptFullSuggestion());

        // Customize button
        const customizeBtn = document.getElementById('customizeOutfit');
        if (customizeBtn) customizeBtn.addEventListener('click', () => this.startCustomizing());

        // Shuffle all button
        const shuffleBtn = document.getElementById('shuffleAllBtn');
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.shuffleAll());

        // Lookbook item clicks
        document.querySelectorAll('.lookbook-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.remove-item')) return;
                const category = item.dataset.slot;
                this.selectCategory(category);
            });
        });

        // Touch gestures
        this.initTouchGestures();

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('swipePage').classList.contains('active')) {
                if (e.key === 'ArrowLeft') this.swipe('left');
                if (e.key === 'ArrowRight') this.swipe('right');
                if (e.key === 'ArrowDown') this.skipCategory();
            }
        });
    },

    // Genereer slimme suggestie op basis van weer
    generateSmartSuggestion() {
        const allClothing = DataManager.getClothing();
        const weather = WeatherManager.getClothingRecommendation();
        const needsOuterwear = WeatherManager.needsOuterwear();
        
        // Score items op basis van weer en seizoen
        const scoreItem = (item) => {
            let score = Math.random() * 2; // Wat randomness
            
            // Weer matching
            if (weather === 'winter' && (item.season === 'winter' || item.season === 'all')) score += 3;
            if (weather === 'summer' && (item.season === 'summer' || item.season === 'all')) score += 3;
            if (weather === 'spring' && (item.season === 'spring' || item.season === 'all')) score += 2;
            
            // Favoriet bonus
            if (item.favorite) score += 1;
            
            // Minder gedragen items een kleine boost
            if (item.wearCount < 5) score += 0.5;
            
            return { ...item, score };
        };

        // Selecteer beste items per categorie
        const getBestItem = (category) => {
            const items = allClothing
                .filter(i => i.category === category)
                .map(scoreItem)
                .sort((a, b) => b.score - a.score);
            return items[0] || null;
        };

        this.suggestedOutfit = {
            outerwear: needsOuterwear ? getBestItem('outerwear') : null,
            tops: getBestItem('tops'),
            bottoms: getBestItem('bottoms'),
            shoes: getBestItem('shoes')
        };

        this.renderSuggestionBanner();
    },

    renderSuggestionBanner() {
        const banner = document.getElementById('outfitSuggestionBanner');
        const preview = document.getElementById('suggestionPreview');
        const weatherEl = document.getElementById('suggestionWeather');
        
        if (!banner || !preview) return;

        // Update weather text
        const temp = document.getElementById('weatherTemp')?.textContent || '15°C';
        const desc = document.getElementById('weatherDesc')?.textContent || 'Bewolkt';
        weatherEl.textContent = `${temp} - ${desc}`;

        // Render preview items
        const categories = ['outerwear', 'tops', 'bottoms', 'shoes'];
        const labels = { outerwear: 'Jas', tops: 'Top', bottoms: 'Broek', shoes: 'Schoenen' };
        
        let html = '';
        categories.forEach(cat => {
            const item = this.suggestedOutfit[cat];
            if (item) {
                html += `
                    <div class="suggestion-item">
                        <img src="${item.image || this.getPlaceholderImage(item)}" alt="${item.name}" 
                             onerror="this.src='${this.getPlaceholderImage(item)}'">
                        <span>${labels[cat]}</span>
                    </div>
                `;
            }
        });
        
        preview.innerHTML = html || '<p style="opacity:0.8;">Voeg eerst kleding toe aan je kast</p>';
    },

    acceptFullSuggestion() {
        // Neem hele outfit over
        Object.keys(this.suggestedOutfit).forEach(category => {
            const item = this.suggestedOutfit[category];
            if (item) {
                this.selectedItems[category] = item;
                this.updateMannequin(category, item);
                this.updateCategoryTab(category);
            }
        });

        // Verberg banner
        document.getElementById('outfitSuggestionBanner').classList.add('hidden');
        
        WardrobeManager.showNotification('Outfit overgenomen! 🎉');
    },

    startCustomizing() {
        // Verberg banner en start met eerste categorie
        document.getElementById('outfitSuggestionBanner').classList.add('hidden');
        
        // Start met tops (of outerwear als het koud is)
        const needsOuterwear = WeatherManager.needsOuterwear();
        this.selectCategory(needsOuterwear ? 'outerwear' : 'tops');
    },

    shuffleAll() {
        const allClothing = DataManager.getClothing();
        const categories = ['outerwear', 'tops', 'bottoms', 'shoes'];
        
        categories.forEach(category => {
            const items = allClothing.filter(i => i.category === category);
            if (items.length > 0) {
                const randomItem = items[Math.floor(Math.random() * items.length)];
                this.selectedItems[category] = randomItem;
                this.updateMannequin(category, randomItem);
                this.updateCategoryTab(category);
            }
        });

        WardrobeManager.showNotification('Nieuwe combinatie! 🎲');
    },

    resetOutfit() {
        // Reset all selected items
        this.selectedItems = {
            outerwear: null,
            tops: null,
            bottoms: null,
            shoes: null
        };

        // Icons and labels for each category
        const categoryInfo = {
            Outerwear: { icon: 'fa-vest', label: 'Jas' },
            Tops: { icon: 'fa-tshirt', label: 'Top' },
            Bottoms: { icon: 'fa-socks', label: 'Broek' },
            Shoes: { icon: 'fa-shoe-prints', label: 'Schoenen' }
        };

        // Reset flat-lay items
        ['Outerwear', 'Tops', 'Bottoms', 'Shoes'].forEach(cat => {
            const slot = document.getElementById(`mannequin${cat}`);
            if (slot) {
                slot.classList.remove('filled', 'active');
                const info = categoryInfo[cat];
                slot.innerHTML = `
                    <div class="item-empty">
                        <i class="fas ${info.icon}"></i>
                        <span>${info.label}</span>
                    </div>
                `;
            }
        });

        // Reset category tabs
        document.querySelectorAll('.cat-tab').forEach(tab => {
            tab.classList.remove('active', 'completed');
        });

        // Show suggestion banner again
        const banner = document.getElementById('outfitSuggestionBanner');
        if (banner) banner.classList.remove('hidden');
        this.generateSmartSuggestion();

        // Hide swipe card
        document.getElementById('swipeCard').style.display = 'none';
        document.getElementById('swipeActions').style.display = 'none';
        document.getElementById('swipeInstructions').style.display = 'block';
        document.getElementById('swipeInstructions').innerHTML = `
            <i class="fas fa-hand-pointer"></i>
            <p>Kies een categorie hierboven om items te wisselen</p>
        `;
    },

    initTouchGestures() {
        const card = document.getElementById('swipeCard');
        if (!card) return;

        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let isDragging = false;

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            card.style.transition = 'none';
        });

        card.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            const rotation = diff * 0.1;
            card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;
            
            // Visual feedback
            if (diff > 50) {
                card.style.boxShadow = '0 0 20px rgba(253, 121, 168, 0.5)';
            } else if (diff < -50) {
                card.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.3)';
            } else {
                card.style.boxShadow = '';
            }
        });

        card.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            card.style.transition = 'transform 0.3s ease';
            
            const diff = currentX - startX;
            
            if (diff > 100) {
                this.swipe('right');
            } else if (diff < -100) {
                this.swipe('left');
            } else {
                card.style.transform = '';
                card.style.boxShadow = '';
            }
        });
    },

    selectCategory(category) {
        if (!category) return;

        this.currentCategory = category;
        this.currentItems = DataManager.getClothingByCategory(category);
        this.currentIndex = 0;

        // Update tab states
        document.querySelectorAll('.cat-tab').forEach(tab => {
            const tabCat = tab.dataset.category;
            tab.classList.remove('active');
            
            if (tabCat === category) {
                tab.classList.add('active');
            }
            
            // Mark completed categories
            if (this.selectedItems[tabCat]) {
                tab.classList.add('completed');
            }
        });

        // Highlight lookbook item
        document.querySelectorAll('.lookbook-item').forEach(item => {
            item.classList.toggle('active', item.dataset.slot === category);
        });

        // Show swipe card
        if (this.currentItems.length > 0) {
            document.getElementById('swipeInstructions').style.display = 'none';
            document.getElementById('swipeCard').style.display = 'block';
            document.getElementById('swipeActions').style.display = 'flex';
            this.showCurrentItem();
        } else {
            this.showEmpty();
        }
    },

    showCurrentItem() {
        const item = this.currentItems[this.currentIndex];
        if (!item) {
            this.showEmpty();
            return;
        }

        const card = document.getElementById('swipeCard');
        const imageEl = document.getElementById('swipeImage');
        const nameEl = document.getElementById('swipeItemName');
        const detailsEl = document.getElementById('swipeItemDetails');
        const counterEl = document.getElementById('cardCounter');

        // Set image with fallback
        if (item.image) {
            imageEl.src = item.image;
            imageEl.onerror = () => {
                imageEl.src = this.getPlaceholderImage(item);
            };
        } else {
            imageEl.src = this.getPlaceholderImage(item);
        }

        nameEl.textContent = item.name;
        detailsEl.textContent = `${WardrobeManager.getColorLabel(item.color)} • ${this.getStyleLabel(item.style)}`;
        counterEl.textContent = `${this.currentIndex + 1}/${this.currentItems.length}`;

        // Reset card position
        card.style.transform = '';
        card.style.boxShadow = '';
        card.classList.remove('swiping-left', 'swiping-right');
    },

    getPlaceholderImage(item) {
        // Generate SVG placeholder with item info
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
        
        // Create SVG placeholder
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="300" height="350" viewBox="0 0 300 350">
                <rect fill="${bgColor}" width="300" height="350"/>
                <text fill="${textColor}" font-family="Arial,sans-serif" font-size="14" text-anchor="middle" x="150" y="170">${item.name}</text>
                <text fill="${textColor}" font-family="Arial,sans-serif" font-size="12" text-anchor="middle" x="150" y="195" opacity="0.7">${item.brand || ''}</text>
            </svg>
        `;
        return `data:image/svg+xml,${encodeURIComponent(svg.trim())}`;
    },

    showEmpty() {
        document.getElementById('swipeCard').style.display = 'none';
        document.getElementById('swipeActions').style.display = 'none';
        
        const instructions = document.getElementById('swipeInstructions');
        instructions.style.display = 'block';
        instructions.innerHTML = `
            <i class="fas fa-box-open"></i>
            <p>Geen items in deze categorie.<br>Voeg eerst kleding toe!</p>
        `;
    },

    swipe(direction) {
        if (!this.currentCategory || this.currentItems.length === 0) return;

        const card = document.getElementById('swipeCard');
        card.classList.add(direction === 'right' ? 'swiping-right' : 'swiping-left');

        setTimeout(() => {
            if (direction === 'right') {
                // Like - add to outfit
                const item = this.currentItems[this.currentIndex];
                this.addToOutfit(item);
                
                // Auto-advance to next category
                this.autoAdvanceCategory();
            } else {
                // Dislike - go to next item
                this.currentIndex++;
                if (this.currentIndex >= this.currentItems.length) {
                    this.currentIndex = 0; // Loop back
                }
                
                card.classList.remove('swiping-right', 'swiping-left');
                this.showCurrentItem();
            }
        }, 300);
    },

    skipCategory() {
        this.autoAdvanceCategory();
    },

    autoAdvanceCategory() {
        const categories = ['outerwear', 'tops', 'bottoms', 'shoes'];
        const currentIdx = categories.indexOf(this.currentCategory);
        
        // Find next unfilled category
        for (let i = 1; i <= categories.length; i++) {
            const nextIdx = (currentIdx + i) % categories.length;
            const nextCat = categories[nextIdx];
            
            if (!this.selectedItems[nextCat]) {
                this.selectCategory(nextCat);
                return;
            }
        }
        
        // All filled - show completion message
        WardrobeManager.showNotification('Outfit compleet! 🎉');
        document.getElementById('swipeCard').style.display = 'none';
        document.getElementById('swipeActions').style.display = 'none';
        document.getElementById('swipeInstructions').style.display = 'block';
        document.getElementById('swipeInstructions').innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
            <p>Je outfit is compleet!<br>Klik op "Outfit Opslaan" of klik op een item om te wijzigen.</p>
        `;
    },

    addToOutfit(item) {
        this.selectedItems[this.currentCategory] = item;
        this.updateMannequin(this.currentCategory, item);
        this.updateCategoryTab(this.currentCategory);
        
        WardrobeManager.showNotification(`${item.name} toegevoegd! ✓`);
    },

    updateMannequin(category, item) {
        const slot = document.getElementById(`mannequin${this.capitalize(category)}`);
        if (!slot) return;

        slot.classList.add('filled');
        
        let imgSrc = item.image || this.getPlaceholderImage(item);
        
        slot.innerHTML = `
            <img src="${imgSrc}" alt="${item.name}" onerror="this.src='${this.getPlaceholderImage(item).replace(/'/g, "\\'")}'">
            <div class="item-label">${item.name}</div>
            <button class="remove-item" onclick="SwipeManager.removeFromOutfit('${category}')">
                <i class="fas fa-times"></i>
            </button>
        `;
    },

    removeFromOutfit(category) {
        this.selectedItems[category] = null;
        
        // Icons and labels for each category
        const categoryInfo = {
            outerwear: { icon: 'fa-vest', label: 'Jas' },
            tops: { icon: 'fa-tshirt', label: 'Top' },
            bottoms: { icon: 'fa-socks', label: 'Broek' },
            shoes: { icon: 'fa-shoe-prints', label: 'Schoenen' }
        };
        
        const slot = document.getElementById(`mannequin${this.capitalize(category)}`);
        if (slot) {
            slot.classList.remove('filled', 'active');
            const info = categoryInfo[category];
            slot.innerHTML = `
                <div class="item-empty">
                    <i class="fas ${info.icon}"></i>
                    <span>${info.label}</span>
                </div>
            `;
        }

        // Update tab
        const tab = document.querySelector(`.cat-tab[data-category="${category}"]`);
        if (tab) tab.classList.remove('completed');

        WardrobeManager.showNotification('Item verwijderd');
    },

    updateCategoryTab(category) {
        const tab = document.querySelector(`.cat-tab[data-category="${category}"]`);
        if (tab) {
            tab.classList.remove('active');
            tab.classList.add('completed');
        }
    },

    saveOutfit() {
        // Check if at least 2 items selected
        const filledCount = Object.values(this.selectedItems).filter(item => item !== null).length;
        
        if (filledCount < 2) {
            WardrobeManager.showNotification('Selecteer minimaal 2 items! 👕👖');
            return;
        }

        // Prompt for name
        const name = prompt('Geef je outfit een naam:', 'Mijn Outfit');
        if (!name) return;

        // Create outfit with item IDs
        const items = {};
        for (const [category, item] of Object.entries(this.selectedItems)) {
            items[category] = item ? item.id : null;
        }

        OutfitsManager.saveOutfit(name, items);
        WardrobeManager.showNotification(`"${name}" opgeslagen! 🎉`);
        
        // Reset for new outfit
        this.resetOutfit();
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    getStyleLabel(style) {
        const labels = {
            casual: 'Casual',
            formal: 'Formeel',
            sport: 'Sport',
            elegant: 'Elegant'
        };
        return labels[style] || style;
    }
};

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', () => {
    SwipeManager.init();
});
