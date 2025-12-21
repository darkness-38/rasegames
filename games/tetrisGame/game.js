
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d');

const scoreElement = document.getElementById('score');
const linesElement = document.getElementById('lines');
const levelElement = document.getElementById('level');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const finalLinesElement = document.getElementById('finalLines');
const restartBtn = document.getElementById('restartBtn');

const COLS = 10, ROWS = 20, BLOCK_SIZE = 30, PREVIEW_BLOCK = 20;

const SHAPES = {
    I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]],
    S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]], L: [[0, 0, 1], [1, 1, 1]]
};

const COLORS = { I: '#00ffff', O: '#ffff00', T: '#ff00ff', S: '#00ff00', Z: '#ff0000', J: '#0066ff', L: '#ff8800' };

let board = [], currentPiece = null, nextPiece = null, holdPiece = null, canHold = true;
let score = 0, lines = 0, level = 1, highScore = parseInt(localStorage.getItem('tetrisHighScore')) || 0;
let gameLoop = null, dropInterval = 1000, lastDrop = 0, isGameRunning = false;

highScoreElement.textContent = highScore;

function createBoard() {
    board = [];
    for (let r = 0; r < ROWS; r++) { board[r] = []; for (let c = 0; c < COLS; c++) board[r][c] = 0; }
}

class Piece {
    constructor(type) {
        this.type = type;
        this.shape = SHAPES[type].map(row => [...row]);
        this.color = COLORS[type];
        this.x = Math.floor(COLS / 2) - Math.ceil(this.shape[0].length / 2);
        this.y = 0;
    }
    rotate() {
        const rotated = [];
        for (let c = 0; c < this.shape[0].length; c++) {
            rotated[c] = [];
            for (let r = this.shape.length - 1; r >= 0; r--) rotated[c].push(this.shape[r][c]);
        }
        return rotated;
    }
}

function randomPiece() {
    const types = Object.keys(SHAPES);
    return new Piece(types[Math.floor(Math.random() * types.length)]);
}

function collision(piece, ox = 0, oy = 0, shape = piece.shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c]) {
                const nx = piece.x + c + ox, ny = piece.y + r + oy;
                if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
                if (ny >= 0 && board[ny][nx]) return true;
            }
        }
    }
    return false;
}

function lockPiece() {
    for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
            if (currentPiece.shape[r][c]) {
                const y = currentPiece.y + r, x = currentPiece.x + c;
                if (y >= 0) board[y][x] = currentPiece.color;
            }
        }
    }
    clearLines();
    spawnPiece();
}

function clearLines() {
    let cleared = 0;
    let clearedRows = [];

    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            // Store colors before clearing for particles
            for (let c = 0; c < COLS; c++) {
                const color = board[r][c];
                const x = c * BLOCK_SIZE + BLOCK_SIZE / 2;
                const y = r * BLOCK_SIZE + BLOCK_SIZE / 2;
                createParticles(x, y, color, 5);
            }
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            cleared++; r++;
        }
    }
    if (cleared > 0) {
        const pts = [0, 100, 300, 500, 800];
        score += pts[cleared] * level;
        lines += cleared;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        scoreElement.textContent = score;
        linesElement.textContent = lines;
        levelElement.textContent = level.toString().padStart(2, '0');

        // Track for daily challenges
        if (typeof trackChallengeProgress === 'function') {
            trackChallengeProgress('tetris', 'lines', cleared);
            trackChallengeProgress('tetris', 'score', pts[cleared] * level);
        }

        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('tetrisHighScore', highScore);
        }
    }
}

function spawnPiece() {
    currentPiece = nextPiece || randomPiece();
    nextPiece = randomPiece();
    canHold = true;
    drawNextPiece();
    if (collision(currentPiece)) gameOver();
}

function hold() {
    if (!canHold) return;
    canHold = false;
    if (holdPiece) {
        const temp = new Piece(holdPiece.type);
        holdPiece = new Piece(currentPiece.type);
        currentPiece = temp;
    } else {
        holdPiece = new Piece(currentPiece.type);
        spawnPiece();
    }
    drawHoldPiece();
}

// Particle system for effects
let particles = [];

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8 - 3,
            color: color,
            life: 1,
            size: Math.random() * 6 + 2
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // gravity
        p.life -= 0.03;
        p.size *= 0.97;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

function drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
    const px = x * size;
    const py = y * size;
    const margin = 1;
    const innerSize = size - margin * 2;

    // Block shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(px + margin + 2, py + margin + 2, innerSize, innerSize);

    // Main block with gradient
    const gradient = ctx.createLinearGradient(px, py, px + size, py + size);
    gradient.addColorStop(0, lightenColor(color, 30));
    gradient.addColorStop(0.5, color);
    gradient.addColorStop(1, darkenColor(color, 30));

    ctx.fillStyle = gradient;
    ctx.shadowBlur = 8;
    ctx.shadowColor = color;

    // Rounded rectangle for 3D effect
    ctx.beginPath();
    ctx.roundRect(px + margin, py + margin, innerSize, innerSize, 4);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top highlight (3D effect)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.roundRect(px + margin + 2, py + margin + 2, innerSize - 4, innerSize / 4, 2);
    ctx.fill();

    // Inner border glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px + margin + 1, py + margin + 1, innerSize - 2, innerSize - 2, 3);
    ctx.stroke();

    // Bottom dark edge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.roundRect(px + margin + 2, py + margin + innerSize - 6, innerSize - 4, 4, 2);
    ctx.fill();
}

