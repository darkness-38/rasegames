// Rating System for Rase Games
// Stores and retrieves user ratings using localStorage

const RatingSystem = {
    STORAGE_KEY: 'rase_games_ratings',

    // Get all ratings from localStorage
    getAllRatings() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    },

    // Save all ratings to localStorage
    saveAllRatings(ratings) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ratings));
    },

    // Add a user rating for a game
    rateGame(gameId, rating) {
        if (rating < 1 || rating > 5) {
            console.error('Rating must be between 1 and 5');
            return false;
        }

        const ratings = this.getAllRatings();

        if (!ratings[gameId]) {
            ratings[gameId] = {
                totalRatings: 0,
                sumRatings: 0,
                userRating: null
            };
        }

        // If user already rated, update their rating
        if (ratings[gameId].userRating) {
            ratings[gameId].sumRatings -= ratings[gameId].userRating;
            ratings[gameId].sumRatings += rating;
        } else {
            // New rating
            ratings[gameId].totalRatings += 1;
            ratings[gameId].sumRatings += rating;
        }

        ratings[gameId].userRating = rating;
        this.saveAllRatings(ratings);

        return this.getGameRating(gameId);
    },

    // Get rating data for a specific game
    getGameRating(gameId) {
        const ratings = this.getAllRatings();
        const gameRating = ratings[gameId];

        if (!gameRating || gameRating.totalRatings === 0) {
            return {
                average: 0,
                totalRatings: 0,
                userRating: null
            };
        }

        return {
            average: Math.round((gameRating.sumRatings / gameRating.totalRatings) * 10) / 10,
            totalRatings: gameRating.totalRatings,
            userRating: gameRating.userRating
        };
    },

    // Get user's rating for a game
    getUserRating(gameId) {
        const ratings = this.getAllRatings();
        return ratings[gameId]?.userRating || null;
    },

    // Create star rating UI element
    createRatingUI(gameId, options = {}) {
        const { showCount = true, size = 'medium', interactive = true } = options;

        const container = document.createElement('div');
        container.className = 'rating-container';
        container.dataset.gameId = gameId;

        const starsContainer = document.createElement('div');
        starsContainer.className = `stars-container ${size} ${interactive ? 'interactive' : ''}`;

        const gameRating = this.getGameRating(gameId);

        // Create 5 stars
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'rating-star';
            star.dataset.value = i;
            star.innerHTML = '★';

            // Fill stars based on average or user rating
            if (i <= Math.round(gameRating.average)) {
                star.classList.add('filled');
            }

            if (interactive) {
                star.addEventListener('mouseenter', () => this.handleStarHover(starsContainer, i));
                star.addEventListener('mouseleave', () => this.handleStarLeave(starsContainer, gameId));
                star.addEventListener('click', () => this.handleStarClick(gameId, i, starsContainer, container));
            }

            starsContainer.appendChild(star);
        }

        container.appendChild(starsContainer);

        // Rating info (average and count)
        const ratingInfo = document.createElement('div');
        ratingInfo.className = 'rating-info';

        const avgSpan = document.createElement('span');
        avgSpan.className = 'rating-average';
        avgSpan.textContent = gameRating.average > 0 ? gameRating.average.toFixed(1) : '-';

        ratingInfo.appendChild(avgSpan);

        if (showCount) {
            const countSpan = document.createElement('span');
            countSpan.className = 'rating-count';
            countSpan.textContent = `(${gameRating.totalRatings})`;
            ratingInfo.appendChild(countSpan);
        }

        container.appendChild(ratingInfo);

        // User rating indicator
        if (gameRating.userRating) {
            const userIndicator = document.createElement('span');
            userIndicator.className = 'user-rating-indicator';
            userIndicator.textContent = `Senin puanın: ${gameRating.userRating}★`;
            container.appendChild(userIndicator);
        }

        return container;
    },

    handleStarHover(starsContainer, hoverValue) {
        const stars = starsContainer.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            if (index < hoverValue) {
                star.classList.add('hover');
            } else {
                star.classList.remove('hover');
            }
        });
    },

    handleStarLeave(starsContainer, gameId) {
        const stars = starsContainer.querySelectorAll('.rating-star');
        const gameRating = this.getGameRating(gameId);

        stars.forEach((star, index) => {
            star.classList.remove('hover');
            if (index < Math.round(gameRating.average)) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });
    },

    handleStarClick(gameId, rating, starsContainer, container) {
        const result = this.rateGame(gameId, rating);

        // Update display
        const stars = starsContainer.querySelectorAll('.rating-star');
        stars.forEach((star, index) => {
            star.classList.remove('hover');
            if (index < Math.round(result.average)) {
                star.classList.add('filled');
            } else {
                star.classList.remove('filled');
            }
        });

        // Update rating info
        const avgSpan = container.querySelector('.rating-average');
        const countSpan = container.querySelector('.rating-count');

        if (avgSpan) avgSpan.textContent = result.average.toFixed(1);
        if (countSpan) countSpan.textContent = `(${result.totalRatings})`;

        // Show/update user rating indicator
        let userIndicator = container.querySelector('.user-rating-indicator');
        if (!userIndicator) {
            userIndicator = document.createElement('span');
            userIndicator.className = 'user-rating-indicator';
            container.appendChild(userIndicator);
        }
        userIndicator.textContent = `Senin puanın: ${rating}★`;

        // Show toast notification
        this.showToast(`Oyuna ${rating} yıldız verdin!`);
    },

    showToast(message) {
        // Remove existing toast
        const existingToast = document.querySelector('.rating-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = 'rating-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    // Initialize ratings on homepage
    initHomepageRatings() {
        const gameCards = document.querySelectorAll('[data-game-id]');
        gameCards.forEach(card => {
            const gameId = card.dataset.gameId;
            const ratingDisplay = card.querySelector('.game-rating-display');
            if (ratingDisplay) {
                const rating = this.getGameRating(gameId);
                const avgEl = ratingDisplay.querySelector('.rating-avg');
                const countEl = ratingDisplay.querySelector('.rating-count');

                if (avgEl) avgEl.textContent = rating.average > 0 ? rating.average.toFixed(1) : '-';
                if (countEl) countEl.textContent = `(${rating.totalRatings})`;
            }
        });
    }
};

// CSS for rating system
const ratingStyles = document.createElement('style');
ratingStyles.textContent = `
    .rating-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .stars-container {
        display: flex;
        gap: 2px;
    }

    .stars-container.small .rating-star {
        font-size: 14px;
    }

    .stars-container.medium .rating-star {
        font-size: 20px;
    }

    .stars-container.large .rating-star {
        font-size: 28px;
    }

    .rating-star {
        color: #374151;
        transition: all 0.15s ease;
        cursor: default;
    }

    .stars-container.interactive .rating-star {
        cursor: pointer;
    }

    .rating-star.filled {
        color: #eab308;
    }

    .rating-star.hover {
        color: #fbbf24;
        transform: scale(1.2);
    }

    .rating-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
    }

    .rating-average {
        color: white;
        font-weight: 600;
    }

    .rating-count {
        color: #6b7280;
        font-size: 12px;
    }

    .user-rating-indicator {
        font-size: 11px;
        color: #4f46e5;
        background: rgba(79, 70, 229, 0.1);
        padding: 2px 8px;
        border-radius: 10px;
    }

    .rating-toast {
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        color: white;
        padding: 12px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 40px rgba(79, 70, 229, 0.4);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
    }

    .rating-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }

    /* Game page rating section */
    .game-rating-section {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
    }

    .game-rating-section h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        color: #a1a1aa;
    }

    /* Homepage rating display */
    .game-rating-display {
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .game-rating-display .star-icon {
        color: #eab308;
        font-size: 14px;
    }
`;

document.head.appendChild(ratingStyles);

// Export for use in other files
window.RatingSystem = RatingSystem;
