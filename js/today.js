/**
 * StyleMate - Today Page Manager
 * Handles daily outfit suggestions based on weather
 */

const TodayManager = {
    weather: null,
    dayType: 'casual', // casual, work, sport, date, party
    currentOutfit: {
        outerwear: null,
        top: null,
        bottom: null,
        shoes: null
    },

    async init() {
        console.log('📅 TodayManager initialiseren...');
        
        // Load saved day type
        this.dayType = localStorage.getItem('dayType') || 'casual';
        
        // Load weather
        await this.loadWeather();
        
        // Load or generate today's outfit
        this.loadTodayOutfit();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup day type selector
        this.setupDayTypeSelector();
    },
    
    setupDayTypeSelector() {
        const buttons = document.querySelectorAll('.day-type-btn');
        buttons.forEach(btn => {
            // Set active state from saved preference
            btn.classList.toggle('active', btn.dataset.type === this.dayType);
            
            btn.addEventListener('click', () => {
                // Update active state
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Save and apply
                this.dayType = btn.dataset.type;
                localStorage.setItem('dayType', this.dayType);
                
                // Generate new outfit based on day type
                this.generateOutfit();
                
                // Show feedback
                if (typeof App !== 'undefined' && App.showSuccess) {
                    const labels = { casual: 'Thuis', work: 'Werk', sport: 'Sport', date: 'Date', party: 'Uitgaan' };
                    App.showSuccess(`${labels[this.dayType]} mode`, 'Outfit aangepast!');
                }
            });
        });
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
        
        // Show description with city if available
        if (weatherDescEl) {
            const cityText = this.weather.city ? ` in ${this.weather.city}` : '';
            weatherDescEl.textContent = `${this.weather.desc}${cityText}`;
        }
        
        // Show "feels like" with extra info
        if (weatherFeelsEl) {
            let feelsText = `Voelt als ${this.weather.feels}°`;
            if (this.weather.wind) feelsText += ` • Wind ${this.weather.wind} km/u`;
            weatherFeelsEl.textContent = feelsText;
        }
        
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
        
        // Load recent outfits
        this.loadRecentOutfits();
    },
    
    loadRecentOutfits() {
        const recentEl = document.getElementById('recentOutfits');
        if (!recentEl) return;
        
        const history = DataManager.getHistory();
        
        if (history.length === 0) {
            recentEl.innerHTML = `
                <div class="empty-recent" style="padding: 20px; text-align: center; color: var(--gray-400); font-size: 0.85rem; min-width: 200px;">
                    <i class="fas fa-clock" style="font-size: 1.5rem; margin-bottom: 8px; display: block;"></i>
                    <span>Nog geen outfits gedragen</span>
                </div>
            `;
            return;
        }
        
        recentEl.innerHTML = history.slice(0, 5).map(outfit => {
            const topImage = outfit.top?.image || outfit.outerwear?.image || '';
            const bottomImage = outfit.bottom?.image || outfit.shoes?.image || '';
            const date = new Date(outfit.wornAt);
            const dayName = date.toLocaleDateString('nl-NL', { weekday: 'short' });
            
            return `
                <div class="recent-item" style="min-width: 100px; flex-shrink: 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; height: 80px; border-radius: 12px; overflow: hidden; background: var(--gray-200);">
                        ${topImage ? `<img src="${topImage}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div></div>'}
                        ${bottomImage ? `<img src="${bottomImage}" style="width: 100%; height: 100%; object-fit: cover;">` : '<div></div>'}
                    </div>
                    <span style="display: block; font-size: 0.7rem; color: var(--gray-500); margin-top: 6px; text-align: center; text-transform: capitalize;">${dayName}</span>
                </div>
            `;
        }).join('');
    },

    generateOutfit() {
        const wardrobe = DataManager.getWardrobe();
        
        if (wardrobe.length === 0) {
            this.showEmptyWardrobe();
            return;
        }
        
        // Use SmartSuggester if available
        if (typeof SmartSuggester !== 'undefined') {
            const smartOutfit = SmartSuggester.generateOutfit(wardrobe, {
                weather: this.weather,
                dayType: this.dayType,
                avoidRecentDays: 3
            });
            
            this.currentOutfit = {
                outerwear: smartOutfit.outerwear,
                top: smartOutfit.top,
                bottom: smartOutfit.bottom,
                shoes: smartOutfit.shoes
            };
            
            // Show tips if available
            if (smartOutfit.tips && smartOutfit.tips.length > 0) {
                this.showOutfitTips(smartOutfit.tips);
            }
            
            // Show outfit score
            if (smartOutfit.score) {
                this.showOutfitScore(smartOutfit.score);
            }
        } else {
            // Fallback to basic generation
            this.generateBasicOutfit(wardrobe);
        }
        
        // Save today's outfit
        DataManager.saveTodayOutfit(this.currentOutfit);
        
        // Update UI
        this.updateOutfitUI();
        
        // Check for missing items
        this.checkMissingItems();
    },
    
    generateBasicOutfit(wardrobe) {
        // Get weather-appropriate recommendations
        const recommendations = WeatherManager.getRecommendation(this.weather);
        
        // Filter wardrobe by category
        const categories = {
            outerwear: wardrobe.filter(item => item.category === 'outerwear'),
            tops: wardrobe.filter(item => item.category === 'tops'),
            bottoms: wardrobe.filter(item => item.category === 'bottoms'),
            shoes: wardrobe.filter(item => item.category === 'shoes')
        };
        
        // Apply day type filtering
        const filterByDayType = (items) => {
            if (items.length === 0) return items;
            
            // Define keywords for each day type
            const dayTypeKeywords = {
                work: ['werk', 'zakelijk', 'business', 'blazer', 'overhemd', 'pantalon', 'nette'],
                sport: ['sport', 'gym', 'training', 'sneaker', 'jogging', 'fitness'],
                date: ['date', 'chic', 'mooi', 'elegant', 'feest'],
                party: ['party', 'feest', 'uitgaan', 'club', 'glitter'],
                casual: ['casual', 'thuis', 'relax', 'comfy']
            };
            
            const keywords = dayTypeKeywords[this.dayType] || [];
            
            // Try to find matching items
            const matched = items.filter(item => {
                const searchText = `${item.name || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
                return keywords.some(kw => searchText.includes(kw));
            });
            
            // If we found matches, prefer those; otherwise return all
            return matched.length > 0 ? matched : items;
        };
        
        // Select items with day type preference
        this.currentOutfit = {
            outerwear: this.weather.temp < 18 ? this.getRandomItem(filterByDayType(categories.outerwear)) : null,
            top: this.getRandomItem(filterByDayType(categories.tops)),
            bottom: this.getRandomItem(filterByDayType(categories.bottoms)),
            shoes: this.getRandomItem(filterByDayType(categories.shoes))
        };
    },
    
    showOutfitTips(tips) {
        // Remove existing tips
        const existingTips = document.querySelector('.outfit-tips');
        if (existingTips) existingTips.remove();
        
        if (tips.length === 0) return;
        
        const tipsHtml = `
            <div class="outfit-tips">
                ${tips.map(tip => `<div class="outfit-tip">${tip}</div>`).join('')}
            </div>
        `;
        
        const outfitSection = document.querySelector('.outfit-display');
        if (outfitSection) {
            outfitSection.insertAdjacentHTML('afterend', tipsHtml);
        }
    },
    
    showOutfitScore(score) {
        const scoreEl = document.querySelector('.outfit-score');
        if (scoreEl) {
            scoreEl.textContent = `Match: ${score}%`;
            scoreEl.className = `outfit-score ${score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'}`;
        }
    },

    getRandomItem(items) {
        if (!items || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    },

    updateOutfitUI() {
        const layerElements = {
            outerwear: document.querySelector('.outfit-layer.outerwear'),
            top: document.querySelector('.outfit-layer.top'),
            bottom: document.querySelector('.outfit-layer.bottom'),
            shoes: document.querySelector('.outfit-layer.shoes')
        };
        
        const icons = {
            outerwear: 'fa-vest',
            top: 'fa-tshirt',
            bottom: 'fa-socks',
            shoes: 'fa-shoe-prints'
        };
        
        const names = {
            outerwear: 'Jas',
            top: 'Top',
            bottom: 'Broek',
            shoes: 'Schoenen'
        };
        
        Object.entries(layerElements).forEach(([key, element]) => {
            if (!element) return;
            
            const item = this.currentOutfit[key];
            
            if (item && item.image) {
                element.classList.add('filled');
                element.innerHTML = `<img src="${item.image}" alt="${item.name || key}">`;
            } else {
                element.classList.remove('filled');
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
        
        // Update wear count for each item in the outfit
        this.updateWearCounts();
        
        // Show success
        App.showSuccess('Outfit opgeslagen! 🎉', 'Je outfit staat nu bij je opgeslagen looks');
        
        // Refresh recent outfits
        this.loadRecentOutfits();
    },
    
    updateWearCounts() {
        const wardrobe = DataManager.getWardrobe();
        const slots = ['outerwear', 'top', 'bottom', 'shoes'];
        let updated = false;
        
        slots.forEach(slot => {
            const item = this.currentOutfit[slot];
            if (item && item.id) {
                const wardrobeItem = wardrobe.find(w => w.id === item.id);
                if (wardrobeItem) {
                    wardrobeItem.wearCount = (wardrobeItem.wearCount || 0) + 1;
                    wardrobeItem.lastWorn = new Date().toISOString();
                    wardrobeItem.status = 'worn'; // Mark as worn
                    updated = true;
                }
            }
        });
        
        if (updated) {
            DataManager.saveWardrobe(wardrobe);
        }
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
