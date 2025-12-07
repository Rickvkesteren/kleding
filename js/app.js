/**
 * StyleMate - Main App Controller
 * Handles navigation, data management, and app initialization
 */

// ==================== DATA MANAGER ====================
const DataManager = {
    // LocalStorage keys
    KEYS: {
        WARDROBE: 'stylemate_wardrobe',
        OUTFITS: 'stylemate_outfits',
        FAVORITES: 'stylemate_favorites',
        HISTORY: 'stylemate_history',
        TODAY_OUTFIT: 'stylemate_today',
        SETTINGS: 'stylemate_settings'
    },

    // Get wardrobe items
    getWardrobe() {
        const data = localStorage.getItem(this.KEYS.WARDROBE);
        return data ? JSON.parse(data) : [];
    },

    // Save wardrobe items
    saveWardrobe(items) {
        localStorage.setItem(this.KEYS.WARDROBE, JSON.stringify(items));
    },

    // Add clothing item
    addClothingItem(item) {
        const wardrobe = this.getWardrobe();
        item.id = Date.now().toString();
        item.createdAt = new Date().toISOString();
        wardrobe.push(item);
        this.saveWardrobe(wardrobe);
        return item;
    },

    // Remove clothing item
    removeClothingItem(id) {
        const wardrobe = this.getWardrobe();
        const filtered = wardrobe.filter(item => item.id !== id);
        this.saveWardrobe(filtered);
    },

    // Get items by category
    getItemsByCategory(category) {
        const wardrobe = this.getWardrobe();
        if (category === 'all') return wardrobe;
        return wardrobe.filter(item => item.category === category);
    },

    // Get saved outfits
    getOutfits() {
        const data = localStorage.getItem(this.KEYS.OUTFITS);
        return data ? JSON.parse(data) : [];
    },

    // Save outfit
    saveOutfit(outfit) {
        const outfits = this.getOutfits();
        outfit.id = Date.now().toString();
        outfit.createdAt = new Date().toISOString();
        outfits.push(outfit);
        localStorage.setItem(this.KEYS.OUTFITS, JSON.stringify(outfits));
        return outfit;
    },

    // Get today's outfit
    getTodayOutfit() {
        const data = localStorage.getItem(this.KEYS.TODAY_OUTFIT);
        if (!data) return null;
        const stored = JSON.parse(data);
        // Check if it's from today
        const today = new Date().toDateString();
        if (stored.date === today) {
            return stored.outfit;
        }
        return null;
    },

    // Save today's outfit
    saveTodayOutfit(outfit) {
        const data = {
            date: new Date().toDateString(),
            outfit: outfit
        };
        localStorage.setItem(this.KEYS.TODAY_OUTFIT, JSON.stringify(data));
    },

    // Add to history
    addToHistory(outfit) {
        let history = this.getHistory();
        outfit.wornAt = new Date().toISOString();
        history.unshift(outfit);
        // Keep only last 50
        history = history.slice(0, 50);
        localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    },

    // Get history
    getHistory() {
        const data = localStorage.getItem(this.KEYS.HISTORY);
        return data ? JSON.parse(data) : [];
    },

    // Get favorites
    getFavorites() {
        const data = localStorage.getItem(this.KEYS.FAVORITES);
        return data ? JSON.parse(data) : [];
    },

    // Toggle favorite
    toggleFavorite(outfitId) {
        let favorites = this.getFavorites();
        const index = favorites.indexOf(outfitId);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(outfitId);
        }
        localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favorites));
        return index === -1; // Returns true if added, false if removed
    },

    // Get stats
    getStats() {
        const wardrobe = this.getWardrobe();
        const outfits = this.getOutfits();
        
        const categories = {
            outerwear: 0,
            tops: 0,
            bottoms: 0,
            shoes: 0,
            accessories: 0
        };
        
        wardrobe.forEach(item => {
            if (categories.hasOwnProperty(item.category)) {
                categories[item.category]++;
            }
        });
        
        return {
            total: wardrobe.length,
            outfits: outfits.length,
            categories
        };
    }
};

