/**
 * Gas Properties Simulation
 * Demonstrates P-V-T relationships with a movable piston
 */

class GasPropertiesSimulation {
    constructor() {
        this.mainCanvas = document.getElementById('simulation-canvas');
        this.mainCtx = this.mainCanvas.getContext('2d');
        this.pvCanvas = document.getElementById('pv-graph');
        this.pvCtx = this.pvCanvas.getContext('2d');
        this.ptCanvas = document.getElementById('pt-graph');
        this.ptCtx = this.ptCanvas.getContext('2d');
        this.pnCanvas = document.getElementById('pn-graph');
        this.pnCtx = this.pnCanvas.getContext('2d');
        this.zCanvas = document.getElementById('z-graph');
        this.zCtx = this.zCanvas.getContext('2d');

        this.dpr = window.devicePixelRatio || 1;
        this.resize();

        // Gas constants
        this.R = 0.0821; // L⋅atm/(mol⋅K)

        // State variables
        this.temperature = 300; // K
        this.numParticles = 50;
        this.pistonY = 0.3; // 0-1, position from top
        this.particles = [];

        // Piston dragging
        this.dragging = false;

        // Graph data
        this.pvData = [];
        this.ptData = [];
        this.pnData = [];
        this.zData = [];

        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        // Main canvas
        const rect = this.mainCanvas.getBoundingClientRect();
        this.mainCanvas.width = rect.width * this.dpr;
        this.mainCanvas.height = rect.height * this.dpr;
        this.mainCtx.scale(this.dpr, this.dpr);
        this.width = rect.width;
        this.height = rect.height;

        // Graph canvases
        [this.pvCanvas, this.ptCanvas, this.pnCanvas, this.zCanvas].forEach(canvas => {
            const r = canvas.getBoundingClientRect();
            canvas.width = r.width * this.dpr;
            canvas.height = r.height * this.dpr;
            canvas.getContext('2d').scale(this.dpr, this.dpr);
        });
    }

    get volume() {
        return 5 + (1 - this.pistonY) * 15; // 5-20 L
    }

    get pressure() {
        // PV = nRT => P = nRT/V
        const n = this.numParticles / 100; // Simplified moles
        return (n * this.R * this.temperature) / this.volume;
    }

    get compressibilityZ() {
        // Z = PV / nRT - for ideal gas Z = 1
        // Simulate Van der Waals-like deviation:
        // - High density (small volume, many particles) -> Z > 1 (repulsion dominates)
        // - Low temperature -> Z < 1 (attraction dominates)
        const n = this.numParticles / 100;
        if (n === 0) return 1;

        // Density effect: more particles in less volume = deviation
        const density = this.numParticles / this.volume;
        const densityFactor = density / 5; // normalized

        // Temperature effect: low temp = more attraction
        const tempFactor = (300 - this.temperature) / 500; // negative at high temp

        // Combine effects
        let z = 1 + (densityFactor * 0.15) - (tempFactor * 0.1);

        // Clamp to reasonable range
        return Math.max(0.7, Math.min(1.3, z));
    }

    init() {
        this.generateParticles();
        this.updateUI();
    }

    generateParticles() {
        this.particles = [];
        const containerTop = this.height * 0.1 + this.pistonY * this.height * 0.6;
        const containerBottom = this.height * 0.85;
        const containerLeft = this.width * 0.15;
        const containerRight = this.width * 0.85;

        for (let i = 0; i < this.numParticles; i++) {
            this.particles.push({
                x: containerLeft + Math.random() * (containerRight - containerLeft - 20) + 10,
                y: containerTop + Math.random() * (containerBottom - containerTop - 20) + 10,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: 5
            });
        }
    }

    adjustParticleCount(newCount) {
        const containerTop = this.height * 0.1 + this.pistonY * this.height * 0.6;
        const containerBottom = this.height * 0.85;
        const containerLeft = this.width * 0.15;
        const containerRight = this.width * 0.85;

        if (newCount > this.particles.length) {
            // Add particles
            while (this.particles.length < newCount) {
                this.particles.push({
                    x: containerLeft + Math.random() * (containerRight - containerLeft - 20) + 10,
                    y: containerTop + 30 + Math.random() * (containerBottom - containerTop - 50),
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: 5
                });
            }
        } else if (newCount < this.particles.length) {
            // Remove particles
            this.particles.length = newCount;
        }
        this.numParticles = newCount;
    }

