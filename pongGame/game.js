// Pong Game - Rase Games
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const aiScoreEl = document.getElementById('aiScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const resultText = document.getElementById('resultText');
const finalPlayerScore = document.getElementById('finalPlayerScore');
const finalAiScore = document.getElementById('finalAiScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

// Game constants
const PADDLE_HEIGHT = 120;  // Huge paddle for player
const AI_PADDLE_HEIGHT = 60; // Tiny paddle for AI
const BALL_SIZE = 12;
const WINNING_SCORE = 10;
const BALL_SPEED = 4;
const AI_SPEED = 1.8;  // Extremely slow AI

// Game state
let playerY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let aiY = canvas.height / 2 - PADDLE_HEIGHT / 2;
let ball = { x: 0, y: 0, dx: 0, dy: 0 };
let playerScore = 0;
let aiScore = 0;
let isGameRunning = false;
let gameLoop = null;

function resetBall(direction = 1) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    const angle = (Math.random() * 0.5 - 0.25) * Math.PI;
    ball.dx = direction * BALL_SPEED * Math.cos(angle);
    ball.dy = BALL_SPEED * Math.sin(angle);
}

function drawPaddle(x, y, color, height = PADDLE_HEIGHT) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
    ctx.fillStyle = color;

    // Rounded paddle
    ctx.beginPath();
    ctx.roundRect(x, y, PADDLE_WIDTH, height, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawCenterLine() {
    ctx.setLineDash([10, 10]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    // Clear
    ctx.fillStyle = '#111116';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawCenterLine();
    drawPaddle(20, playerY, '#00ff88', PADDLE_HEIGHT);
    drawPaddle(canvas.width - 20 - PADDLE_WIDTH, aiY, '#ff0055', AI_PADDLE_HEIGHT);
    drawBall();
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom bounce
    if (ball.y - BALL_SIZE / 2 <= 0 || ball.y + BALL_SIZE / 2 >= canvas.height) {
        ball.dy *= -1;
        ball.y = Math.max(BALL_SIZE / 2, Math.min(canvas.height - BALL_SIZE / 2, ball.y));
    }

    // Player paddle collision
    if (ball.x - BALL_SIZE / 2 <= 20 + PADDLE_WIDTH && ball.x - BALL_SIZE / 2 >= 20) {
        if (ball.y >= playerY && ball.y <= playerY + PADDLE_HEIGHT) {
            const hitPos = (ball.y - playerY) / PADDLE_HEIGHT - 0.5;
            ball.dx = Math.abs(ball.dx) * 1.05;
            ball.dy = hitPos * BALL_SPEED * 1.5;
            ball.x = 20 + PADDLE_WIDTH + BALL_SIZE / 2;
        }
    }

    // AI paddle collision
    if (ball.x + BALL_SIZE / 2 >= canvas.width - 20 - PADDLE_WIDTH && ball.x + BALL_SIZE / 2 <= canvas.width - 20) {
        if (ball.y >= aiY && ball.y <= aiY + AI_PADDLE_HEIGHT) {
            const hitPos = (ball.y - aiY) / AI_PADDLE_HEIGHT - 0.5;
            ball.dx = -Math.abs(ball.dx) * 1.03;  // Less speed increase
            ball.dy = hitPos * BALL_SPEED * 1.2;
            ball.x = canvas.width - 20 - PADDLE_WIDTH - BALL_SIZE / 2;
        }
    }

    // Scoring
    if (ball.x < 0) {
        aiScore++;
        aiScoreEl.textContent = aiScore;
        if (aiScore >= WINNING_SCORE) return gameOver(false);
        resetBall(-1);
    }
    if (ball.x > canvas.width) {
        playerScore++;
        playerScoreEl.textContent = playerScore;
        if (playerScore >= WINNING_SCORE) return gameOver(true);
        resetBall(1);
    }
}

function updateAI() {
    // AI only reacts when ball is coming towards it
    if (ball.dx < 0) return; // Ball going away, AI relaxes

    // Add some randomness/mistakes
    const reactionChance = 0.65; // 65% chance to react each frame (very clumsy)
    if (Math.random() > reactionChance) return;

    const targetY = ball.y - AI_PADDLE_HEIGHT / 2;
    const diff = targetY - aiY;

    if (Math.abs(diff) > AI_SPEED) {
        aiY += diff > 0 ? AI_SPEED : -AI_SPEED;
    } else {
        aiY = targetY;
    }

    aiY = Math.max(0, Math.min(canvas.height - AI_PADDLE_HEIGHT, aiY));
}

function update() {
    if (!isGameRunning) return;

    updateBall();
    updateAI();
    draw();

    gameLoop = requestAnimationFrame(update);
}

function initGame() {
    playerScore = 0;
    aiScore = 0;
    playerScoreEl.textContent = 0;
    aiScoreEl.textContent = 0;
    playerY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    aiY = canvas.height / 2 - AI_PADDLE_HEIGHT / 2;
    resetBall(Math.random() > 0.5 ? 1 : -1);

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    isGameRunning = true;
    update();
}

function gameOver(playerWon) {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);

    resultText.textContent = playerWon ? 'You Win!' : 'CPU Wins!';
    finalPlayerScore.textContent = playerScore;
    finalAiScore.textContent = aiScore;
    gameOverScreen.classList.remove('hidden');

    if (window.Leaderboard && playerWon && playerScore > 0) {
        Leaderboard.submit('pong', playerScore);
    }
}

// Controls
canvas.addEventListener('mousemove', (e) => {
    if (!isGameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    playerY = (e.clientY - rect.top) * scaleY - PADDLE_HEIGHT / 2;
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isGameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const touch = e.touches[0];
    playerY = (touch.clientY - rect.top) * scaleY - PADDLE_HEIGHT / 2;
    playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
});

// Mobile buttons
let moveInterval = null;
document.getElementById('upBtn')?.addEventListener('mousedown', () => {
    moveInterval = setInterval(() => {
        playerY = Math.max(0, playerY - 10);
    }, 16);
});
document.getElementById('downBtn')?.addEventListener('mousedown', () => {
    moveInterval = setInterval(() => {
        playerY = Math.min(canvas.height - PADDLE_HEIGHT, playerY + 10);
    }, 16);
});
document.addEventListener('mouseup', () => clearInterval(moveInterval));
document.addEventListener('touchend', () => clearInterval(moveInterval));

document.getElementById('upBtn')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveInterval = setInterval(() => { playerY = Math.max(0, playerY - 10); }, 16);
});
document.getElementById('downBtn')?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    moveInterval = setInterval(() => { playerY = Math.min(canvas.height - PADDLE_HEIGHT, playerY + 10); }, 16);
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Initial draw
draw();
