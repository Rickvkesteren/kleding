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
    
    App.init();
});

// Export for other modules
window.App = App;
window.DataManager = DataManager;
window.WeatherManager = WeatherManager;
window.ShopManager = ShopManager;
