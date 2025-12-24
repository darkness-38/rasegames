/**
 * Diffusion Simulation
 */

class DiffusionSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.resize();

        this.dividerOpen = false;
        this.temperature = 300;
        this.gas1Count = 50;
        this.gas2Count = 50;
        this.gas1Mass = 28;
        this.gas2Mass = 44;
        this.particles = [];

        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.width = rect.width;
        this.height = rect.height;
        this.dividerX = this.width / 2;
    }

    init() {
        this.particles = [];
        const m = 20;

        for (let i = 0; i < this.gas1Count; i++) {
            const s = Math.sqrt(this.temperature / this.gas1Mass) * 0.5;
            this.particles.push({
                x: m + Math.random() * (this.dividerX - 2 * m),
                y: m + Math.random() * (this.height - 2 * m),
                vx: (Math.random() - 0.5) * s * 4,
                vy: (Math.random() - 0.5) * s * 4,
                radius: 5 + (this.gas1Mass / 100) * 3,
                type: 'gas1', mass: this.gas1Mass
            });
        }

        for (let i = 0; i < this.gas2Count; i++) {
            const s = Math.sqrt(this.temperature / this.gas2Mass) * 0.5;
            this.particles.push({
                x: this.dividerX + m + Math.random() * (this.width - this.dividerX - 2 * m),
                y: m + Math.random() * (this.height - 2 * m),
                vx: (Math.random() - 0.5) * s * 4,
                vy: (Math.random() - 0.5) * s * 4,
                radius: 5 + (this.gas2Mass / 100) * 3,
                type: 'gas2', mass: this.gas2Mass
            });
        }
        this.updateCounts();
    }

    updateCounts() {
        let l1 = 0, l2 = 0, r1 = 0, r2 = 0;
        this.particles.forEach(p => {
            if (p.x < this.dividerX) { p.type === 'gas1' ? l1++ : l2++; }
            else { p.type === 'gas1' ? r1++ : r2++; }
        });
        document.getElementById('left-gas1').textContent = l1;
        document.getElementById('left-gas2').textContent = l2;
        document.getElementById('right-gas1').textContent = r1;
        document.getElementById('right-gas2').textContent = r2;
    }

    bindEvents() {
        document.getElementById('toggle-divider').addEventListener('click', () => {
            this.dividerOpen = !this.dividerOpen;
            document.getElementById('divider-text').textContent = this.dividerOpen ? 'Add Divider' : 'Remove Divider';
        });

        document.getElementById('temp-slider').addEventListener('input', (e) => {
            this.temperature = parseInt(e.target.value);
            document.getElementById('temp-display').textContent = `${this.temperature} K`;
        });

        document.getElementById('gas1-slider').addEventListener('input', (e) => {
            this.gas1Count = parseInt(e.target.value);
            document.getElementById('gas1-count').textContent = this.gas1Count;
            this.init();
        });

        document.getElementById('gas1-mass-slider').addEventListener('input', (e) => {
            this.gas1Mass = parseInt(e.target.value);
            document.getElementById('gas1-mass').textContent = this.gas1Mass;
        });

        document.getElementById('gas2-slider').addEventListener('input', (e) => {
            this.gas2Count = parseInt(e.target.value);
            document.getElementById('gas2-count').textContent = this.gas2Count;
            this.init();
        });

        document.getElementById('gas2-mass-slider').addEventListener('input', (e) => {
            this.gas2Mass = parseInt(e.target.value);
            document.getElementById('gas2-mass').textContent = this.gas2Mass;
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.dividerOpen = false;
            this.temperature = 300;
            this.gas1Count = 50;
            this.gas2Count = 50;
            document.getElementById('temp-slider').value = 300;
            document.getElementById('temp-display').textContent = '300 K';
            document.getElementById('gas1-slider').value = 50;
            document.getElementById('gas2-slider').value = 50;
            document.getElementById('gas1-count').textContent = '50';
            document.getElementById('gas2-count').textContent = '50';
            document.getElementById('divider-text').textContent = 'Remove Divider';
            this.init();
        });

        window.addEventListener('resize', () => { this.resize(); this.init(); });
    }

    update() {
        const m = 10, gapH = 60, gapY = (this.height - gapH) / 2;

        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;

            if (p.x < m + p.radius) { p.vx = Math.abs(p.vx); p.x = m + p.radius; }
            if (p.x > this.width - m - p.radius) { p.vx = -Math.abs(p.vx); p.x = this.width - m - p.radius; }
            if (p.y < m + p.radius) { p.vy = Math.abs(p.vy); p.y = m + p.radius; }
            if (p.y > this.height - m - p.radius) { p.vy = -Math.abs(p.vy); p.y = this.height - m - p.radius; }

            if (!this.dividerOpen) {
                const nearDiv = Math.abs(p.x - this.dividerX) < p.radius + 5;
                const inGap = p.y > gapY && p.y < gapY + gapH;
                if (nearDiv && !inGap) {
                    if (p.x < this.dividerX) { p.vx = -Math.abs(p.vx); p.x = this.dividerX - p.radius - 5; }
                    else { p.vx = Math.abs(p.vx); p.x = this.dividerX + p.radius + 5; }
                }
            }

            p.vx += (Math.random() - 0.5) * 0.1;
            p.vy += (Math.random() - 0.5) * 0.1;
            const maxS = Math.sqrt(this.temperature / p.mass) * 1.5;
            const s = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (s > maxS) { p.vx = (p.vx / s) * maxS; p.vy = (p.vy / s) * maxS; }
        });
        this.updateCounts();
    }

    draw() {
        const ctx = this.ctx, m = 10, gapH = 60, gapY = (this.height - gapH) / 2;
        ctx.fillStyle = '#1e2330'; ctx.fillRect(0, 0, this.width, this.height);
        ctx.strokeStyle = '#3f4756'; ctx.lineWidth = 4;
        ctx.strokeRect(m, m, this.width - 2 * m, this.height - 2 * m);

        if (!this.dividerOpen) {
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(this.dividerX - 3, m, 6, gapY - m);
            ctx.fillRect(this.dividerX - 3, gapY + gapH, 6, this.height - gapY - gapH - m);
        }

        this.particles.forEach(p => {
            const c = p.type === 'gas1' ? '#3b82f6' : '#ef4444';
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 2);
            g.addColorStop(0, c); g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        });
    }

    animate() { this.update(); this.draw(); requestAnimationFrame(() => this.animate()); }
}

document.addEventListener('DOMContentLoaded', () => { new DiffusionSimulation('simulation-canvas'); });
