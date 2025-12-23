/**
 * RaseLab - Atomic Orbitals Interactive Visualization
 * 3D orbital rendering using Canvas 2D with pseudo-3D projection
 */

// Canvas and context
let canvas, ctx;
let width, height, centerX, centerY;

// View state
let rotationX = 0.5;
let rotationY = 0.3;
let zoom = 1;
let isDragging = false;
let lastMouseX, lastMouseY;

// Current orbital
let currentOrbital = '1s';

// Elements data (first 20)
const elements = [
    { symbol: 'H', name: 'Hydrogen', number: 1 },
    { symbol: 'He', name: 'Helium', number: 2 },
    { symbol: 'Li', name: 'Lithium', number: 3 },
    { symbol: 'Be', name: 'Beryllium', number: 4 },
    { symbol: 'B', name: 'Boron', number: 5 },
    { symbol: 'C', name: 'Carbon', number: 6 },
    { symbol: 'N', name: 'Nitrogen', number: 7 },
    { symbol: 'O', name: 'Oxygen', number: 8 },
    { symbol: 'F', name: 'Fluorine', number: 9 },
    { symbol: 'Ne', name: 'Neon', number: 10 },
    { symbol: 'Na', name: 'Sodium', number: 11 },
    { symbol: 'Mg', name: 'Magnesium', number: 12 },
    { symbol: 'Al', name: 'Aluminum', number: 13 },
    { symbol: 'Si', name: 'Silicon', number: 14 },
    { symbol: 'P', name: 'Phosphorus', number: 15 },
    { symbol: 'S', name: 'Sulfur', number: 16 },
    { symbol: 'Cl', name: 'Chlorine', number: 17 },
    { symbol: 'Ar', name: 'Argon', number: 18 },
    { symbol: 'K', name: 'Potassium', number: 19 },
    { symbol: 'Ca', name: 'Calcium', number: 20 }
];

// Orbital information
const orbitalInfo = {
    '1s': {
        n: 1, l: 0, ml: 0, maxElectrons: 2,
        shape: 'Spherical',
        nodes: '0 radial nodes',
        description: 'The lowest energy orbital. It has spherical symmetry with highest electron density near the nucleus.'
    },
    '2s': {
        n: 2, l: 0, ml: 0, maxElectrons: 2,
        shape: 'Spherical',
        nodes: '1 radial node',
        description: 'A larger spherical orbital than 1s. It has one radial node and electron density is concentrated in two regions.'
    },
    '3s': {
        n: 3, l: 0, ml: 0, maxElectrons: 2,
        shape: 'Spherical',
        nodes: '2 radial nodes',
        description: 'The largest s orbital. It has two radial nodes with electron density in three concentric spherical regions.'
    },
    '2px': {
        n: 2, l: 1, ml: 1, maxElectrons: 2,
        shape: 'Dumbbell',
        nodes: '1 angular node (xy plane)',
        description: 'p orbitals have a dumbbell shape. The 2px orbital extends along the x-axis.'
    },
    '2py': {
        n: 2, l: 1, ml: -1, maxElectrons: 2,
        shape: 'Dumbbell',
        nodes: '1 angular node (xz plane)',
        description: 'p orbitals have a dumbbell shape. The 2py orbital extends along the y-axis.'
    },
    '2pz': {
        n: 2, l: 1, ml: 0, maxElectrons: 2,
        shape: 'Dumbbell',
        nodes: '1 angular node (xy plane)',
        description: 'p orbitals have a dumbbell shape. The 2pz orbital extends along the z-axis.'
    },
    '3px': {
        n: 3, l: 1, ml: 1, maxElectrons: 2,
        shape: 'Dumbbell',
        nodes: '1 radial + 1 angular node',
        description: '3p orbitals are larger than 2p and have one radial node.'
    },
    '3py': {
        n: 3, l: 1, ml: -1, maxElectrons: 2,
        shape: 'Dumbbell',
        nodes: '1 radial + 1 angular node',
        description: '3p orbitals are larger than 2p and have one radial node.'
    },
    '3pz': {
        n: 3, l: 1, ml: 0, maxElectrons: 2,
        shape: 'Dumbbell',
        nodes: '1 radial + 1 angular node',
        description: '3p orbitals are larger than 2p and have one radial node.'
    },
    '3dxy': {
        n: 3, l: 2, ml: -2, maxElectrons: 2,
        shape: 'Cloverleaf (Four-lobed)',
        nodes: '2 angular nodal planes',
        description: 'd orbitals have complex shapes. The dxy orbital has 4 lobes in the xy plane.'
    },
    '3dxz': {
        n: 3, l: 2, ml: -1, maxElectrons: 2,
        shape: 'Cloverleaf (Four-lobed)',
        nodes: '2 angular nodal planes',
        description: 'd orbitals have complex shapes. The dxz orbital has 4 lobes in the xz plane.'
    },
    '3dz2': {
        n: 3, l: 2, ml: 0, maxElectrons: 2,
        shape: 'Dumbbell + Torus',
        nodes: '2 conical nodal surfaces',
        description: 'The dz² orbital has a unique shape: a dumbbell along the z-axis with a torus (ring) in the middle.'
    }
};

