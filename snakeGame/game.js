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


    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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


    ctx.fillStyle = '#ec4899';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ec4899';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;


    snake.forEach((part, index) => {

        if (index === 0) {
            ctx.fillStyle = '#0f49bd';
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#0f49bd';
        } else {
            const alpha = 1 - (index / snake.length) * 0.4;
            ctx.fillStyle = `rgba(15, 73, 189, ${alpha})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#0f49bd';
        }

        ctx.fillRect(
            part.x * GRID_SIZE + 1,
            part.y * GRID_SIZE + 1,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );


        ctx.shadowBlur = 0;
    });
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