    updateUI() {
        document.getElementById('pressure-display').textContent = this.pressure.toFixed(2);
        document.getElementById('volume-display').textContent = this.volume.toFixed(1);
        document.getElementById('temperature-display').textContent = this.temperature;
        document.getElementById('particles-display').textContent = this.numParticles;

        // Update graph data
        this.pvData.push({ v: this.volume, p: this.pressure });
        this.ptData.push({ t: this.temperature, p: this.pressure });
        this.pnData.push({ n: this.numParticles, p: this.pressure });
        this.zData.push({ p: this.pressure, z: this.compressibilityZ });
    }

    bindEvents() {
        // Temperature slider
        const tempSlider = document.getElementById('temp-slider');
        tempSlider.addEventListener('input', (e) => {
            this.temperature = parseInt(e.target.value);
            this.updateUI();
        });

        document.getElementById('heat-btn').addEventListener('click', () => {
            this.temperature = Math.min(600, this.temperature + 25);
            tempSlider.value = this.temperature;
            this.updateUI();
        });

        document.getElementById('cool-btn').addEventListener('click', () => {
            this.temperature = Math.max(100, this.temperature - 25);
            tempSlider.value = this.temperature;
            this.updateUI();
        });

        // Particle slider
        const particleSlider = document.getElementById('particle-slider');
        particleSlider.addEventListener('input', (e) => {
            const newCount = parseInt(e.target.value);
            this.adjustParticleCount(newCount);
            this.updateUI();
        });

        document.getElementById('add-btn').addEventListener('click', () => {
            this.numParticles = Math.min(100, this.numParticles + 5);
            particleSlider.value = this.numParticles;
            this.adjustParticleCount(this.numParticles);
            this.updateUI();
        });

        document.getElementById('remove-btn').addEventListener('click', () => {
            this.numParticles = Math.max(10, this.numParticles - 5);
            particleSlider.value = this.numParticles;
            this.adjustParticleCount(this.numParticles);
            this.updateUI();
        });

        // Piston drag
        this.mainCanvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.mainCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.mainCanvas.addEventListener('mouseup', () => this.dragging = false);
        this.mainCanvas.addEventListener('mouseleave', () => this.dragging = false);

        // Touch events
        this.mainCanvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.mainCanvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.mainCanvas.addEventListener('touchend', () => this.dragging = false);

        // Reset
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.temperature = 300;
            this.numParticles = 50;
            this.pistonY = 0.3;
            tempSlider.value = 300;
            particleSlider.value = 50;
            this.pvData = [];
            this.ptData = [];
            this.pnData = [];
            this.zData = [];
            this.generateParticles();
            this.updateUI();
        });

        window.addEventListener('resize', () => {
            this.resize();
            this.generateParticles();
        });
    }

    handleMouseDown(e) {
        const rect = this.mainCanvas.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const pistonScreenY = this.height * 0.1 + this.pistonY * this.height * 0.6;

        if (Math.abs(y - pistonScreenY) < 30) {
            this.dragging = true;
        }
    }

    handleMouseMove(e) {
        if (!this.dragging) return;

        const rect = this.mainCanvas.getBoundingClientRect();
        const y = e.clientY - rect.top;

        const newPistonY = Math.max(0.05, Math.min(0.7, (y - this.height * 0.1) / (this.height * 0.6)));

        // Push particles down if piston is moving down
        const pistonScreenY = this.height * 0.1 + newPistonY * this.height * 0.6;
        const oldPistonScreenY = this.height * 0.1 + this.pistonY * this.height * 0.6;

        if (newPistonY > this.pistonY) {
            // Piston moving down - push particles
            this.particles.forEach(p => {
                if (p.y < pistonScreenY + p.radius + 20) {
                    p.y = pistonScreenY + p.radius + 20;
                    p.vy = Math.abs(p.vy) * 0.5 + 1; // Bounce down a bit
                }
            });
        }

        this.pistonY = newPistonY;
        this.updateUI();
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }

    update() {
        const speedFactor = this.temperature / 300;
        const containerTop = this.height * 0.1 + this.pistonY * this.height * 0.6;
        const containerBottom = this.height * 0.85;
        const containerLeft = this.width * 0.15;
        const containerRight = this.width * 0.85;

        this.particles.forEach(p => {
            p.x += p.vx * speedFactor;
            p.y += p.vy * speedFactor;

            // Bounce off walls
            if (p.x < containerLeft + p.radius || p.x > containerRight - p.radius) {
                p.vx *= -1;
                p.x = Math.max(containerLeft + p.radius, Math.min(containerRight - p.radius, p.x));
            }
            if (p.y < containerTop + p.radius || p.y > containerBottom - p.radius) {
                p.vy *= -1;
                p.y = Math.max(containerTop + p.radius, Math.min(containerBottom - p.radius, p.y));
            }
        });
    }

    draw() {
        const ctx = this.mainCtx;

        // Clear with gradient background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#1a1f2e');
        bgGrad.addColorStop(1, '#0f1318');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        const containerTop = this.height * 0.08;
        const containerBottom = this.height * 0.88;
        const containerLeft = this.width * 0.15;
        const containerRight = this.width * 0.85;
        const pistonScreenY = this.height * 0.1 + this.pistonY * this.height * 0.6;
        const containerWidth = containerRight - containerLeft;

        // Container glow
        ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
        ctx.shadowBlur = 20;

        // Container glass effect
        const glassGrad = ctx.createLinearGradient(containerLeft, 0, containerRight, 0);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
        glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(containerLeft, pistonScreenY + 15, containerWidth, containerBottom - pistonScreenY - 15);

        ctx.shadowBlur = 0;

        // Container walls with gradient
        const wallGrad = ctx.createLinearGradient(containerLeft, 0, containerLeft + 8, 0);
        wallGrad.addColorStop(0, '#4b5563');
        wallGrad.addColorStop(0.5, '#6b7280');
        wallGrad.addColorStop(1, '#4b5563');

        ctx.fillStyle = wallGrad;
        // Left wall
        ctx.fillRect(containerLeft - 6, pistonScreenY, 8, containerBottom - pistonScreenY);
        // Right wall
        ctx.fillRect(containerRight - 2, pistonScreenY, 8, containerBottom - pistonScreenY);
        // Bottom wall
        ctx.fillRect(containerLeft - 6, containerBottom - 6, containerWidth + 12, 10);

        // Wall shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(containerLeft - 4, pistonScreenY, 2, containerBottom - pistonScreenY);
        ctx.fillRect(containerRight, pistonScreenY, 2, containerBottom - pistonScreenY);

        // Piston with metallic gradient
        const pistonGrad = ctx.createLinearGradient(0, pistonScreenY - 20, 0, pistonScreenY + 20);
        pistonGrad.addColorStop(0, '#9ca3af');
        pistonGrad.addColorStop(0.3, '#d1d5db');
        pistonGrad.addColorStop(0.5, '#e5e7eb');
        pistonGrad.addColorStop(0.7, '#d1d5db');
        pistonGrad.addColorStop(1, '#6b7280');

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        // Piston body
        ctx.fillStyle = pistonGrad;
        ctx.beginPath();
        ctx.roundRect(containerLeft - 8, pistonScreenY - 18, containerWidth + 16, 36, 4);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // Piston shine line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(containerLeft, pistonScreenY - 10);
        ctx.lineTo(containerRight, pistonScreenY - 10);
        ctx.stroke();

        // Piston grip lines
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const x = containerLeft + 30 + i * 25;
            ctx.beginPath();
            ctx.moveTo(x, pistonScreenY - 8);
            ctx.lineTo(x, pistonScreenY + 8);
            ctx.stroke();
        }

        // Piston rod with metallic effect
        const rodGrad = ctx.createLinearGradient(this.width / 2 - 12, 0, this.width / 2 + 12, 0);
        rodGrad.addColorStop(0, '#6b7280');
        rodGrad.addColorStop(0.3, '#9ca3af');
        rodGrad.addColorStop(0.5, '#d1d5db');
        rodGrad.addColorStop(0.7, '#9ca3af');
        rodGrad.addColorStop(1, '#6b7280');

        ctx.fillStyle = rodGrad;
        ctx.beginPath();
        ctx.roundRect(this.width / 2 - 10, containerTop - 20, 20, pistonScreenY - containerTop + 5, 3);
        ctx.fill();

        // Rod shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.width / 2 - 6, containerTop - 15, 3, pistonScreenY - containerTop);

        // Handle at top
        ctx.fillStyle = '#374151';
        ctx.beginPath();
        ctx.arc(this.width / 2, containerTop - 25, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4b5563';
        ctx.beginPath();
        ctx.arc(this.width / 2, containerTop - 25, 10, 0, Math.PI * 2);
        ctx.fill();

        // Particles with glow and motion blur
        this.particles.forEach(p => {
            // Motion trail
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > 1) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(96, 165, 250, ${0.3 * (speed / 5)})`;
                ctx.lineWidth = p.radius * 1.5;
                ctx.lineCap = 'round';
                ctx.moveTo(p.x - p.vx * 2, p.y - p.vy * 2);
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }

            // Outer glow
            const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
            glowGrad.addColorStop(0, 'rgba(96, 165, 250, 0.6)');
            glowGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.2)');
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Main particle with gradient
            const particleGrad = ctx.createRadialGradient(p.x - 2, p.y - 2, 0, p.x, p.y, p.radius);
            particleGrad.addColorStop(0, '#93c5fd');
            particleGrad.addColorStop(0.7, '#3b82f6');
            particleGrad.addColorStop(1, '#1e40af');
            ctx.fillStyle = particleGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(p.x - p.radius * 0.3, p.y - p.radius * 0.3, p.radius * 0.35, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw graphs
        this.drawPVGraph();
        this.drawPTGraph();
        this.drawPNGraph();
        this.drawZGraph();
    }

    drawPVGraph() {
        const ctx = this.pvCtx;
        const rect = this.pvCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.fillStyle = '#282e39';
        ctx.fillRect(0, 0, w, h);

        // Axes
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, h - 20);
        ctx.lineTo(w - 10, h - 20);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#9da6b9';
        ctx.font = '10px Space Grotesk';
        ctx.fillText('P', 10, 15);
        ctx.fillText('V', w - 15, h - 5);

        // Data points
        if (this.pvData.length > 1) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();

            this.pvData.forEach((point, i) => {
                const x = 30 + ((point.v - 5) / 15) * (w - 50);
                const y = h - 20 - (point.p / 3) * (h - 40);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.stroke();

            // Current point
            const last = this.pvData[this.pvData.length - 1];
            const x = 30 + ((last.v - 5) / 15) * (w - 50);
            const y = h - 20 - (last.p / 3) * (h - 40);
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPTGraph() {
        const ctx = this.ptCtx;
        const rect = this.ptCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.fillStyle = '#282e39';
        ctx.fillRect(0, 0, w, h);

        // Axes
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, h - 20);
        ctx.lineTo(w - 10, h - 20);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#9da6b9';
        ctx.font = '10px Space Grotesk';
        ctx.fillText('P', 10, 15);
        ctx.fillText('T', w - 15, h - 5);

        // Data points
        if (this.ptData.length > 1) {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();

            this.ptData.forEach((point, i) => {
                const x = 30 + ((point.t - 100) / 500) * (w - 50);
                const y = h - 20 - (point.p / 3) * (h - 40);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.stroke();

            // Current point
            const last = this.ptData[this.ptData.length - 1];
            const x = 30 + ((last.t - 100) / 500) * (w - 50);
            const y = h - 20 - (last.p / 3) * (h - 40);
            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawPNGraph() {
        const ctx = this.pnCtx;
        const rect = this.pnCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.fillStyle = '#282e39';
        ctx.fillRect(0, 0, w, h);

        // Axes
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, h - 20);
        ctx.lineTo(w - 10, h - 20);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#9da6b9';
        ctx.font = '10px Space Grotesk';
        ctx.fillText('P', 10, 15);
        ctx.fillText('n', w - 15, h - 5);

        // Data points
        if (this.pnData.length > 1) {
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2;
            ctx.beginPath();

            this.pnData.forEach((point, i) => {
                const x = 30 + ((point.n - 10) / 90) * (w - 50);
                const y = h - 20 - (point.p / 3) * (h - 40);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.stroke();

            // Current point
            const last = this.pnData[this.pnData.length - 1];
            const x = 30 + ((last.n - 10) / 90) * (w - 50);
            const y = h - 20 - (last.p / 3) * (h - 40);
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawZGraph() {
        const ctx = this.zCtx;
        const rect = this.zCanvas.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;

        ctx.fillStyle = '#282e39';
        ctx.fillRect(0, 0, w, h);

        // Axes
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, h - 20);
        ctx.lineTo(w - 10, h - 20);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#9da6b9';
        ctx.font = '10px Space Grotesk';
        ctx.fillText('Z', 10, 15);
        ctx.fillText('P', w - 15, h - 5);

        // Ideal gas reference line at Z = 1 (in middle of graph)
        const idealY = h / 2;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(30, idealY);
        ctx.lineTo(w - 10, idealY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Z = 1 label
        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 9px Space Grotesk';
        ctx.fillText('Z=1 (Ideal)', 35, idealY - 5);

        // Data points
        if (this.zData.length > 1) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 2;
            ctx.beginPath();

            this.zData.forEach((point, i) => {
                const x = 30 + (point.p / 3) * (w - 50);
                // Z centered at 1, range 0.5-1.5
                const zNorm = (point.z - 0.5) / 1;
                const y = h - 20 - zNorm * (h - 40);

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });

            ctx.stroke();

            // Current point
            const last = this.zData[this.zData.length - 1];
            const x = 30 + (last.p / 3) * (w - 50);
            const zNorm = (last.z - 0.5) / 1;
            const y = h - 20 - zNorm * (h - 40);
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Show current Z value
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Space Grotesk';
            ctx.fillText(`Z=${last.z.toFixed(2)}`, w - 50, 15);
        }
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GasPropertiesSimulation();
});
