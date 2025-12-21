// Game History System for Rase Games
// Tracks which games users have played recently

const GameHistory = {
    STORAGE_KEY: 'rase_games_history',
    MAX_HISTORY: 10, // Maximum games to store

    // Game definitions with metadata
    GAMES: {
        'rase-clicker': {
            name: 'Rase Clicker',
            emoji: '💎',
            url: '/raseClicker/',
            category: 'Idle, Clicker',
            gradient: 'from-cyan-500/30 to-blue-600/30'
        },
        'fight-arena': {
            name: 'Fight Arena',
            emoji: '⚔️',
            url: '/fightArena/',
            category: 'Fighting, PvP',
            gradient: 'from-red-500/30 to-orange-600/30'
        },
        'cyber-runner': {
            name: 'Cyber Runner',
            emoji: '🏃',
            url: '/runnerGame/index.html',
            category: 'Endless Runner, Action',
            gradient: 'from-purple-500/30 to-pink-600/30'
        },
        'pong': {
            name: 'Pong',
            emoji: '🏓',
            url: '/pong/',
            category: 'Arcade, Classic',
            gradient: 'from-green-500/30 to-teal-600/30'
        },
        '2048': {
            name: '2048',
            emoji: '🔢',
            url: '/game2048/',
            category: 'Puzzle, Strategy',
            gradient: 'from-yellow-500/30 to-orange-600/30'
        }
    },

    // Get user's game history
    getHistory(userId) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allHistory = stored ? JSON.parse(stored) : {};
        return allHistory[userId] || [];
    },

    // Add a game to user's history
    addToHistory(userId, gameId) {
        if (!userId || !gameId) return;

        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allHistory = stored ? JSON.parse(stored) : {};

        if (!allHistory[userId]) {
            allHistory[userId] = [];
        }

        // Remove if already exists (to move to front)
        allHistory[userId] = allHistory[userId].filter(item => item.gameId !== gameId);

        // Add to front with timestamp
        allHistory[userId].unshift({
            gameId: gameId,
            playedAt: Date.now()
        });

        // Limit history size
        allHistory[userId] = allHistory[userId].slice(0, this.MAX_HISTORY);

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allHistory));
    },

    // Get recently played games (last 3)
    getRecentlyPlayed(userId, limit = 3) {
        const history = this.getHistory(userId);
        return history.slice(0, limit).map(item => ({
            ...item,
            ...this.GAMES[item.gameId]
        })).filter(item => item.name); // Only return games we have metadata for
    },

    // Detect current game from URL
    detectCurrentGame() {
        const path = window.location.pathname.toLowerCase();

        if (path.includes('raseclicker')) return 'rase-clicker';
        if (path.includes('fightarena')) return 'fight-arena';
        if (path.includes('runnergame')) return 'cyber-runner';
        if (path.includes('pong')) return 'pong';
        if (path.includes('game2048') || path.includes('2048')) return '2048';

        return null;
    },

    // Auto-track game play on game pages
    trackGamePlay() {
        const gameId = this.detectCurrentGame();
        if (!gameId) return;

        // Wait for auth to be ready
        const checkAuth = setInterval(() => {
            if (window.currentUser && !window.currentUser.isAnonymous) {
                this.addToHistory(window.currentUser.uid, gameId);
                clearInterval(checkAuth);
            } else if (window.authStateChecked) {
                clearInterval(checkAuth);
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => clearInterval(checkAuth), 10000);
    },

    // Render recently played section
    renderRecentlyPlayed(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Wait for auth state
        const checkAuth = setInterval(() => {
            if (window.authStateChecked !== undefined) {
                clearInterval(checkAuth);
                this._doRender(container);
            }
        }, 100);

        // Fallback timeout
        setTimeout(() => {
            clearInterval(checkAuth);
            this._doRender(container);
        }, 3000);
    },

    _doRender(container) {
        const user = window.currentUser;

        // Hide for guests or non-logged in users
        if (!user || user.isAnonymous) {
            container.style.display = 'none';
            return;
        }

        const recentGames = this.getRecentlyPlayed(user.uid, 3);

        // If no history, show a message or hide
        if (recentGames.length === 0) {
            container.innerHTML = `
                <div class="flex items-center gap-3 mb-6">
                    <div class="h-8 w-1 bg-gray-600 rounded-full"></div>
                    <h2 class="text-xl md:text-2xl font-bold text-white">Recently Played</h2>
                </div>
                <p class="text-gray-500 text-sm">Start playing games to see your history here!</p>
            `;
            container.style.display = 'block';
            return;
        }

        // Render the games
        let gamesHTML = recentGames.map(game => `
            <a href="${game.url}" 
                class="min-w-[220px] h-32 rounded-lg bg-surface-dark border border-white/5 flex items-center p-3 gap-4 hover:bg-white/5 transition-colors cursor-pointer group no-underline">
                <div class="size-16 rounded bg-gradient-to-br ${game.gradient} flex items-center justify-center shrink-0">
                    <span class="text-3xl">${game.emoji}</span>
                </div>
                <div class="flex flex-col justify-center gap-1">
                    <p class="text-white font-bold text-sm">${game.name}</p>
                    <p class="text-gray-500 text-xs">${game.category}</p>
                    <p class="text-xs text-primary group-hover:text-primary-glow">Resume →</p>
                </div>
            </a>
        `).join('');

        container.innerHTML = `
            <div class="flex items-center gap-3 mb-6">
                <div class="h-8 w-1 bg-gray-600 rounded-full"></div>
                <h2 class="text-xl md:text-2xl font-bold text-white">Recently Played</h2>
            </div>
            <div class="flex gap-4 overflow-x-auto pb-4 [-ms-scrollbar-style:none] [scrollbar-width:none]">
                ${gamesHTML}
            </div>
        `;
        container.style.display = 'block';
    }
};

// Export for use in other files
window.GameHistory = GameHistory;

// Auto-track if on a game page
document.addEventListener('DOMContentLoaded', () => {
    GameHistory.trackGamePlay();
});
