




class Ninja extends Character {
    constructor(options = {}) {
        super({
            name: 'Phantom Ninja',
            type: 'ninja',
            speed: 8,
            jumpForce: -16,
            maxHealth: 900,
            defense: 1.2,
            color: '#7209b7',
            secondaryColor: '#3a0ca3',
            ...options
        });


        this.attacks = {
            light: {
                damage: 25,
                knockback: 3,
                duration: 8,
                cooldown: 12,
                hitboxWidth: 55,
                hitboxHeight: 35,
                energyGain: 4
            },
            heavy: {
                damage: 55,
                knockback: 10,
                duration: 20,
                cooldown: 30,
                hitboxWidth: 80,
                hitboxHeight: 45,
                energyGain: 8
            },
            special: {
                damage: 40,
                knockback: 6,
                duration: 25,
                cooldown: 45,
                hitboxWidth: 40,
                hitboxHeight: 30,
                energyCost: 20,
                energyGain: 0,
                isProjectile: true
            },
            ultimate: {
                damage: 180,
                knockback: 30,
                duration: 50,
                cooldown: 90,
                hitboxWidth: 200,
                hitboxHeight: 150,
                energyCost: 100,
                energyGain: 0
            }
        };


        this.canTeleport = true;
        this.teleportCooldown = 0;
        this.shadowClones = [];
    }

    handleInput(input, opponent) {

        if (this.teleportCooldown > 0) this.teleportCooldown--;

        super.handleInput(input, opponent);
    }

    startAttack(type) {
        if (type === 'special') {

            this.fireProjectile({
                width: 25,
                height: 25,
                speed: 15,
                damage: 40,
                knockback: 6,
                life: 90,
                color: '#9d4edd'
            });
            this.attackCooldown = this.attacks.special.cooldown;
            this.energy -= this.attacks.special.energyCost;
            return;
        }

        if (type === 'ultimate') {

            this.startShadowCloneAttack();
            return;
        }

        super.startAttack(type);
    }

    startShadowCloneAttack() {
        if (this.energy < 100) return;

        this.energy = 0;
        this.isAttacking = true;
        this.currentAttack = 'ultimate';
        this.attackTimer = 50;
        this.attackCooldown = 90;


        this.shadowClones = [
            { x: this.x - 100, y: this.y - 50, alpha: 0.7, delay: 0 },
            { x: this.x + 100, y: this.y - 50, alpha: 0.5, delay: 5 },
            { x: this.x, y: this.y - 100, alpha: 0.6, delay: 10 }
        ];
    }

    update(input, opponent) {
        super.update(input, opponent);


        for (let i = this.shadowClones.length - 1; i >= 0; i--) {
            const clone = this.shadowClones[i];
            clone.delay--;

            if (clone.delay <= 0) {
                clone.x += (opponent.x - clone.x) * 0.3;
                clone.y += (opponent.y - clone.y) * 0.3;
                clone.alpha -= 0.05;


                if (Math.abs(clone.x - opponent.x) < 50 && Math.abs(clone.y - opponent.y) < 50) {
                    opponent.takeDamage(60, 10, this);
                    this.shadowClones.splice(i, 1);
                } else if (clone.alpha <= 0) {
                    this.shadowClones.splice(i, 1);
                }
            }
        }
    }

    draw(ctx) {

        for (const clone of this.shadowClones) {
            ctx.save();
            ctx.globalAlpha = clone.alpha;
            ctx.translate(clone.x + this.width / 2, clone.y + this.height / 2);
            this.drawNinjaBody(ctx, true);
            ctx.restore();
        }

        ctx.save();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.direction, 1);


        const shadowScale = this.isGrounded ? 1 : 0.4;
        ctx.fillStyle = 'rgba(114, 9, 183, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 + 5, this.width / 2 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();