// ==================== WEATHER MANAGER ====================
const WeatherManager = {
    // Mock weather data (can be replaced with real API)
    async getWeather() {
        // Simulate API call
        const conditions = ['sunny', 'cloudy', 'rainy', 'partly-cloudy', 'cold'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        const weatherData = {
            sunny: { temp: 24, feels: 26, desc: 'Zonnig', icon: '☀️', advice: 'Perfecte dag voor lichte kleding!' },
            cloudy: { temp: 18, feels: 17, desc: 'Bewolkt', icon: '☁️', advice: 'Een lichte jas is handig' },
            rainy: { temp: 14, feels: 12, desc: 'Regenachtig', icon: '🌧️', advice: 'Vergeet je regenjas niet!' },
            'partly-cloudy': { temp: 20, feels: 19, desc: 'Halfbewolkt', icon: '⛅', advice: 'Laagjes zijn ideaal vandaag' },
            cold: { temp: 6, feels: 3, desc: 'Koud', icon: '❄️', advice: 'Kleed je warm aan!' }
        };
        
        return {
            ...weatherData[randomCondition],
            condition: randomCondition
        };
    },

    // Get clothing recommendation based on weather
    getRecommendation(weather) {
        const temp = weather.temp;
        
        if (temp >= 25) {
            return {
                outerwear: null,
                layers: ['t-shirt', 'tanktop'],
                bottoms: ['shorts', 'rok', 'lichte broek'],
                shoes: ['sandalen', 'sneakers']
            };
        } else if (temp >= 18) {
            return {
                outerwear: ['lichte jas', 'vest'],
                layers: ['t-shirt', 'blouse', 'overhemd'],
                bottoms: ['jeans', 'chino', 'rok'],
                shoes: ['sneakers', 'loafers']
            };
        } else if (temp >= 12) {
            return {
                outerwear: ['jas', 'blazer', 'vest'],
                layers: ['trui', 'blouse', 'longsleeve'],
                bottoms: ['jeans', 'broek'],
                shoes: ['sneakers', 'boots']
            };
        } else {
            return {
                outerwear: ['winterjas', 'dikke jas'],
                layers: ['trui', 'hoodie', 'coltrui'],
                bottoms: ['warme broek', 'jeans'],
                shoes: ['boots', 'winterschoenen']
            };
        }
    }
};

// ==================== SHOP MANAGER ====================
const ShopManager = {
    // Mock shop data
    items: [
        { id: 's1', name: 'Oversized Trui', brand: 'H&M', price: 29.99, category: 'tops', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400' },
        { id: 's2', name: 'Slim Fit Jeans', brand: 'Zara', price: 49.99, category: 'bottoms', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' },
        { id: 's3', name: 'Wollen Jas', brand: 'Mango', price: 89.99, originalPrice: 129.99, category: 'outerwear', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400' },
        { id: 's4', name: 'Witte Sneakers', brand: 'Nike', price: 119.99, category: 'shoes', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
        { id: 's5', name: 'Gestreepte T-shirt', brand: 'C&A', price: 19.99, category: 'tops', image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400' },
        { id: 's6', name: 'Cargo Broek', brand: 'Pull&Bear', price: 39.99, category: 'bottoms', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400' },
    ],

    sets: [
        { id: 'set1', name: 'Casual Chic', items: ['s1', 's2', 's4'], price: 169.99, originalPrice: 199.97 },
        { id: 'set2', name: 'Winter Essentials', items: ['s3', 's1', 's2'], price: 149.99, originalPrice: 169.97 },
    ],

    getPersonalizedItems() {
        // In a real app, this would use ML/recommendations
        return this.items.slice(0, 4);
    },

    getMatchingItems(wardrobeItems) {
        // Return items that would complement existing wardrobe
        return this.items.filter(item => !wardrobeItems.some(w => w.category === item.category)).slice(0, 4);
    },

    getSets() {
        return this.sets;
    },

    getItemById(id) {
        return this.items.find(item => item.id === id);
    }
};

// ==================== APP CONTROLLER ====================
const App = {
    currentPage: 'today',
    modules: {},

    init() {
        console.log('🚀 StyleMate initialiseren...');
        
        // Initialize navigation
        this.initNavigation();
        
        // Load saved data and show first page
        this.showPage('today');
        
        // Initialize all modules
        if (typeof TodayManager !== 'undefined') {
            this.modules.today = TodayManager;
            TodayManager.init();
        }
        
        if (typeof SwipeManager !== 'undefined') {
            this.modules.swipe = SwipeManager;
        }
        
        if (typeof WardrobeManager !== 'undefined') {
            this.modules.wardrobe = WardrobeManager;
            WardrobeManager.init();
        }
        
        console.log('✅ StyleMate gereed!');
    },

    initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.showPage(page);
            });
        });
    },

    showPage(pageId) {
        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageId);
        });
        
        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `${pageId}Page`);
        });
        
        this.currentPage = pageId;
        
        // Trigger page-specific initialization
        if (pageId === 'today' && this.modules.today) {
            this.modules.today.refresh();
        } else if (pageId === 'wardrobe' && this.modules.wardrobe) {
            this.modules.wardrobe.refresh();
        } else if (pageId === 'shop') {
            this.loadShopPage();
        } else if (pageId === 'saved') {
            this.loadSavedPage();
        } else if (pageId === 'stats') {
            this.loadStatsPage();
        } else if (pageId === 'community') {
            this.loadCommunityPage();
        } else if (pageId === 'planner') {
            this.loadPlannerPage();
        }
    },

    // ==================== STATS PAGE ====================
    loadStatsPage() {
        if (typeof StatsManager === 'undefined') return;
        
        // Style Analysis
        const styleBars = document.getElementById('styleBars');
        if (styleBars) {
            const wardrobe = DataManager.getWardrobe();
            const styleAnalysis = typeof AIStyleMatcher !== 'undefined' 
                ? AIStyleMatcher.analyzeStyle(wardrobe)
                : [{ style: 'casual', percentage: 100 }];
            
            styleBars.innerHTML = styleAnalysis.slice(0, 4).map(item => `
                <div class="style-bar">
                    <span class="style-bar-label">${item.style}</span>
                    <div class="style-bar-track">
                        <div class="style-bar-fill" style="width: ${item.percentage}%"></div>
                    </div>
                    <span class="style-bar-value">${item.percentage}%</span>
                </div>
            `).join('');
        }
        
        // Wardrobe Value
        const valueEl = document.getElementById('wardrobeValue');
        const totalEl = document.getElementById('totalItemsStats');
        if (valueEl) valueEl.textContent = '€' + StatsManager.getTotalValue().toFixed(2);
        if (totalEl) totalEl.textContent = DataManager.getWardrobe().length;
        
        // Favorite Colors
        const colorStats = document.getElementById('colorStats');
        if (colorStats) {
            const analysis = StatsManager.getStyleAnalysis();
            const colorMap = {
                white: '#f5f5f5', black: '#1a1a1a', gray: '#6b7280', blue: '#3b82f6',
                red: '#ef4444', green: '#22c55e', navy: '#1e3a5f', beige: '#d4a574',
                brown: '#92400e', pink: '#ec4899', yellow: '#eab308', purple: '#8b5cf6'
            };
            
            colorStats.innerHTML = analysis.favoriteColors.map(color => `
                <div class="color-stat">
                    <div class="color-stat-dot" style="background: ${colorMap[color] || '#ccc'}"></div>
                    <span class="color-stat-name">${color}</span>
                </div>
            `).join('') || '<p style="color: var(--gray-400)">Voeg kleding toe met kleuren</p>';
        }
        
        // Most Worn
        const mostWornList = document.getElementById('mostWornList');
        if (mostWornList) {
            const { mostWorn } = StatsManager.getWearStats();
            mostWornList.innerHTML = mostWorn.length > 0 ? mostWorn.map((item, i) => `
                <div class="worn-item">
                    <img src="${item.image}" alt="${item.name}" class="worn-item-img">
                    <div class="worn-item-info">
                        <div class="worn-item-name">${item.name}</div>
                        <div class="worn-item-count">${item.wearCount}x gedragen</div>
                    </div>
                    ${i === 0 ? '<span class="worn-item-badge">🔥 Top</span>' : ''}
                </div>
            `).join('') : '<p style="color: var(--gray-400)">Draag outfits om statistieken te zien</p>';
        }
        
        // Forgotten Items
        const forgottenList = document.getElementById('forgottenList');
        if (forgottenList) {
            const { forgotten } = StatsManager.getWearStats();
            forgottenList.innerHTML = forgotten.length > 0 ? forgotten.slice(0, 5).map(item => `
                <div class="forgotten-item">
                    <img src="${item.image}" alt="${item.name}">
                    <span>${item.name.split(' ')[0]}</span>
                </div>
            `).join('') : '<p style="color: var(--gray-600)">Geen vergeten items 🎉</p>';
        }
        
        // Season Distribution
        const seasonChart = document.getElementById('seasonChart');
        if (seasonChart) {
            const analysis = StatsManager.getStyleAnalysis();
            const seasons = analysis.seasonDistribution;
            seasonChart.innerHTML = `
                <div class="season-item summer">
                    <i class="fas fa-sun"></i>
                    <span class="count">${seasons.summer || 0}</span>
                    <span class="label">Zomer</span>
                </div>
                <div class="season-item winter">
                    <i class="fas fa-snowflake"></i>
                    <span class="count">${seasons.winter || 0}</span>
                    <span class="label">Winter</span>
                </div>
                <div class="season-item spring">
                    <i class="fas fa-leaf"></i>
                    <span class="count">${seasons.spring || 0}</span>
                    <span class="label">Lente</span>
                </div>
                <div class="season-item autumn">
                    <i class="fas fa-cloud-sun"></i>
                    <span class="count">${seasons.all || 0}</span>
                    <span class="label">Altijd</span>
                </div>
            `;
        }
    },

    // ==================== COMMUNITY PAGE ====================
    loadCommunityPage() {
        if (typeof CommunityManager === 'undefined') return;
        
        // Setup filter tabs
        document.querySelectorAll('.comm-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.comm-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderCommunityLooks(tab.dataset.filter);
            });
        });
        
        // Initial render
        this.renderCommunityLooks('popular');
        
        // Share button
        const shareBtn = document.getElementById('btnShareLook');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.openShareModal());
        }
    },

    renderCommunityLooks(filter) {
        const grid = document.getElementById('communityGrid');
        if (!grid) return;
        
        const looks = CommunityManager.getLooks(filter);
        
        grid.innerHTML = looks.map(look => `
            <div class="community-look">
                <div class="look-images">
                    ${look.items.slice(0, 2).map(item => `<img src="${item.image}" alt="${item.name}">`).join('')}
                </div>
                <div class="look-info">
                    <div class="look-user">
                        <span class="look-avatar">${look.avatar}</span>
                        <span class="look-username">${look.user}</span>
                    </div>
                    <div class="look-title">${look.title}</div>
                    <div class="look-tags">
                        ${look.tags.map(tag => `<span class="look-tag">#${tag}</span>`).join('')}
                    </div>
                    <div class="look-actions">
                        <span class="look-likes"><i class="fas fa-heart"></i> ${look.likes}</span>
                        <button class="btn-save-look" onclick="App.saveCommunityLook('${look.id}')">
                            <i class="fas fa-bookmark"></i> Opslaan
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    saveCommunityLook(lookId) {
        App.showSuccess('Opgeslagen!', 'Look toegevoegd aan je collectie');
    },

    openShareModal() {
        const modal = document.getElementById('shareModal');
        const options = document.getElementById('shareOptions');
        
        if (modal && options && typeof ShareManager !== 'undefined') {
            const buttons = ShareManager.getShareButtons();
            options.innerHTML = buttons.map(btn => `
                <div class="share-option" style="background: ${btn.color}15" onclick="App.shareVia('${btn.id}')">
                    <i class="${btn.icon}" style="color: ${btn.color}"></i>
                    <span>${btn.name}</span>
                </div>
            `).join('');
            modal.classList.add('active');
        }
    },

    async shareVia(platform) {
        const outfit = this.modules.today?.currentOutfit;
        if (outfit && typeof ShareManager !== 'undefined') {
            const result = await ShareManager.shareOutfit(outfit, platform);
            if (result.success) {
                App.showSuccess('Gedeeld!', result.method === 'clipboard' ? 'Link gekopieerd!' : 'Bedankt voor het delen');
            }
        }
        document.getElementById('shareModal')?.classList.remove('active');
    },

    // ==================== WEEK PLANNER PAGE ====================
    loadPlannerPage() {
        if (typeof WeekPlanner === 'undefined') return;
        
        const weekOverview = document.getElementById('weekOverview');
        const forecastBar = document.getElementById('forecastBar');
        
        // Load week
        const week = WeekPlanner.getWeekOutfits();
        const today = new Date().toISOString().split('T')[0];
        
        if (weekOverview) {
            weekOverview.innerHTML = week.map(day => {
                const isToday = day.date === today;
                const dateObj = new Date(day.date);
                const dayNum = dateObj.getDate();
                
                return `
                    <div class="day-card ${isToday ? 'today' : ''}">
                        <div class="day-info">
                            <span class="day-name">${day.dayName.slice(0, 3)}</span>
                            <span class="day-date">${dayNum}</span>
                            <div class="day-weather">
                                <i class="fas fa-cloud-sun"></i>
                                <span>16°</span>
                            </div>
                        </div>
                        <div class="day-outfit">
                            ${day.outfit ? `
                                <div class="day-outfit-preview">
                                    ${day.outfit.top?.image ? `<img src="${day.outfit.top.image}" alt="">` : ''}
                                    ${day.outfit.bottom?.image ? `<img src="${day.outfit.bottom.image}" alt="">` : ''}
                                </div>
                            ` : `
                                <div class="day-outfit-empty">
                                    <i class="fas fa-plus"></i>
                                    <span>Plan outfit</span>
                                </div>
                            `}
                        </div>
                        <button class="btn-plan-day" onclick="App.planOutfitForDay('${day.date}')">
                            ${day.outfit ? 'Wijzig' : 'Plan'}
                        </button>
                    </div>
                `;
            }).join('');
        }
        
        // Load forecast
        if (forecastBar && typeof RealWeatherAPI !== 'undefined') {
            RealWeatherAPI.getMockForecast().then(forecast => {
                forecastBar.innerHTML = forecast.map(day => {
                    const dateObj = new Date(day.date);
                    const dayName = dateObj.toLocaleDateString('nl-NL', { weekday: 'short' });
                    const icons = {
                        sunny: 'fa-sun', cloudy: 'fa-cloud', rainy: 'fa-cloud-rain', 
                        'partly-cloudy': 'fa-cloud-sun', cold: 'fa-snowflake'
                    };
                    return `
                        <div class="forecast-day">
                            <span class="day">${dayName}</span>
                            <i class="fas ${icons[day.condition] || 'fa-cloud'}"></i>
                            <span class="temp">${day.temp}°</span>
                        </div>
                    `;
                }).join('');
            });
        }
    },

    planOutfitForDay(date) {
        // Generate a random outfit for the day
        if (typeof TodayManager !== 'undefined') {
            const wardrobe = DataManager.getWardrobe();
            const categories = {
                tops: wardrobe.filter(i => i.category === 'tops'),
                bottoms: wardrobe.filter(i => i.category === 'bottoms'),
                shoes: wardrobe.filter(i => i.category === 'shoes')
            };
            
            const outfit = {
                top: categories.tops[Math.floor(Math.random() * categories.tops.length)] || null,
                bottom: categories.bottoms[Math.floor(Math.random() * categories.bottoms.length)] || null,
                shoes: categories.shoes[Math.floor(Math.random() * categories.shoes.length)] || null
            };
            
            WeekPlanner.setOutfitForDay(date, outfit);
            this.loadPlannerPage();
            App.showSuccess('Gepland!', 'Outfit toegevoegd aan je planning');
        }
    },

    // Load Shop Page content
    loadShopPage() {
        // Personalized items
        const personalizedEl = document.getElementById('personalizedShop');
        if (personalizedEl) {
            const items = ShopManager.getPersonalizedItems();
            personalizedEl.innerHTML = items.map(item => `
                <div class="shop-item" onclick="App.openShopItem('${item.id}')">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="shop-item-info">
                        <span class="shop-item-brand">${item.brand}</span>
                        <h4>${item.name}</h4>
                        <div class="shop-item-price">
                            <span class="price">€${item.price.toFixed(2)}</span>
                            ${item.originalPrice ? `<span class="original">€${item.originalPrice.toFixed(2)}</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Matching items
        const matchingEl = document.getElementById('matchingShop');
        if (matchingEl) {
            const wardrobe = DataManager.getWardrobe();
            const items = ShopManager.getMatchingItems(wardrobe);
            matchingEl.innerHTML = items.map(item => `
                <div class="shop-item" onclick="App.openShopItem('${item.id}')">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="shop-item-info">
                        <span class="shop-item-brand">${item.brand}</span>
                        <h4>${item.name}</h4>
                        <div class="shop-item-price">
                            <span class="price">€${item.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Sets
        const setsEl = document.getElementById('shopSets');
        if (setsEl) {
            const sets = ShopManager.getSets();
            setsEl.innerHTML = sets.map(set => {
                const setItems = set.items.map(id => ShopManager.getItemById(id)).filter(Boolean);
                return `
                    <div class="shop-set">
                        <div class="set-images">
                            ${setItems.slice(0, 3).map(item => `<img src="${item.image}" alt="${item.name}">`).join('')}
                        </div>
                        <div class="set-info">
                            <h4>${set.name}</h4>
                            <div class="set-price">
                                <span class="price">€${set.price.toFixed(2)}</span>
                                <span class="original">€${set.originalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    // Open shop item for swipe
    openShopItem(itemId) {
        const item = ShopManager.getItemById(itemId);
        if (item) {
            this.openSwipeForCategory(item.category, 'shop');
        }
    },

    // Load Saved Page content
    loadSavedPage() {
        const content = document.getElementById('savedContent');
        if (!content) return;

        // Setup tab listeners
        document.querySelectorAll('.saved-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.saved-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderSavedContent(tab.dataset.tab);
            });
        });

        // Render default tab
        this.renderSavedContent('outfits');
    },

    renderSavedContent(tab) {
        const content = document.getElementById('savedContent');
        if (!content) return;

        if (tab === 'outfits') {
            const outfits = DataManager.getOutfits();
            if (outfits.length === 0) {
                content.innerHTML = `
                    <div class="empty-saved">
                        <i class="fas fa-bookmark"></i>
                        <h3>Nog geen outfits opgeslagen</h3>
                        <p>Sla je favoriete looks op om ze hier te zien</p>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div class="saved-grid">
                        ${outfits.map(outfit => `
                            <div class="saved-outfit">
                                <div class="outfit-preview">
                                    ${outfit.top?.image ? `<img src="${outfit.top.image}" alt="Top">` : ''}
                                    ${outfit.bottom?.image ? `<img src="${outfit.bottom.image}" alt="Bottom">` : ''}
                                </div>
                                <span class="outfit-date">${new Date(outfit.createdAt).toLocaleDateString('nl-NL')}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } else if (tab === 'wishlist') {
            const wishlist = typeof WishlistManager !== 'undefined' ? WishlistManager.getWishlist() : [];
            if (wishlist.length === 0) {
                content.innerHTML = `
                    <div class="empty-saved">
                        <i class="fas fa-heart"></i>
                        <h3>Je wishlist is leeg</h3>
                        <p>Voeg items toe vanuit de shop</p>
                    </div>
                `;
            } else {
                const total = WishlistManager.getTotalValue();
                content.innerHTML = `
                    <div class="wishlist-total">
                        <span class="wishlist-total-label">Totaal wishlist</span>
                        <span class="wishlist-total-value">€${total.toFixed(2)}</span>
                    </div>
                    <div class="wishlist-grid" style="padding: 0 20px;">
                        ${wishlist.map(item => `
                            <div class="wishlist-item">
                                <button class="btn-remove-wishlist" onclick="App.removeFromWishlist('${item.id}')">
                                    <i class="fas fa-times"></i>
                                </button>
                                <img src="${item.image}" alt="${item.name}">
                                <div class="wishlist-item-info">
                                    <span class="wishlist-item-brand">${item.brand || ''}</span>
                                    <div class="wishlist-item-name">${item.name}</div>
                                    <span class="wishlist-item-price">€${item.price?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } else if (tab === 'history') {
            const history = DataManager.getHistory();
            if (history.length === 0) {
                content.innerHTML = `
                    <div class="empty-saved">
                        <i class="fas fa-history"></i>
                        <h3>Geen geschiedenis</h3>
                        <p>Je outfit geschiedenis verschijnt hier</p>
                    </div>
                `;
            } else {
                content.innerHTML = `
                    <div class="history-list">
                        ${history.map(outfit => `
                            <div class="history-item">
                                <div class="history-preview">
                                    ${outfit.top?.image ? `<img src="${outfit.top.image}" alt="">` : ''}
                                </div>
                                <div class="history-info">
                                    <span class="history-date">${new Date(outfit.wornAt).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    },

    // Show add clothing modal
    showAddClothingModal() {
        const modal = document.getElementById('addClothingModal');
        if (modal) {
            modal.classList.add('active');
        }
    },

    // Close all modals
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    // Show success modal
    showSuccess(title, message) {
        const modal = document.getElementById('outfitSavedModal');
        if (modal) {
            const titleEl = modal.querySelector('h2');
            const msgEl = modal.querySelector('p');
            if (titleEl) titleEl.textContent = title;
            if (msgEl) msgEl.textContent = message;
            modal.classList.add('active');
            
            // Auto close after 2 seconds
            setTimeout(() => {
                modal.classList.remove('active');
            }, 2000);
        }
    },

    // Open swipe for specific category
    openSwipeForCategory(category, source = 'wardrobe') {
        this.modules.swipe?.startSwipe(category, source);
        this.showPage('swipe');
    },

    // Wishlist functions
    addToWishlist(itemId) {
        const item = ShopManager.getItemById(itemId);
        if (item && typeof WishlistManager !== 'undefined') {
            WishlistManager.addToWishlist(item);
            App.showSuccess('Toegevoegd!', 'Item staat op je wishlist');
        }
    },

    removeFromWishlist(itemId) {
        if (typeof WishlistManager !== 'undefined') {
            WishlistManager.removeFromWishlist(itemId);
            this.renderSavedContent('wishlist');
        }
    },

    // AI Suggestions
    showAISuggestions() {
        const modal = document.getElementById('aiSuggestionModal');
        const suggestions = document.getElementById('aiSuggestions');
        
        if (modal && suggestions && typeof AIStyleMatcher !== 'undefined') {
            const outfit = this.modules.today?.currentOutfit || {};
            const items = AIStyleMatcher.getShopSuggestions(outfit);
            
            suggestions.innerHTML = items.map(item => `
                <div class="ai-suggestion" onclick="App.addToWishlist('${item.id}')">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="ai-suggestion-info">
                        <div class="ai-suggestion-name">${item.name}</div>
                        <div class="ai-suggestion-reason">${item.reason}</div>
                        <div class="ai-suggestion-price">€${item.price.toFixed(2)}</div>
                    </div>
                </div>
            `).join('');
            
            modal.classList.add('active');
        }
    }
};

// ==================== DOM READY ====================
document.addEventListener('DOMContentLoaded', () => {
    // Add demo data if wardrobe is empty
    if (DataManager.getWardrobe().length === 0) {
        const demoItems = [
            { name: 'Donkere Winterjas', category: 'outerwear', color: 'black', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', season: 'winter' },
            { name: 'Witte T-shirt', category: 'tops', color: 'white', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', season: 'all' },
            { name: 'Blauwe Trui', category: 'tops', color: 'blue', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', season: 'winter' },
            { name: 'Slim Fit Jeans', category: 'bottoms', color: 'navy', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', season: 'all' },
            { name: 'Beige Chino', category: 'bottoms', color: 'beige', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', season: 'all' },
            { name: 'Witte Sneakers', category: 'shoes', color: 'white', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', season: 'all' },
            { name: 'Bruine Boots', category: 'shoes', color: 'brown', image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400', season: 'winter' }
        ];
        
        demoItems.forEach(item => DataManager.addClothingItem(item));
        console.log('📦 Demo data toegevoegd');
    }
    
    // Setup close buttons for success modal
    const closeSavedBtn = document.getElementById('closeSavedModal');
    if (closeSavedBtn) {
        closeSavedBtn.addEventListener('click', () => {
            const modal = document.getElementById('outfitSavedModal');
            if (modal) modal.classList.remove('active');
        });
    }
    
    App.init();
});

// Export for other modules
window.App = App;
window.DataManager = DataManager;
window.WeatherManager = WeatherManager;
window.ShopManager = ShopManager;
