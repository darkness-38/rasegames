const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.querySelector('.background-effects').appendChild(canvas);

canvas.id = 'particle-canvas';
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';

let particlesArray;


canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});


const mouse = {
    x: null,
    y: null,
    radius: 100
}

window.addEventListener('mousemove', (event) => {
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});


class Particle {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.baseY = y;
        this.size = size;
        this.color = color;
        this.density = (Math.random() * 30) + 1;

        this.speedX = (Math.random() * 0.5) - 0.25;
        this.speedY = (Math.random() * 0.5) - 0.25;
    }


    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }


    update() {

        this.baseX += this.speedX;
        this.baseY += this.speedY;


        if (this.baseX > canvas.width || this.baseX < 0) {
            this.speedX = -this.speedX;
        }
        if (this.baseY > canvas.height || this.baseY < 0) {
            this.speedY = -this.speedY;
        }


        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius) {

            this.x -= directionX;
            this.y -= directionY;
        } else {

            if (this.x !== this.baseX) {
                let dx = this.x - this.baseX;
                this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
                let dy = this.y - this.baseY;
                this.y -= dy / 10;
            }
        }

        this.draw();
    }
}


function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;


    const blueColors = ['#4285F4', '#8AB4F8', '#1967D2', '#D2E3FC'];

    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 3) + 1;
        let x = Math.random() * (innerWidth - size * 2 - (size * 2)) + size * 2;
        let y = Math.random() * (innerHeight - size * 2 - (size * 2)) + size * 2;
        let color = blueColors[Math.floor(Math.random() * blueColors.length)];

        particlesArray.push(new Particle(x, y, size, color));
    }
}


function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}


function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) +
                ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));

            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);

                ctx.strokeStyle = 'rgba(66, 133, 244,' + (opacityValue * 0.08) + ')';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}
//a
init();
animate();
