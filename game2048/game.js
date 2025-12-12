// 2048 Game - Rase Games
const tilesContainer = document.getElementById('tilesContainer');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const gameOverScreen = document.getElementById('gameOverScreen');
const resultText = document.getElementById('resultText');
const finalScoreEl = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

const SIZE = 4;
const CELL_SIZE = 72;
const GAP = 10;

let grid = [];
let score = 0;
let bestScore = parseInt(localStorage.getItem('2048Best')) || 0;
let isGameOver = false;

bestScoreEl.textContent = bestScore;

function createGrid() {
    grid = [];
    for (let y = 0; y < SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < SIZE; x++) {
            grid[y][x] = 0;
        }
    }
}

function getRandomEmptyCell() {
    const emptyCells = [];
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (grid[y][x] === 0) emptyCells.push({ x, y });
        }
    }
    return emptyCells.length > 0 ? emptyCells[Math.floor(Math.random() * emptyCells.length)] : null;
}

function addRandomTile() {
    const cell = getRandomEmptyCell();
    if (cell) {
        grid[cell.y][cell.x] = Math.random() < 0.9 ? 2 : 4;
        return cell;
    }
    return null;
}

function getTilePosition(x, y) {
    return {
        left: x * (CELL_SIZE + GAP),
        top: y * (CELL_SIZE + GAP)
    };
}

function renderTiles(newTile = null, mergedTiles = []) {
    tilesContainer.innerHTML = '';

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const value = grid[y][x];
            if (value === 0) continue;

            const tile = document.createElement('div');
            const tileClass = value > 2048 ? 'tile-super' : `tile-${value}`;
            tile.className = `tile ${tileClass}`;

            // Animation classes
            if (newTile && newTile.x === x && newTile.y === y) {
                tile.classList.add('new');
            }
            if (mergedTiles.some(t => t.x === x && t.y === y)) {
                tile.classList.add('merged');
            }

            const pos = getTilePosition(x, y);
            tile.style.left = pos.left + 'px';
            tile.style.top = pos.top + 'px';
            tile.textContent = value;

            tilesContainer.appendChild(tile);
        }
    }
}

function slideAndMerge(arr) {
    // Remove zeros and slide
    let filtered = arr.filter(v => v !== 0);
    let merged = [];
    let mergeScore = 0;

    // Merge adjacent equal values
    let i = 0;
    while (i < filtered.length) {
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
            merged.push(filtered[i] * 2);
            mergeScore += filtered[i] * 2;
            i += 2;
        } else {
            merged.push(filtered[i]);
            i++;
        }
    }

    // Pad with zeros
    while (merged.length < SIZE) {
        merged.push(0);
    }

    return { result: merged, score: mergeScore };
}

function move(direction) {
    if (isGameOver) return false;

    const oldGrid = grid.map(row => [...row]);
    const mergedTiles = [];
    let totalScore = 0;

    if (direction === 'left') {
        for (let y = 0; y < SIZE; y++) {
            const { result, score: s } = slideAndMerge(grid[y]);
            grid[y] = result;
            totalScore += s;
        }
    } else if (direction === 'right') {
        for (let y = 0; y < SIZE; y++) {
            const reversed = [...grid[y]].reverse();
            const { result, score: s } = slideAndMerge(reversed);
            grid[y] = result.reverse();
            totalScore += s;
        }
    } else if (direction === 'up') {
        for (let x = 0; x < SIZE; x++) {
            const col = [];
            for (let y = 0; y < SIZE; y++) col.push(grid[y][x]);
            const { result, score: s } = slideAndMerge(col);
            for (let y = 0; y < SIZE; y++) grid[y][x] = result[y];
            totalScore += s;
        }
    } else if (direction === 'down') {
        for (let x = 0; x < SIZE; x++) {
            const col = [];
            for (let y = 0; y < SIZE; y++) col.push(grid[y][x]);
            const reversed = col.reverse();
            const { result, score: s } = slideAndMerge(reversed);
            const finalCol = result.reverse();
            for (let y = 0; y < SIZE; y++) grid[y][x] = finalCol[y];
            totalScore += s;
        }
    }

    // Check if grid changed
    let moved = false;
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (grid[y][x] !== oldGrid[y][x]) moved = true;
        }
    }

    if (moved) {
        score += totalScore;
        scoreEl.textContent = score;
        if (score > bestScore) {
            bestScore = score;
            bestScoreEl.textContent = bestScore;
            localStorage.setItem('2048Best', bestScore);
        }

        const newTile = addRandomTile();
        renderTiles(newTile, mergedTiles);

        if (checkGameOver()) {
            gameOver();
        }
    }

    return moved;
}

function checkGameOver() {
    // Check for empty cells
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (grid[y][x] === 0) return false;
        }
    }

    // Check for possible merges
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            const value = grid[y][x];
            if (x < SIZE - 1 && grid[y][x + 1] === value) return false;
            if (y < SIZE - 1 && grid[y + 1][x] === value) return false;
        }
    }

    return true;
}

function checkWin() {
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (grid[y][x] === 2048) return true;
        }
    }
    return false;
}

function gameOver() {
    isGameOver = true;

    const won = checkWin();
    resultText.textContent = won ? '🎉 You Win!' : 'Game Over';
    finalScoreEl.textContent = score;
    gameOverScreen.classList.remove('hidden');

    if (window.Leaderboard && score > 0) {
        Leaderboard.submit('game2048', score);
    }
}

function initGame() {
    createGrid();
    score = 0;
    isGameOver = false;
    scoreEl.textContent = 0;

    addRandomTile();
    addRandomTile();
    renderTiles();
    gameOverScreen.classList.add('hidden');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace('Arrow', '').toLowerCase();
        move(direction);
    }
});

// Touch/swipe controls
let touchStartX = 0, touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 30) return; // Too small

    if (absDx > absDy) {
        move(dx > 0 ? 'right' : 'left');
    } else {
        move(dy > 0 ? 'down' : 'up');
    }
});

restartBtn.addEventListener('click', initGame);
playAgainBtn.addEventListener('click', initGame);

// Start game
initGame();
