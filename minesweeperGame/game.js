/**
 * Bomb Squad - Minesweeper Game Logic
 * Premium minesweeper with flood-fill and leaderboard integration
 */

class BombSquad {
    constructor() {
        this.gridSize = 9;
        this.mineCount = 10;
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.timer = 0;
        this.timerInterval = null;
        this.flagsPlaced = 0;

        this.bestTimes = {
            9: parseInt(localStorage.getItem('bestMine9') || '999'),
            12: parseInt(localStorage.getItem('bestMine12') || '999'),
            16: parseInt(localStorage.getItem('bestMine16') || '999')
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateBestTime();
        this.newGame();
    }

    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.gridSize = parseInt(e.target.dataset.size);
                this.mineCount = parseInt(e.target.dataset.mines);
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateBestTime();
                this.newGame();
            });
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
    }

    newGame() {
        this.grid = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.gameWon = false;
        this.firstClick = true;
        this.flagsPlaced = 0;

        this.stopTimer();
        this.timer = 0;
        this.updateTimer();
        this.updateStats();
        this.hideOverlay();

        // Initialize empty grid
        for (let r = 0; r < this.gridSize; r++) {
            this.grid[r] = [];
            this.revealed[r] = [];
            this.flagged[r] = [];
            for (let c = 0; c < this.gridSize; c++) {
                this.grid[r][c] = 0;
                this.revealed[r][c] = false;
                this.flagged[r][c] = false;
            }
        }

        this.renderBoard();
    }

    placeMines(excludeRow, excludeCol) {
        let placed = 0;
        while (placed < this.mineCount) {
            const r = Math.floor(Math.random() * this.gridSize);
            const c = Math.floor(Math.random() * this.gridSize);

            // Don't place on first click or adjacent cells
            if (Math.abs(r - excludeRow) <= 1 && Math.abs(c - excludeCol) <= 1) continue;
            if (this.grid[r][c] === -1) continue;

            this.grid[r][c] = -1;
            placed++;
        }

        // Calculate numbers
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (this.grid[r][c] === -1) continue;
                this.grid[r][c] = this.countAdjacentMines(r, c);
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
                    if (this.grid[nr][nc] === -1) count++;
                }
            }
        }
        return count;
    }

    renderBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${this.gridSize}, 1fr)`;

        // Calculate cell size
        const maxBoardWidth = Math.min(window.innerWidth - 50, 450);
        const cellSize = Math.floor((maxBoardWidth - (this.gridSize + 1) * 3) / this.gridSize);
        board.style.width = `${cellSize * this.gridSize + (this.gridSize + 1) * 3 + 16}px`;

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'mine-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                cell.style.fontSize = `${Math.max(cellSize * 0.5, 12)}px`;

                // Click to reveal
                cell.addEventListener('click', () => this.revealCell(r, c));

                // Right click or long press to flag
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(r, c);
                });

                // Long press for mobile
                let pressTimer;
                cell.addEventListener('touchstart', (e) => {
                    pressTimer = setTimeout(() => {
                        e.preventDefault();
                        this.toggleFlag(r, c);
                    }, 500);
                });
                cell.addEventListener('touchend', () => clearTimeout(pressTimer));
                cell.addEventListener('touchmove', () => clearTimeout(pressTimer));

                board.appendChild(cell);
            }
        }
    }

    revealCell(row, col) {
        if (this.gameOver) return;
        if (this.revealed[row][col] || this.flagged[row][col]) return;

        // First click - place mines
        if (this.firstClick) {
            this.firstClick = false;
            this.placeMines(row, col);
            this.startTimer();
        }

        this.revealed[row][col] = true;

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('revealed');

        const value = this.grid[row][col];

        if (value === -1) {
            // Hit a mine
            cell.classList.add('mine', 'exploded');
            cell.textContent = '💣';
            this.endGame(false);
            return;
        }

        if (value > 0) {
            cell.textContent = value;
            cell.classList.add(`n${value}`);
        } else {
            // Flood fill empty cells
            this.floodFill(row, col);
        }

        // Check win
        if (this.checkWin()) {
            this.endGame(true);
        }
    }

    floodFill(row, col) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
                    if (!this.revealed[nr][nc] && !this.flagged[nr][nc]) {
                        this.revealCell(nr, nc);
                    }
                }
            }
        }
    }

    toggleFlag(row, col) {
        if (this.gameOver) return;
        if (this.revealed[row][col]) return;

        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

        if (this.flagged[row][col]) {
            this.flagged[row][col] = false;
            this.flagsPlaced--;
            cell.classList.remove('flagged');
            cell.textContent = '';
        } else {
            this.flagged[row][col] = true;
            this.flagsPlaced++;
            cell.classList.add('flagged');
            cell.textContent = '🚩';
        }

        this.updateStats();
    }

    checkWin() {
        let unrevealedSafe = 0;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (!this.revealed[r][c] && this.grid[r][c] !== -1) {
                    unrevealedSafe++;
                }
            }
        }
        return unrevealedSafe === 0;
    }

    endGame(won) {
        this.gameOver = true;
        this.gameWon = won;
        this.stopTimer();

        // Reveal all mines
        if (!won) {
            for (let r = 0; r < this.gridSize; r++) {
                for (let c = 0; c < this.gridSize; c++) {
                    if (this.grid[r][c] === -1) {
                        const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                        cell.classList.add('revealed', 'mine');
                        cell.textContent = '💣';
                    }
                }
            }
        }

        const titleEl = document.getElementById('resultText');
        const messageEl = document.getElementById('resultMessage');

        if (won) {
            titleEl.textContent = '🎉 Victory!';
            titleEl.className = 'overlay-title win';

            // Calculate score (lower time = higher score)
            const score = Math.max(0, 10000 - this.timer * 10);
            messageEl.textContent = `Cleared in ${this.formatTime(this.timer)}! Score: ${score}`;

            // Update best time
            if (this.timer < this.bestTimes[this.gridSize]) {
                this.bestTimes[this.gridSize] = this.timer;
                localStorage.setItem(`bestMine${this.gridSize}`, this.timer);
                this.updateBestTime();
            }

            // Submit to leaderboard
            if (typeof Leaderboard !== 'undefined') {
                Leaderboard.submit('minesweeper', score);
            }
        } else {
            titleEl.textContent = '💥 Boom!';
            titleEl.className = 'overlay-title lose';
            messageEl.textContent = 'You hit a mine! Try again.';
        }

        setTimeout(() => {
            document.getElementById('gameOverScreen').classList.remove('hidden');
        }, 500);
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timer++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.formatTime(this.timer);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateStats() {
        document.getElementById('mineCount').textContent = this.mineCount;
        document.getElementById('flagCount').textContent = this.flagsPlaced;
    }

    updateBestTime() {
        const best = this.bestTimes[this.gridSize];
        document.getElementById('bestTime').textContent =
            best < 999 ? this.formatTime(best) : '--';
    }

    hideOverlay() {
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new BombSquad();
});
