/**
 * Power 2048 - Game Logic
 * Premium 2048 with smooth animations and leaderboard integration
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

        this.tileSize = 0;
        this.gap = 10;

        this.init();
    }

    init() {
        this.calculateTileSize();
        this.setupEventListeners();
        this.updateBestScore();
        this.newGame();
    }

    calculateTileSize() {
        const board = document.getElementById('gameBoard');
        const boardSize = board.offsetWidth - 20; // padding
        this.tileSize = (boardSize - this.gap * (this.size + 1)) / this.size;
    }

    setupEventListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Touch / Swipe
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

            const absDx = Math.abs(dx);
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 30) {
                if (absDx > absDy) {
                    this.move(dx > 0 ? 'right' : 'left');
                } else {
                    this.move(dy > 0 ? 'down' : 'up');
                }
            }

            touchStartX = null;
            touchStartY = null;
        }, { passive: true });

        // Buttons
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.newGame());
        document.getElementById('continueBtn')?.addEventListener('click', () => this.continueGame());
        document.getElementById('newGameBtn')?.addEventListener('click', () => this.newGame());

        // Window resize
        window.addEventListener('resize', () => {
            this.calculateTileSize();
            this.renderTiles();
        });
    }

    handleKeydown(e) {
        if (this.gameOver && !this.keepPlaying) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const direction = e.key.replace('Arrow', '').toLowerCase();
            this.move(direction);
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

        this.addRandomTile();
        this.addRandomTile();
        this.renderTiles();
    }

    continueGame() {
        this.keepPlaying = true;
        this.hideOverlays();
    }

    hideOverlays() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('winScreen')?.classList.add('hidden');
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

        if (emptyCells.length === 0) return false;

        const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;

        return { r, c, value: this.grid[r][c] };
    }

    move(direction) {
        if (this.gameOver && !this.keepPlaying) return;

        const rotations = { up: 0, right: 1, down: 2, left: 3 };
        const times = rotations[direction];

        // Rotate grid to always process left
        let grid = this.rotateGrid(this.grid, times);
        let moved = false;
        let mergedPositions = [];

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

            while (newRow.length < this.size) {
                newRow.push(0);
            }

            if (newRow.join(',') !== grid[r].join(',')) {
                moved = true;
            }
            grid[r] = newRow;
        }

        // Rotate back
        grid = this.rotateGrid(grid, (4 - times) % 4);
        // Rotate merged positions back
        mergedPositions = mergedPositions.map(pos => this.rotatePosition(pos, (4 - times) % 4));

        if (moved) {
            this.grid = grid;
            const newTile = this.addRandomTile();
            this.updateScore();
            this.renderTiles(newTile, mergedPositions);

            if (this.won && !this.keepPlaying) {
                setTimeout(() => this.showWinScreen(), 300);
            } else if (this.isGameOver()) {
                this.gameOver = true;
                setTimeout(() => this.showGameOver(), 300);
            }
        }
    }

    rotateGrid(grid, times) {
        let result = grid.map(row => [...row]);
        for (let t = 0; t < times; t++) {
            const rotated = [];
            for (let c = 0; c < this.size; c++) {
                const row = [];
                for (let r = this.size - 1; r >= 0; r--) {
                    row.push(result[r][c]);
                }
                rotated.push(row);
            }
            result = rotated;
        }
        return result;
    }

    rotatePosition(pos, times) {
        let { r, c } = pos;
        for (let t = 0; t < times; t++) {
            const newR = c;
            const newC = this.size - 1 - r;
            r = newR;
            c = newC;
        }
        return { r, c };
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

        return true;
    }

    renderTiles(newTile = null, mergedPositions = []) {
        const container = document.getElementById('tilesContainer');
        container.innerHTML = '';

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const value = this.grid[r][c];
                if (value === 0) continue;

                const tile = document.createElement('div');
                tile.className = 'tile';

                // Tile class for color
                const tileClass = value <= 2048 ? `tile-${value}` : 'tile-super';
                tile.classList.add(tileClass);

                // Position
                const x = c * (this.tileSize + this.gap) + this.gap;
                const y = r * (this.tileSize + this.gap) + this.gap;
                tile.style.width = `${this.tileSize}px`;
                tile.style.height = `${this.tileSize}px`;
                tile.style.left = `${x}px`;
                tile.style.top = `${y}px`;

                // Animations
                if (newTile && newTile.r === r && newTile.c === c) {
                    tile.classList.add('new');
                }
                if (mergedPositions.some(p => p.r === r && p.c === c)) {
                    tile.classList.add('merged');
                }

                tile.textContent = value;
                container.appendChild(tile);
            }
        }
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('best2048', this.bestScore);
            this.updateBestScore();
        }
    }

    updateBestScore() {
        document.getElementById('bestScore').textContent = this.bestScore;
    }

    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').classList.remove('hidden');

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && this.score > 0) {
            Leaderboard.submit('game2048', this.score);
        }
    }

    showWinScreen() {
        const winScreen = document.getElementById('winScreen');
        if (winScreen) {
            winScreen.classList.remove('hidden');
        }

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && this.score > 0) {
            Leaderboard.submit('game2048', this.score);
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
