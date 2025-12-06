// Weer functionaliteit

const WeatherManager = {
    // Simuleer weer data (in productie zou dit een echte API zijn)
    mockWeatherData: [
        { temp: 5, desc: 'Koud & Bewolkt', icon: 'fa-cloud', recommendation: 'winter' },
        { temp: 12, desc: 'Fris', icon: 'fa-cloud-sun', recommendation: 'spring' },
        { temp: 18, desc: 'Aangenaam', icon: 'fa-sun', recommendation: 'spring' },
        { temp: 25, desc: 'Warm & Zonnig', icon: 'fa-sun', recommendation: 'summer' },
        { temp: 8, desc: 'Regenachtig', icon: 'fa-cloud-rain', recommendation: 'winter' },
        { temp: 15, desc: 'Bewolkt', icon: 'fa-cloud', recommendation: 'spring' }
    ],

    currentWeather: null,

    init() {
        this.updateWeather();
        // Update elke 30 minuten
        setInterval(() => this.updateWeather(), 30 * 60 * 1000);
    },

    updateWeather() {
        // Simuleer weer (random voor demo)
        const randomIndex = Math.floor(Math.random() * this.mockWeatherData.length);
        this.currentWeather = this.mockWeatherData[randomIndex];
        
        // Pas december weer aan (winter)
        const month = new Date().getMonth();
        if (month >= 10 || month <= 2) {
            // Winter maanden
            this.currentWeather = this.mockWeatherData.find(w => w.temp <= 8) || this.mockWeatherData[0];
        }

        this.renderWeatherWidget();
    },

    renderWeatherWidget() {
        const tempEl = document.getElementById('weatherTemp');
        const descEl = document.getElementById('weatherDesc');
        const widgetEl = document.getElementById('weatherWidget');

        if (tempEl && this.currentWeather) {
            tempEl.textContent = `${this.currentWeather.temp}°C`;
        }
        if (descEl && this.currentWeather) {
            descEl.textContent = this.currentWeather.desc;
        }
        if (widgetEl && this.currentWeather) {
            const icon = widgetEl.querySelector('i');
            if (icon) {
                icon.className = `fas ${this.currentWeather.icon}`;
            }
        }
    },

    getCurrentWeather() {
        return this.currentWeather;
    },

    getClothingRecommendation() {
        if (!this.currentWeather) return 'all';
        return this.currentWeather.recommendation;
    },

    // Helper om te bepalen of jas nodig is
    needsOuterwear() {
        if (!this.currentWeather) return true;
        return this.currentWeather.temp < 15;
    },

    // Helper voor weer-gebaseerde outfit suggesties
    getWeatherAdvice() {
        if (!this.currentWeather) return '';
        
        const temp = this.currentWeather.temp;
        const desc = this.currentWeather.desc.toLowerCase();

        if (temp < 10) {
            return 'Vergeet je warme jas niet! 🧥';
        } else if (temp < 18) {
            return 'Een laagje extra is handig vandaag 🧣';
        } else if (temp > 25) {
            return 'Perfect weer voor lichte kleding! ☀️';
        } else if (desc.includes('regen')) {
            return 'Pak een waterdichte jas mee! 🌧️';
        }
        return 'Geniet van de dag! 😊';
    }
};

// Initialiseer weer bij laden
document.addEventListener('DOMContentLoaded', () => {
    WeatherManager.init();
});
