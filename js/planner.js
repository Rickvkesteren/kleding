/**
 * StyleMate - Week Planner Module
 * Handles weekly outfit planning with availability tracking
 */

const WeekPlannerManager = {
    currentWeek: [],
    forecast: [],

    // Initialize planner
    async init() {
        this.generateWeekDays();
        this.updateAvailabilityStats();
        await this.loadForecast();
        this.renderWeekDays();
        this.setupEventListeners();
    },

    // Generate array of 7 days starting from today
    generateWeekDays() {
        this.currentWeek = [];
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            this.currentWeek.push({
                date: date,
                dateStr: date.toISOString().split('T')[0],
                dayName: this.getDayName(date, i),
                dayNumber: date.getDate(),
                month: date.toLocaleDateString('nl-NL', { month: 'short' }),
                isToday: i === 0,
                outfit: null
            });
        }
        
        // Load saved outfits for each day
        this.currentWeek.forEach(day => {
            day.outfit = DataManager.getOutfitForDate(day.dateStr);
        });
    },

    // Get day name
    getDayName(date, offset) {
        if (offset === 0) return 'Vandaag';
        if (offset === 1) return 'Morgen';
        return date.toLocaleDateString('nl-NL', { weekday: 'long' });
    },

    // Load weather forecast
    async loadForecast() {
        try {
            const coords = await WeatherManager.getCurrentLocation();
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
            );
            const data = await response.json();
            
            this.forecast = data.daily.time.map((date, i) => ({
                date: date,
                tempMax: Math.round(data.daily.temperature_2m_max[i]),
                tempMin: Math.round(data.daily.temperature_2m_min[i]),
                condition: WeatherManager.mapWeatherCode(data.daily.weather_code[i]),
                icon: this.getWeatherIcon(data.daily.weather_code[i])
            }));
        } catch (error) {
            console.error('Forecast laden mislukt:', error);
            this.forecast = [];
        }
    },

    // Get weather icon for code
    getWeatherIcon(code) {
        if (code === 0) return 'fa-sun';
        if (code === 1 || code === 2) return 'fa-cloud-sun';
        if (code === 3) return 'fa-cloud';
        if (code >= 45 && code <= 48) return 'fa-smog';
        if (code >= 51 && code <= 67) return 'fa-cloud-rain';
        if (code >= 71 && code <= 77) return 'fa-snowflake';
        if (code >= 80 && code <= 82) return 'fa-cloud-showers-heavy';
        if (code >= 95) return 'fa-bolt';
        return 'fa-cloud-sun';
    },

    // Update availability stats
    updateAvailabilityStats() {
        const stats = DataManager.getAvailabilityStats();
        
        const availEl = document.getElementById('availableCount');
        const washingEl = document.getElementById('washingCount');
        const wornEl = document.getElementById('wornTodayCount');
        
        if (availEl) availEl.textContent = stats.available;
        if (washingEl) washingEl.textContent = stats.washing;
        if (wornEl) wornEl.textContent = stats.worn;
    },

    // Render week days
    renderWeekDays() {
        const container = document.getElementById('weekDays');
        if (!container) return;

        container.innerHTML = this.currentWeek.map((day, index) => {
            const forecast = this.forecast[index] || null;
            const outfit = day.outfit;
            
            return `
                <div class="week-day-card ${day.isToday ? 'today' : ''}" data-date="${day.dateStr}">
                    <div class="day-header">
                        <div class="day-info">
                            <span class="day-name">${day.dayName}</span>
                            <span class="day-date">${day.dayNumber} ${day.month}</span>
                        </div>
                        ${forecast ? `
                            <div class="day-weather">
                                <i class="fas ${forecast.icon}"></i>
                                <span class="day-temp">${forecast.tempMax}°</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="day-outfit ${outfit ? 'has-outfit' : 'empty'}">
                        ${outfit ? this.renderOutfitPreview(outfit) : this.renderEmptySlot(day)}
                    </div>
                    
                    <div class="day-actions">
                        ${outfit ? `
                            <button class="day-btn edit" data-date="${day.dateStr}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="day-btn clear" data-date="${day.dateStr}">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : `
                            <button class="day-btn suggest" data-date="${day.dateStr}">
                                <i class="fas fa-magic"></i> Suggestie
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        this.renderForecastBar();
    },

    // Render outfit preview
    renderOutfitPreview(outfit) {
        const items = outfit.items || [];
        
        if (items.length === 0) {
            return '<div class="outfit-empty"><i class="fas fa-question"></i></div>';
        }
        
        // Show up to 3 item thumbnails
        const previews = items.slice(0, 3).map(item => `
            <div class="outfit-thumb" style="background-image: url('${item.image}')">
                ${item.status === 'washing' ? '<span class="status-badge washing"><i class="fas fa-soap"></i></span>' : ''}
            </div>
        `).join('');
        
        return `
            <div class="outfit-preview">
                ${previews}
                ${items.length > 3 ? `<span class="more-items">+${items.length - 3}</span>` : ''}
            </div>
            <div class="outfit-name">${outfit.name || 'Outfit'}</div>
        `;
    },

    // Render empty slot
    renderEmptySlot(day) {
        return `
            <div class="empty-slot">
                <i class="fas fa-plus"></i>
                <span>Plan outfit</span>
            </div>
        `;
    },

    // Render forecast bar
    renderForecastBar() {
        const container = document.getElementById('forecastBar');
        if (!container || this.forecast.length === 0) return;

        container.innerHTML = this.forecast.slice(0, 7).map((day, i) => `
            <div class="forecast-day ${i === 0 ? 'today' : ''}">
                <span class="fc-day">${i === 0 ? 'Nu' : new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'short' })}</span>
                <i class="fas ${day.icon}"></i>
                <span class="fc-temp">${day.tempMax}°</span>
            </div>
        `).join('');
    },

    // Generate outfit suggestion for a date
    async generateSuggestion(dateStr) {
        const dayIndex = this.currentWeek.findIndex(d => d.dateStr === dateStr);
        const forecast = this.forecast[dayIndex] || { tempMax: 18, condition: 'partly-cloudy' };
        
        // Get available items only
        const wardrobe = DataManager.getWardrobe().filter(item => 
            !item.status || item.status === 'available'
        );
        
        if (wardrobe.length < 2) {
            this.showToast('Voeg meer kleding toe om outfits te genereren');
            return;
        }
        
        // Get recommendation based on temperature
        const recommendation = WeatherManager.getRecommendation({ temp: forecast.tempMax });
        
        // Build outfit
        const outfit = {
            items: [],
            name: `Outfit ${this.currentWeek[dayIndex].dayName}`,
            weather: forecast
        };
        
        // Find matching items from wardrobe
        const categories = ['tops', 'bottoms', 'shoes', 'outerwear'];
        categories.forEach(cat => {
            const categoryItems = wardrobe.filter(item => item.category === cat);
            if (categoryItems.length > 0) {
                // Pick random available item
                const randomItem = categoryItems[Math.floor(Math.random() * categoryItems.length)];
                outfit.items.push(randomItem);
            }
        });
        
        // Save outfit for this date
        DataManager.saveOutfitForDate(dateStr, outfit);
        
        // Refresh display
        this.generateWeekDays();
        this.renderWeekDays();
        
        this.showToast(`Outfit gepland voor ${this.currentWeek[dayIndex].dayName}!`);
    },

    // Clear outfit for date
    clearOutfit(dateStr) {
        DataManager.clearOutfitForDate(dateStr);
        this.generateWeekDays();
        this.renderWeekDays();
    },

    // Setup event listeners
    setupEventListeners() {
        const container = document.getElementById('weekDays');
        if (!container) return;

        container.addEventListener('click', async (e) => {
            const suggestBtn = e.target.closest('.day-btn.suggest');
            const clearBtn = e.target.closest('.day-btn.clear');
            const emptySlot = e.target.closest('.empty-slot');
            const outfitPreview = e.target.closest('.day-outfit.has-outfit');
            
            if (suggestBtn) {
                const dateStr = suggestBtn.dataset.date;
                await this.generateSuggestion(dateStr);
            }
            
            if (clearBtn) {
                const dateStr = clearBtn.dataset.date;
                this.clearOutfit(dateStr);
            }
            
            if (emptySlot) {
                const card = emptySlot.closest('.week-day-card');
                if (card) {
                    await this.generateSuggestion(card.dataset.date);
                }
            }

            if (outfitPreview) {
                const card = outfitPreview.closest('.week-day-card');
                if (card) {
                    this.showOutfitDetail(card.dataset.date);
                }
            }
        });
    },

    // Show outfit detail modal with swipe functionality
    showOutfitDetail(dateStr) {
        const day = this.currentWeek.find(d => d.dateStr === dateStr);
        if (!day || !day.outfit) return;

        const outfit = day.outfit;
        const modal = document.createElement('div');
        modal.className = 'outfit-detail-modal';
        modal.innerHTML = `
            <div class="outfit-detail-content">
                <div class="detail-header">
                    <h3>${day.dayName} - ${day.dayNumber} ${day.month}</h3>
                    <button class="close-detail"><i class="fas fa-times"></i></button>
                </div>
                <div class="detail-items">
                    ${outfit.items.map(item => `
                        <div class="detail-item" data-item-id="${item.id}" data-category="${item.category}">
                            <div class="item-image" style="background-image: url('${item.image}')"></div>
                            <div class="item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-status ${item.status || 'available'}">
                                    ${this.getStatusLabel(item.status)}
                                </span>
                            </div>
                            <div class="item-actions">
                                <button class="swap-btn" data-category="${item.category}" title="Wissel item">
                                    <i class="fas fa-exchange-alt"></i>
                                </button>
                                <button class="status-btn" data-id="${item.id}" data-status="washing" title="Naar de was">
                                    <i class="fas fa-soap"></i>
                                </button>
                                <button class="status-btn check" data-id="${item.id}" data-status="available" title="Beschikbaar">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="detail-actions">
                    <button class="btn-regenerate" data-date="${dateStr}">
                        <i class="fas fa-sync"></i> Nieuwe suggestie
                    </button>
                    <button class="btn-clear-outfit" data-date="${dateStr}">
                        <i class="fas fa-trash"></i> Verwijder
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Store reference for swipe callback
        this.currentEditModal = modal;
        this.currentEditDate = dateStr;

        // Event listeners for modal
        modal.querySelector('.close-detail').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Swap buttons - open swipe to change item
        modal.querySelectorAll('.swap-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = btn.dataset.category;
                this.openSwipeForCategory(category, dateStr);
            });
        });

        modal.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.id;
                const status = btn.dataset.status;
                DataManager.updateItemStatus(itemId, status);
                this.updateAvailabilityStats();
                modal.remove();
                this.generateWeekDays();
                this.renderWeekDays();
                this.showToast(status === 'washing' ? 'Item naar de was' : 'Item beschikbaar');
            });
        });

        modal.querySelector('.btn-regenerate').addEventListener('click', async () => {
            modal.remove();
            await this.generateSuggestion(dateStr);
        });

        modal.querySelector('.btn-clear-outfit').addEventListener('click', () => {
            modal.remove();
            this.clearOutfit(dateStr);
        });
    },

    // Open swipe to change an item in the planned outfit
    openSwipeForCategory(category, dateStr) {
        // Get available items for this category
        const wardrobe = DataManager.getWardrobe().filter(item => 
            item.category === category && (!item.status || item.status === 'available')
        );
        
        if (wardrobe.length === 0) {
            this.showToast('Geen beschikbare items in deze categorie');
            return;
        }
        
        // Create swipe modal
        const swipeModal = document.createElement('div');
        swipeModal.className = 'swipe-select-modal';
        swipeModal.innerHTML = `
            <div class="swipe-select-content">
                <div class="swipe-header">
                    <button class="close-swipe"><i class="fas fa-arrow-left"></i></button>
                    <h3>Kies ${this.getCategoryLabel(category)}</h3>
                    <span>${wardrobe.length} beschikbaar</span>
                </div>
                <div class="swipe-items-grid">
                    ${wardrobe.map(item => `
                        <div class="swipe-item-card" data-id="${item.id}">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="swipe-item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-color">${item.color || ''}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(swipeModal);
        setTimeout(() => swipeModal.classList.add('active'), 10);
        
        // Close button
        swipeModal.querySelector('.close-swipe').addEventListener('click', () => {
            swipeModal.classList.remove('active');
            setTimeout(() => swipeModal.remove(), 300);
        });
        
        // Item selection
        swipeModal.querySelectorAll('.swipe-item-card').forEach(card => {
            card.addEventListener('click', () => {
                const itemId = card.dataset.id;
                const selectedItem = wardrobe.find(i => i.id === itemId);
                
                if (selectedItem) {
                    this.replaceItemInOutfit(dateStr, category, selectedItem);
                    swipeModal.classList.remove('active');
                    setTimeout(() => swipeModal.remove(), 300);
                    
                    // Refresh the detail modal
                    if (this.currentEditModal) {
                        this.currentEditModal.remove();
                        this.showOutfitDetail(dateStr);
                    }
                }
            });
        });
    },
    
    // Replace an item in the planned outfit
    replaceItemInOutfit(dateStr, category, newItem) {
        const outfit = DataManager.getOutfitForDate(dateStr);
        if (!outfit) return;
        
        // Find and replace the item with matching category
        const index = outfit.items.findIndex(i => i.category === category);
        if (index !== -1) {
            outfit.items[index] = newItem;
        } else {
            outfit.items.push(newItem);
        }
        
        DataManager.saveOutfitForDate(dateStr, outfit);
        this.generateWeekDays();
        this.renderWeekDays();
        this.showToast('Item gewisseld!');
    },
    
    // Get category label
    getCategoryLabel(category) {
        const labels = {
            tops: 'een top',
            bottoms: 'een broek',
            shoes: 'schoenen',
            outerwear: 'een jas',
            accessories: 'accessoire'
        };
        return labels[category] || category;
    },

    // Get status label
    getStatusLabel(status) {
        const labels = {
            available: '✓ Beschikbaar',
            washing: '🧺 In de was',
            worn: '👕 Gedragen'
        };
        return labels[status] || labels.available;
    },

    // Show toast notification
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }
};

// Export for use in app.js
window.WeekPlannerManager = WeekPlannerManager;
