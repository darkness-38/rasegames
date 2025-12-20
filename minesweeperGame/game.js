class BombSquad {
    constructor() {
        this.gridSize = 12;
        this.mineCount = 25;
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
        this.newGame();
    }

    setupEventListeners() {
        document.querySelectorAll('input[name="difficulty"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.gridSize = parseInt(e.target.dataset.size);
                this.mineCount = parseInt(e.target.dataset.mines);
                this.newGame();
            });
        });

        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.newGame());
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

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'mine-cell relative w-full aspect-square bg-slate-300 dark:bg-[#282e39] hover:bg-slate-400 dark:hover:bg-[#323b49] rounded sm:rounded-md cursor-pointer transition-colors shadow-inner flex items-center justify-center font-bold text-lg sm:text-xl select-none';
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Click to reveal
                cell.addEventListener('click', () => this.revealCell(r, c));

                // Right click to flag
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
        cell.classList.remove('bg-slate-300', 'dark:bg-[#282e39]', 'hover:bg-slate-400', 'dark:hover:bg-[#323b49]', 'cursor-pointer', 'shadow-inner');
        cell.classList.add('bg-background-light', 'dark:bg-background-dark');

        const value = this.grid[row][col];

        if (value === -1) {
            // Hit a mine
            cell.classList.add('cell-exploded');
            cell.innerHTML = '<span class="material-symbols-outlined text-red-500">bomb</span>';
            this.endGame(false);
            return;
        }

        if (value > 0) {
            const colors = {
                1: 'text-blue-500',
                2: 'text-emerald-500',
                3: 'text-rose-500',
                4: 'text-purple-500',
                5: 'text-orange-500',
                6: 'text-cyan-500',
                7: 'text-white',
                8: 'text-slate-400'
            };
            cell.innerHTML = `<span class="${colors[value] || 'text-white'}">${value}</span>`;
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
            cell.innerHTML = '';
        } else {
            this.flagged[row][col] = true;
            this.flagsPlaced++;
            cell.innerHTML = '<span class="material-symbols-outlined text-primary text-sm sm:text-base">flag</span>';
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
                        cell.classList.remove('bg-slate-300', 'dark:bg-[#282e39]');
                        cell.classList.add('bg-background-light', 'dark:bg-background-dark');
                        if (!this.flagged[r][c]) {
                            cell.innerHTML = '<span class="material-symbols-outlined text-red-500">bomb</span>';
                        }
                    }
                }
            }
        }

        const titleEl = document.getElementById('resultText');
        const messageEl = document.getElementById('resultMessage');

        if (won) {
            titleEl.textContent = '🎉 Victory!';
            titleEl.className = 'text-3xl font-bold mb-4 text-emerald-500';

            const score = Math.max(0, 10000 - this.timer * 10);
            const mins = Math.floor(this.timer / 60);
            const secs = this.timer % 60;
            messageEl.textContent = `Cleared in ${mins}:${secs.toString().padStart(2, '0')}! Score: ${score}`;

            // Update best time
            if (this.timer < this.bestTimes[this.gridSize]) {
                this.bestTimes[this.gridSize] = this.timer;
                localStorage.setItem(`bestMine${this.gridSize}`, this.timer);
            }

            // Submit to leaderboard
            if (typeof Leaderboard !== 'undefined') {
                Leaderboard.submit('minesweeper', score);
            }
        } else {
            titleEl.textContent = '💥 Boom!';
            titleEl.className = 'text-3xl font-bold mb-4 text-red-500';
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
        const mins = Math.floor(this.timer / 60);
        const secs = this.timer % 60;
        document.getElementById('timerMin').textContent = mins.toString().padStart(2, '0');
        document.getElementById('timerSec').textContent = secs.toString().padStart(2, '0');
    }

    updateStats() {
        document.getElementById('mineCount').textContent = this.mineCount;
        document.getElementById('flagCount').textContent = this.flagsPlaced;
    }

    hideOverlay() {
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BombSquad();
});
