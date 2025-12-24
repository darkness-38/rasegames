/**
 * Balancing Chemical Equations Simulation
 * Interactive equation balancer with visual feedback
 */

const equations = [
    {
        name: "Hydrogen + Oxygen → Water",
        reactants: [
            { formula: "H₂", atoms: { H: 2 } },
            { formula: "O₂", atoms: { O: 2 } }
        ],
        products: [
            { formula: "H₂O", atoms: { H: 2, O: 1 } }
        ],
        answer: { reactants: [2, 1], products: [2] }
    },
    {
        name: "Methane Combustion",
        reactants: [
            { formula: "CH₄", atoms: { C: 1, H: 4 } },
            { formula: "O₂", atoms: { O: 2 } }
        ],
        products: [
            { formula: "CO₂", atoms: { C: 1, O: 2 } },
            { formula: "H₂O", atoms: { H: 2, O: 1 } }
        ],
        answer: { reactants: [1, 2], products: [1, 2] }
    },
    {
        name: "Iron + Oxygen → Rust",
        reactants: [
            { formula: "Fe", atoms: { Fe: 1 } },
            { formula: "O₂", atoms: { O: 2 } }
        ],
        products: [
            { formula: "Fe₂O₃", atoms: { Fe: 2, O: 3 } }
        ],
        answer: { reactants: [4, 3], products: [2] }
    },
    {
        name: "Nitrogen + Hydrogen → Ammonia",
        reactants: [
            { formula: "N₂", atoms: { N: 2 } },
            { formula: "H₂", atoms: { H: 2 } }
        ],
        products: [
            { formula: "NH₃", atoms: { N: 1, H: 3 } }
        ],
        answer: { reactants: [1, 3], products: [2] }
    },
    {
        name: "Sodium + Chlorine → Salt",
        reactants: [
            { formula: "Na", atoms: { Na: 1 } },
            { formula: "Cl₂", atoms: { Cl: 2 } }
        ],
        products: [
            { formula: "NaCl", atoms: { Na: 1, Cl: 1 } }
        ],
        answer: { reactants: [2, 1], products: [2] }
    },
    {
        name: "Photosynthesis",
        reactants: [
            { formula: "CO₂", atoms: { C: 1, O: 2 } },
            { formula: "H₂O", atoms: { H: 2, O: 1 } }
        ],
        products: [
            { formula: "C₆H₁₂O₆", atoms: { C: 6, H: 12, O: 6 } },
            { formula: "O₂", atoms: { O: 2 } }
        ],
        answer: { reactants: [6, 6], products: [1, 6] }
    },
    {
        name: "Sulfuric Acid + Sodium Hydroxide",
        reactants: [
            { formula: "H₂SO₄", atoms: { H: 2, S: 1, O: 4 } },
            { formula: "NaOH", atoms: { Na: 1, O: 1, H: 1 } }
        ],
        products: [
            { formula: "Na₂SO₄", atoms: { Na: 2, S: 1, O: 4 } },
            { formula: "H₂O", atoms: { H: 2, O: 1 } }
        ],
        answer: { reactants: [1, 2], products: [1, 2] }
    },
    {
        name: "Zinc + Hydrochloric Acid",
        reactants: [
            { formula: "Zn", atoms: { Zn: 1 } },
            { formula: "HCl", atoms: { H: 1, Cl: 1 } }
        ],
        products: [
            { formula: "ZnCl₂", atoms: { Zn: 1, Cl: 2 } },
            { formula: "H₂", atoms: { H: 2 } }
        ],
        answer: { reactants: [1, 2], products: [1, 1] }
    }
];

class BalancingEquationsSimulation {
    constructor() {
        this.currentEquationIndex = 0;
        this.coefficients = { reactants: [], products: [] };
        this.init();
        this.bindEvents();
    }

    init() {
        // Populate equation selector
        const select = document.getElementById('equation-select');
        select.innerHTML = equations.map((eq, i) =>
            `<option value="${i}">${eq.name}</option>`
        ).join('');

        this.loadEquation(0);
    }

    loadEquation(index) {
        this.currentEquationIndex = index;
        const equation = equations[index];

        // Reset coefficients to 1
        this.coefficients = {
            reactants: equation.reactants.map(() => 1),
            products: equation.products.map(() => 1)
        };

        this.renderEquation();
        this.updateAtomCounts();
        this.checkBalance(false);
    }

    renderEquation() {
        const equation = equations[this.currentEquationIndex];
        const container = document.getElementById('equation-container');

        let html = '<div class="flex flex-wrap items-center justify-center gap-4 text-2xl font-bold">';

        // Reactants
        equation.reactants.forEach((compound, i) => {
            if (i > 0) html += '<span class="text-[#9da6b9]">+</span>';
            html += this.renderCompound('reactants', i, compound);
        });

        // Arrow
        html += '<span class="text-yellow-400 px-4">→</span>';

        // Products
        equation.products.forEach((compound, i) => {
            if (i > 0) html += '<span class="text-[#9da6b9]">+</span>';
            html += this.renderCompound('products', i, compound);
        });

        html += '</div>';
        container.innerHTML = html;

        // Bind coefficient buttons
        this.bindCoefficientButtons();
    }

