/**
 * Acid-Base Titration Simulation
 * Simulates the titration of HCl with NaOH using Phenolphthalein indicator
 */

class TitrationSimulation {
    constructor() {
        this.canvas = document.getElementById('sim-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.graphCanvas = document.getElementById('graph-canvas');
        this.graphCtx = this.graphCanvas.getContext('2d');

        // Simulation State
        this.acidVolume = 50; // mL (Initial in flask)
        this.acidConc = 0.1; // M
        this.baseConc = 0.1; // M
        this.baseVolumeAdded = 0; // mL

        this.isValveOpen = false;
        this.dropRate = 0.5; // mL per frame when open
        this.drops = [];

        this.phLog = [{ vol: 0, ph: 1.0 }]; // History for graph
        this.currentPH = 1.0;

        // Visuals
        this.flaskColor = 'rgba(200, 230, 255, 0.3)'; // Clear/Water-like
        this.indicatorColor = { r: 255, g: 105, b: 180 }; // Hot pink

        this.init();
    }

    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupEventListeners();
        this.updatePH(); // Initial calc
        this.animate();
    }

    resizeCanvas() {
        const container = document.getElementById('canvas-container');
        this.canvas.width = container.offsetWidth;
        this.canvas.height = 400;

        this.graphCanvas.width = this.graphCanvas.offsetWidth;
        this.graphCanvas.height = 300;
        this.drawGraph();
    }

