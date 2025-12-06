// Main App Controller

const App = {
    currentPage: 'wardrobe',

    init() {
        this.bindNavigation();
        this.showPage('wardrobe');
        
        console.log('🎨 Outfit Creator geladen!');
        console.log('📱 Navigeer tussen paginas met de knoppen onderaan');
    },

    bindNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const page = btn.dataset.page;
                this.showPage(page);
                
                // Update active state
                navBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    },

    showPage(pageName) {
        this.currentPage = pageName;
        
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show selected page
        const targetPage = document.getElementById(`${pageName}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Re-render page content if needed
        switch (pageName) {
            case 'wardrobe':
                WardrobeManager.renderClothing();
                break;
            case 'outfits':
                OutfitsManager.renderOutfits();
                break;
            case 'swipe':
                // Reset swipe state when navigating to page
                break;
            case 'suggest':
                SuggestManager.showQuestions();
                break;
        }
    }
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all managers are initialized
    setTimeout(() => {
        App.init();
    }, 100);
});

// Service Worker registration for offline support (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}
