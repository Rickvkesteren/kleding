/**
 * StyleMate - Smart Outfit Suggester
 * Intelligent outfit recommendations with color matching, style consistency, and season filtering
 */

const SmartSuggester = {
    // Color wheel for complementary colors
    colorWheel: {
        'rood': { complementary: ['groen', 'blauw'], analogous: ['oranje', 'roze', 'bordeaux'], neutral: ['zwart', 'wit', 'grijs', 'beige'] },
        'blauw': { complementary: ['oranje', 'beige'], analogous: ['navy', 'groen'], neutral: ['zwart', 'wit', 'grijs'] },
        'groen': { complementary: ['rood', 'roze'], analogous: ['blauw', 'geel'], neutral: ['zwart', 'wit', 'grijs', 'bruin', 'beige'] },
        'geel': { complementary: ['paars', 'navy'], analogous: ['oranje', 'groen'], neutral: ['zwart', 'wit', 'grijs', 'bruin'] },
        'oranje': { complementary: ['blauw', 'navy'], analogous: ['rood', 'geel', 'bruin'], neutral: ['zwart', 'wit', 'grijs', 'beige'] },
        'roze': { complementary: ['groen'], analogous: ['rood', 'bordeaux', 'wit'], neutral: ['zwart', 'wit', 'grijs', 'navy'] },
        'bruin': { complementary: ['blauw'], analogous: ['beige', 'oranje'], neutral: ['zwart', 'wit', 'grijs', 'groen'] },
        'beige': { complementary: ['navy', 'blauw'], analogous: ['bruin', 'wit'], neutral: ['zwart', 'wit', 'grijs', 'groen', 'bordeaux'] },
        'navy': { complementary: ['oranje', 'beige', 'geel'], analogous: ['blauw', 'grijs'], neutral: ['wit', 'grijs', 'beige'] },
        'bordeaux': { complementary: ['groen', 'beige'], analogous: ['rood', 'roze', 'bruin'], neutral: ['zwart', 'wit', 'grijs', 'navy'] },
        'zwart': { complementary: [], analogous: ['grijs'], neutral: ['wit', 'rood', 'blauw', 'geel', 'roze', 'beige'] },
        'wit': { complementary: [], analogous: ['beige', 'grijs'], neutral: ['zwart', 'navy', 'blauw', 'rood', 'roze'] },
        'grijs': { complementary: [], analogous: ['zwart', 'wit', 'navy'], neutral: ['rood', 'blauw', 'roze', 'geel'] }
    },

    // Style categories and their compatible items
    styleCategories: {
        zakelijk: {
            keywords: ['blazer', 'overhemd', 'pantalon', 'nette', 'werk', 'zakelijk', 'business', 'colbert', 'blouse', 'kostuum'],
            incompatible: ['sport', 'jogging', 'sneaker', 'hoodie', 'training', 'gym'],
            colors: ['zwart', 'wit', 'grijs', 'navy', 'blauw', 'beige', 'bordeaux']
        },
        casual: {
            keywords: ['casual', 't-shirt', 'jeans', 'sneaker', 'sweater', 'hoodie', 'relax', 'comfy'],
            incompatible: ['blazer', 'colbert', 'kostuum', 'nette'],
            colors: [] // All colors allowed
        },
        sport: {
            keywords: ['sport', 'training', 'gym', 'fitness', 'jogging', 'running', 'workout', 'legging'],
            incompatible: ['blazer', 'pantalon', 'nette', 'overhemd', 'blouse', 'hakken'],
            colors: ['zwart', 'wit', 'grijs', 'blauw', 'rood', 'groen', 'oranje']
        },
        feest: {
            keywords: ['feest', 'party', 'uitgaan', 'club', 'chic', 'elegant', 'glitter', 'jurk', 'hakken'],
            incompatible: ['sport', 'jogging', 'training', 'gym'],
            colors: ['zwart', 'wit', 'rood', 'bordeaux', 'navy', 'roze', 'goud']
        }
    },

    // Season mappings
    seasonMonths: {
        summer: [5, 6, 7, 8],     // June-August
        winter: [11, 0, 1, 2],    // December-February
        spring: [2, 3, 4],        // March-May
        fall: [8, 9, 10]          // September-November
    },

    /**
     * Generate smart outfit suggestion
     */
    generateOutfit(wardrobe, options = {}) {
        const {
            weather = null,
            dayType = 'casual',
            preferredColors = [],
            avoidRecentDays = 3
        } = options;

        // Get current season
        const currentSeason = this.getCurrentSeason();
        
        // Filter wardrobe by availability and season
        let availableItems = wardrobe.filter(item => {
            // Skip items in the wash or recently worn
            if (item.status === 'washing') return false;
            
            // Check if recently worn
            if (item.lastWorn && avoidRecentDays > 0) {
                const daysSinceWorn = (Date.now() - new Date(item.lastWorn).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceWorn < avoidRecentDays) return false;
            }

            // Season filter
            if (!this.isSeasonAppropriate(item, currentSeason)) return false;

            return true;
        });

        // Categorize available items
        const categories = {
            outerwear: availableItems.filter(i => i.category === 'outerwear'),
            tops: availableItems.filter(i => i.category === 'tops'),
            bottoms: availableItems.filter(i => i.category === 'bottoms'),
            shoes: availableItems.filter(i => i.category === 'shoes'),
            accessories: availableItems.filter(i => i.category === 'accessories')
        };

        // Apply style filtering based on day type
        const styleFiltered = this.filterByStyle(categories, dayType);

        // Apply weather filtering
        const weatherFiltered = this.filterByWeather(styleFiltered, weather);

        // Select base item (usually top or bottom) and build around it
        const outfit = this.buildColorCoordinatedOutfit(weatherFiltered, preferredColors, weather);

        // Calculate outfit score
        outfit.score = this.calculateOutfitScore(outfit, dayType);
        outfit.tips = this.generateOutfitTips(outfit, dayType, weather);

        return outfit;
    },

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (this.seasonMonths.summer.includes(month)) return 'summer';
        if (this.seasonMonths.winter.includes(month)) return 'winter';
        if (this.seasonMonths.spring.includes(month)) return 'spring';
        return 'fall';
    },

    isSeasonAppropriate(item, currentSeason) {
        const itemSeason = item.season || 'all';
        
        if (itemSeason === 'all') return true;
        if (itemSeason === currentSeason) return true;
        
        // Spring items ok in summer, fall items ok in winter
        if (itemSeason === 'spring' && (currentSeason === 'summer' || currentSeason === 'spring')) return true;
        if (itemSeason === 'fall' && (currentSeason === 'winter' || currentSeason === 'fall')) return true;
        
        return false;
    },

    filterByStyle(categories, dayType) {
        const style = this.styleCategories[dayType] || this.styleCategories.casual;
        const filtered = {};

        for (const [category, items] of Object.entries(categories)) {
            filtered[category] = items.filter(item => {
                const itemText = `${item.name || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
                
                // Check if item matches the style
                const matchesStyle = style.keywords.some(kw => itemText.includes(kw));
                
                // Check if item is incompatible with style
                const isIncompatible = style.incompatible.some(kw => itemText.includes(kw));
                
                // If explicitly incompatible, exclude
                if (isIncompatible) return false;
                
                // If we have style-matching items, prefer those
                // But don't exclude neutral items
                return true;
            });

            // If filtering left us with nothing, fall back to all items
            if (filtered[category].length === 0) {
                filtered[category] = items;
            }
        }

        return filtered;
    },

    filterByWeather(categories, weather) {
        if (!weather) return categories;

        const temp = weather.temp;
        const condition = weather.condition;
        const filtered = {};

        for (const [category, items] of Object.entries(categories)) {
            filtered[category] = items.filter(item => {
                const itemText = `${item.name || ''} ${(item.tags || []).join(' ')}`.toLowerCase();

                // Temperature-based filtering
                if (temp > 25) {
                    // Hot weather - no heavy items
                    if (itemText.includes('wol') || itemText.includes('fleece') || 
                        itemText.includes('dikke') || itemText.includes('winter')) return false;
                }
                
                if (temp < 10) {
                    // Cold weather - prefer warm items
                    if (category === 'outerwear') {
                        // Prefer warm jackets
                        const isWarm = itemText.includes('winter') || itemText.includes('wol') || 
                                       itemText.includes('dons') || itemText.includes('warm');
                        // Don't exclude, but we'll prefer warm items later
                    }
                }

                // Rain - prefer waterproof
                if (condition === 'rainy') {
                    if (category === 'shoes' && (itemText.includes('suede') || itemText.includes('canvas'))) {
                        return false; // Don't suggest suede/canvas in rain
                    }
                }

                return true;
            });

            if (filtered[category].length === 0) {
                filtered[category] = items;
            }
        }

        return filtered;
    },

    buildColorCoordinatedOutfit(categories, preferredColors, weather) {
        const outfit = {
            outerwear: null,
            top: null,
            bottom: null,
            shoes: null,
            accessories: null
        };

        // Start with a random base item (usually top)
        const baseItem = this.selectRandomItem(categories.tops);
        if (baseItem) {
            outfit.top = baseItem;
            
            // Get colors that go well with the top
            const topColor = baseItem.color || 'grijs';
            const compatibleColors = this.getCompatibleColors(topColor);
            
            // Select bottom that matches
            outfit.bottom = this.selectMatchingItem(categories.bottoms, compatibleColors, topColor);
            
            // Select shoes
            const usedColors = [topColor, outfit.bottom?.color].filter(Boolean);
            const shoeColors = this.getCompatibleColors(usedColors[0], usedColors);
            outfit.shoes = this.selectMatchingItem(categories.shoes, shoeColors, topColor);
            
            // Select outerwear if cold
            if (weather && weather.temp < 18) {
                const outerColors = ['zwart', 'navy', 'grijs', 'beige', ...compatibleColors.slice(0, 2)];
                outfit.outerwear = this.selectMatchingItem(categories.outerwear, outerColors, topColor);
            }
        } else {
            // Fallback to random selection
            outfit.top = this.selectRandomItem(categories.tops);
            outfit.bottom = this.selectRandomItem(categories.bottoms);
            outfit.shoes = this.selectRandomItem(categories.shoes);
            if (weather && weather.temp < 18) {
                outfit.outerwear = this.selectRandomItem(categories.outerwear);
            }
        }

        return outfit;
    },

    getCompatibleColors(baseColor, excludeColors = []) {
        const colorInfo = this.colorWheel[baseColor] || this.colorWheel['grijs'];
        
        // Combine all compatible colors with preference order
        let compatible = [
            ...colorInfo.neutral,
            ...colorInfo.analogous,
            ...colorInfo.complementary
        ];

        // Remove duplicates and excluded colors
        compatible = [...new Set(compatible)].filter(c => !excludeColors.includes(c));

        return compatible;
    },

    selectMatchingItem(items, preferredColors, baseColor) {
        if (!items || items.length === 0) return null;

        // Score each item based on color compatibility
        const scored = items.map(item => {
            const itemColor = item.color || 'grijs';
            let score = 0;

            // Neutral colors always work
            if (['zwart', 'wit', 'grijs', 'beige', 'navy'].includes(itemColor)) {
                score += 50;
            }

            // Check if in preferred colors list
            const colorIndex = preferredColors.indexOf(itemColor);
            if (colorIndex !== -1) {
                score += 100 - (colorIndex * 10); // Earlier in list = higher score
            }

            // Same color can work but lower score
            if (itemColor === baseColor) {
                score += 20; // Monochrome is ok but not preferred
            }

            // Bonus for items worn less
            if (item.wearCount !== undefined) {
                score += Math.max(0, 20 - item.wearCount);
            }

            return { item, score };
        });

        // Sort by score and pick best
        scored.sort((a, b) => b.score - a.score);
        
        // Add some randomness to top choices
        const topChoices = scored.slice(0, Math.min(3, scored.length));
        return topChoices[Math.floor(Math.random() * topChoices.length)]?.item || null;
    },

    selectRandomItem(items) {
        if (!items || items.length === 0) return null;
        return items[Math.floor(Math.random() * items.length)];
    },

    calculateOutfitScore(outfit, dayType) {
        let score = 0;
        const items = [outfit.outerwear, outfit.top, outfit.bottom, outfit.shoes].filter(Boolean);

        if (items.length === 0) return 0;

        // Check color harmony
        const colors = items.map(i => i.color).filter(Boolean);
        score += this.calculateColorHarmony(colors) * 40;

        // Check style consistency
        score += this.calculateStyleConsistency(items, dayType) * 30;

        // Check variety (not all same color)
        const uniqueColors = [...new Set(colors)];
        if (uniqueColors.length >= 2) score += 20;
        if (uniqueColors.length >= 3) score += 10;

        return Math.min(100, Math.round(score));
    },

    calculateColorHarmony(colors) {
        if (colors.length < 2) return 1;

        let harmonyScore = 0;
        let comparisons = 0;

        for (let i = 0; i < colors.length; i++) {
            for (let j = i + 1; j < colors.length; j++) {
                comparisons++;
                if (this.colorsMatch(colors[i], colors[j])) {
                    harmonyScore += 1;
                }
            }
        }

        return comparisons > 0 ? harmonyScore / comparisons : 1;
    },

    colorsMatch(color1, color2) {
        if (!color1 || !color2) return true;
        if (color1 === color2) return true;
        
        const info = this.colorWheel[color1];
        if (!info) return true;

        return info.neutral.includes(color2) || 
               info.analogous.includes(color2) || 
               info.complementary.includes(color2);
    },

    calculateStyleConsistency(items, dayType) {
        const style = this.styleCategories[dayType] || this.styleCategories.casual;
        let consistent = 0;

        items.forEach(item => {
            const itemText = `${item.name || ''} ${(item.tags || []).join(' ')}`.toLowerCase();
            const isIncompatible = style.incompatible.some(kw => itemText.includes(kw));
            if (!isIncompatible) consistent++;
        });

        return items.length > 0 ? consistent / items.length : 1;
    },

    generateOutfitTips(outfit, dayType, weather) {
        const tips = [];
        const items = [outfit.outerwear, outfit.top, outfit.bottom, outfit.shoes].filter(Boolean);
        const colors = items.map(i => i.color).filter(Boolean);

        // Color tips
        const uniqueColors = [...new Set(colors)];
        if (uniqueColors.length === 1 && items.length > 2) {
            tips.push('💡 Voeg een accessoire in een contrastkleur toe voor meer variatie');
        }

        // Weather tips
        if (weather) {
            if (weather.temp < 10 && !outfit.outerwear) {
                tips.push('🧥 Vergeet je warme jas niet!');
            }
            if (weather.condition === 'rainy') {
                tips.push('☔ Neem een paraplu mee');
            }
        }

        // Style tips
        if (dayType === 'zakelijk') {
            const hasNeutrals = colors.some(c => ['zwart', 'wit', 'grijs', 'navy'].includes(c));
            if (!hasNeutrals) {
                tips.push('👔 Overweeg een neutraal item voor een zakelijkere look');
            }
        }

        return tips;
    },

    /**
     * Get color combination suggestions for shopping
     */
    getSuggestedColors(wardrobe) {
        const colorCounts = {};
        wardrobe.forEach(item => {
            const color = item.color || 'grijs';
            colorCounts[color] = (colorCounts[color] || 0) + 1;
        });

        const suggestions = [];
        
        // Find colors that would complement existing wardrobe
        for (const [color, count] of Object.entries(colorCounts)) {
            if (count >= 2) {
                const info = this.colorWheel[color];
                if (info) {
                    info.complementary.forEach(c => {
                        if (!colorCounts[c] || colorCounts[c] < 2) {
                            suggestions.push({
                                color: c,
                                reason: `Past goed bij je ${color} items`
                            });
                        }
                    });
                }
            }
        }

        return suggestions.slice(0, 3);
    }
};
