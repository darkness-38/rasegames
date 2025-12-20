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
        this.updateScores();
        this.updateStreak();
    }

    setupEventListeners() {
        // Cell clicks
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => this.newGame());

        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.setDifficulty(e.target.dataset.level));
        });
    }

    handleCellClick(e) {
        if (this.gameOver) return;
        if (this.currentPlayer !== 'X') return;

        const index = parseInt(e.target.dataset.index);
        if (this.board[index]) return;

        this.makeMove(index, 'X');

        if (!this.gameOver) {
            setTimeout(() => this.aiMove(), 400);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        const cell = document.querySelector(`[data-index="${index}"]`);
        cell.textContent = player;
        cell.classList.add(player.toLowerCase(), 'taken');

        const winner = this.checkWinner();
        if (winner) {
            this.endGame(winner);
        } else if (this.board.every(cell => cell !== null)) {
            this.endGame('draw');
        } else {
            this.currentPlayer = player === 'X' ? 'O' : 'X';
            this.updateStatus();
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
        const statusEl = document.getElementById('status');

        if (result === 'X') {
            this.playerWins++;
            this.winStreak++;
            statusEl.textContent = '🎉 You Win!';
            statusEl.className = 'status-text win';

            // Update best streak
            if (this.winStreak > this.bestStreak) {
                this.bestStreak = this.winStreak;
                localStorage.setItem('bestTTTStreak', this.bestStreak);
            }

            // Submit to leaderboard
            if (typeof Leaderboard !== 'undefined') {
                Leaderboard.submit('tictactoe', this.winStreak);
            }
        } else if (result === 'O') {
            this.aiWins++;
            this.winStreak = 0;
            statusEl.textContent = '😢 CPU Wins!';
            statusEl.className = 'status-text lose';
        } else {
            this.draws++;
            statusEl.textContent = "🤝 It's a Draw!";
            statusEl.className = 'status-text draw';
        }

        this.updateScores();
        this.updateStreak();
        this.showWinLine(result);
    }

    showWinLine(winner) {
        if (winner !== 'X' && winner !== 'O') return;

        const pattern = this.getWinningPattern();
        if (!pattern) return;

        // Highlight winning cells
        pattern.forEach(idx => {
            document.querySelector(`[data-index="${idx}"]`).classList.add('win-cell');
        });

        // Calculate line coordinates
        const lineCoords = this.getLineCoords(pattern);
        const svg = document.getElementById('winLine');
        const line = svg.querySelector('line');

        line.setAttribute('x1', lineCoords.x1);
        line.setAttribute('y1', lineCoords.y1);
        line.setAttribute('x2', lineCoords.x2);
        line.setAttribute('y2', lineCoords.y2);

        // Change line color based on winner
        line.style.stroke = winner === 'X' ? '#00d4ff' : '#ff006e';

        svg.classList.add('show');
    }

    getLineCoords(pattern) {
        const coords = {
            [JSON.stringify([0, 1, 2])]: { x1: 5, y1: 17, x2: 95, y2: 17 },
            [JSON.stringify([3, 4, 5])]: { x1: 5, y1: 50, x2: 95, y2: 50 },
            [JSON.stringify([6, 7, 8])]: { x1: 5, y1: 83, x2: 95, y2: 83 },
            [JSON.stringify([0, 3, 6])]: { x1: 17, y1: 5, x2: 17, y2: 95 },
            [JSON.stringify([1, 4, 7])]: { x1: 50, y1: 5, x2: 50, y2: 95 },
            [JSON.stringify([2, 5, 8])]: { x1: 83, y1: 5, x2: 83, y2: 95 },
            [JSON.stringify([0, 4, 8])]: { x1: 5, y1: 5, x2: 95, y2: 95 },
            [JSON.stringify([2, 4, 6])]: { x1: 95, y1: 5, x2: 5, y2: 95 }
        };
        return coords[JSON.stringify(pattern)];
    }

    setDifficulty(level) {
        this.difficulty = level;
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.level === level);
        });
        this.newGame();
    }

    newGame() {
        this.board = Array(9).fill(null);
        this.currentPlayer = 'X';
        this.gameOver = false;

        // Reset cells
        document.querySelectorAll('.cell').forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });

        // Hide win line
        document.getElementById('winLine').classList.remove('show');

        this.updateStatus();
    }

    updateStatus() {
        const statusEl = document.getElementById('status');
        if (this.currentPlayer === 'X') {
            statusEl.textContent = 'Your turn!';
        } else {
            statusEl.textContent = 'CPU thinking...';
        }
        statusEl.className = 'status-text';
    }

    updateScores() {
        document.getElementById('playerWins').textContent = this.playerWins;
        document.getElementById('aiWins').textContent = this.aiWins;
        document.getElementById('draws').textContent = this.draws;
    }

    updateStreak() {
        document.getElementById('winStreak').textContent = this.winStreak;
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new TicTacPro();
});
