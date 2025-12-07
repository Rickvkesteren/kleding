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
        SETTINGS: 'stylemate_settings',
        WEEK_PLAN: 'stylemate_week_plan'
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
        item.status = 'available'; // available, washing, worn
        item.wearCount = 0;
        item.lastWorn = null;
        wardrobe.push(item);
        this.saveWardrobe(wardrobe);
        return item;
    },

    // Update item status
    updateItemStatus(itemId, status) {
        const wardrobe = this.getWardrobe();
        const item = wardrobe.find(i => i.id === itemId);
        if (item) {
            item.status = status;
            if (status === 'worn') {
                item.lastWorn = new Date().toISOString();
            }
            this.saveWardrobe(wardrobe);
        }
    },

    // Mark item as washed (available again)
    markAsWashed(itemId) {
        this.updateItemStatus(itemId, 'available');
    },

    // Mark item as in laundry
    markAsWashing(itemId) {
        this.updateItemStatus(itemId, 'washing');
    },

    // Get items by status
    getItemsByStatus(status) {
        const wardrobe = this.getWardrobe();
        return wardrobe.filter(item => item.status === status || (!item.status && status === 'available'));
    },

    // Get availability stats
    getAvailabilityStats() {
        const wardrobe = this.getWardrobe();
        const stats = { available: 0, washing: 0, worn: 0 };
        wardrobe.forEach(item => {
            const status = item.status || 'available';
            if (stats.hasOwnProperty(status)) {
                stats[status]++;
            } else {
                stats.available++;
            }
        });
        return stats;
    },

    // Get week plan
    getWeekPlan() {
        const data = localStorage.getItem(this.KEYS.WEEK_PLAN);
        return data ? JSON.parse(data) : {};
    },

    // Save outfit for specific date
    saveOutfitForDate(dateStr, outfit) {
        const plan = this.getWeekPlan();
        plan[dateStr] = outfit;
        localStorage.setItem(this.KEYS.WEEK_PLAN, JSON.stringify(plan));
    },

    // Get outfit for specific date
    getOutfitForDate(dateStr) {
        const plan = this.getWeekPlan();
        return plan[dateStr] || null;
    },

    // Clear outfit for date
    clearOutfitForDate(dateStr) {
        const plan = this.getWeekPlan();
        delete plan[dateStr];
        localStorage.setItem(this.KEYS.WEEK_PLAN, JSON.stringify(plan));
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
    // Real weather from Open-Meteo API (free, no key needed)
    async getWeather() {
        try {
            // Get user's GPS location
            const coords = await this.getCurrentLocation();
            
            // Fetch real weather from Open-Meteo
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m&timezone=auto`
            );
            
            if (!response.ok) throw new Error('Weather API error');
            
            const data = await response.json();
            const current = data.current;
            
            // Map weather code to condition
            const condition = this.mapWeatherCode(current.weather_code);
            const weatherInfo = this.getWeatherInfo(condition, current.temperature_2m);
            
            // Get city name from coordinates
            const cityName = await this.getCityName(coords.lat, coords.lon);
            
            return {
                temp: Math.round(current.temperature_2m),
                feels: Math.round(current.apparent_temperature),
                desc: weatherInfo.desc,
                icon: weatherInfo.icon,
                advice: weatherInfo.advice,
                condition: condition,
                humidity: current.relative_humidity_2m,
                wind: Math.round(current.wind_speed_10m),
                city: cityName,
                isReal: true
            };
        } catch (error) {
            console.error('Weather fetch error:', error);
            return this.getFallbackWeather();
        }
    },
    
    // Get GPS coordinates
    async getCurrentLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                // Default to Amsterdam
                resolve({ lat: 52.3676, lon: 4.9041 });
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Geolocation denied, using Amsterdam:', error.message);
                    resolve({ lat: 52.3676, lon: 4.9041 });
                },
                { timeout: 5000, enableHighAccuracy: false }
            );
        });
    },
    
    // Get city name from coordinates using reverse geocoding
    async getCityName(lat, lon) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=nl`
            );
            const data = await response.json();
            return data.address?.city || data.address?.town || data.address?.village || 'Nederland';
        } catch {
            return 'Nederland';
        }
    },
    
    // Map Open-Meteo weather codes to conditions
    mapWeatherCode(code) {
        // WMO Weather interpretation codes
        if (code === 0) return 'sunny';
        if (code === 1 || code === 2) return 'partly-cloudy';
        if (code === 3) return 'cloudy';
        if (code >= 45 && code <= 48) return 'cloudy'; // Fog
        if (code >= 51 && code <= 67) return 'rainy'; // Drizzle, Rain
        if (code >= 71 && code <= 77) return 'cold'; // Snow
        if (code >= 80 && code <= 82) return 'rainy'; // Rain showers
        if (code >= 85 && code <= 86) return 'cold'; // Snow showers
        if (code >= 95 && code <= 99) return 'rainy'; // Thunderstorm
        return 'partly-cloudy';
    },
    
    // Get weather info based on condition and temp
    getWeatherInfo(condition, temp) {
        const info = {
            sunny: { desc: 'Zonnig', icon: '☀️', advice: 'Perfecte dag voor lichte kleding!' },
            cloudy: { desc: 'Bewolkt', icon: '☁️', advice: 'Een lichte jas is handig' },
            rainy: { desc: 'Regenachtig', icon: '🌧️', advice: 'Vergeet je regenjas niet!' },
            'partly-cloudy': { desc: 'Halfbewolkt', icon: '⛅', advice: 'Laagjes zijn ideaal vandaag' },
            cold: { desc: 'Koud', icon: '❄️', advice: 'Kleed je warm aan!' }
        };
        
        // Adjust advice based on temperature
        let result = { ...info[condition] };
        if (temp >= 25) {
            result.advice = 'Warm weer! Kies lichte, luchtige kleding.';
        } else if (temp <= 5) {
            result.advice = 'Kleed je extra warm aan vandaag!';
            result.icon = '❄️';
        }
        
        return result;
    },
    
    // Fallback when API fails
    getFallbackWeather() {
        return {
            temp: 18,
            feels: 17,
            desc: 'Halfbewolkt',
            icon: '⛅',
            advice: 'Laagjes zijn ideaal vandaag',
            condition: 'partly-cloudy',
            city: 'Nederland',
            isReal: false
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
        const wardrobe = DataManager.getWardrobe();
        const history = DataManager.getHistory();
        
        // Quick Stats
        const totalEl = document.getElementById('totalItemsStats');
        const outfitsEl = document.getElementById('totalOutfitsStats');
        if (totalEl) totalEl.textContent = wardrobe.length;
        if (outfitsEl) outfitsEl.textContent = history.length;
        
        // Season Balance
        const seasonBalance = document.getElementById('seasonBalance');
        const seasonTips = document.getElementById('seasonTips');
        if (seasonBalance) {
            const seasons = { summer: 0, winter: 0, spring: 0, all: 0 };
            wardrobe.forEach(item => {
                const s = item.season || 'all';
                if (seasons[s] !== undefined) seasons[s]++;
                else seasons.all++;
            });
            const total = wardrobe.length || 1;
            
            seasonBalance.innerHTML = `
                <div class="balance-bar">
                    <div class="balance-label"><i class="fas fa-sun" style="color:#f59e0b"></i> Zomer</div>
                    <div class="balance-track">
                        <div class="balance-fill summer" style="width: ${(seasons.summer/total)*100}%">
                            <span>${seasons.summer}</span>
                        </div>
                    </div>
                </div>
                <div class="balance-bar">
                    <div class="balance-label"><i class="fas fa-snowflake" style="color:#3b82f6"></i> Winter</div>
                    <div class="balance-track">
                        <div class="balance-fill winter" style="width: ${(seasons.winter/total)*100}%">
                            <span>${seasons.winter}</span>
                        </div>
                    </div>
                </div>
                <div class="balance-bar">
                    <div class="balance-label"><i class="fas fa-leaf" style="color:#22c55e"></i> Lente</div>
                    <div class="balance-track">
                        <div class="balance-fill spring" style="width: ${(seasons.spring/total)*100}%">
                            <span>${seasons.spring}</span>
                        </div>
                    </div>
                </div>
                <div class="balance-bar">
                    <div class="balance-label"><i class="fas fa-infinity" style="color:#8b5cf6"></i> Altijd</div>
                    <div class="balance-track">
                        <div class="balance-fill all" style="width: ${(seasons.all/total)*100}%">
                            <span>${seasons.all}</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Generate tips
            if (seasonTips) {
                const tips = [];
                if (seasons.summer < 3) tips.push({ type: 'warning', text: 'Je hebt weinig zomerkleding. Tijd voor shopping! ☀️' });
                if (seasons.winter < 3) tips.push({ type: 'warning', text: 'Je hebt weinig winterkleding. Bereid je voor op de kou! 🧥' });
                if (seasons.all > total * 0.5) tips.push({ type: 'success', text: 'Super! Je hebt veel veelzijdige items 👍' });
                if (tips.length === 0) tips.push({ type: 'success', text: 'Je garderobe is goed gebalanceerd! ✨' });
                
                seasonTips.innerHTML = tips.map(tip => `
                    <div class="balance-tip ${tip.type}">
                        <i class="fas fa-${tip.type === 'warning' ? 'exclamation-triangle' : 'check-circle'}"></i>
                        <span>${tip.text}</span>
                    </div>
                `).join('');
            }
        }
        
        // Occasion Chart
        const occasionChart = document.getElementById('occasionChart');
        if (occasionChart) {
            // Analyze tags and categories for occasion
            const occasions = { casual: 0, business: 0, sport: 0, party: 0 };
            wardrobe.forEach(item => {
                const tags = (item.tags || []).join(' ').toLowerCase();
                const name = (item.name || '').toLowerCase();
                if (tags.includes('werk') || tags.includes('zakelijk') || tags.includes('business') || name.includes('blazer') || name.includes('overhemd')) {
                    occasions.business++;
                } else if (tags.includes('sport') || tags.includes('gym') || name.includes('sneaker')) {
                    occasions.sport++;
                } else if (tags.includes('feest') || tags.includes('party') || tags.includes('uitgaan')) {
                    occasions.party++;
                } else {
                    occasions.casual++;
                }
            });
            
            occasionChart.innerHTML = `
                <div class="occasion-item casual">
                    <div class="occasion-icon">👕</div>
                    <div class="occasion-count">${occasions.casual}</div>
                    <div class="occasion-label">Casual</div>
                </div>
                <div class="occasion-item business">
                    <div class="occasion-icon">👔</div>
                    <div class="occasion-count">${occasions.business}</div>
                    <div class="occasion-label">Zakelijk</div>
                </div>
                <div class="occasion-item sport">
                    <div class="occasion-icon">🏃</div>
                    <div class="occasion-count">${occasions.sport}</div>
                    <div class="occasion-label">Sport</div>
                </div>
                <div class="occasion-item party">
                    <div class="occasion-icon">🎉</div>
                    <div class="occasion-count">${occasions.party}</div>
                    <div class="occasion-label">Uitgaan</div>
                </div>
            `;
        }
        
        // Category Chart
        const categoryChart = document.getElementById('categoryChart');
        if (categoryChart) {
            const categories = { tops: 0, bottoms: 0, shoes: 0, outerwear: 0, accessories: 0 };
            wardrobe.forEach(item => {
                const cat = item.category || 'tops';
                if (categories[cat] !== undefined) categories[cat]++;
            });
            const maxCat = Math.max(...Object.values(categories)) || 1;
            
            const catNames = { tops: 'Tops', bottoms: 'Broeken', shoes: 'Schoenen', outerwear: 'Jassen', accessories: 'Accessoires' };
            const catIcons = { tops: 'fa-shirt', bottoms: 'fa-socks', shoes: 'fa-shoe-prints', outerwear: 'fa-vest', accessories: 'fa-glasses' };
            
            categoryChart.innerHTML = Object.entries(categories).map(([cat, count]) => `
                <div class="category-bar">
                    <div class="category-icon"><i class="fas ${catIcons[cat]}"></i></div>
                    <div class="category-info">
                        <div class="category-name">${catNames[cat]}</div>
                        <div class="category-track">
                            <div class="category-fill ${cat}" style="width: ${(count/maxCat)*100}%"></div>
                        </div>
                    </div>
                    <span class="category-count">${count}</span>
                </div>
            `).join('');
        }
        
        // Color Stats
        const colorStats = document.getElementById('colorStats');
        if (colorStats) {
            const colorMap = {
                white: '#f5f5f5', black: '#1a1a1a', gray: '#6b7280', blue: '#3b82f6',
                red: '#ef4444', green: '#22c55e', navy: '#1e3a5f', beige: '#d4a574',
                brown: '#92400e', pink: '#ec4899', yellow: '#eab308', purple: '#8b5cf6'
            };
            const colors = {};
            wardrobe.forEach(item => {
                if (item.color) colors[item.color] = (colors[item.color] || 0) + 1;
            });
            const sortedColors = Object.entries(colors).sort((a,b) => b[1] - a[1]).slice(0, 6);
            
            colorStats.innerHTML = sortedColors.length > 0 ? sortedColors.map(([color, count]) => `
                <div class="color-stat">
                    <div class="color-stat-dot" style="background: ${colorMap[color] || '#ccc'}"></div>
                    <span class="color-stat-name">${color}</span>
                    <span class="color-stat-count">${count}x</span>
                </div>
            `).join('') : '<p style="color: var(--gray-400); font-size: 0.85rem;">Voeg kleding toe met kleuren</p>';
        }
        
        // Most Worn
        const mostWornList = document.getElementById('mostWornList');
        if (mostWornList && typeof StatsManager !== 'undefined') {
            const { mostWorn } = StatsManager.getWearStats();
            mostWornList.innerHTML = mostWorn.length > 0 ? mostWorn.slice(0, 5).map((item, i) => `
                <div class="worn-item">
                    <img src="${item.image}" alt="${item.name}" class="worn-item-img">
                    <div class="worn-item-info">
                        <div class="worn-item-name">${item.name}</div>
                        <div class="worn-item-count">${item.wearCount}x gedragen</div>
                    </div>
                    ${i === 0 ? '<span class="worn-item-badge">🔥 Top</span>' : ''}
                </div>
            `).join('') : '<p style="color: var(--gray-400); font-size: 0.85rem;">Draag outfits om statistieken te zien</p>';
        }
        
        // Forgotten Items
        const forgottenList = document.getElementById('forgottenList');
        if (forgottenList && typeof StatsManager !== 'undefined') {
            const { forgotten } = StatsManager.getWearStats();
            forgottenList.innerHTML = forgotten.length > 0 ? forgotten.slice(0, 6).map(item => `
                <div class="forgotten-item">
                    <img src="${item.image}" alt="${item.name}">
                    <span>${item.name.split(' ')[0]}</span>
                </div>
            `).join('') : '<p style="color: var(--gray-700); font-size: 0.85rem;">Geen vergeten items 🎉</p>';
        }
        
        // Smart Tips
        const smartTips = document.getElementById('smartTips');
        if (smartTips) {
            const tips = [];
            const categories = { tops: 0, bottoms: 0, shoes: 0, outerwear: 0 };
            wardrobe.forEach(item => {
                if (categories[item.category] !== undefined) categories[item.category]++;
            });
            
            if (categories.tops > categories.bottoms * 2) {
                tips.push({ icon: 'fa-lightbulb', type: 'info', title: 'Meer broeken nodig?', desc: 'Je hebt veel meer tops dan broeken' });
            }
            if (categories.outerwear < 2) {
                tips.push({ icon: 'fa-cloud-rain', type: 'warning', title: 'Weinig jassen', desc: 'Overweeg een extra jas voor slecht weer' });
            }
            if (wardrobe.length >= 20) {
                tips.push({ icon: 'fa-star', type: 'success', title: 'Mooie collectie!', desc: `Je hebt ${wardrobe.length} items verzameld` });
            }
            if (history.length >= 10) {
                tips.push({ icon: 'fa-fire', type: 'success', title: 'Actieve gebruiker', desc: `Al ${history.length} outfits gedragen!` });
            }
            if (tips.length === 0) {
                tips.push({ icon: 'fa-rocket', type: 'info', title: 'Bouw je garderobe', desc: 'Voeg meer kleding toe voor betere inzichten' });
            }
            
            smartTips.innerHTML = tips.slice(0, 3).map(tip => `
                <div class="smart-tip">
                    <div class="smart-tip-icon ${tip.type}"><i class="fas ${tip.icon}"></i></div>
                    <div class="smart-tip-content">
                        <div class="smart-tip-title">${tip.title}</div>
                        <div class="smart-tip-desc">${tip.desc}</div>
                    </div>
                </div>
            `).join('');
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
        // Initialize the WeekPlannerManager
        if (typeof WeekPlannerManager !== 'undefined') {
            WeekPlannerManager.init();
        }
    },

    planOutfitForDay(date) {
        // Use WeekPlannerManager for planning
        if (typeof WeekPlannerManager !== 'undefined') {
            WeekPlannerManager.generateSuggestion(date);
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
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('✅ Service Worker geregistreerd'))
            .catch(err => console.log('Service Worker registratie overgeslagen'));
    }
    
    // Add demo data if wardrobe is empty
    if (DataManager.getWardrobe().length === 0) {
        const demoItems = [
            { name: 'Donkere Winterjas', category: 'outerwear', color: 'black', image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400', season: 'winter', wearCount: 0 },
            { name: 'Witte T-shirt', category: 'tops', color: 'white', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', season: 'all', wearCount: 0 },
            { name: 'Blauwe Trui', category: 'tops', color: 'blue', image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400', season: 'winter', wearCount: 0 },
            { name: 'Slim Fit Jeans', category: 'bottoms', color: 'navy', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', season: 'all', wearCount: 0 },
            { name: 'Beige Chino', category: 'bottoms', color: 'beige', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', season: 'all', wearCount: 0 },
            { name: 'Witte Sneakers', category: 'shoes', color: 'white', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', season: 'all', wearCount: 0 },
            { name: 'Bruine Boots', category: 'shoes', color: 'brown', image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400', season: 'winter', wearCount: 0 }
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