        switch (this.state) {
            case 'hitstun':
                this.drawNinjaHit(ctx);
                break;
            case 'block':
            case 'blockstun':
                this.drawNinjaBlock(ctx);
                break;
            case 'crouch':
                this.drawNinjaCrouch(ctx);
                break;
            case 'walk':
                this.drawNinjaWalk(ctx);
                break;
            case 'jump':
                this.drawNinjaJump(ctx);
                break;
            case 'fall':
                this.drawNinjaFall(ctx);
                break;
            case 'attack_light':
            case 'attack_heavy':
            case 'attack_special':
            case 'attack_ultimate':
                this.drawNinjaAttack(ctx);
                break;
            default:
                this.drawNinjaBody(ctx, false);
        }

        ctx.restore();

        this.drawProjectiles(ctx);
    }

    drawNinjaBody(ctx, isClone) {
        const isAttacking = this.state.startsWith('attack_');
        const legOffset = isClone ? 0 : Math.sin(this.animTimer * 0.2) * (this.state === 'walk' ? 8 : 0);


        if (!isClone) {
            const scarfWave1 = 0; // Disabled scarf animation
            const scarfWave2 = 0;


            ctx.fillStyle = '#9d4edd';
            ctx.beginPath();
            ctx.moveTo(-12, -48);
            ctx.quadraticCurveTo(-35 + scarfWave1 * 15, -35, -55 + scarfWave1 * 20, -20);
            ctx.quadraticCurveTo(-60 + scarfWave2 * 25, 0, -50 + scarfWave1 * 15, 20);
            ctx.lineTo(-45 + scarfWave1 * 12, 15);
            ctx.quadraticCurveTo(-50 + scarfWave2 * 20, -5, -45 + scarfWave1 * 15, -25);
            ctx.quadraticCurveTo(-30 + scarfWave1 * 10, -38, -15, -45);
            ctx.closePath();
            ctx.fill();


            ctx.fillStyle = '#b366e6';
            ctx.beginPath();
            ctx.moveTo(-14, -46);
            ctx.quadraticCurveTo(-32 + scarfWave1 * 12, -33, -48 + scarfWave1 * 18, -18);
            ctx.lineTo(-50 + scarfWave1 * 16, -22);
            ctx.quadraticCurveTo(-34 + scarfWave1 * 10, -36, -16, -44);
            ctx.closePath();
            ctx.fill();


            ctx.fillStyle = '#7a29b8';
            ctx.beginPath();
            ctx.moveTo(-50 + scarfWave1 * 18, -15);
            ctx.quadraticCurveTo(-55 + scarfWave2 * 22, 5, -48 + scarfWave1 * 14, 18);
            ctx.lineTo(-46 + scarfWave1 * 12, 12);
            ctx.quadraticCurveTo(-50 + scarfWave2 * 18, 0, -47 + scarfWave1 * 15, -12);
            ctx.closePath();
            ctx.fill();
        }



        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-16 + legOffset, 26, 14, 50, 5);
        ctx.fill();

        ctx.strokeStyle = '#2a0844';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(-16 + legOffset, 32 + i * 8);
            ctx.lineTo(-2 + legOffset, 34 + i * 8);
            ctx.stroke();
        }

        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(-14 + legOffset, 45, 10, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#5a1cc3';
        ctx.beginPath();
        ctx.roundRect(-12 + legOffset, 47, 4, 14, 2);
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(2 - legOffset, 26, 14, 50, 5);
        ctx.fill();
        ctx.strokeStyle = '#2a0844';
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(2 - legOffset, 32 + i * 8);
            ctx.lineTo(16 - legOffset, 34 + i * 8);
            ctx.stroke();
        }
        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(4 - legOffset, 45, 10, 18, 3);
        ctx.fill();
        ctx.fillStyle = '#5a1cc3';
        ctx.beginPath();
        ctx.roundRect(6 - legOffset, 47, 4, 14, 2);
        ctx.fill();


        ctx.fillStyle = '#0a0015';
        ctx.beginPath();
        ctx.roundRect(-18 + legOffset, 70, 18, 10, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(0 - legOffset, 70, 18, 10, 3);
        ctx.fill();

        ctx.strokeStyle = '#1a0533';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-9 + legOffset, 70);
        ctx.lineTo(-9 + legOffset, 80);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(9 - legOffset, 70);
        ctx.lineTo(9 - legOffset, 80);
        ctx.stroke();



        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-27, -38, 54, 68, 10);
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-24, -35, 48, 62, 8);
        ctx.fill();


        const giGrad = ctx.createLinearGradient(-24, -35, 24, 27);
        giGrad.addColorStop(0, 'rgba(180, 100, 255, 0.2)');
        giGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        giGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = giGrad;
        ctx.beginPath();
        ctx.roundRect(-24, -35, 48, 62, 8);
        ctx.fill();


        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-18, -30);
        ctx.lineTo(0, -18);
        ctx.lineTo(18, -30);
        ctx.lineTo(18, 18);
        ctx.lineTo(-18, 18);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#4a1cb3';
        ctx.beginPath();
        ctx.moveTo(-15, -27);
        ctx.lineTo(-5, -20);
        ctx.lineTo(-5, 15);
        ctx.lineTo(-15, 15);
        ctx.closePath();
        ctx.fill();


        ctx.strokeStyle = '#5a0ca3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-20, -25);
        ctx.lineTo(20, 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(20, -25);
        ctx.lineTo(-20, 5);
        ctx.stroke();


        ctx.fillStyle = '#2a0844';
        ctx.beginPath();
        ctx.roundRect(-25, 18, 50, 10, 3);
        ctx.fill();


        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.roundRect(-6, 19, 12, 8, 2);
        ctx.fill();
        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.arc(0, 23, 3, 0, Math.PI * 2);
        ctx.fill();


        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = '#1a0533';
            ctx.beginPath();
            ctx.roundRect(-22 + i * 8, 20, 5, 6, 1);
            ctx.fill();

            ctx.fillStyle = '#4a3520';
            ctx.beginPath();
            ctx.roundRect(-21 + i * 8, 21, 3, 4, 1);
            ctx.fill();
        }



        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-35, -20, 12, 38, 5);
        ctx.fill();

        ctx.strokeStyle = '#1a0533';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-35, -15 + i * 7);
            ctx.lineTo(-23, -13 + i * 7);
            ctx.stroke();
        }

        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(-34, -5, 10, 15, 3);
        ctx.fill();

        ctx.fillStyle = '#e6c8a0';
        ctx.beginPath();
        ctx.roundRect(-34, 16, 10, 10, 4);
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(23, -20, 12, 38, 5);
        ctx.fill();
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(23, -15 + i * 7);
            ctx.lineTo(35, -13 + i * 7);
            ctx.stroke();
        }
        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(24, -5, 10, 15, 3);
        ctx.fill();
        ctx.fillStyle = '#e6c8a0';
        ctx.beginPath();
        ctx.roundRect(24, 16, 10, 10, 4);
        ctx.fill();


        ctx.save();
        ctx.translate(-5, -10);
        ctx.rotate(-0.4);

        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-4, -50, 8, 70, 3);
        ctx.fill();

        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.roundRect(-3, -45, 6, 3, 1);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-3, -30, 6, 3, 1);
        ctx.fill();

        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.roundRect(-3, -65, 6, 18, 2);
        ctx.fill();

        ctx.strokeStyle = '#9d4edd';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-3, -62 + i * 4);
            ctx.lineTo(3, -60 + i * 4);
            ctx.stroke();
        }

        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.ellipse(0, -48, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();



        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -52, 20, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#2a0844';
        ctx.beginPath();
        ctx.arc(0, -52, 17, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(-16, -68, 32, 10, 3);
        ctx.fill();

        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-12, -66, 24, 6, 2);
        ctx.fill();

        ctx.strokeStyle = '#1a0533';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -63);
        ctx.lineTo(0, -66);
        ctx.lineTo(4, -63);
        ctx.stroke();


        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = isAttacking ? 25 : 15;
        ctx.beginPath();
        ctx.ellipse(-7, -54, 6, 4, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(7, -54, 6, 4, 0.15, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ff00ff';
        ctx.beginPath();
        ctx.arc(-7, -54, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(7, -54, 2.5, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-8, -55, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -55, 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;


        if (isAttacking && !isClone) {
            const attack = this.attacks[this.currentAttack];
            const progress = 1 - (this.attackTimer / attack?.duration || 0);
            const slashAngle = progress * Math.PI * 1.5;


            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(30, -10, 50, slashAngle - 0.5, slashAngle + 0.5);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }


        if (this.state === 'hitstun' && !isClone) {
            ctx.strokeStyle = '#ff4444';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(0, 0, 50, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }

    drawProjectiles(ctx) {
        for (const proj of this.projectiles) {
            ctx.save();
            ctx.translate(proj.x + proj.width / 2, proj.y + proj.height / 2);


            ctx.rotate(this.animTimer * 0.3);

            ctx.fillStyle = '#c0c0c0';
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 15;


            for (let i = 0; i < 4; i++) {
                ctx.save();
                ctx.rotate(i * Math.PI / 2);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-5, -proj.width / 2);
                ctx.lineTo(0, -proj.width / 2 - 3);
                ctx.lineTo(5, -proj.width / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }


            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    drawNinjaWalk(ctx) {
        const cycle = this.animTimer * 0.2;
        const legSwing = Math.sin(cycle) * 20;
        const armSwing = Math.sin(cycle) * 0.4;
        const bodyBob = Math.abs(Math.sin(cycle)) * 3;


        const scarfWave = Math.sin(cycle * 0.6) * 12;
        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-12, -48 + bodyBob);
        ctx.quadraticCurveTo(-40 + scarfWave, -30 + bodyBob, -60 + scarfWave, -10 + bodyBob);
        ctx.quadraticCurveTo(-55 + scarfWave, 10 + bodyBob, -45, 25);
        ctx.lineTo(-40, 20);
        ctx.quadraticCurveTo(-45 + scarfWave * 0.5, 5 + bodyBob, -50 + scarfWave * 0.7, -15 + bodyBob);
        ctx.quadraticCurveTo(-35 + scarfWave * 0.5, -35 + bodyBob, -15, -45 + bodyBob);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.save();
        ctx.translate(-8, 28 + bodyBob);
        ctx.rotate(legSwing * 0.03);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 48, 5);
        ctx.fill();
        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(-6, 20, 12, 15, 3);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#1a0533';
        ctx.save();
        ctx.translate(8, 28 + bodyBob);
        ctx.rotate(-legSwing * 0.03);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 48, 5);
        ctx.fill();
        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(-6, 20, 12, 15, 3);
        ctx.fill();
        ctx.restore();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-24, -35 + bodyBob, 48, 62, 8);
        ctx.fill();


        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-18, -30 + bodyBob);
        ctx.lineTo(0, -20 + bodyBob);
        ctx.lineTo(18, -30 + bodyBob);
        ctx.lineTo(18, 15 + bodyBob);
        ctx.lineTo(-18, 15 + bodyBob);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(-28, -18 + bodyBob);
        ctx.rotate(armSwing);
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 35, 5);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(28, -18 + bodyBob);
        ctx.rotate(-armSwing);
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 35, 5);
        ctx.fill();
        ctx.restore();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -50 + bodyBob, 18, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-6, -52 + bodyBob, 5, 3, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -52 + bodyBob, 5, 3, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;


        ctx.strokeStyle = 'rgba(157, 78, 221, 0.4)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(-40 - i * 10, -20 + i * 15 + bodyBob);
            ctx.lineTo(-55 - i * 10, -20 + i * 15 + bodyBob);
            ctx.stroke();
        }
    }

    drawNinjaJump(ctx) {

        const wave = Math.sin(this.animTimer * 0.15) * 8;
        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-12, -45);
        ctx.quadraticCurveTo(-45 + wave, 0, -50 + wave, 50);
        ctx.lineTo(-42 + wave, 45);
        ctx.quadraticCurveTo(-40 + wave * 0.5, -5, -15, -42);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.save();
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.roundRect(-18, 15, 14, 42, 5);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.roundRect(4, 15, 14, 42, 5);
        ctx.fill();
        ctx.restore();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-22, -40, 44, 58, 8);
        ctx.fill();


        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-16, -35);
        ctx.lineTo(0, -25);
        ctx.lineTo(16, -35);
        ctx.lineTo(16, 10);
        ctx.lineTo(-16, 10);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.save();
        ctx.translate(-25, -30);
        ctx.rotate(-1);
        ctx.beginPath();
        ctx.roundRect(-5, 0, 12, 38, 5);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(25, -30);
        ctx.rotate(1);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 12, 38, 5);
        ctx.fill();
        ctx.restore();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -55, 18, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(-6, -56, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -56, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;


        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#9d4edd';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 70);
        ctx.lineTo(0, 100);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawNinjaFall(ctx) {
        const wave = Math.sin(this.animTimer * 0.2) * 5;


        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-12, -42);
        ctx.quadraticCurveTo(-50 + wave, -60, -55 + wave, -90);
        ctx.lineTo(-45 + wave, -85);
        ctx.quadraticCurveTo(-42 + wave * 0.5, -55, -15, -40);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.save();
        ctx.rotate(-0.5);
        ctx.beginPath();
        ctx.roundRect(-20, 12, 14, 45, 5);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.5);
        ctx.beginPath();
        ctx.roundRect(6, 12, 14, 45, 5);
        ctx.fill();
        ctx.restore();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-22, -35, 44, 55, 8);
        ctx.fill();


        ctx.save();
        ctx.translate(-25, -15);
        ctx.rotate(-0.6);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-5, 0, 12, 35, 5);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(25, -15);
        ctx.rotate(0.6);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 12, 35, 5);
        ctx.fill();
        ctx.restore();


        ctx.save();
        ctx.rotate(0.15);
        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -50, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-6, -48, 5, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -48, 5, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();


        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-25 + i * 18, -70);
            ctx.lineTo(-25 + i * 18, -50);
            ctx.stroke();
        }
    }

    drawNinjaHit(ctx) {
        const flash = Math.floor(this.animTimer / 2) % 2 === 0;
        const shake = Math.sin(this.animTimer * 0.6) * 6;

        ctx.save();
        ctx.translate(shake, 0);
        ctx.rotate(0.25);


        ctx.fillStyle = flash ? '#ffaaff' : '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-10, -40);
        ctx.quadraticCurveTo(-35, -20, -30, 30);
        ctx.lineTo(-25, 25);
        ctx.quadraticCurveTo(-28, -15, -12, -38);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.roundRect(-25, -32, 50, 60, 8);
        ctx.fill();


        ctx.fillStyle = flash ? '#aaaaaa' : '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-20, 25, 14, 45, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(8, 30, 14, 42, 5);
        ctx.fill();


        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.roundRect(-38, -5, 12, 32, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(28, -15, 12, 32, 5);
        ctx.fill();

        ctx.restore();


        ctx.save();
        ctx.translate(-8 + shake, -48);
        ctx.rotate(-0.3);

        ctx.fillStyle = flash ? '#ffffff' : '#1a0533';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();


        ctx.strokeStyle = flash ? '#ff00ff' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-9, -3);
        ctx.lineTo(-3, 3);
        ctx.moveTo(-3, -3);
        ctx.lineTo(-9, 3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(3, -3);
        ctx.lineTo(9, 3);
        ctx.moveTo(9, -3);
        ctx.lineTo(3, 3);
        ctx.stroke();

        ctx.restore();


        ctx.save();
        ctx.translate(15, -15);
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + this.animTimer * 0.2;
            const dist = 25 + Math.sin(this.animTimer * 0.4 + i) * 8;
            ctx.fillStyle = i % 2 === 0 ? '#ff00ff' : '#ffffff';
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawNinjaBlock(ctx) {

        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-10, -35);
        ctx.quadraticCurveTo(-30, -25, -28, 10);
        ctx.lineTo(-23, 8);
        ctx.quadraticCurveTo(-25, -20, -12, -33);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-18, 18, 14, 38, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(4, 18, 14, 38, 5);
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-22, -25, 44, 50, 8);
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-5, -20, 35, 14, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-30, -15, 35, 14, 6);
        ctx.fill();


        ctx.fillStyle = '#3a0ca3';
        ctx.beginPath();
        ctx.roundRect(10, -18, 15, 10, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(-25, -13, 15, 10, 3);
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -38, 16, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-5, -40, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -40, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;


        ctx.strokeStyle = '#9d4edd';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.5 + Math.sin(this.animTimer * 0.2) * 0.3;
        ctx.beginPath();
        ctx.arc(5, -5, 35, -0.5, 0.8);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawNinjaCrouch(ctx) {

        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-10, -20);
        ctx.quadraticCurveTo(-25, 0, -22, 25);
        ctx.lineTo(-18, 22);
        ctx.quadraticCurveTo(-20, -2, -12, -18);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-20, 5, 14, 32, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(6, 5, 14, 32, 5);
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-20, -18, 40, 35, 8);
        ctx.fill();


        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(0, -8);
        ctx.lineTo(14, -14);
        ctx.lineTo(14, 10);
        ctx.lineTo(-14, 10);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-30, -8, 12, 25, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(18, -8, 12, 25, 5);
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -28, 15, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-5, -30, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -30, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawNinjaAttack(ctx) {
        const attack = this.attacks[this.currentAttack];
        const progress = 1 - (this.attackTimer / attack?.duration || 0);
        const swing = Math.sin(progress * Math.PI);


        ctx.fillStyle = '#9d4edd';
        ctx.beginPath();
        ctx.moveTo(-12, -45);
        ctx.quadraticCurveTo(-50 - swing * 20, -20, -55 - swing * 25, 20);
        ctx.lineTo(-48 - swing * 20, 15);
        ctx.quadraticCurveTo(-45 - swing * 15, -25, -15, -42);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.roundRect(-22 - swing * 8, 22, 14, 48, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(8 + swing * 12, 18, 14, 50, 5);
        ctx.fill();


        ctx.save();
        ctx.rotate(-0.1 - swing * 0.2);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-24, -38, 48, 62, 8);
        ctx.fill();


        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-18, -32);
        ctx.lineTo(0, -22);
        ctx.lineTo(18, -32);
        ctx.lineTo(18, 15);
        ctx.lineTo(-18, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();


        ctx.save();
        ctx.translate(28, -20);
        ctx.rotate(swing * Math.PI * 0.8 - 0.3);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-6, 0, 14, 40, 5);
        ctx.fill();


        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(0, 38);
        ctx.lineTo(-4, 48);
        ctx.lineTo(0, 70);
        ctx.lineTo(4, 48);
        ctx.closePath();
        ctx.fill();


        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();


        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-35, -15, 12, 35, 5);
        ctx.fill();


        ctx.fillStyle = '#1a0533';
        ctx.beginPath();
        ctx.arc(0, -52, 18, 0, Math.PI * 2);
        ctx.fill();


        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(-6, -54, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -54, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;


        if (swing > 0.2) {
            ctx.save();
            ctx.globalAlpha = swing * 0.7;
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = i === 0 ? '#ffffff' : '#ff00ff';
                ctx.lineWidth = 8 - i * 2;
                ctx.beginPath();
                ctx.arc(45, -10, 45 + i * 12, -Math.PI * 0.7, Math.PI * 0.5 * swing);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
}
