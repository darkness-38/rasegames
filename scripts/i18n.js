/**
 * Internationalization (i18n) System
 * Supports EN and TR languages
 */

const i18n = {
    currentLang: 'en',
    translations: {},

    async init() {
        // Load saved language or detect from browser
        const savedLang = localStorage.getItem('language');
        if (savedLang) {
            this.currentLang = savedLang;
        } else {
            // Auto-detect browser language
            const browserLang = navigator.language.slice(0, 2);
            this.currentLang = browserLang === 'tr' ? 'tr' : 'en';
        }

        // Load translations
        await this.loadTranslations();

        // Apply translations
        this.applyTranslations();

        // Update language toggle buttons
        this.updateToggleButtons();
    },

    async loadTranslations() {
        try {
            // Determine base path
            const isRaseLab = window.location.pathname.includes('/raselab/');
            const isExperiment = window.location.pathname.includes('/experiments/');
            const isGame = window.location.pathname.includes('/games/');
            const isPage = window.location.pathname.includes('/pages/');

            let basePath = '/translations/';
            if (isExperiment) {
                basePath = '/raselab/../translations/';
            } else if (isGame) {
                basePath = '/translations/';
            }

            // Use absolute path from root
            const response = await fetch(`/translations/${this.currentLang}.json`);
            if (response.ok) {
                this.translations = await response.json();
            } else {
                console.warn('Translation file not found, using defaults');
                this.translations = {};
            }
        } catch (error) {
            console.warn('Error loading translations:', error);
            this.translations = {};
        }
    },

    applyTranslations() {
        // Find all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getTranslation(key);
            if (translation) {
                element.textContent = translation;
            }
        });

        // Handle placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            const translation = this.getTranslation(key);
            if (translation) {
                element.placeholder = translation;
            }
        });

        // Handle titles
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.getTranslation(key);
            if (translation) {
                element.title = translation;
            }
        });
    },

    getTranslation(key) {
        // Support nested keys like "nav.home"
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }

        return typeof value === 'string' ? value : null;
    },

    // Alias for getTranslation
    t(key) {
        return this.getTranslation(key);
    },

    async setLanguage(lang) {
        if (lang !== 'en' && lang !== 'tr') return;

        this.currentLang = lang;
        localStorage.setItem('language', lang);

        await this.loadTranslations();
        this.applyTranslations();
        this.updateToggleButtons();
    },

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'tr' : 'en';
        this.setLanguage(newLang);
    },

    updateToggleButtons() {
        // Update all language toggle buttons
        document.querySelectorAll('[data-lang-toggle]').forEach(btn => {
            btn.textContent = this.currentLang.toUpperCase();
        });

        // Update language option buttons
        document.querySelectorAll('[data-lang-option]').forEach(btn => {
            const lang = btn.getAttribute('data-lang-option');
            if (lang === this.currentLang) {
                btn.classList.add('active', 'bg-primary', 'text-white');
                btn.classList.remove('text-gray-400');
            } else {
                btn.classList.remove('active', 'bg-primary', 'text-white');
                btn.classList.add('text-gray-400');
            }
        });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// Expose globally
window.i18n = i18n;
