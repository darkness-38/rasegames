/**
 * Diffusion Simulation
 */

class EffusionSimulation {
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
                x: m + Math.random() * (this.dividerX - 2 * m), // Spawn on LEFT (same as Gas1)
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
        const gas1Slider = document.getElementById('gas1-slider');
        const gas2Slider = document.getElementById('gas2-slider');
        const gas1MassSlider = document.getElementById('gas1-mass-slider');
        const gas2MassSlider = document.getElementById('gas2-mass-slider');

        const setControlsEnabled = (enabled) => {
            const opacity = enabled ? '1' : '0.5';
            gas1Slider.disabled = !enabled;
            gas2Slider.disabled = !enabled;
            gas1MassSlider.disabled = !enabled;
            gas2MassSlider.disabled = !enabled;
            gas1Slider.style.opacity = opacity;
            gas2Slider.style.opacity = opacity;
            gas1MassSlider.style.opacity = opacity;
            gas2MassSlider.style.opacity = opacity;
        };

        document.getElementById('toggle-divider').addEventListener('click', () => {
            this.dividerOpen = !this.dividerOpen;
            const openText = (window.i18n && window.i18n.t('experiments.effusion.openHole')) || 'Open Hole';
            const closeText = (window.i18n && window.i18n.t('experiments.effusion.closeHole')) || 'Close Hole';
            document.getElementById('divider-text').textContent = this.dividerOpen ? closeText : openText;

            // Disable/enable controls based on divider state (only temp works without divider)
            setControlsEnabled(!this.dividerOpen);
        });

        document.getElementById('temp-slider').addEventListener('input', (e) => {
            this.temperature = parseInt(e.target.value);
            document.getElementById('temp-display').textContent = `${this.temperature} K`;
        });

        gas1Slider.addEventListener('input', (e) => {
            if (this.dividerOpen) return;
            const newCount = parseInt(e.target.value);
            document.getElementById('gas1-count').textContent = newCount;
            this.adjustGasCount('gas1', newCount);
        });

        gas1MassSlider.addEventListener('input', (e) => {
            if (this.dividerOpen) return;
            this.gas1Mass = parseInt(e.target.value);
            document.getElementById('gas1-mass').textContent = this.gas1Mass;
        });

        gas2Slider.addEventListener('input', (e) => {
            if (this.dividerOpen) return;
            const newCount = parseInt(e.target.value);
            document.getElementById('gas2-count').textContent = newCount;
            this.adjustGasCount('gas2', newCount);
        });

        gas2MassSlider.addEventListener('input', (e) => {
            if (this.dividerOpen) return;
            this.gas2Mass = parseInt(e.target.value);
            document.getElementById('gas2-mass').textContent = this.gas2Mass;
        });

        document.getElementById('reset-btn').addEventListener('click', () => {
            this.dividerOpen = false;
            this.temperature = 300;
            this.gas1Count = 50;
            this.gas2Count = 50;
            this.gas1Mass = 28;
            this.gas2Mass = 44;
            document.getElementById('temp-slider').value = 300;
            document.getElementById('temp-display').textContent = '300 K';
            gas1Slider.value = 50;
            gas2Slider.value = 50;
            gas1MassSlider.value = 28;
            gas2MassSlider.value = 44;
            document.getElementById('gas1-count').textContent = '50';
            document.getElementById('gas2-count').textContent = '50';
            document.getElementById('gas1-mass').textContent = '28';
            document.getElementById('gas2-mass').textContent = '44';
            document.getElementById('gas2-mass').textContent = '44';
            const openText = (window.i18n && window.i18n.t('experiments.effusion.openHole')) || 'Open Hole';
            document.getElementById('divider-text').textContent = openText;
            setControlsEnabled(true);
            this.init();
        });

        window.addEventListener('resize', () => { this.resize(); this.init(); });
    }

    adjustGasCount(type, newCount) {
        const currentParticles = this.particles.filter(p => p.type === type);
        const currentCount = currentParticles.length;
        const m = 20;

        if (newCount > currentCount) {
            // Add particles
            const mass = type === 'gas1' ? this.gas1Mass : this.gas2Mass;
            const s = Math.sqrt(this.temperature / mass) * 0.5;

            for (let i = currentCount; i < newCount; i++) {
                let x;
                if (type === 'gas1') {
                    x = m + Math.random() * (this.dividerX - 2 * m);
                } else {
                    // Start in vacuum experiment: Spawning new particles should respect the side they are supposed to be?
                    // Usually we spawn on the original side.
                    // For Effusion, simpler to always spawn on LEFT if we are "adding gas".
                    // But maybe user wants to add to right?
                    // Let's assume injection happens on the LEFT chamber.
                    x = m + Math.random() * (this.dividerX - 2 * m);
                }

                this.particles.push({
                    x: x,
                    y: m + Math.random() * (this.height - 2 * m),
                    vx: (Math.random() - 0.5) * s * 4,
                    vy: (Math.random() - 0.5) * s * 4,
                    radius: 5 + (mass / 100) * 3,
                    type: type, mass: mass
                });
            }
        } else if (newCount < currentCount) {
            // Remove particles of this type
            let removed = 0;
            const toRemove = currentCount - newCount;
            this.particles = this.particles.filter(p => {
                if (p.type === type && removed < toRemove) {
                    removed++;
                    return false;
                }
                return true;
            });
        }

        // Update counts
        if (type === 'gas1') this.gas1Count = newCount;
        else this.gas2Count = newCount;
    }

    update() {
        const m = 10, gapH = 60, gapY = (this.height - gapH) / 2;

        this.particles.forEach(p => {
            p.x += p.vx; p.y += p.vy;

            if (p.x < m + p.radius) { p.vx = Math.abs(p.vx); p.x = m + p.radius; }
            if (p.x > this.width - m - p.radius) { p.vx = -Math.abs(p.vx); p.x = this.width - m - p.radius; }
            if (p.y < m + p.radius) { p.vy = Math.abs(p.vy); p.y = m + p.radius; }
            if (p.y > this.height - m - p.radius) { p.vy = -Math.abs(p.vy); p.y = this.height - m - p.radius; }

            // Effusion Logic: Solid wall unless hole is open (dividerOpen=true means HOLE IS OPEN)
            // If hole is open, only allow passage through gapY -> gapY + gapH

            // Logic: 
            // 1. Divider exists always.
            // 2. If !dividerOpen (Hole Closed), full wall.
            // 3. If dividerOpen (Hole Open), wall with gap.

            // Wait, variable name reuse: In original, dividerOpen meant "NO DIVIDER".
            // Here, let's redefine: dividerOpen = true -> Hole is OPEN.

            const nearDiv = Math.abs(p.x - this.dividerX) < p.radius + 5;

            if (nearDiv) {
                // If hole is closed, OR if particle is NOT in the gap
                const inGap = this.dividerOpen && (p.y > gapY && p.y < gapY + gapH);

                if (!inGap) {
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

        // Draw Divider
        ctx.fillStyle = '#6b7280';
        if (this.dividerOpen) {
            // Hole Open: Draw top and bottom parts
            ctx.fillRect(this.dividerX - 3, m, 6, gapY - m);
            ctx.fillRect(this.dividerX - 3, gapY + gapH, 6, this.height - gapY - gapH - m);
        } else {
            // Hole Closed: Draw full line
            ctx.fillRect(this.dividerX - 3, m, 6, this.height - 2 * m);
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

document.addEventListener('DOMContentLoaded', () => { new EffusionSimulation('simulation-canvas'); });
