/**
 * StyleMate - Today Page Manager
 * Handles daily outfit suggestions based on weather
 */

const TodayManager = {
    weather: null,
    currentOutfit: {
        outerwear: null,
        top: null,
        bottom: null,
        shoes: null
    },

    async init() {
        console.log('📅 TodayManager initialiseren...');
        
        // Load weather
        await this.loadWeather();
        
        // Load or generate today's outfit
        this.loadTodayOutfit();
        
        // Setup event listeners
        this.setupEventListeners();
    },

    async loadWeather() {
        try {
            this.weather = await WeatherManager.getWeather();
            this.updateWeatherUI();
        } catch (error) {
            console.error('Weather laden mislukt:', error);
            // Use default weather
            this.weather = {
                temp: 18,
                feels: 17,
                desc: 'Bewolkt',
                icon: '☁️',
                advice: 'Neem een jas mee voor de zekerheid',
                condition: 'cloudy'
            };
            this.updateWeatherUI();
        }
    },

    updateWeatherUI() {
        const iconEl = document.querySelector('.weather-icon');
        const tempValueEl = document.querySelector('.temp-value');
        const weatherDescEl = document.querySelector('.weather-desc');
        const weatherFeelsEl = document.querySelector('.weather-feels');
        const adviceEl = document.querySelector('.weather-advice span');
        
        // Weather icon is Font Awesome, so we update the class based on condition
        if (iconEl && this.weather.condition) {
            const iconMap = {
                sunny: 'fa-sun',
                cloudy: 'fa-cloud',
                rainy: 'fa-cloud-rain',
                'partly-cloudy': 'fa-cloud-sun',
                cold: 'fa-snowflake'
            };
            iconEl.className = `fas ${iconMap[this.weather.condition] || 'fa-cloud-sun'} weather-icon`;
        }
        if (tempValueEl) tempValueEl.textContent = this.weather.temp;
        if (weatherDescEl) weatherDescEl.textContent = this.weather.desc;
        if (weatherFeelsEl) weatherFeelsEl.textContent = `Voelt als ${this.weather.feels}°`;
        if (adviceEl) adviceEl.textContent = this.weather.advice;
        
        // Update greeting based on time
        const greeting = document.querySelector('.greeting-section h1');
        if (greeting) {
            const hour = new Date().getHours();
            let greet = 'Goedemorgen!';
            if (hour >= 12 && hour < 18) greet = 'Goedemiddag!';
            else if (hour >= 18) greet = 'Goedenavond!';
            greeting.textContent = greet;
        }
        
        // Update date
        const dateLabel = document.querySelector('.date-label');
        if (dateLabel) {
            const options = { weekday: 'long', day: 'numeric', month: 'long' };
            dateLabel.textContent = new Date().toLocaleDateString('nl-NL', options);
        }
    },

    loadTodayOutfit() {
        // Check if we have a saved outfit for today
        const savedOutfit = DataManager.getTodayOutfit();
        
        if (savedOutfit) {
            this.currentOutfit = savedOutfit;
            this.updateOutfitUI();
        } else {
            // Generate new outfit suggestion
            this.generateOutfit();
        }
    },

    generateOutfit() {
        const wardrobe = DataManager.getWardrobe();
        
        if (wardrobe.length === 0) {
            this.showEmptyWardrobe();
            return;
        }
        
        // Get weather-appropriate recommendations
        const recommendations = WeatherManager.getRecommendation(this.weather);
        
        // Filter wardrobe by category
        const categories = {
            outerwear: wardrobe.filter(item => item.category === 'outerwear'),
            tops: wardrobe.filter(item => item.category === 'tops'),
            bottoms: wardrobe.filter(item => item.category === 'bottoms'),
            shoes: wardrobe.filter(item => item.category === 'shoes')
        };
        
        // Select random items from each category
        this.currentOutfit = {
            outerwear: this.weather.temp < 18 ? this.getRandomItem(categories.outerwear) : null,
            top: this.getRandomItem(categories.tops),
            bottom: this.getRandomItem(categories.bottoms),
            shoes: this.getRandomItem(categories.shoes)
        };
        
        // Save today's outfit
        DataManager.saveTodayOutfit(this.currentOutfit);
        
        // Update UI
        this.updateOutfitUI();
        
        // Check for missing items
        this.checkMissingItems();
    },

    getRandomItem(items) {
        if (!items || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    },

    updateOutfitUI() {
        const layers = {
            outerwear: document.querySelector('.outfit-layer.outerwear'),
            top: document.querySelector('.outfit-layer.top'),
            bottom: document.querySelector('.outfit-layer.bottom'),
            shoes: document.querySelector('.outfit-layer.shoes')
        };
        
        Object.entries(layers).forEach(([key, element]) => {
            if (!element) return;
            
            const item = this.currentOutfit[key];
            
            if (item && item.image) {
                element.classList.add('filled');
                element.innerHTML = `<img src="${item.image}" alt="${item.name || key}">`;
            } else {
                element.classList.remove('filled');
                const icons = {
                    outerwear: 'fa-vest',
                    top: 'fa-shirt',
                    bottom: 'fa-person',
                    shoes: 'fa-shoe-prints'
                };
                const names = {
                    outerwear: 'Jas',
                    top: 'Bovenstuk',
                    bottom: 'Onderstuk',
                    shoes: 'Schoenen'
                };
                element.innerHTML = `
                    <div class="layer-placeholder">
                        <i class="fas ${icons[key]}"></i>
                        <span>${names[key]}</span>
                    </div>
                `;
            }
        });
    },

    checkMissingItems() {
        const wardrobe = DataManager.getWardrobe();
        const categories = ['tops', 'bottoms', 'shoes'];
        const missing = categories.filter(cat => 
            !wardrobe.some(item => item.category === cat)
        );
        
        const alertEl = document.querySelector('.missing-alert');
        if (alertEl) {
            if (missing.length > 0) {
                alertEl.classList.remove('hidden');
                const textEl = alertEl.querySelector('.alert-text span');
                if (textEl) {
                    textEl.textContent = `Je mist: ${missing.join(', ')}`;
                }
            } else {
                alertEl.classList.add('hidden');
            }
        }
    },

    showEmptyWardrobe() {
        const outfitDisplay = document.querySelector('.outfit-display');
        if (outfitDisplay) {
            outfitDisplay.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 40px;">
                    <i class="fas fa-shirt" style="font-size: 3rem; color: var(--gray-300); margin-bottom: 16px;"></i>
                    <h3 style="margin-bottom: 8px;">Je kast is nog leeg</h3>
                    <p style="color: var(--gray-500); margin-bottom: 20px;">Voeg kleding toe om outfits te krijgen</p>
                    <button onclick="App.showAddClothingModal()" class="btn-primary">
                        <i class="fas fa-plus"></i> Kleding toevoegen
                    </button>
                </div>
            `;
        }
    },

    setupEventListeners() {
        // Shuffle button
        const shuffleBtn = document.querySelector('.btn-action.shuffle');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.shuffleOutfit());
        }
        
        // Accept button
        const acceptBtn = document.querySelector('.btn-action.accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.acceptOutfit());
        }
        
        // Refresh button
        const refreshBtn = document.querySelector('.btn-refresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.shuffleOutfit());
        }
        
        // Outfit layer clicks - open swipe
        document.querySelectorAll('.outfit-layer').forEach(layer => {
            layer.addEventListener('click', () => {
                const category = layer.classList[1]; // outerwear, top, bottom, shoes
                const categoryMap = {
                    outerwear: 'outerwear',
                    top: 'tops',
                    bottom: 'bottoms',
                    shoes: 'shoes'
                };
                
                if (App.openSwipeForCategory) {
                    App.openSwipeForCategory(categoryMap[category], 'wardrobe');
                }
            });
        });
        
        // Shop suggest button
        const shopSuggestBtn = document.querySelector('.btn-shop-suggest');
        if (shopSuggestBtn) {
            shopSuggestBtn.addEventListener('click', () => {
                App.showPage('shop');
            });
        }
    },

    shuffleOutfit() {
        // Animate shuffle
        const outfitDisplay = document.querySelector('.outfit-display');
        if (outfitDisplay) {
            outfitDisplay.style.transform = 'scale(0.95)';
            outfitDisplay.style.opacity = '0.5';
            
            setTimeout(() => {
                this.generateOutfit();
                outfitDisplay.style.transform = 'scale(1)';
                outfitDisplay.style.opacity = '1';
            }, 200);
        } else {
            this.generateOutfit();
        }
    },

    acceptOutfit() {
        // Save outfit to saved outfits and history
        const outfit = { ...this.currentOutfit, savedAt: new Date().toISOString() };
        DataManager.saveOutfit(outfit);
        DataManager.addToHistory(outfit);
        
        // Show success
        App.showSuccess('Outfit opgeslagen! 🎉', 'Je outfit staat nu bij je opgeslagen looks');
    },

    // Called when switching to today page
    refresh() {
        this.loadWeather();
        this.loadTodayOutfit();
    },

    // Update outfit slot with new item (called from swipe)
    updateSlot(category, item) {
        const categoryMap = {
            tops: 'top',
            bottoms: 'bottom',
            outerwear: 'outerwear',
            shoes: 'shoes'
        };
        
        const slot = categoryMap[category] || category;
        this.currentOutfit[slot] = item;
        DataManager.saveTodayOutfit(this.currentOutfit);
        this.updateOutfitUI();
    }
};

// Export
window.TodayManager = TodayManager;
