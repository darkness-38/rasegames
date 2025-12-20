class PixelBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

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

        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = 2.5;
        this.pipeSpawnRate = 100;
        this.frameCount = 0;

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highFlappy') || '0');
        this.gameRunning = false;
        this.gameOver = false;

        this.stars = [];
        this.initStars();

        this.init();
    }

    resizeCanvas() {
        const container = document.getElementById('canvasContainer');
        if (!container) return;

        // Get actual container dimensions
        const rect = container.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 600;

        this.canvas.width = width;
        this.canvas.height = height;

        // Reinit stars on resize
        if (this.stars && this.stars.length > 0) {
            this.initStars();
        }

        // Reset bird position
        if (this.bird) {
            this.bird.y = this.canvas.height / 2;
        }
    }

    init() {
        this.setupEventListeners();
        this.updateHighScore();
        this.draw();
    }

    initStars() {
        this.stars = [];
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
        this.resizeCanvas();
        this.bird.x = 80;
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
        ctx.fillStyle = '#282e39';
        ctx.fillRect(0, h - 4, w, 4);

        // Draw pipes
        for (const pipe of this.pipes) {
            this.drawPipe(pipe);
        }

        // Draw bird
        this.drawBird();

        // In-game score (watermark style)
        if (this.gameRunning && !this.gameOver) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.font = 'bold 120px Spline Sans, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.score, w / 2, h / 2 + 40);
        }
    }

    drawPipe(pipe) {
        const ctx = this.ctx;
        const w = this.pipeWidth;
        const h = this.canvas.height;
        const gap = this.pipeGap;

        // Top pipe
        ctx.fillStyle = '#1c2438';
        ctx.strokeStyle = '#3b4354';
        ctx.lineWidth = 2;

        // Top pipe body
        ctx.fillRect(pipe.x, 0, w, pipe.topHeight);
        ctx.strokeRect(pipe.x, 0, w, pipe.topHeight);

        // Top pipe cap
        ctx.fillStyle = '#252d42';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, w + 10, 20);
        ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, w + 10, 20);

        // Bottom pipe
        const bottomY = pipe.topHeight + gap;
        ctx.fillStyle = '#1c2438';

        // Bottom pipe body
        ctx.fillRect(pipe.x, bottomY, w, h - bottomY);
        ctx.strokeRect(pipe.x, bottomY, w, h - bottomY);

        // Bottom pipe cap
        ctx.fillStyle = '#252d42';
        ctx.fillRect(pipe.x - 5, bottomY, w + 10, 20);
        ctx.strokeRect(pipe.x - 5, bottomY, w + 10, 20);
    }

    drawBird() {
        const ctx = this.ctx;
        const bird = this.bird;

        ctx.save();
        ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
        ctx.rotate(bird.rotation * Math.PI / 180);

        // Bird glow effect
        ctx.shadowColor = '#0f49bd';
        ctx.shadowBlur = 20;

        // Body gradient
        const bodyGrad = ctx.createLinearGradient(-bird.width / 2, -bird.height / 2, bird.width / 2, bird.height / 2);
        bodyGrad.addColorStop(0, '#3b82f6');
        bodyGrad.addColorStop(0.5, '#0f49bd');
        bodyGrad.addColorStop(1, '#1e3a8a');

        // Main body
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;

        // Belly (lighter area)
        const bellyGrad = ctx.createRadialGradient(0, 4, 0, 0, 4, 12);
        bellyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        bellyGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = bellyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 4, bird.width / 3, bird.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail feathers
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(-bird.width / 2 - 2, -4);
        ctx.lineTo(-bird.width / 2 - 12, -8);
        ctx.lineTo(-bird.width / 2 - 10, 0);
        ctx.lineTo(-bird.width / 2 - 14, 4);
        ctx.lineTo(-bird.width / 2 - 2, 2);
        ctx.closePath();
        ctx.fill();

        // Tail detail lines
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-bird.width / 2 - 3, -2);
        ctx.lineTo(-bird.width / 2 - 10, -4);
        ctx.moveTo(-bird.width / 2 - 3, 0);
        ctx.lineTo(-bird.width / 2 - 11, 2);
        ctx.stroke();

        // Wing (animated based on velocity)
        const wingAngle = Math.sin(Date.now() / 80) * 0.4;
        ctx.save();
        ctx.translate(-2, 2);
        ctx.rotate(wingAngle);

        const wingGrad = ctx.createLinearGradient(0, -10, 0, 10);
        wingGrad.addColorStop(0, '#60a5fa');
        wingGrad.addColorStop(1, '#1e40af');
        ctx.fillStyle = wingGrad;

        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Wing detail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.quadraticCurveTo(0, -3, 8, 0);
        ctx.stroke();

        ctx.restore();

        // Eye white
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.ellipse(8, -4, 7, 6, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Eye iris
        const eyeGrad = ctx.createRadialGradient(9, -4, 0, 9, -4, 4);
        eyeGrad.addColorStop(0, '#1e293b');
        eyeGrad.addColorStop(0.7, '#0f172a');
        eyeGrad.addColorStop(1, '#000');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(9, -4, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eye pupil
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(10, -4, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlight
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(8, -5, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Eyebrow/feather detail
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(8, -6, 8, -2.5, -1.8);
        ctx.stroke();

        // Beak upper
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(bird.width / 2 - 2, -2);
        ctx.lineTo(bird.width / 2 + 12, 1);
        ctx.lineTo(bird.width / 2 - 2, 2);
        ctx.closePath();
        ctx.fill();

        // Beak lower
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(bird.width / 2 - 2, 2);
        ctx.lineTo(bird.width / 2 + 10, 3);
        ctx.lineTo(bird.width / 2 - 2, 5);
        ctx.closePath();
        ctx.fill();

        // Beak detail line
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bird.width / 2, 2);
        ctx.lineTo(bird.width / 2 + 8, 2);
        ctx.stroke();

        // Cheek blush
        ctx.fillStyle = 'rgba(251, 146, 60, 0.4)';
        ctx.beginPath();
        ctx.ellipse(4, 2, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Top feather tuft
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(0, -bird.height / 2);
        ctx.lineTo(-3, -bird.height / 2 - 6);
        ctx.lineTo(0, -bird.height / 2 - 3);
        ctx.lineTo(3, -bird.height / 2 - 8);
        ctx.lineTo(2, -bird.height / 2);
        ctx.closePath();
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
