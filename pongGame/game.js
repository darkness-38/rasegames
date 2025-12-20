/**
 * Retro Pong - Game Logic
 * Premium Pong with smooth controls and leaderboard integration
 */

class RetroPong {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Game settings
        this.winScore = 10;
        this.playerScore = 0;
        this.aiScore = 0;
        this.gameRunning = false;

        // Paddle settings
        this.paddleWidth = 12;
        this.paddleHeight = 80;
        this.paddleSpeed = 8;

        // Ball settings
        this.ballSize = 12;
        this.ballSpeedBase = 6;
        this.ballSpeed = this.ballSpeedBase;

        // Player paddle
        this.player = {
            x: 30,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            dy: 0
        };

        // AI paddle
        this.ai = {
            x: this.canvas.width - 30 - this.paddleWidth,
            y: this.canvas.height / 2 - this.paddleHeight / 2,
            speed: 4
        };

        // Ball
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            dx: this.ballSpeed,
            dy: this.ballSpeed * 0.5
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.resize();
        this.draw();
    }

    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

        // Mouse movement
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.gameRunning) return;
            const rect = this.canvas.getBoundingClientRect();
            const scaleY = this.canvas.height / rect.height;
            const mouseY = (e.clientY - rect.top) * scaleY;
            this.player.y = mouseY - this.paddleHeight / 2;
            this.clampPaddle(this.player);
        });

        // Touch movement
        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.gameRunning) return;
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const scaleY = this.canvas.height / rect.height;
            const touchY = (e.touches[0].clientY - rect.top) * scaleY;
            this.player.y = touchY - this.paddleHeight / 2;
            this.clampPaddle(this.player);
        }, { passive: false });

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') this.player.dy = -this.paddleSpeed;
            if (e.key === 'ArrowDown') this.player.dy = this.paddleSpeed;
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') this.player.dy = 0;
        });

        // Mobile buttons
        const upBtn = document.getElementById('upBtn');
        const downBtn = document.getElementById('downBtn');

        upBtn.addEventListener('touchstart', () => this.player.dy = -this.paddleSpeed);
        upBtn.addEventListener('touchend', () => this.player.dy = 0);
        upBtn.addEventListener('mousedown', () => this.player.dy = -this.paddleSpeed);
        upBtn.addEventListener('mouseup', () => this.player.dy = 0);

        downBtn.addEventListener('touchstart', () => this.player.dy = this.paddleSpeed);
        downBtn.addEventListener('touchend', () => this.player.dy = 0);
        downBtn.addEventListener('mousedown', () => this.player.dy = this.paddleSpeed);
        downBtn.addEventListener('mouseup', () => this.player.dy = 0);

        // Window resize
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(container.offsetWidth - 20, 700);
        const ratio = 700 / 450;

        this.canvas.style.width = `${maxWidth}px`;
        this.canvas.style.height = `${maxWidth / ratio}px`;
    }

    startGame() {
        this.playerScore = 0;
        this.aiScore = 0;
        this.ballSpeed = this.ballSpeedBase;
        this.updateScoreDisplay();
        this.resetBall();
        this.hideOverlays();
        this.gameRunning = true;
        this.gameLoop();
    }

    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;

        // Random direction
        const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
        const direction = Math.random() > 0.5 ? 1 : -1;

        this.ball.dx = Math.cos(angle) * this.ballSpeed * direction;
        this.ball.dy = Math.sin(angle) * this.ballSpeed;

        // Reset paddle positions
        this.player.y = this.canvas.height / 2 - this.paddleHeight / 2;
        this.ai.y = this.canvas.height / 2 - this.paddleHeight / 2;
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Move player paddle (keyboard)
        this.player.y += this.player.dy;
        this.clampPaddle(this.player);

        // Move AI paddle
        this.moveAI();

        // Move ball
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        // Ball collision with top/bottom
        if (this.ball.y <= 0 || this.ball.y >= this.canvas.height - this.ballSize) {
            this.ball.dy *= -1;
            this.ball.y = Math.max(0, Math.min(this.canvas.height - this.ballSize, this.ball.y));
        }

        // Ball collision with paddles
        this.checkPaddleCollision();

        // Ball out of bounds
        if (this.ball.x < 0) {
            this.aiScore++;
            this.onPoint();
        } else if (this.ball.x > this.canvas.width) {
            this.playerScore++;
            this.onPoint();
        }
    }

    moveAI() {
        const paddleCenter = this.ai.y + this.paddleHeight / 2;
        const ballCenter = this.ball.y + this.ballSize / 2;

        // Add some prediction
        const predictedY = this.ball.y + (this.ball.dy * ((this.ai.x - this.ball.x) / Math.abs(this.ball.dx)));

        // AI reaction with some randomness
        const targetY = this.ball.dx > 0 ? predictedY : this.canvas.height / 2;
        const diff = targetY - paddleCenter;

        if (Math.abs(diff) > 10) {
            this.ai.y += Math.sign(diff) * Math.min(this.ai.speed, Math.abs(diff));
        }

        this.clampPaddle(this.ai);
    }

    checkPaddleCollision() {
        // Player paddle
        if (this.ball.x <= this.player.x + this.paddleWidth &&
            this.ball.x + this.ballSize >= this.player.x &&
            this.ball.y + this.ballSize >= this.player.y &&
            this.ball.y <= this.player.y + this.paddleHeight) {

            this.ball.x = this.player.x + this.paddleWidth;
            this.ball.dx *= -1;

            // Angle based on hit position
            const hitPos = (this.ball.y + this.ballSize / 2 - this.player.y) / this.paddleHeight;
            const angle = (hitPos - 0.5) * Math.PI / 3;
            const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.02; // Speed up

            this.ball.dx = Math.abs(Math.cos(angle) * speed);
            this.ball.dy = Math.sin(angle) * speed;

            this.ballSpeed = Math.min(this.ballSpeed * 1.02, 12);
        }

        // AI paddle
        if (this.ball.x + this.ballSize >= this.ai.x &&
            this.ball.x <= this.ai.x + this.paddleWidth &&
            this.ball.y + this.ballSize >= this.ai.y &&
            this.ball.y <= this.ai.y + this.paddleHeight) {

            this.ball.x = this.ai.x - this.ballSize;
            this.ball.dx *= -1;

            const hitPos = (this.ball.y + this.ballSize / 2 - this.ai.y) / this.paddleHeight;
            const angle = (hitPos - 0.5) * Math.PI / 3;
            const speed = Math.sqrt(this.ball.dx ** 2 + this.ball.dy ** 2) * 1.02;

            this.ball.dx = -Math.abs(Math.cos(angle) * speed);
            this.ball.dy = Math.sin(angle) * speed;

            this.ballSpeed = Math.min(this.ballSpeed * 1.02, 12);
        }
    }

    clampPaddle(paddle) {
        paddle.y = Math.max(0, Math.min(this.canvas.height - this.paddleHeight, paddle.y));
    }

    onPoint() {
        this.updateScoreDisplay();

        if (this.playerScore >= this.winScore || this.aiScore >= this.winScore) {
            this.endGame();
        } else {
            this.resetBall();
        }
    }

    endGame() {
        this.gameRunning = false;

        const resultText = document.getElementById('resultText');
        if (this.playerScore >= this.winScore) {
            resultText.textContent = '🎉 You Win!';
            resultText.style.background = 'linear-gradient(90deg, #00d4ff, #7b68ee)';

            // Submit score
            if (typeof Leaderboard !== 'undefined') {
                Leaderboard.submit('pong', this.playerScore);
            }
        } else {
            resultText.textContent = '😢 CPU Wins';
            resultText.style.background = 'linear-gradient(90deg, #ff006e, #ff4444)';
        }
        resultText.style.webkitBackgroundClip = 'text';
        resultText.style.backgroundClip = 'text';
        resultText.style.webkitTextFillColor = 'transparent';

        document.getElementById('finalPlayerScore').textContent = this.playerScore;
        document.getElementById('finalAiScore').textContent = this.aiScore;
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(0, 0, w, h);

        // Center line
        ctx.setLineDash([10, 10]);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
        ctx.stroke();
        ctx.setLineDash([]);

        // Player paddle (cyan glow)
        ctx.fillStyle = '#00d4ff';
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 20;
        ctx.fillRect(this.player.x, this.player.y, this.paddleWidth, this.paddleHeight);

        // AI paddle (magenta glow)
        ctx.fillStyle = '#ff006e';
        ctx.shadowColor = '#ff006e';
        ctx.shadowBlur = 20;
        ctx.fillRect(this.ai.x, this.ai.y, this.paddleWidth, this.paddleHeight);

        // Ball (white glow)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.ball.x + this.ballSize / 2, this.ball.y + this.ballSize / 2, this.ballSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    updateScoreDisplay() {
        document.getElementById('playerScore').textContent = this.playerScore;
        document.getElementById('aiScore').textContent = this.aiScore;
    }

    hideOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new RetroPong();
});