// Aufbau order for electron filling
const aufbauOrder = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
const orbitalCapacity = { 's': 2, 'p': 6, 'd': 10, 'f': 14 };

let selectedElement = 1;

document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    initControls();
    initElementSelector();
    updateOrbital('1s');
    animate();
});

function initCanvas() {
    canvas = document.getElementById('orbital-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, 600);
    canvas.width = size;
    canvas.height = size;
    width = canvas.width;
    height = canvas.height;
    centerX = width / 2;
    centerY = height / 2;

    // Mouse events for rotation
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - lastMouseX;
            const deltaY = e.clientY - lastMouseY;
            rotationY += deltaX * 0.01;
            rotationX += deltaY * 0.01;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    });

    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        isDragging = true;
        lastMouseX = e.touches[0].clientX;
        lastMouseY = e.touches[0].clientY;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isDragging) {
            e.preventDefault();
            const deltaX = e.touches[0].clientX - lastMouseX;
            const deltaY = e.touches[0].clientY - lastMouseY;
            rotationY += deltaX * 0.01;
            rotationX += deltaY * 0.01;
            lastMouseX = e.touches[0].clientX;
            lastMouseY = e.touches[0].clientY;
        }
    });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });
}

function initControls() {
    // Orbital buttons
    document.querySelectorAll('.orbital-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.orbital-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateOrbital(btn.dataset.orbital);
        });
    });

    // Zoom controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        zoom = Math.min(zoom * 1.2, 3);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        zoom = Math.max(zoom / 1.2, 0.5);
    });

    document.getElementById('reset-view').addEventListener('click', () => {
        rotationX = 0.5;
        rotationY = 0.3;
        zoom = 1;
    });
}

function initElementSelector() {
    const container = document.getElementById('element-selector');
    container.innerHTML = '';

    elements.forEach(el => {
        const btn = document.createElement('button');
        btn.className = `element-btn p-2 rounded-lg bg-[#282e39] border border-[#3f4756] text-white text-sm font-bold hover:border-teal-400 transition-all ${el.number === 1 ? 'selected' : ''}`;
        btn.textContent = el.symbol;
        btn.title = `${el.name} (${el.number})`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.element-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedElement = el.number;
            updateElectronConfiguration(el.number);
        });
        container.appendChild(btn);
    });

    updateElectronConfiguration(1);
}

function updateOrbital(orbital) {
    currentOrbital = orbital;
    const info = orbitalInfo[orbital];

    // Update quantum numbers
    document.getElementById('quantum-n').textContent = info.n;
    document.getElementById('quantum-l').textContent = info.l;
    document.getElementById('quantum-ml').textContent = info.ml;
    document.getElementById('max-electrons').textContent = info.maxElectrons;

    // Update orbital info
    const infoDiv = document.getElementById('orbital-info');
    infoDiv.innerHTML = `
        <p class="mb-3"><strong class="text-white">${orbital.toUpperCase()} Orbital:</strong> ${info.description}</p>
        <p class="mb-3"><strong class="text-purple-400">Shape:</strong> ${info.shape}</p>
        <p><strong class="text-teal-400">Nodes:</strong> ${info.nodes}</p>
    `;
}

