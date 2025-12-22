// Rating System for Rase Games
// Allows users to rate games and displays average ratings

const RatingSystem = {
    CACHE_KEY: 'rase_games_ratings_cache',
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

    // Game ID mapping
    GAMES: {
        'rase-clicker': { name: 'Rase Clicker', path: '/games/raseClicker/' },
        'fight-arena': { name: 'Fight Arena', path: '/games/fightArena/' },
        'cyber-runner': { name: 'Cyber Runner', path: '/games/runnerGame/' },
        'snake': { name: 'Neon Snake', path: '/games/snakeGame/' },
        'tetris': { name: 'Cyber Blocks', path: '/games/tetrisGame/' },
        '2048': { name: 'Power 2048', path: '/games/game2048/' },
        'flappy': { name: 'Pixel Bird', path: '/games/flappyGame/' },
        'memory': { name: 'Mind Match', path: '/games/memoryGame/' },
        'minesweeper': { name: 'Bomb Squad', path: '/games/minesweeperGame/' },
        'tictactoe': { name: 'Tic Tac Pro', path: '/games/tictactoeGame/' }
    },

    // Get cached ratings
    getCachedRatings() {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY);
            if (!cached) return null;

            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(this.CACHE_KEY);
                return null;
            }
            return data.ratings;
        } catch (e) {
            return null;
        }
    },

    // Cache ratings
    setCachedRatings(ratings) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                ratings: ratings
            }));
        } catch (e) {
            console.error('Failed to cache ratings:', e);
        }
    },

    // Load Firebase database script if needed
    async ensureFirebase() {
        if (typeof firebase === 'undefined') {
            await this.loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
        }
        if (!firebase.database) {
            await this.loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
        }

        if (!firebase.apps.length) {
            firebase.initializeApp({
                apiKey: atob('QUl6YVN5QmlnUksxUVYxbk8tcVRtTU1MVWNuQ3RYdFcwZV9zWG5R'),
                authDomain: "rasegames-9934f.firebaseapp.com",
                databaseURL: "https://rasegames-9934f-default-rtdb.europe-west1.firebasedatabase.app",
                projectId: "rasegames-9934f"
            });
        }
    },

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },

    // Get all game ratings from Firebase
    async getAllRatings() {
        // Check cache first
        const cached = this.getCachedRatings();
        if (cached) return cached;

        try {
            await this.ensureFirebase();
            const db = firebase.database();
            const snapshot = await db.ref('ratings').once('value');

            if (!snapshot.exists()) {
                // Return default ratings if no data
                return this.getDefaultRatings();
            }

            const data = snapshot.val();
            const ratings = {};

            Object.keys(this.GAMES).forEach(gameId => {
                if (data[gameId]) {
                    ratings[gameId] = {
                        average: data[gameId].average || 0,
                        count: data[gameId].count || 0
                    };
                } else {
                    ratings[gameId] = { average: 0, count: 0 };
                }
            });

            this.setCachedRatings(ratings);
            return ratings;
        } catch (e) {
            console.error('Failed to load ratings:', e);
            return this.getDefaultRatings();
        }
    },

    // Get default ratings (for when Firebase is unavailable)
    getDefaultRatings() {
        const defaults = {};
        Object.keys(this.GAMES).forEach(gameId => {
            defaults[gameId] = { average: 0, count: 0 };
        });
        return defaults;
    },

    // Get single game rating
    async getGameRating(gameId) {
        const ratings = await this.getAllRatings();
        return ratings[gameId] || { average: 0, count: 0 };
    },

    // Rate a game (requires logged in user)
    async rateGame(gameId, rating) {
        const user = window.currentUser;
        if (!user || user.isAnonymous) {
            console.warn('Must be logged in to rate games');
            return { success: false, error: 'Must be logged in to rate' };
        }

        if (rating < 1 || rating > 5) {
            return { success: false, error: 'Rating must be between 1 and 5' };
        }

        try {
            await this.ensureFirebase();
            const db = firebase.database();
            const gameRef = db.ref(`ratings/${gameId}`);

            // Get current data
            const snapshot = await gameRef.once('value');
            const current = snapshot.val() || { average: 0, count: 0, users: {} };

            // Check if user already rated
            const previousRating = current.users?.[user.uid];
            let newAverage, newCount;

            if (previousRating !== undefined) {
                // Update existing rating
                const totalWithoutPrevious = (current.average * current.count) - previousRating;
                newCount = current.count;
                newAverage = (totalWithoutPrevious + rating) / newCount;
            } else {
                // New rating
                newCount = (current.count || 0) + 1;
                const currentTotal = (current.average || 0) * (current.count || 0);
                newAverage = (currentTotal + rating) / newCount;
            }

            // Save to Firebase
            await gameRef.update({
                average: Math.round(newAverage * 10) / 10, // Round to 1 decimal
                count: newCount,
                [`users/${user.uid}`]: rating
            });

            // Clear cache
            localStorage.removeItem(this.CACHE_KEY);

            return { success: true, newAverage: Math.round(newAverage * 10) / 10, count: newCount };
        } catch (e) {
            console.error('Failed to rate game:', e);
            return { success: false, error: e.message };
        }
    },

    // Get user's rating for a game
    async getUserRating(gameId) {
        const user = window.currentUser;
        if (!user || user.isAnonymous) return null;

        try {
            await this.ensureFirebase();
            const db = firebase.database();
            const snapshot = await db.ref(`ratings/${gameId}/users/${user.uid}`).once('value');
            return snapshot.val();
        } catch (e) {
            return null;
        }
    },

    // Render star HTML for display
    renderStars(rating, showCount = false, count = 0) {
        const fullStars = Math.floor(rating);
        const hasHalf = rating - fullStars >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

        let html = '<div class="flex items-center gap-1">';

        // Full stars
        for (let i = 0; i < fullStars; i++) {
            html += '<span class="material-symbols-outlined text-yellow-500 text-[16px]" style="font-variation-settings: \'FILL\' 1;">star</span>';
        }

        // Half star
        if (hasHalf) {
            html += '<span class="material-symbols-outlined text-yellow-500 text-[16px]" style="font-variation-settings: \'FILL\' 1;">star_half</span>';
        }

        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            html += '<span class="material-symbols-outlined text-gray-600 text-[16px]">star</span>';
        }

        // Rating number
        if (rating > 0) {
            html += `<span class="text-white text-sm font-bold ml-1">${rating.toFixed(1)}</span>`;
        }

        // Count
        if (showCount && count > 0) {
            html += `<span class="text-gray-500 text-xs ml-1">(${count})</span>`;
        }

        html += '</div>';
        return html;
    },

    // Render compact star display (single star + number)
    renderCompactStars(rating) {
        if (rating <= 0) {
            return `
                <div class="flex gap-1 text-gray-500">
                    <span class="material-symbols-outlined text-[16px]">star</span>
                    <span class="text-sm font-bold">-</span>
                </div>
            `;
        }
        return `
            <div class="flex gap-1 text-yellow-500">
                <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">star</span>
                <span class="text-white text-sm font-bold">${rating.toFixed(1)}</span>
            </div>
        `;
    },

    // Update all rating displays on page
    async updatePageRatings() {
        const ratings = await this.getAllRatings();

        // Update elements with data-game-rating attribute
        document.querySelectorAll('[data-game-rating]').forEach(element => {
            const gameId = element.dataset.gameRating;
            const rating = ratings[gameId];

            if (rating) {
                const compact = element.dataset.ratingCompact !== undefined;
                const showCount = element.dataset.ratingCount !== undefined;

                if (compact) {
                    element.innerHTML = this.renderCompactStars(rating.average);
                } else {
                    element.innerHTML = this.renderStars(rating.average, showCount, rating.count);
                }
            }
        });
    },

    // Create interactive rating widget (for game pages)
    createRatingWidget(gameId, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const renderWidget = async () => {
            const userRating = await this.getUserRating(gameId);
            const gameRating = await this.getGameRating(gameId);
            const isLoggedIn = window.currentUser && !window.currentUser.isAnonymous;

            container.innerHTML = `
                <div class="rating-widget bg-surface-dark/50 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-sm font-medium text-gray-400">Rate this game</span>
                        <div class="text-xs text-gray-500">${gameRating.count} ratings</div>
                    </div>
                    <div class="flex items-center gap-2 mb-3">
                        ${this.renderStars(gameRating.average)}
                    </div>
                    ${isLoggedIn ? `
                        <div class="flex gap-1 rating-stars-input">
                            ${[1, 2, 3, 4, 5].map(star => `
                                <button class="rating-star p-1 hover:scale-110 transition-transform ${userRating >= star ? 'text-yellow-500' : 'text-gray-600'}" data-star="${star}">
                                    <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' ${userRating >= star ? 1 : 0};">star</span>
                                </button>
                            `).join('')}
                        </div>
                        ${userRating ? `<p class="text-xs text-green-500 mt-2">Your rating: ${userRating}/5</p>` : ''}
                    ` : `
                        <p class="text-xs text-gray-500 mt-2">Sign in to rate this game</p>
                    `}
                </div>
            `;

            // Add click handlers
            container.querySelectorAll('.rating-star').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const star = parseInt(btn.dataset.star);
                    const result = await this.rateGame(gameId, star);
                    if (result.success) {
                        renderWidget(); // Re-render widget
                        this.updatePageRatings(); // Update any other displays
                    }
                });

                // Hover effect
                btn.addEventListener('mouseenter', () => {
                    const hoverStar = parseInt(btn.dataset.star);
                    container.querySelectorAll('.rating-star').forEach(b => {
                        const s = parseInt(b.dataset.star);
                        const icon = b.querySelector('.material-symbols-outlined');
                        if (s <= hoverStar) {
                            b.classList.remove('text-gray-600');
                            b.classList.add('text-yellow-500');
                            icon.style.fontVariationSettings = "'FILL' 1";
                        }
                    });
                });

                btn.addEventListener('mouseleave', () => {
                    renderWidget(); // Reset to actual rating
                });
            });
        };

        renderWidget();

        // Re-render on auth change
        window.addEventListener('authStateChanged', renderWidget);
    }
};

// Export globally
window.RatingSystem = RatingSystem;

// Auto-update ratings on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for auth to load
    setTimeout(() => {
        RatingSystem.updatePageRatings();
    }, 500);
});

// Also update when auth changes
window.addEventListener('authStateChanged', () => {
    RatingSystem.updatePageRatings();
});
