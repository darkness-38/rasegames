// Tic Tac Toe Game - Rase Games
const cells = document.querySelectorAll('.cell');
const statusEl = document.getElementById('status');
const playerWinsEl = document.getElementById('playerWins');
const aiWinsEl = document.getElementById('aiWins');
const drawsEl = document.getElementById('draws');
const restartBtn = document.getElementById('restartBtn');
const diffBtns = document.querySelectorAll('.diff-btn');

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let isGameOver = false;
let difficulty = 'medium';

let playerWins = parseInt(localStorage.getItem('tictactoePlayerWins')) || 0;
let aiWins = parseInt(localStorage.getItem('tictactoeAiWins')) || 0;
let draws = parseInt(localStorage.getItem('tictactoeDraws')) || 0;

playerWinsEl.textContent = playerWins;
aiWinsEl.textContent = aiWins;
drawsEl.textContent = draws;

function checkWinner(b) {
    for (const combo of WINNING_COMBOS) {
        const [a, c, d] = combo;
        if (b[a] && b[a] === b[c] && b[a] === b[d]) {
            return { winner: b[a], combo };
        }
    }
    return null;
}

function isBoardFull(b) {
    return b.every(cell => cell !== '');
}

function getAvailableMoves(b) {
    return b.map((cell, i) => cell === '' ? i : null).filter(i => i !== null);
}

// Minimax AI
function minimax(b, depth, isMaximizing, alpha, beta) {
    const result = checkWinner(b);
    if (result) return result.winner === 'O' ? 10 - depth : depth - 10;
    if (isBoardFull(b)) return 0;

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of getAvailableMoves(b)) {
            b[move] = 'O';
            const evalScore = minimax(b, depth + 1, false, alpha, beta);
            b[move] = '';
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of getAvailableMoves(b)) {
            b[move] = 'X';
            const evalScore = minimax(b, depth + 1, true, alpha, beta);
            b[move] = '';
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function getBestMove() {
    const available = getAvailableMoves(board);
    if (available.length === 0) return null;

    // Easy: random move
    if (difficulty === 'easy') {
        return available[Math.floor(Math.random() * available.length)];
    }

    // Medium: 50% best, 50% random
    if (difficulty === 'medium' && Math.random() < 0.5) {
        return available[Math.floor(Math.random() * available.length)];
    }

    // Hard/Medium(50%): use minimax
    let bestMove = available[0];
    let bestScore = -Infinity;

    for (const move of available) {
        board[move] = 'O';
        const score = minimax(board, 0, false, -Infinity, Infinity);
        board[move] = '';
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

function makeMove(index) {
    if (board[index] !== '' || isGameOver || currentPlayer !== 'X') return;

    board[index] = 'X';
    cells[index].textContent = 'X';
    cells[index].classList.add('x', 'taken');

    const result = checkWinner(board);
    if (result) {
        endGame(result);
        return;
    }

    if (isBoardFull(board)) {
        endGame(null);
        return;
    }

    currentPlayer = 'O';
    statusEl.textContent = 'CPU thinking...';

    // AI move with delay
    setTimeout(() => {
        const aiMove = getBestMove();
        if (aiMove !== null) {
            board[aiMove] = 'O';
            cells[aiMove].textContent = 'O';
            cells[aiMove].classList.add('o', 'taken');

            const result = checkWinner(board);
            if (result) {
                endGame(result);
                return;
            }

            if (isBoardFull(board)) {
                endGame(null);
                return;
            }
        }

        currentPlayer = 'X';
        statusEl.textContent = 'Your turn!';
    }, 500);
}

function endGame(result) {
    isGameOver = true;

    if (result) {
        result.combo.forEach(i => cells[i].classList.add('winning'));

        if (result.winner === 'X') {
            statusEl.textContent = '🎉 You win!';
            playerWins++;
            playerWinsEl.textContent = playerWins;
            localStorage.setItem('tictactoePlayerWins', playerWins);

            // Submit win streak to leaderboard
            if (window.Leaderboard) {
                Leaderboard.submit('tictactoe', playerWins);
            }
        } else {
            statusEl.textContent = '😔 CPU wins!';
            aiWins++;
            aiWinsEl.textContent = aiWins;
            localStorage.setItem('tictactoeAiWins', aiWins);
        }
    } else {
        statusEl.textContent = "It's a draw!";
        draws++;
        drawsEl.textContent = draws;
        localStorage.setItem('tictactoeDraws', draws);
    }
}

function initGame() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    isGameOver = false;
    statusEl.textContent = 'Your turn!';

    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
    });
}

// Event listeners
cells.forEach((cell, index) => {
    cell.addEventListener('click', () => makeMove(index));
});

restartBtn.addEventListener('click', initGame);

diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        difficulty = btn.dataset.level;
        initGame();
    });
});

// Start game
initGame();