// Color helper functions
function lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function drawBoard() {
    // Dark background with subtle gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, '#0a0e14');
    bgGradient.addColorStop(1, '#050810');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines with glow
    ctx.strokeStyle = 'rgba(15, 73, 189, 0.1)';
    ctx.lineWidth = 1;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
    }

    // Draw locked blocks
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c]) drawBlock(ctx, c, r, board[r][c]);
        }
    }

    // Draw particles
    updateParticles();
    drawParticles();
}

function drawPiece() {
    if (!currentPiece) return;
    let ghostY = currentPiece.y;
    while (!collision(currentPiece, 0, ghostY - currentPiece.y + 1)) ghostY++;
    ctx.globalAlpha = 0.3;
    for (let r = 0; r < currentPiece.shape.length; r++)
        for (let c = 0; c < currentPiece.shape[r].length; c++)
            if (currentPiece.shape[r][c]) drawBlock(ctx, currentPiece.x + c, ghostY + r, currentPiece.color);
    ctx.globalAlpha = 1;
    for (let r = 0; r < currentPiece.shape.length; r++)
        for (let c = 0; c < currentPiece.shape[r].length; c++)
            if (currentPiece.shape[r][c]) drawBlock(ctx, currentPiece.x + c, currentPiece.y + r, currentPiece.color);
}

function drawPreviewPiece(ctx, piece, size) {
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, size, size);
    if (!piece) return;
    const ox = (size - piece.shape[0].length * PREVIEW_BLOCK) / 2;
    const oy = (size - piece.shape.length * PREVIEW_BLOCK) / 2;
    for (let r = 0; r < piece.shape.length; r++)
        for (let c = 0; c < piece.shape[r].length; c++)
            if (piece.shape[r][c]) {
                ctx.fillStyle = piece.color;
                ctx.shadowBlur = 8; ctx.shadowColor = piece.color;
                ctx.fillRect(ox + c * PREVIEW_BLOCK + 1, oy + r * PREVIEW_BLOCK + 1, PREVIEW_BLOCK - 2, PREVIEW_BLOCK - 2);
                ctx.shadowBlur = 0;
            }
}

function drawNextPiece() { drawPreviewPiece(nextCtx, nextPiece, 100); }
function drawHoldPiece() { drawPreviewPiece(holdCtx, holdPiece, 100); }

function update(time = 0) {
    if (!isGameRunning) return;
    if (time - lastDrop > dropInterval) { drop(); lastDrop = time; }
    drawBoard(); drawPiece();
    gameLoop = requestAnimationFrame(update);
}

function moveLeft() { if (!collision(currentPiece, -1, 0)) currentPiece.x--; }
function moveRight() { if (!collision(currentPiece, 1, 0)) currentPiece.x++; }
function rotate() {
    const rotated = currentPiece.rotate();
    if (!collision(currentPiece, 0, 0, rotated)) currentPiece.shape = rotated;
    else if (!collision(currentPiece, -1, 0, rotated)) { currentPiece.x--; currentPiece.shape = rotated; }
    else if (!collision(currentPiece, 1, 0, rotated)) { currentPiece.x++; currentPiece.shape = rotated; }
}
function drop() { if (!collision(currentPiece, 0, 1)) currentPiece.y++; else lockPiece(); }
function hardDrop() {
    while (!collision(currentPiece, 0, 1)) { currentPiece.y++; score += 2; }
    scoreElement.textContent = score; lockPiece();
}

function initGame() {
    createBoard();
    score = 0; lines = 0; level = 1; dropInterval = 1000; holdPiece = null; canHold = true;
    scoreElement.textContent = 0; linesElement.textContent = 0; levelElement.textContent = 1;
    drawHoldPiece(); spawnPiece();
    startScreen.classList.add('hidden'); gameOverScreen.classList.add('hidden');
    isGameRunning = true; lastDrop = performance.now(); update();
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
    finalScoreElement.textContent = score;
    finalLinesElement.textContent = lines;
    gameOverScreen.classList.remove('hidden');
    if (window.Leaderboard && score > 0) Leaderboard.submit('tetris', score);
}

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!isGameRunning && !startScreen.classList.contains('hidden')) { initGame(); return; }
    if (!isGameRunning) return;
    switch (e.code) {
        case 'ArrowLeft': case 'KeyA': moveLeft(); break;
        case 'ArrowRight': case 'KeyD': moveRight(); break;
        case 'ArrowUp': case 'KeyW': rotate(); break;
        case 'ArrowDown': case 'KeyS': drop(); score++; scoreElement.textContent = score; break;
        case 'Space': hardDrop(); break;
        case 'KeyC': case 'ShiftLeft': hold(); break;
    }
    drawBoard(); drawPiece();
});

restartBtn.addEventListener('click', initGame);

['leftBtn', 'rightBtn', 'rotateBtn', 'downBtn', 'dropBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
        if (!isGameRunning && !startScreen.classList.contains('hidden')) { initGame(); return; }
        if (!isGameRunning) return;
        if (id === 'leftBtn') moveLeft();
        if (id === 'rightBtn') moveRight();
        if (id === 'rotateBtn') rotate();
        if (id === 'downBtn') { drop(); score++; scoreElement.textContent = score; }
        if (id === 'dropBtn') hardDrop();
        drawBoard(); drawPiece();
    });
});

drawBoard();
drawPreviewPiece(nextCtx, null, 100);
drawPreviewPiece(holdCtx, null, 100);
