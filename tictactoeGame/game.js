/**
 * Tic Tac Pro - Game Logic
 * Premium TicTacToe with Minimax AI and leaderboard integration
 */

class TicTacPro {
    constructor() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.playerWins = 0;
        this.aiWins = 0;
        this.draws = 0;
        this.winStreak = 0;
        this.bestStreak = parseInt(localStorage.getItem('bestTTTStreak') || '0');
        this.gameOver = false;
        this.difficulty = 'medium';

        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.updateIndicators();
    }

    setupEventListeners() {
        // Cell clicks
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());

        // Difficulty buttons
        document.querySelectorAll('input[name="difficulty"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                document.getElementById('difficultyLabel').textContent =
                    e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) + ' Mode';
                this.newGame();
            });
        });
    }

    handleCellClick(e) {
        if (this.gameOver) return;
        if (this.currentPlayer !== 'X') return;

        const index = parseInt(e.target.dataset.index);
        if (this.board[index]) return;

        this.makeMove(index, 'X');

        if (!this.gameOver) {
            this.updateIndicators();
            setTimeout(() => this.aiMove(), 400);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        const cell = document.querySelector(`[data-index="${index}"]`);

        // Set cell content with styling
        if (player === 'X') {
            cell.innerHTML = `<span class="text-6xl font-bold text-primary">${player}</span>`;
        } else {
            cell.innerHTML = `<span class="text-6xl font-bold text-gray-400 dark:text-gray-500">${player}</span>`;
        }
        cell.classList.add('taken');
        cell.style.cursor = 'not-allowed';

        const winner = this.checkWinner();
        if (winner) {
            this.endGame(winner);
        } else if (this.board.every(cell => cell !== null)) {
            this.endGame('draw');
        } else {
            this.currentPlayer = player === 'X' ? 'O' : 'X';
            this.updateTurnDisplay();
        }
    }

    aiMove() {
        if (this.gameOver) return;

        let move;
        switch (this.difficulty) {
            case 'easy':
                move = this.getRandomMove();
                break;
            case 'medium':
                move = Math.random() > 0.5 ? this.getBestMove() : this.getRandomMove();
                break;
            case 'hard':
                move = this.getBestMove();
                break;
        }

        if (move !== null) {
            this.makeMove(move, 'O');
            this.updateIndicators();
        }
    }

    getRandomMove() {
        const available = this.board
            .map((val, idx) => val === null ? idx : null)
            .filter(val => val !== null);
        return available[Math.floor(Math.random() * available.length)];
    }

    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        for (let i = 0; i < 9; i++) {
            if (this.board[i] === null) {
                this.board[i] = 'O';
                const score = this.minimax(this.board, 0, false);
                this.board[i] = null;

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }

        return bestMove;
    }

    minimax(board, depth, isMaximizing) {
        const winner = this.checkWinner();
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (board.every(cell => cell !== null)) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = null;
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === null) {
                    board[i] = 'X';
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = null;
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }

    checkWinner() {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return this.board[a];
            }
        }
        return null;
    }

    getWinningPattern() {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
                return pattern;
            }
        }
        return null;
    }

    endGame(result) {
        this.gameOver = true;
        const statusEl = document.getElementById('gameStatus');
        const turnEl = document.getElementById('turnText');

        if (result === 'X') {
            this.playerWins++;
            this.winStreak++;
            statusEl.textContent = 'Victory!';
            statusEl.className = 'px-3 py-1 bg-green-500/20 text-green-500 text-xs font-bold uppercase tracking-widest rounded-full mb-2';
            turnEl.textContent = '🎉 You Win!';

            // Update best streak
            if (this.winStreak > this.bestStreak) {
                this.bestStreak = this.winStreak;
                localStorage.setItem('bestTTTStreak', this.bestStreak);
            }

            // Submit to leaderboard
            if (typeof Leaderboard !== 'undefined') {
                Leaderboard.submit('tictactoe', this.winStreak);
            }

            document.getElementById('streakMessage').textContent =
                `Your best streak is ${this.bestStreak}. Keep going!`;

        } else if (result === 'O') {
            this.aiWins++;
            this.winStreak = 0;
            statusEl.textContent = 'Defeat';
            statusEl.className = 'px-3 py-1 bg-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest rounded-full mb-2';
            turnEl.textContent = '😢 CPU Wins';

        } else {
            this.draws++;
            statusEl.textContent = 'Draw';
            statusEl.className = 'px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-full mb-2';
            turnEl.textContent = "🤝 It's a Draw!";
        }

        this.updateStats();
        this.highlightWinningCells(result);
    }

    highlightWinningCells(winner) {
        if (winner !== 'X' && winner !== 'O') return;

        const pattern = this.getWinningPattern();
        if (!pattern) return;

        pattern.forEach(idx => {
            document.querySelector(`[data-index="${idx}"]`).classList.add('win-cell');
        });
    }

    newGame() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;

        // Reset cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('taken', 'win-cell');
            cell.style.cursor = 'pointer';
        });

        this.updateTurnDisplay();
        this.updateIndicators();
    }

    updateTurnDisplay() {
        const statusEl = document.getElementById('gameStatus');
        const turnEl = document.getElementById('turnText');

        if (this.currentPlayer === 'X') {
            statusEl.textContent = 'Your Turn';
            statusEl.className = 'px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-full mb-2';
            turnEl.textContent = "Player X's Turn";
        } else {
            statusEl.textContent = 'Thinking...';
            statusEl.className = 'px-3 py-1 bg-gray-500/20 text-gray-400 text-xs font-bold uppercase tracking-widest rounded-full mb-2';
            turnEl.textContent = "CPU's Turn";
        }
    }

    updateIndicators() {
        const playerInd = document.getElementById('playerIndicator');
        const aiInd = document.getElementById('aiIndicator');

        if (this.currentPlayer === 'X' && !this.gameOver) {
            playerInd.className = 'h-2 w-2 rounded-full bg-green-500 animate-pulse';
            aiInd.className = 'h-2 w-2 rounded-full bg-gray-400';
        } else if (this.currentPlayer === 'O' && !this.gameOver) {
            playerInd.className = 'h-2 w-2 rounded-full bg-gray-400';
            aiInd.className = 'h-2 w-2 rounded-full bg-green-500 animate-pulse';
        } else {
            playerInd.className = 'h-2 w-2 rounded-full bg-gray-400';
            aiInd.className = 'h-2 w-2 rounded-full bg-gray-400';
        }
    }

    updateStats() {
        const total = this.playerWins + this.aiWins + this.draws;

        document.getElementById('winStreak').textContent = this.winStreak;
        document.getElementById('winsCount').textContent = this.playerWins;
        document.getElementById('drawsCount').textContent = this.draws;
        document.getElementById('lossesCount').textContent = this.aiWins;
        document.getElementById('totalGames').textContent = total;

        if (total > 0) {
            const winRate = Math.round((this.playerWins / total) * 100);
            document.getElementById('winRate').textContent = winRate + '%';
            document.getElementById('winsBar').style.width = (this.playerWins / total * 100) + '%';
            document.getElementById('drawsBar').style.width = (this.draws / total * 100) + '%';
            document.getElementById('lossesBar').style.width = (this.aiWins / total * 100) + '%';
        }
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new TicTacPro();
});
