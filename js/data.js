// Data management - LocalStorage voor opslag

const DataManager = {
    STORAGE_KEYS: {
        CLOTHING: 'outfit_creator_clothing',
        OUTFITS: 'outfit_creator_outfits',
        SETTINGS: 'outfit_creator_settings',
        VERSION: 'outfit_creator_version'
    },
    
    // Version nummer - verhoog dit om mock data te forceren
    DATA_VERSION: '8.0',

    // Initialiseer met mock data als er geen data is of versie is verouderd
    init() {
        const currentVersion = localStorage.getItem(this.STORAGE_KEYS.VERSION);
        
        // Reset als versie niet overeenkomt (nieuwe mock data laden)
        if (currentVersion !== this.DATA_VERSION) {
            this.resetToMockData();
            localStorage.setItem(this.STORAGE_KEYS.VERSION, this.DATA_VERSION);
        }
        
        if (!this.getClothing().length) {
            this.setClothing(this.getMockClothing());
        }
        if (!this.getOutfits().length) {
            this.setOutfits(this.getMockOutfits());
        }
    },
    
    // Reset naar mock data
    resetToMockData() {
        localStorage.removeItem(this.STORAGE_KEYS.CLOTHING);
        localStorage.removeItem(this.STORAGE_KEYS.OUTFITS);
        this.setClothing(this.getMockClothing());
        this.setOutfits(this.getMockOutfits());
    },

    // Clothing CRUD
    getClothing() {
        const data = localStorage.getItem(this.STORAGE_KEYS.CLOTHING);
        return data ? JSON.parse(data) : [];
    },

    setClothing(items) {
        localStorage.setItem(this.STORAGE_KEYS.CLOTHING, JSON.stringify(items));
    },

    addClothingItem(item) {
        const items = this.getClothing();
        item.id = Date.now().toString();
        item.dateAdded = new Date().toISOString();
        items.push(item);
        this.setClothing(items);
        return item;
    },

    updateClothingItem(id, updates) {
        const items = this.getClothing();
        const index = items.findIndex(item => item.id === id);
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            this.setClothing(items);
            return items[index];
        }
        return null;
    },

    deleteClothingItem(id) {
        const items = this.getClothing();
        const filtered = items.filter(item => item.id !== id);
        this.setClothing(filtered);
    },

    getClothingByCategory(category) {
        const items = this.getClothing();
        if (category === 'all') return items;
        return items.filter(item => item.category === category);
    },

    // Outfits CRUD
    getOutfits() {
        const data = localStorage.getItem(this.STORAGE_KEYS.OUTFITS);
        return data ? JSON.parse(data) : [];
    },

    setOutfits(outfits) {
        localStorage.setItem(this.STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
    },

    addOutfit(outfit) {
        const outfits = this.getOutfits();
        outfit.id = Date.now().toString();
        outfit.dateCreated = new Date().toISOString();
        outfits.push(outfit);
        this.setOutfits(outfits);
        return outfit;
    },

    deleteOutfit(id) {
        const outfits = this.getOutfits();
        const filtered = outfits.filter(outfit => outfit.id !== id);
        this.setOutfits(filtered);
    },

    getOutfitById(id) {
        const outfits = this.getOutfits();
        return outfits.find(outfit => outfit.id === id);
    },

    // Mock data met PERFECTE consistente kleding foto's
    // Alle foto's zijn plat gelegd of clean product shots
    getMockClothing() {
        return [
            // ===== TOPS =====
            {
                id: '1',
                name: 'Wit T-Shirt',
                brand: 'Essential',
                category: 'tops',
                color: 'white',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 20,
                icon: 'fa-tshirt'
            },
            {
                id: '2',
                name: 'Zwart T-Shirt',
                brand: 'Essential',
                category: 'tops',
                color: 'black',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 25,
                icon: 'fa-tshirt'
            },
            {
                id: '3',
                name: 'Blauw Overhemd',
                brand: 'Classic',
                category: 'tops',
                color: 'blue',
                style: 'formal',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 15,
                icon: 'fa-tshirt'
            },
            {
                id: '4',
                name: 'Wit Overhemd',
                brand: 'Classic',
                category: 'tops',
                color: 'white',
                style: 'formal',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=500&fit=crop',
                favorite: false,
                wearCount: 12,
                icon: 'fa-tshirt'
            },
            {
                id: '5',
                name: 'Grijze Hoodie',
                brand: 'Comfort',
                category: 'tops',
                color: 'gray',
                style: 'casual',
                season: 'winter',
                image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 30,
                icon: 'fa-tshirt'
            },
            {
                id: '6',
                name: 'Navy Sweater',
                brand: 'Knit',
                category: 'tops',
                color: 'blue',
                style: 'casual',
                season: 'winter',
                image: 'https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=400&h=500&fit=crop',
                favorite: false,
                wearCount: 18,
                icon: 'fa-tshirt'
            },
            
            // ===== BOTTOMS =====
            {
                id: '7',
                name: 'Blauwe Jeans',
                brand: 'Denim',
                category: 'bottoms',
                color: 'blue',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 35,
                icon: 'fa-socks'
            },
            {
                id: '8',
                name: 'Zwarte Jeans',
                brand: 'Denim',
                category: 'bottoms',
                color: 'black',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 28,
                icon: 'fa-socks'
            },
            {
                id: '9',
                name: 'Beige Chino',
                brand: 'Smart',
                category: 'bottoms',
                color: 'beige',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=500&fit=crop',
                favorite: false,
                wearCount: 20,
                icon: 'fa-socks'
            },
            {
                id: '10',
                name: 'Grijze Pantalon',
                brand: 'Formal',
                category: 'bottoms',
                color: 'gray',
                style: 'formal',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop',
                favorite: false,
                wearCount: 12,
                icon: 'fa-socks'
            },
            
            // ===== SHOES =====
            {
                id: '11',
                name: 'Witte Sneakers',
                brand: 'Clean',
                category: 'shoes',
                color: 'white',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=400&fit=crop',
                favorite: true,
                wearCount: 40,
                icon: 'fa-shoe-prints'
            },
            {
                id: '12',
                name: 'Zwarte Sneakers',
                brand: 'Sport',
                category: 'shoes',
                color: 'black',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1491553895911-0055uj36d482?w=400&h=400&fit=crop',
                favorite: true,
                wearCount: 30,
                icon: 'fa-shoe-prints'
            },
            {
                id: '13',
                name: 'Bruine Boots',
                brand: 'Leather',
                category: 'shoes',
                color: 'brown',
                style: 'casual',
                season: 'winter',
                image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=400&fit=crop',
                favorite: false,
                wearCount: 15,
                icon: 'fa-shoe-prints'
            },
            {
                id: '14',
                name: 'Zwarte Schoenen',
                brand: 'Formal',
                category: 'shoes',
                color: 'black',
                style: 'formal',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=400&fit=crop',
                favorite: false,
                wearCount: 10,
                icon: 'fa-shoe-prints'
            },
            
            // ===== OUTERWEAR =====
            {
                id: '15',
                name: 'Zwart Leren Jack',
                brand: 'Biker',
                category: 'outerwear',
                color: 'black',
                style: 'casual',
                season: 'spring',
                image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 18,
                icon: 'fa-vest'
            },
            {
                id: '16',
                name: 'Navy Blazer',
                brand: 'Tailored',
                category: 'outerwear',
                color: 'blue',
                style: 'formal',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 12,
                icon: 'fa-vest'
            },
            {
                id: '17',
                name: 'Denim Jacket',
                brand: 'Casual',
                category: 'outerwear',
                color: 'blue',
                style: 'casual',
                season: 'spring',
                image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400&h=500&fit=crop',
                favorite: true,
                wearCount: 22,
                icon: 'fa-vest'
            },
            {
                id: '18',
                name: 'Beige Trenchcoat',
                brand: 'Classic',
                category: 'outerwear',
                color: 'beige',
                style: 'elegant',
                season: 'spring',
                image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop',
                favorite: false,
                wearCount: 8,
                icon: 'fa-vest'
            },
            {
                id: '19',
                name: 'Zwarte Winterjas',
                brand: 'Warm',
                category: 'outerwear',
                color: 'black',
                style: 'casual',
                season: 'winter',
                image: 'https://images.unsplash.com/photo-1544923246-77307dd628b1?w=400&h=500&fit=crop',
                favorite: false,
                wearCount: 15,
                icon: 'fa-vest'
            },
            
            // ===== ACCESSORIES =====
            {
                id: '20',
                name: 'Bruine Riem',
                brand: 'Leather',
                category: 'accessories',
                color: 'brown',
                style: 'casual',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
                favorite: false,
                wearCount: 50,
                icon: 'fa-ring'
            },
            {
                id: '21',
                name: 'Zilveren Horloge',
                brand: 'Time',
                category: 'accessories',
                color: 'gray',
                style: 'elegant',
                season: 'all',
                image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop',
                favorite: true,
                wearCount: 60,
                icon: 'fa-clock'
            }
        ];
    },

    getMockOutfits() {
        return [
            {
                id: 'outfit1',
                name: 'Casual Day',
                items: {
                    tops: '1',      // Wit T-Shirt
                    bottoms: '7',   // Blauwe Jeans
                    shoes: '11',    // Witte Sneakers
                    outerwear: '17' // Denim Jacket
                },
                occasion: 'casual',
                dateCreated: new Date().toISOString()
            },
            {
                id: 'outfit2',
                name: 'Business Meeting',
                items: {
                    tops: '3',      // Blauw Overhemd
                    bottoms: '10',  // Grijze Pantalon
                    shoes: '14',    // Zwarte Schoenen
                    outerwear: '16' // Navy Blazer
                },
                occasion: 'work',
                dateCreated: new Date().toISOString()
            },
            {
                id: 'outfit3',
                name: 'Night Out',
                items: {
                    tops: '2',      // Zwart T-Shirt
                    bottoms: '8',   // Zwarte Jeans
                    shoes: '11',    // Witte Sneakers
                    outerwear: '15' // Zwart Leren Jack
                },
                occasion: 'casual',
                dateCreated: new Date().toISOString()
            }
        ];
    },

    // Helper functies
    getClothingById(id) {
        const items = this.getClothing();
        return items.find(item => item.id === id);
    },

    // Kleur categorieën voor matching
    colorCategories: {
        neutral: ['white', 'black', 'gray', 'beige', 'brown'],
        warm: ['red', 'orange', 'yellow', 'pink'],
        cool: ['blue', 'green', 'purple'],
        dark: ['black', 'brown'],
        bright: ['pink', 'yellow', 'orange', 'green']
    },

    // Check of kleuren bij elkaar passen
    doColorsMatch(color1, color2) {
        // Neutrale kleuren passen bij alles
        if (this.colorCategories.neutral.includes(color1) || 
            this.colorCategories.neutral.includes(color2)) {
            return true;
        }
        
        // Check of ze in dezelfde categorie zitten
        for (const category of Object.values(this.colorCategories)) {
            if (category.includes(color1) && category.includes(color2)) {
                return true;
            }
        }
        
        return false;
    },

    // Seizoen helpers
    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'spring'; // herfst = spring in de app
        return 'winter';
    },

    isSeasonAppropriate(itemSeason) {
        if (itemSeason === 'all') return true;
        return itemSeason === this.getCurrentSeason();
    }
};

