/**
 * Molecule Polarity Simulation
 */

const molecules = {
    H2O: {
        name: 'Water', formula: 'H₂O', polar: true,
        atoms: [
            { el: 'O', x: 0, y: 0, en: 3.44, color: '#ef4444', r: 25 },
            { el: 'H', x: -60, y: 50, en: 2.20, color: '#3b82f6', r: 18 },
            { el: 'H', x: 60, y: 50, en: 2.20, color: '#3b82f6', r: 18 }
        ],
        bonds: [[0, 1], [0, 2]],
        info: 'Bent shape (104.5°). Dipoles don\'t cancel → polar molecule.'
    },
    CO2: {
        name: 'Carbon Dioxide', formula: 'CO₂', polar: false,
        atoms: [
            { el: 'C', x: 0, y: 0, en: 2.55, color: '#6b7280', r: 22 },
            { el: 'O', x: -70, y: 0, en: 3.44, color: '#ef4444', r: 25 },
            { el: 'O', x: 70, y: 0, en: 3.44, color: '#ef4444', r: 25 }
        ],
        bonds: [[0, 1], [0, 2]],
        info: 'Linear shape (180°). Dipoles cancel → nonpolar molecule.'
    },
    NH3: {
        name: 'Ammonia', formula: 'NH₃', polar: true,
        atoms: [
            { el: 'N', x: 0, y: -20, en: 3.04, color: '#3b82f6', r: 24 },
            { el: 'H', x: -50, y: 40, en: 2.20, color: '#9ca3af', r: 16 },
            { el: 'H', x: 0, y: 60, en: 2.20, color: '#9ca3af', r: 16 },
            { el: 'H', x: 50, y: 40, en: 2.20, color: '#9ca3af', r: 16 }
        ],
        bonds: [[0, 1], [0, 2], [0, 3]],
        info: 'Trigonal pyramidal shape. Dipoles don\'t cancel → polar.'
    },
    CH4: {
        name: 'Methane', formula: 'CH₄', polar: false,
        atoms: [
            { el: 'C', x: 0, y: 0, en: 2.55, color: '#6b7280', r: 22 },
            { el: 'H', x: -50, y: -40, en: 2.20, color: '#9ca3af', r: 16 },
            { el: 'H', x: 50, y: -40, en: 2.20, color: '#9ca3af', r: 16 },
            { el: 'H', x: -50, y: 50, en: 2.20, color: '#9ca3af', r: 16 },
            { el: 'H', x: 50, y: 50, en: 2.20, color: '#9ca3af', r: 16 }
        ],
        bonds: [[0, 1], [0, 2], [0, 3], [0, 4]],
        info: 'Tetrahedral shape. Symmetric → dipoles cancel → nonpolar.'
    },
    HF: {
        name: 'Hydrogen Fluoride', formula: 'HF', polar: true,
        atoms: [
            { el: 'H', x: -40, y: 0, en: 2.20, color: '#9ca3af', r: 18 },
            { el: 'F', x: 40, y: 0, en: 3.98, color: '#22c55e', r: 22 }
        ],
        bonds: [[0, 1]],
        info: 'Diatomic. Large EN difference (1.78) → very polar.'
    },
    BF3: {
        name: 'Boron Trifluoride', formula: 'BF₃', polar: false,
        atoms: [
            { el: 'B', x: 0, y: 0, en: 2.04, color: '#f97316', r: 20 },
            { el: 'F', x: 0, y: -60, en: 3.98, color: '#22c55e', r: 20 },
            { el: 'F', x: -52, y: 30, en: 3.98, color: '#22c55e', r: 20 },
            { el: 'F', x: 52, y: 30, en: 3.98, color: '#22c55e', r: 20 }
        ],
        bonds: [[0, 1], [0, 2], [0, 3]],
        info: 'Trigonal planar (120°). Symmetric → nonpolar.'
    }
};

