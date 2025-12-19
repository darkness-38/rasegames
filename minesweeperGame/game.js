
const gameBoard = document.getElementById('gameBoard');
const mineCountEl = document.getElementById('mineCount');
const flagCountEl = document.getElementById('flagCount');
const timerEl = document.getElementById('timer');
const bestTimeEl = document.getElementById('bestTime');
const gameOverScreen = document.getElementById('gameOverScreen');
const resultText = document.getElementById('resultText');
const resultMessage = document.getElementById('resultMessage');
const restartBtn = document.getElementById('restartBtn');
const diffBtns = document.querySelectorAll('.diff-btn');

let gridSize = 9;
let mineCount = 10;
let board = [];
let revealed = [];
let flagged = [];
let isGameOver = false;
let isFirstClick = true;
let timer = 0;
let timerInterval = null;
let flagsPlaced = 0;

let bestTime = parseInt(localStorage.getItem('minesweeperBest')) || null;
if (bestTime) bestTimeEl.textContent = bestTime + 's';

function createBoard(excludeX = -1, excludeY = -1) {
    board = [];
    revealed = [];
    flagged = [];

    
    for (let y = 0; y < gridSize; y++) {
        board[y] = [];
        revealed[y] = [];
        flagged[y] = [];
        for (let x = 0; x < gridSize; x++) {
            board[y][x] = 0;
            revealed[y][x] = false;
            flagged[y][x] = false;
        }
    }

    
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);

        
        if (Math.abs(x - excludeX) <= 1 && Math.abs(y - excludeY) <= 1) continue;
        if (board[y][x] === -1) continue;

        board[y][x] = -1;
        minesPlaced++;
    }

    
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (board[y][x] === -1) continue;
            board[y][x] = countAdjacentMines(x, y);
        }
    }
}

function countAdjacentMines(x, y) {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
                if (board[ny][nx] === -1) count++;
            }
        }
    }
    return count;
}

function renderBoard() {
    gameBoard.innerHTML = '';
    gameBoard.style.gridTemplateColumns = `repeat(${gridSize}, 32px)`;

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = x;
            cell.dataset.y = y;

            if (revealed[y][x]) {
                cell.classList.add('revealed');
                if (board[y][x] === -1) {
                    cell.classList.add('mine');
                    cell.textContent = '💣';
                } else if (board[y][x] > 0) {
                    cell.textContent = board[y][x];
                    cell.dataset.value = board[y][x];
                }
            } else if (flagged[y][x]) {
                cell.classList.add('flagged');
                cell.textContent = '🚩';
            }

            cell.addEventListener('click', () => handleClick(x, y));
            cell.addEventListener('contextmenu', (e) => { e.preventDefault(); handleRightClick(x, y); });

            
            let pressTimer;
            cell.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => { e.preventDefault(); handleRightClick(x, y); }, 500);
            });
            cell.addEventListener('touchend', () => clearTimeout(pressTimer));
            cell.addEventListener('touchmove', () => clearTimeout(pressTimer));

            gameBoard.appendChild(cell);
        }
    }
}

function handleClick(x, y) {
    if (isGameOver || flagged[y][x] || revealed[y][x]) return;

    if (isFirstClick) {
        isFirstClick = false;
        createBoard(x, y);
        startTimer();
    }

    revealCell(x, y);
    renderBoard();
    checkWin();
}

function handleRightClick(x, y) {
    if (isGameOver || revealed[y][x]) return;

    flagged[y][x] = !flagged[y][x];
    flagsPlaced += flagged[y][x] ? 1 : -1;
    flagCountEl.textContent = flagsPlaced;
    renderBoard();
}

function revealCell(x, y) {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    if (revealed[y][x] || flagged[y][x]) return;

    revealed[y][x] = true;

    if (board[y][x] === -1) {
        gameOver(false);
        return;
    }

    
    if (board[y][x] === 0) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                revealCell(x + dx, y + dy);
            }
        }
    }
}

function checkWin() {
    let revealedCount = 0;
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (revealed[y][x]) revealedCount++;
        }
    }

    if (revealedCount === gridSize * gridSize - mineCount) {
        gameOver(true);
    }
}

function gameOver(won) {
    isGameOver = true;
    stopTimer();

    
    if (!won) {
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (board[y][x] === -1) revealed[y][x] = true;
            }
        }
        renderBoard();
    }

    resultText.textContent = won ? '🎉 You Win!' : '💥 Game Over';

    if (won) {
        const score = calculateScore();
        resultMessage.textContent = `Time: ${timer}s • Score: ${score}`;

        if (!bestTime || timer < bestTime) {
            bestTime = timer;
            bestTimeEl.textContent = timer + 's';
            localStorage.setItem('minesweeperBest', timer);
        }

        if (window.Leaderboard && score > 0) {
            Leaderboard.submit('minesweeper', score);
        }
    } else {
        resultMessage.textContent = 'Better luck next time!';
    }

    gameOverScreen.classList.remove('hidden');
}

function calculateScore() {
    
    const difficultyMultiplier = mineCount * 10;
    const timeBonus = Math.max(0, 300 - timer);
    return difficultyMultiplier + timeBonus;
}

function startTimer() {
    timer = 0;
    timerInterval = setInterval(() => {
        timer++;
        timerEl.textContent = timer;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function initGame() {
    isGameOver = false;
    isFirstClick = true;
    flagsPlaced = 0;
    timer = 0;

    stopTimer();
    timerEl.textContent = 0;
    flagCountEl.textContent = 0;
    mineCountEl.textContent = mineCount;

    createBoard();
    renderBoard();
    gameOverScreen.classList.add('hidden');
}


diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        diffBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gridSize = parseInt(btn.dataset.size);
        mineCount = parseInt(btn.dataset.mines);
        initGame();
    });
});

restartBtn.addEventListener('click', initGame);


initGame();
