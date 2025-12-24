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
        [this.pvCanvas, this.ptCanvas].forEach(canvas => {
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

    updateUI() {
        document.getElementById('pressure-display').textContent = `${this.pressure.toFixed(2)} atm`;
        document.getElementById('volume-display').textContent = `${this.volume.toFixed(1)} L`;
        document.getElementById('temperature-display').textContent = `${this.temperature} K`;
        document.getElementById('particles-display').textContent = this.numParticles;

        // Update graph data
        this.pvData.push({ v: this.volume, p: this.pressure });
        this.ptData.push({ t: this.temperature, p: this.pressure });

        // Limit data points
        if (this.pvData.length > 50) this.pvData.shift();
        if (this.ptData.length > 50) this.ptData.shift();
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
            this.numParticles = parseInt(e.target.value);
            this.generateParticles();
            this.updateUI();
        });

        document.getElementById('add-btn').addEventListener('click', () => {
            this.numParticles = Math.min(100, this.numParticles + 5);
            particleSlider.value = this.numParticles;
            this.generateParticles();
            this.updateUI();
        });

        document.getElementById('remove-btn').addEventListener('click', () => {
            this.numParticles = Math.max(10, this.numParticles - 5);
            particleSlider.value = this.numParticles;
            this.generateParticles();
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

        this.pistonY = Math.max(0.05, Math.min(0.7, (y - this.height * 0.1) / (this.height * 0.6)));
        this.generateParticles();
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

        // Clear
        ctx.fillStyle = '#1e2330';
        ctx.fillRect(0, 0, this.width, this.height);

        const containerTop = this.height * 0.08;
        const containerBottom = this.height * 0.88;
        const containerLeft = this.width * 0.15;
        const containerRight = this.width * 0.85;
        const pistonScreenY = this.height * 0.1 + this.pistonY * this.height * 0.6;

        // Container walls
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(containerLeft, containerTop);
        ctx.lineTo(containerLeft, containerBottom);
        ctx.lineTo(containerRight, containerBottom);
        ctx.lineTo(containerRight, containerTop);
        ctx.stroke();

        // Piston
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(containerLeft - 10, pistonScreenY - 15, containerRight - containerLeft + 20, 30);

        // Piston handle
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(this.width / 2 - 15, containerTop - 10, 30, pistonScreenY - containerTop + 10);

        // Particles
        this.particles.forEach(p => {
            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
            gradient.addColorStop(0, '#60a5fa');
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw graphs
        this.drawPVGraph();
        this.drawPTGraph();
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
