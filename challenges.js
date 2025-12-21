// Daily Challenges System for Rase Games
// Generates 3 daily challenges based on the current date
// Tracks progress and saves XP to Firebase

const ChallengesSystem = {
    STORAGE_KEY: 'rase_games_challenges',

    // All possible challenges grouped by game - simplified for trackable actions
    CHALLENGE_POOL: {
        'rase-clicker': [
            { id: 'rc-clicks', title: 'Click Master', description: '500 kez tıkla', goal: 500, xp: 50, icon: '👆', trackKey: 'clicks' },
            { id: 'rc-diamonds', title: 'Diamond Hunter', description: '100 elmas topla', goal: 100, xp: 75, icon: '💎', trackKey: 'diamonds' },
        ],
        'fight-arena': [
            { id: 'fa-wins', title: 'Arena Champion', description: '2 maç kazan', goal: 2, xp: 100, icon: '🏆', trackKey: 'wins' },
            { id: 'fa-matches', title: 'Fighter', description: '3 maç oyna', goal: 3, xp: 50, icon: '⚔️', trackKey: 'matches' },
        ],
        'cyber-runner': [
            { id: 'cr-distance', title: 'Distance Runner', description: '500m koş', goal: 500, xp: 60, icon: '🏃', trackKey: 'distance' },
            { id: 'cr-coins', title: 'Coin Collector', description: '50 coin topla', goal: 50, xp: 50, icon: '🪙', trackKey: 'coins' },
            { id: 'cr-score', title: 'High Score', description: '2000 puan yap', goal: 2000, xp: 100, icon: '📈', trackKey: 'score' },
        ],
        '2048': [
            { id: '2k-score', title: 'Score Hunter', description: '1000 puan yap', goal: 1000, xp: 50, icon: '🎯', trackKey: 'score' },
            { id: '2k-moves', title: 'Move Master', description: '100 hamle yap', goal: 100, xp: 40, icon: '🔢', trackKey: 'moves' },
        ],
        'snake': [
            { id: 'sn-score', title: 'Snake Master', description: '50 puan yap', goal: 50, xp: 60, icon: '🐍', trackKey: 'score' },
            { id: 'sn-food', title: 'Food Collector', description: '30 yem ye', goal: 30, xp: 50, icon: '🍎', trackKey: 'food' },
        ],
        'tetris': [
            { id: 'tt-lines', title: 'Line Clearer', description: '10 satır temizle', goal: 10, xp: 70, icon: '🧱', trackKey: 'lines' },
            { id: 'tt-score', title: 'Tetris Pro', description: '1000 puan yap', goal: 1000, xp: 60, icon: '📊', trackKey: 'score' },
        ],
        'flappy': [
            { id: 'fl-score', title: 'Flappy Master', description: '10 boru geç', goal: 10, xp: 80, icon: '🐦', trackKey: 'score' },
            { id: 'fl-games', title: 'Bird Player', description: '5 oyun oyna', goal: 5, xp: 40, icon: '🎮', trackKey: 'games' },
        ],
        'memory': [
            { id: 'mm-matches', title: 'Memory Master', description: '10 eşleşme bul', goal: 10, xp: 50, icon: '🃏', trackKey: 'matches' },
            { id: 'mm-games', title: 'Card Player', description: '3 oyun tamamla', goal: 3, xp: 60, icon: '🎴', trackKey: 'games' },
        ],
        'minesweeper': [
            { id: 'ms-cells', title: 'Minesweeper', description: '30 hücre aç', goal: 30, xp: 50, icon: '💣', trackKey: 'cells' },
            { id: 'ms-wins', title: 'Bomb Expert', description: '1 oyun kazan', goal: 1, xp: 100, icon: '🏆', trackKey: 'wins' },
        ],
        'tictactoe': [
            { id: 'ttt-wins', title: 'Tic Tac Champion', description: '2 oyun kazan', goal: 2, xp: 60, icon: '⭕', trackKey: 'wins' },
            { id: 'ttt-games', title: 'X O Player', description: '3 oyun oyna', goal: 3, xp: 40, icon: '❌', trackKey: 'games' },
        ]
    },

    // Game metadata
    GAMES: {
        'rase-clicker': { name: 'Rase Clicker', emoji: '💎', url: '/raseClicker/', color: 'from-cyan-500 to-blue-600' },
        'fight-arena': { name: 'Fight Arena', emoji: '⚔️', url: '/fightArena/', color: 'from-red-500 to-orange-600' },
        'cyber-runner': { name: 'Cyber Runner', emoji: '🏃', url: '/runnerGame/index.html', color: 'from-purple-500 to-pink-600' },
        '2048': { name: '2048', emoji: '🔢', url: '/game2048/', color: 'from-yellow-500 to-orange-600' },
        'snake': { name: 'Neon Snake', emoji: '🐍', url: '/snakeGame/', color: 'from-green-500 to-lime-600' },
        'tetris': { name: 'Cyber Blocks', emoji: '🧱', url: '/tetrisGame/', color: 'from-blue-500 to-indigo-600' },
        'flappy': { name: 'Pixel Bird', emoji: '🐦', url: '/flappyGame/', color: 'from-yellow-400 to-amber-500' },
        'memory': { name: 'Mind Match', emoji: '🃏', url: '/memoryGame/', color: 'from-pink-500 to-rose-600' },
        'minesweeper': { name: 'Bomb Squad', emoji: '💣', url: '/minesweeperGame/', color: 'from-gray-500 to-slate-600' },
        'tictactoe': { name: 'Tic Tac Pro', emoji: '⭕', url: '/tictactoeGame/', color: 'from-red-400 to-pink-500' }
    },

    // Level thresholds - XP required for each level
    LEVEL_THRESHOLDS: [
        { level: 1, xp: 0, title: 'Çaylak', emoji: '🌱', color: '#6b7280' },
        { level: 2, xp: 100, title: 'Çaylak', emoji: '🌱', color: '#6b7280' },
        { level: 3, xp: 250, title: 'Çaylak', emoji: '🌱', color: '#6b7280' },
        { level: 4, xp: 450, title: 'Çaylak', emoji: '🌱', color: '#6b7280' },
        { level: 5, xp: 700, title: 'Çaylak', emoji: '🌱', color: '#6b7280' },
        { level: 6, xp: 1000, title: 'Deneyimli', emoji: '⚡', color: '#3b82f6' },
        { level: 7, xp: 1400, title: 'Deneyimli', emoji: '⚡', color: '#3b82f6' },
        { level: 8, xp: 1900, title: 'Deneyimli', emoji: '⚡', color: '#3b82f6' },
        { level: 9, xp: 2500, title: 'Deneyimli', emoji: '⚡', color: '#3b82f6' },
        { level: 10, xp: 3200, title: 'Deneyimli', emoji: '⚡', color: '#3b82f6' },
        { level: 11, xp: 4000, title: 'Uzman', emoji: '💎', color: '#8b5cf6' },
        { level: 12, xp: 5000, title: 'Uzman', emoji: '💎', color: '#8b5cf6' },
        { level: 13, xp: 6200, title: 'Uzman', emoji: '💎', color: '#8b5cf6' },
        { level: 14, xp: 7600, title: 'Uzman', emoji: '💎', color: '#8b5cf6' },
        { level: 15, xp: 9200, title: 'Uzman', emoji: '💎', color: '#8b5cf6' },
        { level: 16, xp: 11000, title: 'Efsane', emoji: '👑', color: '#f59e0b' },
        { level: 17, xp: 13200, title: 'Efsane', emoji: '👑', color: '#f59e0b' },
        { level: 18, xp: 15800, title: 'Efsane', emoji: '👑', color: '#f59e0b' },
        { level: 19, xp: 18800, title: 'Efsane', emoji: '👑', color: '#f59e0b' },
        { level: 20, xp: 22200, title: 'Efsane', emoji: '👑', color: '#f59e0b' },
        { level: 21, xp: 26000, title: 'Mitik', emoji: '🔥', color: '#ef4444' },
        { level: 22, xp: 30500, title: 'Mitik', emoji: '🔥', color: '#ef4444' },
        { level: 23, xp: 35500, title: 'Mitik', emoji: '🔥', color: '#ef4444' },
        { level: 24, xp: 41000, title: 'Mitik', emoji: '🔥', color: '#ef4444' },
        { level: 25, xp: 50000, title: 'Mitik', emoji: '🔥', color: '#ef4444' }
    ],

    // Get level info from XP
    getLevelFromXP(xp) {
        let levelData = this.LEVEL_THRESHOLDS[0];
        for (let i = this.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
            if (xp >= this.LEVEL_THRESHOLDS[i].xp) {
                levelData = this.LEVEL_THRESHOLDS[i];
                break;
            }
        }
        return levelData;
    },

    // Get XP needed for next level
    getXPForNextLevel(currentXP) {
        const currentLevel = this.getLevelFromXP(currentXP);
        const nextLevelIndex = this.LEVEL_THRESHOLDS.findIndex(l => l.level === currentLevel.level + 1);

        if (nextLevelIndex === -1) {
            return { needed: 0, total: 0, isMax: true };
        }

        const nextLevel = this.LEVEL_THRESHOLDS[nextLevelIndex];
        return {
            needed: nextLevel.xp - currentXP,
            total: nextLevel.xp - currentLevel.xp,
            nextLevel: nextLevel,
            isMax: false
        };
    },

    // Get progress percentage within current level
    getLevelProgress(currentXP) {
        const currentLevel = this.getLevelFromXP(currentXP);
        const nextInfo = this.getXPForNextLevel(currentXP);

        if (nextInfo.isMax) return 100;

        const xpIntoLevel = currentXP - currentLevel.xp;
        return Math.round((xpIntoLevel / nextInfo.total) * 100);
    },

    // Get today's date as a seed for random generation
    getTodaySeed() {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    },

    // Seeded random number generator
    seededRandom(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return function () {
            hash = (hash * 1103515245 + 12345) & 0x7fffffff;
            return hash / 0x7fffffff;
        };
    },

    // Get today's 3 challenges
    getDailyChallenges() {
        const seed = this.getTodaySeed();
        const random = this.seededRandom(seed);

        // Get list of games
        const gameIds = Object.keys(this.CHALLENGE_POOL);

        // Shuffle games using seeded random
        const shuffledGames = [...gameIds].sort(() => random() - 0.5);

        // Pick 3 different games for today
        const selectedGames = shuffledGames.slice(0, 3);

        // Pick one random challenge from each game
        const dailyChallenges = selectedGames.map((gameId, index) => {
            const gameChallenges = this.CHALLENGE_POOL[gameId];
            const challengeIndex = Math.floor(random() * gameChallenges.length);
            const challenge = gameChallenges[challengeIndex];

            return {
                ...challenge,
                gameId: gameId,
                game: this.GAMES[gameId],
                dailyId: `${seed}-${index}`
            };
        });

        return dailyChallenges;
    },

    // Get user's challenge progress from localStorage
    getUserProgress(userId) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allProgress = stored ? JSON.parse(stored) : {};
        return allProgress[userId] || { date: '', challenges: {}, totalXP: 0, completedToday: 0 };
    },

    // Save user's challenge progress to localStorage
    saveUserProgress(userId, progress) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allProgress = stored ? JSON.parse(stored) : {};
        allProgress[userId] = progress;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress));
    },

    // Track game action - called from game pages
    trackAction(gameId, trackKey, amount = 1) {
        const user = window.currentUser;
        if (!user || user.isAnonymous) return;

        const userId = user.uid;
        const progress = this.getUserProgress(userId);
        const today = this.getTodaySeed();

        // Reset if it's a new day
        if (progress.date !== today) {
            progress.date = today;
            progress.challenges = {};
            progress.completedToday = 0;
        }

        // Find today's challenges that match this game and trackKey
        const dailyChallenges = this.getDailyChallenges();
        const matchingChallenges = dailyChallenges.filter(c => c.gameId === gameId && c.trackKey === trackKey);

        matchingChallenges.forEach(challenge => {
            if (!progress.challenges[challenge.id]) {
                progress.challenges[challenge.id] = { current: 0, completed: false };
            }

            // Don't add more if already completed
            if (progress.challenges[challenge.id].completed) return;

            progress.challenges[challenge.id].current += amount;

            // Check if challenge is completed
            if (progress.challenges[challenge.id].current >= challenge.goal) {
                progress.challenges[challenge.id].completed = true;
                progress.completedToday = (progress.completedToday || 0) + 1;

                // Add XP
                progress.totalXP = (progress.totalXP || 0) + challenge.xp;

                // Save XP to Firebase
                this.saveXPToFirebase(userId, progress.totalXP);

                // Show notification
                this.showChallengeComplete(challenge);
            }
        });

        this.saveUserProgress(userId, progress);
        return progress;
    },

    // Save XP to Firebase for leaderboard
    async saveXPToFirebase(userId, totalXP) {
        try {
            if (typeof firebase === 'undefined' || !firebase.database) return;

            const db = firebase.database();
            const user = window.currentUser;
            const levelInfo = this.getLevelFromXP(totalXP);

            await db.ref(`xpLeaderboard/${userId}`).set({
                username: user.displayName || 'Anonymous',
                xp: totalXP,
                level: levelInfo.level,
                lastUpdated: Date.now()
            });
        } catch (e) {
            console.error('Failed to save XP to Firebase:', e);
        }
    },

    // Get XP leaderboard from Firebase
    async getXPLeaderboard(limit = 10) {
        try {
            if (typeof firebase === 'undefined' || !firebase.database) return [];

            const db = firebase.database();
            const snapshot = await db.ref('xpLeaderboard')
                .orderByChild('xp')
                .limitToLast(limit)
                .once('value');

            if (!snapshot.exists()) return [];

            const data = snapshot.val();
            const leaderboard = Object.entries(data)
                .map(([uid, info]) => ({
                    uid,
                    username: info.username,
                    xp: info.xp
                }))
                .sort((a, b) => b.xp - a.xp);

            return leaderboard;
        } catch (e) {
            console.error('Failed to get XP leaderboard:', e);
            return [];
        }
    },

    // Show challenge complete notification
    showChallengeComplete(challenge) {
        const toast = document.createElement('div');
        toast.className = 'challenge-toast';
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 2rem;">${challenge.icon}</span>
                <div>
                    <div style="font-weight: bold; color: #10b981;">Görev Tamamlandı!</div>
                    <div>${challenge.title}</div>
                    <div style="color: #fbbf24; font-weight: bold;">+${challenge.xp} XP</div>
                </div>
            </div>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            right: 20px;
            background: linear-gradient(135deg, #1a2230, #2a3240);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(16, 185, 129, 0.5);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Get challenge status for display
    getChallengeStatus(userId, challengeId, goal) {
        const progress = this.getUserProgress(userId);
        const today = this.getTodaySeed();

        if (progress.date !== today) {
            return { current: 0, completed: false, percentage: 0 };
        }

        const challengeProgress = progress.challenges?.[challengeId] || { current: 0, completed: false };
        return {
            current: Math.min(challengeProgress.current, goal),
            completed: challengeProgress.completed,
            percentage: Math.min(100, Math.round((challengeProgress.current / goal) * 100))
        };
    },

    // Get time until next daily reset
    getTimeUntilReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const diff = tomorrow - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return { hours, minutes, seconds, total: diff };
    },

    // Format time remaining
    formatTimeRemaining() {
        const time = this.getTimeUntilReset();
        return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:${String(time.seconds).padStart(2, '0')}`;
    }
};

// Export for use in other files
window.ChallengesSystem = ChallengesSystem;

// Helper function to easily track from game pages
window.trackChallengeProgress = function (gameId, trackKey, amount = 1) {
    if (window.ChallengesSystem) {
        ChallengesSystem.trackAction(gameId, trackKey, amount);
    }
};