function updateElectronConfiguration(atomicNumber) {
    let remaining = atomicNumber;
    let config = [];
    let diagram = [];

    for (const orbital of aufbauOrder) {
        if (remaining <= 0) break;

        const type = orbital.slice(-1);
        const capacity = orbitalCapacity[type];
        const electrons = Math.min(remaining, capacity);

        if (electrons > 0) {
            config.push(`${orbital}<sup>${electrons}</sup>`);
            diagram.push({ orbital, electrons, capacity });
            remaining -= electrons;
        }
    }

    // Update configuration display
    document.getElementById('config-display').innerHTML = config.join(' ');

    // Update orbital diagram
    const diagramContainer = document.getElementById('orbital-diagram');
    diagramContainer.innerHTML = '';

    diagram.forEach(d => {
        const orbitalDiv = document.createElement('div');
        orbitalDiv.className = 'flex flex-col items-center';

        const boxes = document.createElement('div');
        boxes.className = 'flex gap-1';

        const numBoxes = d.capacity / 2; // Each box holds 2 electrons max

        // Hund's Rule: First fill each box with one electron (up arrow),
        // then go back and add the second electron (down arrow)
        // Example: 3 electrons in p orbital (3 boxes) = ↑ ↑ ↑ (not ↑↓ ↑ empty)
        // Example: 4 electrons in p orbital = ↑↓ ↑ ↑

        for (let i = 0; i < numBoxes; i++) {
            const box = document.createElement('div');
            box.className = 'w-8 h-8 rounded border-2 border-[#3f4756] flex items-center justify-center text-xs gap-0.5';

            // Calculate electrons for this box following Hund's Rule
            // First pass: each box gets 1 electron (up to numBoxes electrons)
            // Second pass: remaining electrons pair up from the first box

            let electronsInBox = 0;

            if (d.electrons > i) {
                // First electron (up arrow) - fill one per box first
                electronsInBox = 1;
            }

            if (d.electrons > numBoxes + i) {
                // Second electron (down arrow) - after all boxes have one
                electronsInBox = 2;
            }

            if (electronsInBox >= 1) {
                const arrow1 = document.createElement('span');
                arrow1.textContent = '↑';
                arrow1.className = 'text-teal-400';
                box.appendChild(arrow1);
            }
            if (electronsInBox >= 2) {
                const arrow2 = document.createElement('span');
                arrow2.textContent = '↓';
                arrow2.className = 'text-pink-400';
                box.appendChild(arrow2);
            }

            boxes.appendChild(box);
        }

        const label = document.createElement('span');
        label.className = 'text-xs text-[#9da6b9] mt-1';
        label.textContent = d.orbital;

        orbitalDiv.appendChild(boxes);
        orbitalDiv.appendChild(label);
        diagramContainer.appendChild(orbitalDiv);
    });
}

// 3D point projection
function project(x, y, z) {
    // Apply rotation
    let rx = x;
    let ry = y * Math.cos(rotationX) - z * Math.sin(rotationX);
    let rz = y * Math.sin(rotationX) + z * Math.cos(rotationX);

    let fx = rx * Math.cos(rotationY) + rz * Math.sin(rotationY);
    let fy = ry;
    let fz = -rx * Math.sin(rotationY) + rz * Math.cos(rotationY);

    // Perspective projection
    const scale = 150 * zoom;
    const perspective = 500;
    const factor = perspective / (perspective + fz);

    return {
        x: centerX + fx * scale * factor,
        y: centerY + fy * scale * factor,
        z: fz,
        factor: factor
    };
}

// Generate orbital points based on probability density
function generateOrbitalPoints(orbital) {
    const points = [];
    const numPoints = 2000;

    for (let i = 0; i < numPoints; i++) {
        let x, y, z, probability;

        // Random point in space
        const r = Math.random() * 3;
        const theta = Math.random() * Math.PI;
        const phi = Math.random() * 2 * Math.PI;

        x = r * Math.sin(theta) * Math.cos(phi);
        y = r * Math.sin(theta) * Math.sin(phi);
        z = r * Math.cos(theta);

        // Calculate probability density based on orbital type
        probability = calculateProbability(orbital, x, y, z, r);

        // Use rejection sampling
        if (Math.random() < probability) {
            points.push({ x, y, z, probability });
        }
    }

    return points;
}

