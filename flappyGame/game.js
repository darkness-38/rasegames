/**
 * Pixel Bird - Flappy Bird Clone
 * Premium flappy with neon pipes and leaderboard integration
 */

class PixelBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Bird settings
        this.bird = {
            x: 80,
            y: this.canvas.height / 2,
            width: 30,
            height: 24,
            velocity: 0,
            gravity: 0.4,
            jump: -7,
            rotation: 0
        };

        // Pipe settings
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = 2.5;
        this.pipeSpawnRate = 100;
        this.frameCount = 0;

        // Game state
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highFlappy') || '0');
        this.gameRunning = false;
        this.gameOver = false;

        // Stars background
        this.stars = [];
        this.initStars();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateHighScore();
        this.draw();
    }

    initStars() {
        for (let i = 0; i < 50; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2,
                speed: Math.random() * 0.5 + 0.1
            });
        }
    }

    setupEventListeners() {
        // Start/restart buttons
        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.startGame());

        // Jump on click/touch
        this.canvas.addEventListener('click', () => this.flap());
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.flap();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.flap();
            }
        });
    }

    flap() {
        if (!this.gameRunning) return;
        if (this.gameOver) return;

        this.bird.velocity = this.bird.jump;
    }

    startGame() {
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.score = 0;
        this.frameCount = 0;
        this.gameOver = false;
        this.gameRunning = true;

        this.updateScore();
        this.hideOverlays();
        this.gameLoop();
    }

    gameLoop() {
        if (!this.gameRunning) return;

        this.update();
        this.draw();

        if (!this.gameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }

    update() {
        if (this.gameOver) return;

        this.frameCount++;

        // Bird physics
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // Bird rotation based on velocity
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 3, -30), 90);

        // Spawn pipes
        if (this.frameCount % this.pipeSpawnRate === 0) {
            this.spawnPipe();
        }

        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;

            // Score when passing pipe
            if (!pipe.passed && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.passed = true;
                this.score++;
                this.updateScore();
            }

            // Remove off-screen pipes
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Collision detection
        this.checkCollision();

        // Update stars
        for (const star of this.stars) {
            star.x -= star.speed;
            if (star.x < 0) {
                star.x = this.canvas.width;
                star.y = Math.random() * this.canvas.height;
            }
        }
    }

    spawnPipe() {
        const minHeight = 80;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight - 50;
        const topHeight = Math.random() * maxHeight + minHeight;

        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            passed: false
        });
    }

    checkCollision() {
        const bird = this.bird;

        // Ground and ceiling
        if (bird.y <= 0 || bird.y + bird.height >= this.canvas.height) {
            this.endGame();
            return;
        }

        // Pipes
        for (const pipe of this.pipes) {
            // Top pipe
            if (bird.x + bird.width > pipe.x && bird.x < pipe.x + this.pipeWidth) {
                if (bird.y < pipe.topHeight) {
                    this.endGame();
                    return;
                }
                // Bottom pipe
                if (bird.y + bird.height > pipe.topHeight + this.pipeGap) {
                    this.endGame();
                    return;
                }
            }
        }
    }

    endGame() {
        this.gameOver = true;
        this.gameRunning = false;

        // Check new high score
        const isNewBest = this.score > this.highScore;
        if (isNewBest) {
            this.highScore = this.score;
            localStorage.setItem('highFlappy', this.highScore);
            this.updateHighScore();
        }

        // Update overlay
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('newBest').classList.toggle('hidden', !isNewBest);
        document.getElementById('gameOverScreen').classList.remove('hidden');

        // Submit to leaderboard
        if (typeof Leaderboard !== 'undefined' && this.score > 0) {
            Leaderboard.submit('flappy', this.score);
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#0a0a15');
        bgGrad.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const star of this.stars) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ground
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, h - 2, w, 2);

        // Draw pipes
        for (const pipe of this.pipes) {
            this.drawPipe(pipe);
        }

        // Draw bird
        this.drawBird();

        // In-game score
        if (this.gameRunning && !this.gameOver) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.font = 'bold 80px Clash Display';
            ctx.textAlign = 'center';
            ctx.fillText(this.score, w / 2, h / 2);
        }
    }

    drawPipe(pipe) {
        const ctx = this.ctx;
        const w = this.pipeWidth;
        const h = this.canvas.height;
        const gap = this.pipeGap;

        // Top pipe
        const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + w, 0);
        topGrad.addColorStop(0, '#7b68ee');
        topGrad.addColorStop(0.5, '#9b87ff');
        topGrad.addColorStop(1, '#7b68ee');

        ctx.fillStyle = topGrad;
        ctx.fillRect(pipe.x, 0, w, pipe.topHeight);

        // Top pipe cap
        ctx.fillStyle = '#a599ff';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, w + 10, 20);

        // Top pipe glow
        ctx.shadowColor = '#7b68ee';
        ctx.shadowBlur = 15;
        ctx.fillRect(pipe.x, 0, w, pipe.topHeight);
        ctx.shadowBlur = 0;

        // Bottom pipe
        const bottomY = pipe.topHeight + gap;
        const bottomGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + w, 0);
        bottomGrad.addColorStop(0, '#00d4ff');
        bottomGrad.addColorStop(0.5, '#40e0ff');
        bottomGrad.addColorStop(1, '#00d4ff');

        ctx.fillStyle = bottomGrad;
        ctx.fillRect(pipe.x, bottomY, w, h - bottomY);

        // Bottom pipe cap
        ctx.fillStyle = '#60e8ff';
        ctx.fillRect(pipe.x - 5, bottomY, w + 10, 20);

        // Bottom pipe glow
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 15;
        ctx.fillRect(pipe.x, bottomY, w, h - bottomY);
        ctx.shadowBlur = 0;
    }

    drawBird() {
        const ctx = this.ctx;
        const bird = this.bird;

        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation * Math.PI / 180);

        // Bird body (neon glow)
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;

        // Body
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Eye
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8, -4, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(10, -4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Beak
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(bird.width / 2, 0);
        ctx.lineTo(bird.width / 2 + 10, 3);
        ctx.lineTo(bird.width / 2, 6);
        ctx.closePath();
        ctx.fill();

        // Wing
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.ellipse(-5, 5, 8, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    updateHighScore() {
        document.getElementById('highScore').textContent = this.highScore;
    }

    hideOverlays() {
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.add('hidden');
    }
}

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    new PixelBird();
});