// Trends data met shopping suggesties
const TrendsData = {
    trends: [
        {
            id: 't1',
            name: 'Quiet Luxury',
            description: 'Minimalistische elegantie',
            colors: ['beige', 'white', 'gray'],
            icon: 'fa-gem',
            image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=250&fit=crop'
        },
        {
            id: 't2',
            name: 'Bold Colors',
            description: 'Opvallende kleuren combineren',
            colors: ['red', 'blue', 'yellow'],
            icon: 'fa-palette',
            image: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=250&fit=crop'
        },
        {
            id: 't3',
            name: 'Layering',
            description: 'Lagen voor diepte',
            colors: ['all'],
            icon: 'fa-layer-group',
            image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=250&fit=crop'
        },
        {
            id: 't4',
            name: 'Athleisure',
            description: 'Sport meets casual',
            colors: ['black', 'white', 'gray'],
            icon: 'fa-running',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=250&fit=crop'
        },
        {
            id: 't5',
            name: 'Sustainable',
            description: 'Duurzame keuzes',
            colors: ['green', 'brown', 'beige'],
            icon: 'fa-leaf',
            image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=250&fit=crop'
        }
    ],

    // Shopping suggesties - koopbare sets met verschillende thema's
    shoppingSets: [
        {
            id: 'shop1',
            name: 'Complete Winter Look',
            description: 'Warm en stijlvol de winter door',
            totalPrice: '€299,00',
            originalPrice: '€349,00',
            discount: '-15%',
            items: [
                { name: 'Wollen Trui', brand: 'COS', price: '€89,00', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Donzen Jas', brand: 'ARKET', price: '€179,00', image: 'https://images.unsplash.com/photo-1544923246-77307dd628b1?w=150&h=180&fit=crop', category: 'outerwear' },
                { name: 'Wollen Sjaal', brand: 'COS', price: '€49,00', image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=150&h=180&fit=crop', category: 'accessories' }
            ],
            shop: 'zalando',
            link: 'https://www.zalando.nl'
        },
        {
            id: 'shop2',
            name: 'Smart Casual Set',
            description: 'Perfect voor kantoor of diner',
            totalPrice: '€189,00',
            discount: null,
            items: [
                { name: 'Oxford Overhemd', brand: 'GANT', price: '€79,00', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Chino Broek', brand: 'DOCKERS', price: '€69,00', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Leren Riem', brand: 'TOMMY', price: '€41,00', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=180&fit=crop', category: 'accessories' }
            ],
            shop: 'aboutyou',
            link: 'https://www.aboutyou.nl'
        },
        {
            id: 'shop3',
            name: 'Weekend Vibes',
            description: 'Relaxed maar stijlvol',
            totalPrice: '€159,00',
            originalPrice: '€199,00',
            discount: '-20%',
            items: [
                { name: 'Basic T-shirt', brand: 'ARKET', price: '€29,00', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Slim Jeans', brand: "LEVI'S", price: '€89,00', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Witte Sneakers', brand: 'VEJA', price: '€129,00', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&h=180&fit=crop', category: 'shoes' }
            ],
            shop: 'zalando',
            link: 'https://www.zalando.nl'
        },
        {
            id: 'shop4',
            name: 'Date Night',
            description: 'Maak indruk op je date',
            totalPrice: '€249,00',
            discount: null,
            items: [
                { name: 'Zwarte Blazer', brand: 'ZARA', price: '€89,00', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=180&fit=crop', category: 'outerwear' },
                { name: 'Zwarte Pantalon', brand: 'MANGO', price: '€49,00', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Chelsea Boots', brand: 'VAGABOND', price: '€119,00', image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=150&h=180&fit=crop', category: 'shoes' }
            ],
            shop: 'aboutyou',
            link: 'https://www.aboutyou.nl'
        },
        {
            id: 'shop5',
            name: 'Budget Basics',
            description: 'Essentials zonder de bank te breken',
            totalPrice: '€49,99',
            originalPrice: '€79,99',
            discount: '-37%',
            items: [
                { name: 'Basic T-shirt Pack', brand: 'H&M', price: '€19,99', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Slim Fit Jeans', brand: 'PRIMARK', price: '€18,00', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Canvas Sneakers', brand: 'H&M', price: '€12,00', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&h=180&fit=crop', category: 'shoes' }
            ],
            shop: 'zalando',
            link: 'https://www.zalando.nl'
        },
        {
            id: 'shop6',
            name: 'Athleisure Outfit',
            description: 'Van gym naar straat',
            totalPrice: '€129,00',
            discount: '-10%',
            items: [
                { name: 'Tech Hoodie', brand: 'NIKE', price: '€69,00', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Jogger Pants', brand: 'ADIDAS', price: '€49,00', image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Running Shoes', brand: 'NEW BALANCE', price: '€99,00', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=180&fit=crop', category: 'shoes' }
            ],
            shop: 'aboutyou',
            link: 'https://www.aboutyou.nl'
        },
        {
            id: 'shop7',
            name: 'Luxe Minimalist',
            description: 'Investeer in tijdloze stukken',
            totalPrice: '€599,00',
            discount: null,
            items: [
                { name: 'Kasjmier Trui', brand: 'LORO PIANA', price: '€299,00', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Premium Jeans', brand: 'A.P.C.', price: '€195,00', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Leren Schoenen', brand: 'COMMON PROJECTS', price: '€395,00', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=150&h=180&fit=crop', category: 'shoes' }
            ],
            shop: 'zalando',
            link: 'https://www.zalando.nl'
        },
        {
            id: 'shop8',
            name: 'Zomerse Vibes',
            description: 'Klaar voor warme dagen',
            totalPrice: '€89,00',
            originalPrice: '€119,00',
            discount: '-25%',
            items: [
                { name: 'Linnen Shirt', brand: 'MANGO', price: '€39,00', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&h=180&fit=crop', category: 'tops' },
                { name: 'Korte Broek', brand: 'ZARA', price: '€29,00', image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=150&h=180&fit=crop', category: 'bottoms' },
                { name: 'Espadrilles', brand: 'CASTAÑER', price: '€69,00', image: 'https://images.unsplash.com/photo-1604001307862-2d953b875079?w=150&h=180&fit=crop', category: 'shoes' }
            ],
            shop: 'aboutyou',
            link: 'https://www.aboutyou.nl'
        }
    ],

    // Losse items om je garderobe aan te vullen - uitgebreide collectie met prijsklassen
    shoppingItems: [
        // Budget opties (€)
        { id: 'si1', name: 'Basic Wit T-shirt', brand: 'H&M', price: '€12,99', originalPrice: '€17,99', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=180&fit=crop', category: 'tops', color: 'white', style: 'casual', priceCategory: 'budget', reason: 'Basis item dat iedereen nodig heeft' },
        { id: 'si2', name: 'Zwart Basic T-shirt', brand: 'H&M', price: '€12,99', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=150&h=180&fit=crop', category: 'tops', color: 'black', style: 'casual', priceCategory: 'budget', reason: 'Combineer met alles' },
        { id: 'si3', name: 'Grijze Jogger', brand: 'PRIMARK', price: '€15,00', image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=150&h=180&fit=crop', category: 'bottoms', color: 'gray', style: 'sport', priceCategory: 'budget', reason: 'Perfect voor thuis of sport' },
        
        // Middensegment (€€)
        { id: 'si4', name: 'Donkerblauwe Jeans', brand: "LEVI'S", price: '€99,00', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=150&h=180&fit=crop', category: 'bottoms', color: 'blue', style: 'casual', priceCategory: 'mid', reason: 'Past bij alles' },
        { id: 'si5', name: 'Witte Sneakers', brand: 'VEJA', price: '€135,00', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150&h=180&fit=crop', category: 'shoes', color: 'white', style: 'casual', priceCategory: 'mid', reason: 'Tijdloze klassieker' },
        { id: 'si6', name: 'Beige Chino', brand: 'DOCKERS', price: '€69,00', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=150&h=180&fit=crop', category: 'bottoms', color: 'beige', style: 'casual', priceCategory: 'mid', reason: 'Smart casual basis' },
        { id: 'si7', name: 'Kasjmier Trui', brand: 'UNIQLO', price: '€79,00', image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=150&h=180&fit=crop', category: 'tops', color: 'gray', style: 'elegant', priceCategory: 'mid', reason: 'Luxe basics voor winter' },
        { id: 'si8', name: 'Lichtblauw Overhemd', brand: 'GANT', price: '€89,00', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=150&h=180&fit=crop', category: 'tops', color: 'blue', style: 'formal', priceCategory: 'mid', reason: 'Essentieel voor kantoor' },
        { id: 'si9', name: 'Bruine Enkellaarsjes', brand: 'CLARKS', price: '€119,00', image: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=150&h=180&fit=crop', category: 'shoes', color: 'brown', style: 'elegant', priceCategory: 'mid', reason: 'Van werk tot weekend' },
        { id: 'si10', name: 'Navy Bomber Jacket', brand: 'JACK & JONES', price: '€89,00', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=150&h=180&fit=crop', category: 'outerwear', color: 'blue', style: 'casual', priceCategory: 'mid', reason: 'Stoere jas voor elk seizoen' },
        
        // Premium (€€€)
        { id: 'si11', name: 'Navy Blazer', brand: 'SUITSUPPLY', price: '€299,00', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&h=180&fit=crop', category: 'outerwear', color: 'blue', style: 'formal', priceCategory: 'premium', reason: 'Van casual tot formeel' },
        { id: 'si12', name: 'Witte Sneakers', brand: 'COMMON PROJECTS', price: '€395,00', image: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=150&h=180&fit=crop', category: 'shoes', color: 'white', style: 'elegant', priceCategory: 'premium', reason: 'Investering in kwaliteit' },
        { id: 'si13', name: 'Leren Jas', brand: 'ALLSAINTS', price: '€449,00', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=150&h=180&fit=crop', category: 'outerwear', color: 'black', style: 'casual', priceCategory: 'premium', reason: 'Tijdloos statement piece' },
        { id: 'si14', name: 'Zwarte Pantalon', brand: 'HUGO BOSS', price: '€159,00', image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=150&h=180&fit=crop', category: 'bottoms', color: 'black', style: 'formal', priceCategory: 'premium', reason: 'Perfecte pasvorm' },
        
        // Accessoires
        { id: 'si15', name: 'Leren Horloge', brand: 'DANIEL WELLINGTON', price: '€139,00', image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=150&h=180&fit=crop', category: 'accessories', color: 'brown', style: 'elegant', priceCategory: 'mid', reason: 'Completeert elke outfit' },
        { id: 'si16', name: 'Zwarte Leren Riem', brand: 'TOMMY HILFIGER', price: '€49,00', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=180&fit=crop', category: 'accessories', color: 'black', style: 'formal', priceCategory: 'mid', reason: 'Onmisbaar accessoire' },
        { id: 'si17', name: 'Wollen Sjaal', brand: 'COS', price: '€59,00', image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=150&h=180&fit=crop', category: 'accessories', color: 'gray', style: 'elegant', priceCategory: 'mid', reason: 'Warm en stijlvol' },
        { id: 'si18', name: 'Canvas Tas', brand: 'SANDQVIST', price: '€169,00', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=180&fit=crop', category: 'accessories', color: 'beige', style: 'casual', priceCategory: 'premium', reason: 'Praktisch en mooi' }
    ],

    getTrends() {
        return this.trends;
    },

    getTrendById(id) {
        return this.trends.find(t => t.id === id);
    },

    getShoppingSets() {
        return this.shoppingSets;
    },

    getShoppingItems() {
        return this.shoppingItems;
    },

    // Suggereer items die ontbreken in je kast - slimme analyse
    getMissingSuggestions() {
        const clothing = DataManager.getClothing();
        const suggestions = [];
        
        // Analyseer de kast
        const analysis = this.analyzeWardrobe(clothing);
        
        // 1. Check categorieën die ondervertegenwoordigd zijn
        const categoryNeeds = [];
        Object.entries(analysis.categoryCounts).forEach(([cat, count]) => {
            if (count < 2) {
                categoryNeeds.push({ category: cat, count, priority: 3 - count });
            }
        });
        
        // 2. Suggereer items die passen bij bestaande kleuren
        this.shoppingItems.forEach(item => {
            let score = 0;
            let reasons = [];
            
            // Bonus voor ontbrekende categorie
            const catNeed = categoryNeeds.find(c => c.category === item.category);
            if (catNeed) {
                score += catNeed.priority * 2;
                reasons.push(`Je hebt nog maar ${catNeed.count} ${this.getCategoryLabel(item.category)}`);
            }
            
            // Bonus als kleur past bij bestaande items
            if (analysis.colors.includes(item.color)) {
                score += 2;
                reasons.push(`Past bij je ${item.color} items`);
            }
            
            // Bonus voor complementaire kleuren
            if (this.isComplementaryColor(item.color, analysis.colors)) {
                score += 1;
                reasons.push('Complementaire kleur');
            }
            
            // Bonus als stijl past
            if (analysis.styles.includes(item.style)) {
                score += 1;
                reasons.push(`Past bij je ${item.style} stijl`);
            }
            
            // Voeg toe aan suggesties als score > 0
            if (score > 0) {
                suggestions.push({
                    ...item,
                    score,
                    reason: reasons[0] || item.reason
                });
            }
        });

        // Sorteer op score en return top 5
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    },

    // Analyseer wat er in de kledingkast zit
    analyzeWardrobe(clothing) {
        const colors = [...new Set(clothing.map(i => i.color).filter(Boolean))];
        const styles = [...new Set(clothing.map(i => i.style).filter(Boolean))];
        const categoryCounts = {
            tops: clothing.filter(i => i.category === 'tops').length,
            bottoms: clothing.filter(i => i.category === 'bottoms').length,
            shoes: clothing.filter(i => i.category === 'shoes').length,
            outerwear: clothing.filter(i => i.category === 'outerwear').length,
            accessories: clothing.filter(i => i.category === 'accessories').length
        };
        
        return { colors, styles, categoryCounts };
    },

    // Check of een kleur complementair is
    isComplementaryColor(newColor, existingColors) {
        const complementary = {
            blue: ['beige', 'white', 'brown', 'gray'],
            black: ['white', 'beige', 'gray'],
            white: ['black', 'blue', 'gray', 'beige'],
            gray: ['blue', 'white', 'black'],
            beige: ['blue', 'brown', 'white', 'black'],
            brown: ['blue', 'beige', 'white']
        };
        
        return existingColors.some(color => complementary[color]?.includes(newColor));
    },

    // Nederlandse categorie labels
    getCategoryLabel(category) {
        const labels = {
            tops: 'bovenstukken',
            bottoms: 'broeken',
            shoes: 'schoenen',
            outerwear: 'jassen',
            accessories: 'accessoires'
        };
        return labels[category] || category;
    },

    // Suggesties die specifiek matchen met items in de kast
    getMatchingSuggestions() {
        const clothing = DataManager.getClothing();
        const matches = [];
        
        // Vind items die passen bij specifieke kledingstukken
        clothing.forEach(wardrobeItem => {
            const compatibleItems = this.shoppingItems.filter(shopItem => {
                // Zoek complementaire items
                if (wardrobeItem.category === 'tops' && shopItem.category === 'bottoms') {
                    return this.colorsMatch(wardrobeItem.color, shopItem.color);
                }
                if (wardrobeItem.category === 'bottoms' && shopItem.category === 'tops') {
                    return this.colorsMatch(wardrobeItem.color, shopItem.color);
                }
                if (wardrobeItem.category === 'outerwear' && shopItem.category === 'tops') {
                    return this.colorsMatch(wardrobeItem.color, shopItem.color);
                }
                return false;
            });
            
            compatibleItems.forEach(shopItem => {
                matches.push({
                    ...shopItem,
                    matchWith: wardrobeItem,
                    reason: `Past perfect bij je ${wardrobeItem.name}`
                });
            });
        });
        
        // Return unieke suggesties (max 4)
        const uniqueMatches = [];
        const seenIds = new Set();
        matches.forEach(m => {
            if (!seenIds.has(m.id)) {
                seenIds.add(m.id);
                uniqueMatches.push(m);
            }
        });
        
        return uniqueMatches.slice(0, 4);
    },

    // Check of kleuren goed bij elkaar passen
    colorsMatch(color1, color2) {
        const matchMatrix = {
            white: ['blue', 'black', 'gray', 'beige', 'brown'],
            black: ['white', 'gray', 'beige', 'blue'],
            gray: ['white', 'black', 'blue', 'beige'],
            blue: ['white', 'black', 'beige', 'gray', 'brown'],
            beige: ['white', 'black', 'blue', 'brown', 'gray'],
            brown: ['white', 'beige', 'blue', 'gray']
        };
        
        return matchMatrix[color1]?.includes(color2) || matchMatrix[color2]?.includes(color1);
    },

    // Filter items op prijsklasse
    getItemsByPriceCategory(priceCategory) {
        return this.shoppingItems.filter(item => item.priceCategory === priceCategory);
    }
};

// Initialiseer data bij laden
document.addEventListener('DOMContentLoaded', () => {
    DataManager.init();
});
