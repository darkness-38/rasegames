/**
 * Power 2048 - Game Logic
 * Premium 2048 with Tailwind UI integration
 */

class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('best2048') || '0');
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;

        // Tile colors based on value
        this.tileStyles = {
            2: 'bg-white text-slate-900',
            4: 'bg-[#ede0c8] text-slate-800',
            8: 'bg-[#f2b179] text-white',
            16: 'bg-[#f59563] text-white',
            32: 'bg-[#f67c5f] text-white',
            64: 'bg-[#f65e3b] text-white',
            128: 'bg-[#edcf72] text-white ring-2 ring-yellow-400/50',
            256: 'bg-[#edcc61] text-white ring-2 ring-yellow-400/50',
            512: 'bg-[#edc850] text-white ring-2 ring-yellow-400/50',
            1024: 'bg-primary text-white ring-2 ring-primary/50 shadow-lg shadow-primary/40',
            2048: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/40'
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBestScore();
        this.newGame();
    }

    setupEventListeners() {
        // Restart buttons
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('winRestartBtn')?.addEventListener('click', () => this.newGame());
        document.getElementById('gameOverRestartBtn')?.addEventListener('click', () => this.newGame());
        document.getElementById('continueBtn')?.addEventListener('click', () => this.continueGame());

        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Touch
        let touchStartX, touchStartY;
        const board = document.getElementById('gameBoard');

        board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        board.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                if (Math.abs(dx) > 30) {
                    this.move(dx > 0 ? 'right' : 'left');
                }
            } else {
                if (Math.abs(dy) > 30) {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            }

            touchStartX = null;
            touchStartY = null;
        });
    }

    handleKeydown(e) {
        if (this.gameOver && !this.keepPlaying) return;

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            this.move(keyMap[e.key]);
        }
    }

    newGame() {
        this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.keepPlaying = false;

        this.updateScore();
        this.hideOverlays();

        // Add two initial tiles
        this.addRandomTile();
        this.addRandomTile();
        this.render();
    }

    continueGame() {
        this.keepPlaying = true;
        this.hideOverlays();
    }

    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }

        if (emptyCells.length > 0) {
            const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
            return { r, c };
        }
        return null;
    }

    move(direction) {
        if (this.gameOver && !this.keepPlaying) return;

        let moved = false;
        const mergedPositions = [];

        // Rotate grid to always process left-to-right
        let grid = this.rotateGrid(direction);

        for (let r = 0; r < this.size; r++) {
            const row = grid[r].filter(val => val !== 0);
            const newRow = [];

            for (let i = 0; i < row.length; i++) {
                if (i < row.length - 1 && row[i] === row[i + 1]) {
                    const merged = row[i] * 2;
                    newRow.push(merged);
                    this.score += merged;
                    mergedPositions.push({ r, c: newRow.length - 1 });
                    i++; // Skip next

                    if (merged === 2048 && !this.won && !this.keepPlaying) {
                        this.won = true;
                    }
                } else {
                    newRow.push(row[i]);
                }
            }

            // Fill with zeros
            while (newRow.length < this.size) {
                newRow.push(0);
            }

            if (JSON.stringify(grid[r]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            grid[r] = newRow;
        }

        // Rotate back
        this.grid = this.rotateGridBack(grid, direction);

        if (moved) {
            const newTile = this.addRandomTile();
            this.updateScore();
            this.render(newTile, mergedPositions);

            if (this.won && !this.keepPlaying) {
                this.showWinScreen();
            } else if (this.isGameOver()) {
                this.showGameOver();
            }
        }
    }

    rotateGrid(direction) {
        let grid = this.grid.map(row => [...row]);

        switch (direction) {
            case 'right':
                grid = grid.map(row => row.reverse());
                break;
            case 'up':
                grid = this.transpose(grid);
                break;
            case 'down':
                grid = this.transpose(grid).map(row => row.reverse());
                break;
        }
        return grid;
    }

    rotateGridBack(grid, direction) {
        switch (direction) {
            case 'right':
                return grid.map(row => row.reverse());
            case 'up':
                return this.transpose(grid);
            case 'down':
                return this.transpose(grid.map(row => row.reverse()));
            default:
                return grid;
        }
    }

    transpose(grid) {
        return grid[0].map((_, c) => grid.map(row => row[c]));
    }

    isGameOver() {
        // Check for empty cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.grid[r][c] === 0) return false;
            }
        }

        // Check for possible merges
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const val = this.grid[r][c];
                if (r < this.size - 1 && this.grid[r + 1][c] === val) return false;
                if (c < this.size - 1 && this.grid[r][c + 1] === val) return false;
            }
        }

        this.gameOver = true;
        return true;
    }

    render(newTile = null, mergedPositions = []) {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.grid[r][c];
                const cell = document.createElement('div');

                cell.className = 'rounded-lg flex items-center justify-center aspect-square transition-all duration-100 font-bold';

                if (value === 0) {
                    cell.classList.add('bg-cell-empty');
                } else {
                    const style = this.tileStyles[value] || 'bg-gradient-to-br from-purple-500 to-pink-500 text-white ring-2 ring-purple-400';
                    cell.className += ` ${style}`;

                    // Font size based on value
                    if (value >= 1000) {
                        cell.classList.add('text-xl', 'md:text-2xl');
                    } else if (value >= 100) {
                        cell.classList.add('text-2xl', 'md:text-3xl');
                    } else {
                        cell.classList.add('text-3xl', 'md:text-4xl');
                    }

                    cell.textContent = value;

                    // Animation classes
                    if (newTile && newTile.r === r && newTile.c === c) {
                        cell.classList.add('tile-new');
                    }
                    if (mergedPositions.some(pos => pos.r === r && pos.c === c)) {
                        cell.classList.add('tile-merged');
                    }
                }

                board.appendChild(cell);
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score.toLocaleString();

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('best2048', this.bestScore);
            this.updateBestScore();
        }
    }

    updateBestScore() {
        document.getElementById('bestScore').textContent = this.bestScore.toLocaleString();
    }

    showWinScreen() {
        document.getElementById('winScreen').classList.remove('hidden');

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && this.score > 0) {
            Leaderboard.submit('game2048', this.score);
        }
    }

    showGameOver() {
        document.getElementById('finalScore').textContent = this.score.toLocaleString();
        document.getElementById('gameOverScreen').classList.remove('hidden');

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && this.score > 0) {
            Leaderboard.submit('game2048', this.score);
        }
    }

    hideOverlays() {
        document.getElementById('winScreen')?.classList.add('hidden');
        document.getElementById('gameOverScreen')?.classList.add('hidden');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
