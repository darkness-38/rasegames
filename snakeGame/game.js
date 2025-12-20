const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');


const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;
const GAME_SPEED = 100;


let score = 0;
let highScore = getCookie('snakeHighScore') || 0;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let gameLoop;
let isGameRunning = false;
let isPaused = false;
let speedLevel = 1;
let currentSpeed = 100;


highScoreElement.textContent = highScore;


function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    score = 0;
    speedLevel = 1;
    currentSpeed = 100;
    dx = 1;
    dy = 0;
    scoreElement.textContent = 0;
    updateSpeedUI();
    createFood();
    isGameRunning = true;
    isPaused = false;

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, currentSpeed);


    if (typeof playSound !== 'undefined') playSound('start');
}

function updateSpeedUI() {
    const speedLevelEl = document.getElementById('speedLevel');
    const speedBarEl = document.getElementById('speedBar');
    if (speedLevelEl) {
        speedLevelEl.textContent = speedLevel.toString().padStart(2, '0');
    }
    if (speedBarEl) {
        speedBarEl.style.width = (speedLevel * 10) + '%';
    }
}

function createFood() {
    food = {
        x: Math.floor(Math.random() * TILE_COUNT),
        y: Math.floor(Math.random() * TILE_COUNT)
    };


    snake.forEach(part => {
        if (part.x === food.x && part.y === food.y) {
            createFood();
        }
    });
}

