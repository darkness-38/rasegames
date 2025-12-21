// Daily Challenges System for Rase Games
// Generates 3 daily challenges based on the current date

const ChallengesSystem = {
    STORAGE_KEY: 'rase_games_challenges',

    // All possible challenges grouped by game
    CHALLENGE_POOL: {
        'rase-clicker': [
            { id: 'rc-1', title: 'Click Master', description: '1000 kez tıkla', goal: 1000, xp: 50, icon: '👆' },
            { id: 'rc-2', title: 'Diamond Hunter', description: '500 elmas topla', goal: 500, xp: 75, icon: '💎' },
            { id: 'rc-3', title: 'Speed Clicker', description: '10 saniyede 100 tıklama yap', goal: 100, xp: 100, icon: '⚡' },
            { id: 'rc-4', title: 'Upgrade King', description: '3 yükseltme al', goal: 3, xp: 60, icon: '⬆️' },
            { id: 'rc-5', title: 'Combo Master', description: '10x combo yap', goal: 10, xp: 80, icon: '🔥' },
        ],
        'fight-arena': [
            { id: 'fa-1', title: 'Arena Champion', description: '3 maç kazan', goal: 3, xp: 100, icon: '🏆' },
            { id: 'fa-2', title: 'Combo Fighter', description: '5 combo yap', goal: 5, xp: 75, icon: '👊' },
            { id: 'fa-3', title: 'Perfect Defense', description: '10 saldırıyı blokla', goal: 10, xp: 80, icon: '🛡️' },
            { id: 'fa-4', title: 'First Blood', description: '1 online maç oyna', goal: 1, xp: 50, icon: '⚔️' },
            { id: 'fa-5', title: 'Warrior Path', description: 'Warrior ile 2 maç kazan', goal: 2, xp: 90, icon: '🗡️' },
        ],
        'cyber-runner': [
            { id: 'cr-1', title: 'Distance Runner', description: '1000m koş', goal: 1000, xp: 60, icon: '🏃' },
            { id: 'cr-2', title: 'Coin Collector', description: '200 coin topla', goal: 200, xp: 50, icon: '🪙' },
            { id: 'cr-3', title: 'Obstacle Master', description: '50 engelden kaç', goal: 50, xp: 70, icon: '🚧' },
            { id: 'cr-4', title: 'Power Up Pro', description: '5 power-up kullan', goal: 5, xp: 55, icon: '⭐' },
            { id: 'cr-5', title: 'High Score', description: '5000 puan yap', goal: 5000, xp: 100, icon: '📈' },
        ],
        'pong': [
            { id: 'pg-1', title: 'Pong Master', description: '5 maç oyna', goal: 5, xp: 40, icon: '🏓' },
            { id: 'pg-2', title: 'Rally King', description: '20 ralli yap', goal: 20, xp: 60, icon: '🎾' },
            { id: 'pg-3', title: 'Perfect Game', description: 'AI\'yı yen', goal: 1, xp: 80, icon: '🤖' },
        ],
        '2048': [
            { id: '2k-1', title: 'Tile Merger', description: '512 tile\'ına ulaş', goal: 512, xp: 70, icon: '🔢' },
            { id: '2k-2', title: 'Score Hunter', description: '2000 puan yap', goal: 2000, xp: 50, icon: '🎯' },
            { id: '2k-3', title: 'Puzzle Pro', description: '2048\'e ulaş', goal: 2048, xp: 150, icon: '🧩' },
        ]
    },

    // Game metadata
    GAMES: {
        'rase-clicker': { name: 'Rase Clicker', emoji: '💎', url: '/raseClicker/', color: 'from-cyan-500 to-blue-600' },
        'fight-arena': { name: 'Fight Arena', emoji: '⚔️', url: '/fightArena/', color: 'from-red-500 to-orange-600' },
        'cyber-runner': { name: 'Cyber Runner', emoji: '🏃', url: '/runnerGame/index.html', color: 'from-purple-500 to-pink-600' },
        'pong': { name: 'Pong', emoji: '🏓', url: '/pong/', color: 'from-green-500 to-teal-600' },
        '2048': { name: '2048', emoji: '🔢', url: '/game2048/', color: 'from-yellow-500 to-orange-600' }
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
        const shuffledGames = gameIds.sort(() => random() - 0.5);

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

    // Get user's challenge progress
    getUserProgress(userId) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allProgress = stored ? JSON.parse(stored) : {};
        return allProgress[userId] || {};
    },

    // Save user's challenge progress
    saveUserProgress(userId, progress) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        const allProgress = stored ? JSON.parse(stored) : {};
        allProgress[userId] = progress;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allProgress));
    },

    // Update progress for a challenge
    updateProgress(userId, challengeId, amount) {
        const progress = this.getUserProgress(userId);
        const today = this.getTodaySeed();

        // Reset if it's a new day
        if (progress.date !== today) {
            progress.date = today;
            progress.challenges = {};
            progress.completedToday = 0;
        }

        if (!progress.challenges[challengeId]) {
            progress.challenges[challengeId] = { current: 0, completed: false };
        }

        progress.challenges[challengeId].current += amount;

        // Check if challenge is completed
        const challenge = this.getDailyChallenges().find(c => c.id === challengeId);
        if (challenge && progress.challenges[challengeId].current >= challenge.goal && !progress.challenges[challengeId].completed) {
            progress.challenges[challengeId].completed = true;
            progress.completedToday = (progress.completedToday || 0) + 1;

            // Add XP (you could integrate this with a user profile system)
            progress.totalXP = (progress.totalXP || 0) + challenge.xp;
        }

        this.saveUserProgress(userId, progress);
        return progress;
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
            current: challengeProgress.current,
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