function calculateProbability(orbital, x, y, z, r) {
    let prob = 0;
    const a0 = 1; // Bohr radius (normalized)

    switch (orbital) {
        case '1s':
            prob = Math.exp(-2 * r / a0);
            break;
        case '2s':
            prob = Math.pow(1 - r / (2 * a0), 2) * Math.exp(-r / a0);
            break;
        case '3s':
            prob = Math.pow(1 - 2 * r / (3 * a0) + 2 * r * r / (27 * a0 * a0), 2) * Math.exp(-2 * r / (3 * a0));
            break;
        case '2px':
        case '3px':
            prob = Math.pow(x / r, 2) * r * r * Math.exp(-r / a0);
            break;
        case '2py':
        case '3py':
            prob = Math.pow(y / r, 2) * r * r * Math.exp(-r / a0);
            break;
        case '2pz':
        case '3pz':
            prob = Math.pow(z / r, 2) * r * r * Math.exp(-r / a0);
            break;
        case '3dxy':
            prob = Math.pow(x * y / (r * r), 2) * r * r * Math.exp(-r / (1.5 * a0));
            break;
        case '3dxz':
            prob = Math.pow(x * z / (r * r), 2) * r * r * Math.exp(-r / (1.5 * a0));
            break;
        case '3dz2':
            prob = Math.pow((3 * z * z - r * r) / (r * r), 2) * Math.exp(-r / (1.5 * a0));
            break;
        default:
            prob = Math.exp(-2 * r / a0);
    }

    return Math.min(prob, 1);
}

function getOrbitalColor(orbital) {
    const type = orbital.replace(/[0-9]/g, '').charAt(0);
    switch (type) {
        case 's': return { r: 139, g: 92, b: 246 };  // Purple
        case 'p': return { r: 59, g: 130, b: 246 };  // Blue
        case 'd': return { r: 20, g: 184, b: 166 };  // Teal
        default: return { r: 139, g: 92, b: 246 };
    }
}

function drawAxes() {
    const axisLength = 2;
    const axes = [
        { start: [-axisLength, 0, 0], end: [axisLength, 0, 0], color: '#ef4444', label: 'x' },
        { start: [0, -axisLength, 0], end: [0, axisLength, 0], color: '#22c55e', label: 'y' },
        { start: [0, 0, -axisLength], end: [0, 0, axisLength], color: '#3b82f6', label: 'z' }
    ];

    axes.forEach(axis => {
        const start = project(...axis.start);
        const end = project(...axis.end);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = axis.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = axis.color;
        ctx.font = 'bold 14px Space Grotesk';
        ctx.globalAlpha = 0.8;
        ctx.fillText(axis.label, end.x + 5, end.y + 5);
    });

    ctx.globalAlpha = 1;
}

function drawNucleus() {
    const center = project(0, 0, 0);

    // Glow effect
    const gradient = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 15 * zoom);
    gradient.addColorStop(0, 'rgba(251, 191, 36, 1)');
    gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.5)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0)');

    ctx.beginPath();
    ctx.arc(center.x, center.y, 15 * zoom, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(center.x, center.y, 6 * zoom, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
}

let orbitalPoints = [];
let animationTime = 0;

function animate() {
    ctx.fillStyle = '#1e2330';
    ctx.fillRect(0, 0, width, height);

    // Auto-rotate slowly when not dragging
    if (!isDragging) {
        rotationY += 0.003;
    }

    animationTime += 0.02;

    // Generate new points periodically for animation effect
    if (animationTime % 0.5 < 0.02 || orbitalPoints.length === 0) {
        orbitalPoints = generateOrbitalPoints(currentOrbital);
    }

    // Draw axes first
    drawAxes();

    // Sort points by z for proper depth rendering
    const projectedPoints = orbitalPoints.map(p => ({
        ...project(p.x, p.y, p.z),
        probability: p.probability
    }));
    projectedPoints.sort((a, b) => a.z - b.z);

    // Draw orbital points
    const color = getOrbitalColor(currentOrbital);
    projectedPoints.forEach(p => {
        const size = Math.max(1, 3 * p.factor * zoom);
        const alpha = Math.min(0.8, p.probability * 2) * p.factor;

        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fill();
    });

    // Draw nucleus on top
    drawNucleus();

    requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
    const container = canvas.parentElement;
    const size = Math.min(container.clientWidth, 600);
    canvas.width = size;
    canvas.height = size;
    width = canvas.width;
    height = canvas.height;
    centerX = width / 2;
    centerY = height / 2;
});
