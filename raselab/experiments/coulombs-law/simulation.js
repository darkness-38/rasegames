/**
 * Coulomb's Law Simulation
 * Visualizes electrostatic force between two charges
 */

class CoulombsLawSimulation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // High DPI support
        this.dpr = window.devicePixelRatio || 1;
        this.resize();

        // Coulomb's constant (scaled for visualization)
        this.k = 8.99e9; // N⋅m²/C²

        // Charges
        this.charge1 = { x: 0, y: 0, q: 5, radius: 30 }; // μC
        this.charge2 = { x: 0, y: 0, q: -3, radius: 30 }; // μC

        // Dragging state
        this.dragging = null;
        this.dragOffset = { x: 0, y: 0 };

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
    }

    init() {
        // Position charges
        this.charge1.x = this.width * 0.3;
        this.charge1.y = this.height / 2;
        this.charge2.x = this.width * 0.7;
        this.charge2.y = this.height / 2;

        this.updateUI();
    }

    bindEvents() {
        // Charge sliders
        const charge1Slider = document.getElementById('charge1-slider');
        const charge2Slider = document.getElementById('charge2-slider');

        charge1Slider.addEventListener('input', (e) => {
            this.charge1.q = parseInt(e.target.value);
            this.updateUI();
        });

        charge2Slider.addEventListener('input', (e) => {
            this.charge2.q = parseInt(e.target.value);
            this.updateUI();
        });

        // Mouse events for dragging
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleMouseUp());

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            document.getElementById('charge1-slider').value = 5;
            document.getElementById('charge2-slider').value = -3;
            this.charge1.q = 5;
            this.charge2.q = -3;
            this.init();
        });

        // Resize handler
        window.addEventListener('resize', () => {
            this.resize();
            this.init();
        });
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);

        // Check if clicking on charge1
        const dist1 = Math.hypot(pos.x - this.charge1.x, pos.y - this.charge1.y);
        if (dist1 < this.charge1.radius) {
            this.dragging = this.charge1;
            this.dragOffset = { x: pos.x - this.charge1.x, y: pos.y - this.charge1.y };
            return;
        }

        // Check if clicking on charge2
        const dist2 = Math.hypot(pos.x - this.charge2.x, pos.y - this.charge2.y);
        if (dist2 < this.charge2.radius) {
            this.dragging = this.charge2;
            this.dragOffset = { x: pos.x - this.charge2.x, y: pos.y - this.charge2.y };
        }
    }

    handleMouseMove(e) {
        if (this.dragging) {
            const pos = this.getMousePos(e);
            this.dragging.x = Math.max(this.dragging.radius, Math.min(this.width - this.dragging.radius, pos.x - this.dragOffset.x));
            this.dragging.y = Math.max(this.dragging.radius, Math.min(this.height - this.dragging.radius, pos.y - this.dragOffset.y));
            this.updateUI();
        }
    }

    handleMouseUp() {
        this.dragging = null;
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

    calculateForce() {
        // Distance in meters (scale: 100 pixels = 1 meter)
        const dx = this.charge2.x - this.charge1.x;
        const dy = this.charge2.y - this.charge1.y;
        const distancePixels = Math.hypot(dx, dy);
        const distanceMeters = distancePixels / 100;

        // Charges in Coulombs (μC to C)
        const q1 = this.charge1.q * 1e-6;
        const q2 = this.charge2.q * 1e-6;

        // Coulomb's law: F = k * |q1 * q2| / r²
        const force = this.k * Math.abs(q1 * q2) / (distanceMeters * distanceMeters);

        return {
            magnitude: force,
            distance: distanceMeters,
            attractive: this.charge1.q * this.charge2.q < 0,
            dx, dy
        };
    }

    updateUI() {
        const result = this.calculateForce();

        // Force display
        const forceDisplay = document.getElementById('force-display');
        if (result.magnitude > 1e6) {
            forceDisplay.textContent = `${(result.magnitude / 1e6).toFixed(2)} MN`;
        } else if (result.magnitude > 1e3) {
            forceDisplay.textContent = `${(result.magnitude / 1e3).toFixed(2)} kN`;
        } else {
            forceDisplay.textContent = `${result.magnitude.toFixed(2)} N`;
        }

        // Distance display
        document.getElementById('distance-display').textContent = `${result.distance.toFixed(2)} m`;

        // Charge displays
        const q1 = this.charge1.q;
        const q2 = this.charge2.q;
        document.getElementById('charge1-display').textContent = `${q1 > 0 ? '+' : ''}${q1} μC`;
        document.getElementById('charge2-display').textContent = `${q2 > 0 ? '+' : ''}${q2} μC`;
        document.getElementById('charge1-display').className = `text-center text-2xl font-bold mt-2 ${q1 >= 0 ? 'text-red-400' : 'text-blue-400'}`;
        document.getElementById('charge2-display').className = `text-center text-2xl font-bold mt-2 ${q2 >= 0 ? 'text-red-400' : 'text-blue-400'}`;

        // Force type
        const forceType = document.getElementById('force-type');
        if (result.attractive) {
            forceType.innerHTML = `
                <div class="text-2xl font-bold text-green-400 mb-2">ATTRACTIVE</div>
                <p class="text-[#9da6b9] text-sm">Opposite charges attract</p>
            `;
        } else {
            forceType.innerHTML = `
                <div class="text-2xl font-bold text-red-400 mb-2">REPULSIVE</div>
                <p class="text-[#9da6b9] text-sm">Like charges repel</p>
            `;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#1e2330';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.ctx.strokeStyle = '#282e39';
        this.ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        const result = this.calculateForce();

        // Draw electric field lines (simplified)
        const numLines = 8;
        for (let i = 0; i < numLines; i++) {
            const angle = (i / numLines) * Math.PI * 2;
            this.drawFieldLine(this.charge1, angle, this.charge1.q > 0);
            this.drawFieldLine(this.charge2, angle, this.charge2.q > 0);
        }

        // Draw force arrows
        const arrowLength = Math.min(100, result.magnitude / 1000);
        const angle = Math.atan2(result.dy, result.dx);

        if (result.attractive) {
            // Arrows pointing toward each other
            this.drawArrow(this.charge1.x, this.charge1.y, angle, arrowLength, '#22c55e');
            this.drawArrow(this.charge2.x, this.charge2.y, angle + Math.PI, arrowLength, '#22c55e');
        } else {
            // Arrows pointing away from each other
            this.drawArrow(this.charge1.x, this.charge1.y, angle + Math.PI, arrowLength, '#ef4444');
            this.drawArrow(this.charge2.x, this.charge2.y, angle, arrowLength, '#ef4444');
        }

        // Draw charges
        this.drawCharge(this.charge1);
        this.drawCharge(this.charge2);
    }

    drawFieldLine(charge, startAngle, outward) {
        const steps = 50;
        const stepSize = 10;

        this.ctx.strokeStyle = charge.q > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        let x = charge.x + Math.cos(startAngle) * charge.radius;
        let y = charge.y + Math.sin(startAngle) * charge.radius;
        this.ctx.moveTo(x, y);

        for (let i = 0; i < steps; i++) {
            // Calculate field direction (simplified)
            let fx = 0, fy = 0;

            [this.charge1, this.charge2].forEach(c => {
                const dx = x - c.x;
                const dy = y - c.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 5) {
                    const strength = c.q / (dist * dist);
                    fx += strength * dx / dist;
                    fy += strength * dy / dist;
                }
            });

            const fMag = Math.hypot(fx, fy);
            if (fMag > 0) {
                x += (fx / fMag) * stepSize * (outward ? 1 : -1);
                y += (fy / fMag) * stepSize * (outward ? 1 : -1);
            }

            if (x < 0 || x > this.width || y < 0 || y > this.height) break;

            this.ctx.lineTo(x, y);
        }

        this.ctx.stroke();
    }

    drawArrow(x, y, angle, length, color) {
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Arrow head
        const headLength = 15;
        const headAngle = 0.5;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - headLength * Math.cos(angle - headAngle), endY - headLength * Math.sin(angle - headAngle));
        this.ctx.lineTo(endX - headLength * Math.cos(angle + headAngle), endY - headLength * Math.sin(angle + headAngle));
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCharge(charge) {
        const isPositive = charge.q >= 0;
        const color = isPositive ? '#ef4444' : '#3b82f6';

        // Glow
        const gradient = this.ctx.createRadialGradient(charge.x, charge.y, 0, charge.x, charge.y, charge.radius * 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(charge.x, charge.y, charge.radius * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(charge.x, charge.y, charge.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Sign
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 24px Space Grotesk';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(isPositive ? '+' : '−', charge.x, charge.y);
    }

    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize simulation
document.addEventListener('DOMContentLoaded', () => {
    new CoulombsLawSimulation('simulation-canvas');
});
