// Daily Challenges System for Rase Games
// Generates 3 daily challenges based on the current date
// Tracks progress and saves XP to Firebase

const ChallengesSystem = {
    STORAGE_KEY: 'rase_games_challenges',

    // All possible challenges grouped by game - simplified for trackable actions
    CHALLENGE_POOL: {
        'rase-clicker': [
            { id: 'rc-clicks', title: 'Click Master', description: 'Click 500 times', goal: 500, xp: 50, icon: '👆', trackKey: 'clicks' },
            { id: 'rc-diamonds', title: 'Diamond Hunter', description: 'Collect 100 diamonds', goal: 100, xp: 75, icon: '💎', trackKey: 'diamonds' },
        ],
        'fight-arena': [
            { id: 'fa-wins', title: 'Arena Champion', description: 'Win 2 matches', goal: 2, xp: 100, icon: '🏆', trackKey: 'wins' },
            { id: 'fa-matches', title: 'Fighter', description: 'Play 3 matches', goal: 3, xp: 50, icon: '⚔️', trackKey: 'matches' },
        ],
        'cyber-runner': [
            { id: 'cr-distance', title: 'Distance Runner', description: 'Run 500m', goal: 500, xp: 60, icon: '🏃', trackKey: 'distance' },
            { id: 'cr-coins', title: 'Coin Collector', description: 'Collect 50 coins', goal: 50, xp: 50, icon: '🪙', trackKey: 'coins' },
            { id: 'cr-score', title: 'High Score', description: 'Score 2000 points', goal: 2000, xp: 100, icon: '📈', trackKey: 'score', mode: 'max' },
        ],
        '2048': [
            { id: '2k-score', title: 'Score Hunter', description: 'Score 1000 points', goal: 1000, xp: 50, icon: '🎯', trackKey: 'score', mode: 'max' },
            { id: '2k-moves', title: 'Move Master', description: 'Make 100 moves', goal: 100, xp: 40, icon: '🔢', trackKey: 'moves' },
        ],
        'snake': [
            { id: 'sn-score', title: 'Snake Master', description: 'Score 50 points', goal: 50, xp: 60, icon: '🐍', trackKey: 'score', mode: 'max' },
            { id: 'sn-food', title: 'Food Collector', description: 'Eat 30 food', goal: 30, xp: 50, icon: '🍎', trackKey: 'food' },
        ],
        'tetris': [
            { id: 'tt-lines', title: 'Line Clearer', description: 'Clear 10 lines', goal: 10, xp: 70, icon: '🧱', trackKey: 'lines' },
            { id: 'tt-score', title: 'Tetris Pro', description: 'Score 1000 points', goal: 1000, xp: 60, icon: '📊', trackKey: 'score', mode: 'max' },
        ],
        'flappy': [
            { id: 'fl-score', title: 'Flappy Master', description: 'Pass 10 pipes', goal: 10, xp: 80, icon: '🐦', trackKey: 'score', mode: 'max' },
            { id: 'fl-games', title: 'Bird Player', description: 'Play 5 games', goal: 5, xp: 40, icon: '🎮', trackKey: 'games' },
        ],
        'memory': [
            { id: 'mm-matches', title: 'Memory Master', description: 'Find 10 matches', goal: 10, xp: 50, icon: '🃏', trackKey: 'matches' },
            { id: 'mm-games', title: 'Card Player', description: 'Complete 3 games', goal: 3, xp: 60, icon: '🎴', trackKey: 'games' },
        ],
        'minesweeper': [
            { id: 'ms-cells', title: 'Minesweeper', description: 'Open 30 cells', goal: 30, xp: 50, icon: '💣', trackKey: 'cells' },
            { id: 'ms-wins', title: 'Bomb Expert', description: 'Win 1 game', goal: 1, xp: 100, icon: '🏆', trackKey: 'wins' },
        ],
        'tictactoe': [
            { id: 'ttt-wins', title: 'Tic Tac Champion', description: 'Win 2 games', goal: 2, xp: 60, icon: '⭕', trackKey: 'wins' },
            { id: 'ttt-games', title: 'X O Player', description: 'Play 3 games', goal: 3, xp: 40, icon: '❌', trackKey: 'games' },
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
        { level: 1, xp: 0, title: 'Rookie', emoji: '🌱', color: '#6b7280' },
        { level: 2, xp: 100, title: 'Rookie', emoji: '🌱', color: '#6b7280' },
        { level: 3, xp: 250, title: 'Rookie', emoji: '🌱', color: '#6b7280' },
        { level: 4, xp: 450, title: 'Rookie', emoji: '🌱', color: '#6b7280' },
        { level: 5, xp: 700, title: 'Rookie', emoji: '🌱', color: '#6b7280' },
        { level: 6, xp: 1000, title: 'Experienced', emoji: '⚡', color: '#3b82f6' },
        { level: 7, xp: 1400, title: 'Experienced', emoji: '⚡', color: '#3b82f6' },
        { level: 8, xp: 1900, title: 'Experienced', emoji: '⚡', color: '#3b82f6' },
        { level: 9, xp: 2500, title: 'Experienced', emoji: '⚡', color: '#3b82f6' },
        { level: 10, xp: 3200, title: 'Experienced', emoji: '⚡', color: '#3b82f6' },
        { level: 11, xp: 4000, title: 'Expert', emoji: '💎', color: '#8b5cf6' },
        { level: 12, xp: 5000, title: 'Expert', emoji: '💎', color: '#8b5cf6' },
        { level: 13, xp: 6200, title: 'Expert', emoji: '💎', color: '#8b5cf6' },
        { level: 14, xp: 7600, title: 'Expert', emoji: '💎', color: '#8b5cf6' },
        { level: 15, xp: 9200, title: 'Expert', emoji: '💎', color: '#8b5cf6' },
        { level: 16, xp: 11000, title: 'Legend', emoji: '👑', color: '#f59e0b' },
        { level: 17, xp: 13200, title: 'Legend', emoji: '👑', color: '#f59e0b' },
        { level: 18, xp: 15800, title: 'Legend', emoji: '👑', color: '#f59e0b' },
        { level: 19, xp: 18800, title: 'Legend', emoji: '👑', color: '#f59e0b' },
        { level: 20, xp: 22200, title: 'Legend', emoji: '👑', color: '#f59e0b' },
        { level: 21, xp: 26000, title: 'Mythic', emoji: '🔥', color: '#ef4444' },
        { level: 22, xp: 30500, title: 'Mythic', emoji: '🔥', color: '#ef4444' },
        { level: 23, xp: 35500, title: 'Mythic', emoji: '🔥', color: '#ef4444' },
        { level: 24, xp: 41000, title: 'Mythic', emoji: '🔥', color: '#ef4444' },
        { level: 25, xp: 50000, title: 'Mythic', emoji: '🔥', color: '#ef4444' }
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
    getDailyChallenges(level = 1) {
        const seed = this.getTodaySeed();
        const random = this.seededRandom(seed);

        // Get list of games
        const gameIds = Object.keys(this.CHALLENGE_POOL);

        // Shuffle games using seeded random
        const shuffledGames = [...gameIds].sort(() => random() - 0.5);

        // Pick 3 different games for today
        const selectedGames = shuffledGames.slice(0, 3);

        // Scaling factor: 10% increase per level
        // Level 1: 1.0x, Level 11: 2.0x, Level 21: 3.0x
        const scaleFactor = 1 + (level - 1) * 0.1;

        // Pick one random challenge from each game
        const dailyChallenges = selectedGames.map((gameId, index) => {
            const gameChallenges = this.CHALLENGE_POOL[gameId];
            const challengeIndex = Math.floor(random() * gameChallenges.length);
            const challenge = gameChallenges[challengeIndex];

            // Scale goal and XP
            const scaledGoal = Math.round(challenge.goal * scaleFactor);
            const scaledXP = Math.round(challenge.xp * scaleFactor);

            return {
                ...challenge,
                goal: scaledGoal,
                originalGoal: challenge.goal, // Keep track of base goal
                xp: scaledXP,
                originalXP: challenge.xp,     // Keep track of base xp
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
        // Ensure dayStartLevel exists for consistency
        const defaultProgress = { date: '', challenges: {}, totalXP: 0, completedToday: 0, dayStartLevel: 1 };
        return allProgress[userId] || defaultProgress;
    },

    // Save user's challenge progress to localStorage
    saveUserProgress(userId, progress) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allProgress = stored ? JSON.parse(stored) : {};
        allProgress[userId] = progress;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress));
    },

    // Ensure daily progress is initialized for the user
    ensureDailyInit(userId) {
        const progress = this.getUserProgress(userId);
        const today = this.getTodaySeed();

        // Reset if it's a new day
        if (progress.date !== today) {
            progress.date = today;
            progress.challenges = {};
            progress.completedToday = 0;

            // Set dayStartLevel to current level
            const levelInfo = this.getLevelFromXP(progress.totalXP || 0);
            progress.dayStartLevel = levelInfo.level;

            this.saveUserProgress(userId, progress);
        }

        return progress;
    },


    // Track game action - called from game pages
    trackAction(gameId, trackKey, amount = 1) {
        const user = window.currentUser;
        if (!user || user.isAnonymous) return;

        const userId = user.uid;
        // Ensure initialized for today
        const progress = this.ensureDailyInit(userId);

        // Use dayStartLevel for challenge scaling (fallback to 1 if missing for some reason)
        const currentChallengeLevel = progress.dayStartLevel || 1;

        // Find today's challenges that match this game and trackKey
        const dailyChallenges = this.getDailyChallenges(currentChallengeLevel);
        const matchingChallenges = dailyChallenges.filter(c => c.gameId === gameId && c.trackKey === trackKey);

        matchingChallenges.forEach(challenge => {
            if (!progress.challenges[challenge.id]) {
                progress.challenges[challenge.id] = { current: 0, completed: false };
            }

            // Don't add more if already completed
            if (progress.challenges[challenge.id].completed) return;

            if (challenge.mode === 'max') {
                // For 'max' mode, usually track high score - only update if current amount is higher
                const currentVal = progress.challenges[challenge.id].current || 0;
                if (amount > currentVal) {
                    progress.challenges[challenge.id].current = amount;
                }
            } else {
                // Default 'cumulative' mode
                progress.challenges[challenge.id].current += amount;
            }

            // Check if challenge is completed
            if (progress.challenges[challenge.id].current >= challenge.goal) {
                progress.challenges[challenge.id].completed = true;
                progress.completedToday = (progress.completedToday || 0) + 1;

                // Add XP (scaled)
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
                    <div style="font-weight: bold; color: #10b981;">Challenge Completed!</div>
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
    },

    // Gameplay XP cooldowns (prevent spam)
    _gameplayCooldowns: {},

    // Award XP for playing games (not challenges)
    // trigger: 'play' (2 XP), 'score' (3-5 XP based on score), 'win' (+10 XP)
    awardGameplayXP(gameId, trigger = 'play', score = 0) {
        const user = window.currentUser;
        if (!user || user.isAnonymous) return null;

        const userId = user.uid;
        const now = Date.now();
        const cooldownKey = `${userId}-${gameId}-${trigger}`;
        const cooldownMs = 30000; // 30 seconds cooldown

        // Check cooldown
        if (this._gameplayCooldowns[cooldownKey] && now - this._gameplayCooldowns[cooldownKey] < cooldownMs) {
            return null; // Still on cooldown
        }

        // Set cooldown
        this._gameplayCooldowns[cooldownKey] = now;

        // Calculate XP based on trigger
        let xpAmount = 0;
        let reason = '';

        switch (trigger) {
            case 'play':
                xpAmount = 2;
                reason = 'Game Started';
                break;
            case 'score':
                // 3-5 XP based on score magnitude
                xpAmount = Math.min(5, Math.max(3, Math.floor(score / 100) + 3));
                reason = 'Game Complete';
                break;
            case 'win':
                xpAmount = 10;
                reason = 'Victory!';
                break;
            default:
                xpAmount = 2;
                reason = 'Playing';
        }

        // Get or create progress
        const progress = this.ensureDailyInit(userId);
        progress.totalXP = (progress.totalXP || 0) + xpAmount;
        this.saveUserProgress(userId, progress);

        // Save to Firebase
        this.saveXPToFirebase(userId, progress.totalXP);

        // Show toast
        this.showGameplayXPToast(xpAmount, reason, gameId);

        return { xpAwarded: xpAmount, totalXP: progress.totalXP };
    },

    // Show small XP toast for gameplay
    showGameplayXPToast(xp, reason, gameId) {
        const gameInfo = this.GAMES[gameId] || { emoji: '🎮', name: 'Game' };

        const toast = document.createElement('div');
        toast.innerHTML = `
            <span style="font-size: 1.2rem;">${gameInfo.emoji}</span>
            <span style="color: #fbbf24; font-weight: bold;">+${xp} XP</span>
            <span style="color: #9ca3af; font-size: 0.75rem;">${reason}</span>
        `;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #1a2230, #2a3240);
            color: white;
            padding: 10px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            border: 1px solid rgba(251, 191, 36, 0.3);
            z-index: 10000;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.875rem;
            animation: xpSlideIn 0.3s ease;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes xpSlideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
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

// Helper function for gameplay XP from game pages
window.awardGameplayXP = function (gameId, trigger = 'play', score = 0) {
    if (window.ChallengesSystem) {
        ChallengesSystem.awardGameplayXP(gameId, trigger, score);
    }
};