    setupEventListeners() {
        // Valve Toggle
        const valveBtn = document.getElementById('valve-btn');
        valveBtn.addEventListener('mousedown', () => {
            this.isValveOpen = true;
            valveBtn.classList.add('bg-green-600');
        });
        window.addEventListener('mouseup', () => {
            this.isValveOpen = false;
            valveBtn.classList.remove('bg-green-600');
        });
        // Mobile touch support
        valveBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isValveOpen = true;
            valveBtn.classList.add('bg-green-600');
        });
        valveBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isValveOpen = false;
            valveBtn.classList.remove('bg-green-600');
        });

        // Add 1mL Button
        document.getElementById('add-1ml-btn').addEventListener('click', () => {
            this.addBase(1.0);
        });

        // Reset
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        // Settings (optional, if we add sliders later for concentration)
    }

    reset() {
        this.acidVolume = 50;
        this.baseVolumeAdded = 0;
        this.isValveOpen = false;
        this.phLog = [{ vol: 0, ph: 1.0 }];
        this.flaskColor = 'rgba(200, 230, 255, 0.3)';
        this.updatePH();
        this.drawGraph();
    }

    addBase(amount) {
        this.baseVolumeAdded += amount;
        this.updatePH();

        // Add drop animation visual for single clicks
        this.drops.push({
            x: this.canvas.width / 2,
            y: 160, // Burette tip
            vy: 5,
            radius: 4,
            opacity: 1
        });
    }

    updatePH() {
        // Strong Acid (HCl) vs Strong Base (NaOH) logic
        const molesAcid = (this.acidVolume / 1000) * this.acidConc;
        const molesBase = (this.baseVolumeAdded / 1000) * this.baseConc;
        const totalVolL = (this.acidVolume + this.baseVolumeAdded) / 1000;

        let ph = 7;
        if (molesAcid > molesBase) {
            // Excess Acid
            const excessMoles = molesAcid - molesBase;
            const concH = excessMoles / totalVolL;
            ph = -Math.log10(concH);
        } else if (molesBase > molesAcid) {
            // Excess Base
            const excessMoles = molesBase - molesAcid;
            const concOH = excessMoles / totalVolL;
            const pOH = -Math.log10(concOH);
            ph = 14 - pOH;
        } else {
            ph = 7.0;
        }

        // Clamp pH
        ph = Math.max(0, Math.min(14, ph));
        this.currentPH = ph;

        // Log for graph (throttle slightly if needed, but push is cheap)
        // Check if last point is same volume to avoid duplicates
        const last = this.phLog[this.phLog.length - 1];
        if (last.vol !== this.baseVolumeAdded) {
            this.phLog.push({ vol: this.baseVolumeAdded, ph: ph });
        }

        // Update Stats UI
        document.getElementById('ph-display').textContent = ph.toFixed(2);
        document.getElementById('vol-display').textContent = this.baseVolumeAdded.toFixed(1) + ' mL';

        // Determine Color (Phenolphthalein)
        // pH < 8.2: Colorless
        // pH >= 8.2: Pink
        // We'll transition opacity
        if (ph < 8.2) {
            this.flaskColor = 'rgba(200, 230, 255, 0.3)';
        } else {
            // Calculate intensity based on how far past 8.2 we are
            // Full pink by pH 10
            let intensity = Math.min(1, (ph - 8.2) / 1.8);
            // Mix water color with pink
            this.flaskColor = `rgba(255, 105, 180, ${0.1 + intensity * 0.6})`;
        }

        this.drawGraph();
    }

    update() {
        // Continuous flow if valve is open
        if (this.isValveOpen) {
            const flowRate = 0.2; // mL per frame
            this.baseVolumeAdded += flowRate;
            this.updatePH();

            // Spawn drops continuously
            if (Math.random() < 0.3) {
                this.drops.push({
                    x: this.canvas.width / 2,
                    y: 160,
                    vy: 5 + Math.random() * 2,
                    radius: 3 + Math.random() * 2,
                    opacity: 1
                });
            }
        }

        // Physics for drops
        for (let i = this.drops.length - 1; i >= 0; i--) {
            let d = this.drops[i];
            d.y += d.vy;
            d.vy += 0.5; // Gravity

            // Hit liquid surface approx
            if (d.y > 300) { // Flask liquid surface level
                // Splash / Disappear
                this.drops.splice(i, 1);
            }
        }
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cx = w / 2;

        ctx.clearRect(0, 0, w, h);

        // --- Draw Stand ---
        ctx.fillStyle = '#3f4756';
        ctx.fillRect(cx - 80, 50, 10, 300); // Pole
        ctx.fillRect(cx - 100, 340, 50, 10); // Base

        // Clamp
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(cx - 80, 120, 40, 5);

        // --- Draw Burette ---
        ctx.strokeStyle = '#9da6b9';
        ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';

        // Tube
        ctx.strokeRect(cx - 10, 20, 20, 140);
        ctx.fillRect(cx - 10, 20, 20, 140);

        // Tip
        ctx.beginPath();
        ctx.moveTo(cx - 10, 160);
        ctx.lineTo(cx - 2, 180);
        ctx.lineTo(cx + 2, 180);
        ctx.lineTo(cx + 10, 160);
        ctx.stroke();

        // Burette Liquid (Decreases as we add base)
        // Max capacity 50mL. 
        const maxVol = 50;
        const remainingVol = Math.max(0, maxVol - this.baseVolumeAdded);
        const liquidHeight = (remainingVol / maxVol) * 140;

        ctx.fillStyle = 'rgba(200, 230, 255, 0.4)'; // NaOH is clear
        ctx.fillRect(cx - 9, 20 + (140 - liquidHeight), 18, liquidHeight);

        // --- Draw Drops ---
        ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
        this.drops.forEach(d => {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // --- Draw Erlenmeyer Flask ---
        const flaskY = 340;
        const flaskW = 80;
        const neckW = 26;
        const neckH = 60;

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.fillStyle = this.flaskColor;

        ctx.beginPath();
        // Neck top
        ctx.moveTo(cx - neckW / 2, flaskY - 120);
        ctx.lineTo(cx + neckW / 2, flaskY - 120);
        // Neck sides
        ctx.lineTo(cx + neckW / 2, flaskY - 120 + neckH);
        // Body (Cone)
        ctx.lineTo(cx + flaskW / 2, flaskY);
        ctx.lineTo(cx - flaskW / 2, flaskY);
        ctx.lineTo(cx - neckW / 2, flaskY - 120 + neckH);
        ctx.closePath();

        ctx.stroke();
        ctx.fill();

        // Flask Liquid Level (Increases)
        // Visual approximation
        ctx.fillStyle = this.flaskColor; // Dynamic indicator color
        const liquidBaseY = flaskY - 2;
        const liquidFillH = 30 + (this.baseVolumeAdded / 100) * 40; // scales up slightly

        // Clip to flask shape to draw liquid correctly? 
        // For simplicity, drawing a trapezoid inside
        // ... Or actually the fill above already colored the whole flask.
        // Let's refine: The flask glass is transparent, the liquid is inside.

        // Re-draw liquid specifically
        ctx.save();
        ctx.clip(); // Clip to the flask path drawn above

        // Draw liquid rect inside clipped area
        ctx.fillStyle = this.flaskColor;
        ctx.fillRect(cx - flaskW, liquidBaseY - liquidFillH, flaskW * 2, liquidFillH);

        ctx.restore();

        // --- Text/Labels ---
        ctx.fillStyle = '#9da6b9';
        ctx.font = '12px Space Grotesk';
        ctx.fillText('NaOH (0.1M)', cx + 15, 40);
        ctx.fillText('HCl + Indicator', cx + 45, flaskY - 20);
    }

    drawGraph() {
        const ctx = this.graphCtx;
        const w = this.graphCanvas.width;
        const h = this.graphCanvas.height;
        const padding = 40;

        ctx.clearRect(0, 0, w, h);

        // Bg
        ctx.fillStyle = '#1e2330'; // Darker panel bg
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = '#3f4756';
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Y - pH 0-14
        for (let i = 0; i <= 14; i += 2) {
            const y = h - padding - (i / 14) * (h - 2 * padding);
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
            ctx.fillText(i, 10, y + 4);
        }
        // X - Vol 0-100
        for (let i = 0; i <= 100; i += 20) {
            const x = padding + (i / 100) * (w - 2 * padding);
            ctx.moveTo(x, padding);
            ctx.lineTo(x, h - padding);
            ctx.fillText(i, x - 5, h - 10);
        }
        ctx.stroke();

        // Axes
        ctx.strokeStyle = '#9da6b9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, h - padding);
        ctx.lineTo(w - padding, h - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#9da6b9';
        ctx.textAlign = 'center';
        ctx.fillText('Volume NaOH Added (mL)', w / 2, h - 5);
        ctx.save();
        ctx.translate(15, h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('pH', 0, 0);
        ctx.restore();

        // Plot Line
        if (this.phLog.length < 2) return;

        ctx.strokeStyle = '#a855f7'; // Purple line
        ctx.lineWidth = 3;
        ctx.beginPath();

        const xScale = (w - 2 * padding) / 100; // max 100mL
        const yScale = (h - 2 * padding) / 14;  // max pH 14

        this.phLog.forEach((p, i) => {
            const x = padding + p.vol * xScale;
            const y = h - padding - p.ph * yScale;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Current point dot
        const last = this.phLog[this.phLog.length - 1];
        const lx = padding + last.vol * xScale;
        const ly = h - padding - last.ph * yScale;

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fill();
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TitrationSimulation();
});
