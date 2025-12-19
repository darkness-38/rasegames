
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');


const GRAVITY = 0.5;
const JUMP_FORCE = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPEED = 3;
const PIPE_SPAWN_RATE = 90;


let bird = { x: 80, y: 300, velocity: 0, radius: 18 };
let pipes = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
let gameLoop = null;
let isGameRunning = false;
let frameCount = 0;

highScoreElement.textContent = highScore;


const BIRD_COLORS = ['#ffd93d', '#ff6b6b', '#ff9f43'];

function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);

    
    const rotation = Math.min(Math.max(bird.velocity * 3, -30), 45) * Math.PI / 180;
    ctx.rotate(rotation);

    
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#ffd93d';

    
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath();
    ctx.ellipse(-5, 0, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(10, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.fillStyle = '#ff6b6b';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(25, 3);
    ctx.lineTo(15, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPipe(pipe) {
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    gradient.addColorStop(0, '#00ff88');
    gradient.addColorStop(0.5, '#00d4ff');
    gradient.addColorStop(1, '#00ff88');

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ff88';
    ctx.fillStyle = gradient;

    
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    
    ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);

    
    const bottomY = pipe.topHeight + PIPE_GAP;
    ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, canvas.height - bottomY);
    
    ctx.fillRect(pipe.x - 5, bottomY, PIPE_WIDTH + 10, 20);

    ctx.shadowBlur = 0;
}

function drawBackground() {
    
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 73 + frameCount * 0.2) % canvas.width;
        const y = (i * 37) % canvas.height;
        const size = (i % 3) + 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    
    ctx.strokeStyle = '#00ff88';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 2);
    ctx.lineTo(canvas.width, canvas.height - 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function spawnPipe() {
    const minHeight = 80;
    const maxHeight = canvas.height - PIPE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;

    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        passed: false
    });
}

function update() {
    if (!isGameRunning) return;

    frameCount++;

    
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    
    if (frameCount % PIPE_SPAWN_RATE === 0) {
        spawnPipe();
    }

    
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= PIPE_SPEED;

        
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].passed = true;
            score++;
            scoreElement.textContent = score;
        }

        
        if (pipes[i].x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }

    
    if (checkCollision()) {
        gameOver();
        return;
    }

    
    drawBackground();
    pipes.forEach(drawPipe);
    drawBird();

    gameLoop = requestAnimationFrame(update);
}

function checkCollision() {
    
    if (bird.y + bird.radius > canvas.height || bird.y - bird.radius < 0) {
        return true;
    }

    
    for (const pipe of pipes) {
        if (bird.x + bird.radius > pipe.x && bird.x - bird.radius < pipe.x + PIPE_WIDTH) {
            if (bird.y - bird.radius < pipe.topHeight || bird.y + bird.radius > pipe.topHeight + PIPE_GAP) {
                return true;
            }
        }
    }

    return false;
}

function jump() {
    if (!isGameRunning && !startScreen.classList.contains('hidden')) {
        initGame();
        return;
    }
    if (!isGameRunning) return;
    bird.velocity = JUMP_FORCE;
}

function initGame() {
    bird = { x: 80, y: 300, velocity: 0, radius: 18 };
    pipes = [];
    score = 0;
    frameCount = 0;

    scoreElement.textContent = 0;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');

    isGameRunning = true;
    update();
}

function gameOver() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);

    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = highScore;
        localStorage.setItem('flappyHighScore', highScore);
    }

    finalScoreElement.textContent = score;
    gameOverScreen.classList.remove('hidden');

    if (window.Leaderboard && score > 0) {
        Leaderboard.submit('flappy', score);
    }
}


document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

restartBtn.addEventListener('click', initGame);


drawBackground();