    renderCompound(side, index, compound) {
        const coef = this.coefficients[side][index];
        return `
            <div class="flex items-center gap-2">
                <div class="flex flex-col gap-1">
                    <button class="coefficient-btn p-1 rounded bg-[#282e39] hover:bg-[#3f4756] text-white text-sm" data-side="${side}" data-index="${index}" data-action="up">
                        <span class="material-symbols-outlined text-sm">expand_less</span>
                    </button>
                    <div class="text-center text-xl font-bold text-primary w-10" id="coef-${side}-${index}">${coef}</div>
                    <button class="coefficient-btn p-1 rounded bg-[#282e39] hover:bg-[#3f4756] text-white text-sm" data-side="${side}" data-index="${index}" data-action="down">
                        <span class="material-symbols-outlined text-sm">expand_more</span>
                    </button>
                </div>
                <span class="text-white">${compound.formula}</span>
            </div>
        `;
    }

    bindCoefficientButtons() {
        document.querySelectorAll('.coefficient-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const side = btn.dataset.side;
                const index = parseInt(btn.dataset.index);
                const action = btn.dataset.action;

                if (action === 'up') {
                    this.coefficients[side][index] = Math.min(10, this.coefficients[side][index] + 1);
                } else {
                    this.coefficients[side][index] = Math.max(1, this.coefficients[side][index] - 1);
                }

                document.getElementById(`coef-${side}-${index}`).textContent = this.coefficients[side][index];
                this.updateAtomCounts();
                this.checkBalance(false);
            });
        });
    }

    updateAtomCounts() {
        const equation = equations[this.currentEquationIndex];

        // Calculate reactant atoms
        const reactantAtoms = {};
        equation.reactants.forEach((compound, i) => {
            const coef = this.coefficients.reactants[i];
            for (const [atom, count] of Object.entries(compound.atoms)) {
                reactantAtoms[atom] = (reactantAtoms[atom] || 0) + count * coef;
            }
        });

        // Calculate product atoms
        const productAtoms = {};
        equation.products.forEach((compound, i) => {
            const coef = this.coefficients.products[i];
            for (const [atom, count] of Object.entries(compound.atoms)) {
                productAtoms[atom] = (productAtoms[atom] || 0) + count * coef;
            }
        });

        // Render reactant counts
        const reactantDiv = document.getElementById('reactant-counts');
        reactantDiv.innerHTML = Object.entries(reactantAtoms).map(([atom, count]) => {
            const productCount = productAtoms[atom] || 0;
            const isBalanced = count === productCount;
            const color = isBalanced ? 'text-green-400' : 'text-red-400';
            return `
                <div class="flex justify-between items-center p-3 rounded-lg bg-[#282e39]">
                    <span class="font-bold text-white">${atom}</span>
                    <span class="font-bold ${color}">${count}</span>
                </div>
            `;
        }).join('');

        // Render product counts
        const productDiv = document.getElementById('product-counts');
        productDiv.innerHTML = Object.entries(productAtoms).map(([atom, count]) => {
            const reactantCount = reactantAtoms[atom] || 0;
            const isBalanced = count === reactantCount;
            const color = isBalanced ? 'text-green-400' : 'text-red-400';
            return `
                <div class="flex justify-between items-center p-3 rounded-lg bg-[#282e39]">
                    <span class="font-bold text-white">${atom}</span>
                    <span class="font-bold ${color}">${count}</span>
                </div>
            `;
        }).join('');

        return { reactantAtoms, productAtoms };
    }

    checkBalance(showFeedback = true) {
        const { reactantAtoms, productAtoms } = this.updateAtomCounts();

        // Check if all atoms are balanced
        const allAtoms = new Set([...Object.keys(reactantAtoms), ...Object.keys(productAtoms)]);
        let isBalanced = true;

        for (const atom of allAtoms) {
            if ((reactantAtoms[atom] || 0) !== (productAtoms[atom] || 0)) {
                isBalanced = false;
                break;
            }
        }

        // Update status display
        const statusContainer = document.getElementById('balance-status');
        const statusText = document.getElementById('status-text');
        const statusHint = document.getElementById('status-hint');

        if (isBalanced) {
            statusContainer.className = 'mb-8 p-6 rounded-2xl border-2 transition-all bg-green-500/10 border-green-500';
            statusText.className = 'text-3xl font-black mb-2 text-green-400';
            statusText.textContent = '✓ BALANCED!';
            statusHint.textContent = 'The equation is balanced. Mass is conserved!';

            if (showFeedback) {
                statusContainer.classList.add('balanced');
                setTimeout(() => statusContainer.classList.remove('balanced'), 500);
            }
        } else {
            statusContainer.className = 'mb-8 p-6 rounded-2xl border-2 transition-all bg-red-500/10 border-red-500';
            statusText.className = 'text-3xl font-black mb-2 text-red-400';
            statusText.textContent = '✗ NOT BALANCED';
            statusHint.textContent = 'Adjust coefficients to make atom counts equal on both sides.';
        }

        return isBalanced;
    }

    bindEvents() {
        // Equation selector
        document.getElementById('equation-select').addEventListener('change', (e) => {
            this.loadEquation(parseInt(e.target.value));
        });

        // Check button
        document.getElementById('check-btn').addEventListener('click', () => {
            this.checkBalance(true);
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.loadEquation(this.currentEquationIndex);
        });

        // Next button
        document.getElementById('next-btn').addEventListener('click', () => {
            const nextIndex = (this.currentEquationIndex + 1) % equations.length;
            document.getElementById('equation-select').value = nextIndex;
            this.loadEquation(nextIndex);
        });
    }
}

// Initialize simulation
document.addEventListener('DOMContentLoaded', () => {
    new BalancingEquationsSimulation();
});
