// Games Data - Central configuration for all games
// Categories: arcade, puzzle, strategy, action, multiplayer

const GAMES_DATA = {
    'rase-clicker': {
        name: 'Rase Clicker',
        path: '/games/raseClicker/',
        emoji: '💎',
        categories: ['arcade', 'action'],
        tags: 'Idle, Clicker',
        gradient: 'from-cyan-500/20 to-blue-600/20',
        badge: { text: 'POPULAR', color: 'bg-primary' }
    },
    'fight-arena': {
        name: 'Fight Arena',
        path: '/games/fightArena/',
        emoji: '⚔️',
        categories: ['action', 'multiplayer'],
        tags: 'Fighting, PvP',
        gradient: 'from-red-500/20 to-orange-600/20',
        badge: { text: 'MULTIPLAYER', color: 'bg-green-500' }
    },
    'cyber-runner': {
        name: 'Cyber Runner',
        path: '/games/runnerGame/',
        emoji: '🏃',
        categories: ['arcade', 'action'],
        tags: 'Platformer, Endless',
        gradient: 'from-purple-500/20 to-pink-600/20',
        badge: null
    },
    'snake': {
        name: 'Neon Snake',
        path: '/games/snakeGame/',
        emoji: '🐍',
        categories: ['arcade'],
        tags: 'Arcade, Classic',
        gradient: 'from-green-500/20 to-emerald-600/20',
        badge: null
    },
    'tetris': {
        name: 'Cyber Blocks',
        path: '/games/tetrisGame/',
        emoji: '🧱',
        categories: ['puzzle', 'arcade', 'strategy'],
        tags: 'Puzzle, Tetris',
        gradient: 'from-blue-500/20 to-indigo-600/20',
        badge: null
    },
    '2048': {
        name: 'Power 2048',
        path: '/games/game2048/',
        emoji: '🔢',
        categories: ['puzzle', 'strategy'],
        tags: 'Puzzle, Strategy',
        gradient: 'from-yellow-500/20 to-orange-600/20',
        badge: null
    },
    'flappy': {
        name: 'Pixel Bird',
        path: '/games/flappyGame/',
        emoji: '🐦',
        categories: ['arcade'],
        tags: 'Arcade, Reflex',
        gradient: 'from-sky-500/20 to-cyan-600/20',
        badge: null
    },
    'memory': {
        name: 'Mind Match',
        path: '/games/memoryGame/',
        emoji: '🃏',
        categories: ['puzzle'],
        tags: 'Memory, Cards',
        gradient: 'from-pink-500/20 to-rose-600/20',
        badge: null
    },
    'minesweeper': {
        name: 'Bomb Squad',
        path: '/games/minesweeperGame/',
        emoji: '💣',
        categories: ['puzzle', 'strategy'],
        tags: 'Puzzle, Minesweeper',
        gradient: 'from-gray-500/20 to-slate-600/20',
        badge: null
    },
    'tictactoe': {
        name: 'Tic Tac Pro',
        path: '/games/tictactoeGame/',
        emoji: '⭕',
        categories: ['strategy'],
        tags: 'Strategy, AI',
        gradient: 'from-violet-500/20 to-purple-600/20',
        badge: null
    }
};

// Export for use in other files
window.GAMES_DATA = GAMES_DATA;

// Helper: Get games by category
window.getGamesByCategory = function (category) {
    if (category === 'all') return Object.entries(GAMES_DATA);
    return Object.entries(GAMES_DATA).filter(([id, game]) =>
        game.categories.includes(category)
    );
};

// Helper: Get game by ID
window.getGameById = function (gameId) {
    return GAMES_DATA[gameId] || null;
};