function drawGame() {
    if (isPaused) return;


    const head = { x: snake[0].x + dx, y: snake[0].y + dy };


    if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
        gameOver();
        return;
    }


    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);


    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            setCookie('snakeHighScore', highScore, 365);
        }

        // Update speed level every 100 points, max 10
        const newLevel = Math.min(10, Math.floor(score / 100) + 1);
        if (newLevel > speedLevel) {
            speedLevel = newLevel;
            currentSpeed = Math.max(40, 100 - (speedLevel - 1) * 7); // Speed up
            clearInterval(gameLoop);
            gameLoop = setInterval(drawGame, currentSpeed);
            updateSpeedUI();
        }

        createFood();


        if (typeof playSound !== 'undefined') playSound('eat');


    } else {
        snake.pop();
    }


    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);


    ctx.strokeStyle = 'rgba(15, 73, 189, 0.08)';
    for (let i = 0; i < TILE_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * GRID_SIZE, 0);
        ctx.lineTo(i * GRID_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * GRID_SIZE);
        ctx.lineTo(canvas.width, i * GRID_SIZE);
        ctx.stroke();
    }

    // Draw food (apple with details)
    const foodCenterX = food.x * GRID_SIZE + GRID_SIZE / 2;
    const foodCenterY = food.y * GRID_SIZE + GRID_SIZE / 2;
    const foodRadius = GRID_SIZE / 2 - 2;

    // Apple glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ec4899';

    // Apple body gradient
    const appleGradient = ctx.createRadialGradient(
        foodCenterX - 3, foodCenterY - 3, 0,
        foodCenterX, foodCenterY, foodRadius
    );
    appleGradient.addColorStop(0, '#ff6eb4');
    appleGradient.addColorStop(0.7, '#ec4899');
    appleGradient.addColorStop(1, '#be185d');
    ctx.fillStyle = appleGradient;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Apple shine
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(foodCenterX - 3, foodCenterY - 3, foodRadius / 4, 0, Math.PI * 2);
    ctx.fill();

    // Apple stem
    ctx.strokeStyle = '#6b4423';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(foodCenterX, foodCenterY - foodRadius + 2);
    ctx.lineTo(foodCenterX + 2, foodCenterY - foodRadius - 4);
    ctx.stroke();

    // Apple leaf
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(foodCenterX + 4, foodCenterY - foodRadius - 2, 4, 2, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw snake with enhanced visuals
    snake.forEach((part, index) => {
        const x = part.x * GRID_SIZE;
        const y = part.y * GRID_SIZE;
        const size = GRID_SIZE - 2;
        const centerX = x + GRID_SIZE / 2;
        const centerY = y + GRID_SIZE / 2;
        const radius = size / 2;

        if (index === 0) {
            // Head - special design
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0f49bd';

            // Head gradient
            const headGradient = ctx.createRadialGradient(
                centerX - 2, centerY - 2, 0,
                centerX, centerY, radius
            );
            headGradient.addColorStop(0, '#3b82f6');
            headGradient.addColorStop(0.6, '#0f49bd');
            headGradient.addColorStop(1, '#1e3a8a');
            ctx.fillStyle = headGradient;

            // Rounded head
            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, size, size, 6);
            ctx.fill();

            // Eyes
            ctx.shadowBlur = 0;
            const eyeOffsetX = dx !== 0 ? dx * 3 : 4;
            const eyeOffsetY = dy !== 0 ? dy * 3 : 0;

            // Eye whites
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX - 4 + eyeOffsetX, centerY - 2 + eyeOffsetY, 3, 0, Math.PI * 2);
            ctx.arc(centerX + 4 + eyeOffsetX, centerY - 2 + eyeOffsetY, 3, 0, Math.PI * 2);
            ctx.fill();

            // Eye pupils
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(centerX - 4 + eyeOffsetX + dx, centerY - 2 + eyeOffsetY + dy, 1.5, 0, Math.PI * 2);
            ctx.arc(centerX + 4 + eyeOffsetX + dx, centerY - 2 + eyeOffsetY + dy, 1.5, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Body segments with gradient
            const alpha = 1 - (index / snake.length) * 0.5;
            const segmentRadius = 5 - (index / snake.length) * 2;

            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(15, 73, 189, ${alpha})`;

            // Body gradient
            const bodyGradient = ctx.createRadialGradient(
                centerX - 2, centerY - 2, 0,
                centerX, centerY, radius
            );
            bodyGradient.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
            bodyGradient.addColorStop(1, `rgba(15, 73, 189, ${alpha * 0.7})`);
            ctx.fillStyle = bodyGradient;

            ctx.beginPath();
            ctx.roundRect(x + 1, y + 1, size, size, Math.max(2, segmentRadius));
            ctx.fill();

            // Body shine
            ctx.shadowBlur = 0;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, size / 3, size / 3, 2);
            ctx.fill();
        }
    });


    ctx.shadowBlur = 0;
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameLoop);
    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');


    if (typeof playSound !== 'undefined') playSound('gameover');


    if (window.Leaderboard && score > 0) {
        Leaderboard.submit('snake', score);
    }
}

document.addEventListener('keydown', (e) => {

    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }

    if (!isGameRunning && startScreen.classList.contains('hidden') === false) {
        initGame();
        return;
    }

    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (dy !== 1) { dx = 0; dy = -1; }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (dy !== -1) { dx = 0; dy = 1; }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (dx !== 1) { dx = -1; dy = 0; }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (dx !== -1) { dx = 1; dy = 0; }
            break;
    }
});

restartBtn.addEventListener('click', initGame);


function setDirection(newDx, newDy) {
    if (!isGameRunning && !startScreen.classList.contains('hidden')) {
        initGame();
        return;
    }
    if (!isGameRunning) return;


    if (newDx !== 0 && dx !== -newDx) { dx = newDx; dy = 0; }
    if (newDy !== 0 && dy !== -newDy) { dy = newDy; dx = 0; }
}

document.getElementById('upBtn')?.addEventListener('click', () => setDirection(0, -1));
document.getElementById('downBtn')?.addEventListener('click', () => setDirection(0, 1));
document.getElementById('leftBtn')?.addEventListener('click', () => setDirection(-1, 0));
document.getElementById('rightBtn')?.addEventListener('click', () => setDirection(1, 0));


ctx.fillStyle = '#111116';
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = '#00ff88';
ctx.font = '20px Outfit';
ctx.textAlign = 'center';

