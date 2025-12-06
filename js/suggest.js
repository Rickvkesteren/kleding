// Outfit suggestie systeem

const SuggestManager = {
    preferences: {
        occasion: null,
        mood: null,
        color: null
    },

    init() {
        this.bindEvents();
        this.renderTrends();
        this.renderShoppingSets();
        this.renderShoppingItems();
    },

    bindEvents() {
        // Tab navigation
        document.querySelectorAll('.suggest-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Option buttons
        document.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectOption(btn));
        });

        // Color buttons
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectColor(btn));
        });

        // Generate button
        const generateBtn = document.getElementById('generateSuggestion');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateSuggestion());
        }

        // Retry button
        const retryBtn = document.getElementById('retrySuggestion');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.showQuestions());
        }

        // Save suggestion button
        const saveBtn = document.getElementById('saveSuggestion');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSuggestion());
        }
    },

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.suggest-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Update tab content
        document.querySelectorAll('.suggest-tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(tabName + 'Tab');
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Refresh content when switching to shopping tabs
        if (tabName === 'shopping') {
            this.renderShoppingSets();
        } else if (tabName === 'items') {
            this.renderShoppingItems();
        }
    },

    selectOption(btn) {
        const question = btn.dataset.question;
        const value = btn.dataset.value;

        // Deselect others in same group
        document.querySelectorAll(`.option-btn[data-question="${question}"]`).forEach(b => {
            b.classList.remove('selected');
        });

        btn.classList.add('selected');
        this.preferences[question] = value;
    },

    selectColor(btn) {
        document.querySelectorAll('.color-btn').forEach(b => {
            b.classList.remove('selected');
        });
        btn.classList.add('selected');
        this.preferences.color = btn.dataset.value;
    },

    generateSuggestion() {
        // Get all clothing
        const allClothing = DataManager.getClothing();
        
        if (allClothing.length < 3) {
            WardrobeManager.showNotification('Voeg meer kleding toe voor suggesties! 👕');
            return;
        }

        // Get weather recommendation
        const weatherRec = WeatherManager.getClothingRecommendation();
        const needsOuterwear = WeatherManager.needsOuterwear();

        // Filter items based on preferences
        const suggestion = {
            tops: this.findBestItem('tops', allClothing),
            bottoms: this.findBestItem('bottoms', allClothing),
            shoes: this.findBestItem('shoes', allClothing),
            outerwear: needsOuterwear ? this.findBestItem('outerwear', allClothing) : null
        };

        this.currentSuggestion = suggestion;
        this.showSuggestionResult(suggestion);
    },

    findBestItem(category, allClothing) {
        let items = allClothing.filter(item => item.category === category);
        
        if (items.length === 0) return null;

        // Score items based on preferences
        items = items.map(item => {
            let score = 0;

            // Style matching
            if (this.preferences.occasion) {
                const styleMap = {
                    casual: ['casual'],
                    work: ['formal', 'elegant'],
                    sport: ['sport', 'casual'],
                    party: ['elegant', 'casual'],
                    date: ['elegant', 'casual']
                };
                if (styleMap[this.preferences.occasion]?.includes(item.style)) {
                    score += 3;
                }
            }

            // Color preference
            if (this.preferences.color) {
                const colorMatch = DataManager.colorCategories[this.preferences.color];
                if (colorMatch?.includes(item.color)) {
                    score += 2;
                }
            }

            // Season appropriateness
            if (DataManager.isSeasonAppropriate(item.season)) {
                score += 2;
            }

            // Weather appropriateness
            const weatherRec = WeatherManager.getClothingRecommendation();
            if (item.season === weatherRec || item.season === 'all') {
                score += 1;
            }

            return { ...item, score };
        });

        // Sort by score and get best
        items.sort((a, b) => b.score - a.score);
        
        // Add some randomness among top items
        const topItems = items.slice(0, Math.min(3, items.length));
        return topItems[Math.floor(Math.random() * topItems.length)];
    },

    showSuggestionResult(suggestion) {
        const questionsSection = document.getElementById('questionsSection');
        const resultSection = document.getElementById('suggestionResult');
        const suggestedOutfit = document.getElementById('suggestedOutfit');

        // Hide questions, show result
        questionsSection.style.display = 'none';
        resultSection.style.display = 'block';

        // Build result HTML
        const categories = ['outerwear', 'tops', 'bottoms', 'shoes'];
        const labels = {
            outerwear: 'Jas',
            tops: 'Top',
            bottoms: 'Broek',
            shoes: 'Schoenen'
        };

        let html = '<div class="suggestion-section"><h4 class="section-title"><i class="fas fa-tshirt"></i> Uit je kledingkast</h4>';
        
        categories.forEach(cat => {
            const item = suggestion[cat];
            if (item) {
                const imageContent = item.image 
                    ? `<img src="${item.image}" alt="${item.name}">`
                    : `<div style="width:60px;height:60px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;border-radius:8px;"><i class="fas ${item.icon || 'fa-tshirt'}" style="font-size:1.5rem;color:#bbb;"></i></div>`;
                
                html += `
                    <div class="suggested-item own-item">
                        ${imageContent}
                        <div class="suggested-item-info">
                            <h4>${item.name}</h4>
                            <span>${labels[cat]} • ${WardrobeManager.getColorLabel(item.color)}</span>
                        </div>
                        <div class="item-badge own"><i class="fas fa-check"></i> In bezit</div>
                    </div>
                `;
            }
        });
        html += '</div>';

        // Add shopping suggestions that complement this outfit
        const shoppingSuggestions = this.getComplementaryShopping(suggestion);
        if (shoppingSuggestions.length > 0) {
            html += `
                <div class="suggestion-section shopping-section">
                    <h4 class="section-title"><i class="fas fa-shopping-bag"></i> Maak je outfit compleet</h4>
                    <p class="section-subtitle">Deze items passen perfect bij je look</p>
                    ${shoppingSuggestions.map(item => `
                        <div class="suggested-item shop-item" onclick="window.open('${item.affiliateLink}', '_blank')">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="suggested-item-info">
                                <h4>${item.name}</h4>
                                <span class="brand">${item.brand}</span>
                                <span class="price">${item.price}</span>
                            </div>
                            <div class="item-badge shop">
                                <i class="fas fa-external-link-alt"></i> Shop
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // Add weather advice
        const weatherAdvice = WeatherManager.getWeatherAdvice();
        if (weatherAdvice) {
            html += `<div class="weather-advice">${weatherAdvice}</div>`;
        }

        suggestedOutfit.innerHTML = html;
    },

    // Vind shopping items die bij de outfit passen
    getComplementaryShopping(outfit) {
        const shoppingItems = TrendsData.getShoppingItems();
        const suggestions = [];
        
        // Verzamel kleuren en stijlen van de outfit
        const outfitColors = [];
        const outfitStyles = [];
        Object.values(outfit).forEach(item => {
            if (item) {
                if (item.color) outfitColors.push(item.color);
                if (item.style) outfitStyles.push(item.style);
            }
        });

        // Vind complementaire items
        shoppingItems.forEach(shopItem => {
            let score = 0;
            
            // Check of kleur past bij outfit
            if (TrendsData.colorsMatch && outfitColors.some(c => TrendsData.colorsMatch(c, shopItem.color))) {
                score += 2;
            }
            
            // Check of stijl past
            if (outfitStyles.includes(shopItem.style)) {
                score += 1;
            }
            
            // Check of dit type item ontbreekt in outfit
            const hasCategory = Object.values(outfit).some(i => i && i.category === shopItem.category);
            if (!hasCategory) {
                score += 2; // Bonus voor ontbrekende categorie
            }
            
            // Accessoires krijgen altijd een bonus (completeren outfit)
            if (shopItem.category === 'accessories') {
                score += 2;
            }

            if (score > 0) {
                suggestions.push({
                    ...shopItem,
                    score,
                    affiliateLink: this.getAffiliateLink(shopItem)
                });
            }
        });

        // Sorteer op score en return top 3
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    },

    // Genereer affiliate links (placeholder - zou echte affiliate links bevatten)
    getAffiliateLink(item) {
        const affiliateLinks = {
            'H&M': 'https://www2.hm.com/nl_nl/index.html?utm_source=outfit_app',
            'PRIMARK': 'https://www.primark.com/nl-nl?utm_source=outfit_app',
            "LEVI'S": 'https://www.levi.com/NL/nl_NL/?utm_source=outfit_app',
            'VEJA': 'https://www.veja-store.com/nl/?utm_source=outfit_app',
            'DOCKERS': 'https://www.dockers.com/NL/nl_NL/?utm_source=outfit_app',
            'UNIQLO': 'https://www.uniqlo.com/nl/nl/?utm_source=outfit_app',
            'GANT': 'https://www.gant.nl/?utm_source=outfit_app',
            'CLARKS': 'https://www.clarks.nl/?utm_source=outfit_app',
            'JACK & JONES': 'https://www.jackjones.com/nl/nl/?utm_source=outfit_app',
            'SUITSUPPLY': 'https://suitsupply.com/nl-nl/?utm_source=outfit_app',
            'COMMON PROJECTS': 'https://www.commonprojects.com/?utm_source=outfit_app',
            'ALLSAINTS': 'https://www.allsaints.com/nl/?utm_source=outfit_app',
            'HUGO BOSS': 'https://www.hugoboss.com/nl/?utm_source=outfit_app',
            'DANIEL WELLINGTON': 'https://www.danielwellington.com/nl/?utm_source=outfit_app',
            'TOMMY HILFIGER': 'https://nl.tommy.com/?utm_source=outfit_app',
            'COS': 'https://www.cos.com/nl-nl/?utm_source=outfit_app',
            'SANDQVIST': 'https://www.sandqvist.com/nl/?utm_source=outfit_app'
        };
        
        return affiliateLinks[item.brand] || `https://www.zalando.nl/catalogus/?q=${encodeURIComponent(item.name)}&utm_source=outfit_app`;
    },

    showQuestions() {
        const questionsSection = document.getElementById('questionsSection');
        const resultSection = document.getElementById('suggestionResult');

        questionsSection.style.display = 'block';
        resultSection.style.display = 'none';

        // Reset preferences
        this.preferences = { occasion: null, mood: null, color: null };
        document.querySelectorAll('.option-btn, .color-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
    },

    saveSuggestion() {
        if (!this.currentSuggestion) return;

        // Create outfit with item IDs
        const items = {};
        for (const [category, item] of Object.entries(this.currentSuggestion)) {
            items[category] = item ? item.id : null;
        }

        const occasion = this.preferences.occasion || 'casual';
        const name = `${this.getOccasionLabel(occasion)} Look`;

        OutfitsManager.saveOutfit(name, items, occasion);
        WardrobeManager.showNotification(`"${name}" opgeslagen! 🎉`);
        
        this.showQuestions();
    },

    getOccasionLabel(occasion) {
        const labels = {
            casual: 'Casual',
            work: 'Werk',
            sport: 'Sport',
            party: 'Feest',
            date: 'Date'
        };
        return labels[occasion] || 'Mijn';
    },

    renderTrends() {
        const container = document.getElementById('trendCards');
        if (!container) return;

        const trends = TrendsData.getTrends();
        
        container.innerHTML = trends.map(trend => `
            <div class="trend-card" data-trend="${trend.id}">
                ${trend.image 
                    ? `<img src="${trend.image}" alt="${trend.name}">`
                    : `<div style="height:100px;background:linear-gradient(135deg, ${this.getTrendGradient(trend.colors)});display:flex;align-items:center;justify-content:center;">
                        <i class="fas ${trend.icon}" style="font-size:2.5rem;color:white;"></i>
                    </div>`
                }
                <div class="trend-card-info">
                    <h4>${trend.name}</h4>
                    <span>${trend.description}</span>
                </div>
            </div>
        `).join('');

        // Bind click events
        container.querySelectorAll('.trend-card').forEach(card => {
            card.addEventListener('click', () => this.applyTrend(card.dataset.trend));
        });
    },

    getTrendGradient(colors) {
        const colorMap = {
            beige: '#f5f5dc',
            white: '#ffffff',
            gray: '#808080',
            black: '#2d3436',
            red: '#e74c3c',
            blue: '#3498db',
            yellow: '#f1c40f',
            green: '#27ae60',
            brown: '#8b4513',
            all: '#6c5ce7'
        };

        if (colors.length === 1) {
            return `${colorMap[colors[0]] || colors[0]}, ${colorMap[colors[0]] || colors[0]}`;
        }
        
        return colors.slice(0, 2).map(c => colorMap[c] || c).join(', ');
    },

    applyTrend(trendId) {
        const trend = TrendsData.getTrendById(trendId);
        if (!trend) return;

        // Auto-select color preference based on trend
        if (trend.colors[0] !== 'all') {
            // Find matching color category
            for (const [category, colors] of Object.entries(DataManager.colorCategories)) {
                if (trend.colors.some(c => colors.includes(c))) {
                    this.preferences.color = category;
                    document.querySelectorAll('.color-btn').forEach(btn => {
                        btn.classList.toggle('selected', btn.dataset.value === category);
                    });
                    break;
                }
            }
        }

        WardrobeManager.showNotification(`${trend.name} trend toegepast! ✨`);
    },

    // ===== Shopping Functies =====
    
    renderShoppingSets() {
        const container = document.getElementById('shoppingSets');
        if (!container) return;

        const sets = TrendsData.getShoppingSets();
        
        container.innerHTML = sets.map(set => `
            <div class="shopping-set-card" data-set="${set.id}">
                <div class="shopping-set-header">
                    <div>
                        <h4>${set.name}</h4>
                        <p>${set.description}</p>
                    </div>
                    <div class="shopping-set-price">
                        <div class="price-display">
                            <span class="price">${set.totalPrice}</span>
                            ${set.originalPrice ? `<span class="original-set-price">${set.originalPrice}</span>` : ''}
                        </div>
                        ${set.discount ? `<span class="discount">${set.discount}</span>` : ''}
                    </div>
                </div>
                <div class="shopping-set-items">
                    ${set.items.map(item => `
                        <div class="shopping-set-item">
                            <img src="${item.image}" alt="${item.name}" onerror="this.style.background='#f0f0f0'">
                            <span>${item.name}</span>
                            <span class="item-price">${item.price}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="shopping-set-footer">
                    <span class="shop-badge ${set.shop}">${set.shop}</span>
                    <button class="btn-shop" onclick="window.open('${set.link}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Bekijk Set
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderShoppingItems() {
        // Render matching suggestions (past bij je kast)
        const matchingSuggestions = TrendsData.getMatchingSuggestions();
        const missingSuggestions = TrendsData.getMissingSuggestions();
        const missingContainer = document.getElementById('missingSuggestions');
        
        if (missingContainer) {
            let html = '';
            
            // Matching suggesties (past bij specifieke items)
            if (matchingSuggestions.length > 0) {
                html += `
                    <div class="matching-section">
                        <h4 style="margin-bottom: 12px; font-size: 0.9rem;">
                            <i class="fas fa-heart" style="color: #e74c3c;"></i> Past bij je kledingkast
                        </h4>
                        ${matchingSuggestions.map(item => `
                            <div class="missing-card matching-card clickable-card" onclick="window.open('${this.getAffiliateLink(item)}', '_blank')">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="missing-card-info">
                                    <h4>${item.name}</h4>
                                    <span class="reason"><i class="fas fa-link"></i> ${item.reason}</span>
                                    <span class="price">${item.price} • ${item.brand}</span>
                                </div>
                                <div class="shop-arrow"><i class="fas fa-external-link-alt"></i></div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            // Missing suggesties (ontbrekende categorieën)
            if (missingSuggestions.length > 0) {
                html += `
                    <div class="missing-section" style="margin-top: 20px;">
                        <h4 style="margin-bottom: 12px; font-size: 0.9rem;">
                            <i class="fas fa-lightbulb" style="color: #f1c40f;"></i> Suggesties voor je garderobe
                        </h4>
                        ${missingSuggestions.map(item => `
                            <div class="missing-card clickable-card" onclick="window.open('${this.getAffiliateLink(item)}', '_blank')">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="missing-card-info">
                                    <h4>${item.name}</h4>
                                    <span class="reason">${item.reason}</span>
                                    <span class="price">${item.price} • ${item.brand}</span>
                                </div>
                                <div class="shop-arrow"><i class="fas fa-external-link-alt"></i></div>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            if (html === '') {
                html = `
                    <div style="text-align: center; padding: 20px; background: #e8f5e9; border-radius: 12px; margin-bottom: 20px;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; color: #27ae60; margin-bottom: 10px;"></i>
                        <p style="color: #27ae60; font-weight: 500;">Je kledingkast is goed gevuld! 👏</p>
                    </div>
                `;
            }
            
            missingContainer.innerHTML = html;
        }

        // Render all shopping items met prijsfilter tabs
        const itemsContainer = document.getElementById('shoppingItemsGrid');
        if (itemsContainer) {
            const items = TrendsData.getShoppingItems();
            
            // Voeg prijsfilter toe als die er nog niet is
            const filterContainer = document.querySelector('.price-filter-tabs');
            if (!filterContainer) {
                const allItemsSection = document.querySelector('.all-shopping-items');
                if (allItemsSection) {
                    const filterHtml = `
                        <div class="price-filter-tabs">
                            <button class="price-filter-btn active" data-price="all">
                                <i class="fas fa-th"></i> Alles
                            </button>
                            <button class="price-filter-btn" data-price="budget">
                                <i class="fas fa-piggy-bank"></i> Budget
                            </button>
                            <button class="price-filter-btn" data-price="mid">
                                <i class="fas fa-balance-scale"></i> Middel
                            </button>
                            <button class="price-filter-btn" data-price="premium">
                                <i class="fas fa-gem"></i> Premium
                            </button>
                        </div>
                    `;
                    allItemsSection.querySelector('h4').insertAdjacentHTML('afterend', filterHtml);
                    
                    // Event listeners voor prijsfilter
                    document.querySelectorAll('.price-filter-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                            document.querySelectorAll('.price-filter-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            this.filterItemsByPrice(btn.dataset.price);
                        });
                    });
                }
            }
            
            // Render items met affiliate links
            itemsContainer.innerHTML = items.map(item => `
                <div class="shopping-item-card" data-price-category="${item.priceCategory || 'mid'}" onclick="window.open('${this.getAffiliateLink(item)}', '_blank')">
                    <div class="item-image-container">
                        <img src="${item.image}" alt="${item.name}">
                        ${item.originalPrice ? `<span class="sale-badge">SALE</span>` : ''}
                    </div>
                    <div class="shopping-item-info">
                        <h5>${item.name}</h5>
                        <span class="brand">${item.brand}</span>
                        <div class="price-row">
                            <span class="price">${item.price}</span>
                            ${item.originalPrice ? `<span class="original-price">${item.originalPrice}</span>` : ''}
                        </div>
                        <span class="price-tier ${item.priceCategory || 'mid'}">${this.getPriceTierLabel(item.priceCategory)}</span>
                    </div>
                    <div class="card-shop-icon"><i class="fas fa-shopping-cart"></i></div>
                </div>
            `).join('');
        }
    },

    filterItemsByPrice(priceCategory) {
        const cards = document.querySelectorAll('.shopping-item-card');
        cards.forEach(card => {
            if (priceCategory === 'all' || card.dataset.priceCategory === priceCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    getPriceTierLabel(tier) {
        const labels = {
            budget: '€ Budget',
            mid: '€€ Middel',
            premium: '€€€ Premium'
        };
        return labels[tier] || '€€ Middel';
    }
};

// Initialiseer bij laden
document.addEventListener('DOMContentLoaded', () => {
    SuggestManager.init();
});