class MoleculePolarity {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dpr = window.devicePixelRatio || 1;
        this.resize();
        this.current = 'H2O';
        this.init();
        this.bindEvents();
        this.animate();
    }

    resize() {
        const r = this.canvas.getBoundingClientRect();
        this.canvas.width = r.width * this.dpr;
        this.canvas.height = r.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.w = r.width; this.h = r.height;
        this.cx = this.w / 2; this.cy = this.h / 2;
    }

    init() { this.updateUI(); }

    updateUI() {
        const mol = molecules[this.current];
        document.getElementById('bond-polarity').textContent = 'Polar';
        document.getElementById('bond-polarity').className = 'text-3xl font-black text-yellow-400';
        document.getElementById('mol-polarity').textContent = mol.polar ? 'Polar' : 'Nonpolar';
        document.getElementById('mol-polarity').className = `text-3xl font-black ${mol.polar ? 'text-yellow-400' : 'text-green-400'}`;

        const enList = document.getElementById('en-list');
        const uniqueEls = [...new Set(mol.atoms.map(a => a.el))];
        enList.innerHTML = uniqueEls.map(el => {
            const atom = mol.atoms.find(a => a.el === el);
            return `<div class="flex justify-between p-2 rounded bg-[#282e39]"><span style="color:${atom.color}">${el}</span><span>${atom.en.toFixed(2)}</span></div>`;
        }).join('');

        document.getElementById('mol-info').innerHTML = `<strong class="text-white">${mol.name}</strong><br>${mol.info}`;
    }

    bindEvents() {
        document.querySelectorAll('.molecule-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.molecule-btn').forEach(b => {
                    b.classList.remove('active'); b.classList.add('bg-[#282e39]');
                });
                btn.classList.add('active'); btn.classList.remove('bg-[#282e39]');
                this.current = btn.dataset.molecule;
                this.updateUI();
            });
        });
        window.addEventListener('resize', () => this.resize());
    }

    draw() {
        const ctx = this.ctx, mol = molecules[this.current];
        ctx.fillStyle = '#1e2330'; ctx.fillRect(0, 0, this.w, this.h);

        // Bonds
        mol.bonds.forEach(([i, j]) => {
            const a1 = mol.atoms[i], a2 = mol.atoms[j];
            const x1 = this.cx + a1.x, y1 = this.cy + a1.y;
            const x2 = this.cx + a2.x, y2 = this.cy + a2.y;

            const grad = ctx.createLinearGradient(x1, y1, x2, y2);
            if (a1.en > a2.en) { grad.addColorStop(0, '#ef4444'); grad.addColorStop(1, '#3b82f6'); }
            else { grad.addColorStop(0, '#3b82f6'); grad.addColorStop(1, '#ef4444'); }

            ctx.strokeStyle = grad; ctx.lineWidth = 8;
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

            // Dipole arrow
            const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
            const ang = Math.atan2(a2.y - a1.y, a2.x - a1.x);
            const dir = a2.en > a1.en ? 1 : -1;
            this.drawArrow(mx, my, ang, 25 * dir, '#fbbf24');
        });

        // Atoms
        mol.atoms.forEach(a => {
            const x = this.cx + a.x, y = this.cy + a.y;
            const g = ctx.createRadialGradient(x, y, 0, x, y, a.r * 1.5);
            g.addColorStop(0, a.color); g.addColorStop(1, 'transparent');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, a.r * 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = a.color; ctx.beginPath(); ctx.arc(x, y, a.r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white'; ctx.font = 'bold 14px Space Grotesk'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(a.el, x, y);
        });

        // Net dipole for polar molecules
        if (mol.polar) {
            let dx = 0, dy = 0;
            mol.bonds.forEach(([i, j]) => {
                const a1 = mol.atoms[i], a2 = mol.atoms[j];
                const diff = a2.en - a1.en;
                dx += (a2.x - a1.x) * diff * 0.5;
                dy += (a2.y - a1.y) * diff * 0.5;
            });
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 5) {
                const ang = Math.atan2(dy, dx);
                this.drawArrow(this.cx, this.cy + 100, ang, 50, '#f59e0b', 4);
                ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px Space Grotesk';
                ctx.fillText('Net Dipole', this.cx, this.cy + 130);
            }
        }
    }

    drawArrow(x, y, ang, len, color, w = 2) {
        const ctx = this.ctx;
        const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
        ctx.strokeStyle = color; ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
    }

    animate() { this.draw(); requestAnimationFrame(() => this.animate()); }
}

document.addEventListener('DOMContentLoaded', () => { new MoleculePolarity('simulation-canvas'); });
