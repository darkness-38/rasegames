/**
 * Diffusion Simulation
 * Simulates gas diffusion between two chambers
 */

class DiffusionSimulation {
    constructor() {
        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.graphCanvas = document.getElementById('graph-canvas');
        this.graphCtx = this.graphCanvas.getContext('2d');

        this.particles = [];
        this.dividerRemoved = false;
        this.isRunning = true;
        this.startTime = null;
        this.elapsedTime = 0;
        this.graphData = { gas1Left: [], gas2Right: [], time: [] };

        // Settings
        this.settings = {
            temperature: 300,
            gas1: { count: 50, mass: 28, radius: 150 },
            gas2: { count: 50, mass: 44, radius: 200 }
        };

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupEventListeners();
        this.createParticles();
        this.animate();
    }

    resizeCanvas() {
        const container = document.getElementById('chamber-container');
        this.canvas.width = container.offsetWidth;
        this.canvas.height = container.offsetHeight;

        this.graphCanvas.width = this.graphCanvas.offsetWidth;
        this.graphCanvas.height = 200;
    }

    setupEventListeners() {
        // Remove divider button
        document.getElementById('remove-divider-btn').addEventListener('click', () => {
            this.removeDivider();
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.reset();
        });

        // Temperature
        document.getElementById('temperature-slider').addEventListener('input', (e) => {
            this.settings.temperature = parseInt(e.target.value);
            document.getElementById('temperature-value').textContent = `${this.settings.temperature} K`;
            this.updateParticleSpeeds();
        });

        // Gas 1 controls
        document.getElementById('gas1-count-slider').addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            this.settings.gas1.count = count;
            document.getElementById('gas1-count').textContent = count;
            this.updateParticleCount(1, count);
        });
        document.getElementById('gas1-mass-slider').addEventListener('input', (e) => {
            this.settings.gas1.mass = parseInt(e.target.value);
            document.getElementById('gas1-mass').textContent = e.target.value;
            this.updateParticleSpeeds();
        });
        document.getElementById('gas1-radius-slider').addEventListener('input', (e) => {
            this.settings.gas1.radius = parseInt(e.target.value);
            document.getElementById('gas1-radius').textContent = e.target.value;
            this.updateParticleRadii();
        });

        // Gas 2 controls
        document.getElementById('gas2-count-slider').addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            this.settings.gas2.count = count;
            document.getElementById('gas2-count').textContent = count;
            this.updateParticleCount(2, count);
        });
        document.getElementById('gas2-mass-slider').addEventListener('input', (e) => {
            this.settings.gas2.mass = parseInt(e.target.value);
            document.getElementById('gas2-mass').textContent = e.target.value;
            this.updateParticleSpeeds();
        });
        document.getElementById('gas2-radius-slider').addEventListener('input', (e) => {
            this.settings.gas2.radius = parseInt(e.target.value);
            document.getElementById('gas2-radius').textContent = e.target.value;
            this.updateParticleRadii();
        });
    }

    createParticles() {
        this.particles = [];
        const width = this.canvas.width;
        const height = this.canvas.height;
        const dividerX = width / 2;

        // Create Gas 1 particles (blue, left side)
        for (let i = 0; i < this.settings.gas1.count; i++) {
            const radius = this.scaleRadius(this.settings.gas1.radius);
            this.particles.push({
                x: Math.random() * (dividerX - radius * 2 - 10) + radius + 5,
                y: Math.random() * (height - radius * 2 - 10) + radius + 5,
                vx: this.getRandomVelocity(this.settings.gas1.mass),
                vy: this.getRandomVelocity(this.settings.gas1.mass),
                radius: radius,
                type: 1,
                mass: this.settings.gas1.mass,
                color1: '#60a5fa',
                color2: '#2563eb'
            });
        }

        // Create Gas 2 particles (red, right side)
        for (let i = 0; i < this.settings.gas2.count; i++) {
            const radius = this.scaleRadius(this.settings.gas2.radius);
            this.particles.push({
                x: dividerX + Math.random() * (dividerX - radius * 2 - 10) + radius + 10,
                y: Math.random() * (height - radius * 2 - 10) + radius + 5,
                vx: this.getRandomVelocity(this.settings.gas2.mass),
                vy: this.getRandomVelocity(this.settings.gas2.mass),
                radius: radius,
                type: 2,
                mass: this.settings.gas2.mass,
                color1: '#f87171',
                color2: '#dc2626'
            });
        }
    }

    updateParticleCount(type, targetCount) {
        const currentParticles = this.particles.filter(p => p.type === type);
        const currentCount = currentParticles.length;
        const diff = targetCount - currentCount;

        const width = this.canvas.width;
        const height = this.canvas.height;
        const dividerX = width / 2;

        if (diff > 0) {
            // Add particles
            for (let i = 0; i < diff; i++) {
                if (type === 1) {
                    // Add Gas 1 (Left)
                    const radius = this.scaleRadius(this.settings.gas1.radius);
                    this.particles.push({
                        x: Math.random() * (dividerX - radius * 2 - 10) + radius + 5,
                        y: Math.random() * (height - radius * 2 - 10) + radius + 5,
                        vx: this.getRandomVelocity(this.settings.gas1.mass),
                        vy: this.getRandomVelocity(this.settings.gas1.mass),
                        radius: radius,
                        type: 1,
                        mass: this.settings.gas1.mass,
                        color1: '#60a5fa',
                        color2: '#2563eb'
                    });
                } else {
                    // Add Gas 2 (Right)
                    const radius = this.scaleRadius(this.settings.gas2.radius);
                    this.particles.push({
                        x: dividerX + Math.random() * (dividerX - radius * 2 - 10) + radius + 10,
                        y: Math.random() * (height - radius * 2 - 10) + radius + 5,
                        vx: this.getRandomVelocity(this.settings.gas2.mass),
                        vy: this.getRandomVelocity(this.settings.gas2.mass),
                        radius: radius,
                        type: 2,
                        mass: this.settings.gas2.mass,
                        color1: '#f87171',
                        color2: '#dc2626'
                    });
                }
            }
        } else if (diff < 0) {
            // Remove particles (remove last added of that type)
            let removedCount = 0;
            const toRemove = Math.abs(diff);

            // Filter out particles of this type starting from the end of the array
            // Optimization: Rebuilding the array is safer than splicing in loop
            const newParticles = [];
            const otherParticles = this.particles.filter(p => p.type !== type);
            const myParticles = this.particles.filter(p => p.type === type);

            // Keep the first (targetCount) particles
            const keepParticles = myParticles.slice(0, targetCount);

            this.particles = [...otherParticles, ...keepParticles];
        }
    }

    scaleRadius(pmRadius) {
        // Scale from picometers to pixels (50-300 pm -> 4-12 px)
        return 4 + (pmRadius - 50) / 250 * 8;
    }

    getRandomVelocity(mass) {
        // Maxwell-Boltzmann distribution approximation
        // v ∝ sqrt(T/M)
        const baseSpeed = Math.sqrt(this.settings.temperature / mass) * 0.5;
        return (Math.random() - 0.5) * 2 * baseSpeed;
    }

    updateParticleSpeeds() {
        this.particles.forEach(p => {
            const mass = p.type === 1 ? this.settings.gas1.mass : this.settings.gas2.mass;
            const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            const targetSpeed = Math.sqrt(this.settings.temperature / mass) * 0.5;

            if (currentSpeed > 0) {
                const ratio = targetSpeed / currentSpeed;
                p.vx *= ratio;
                p.vy *= ratio;
            } else {
                p.vx = this.getRandomVelocity(mass);
                p.vy = this.getRandomVelocity(mass);
            }
            p.mass = mass;
        });
    }

    updateParticleRadii() {
        this.particles.forEach(p => {
            const radius = p.type === 1 ? this.settings.gas1.radius : this.settings.gas2.radius;
            p.radius = this.scaleRadius(radius);
        });
    }

    removeDivider() {
        if (!this.dividerRemoved) {
            this.dividerRemoved = true;
            this.startTime = Date.now();
            document.getElementById('divider').style.opacity = '0';
            document.getElementById('remove-divider-btn').disabled = true;
            document.getElementById('remove-divider-btn').classList.remove('pulse-glow');
            document.getElementById('remove-divider-btn').classList.add('opacity-50');
            document.getElementById('remove-divider-btn').innerHTML = `
                <span class="material-symbols-outlined text-lg">check</span>
                Divider Removed
            `;
        }
    }

    reset() {
        this.dividerRemoved = false;
        this.startTime = null;
        this.elapsedTime = 0;
        this.graphData = { gas1Left: [], gas2Right: [], time: [] };

        document.getElementById('divider').style.opacity = '1';
        document.getElementById('remove-divider-btn').disabled = false;
        document.getElementById('remove-divider-btn').classList.add('pulse-glow');
        document.getElementById('remove-divider-btn').classList.remove('opacity-50');
        document.getElementById('remove-divider-btn').innerHTML = `
            <span class="material-symbols-outlined text-lg">vertical_split</span>
            Remove Divider
        `;
        document.getElementById('elapsed-time').textContent = '0.0 s';

        this.createParticles();
        this.drawGraph();
    }

    animate() {
        this.update();
        this.draw();
        this.updateStats();

        if (this.dividerRemoved && this.startTime) {
            this.elapsedTime = (Date.now() - this.startTime) / 1000;
            document.getElementById('elapsed-time').textContent = `${this.elapsedTime.toFixed(1)} s`;

            // Record data every 0.5 seconds
            if (this.graphData.time.length === 0 ||
                this.elapsedTime - this.graphData.time[this.graphData.time.length - 1] >= 0.5) {
                this.recordGraphData();
            }
        }

        requestAnimationFrame(() => this.animate());
    }

    update() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const dividerX = width / 2;

        this.particles.forEach(p => {
            // Move particle
            p.x += p.vx;
            p.y += p.vy;

            // Wall collisions
            if (p.x - p.radius < 0) {
                p.x = p.radius;
                p.vx *= -1;
            }
            if (p.x + p.radius > width) {
                p.x = width - p.radius;
                p.vx *= -1;
            }
            if (p.y - p.radius < 0) {
                p.y = p.radius;
                p.vy *= -1;
            }
            if (p.y + p.radius > height) {
                p.y = height - p.radius;
                p.vy *= -1;
            }

            // Divider collision (if not removed)
            if (!this.dividerRemoved) {
                if (p.type === 1 && p.x + p.radius > dividerX - 4) {
                    p.x = dividerX - 4 - p.radius;
                    p.vx *= -1;
                }
                if (p.type === 2 && p.x - p.radius < dividerX + 4) {
                    p.x = dividerX + 4 + p.radius;
                    p.vx *= -1;
                }
            }
        });

        // Particle-particle collisions
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                this.checkCollision(this.particles[i], this.particles[j]);
            }
        }
    }

    checkCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy; // Optimization: Use squared distance first
        const minDist = p1.radius + p2.radius;
        const minDistSq = minDist * minDist;

        if (distSq < minDistSq) {
            const dist = Math.sqrt(distSq);

            // Prevent NaN/Infinity if particles are exactly on top of each other
            if (dist < 0.001) return;

            // Elastic collision
            const nx = dx / dist;
            const ny = dy / dist;

            const dvx = p1.vx - p2.vx;
            const dvy = p1.vy - p2.vy;
            const dvn = dvx * nx + dvy * ny;

            if (dvn > 0) return; // Already moving apart

            const m1 = p1.mass;
            const m2 = p2.mass;
            const totalMass = m1 + m2;

            const impulse = 2 * dvn / totalMass;

            p1.vx -= impulse * m2 * nx;
            p1.vy -= impulse * m2 * ny;
            p2.vx += impulse * m1 * nx;
            p2.vy += impulse * m1 * ny;

            // Separate particles
            const overlap = minDist - dist;
            p1.x -= overlap * 0.5 * nx;
            p1.y -= overlap * 0.5 * ny;
            p2.x += overlap * 0.5 * nx;
            p2.y += overlap * 0.5 * ny;
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw particles
        this.particles.forEach(p => {
            const gradient = this.ctx.createRadialGradient(
                p.x - p.radius * 0.3, p.y - p.radius * 0.3, 0,
                p.x, p.y, p.radius
            );
            gradient.addColorStop(0, p.color1);
            gradient.addColorStop(1, p.color2);

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();

            // Glow effect
            this.ctx.shadowColor = p.type === 1 ? 'rgba(37, 99, 235, 0.5)' : 'rgba(220, 38, 38, 0.5)';
            this.ctx.shadowBlur = 8;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
    }

    updateStats() {
        const dividerX = this.canvas.width / 2;

        let leftBlue = 0, leftRed = 0, rightBlue = 0, rightRed = 0;
        let totalSpeed = 0;

        this.particles.forEach(p => {
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            totalSpeed += speed;

            if (p.x < dividerX) {
                if (p.type === 1) leftBlue++;
                else leftRed++;
            } else {
                if (p.type === 1) rightBlue++;
                else rightRed++;
            }
        });

        document.getElementById('left-blue-count').textContent = leftBlue;
        document.getElementById('left-red-count').textContent = leftRed;
        document.getElementById('right-blue-count').textContent = rightBlue;
        document.getElementById('right-red-count').textContent = rightRed;

        const avgSpeed = (this.particles.length > 0)
            ? (totalSpeed / this.particles.length * 100).toFixed(0)
            : 0;
        document.getElementById('avg-speed').textContent = `${avgSpeed} m/s`;
    }

    recordGraphData() {
        const dividerX = this.canvas.width / 2;
        const gas1Total = this.particles.filter(p => p.type === 1).length || 1; // Prevent div by zero
        const gas2Total = this.particles.filter(p => p.type === 2).length || 1;

        let gas1Left = 0, gas2Right = 0;
        this.particles.forEach(p => {
            if (p.type === 1 && p.x < dividerX) gas1Left++;
            if (p.type === 2 && p.x >= dividerX) gas2Right++;
        });

        this.graphData.gas1Left.push(gas1Left / gas1Total * 100);
        this.graphData.gas2Right.push(gas2Right / gas2Total * 100);
        this.graphData.time.push(this.elapsedTime);

        // Keep only last 60 data points (30 seconds)
        if (this.graphData.time.length > 61) { // Keep slightly more to smooth scroll
            this.graphData.gas1Left.shift();
            this.graphData.gas2Right.shift();
            this.graphData.time.shift();
        }

        this.drawGraph();
    }

    drawGraph() {
        const ctx = this.graphCtx;
        const width = this.graphCanvas.width;
        const height = this.graphCanvas.height;

        ctx.clearRect(0, 0, width, height);

        // Background
        ctx.fillStyle = '#282e39';
        ctx.fillRect(0, 0, width, height);

        // Grid lines
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 1;

        // Horizontal grid (at 25%, 50%, 75%)
        for (let i = 1; i <= 3; i++) {
            const y = height * i / 4;
            ctx.beginPath();
            ctx.moveTo(40, y);
            ctx.lineTo(width - 10, y);
            ctx.stroke();
        }

        // 50% equilibrium line
        ctx.strokeStyle = '#9da6b9';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(40, height / 2);
        ctx.lineTo(width - 10, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Y-axis labels
        ctx.fillStyle = '#9da6b9';
        ctx.font = '10px Space Grotesk';
        ctx.textAlign = 'right';
        ctx.fillText('100%', 35, 15);
        ctx.fillText('50%', 35, height / 2 + 4);
        ctx.fillText('0%', 35, height - 5);

        if (this.graphData.time.length < 2) return;

        // Sliding window calculation
        const lastTime = this.graphData.time[this.graphData.time.length - 1];
        const timeWindow = 30; // Show last 30 seconds
        const startTime = Math.max(0, lastTime - timeWindow);
        const xScale = (width - 50) / timeWindow;

        const yScale = (height - 20) / 100;

        // Helper to get X position
        const getX = (t) => 40 + (t - startTime) * xScale;

        // Draw Gas 1 concentration in left chamber
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        this.graphData.gas1Left.forEach((val, i) => {
            const t = this.graphData.time[i];
            const x = getX(t);
            // Only draw lines if within or just outside the visible window
            if (x >= 40 - xScale && x <= width + xScale) {
                const y = height - 10 - val * yScale;
                if (i === 0 || getX(this.graphData.time[i - 1]) < 40) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Draw Gas 2 concentration in right chamber
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        this.graphData.gas2Right.forEach((val, i) => {
            const t = this.graphData.time[i];
            const x = getX(t);
            if (x >= 40 - xScale && x <= width + xScale) {
                const y = height - 10 - val * yScale;
                if (i === 0 || getX(this.graphData.time[i - 1]) < 40) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
    }
}

// Initialize simulation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new DiffusionSimulation();
});
