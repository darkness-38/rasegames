// ===================================
// MAGE CHARACTER
// Magic-focused with ranged attacks
// ===================================

class Mage extends Character {
    constructor(options = {}) {
        super({
            name: 'Arcane Mage',
            type: 'mage',
            speed: 5.5,
            jumpForce: -14,
            maxHealth: 950,
            defense: 1.1,
            color: '#3a86ff',
            secondaryColor: '#023e8a',
            ...options
        });

        // Mage-specific attacks
        this.attacks = {
            light: {
                damage: 28,
                knockback: 5,
                duration: 15,
                cooldown: 20,
                hitboxWidth: 50,
                hitboxHeight: 40,
                energyGain: 5
            },
            heavy: {
                damage: 65,
                knockback: 12,
                duration: 28,
                cooldown: 38,
                hitboxWidth: 70,
                hitboxHeight: 55,
                energyGain: 10
            },
            special: {
                damage: 50,
                knockback: 8,
                duration: 30,
                cooldown: 40,
                hitboxWidth: 50,
                hitboxHeight: 50,
                energyCost: 25,
                energyGain: 0,
                isProjectile: true
            },
            ultimate: {
                damage: 220,
                knockback: 40,
                duration: 80,
                cooldown: 100,
                hitboxWidth: 250,
                hitboxHeight: 180,
                energyCost: 100,
                energyGain: 0
            }
        };

        // Magic effects
        this.orbitalParticles = [];
        this.ultimateActive = false;
        this.ultimateTimer = 0;
        this.magicCircle = { radius: 0, rotation: 0 };
    }

    update(input, opponent) {
        super.update(input, opponent);

        // Update orbital particles
        if (this.orbitalParticles.length < 3 && Math.random() < 0.02) {
            this.orbitalParticles.push({
                angle: Math.random() * Math.PI * 2,
                distance: 40 + Math.random() * 20,
                size: 3 + Math.random() * 4,
                speed: 0.02 + Math.random() * 0.02
            });
        }

        for (const particle of this.orbitalParticles) {
            particle.angle += particle.speed;
        }

        // Update magic circle
        this.magicCircle.rotation += 0.02;

        // Ultimate beam
        if (this.ultimateActive) {
            this.ultimateTimer--;
            if (this.ultimateTimer <= 0) {
                this.ultimateActive = false;
            }
        }
    }

    startAttack(type) {
        if (type === 'special') {
            // Fire magic missile
            this.fireProjectile({
                width: 35,
                height: 35,
                speed: 12,
                damage: 50,
                knockback: 8,
                life: 100,
                color: '#3a86ff'
            });
            this.attackCooldown = this.attacks.special.cooldown;
            this.energy -= this.attacks.special.energyCost;
            return;
        }

        if (type === 'ultimate') {
            if (this.energy < 100) return;
            this.ultimateActive = true;
            this.ultimateTimer = 60;
            this.energy = 0;
            this.isAttacking = true;
            this.currentAttack = 'ultimate';
            this.attackTimer = 80;
            this.attackCooldown = 100;
            return;
        }

        super.startAttack(type);
    }

    getHitbox() {
        // Ultimate has a beam hitbox
        if (this.ultimateActive && this.ultimateTimer > 20) {
            return {
                x: this.direction === 1 ? this.x + this.width : this.x - 300,
                y: this.y - 50,
                width: 300,
                height: 150,
                damage: 8, // Damage per frame
                knockback: 2,
                energyGain: 0
            };
        }

        return super.getHitbox();
    }

    draw(ctx) {
        ctx.save();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.direction, 1);

        // Magic circle under feet
        this.drawMagicCircle(ctx);

        // Shadow (smaller when jumping)
        const shadowScale = this.isGrounded ? 1 : 0.3;
        ctx.fillStyle = 'rgba(58, 134, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 + 5, (this.width / 2 + 10) * shadowScale, 15 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orbital particles
        this.drawOrbitalParticles(ctx);

        // Draw based on state
        switch (this.state) {
            case 'hitstun':
                this.drawMageHit(ctx);
                break;
            case 'block':
            case 'blockstun':
                this.drawMageBlock(ctx);
                break;
            case 'crouch':
                this.drawMageCrouch(ctx);
                break;
            case 'walk':
                this.drawMageWalk(ctx);
                break;
            case 'jump':
                this.drawMageJump(ctx);
                break;
            case 'fall':
                this.drawMageFall(ctx);
                break;
            case 'attack_light':
            case 'attack_heavy':
            case 'attack_special':
            case 'attack_ultimate':
                this.drawMageAttack(ctx);
                break;
            default:
                this.drawMageBody(ctx);
        }

        // Ultimate beam
        if (this.ultimateActive) {
            this.drawUltimateBeam(ctx);
        }

        ctx.restore();

        this.drawProjectiles(ctx);
    }

    drawMagicCircle(ctx) {
        ctx.save();
        ctx.translate(0, this.height / 2);
        ctx.rotate(this.magicCircle.rotation);

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;

        // Outer circle
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.stroke();

        // Inner patterns
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI * 2);
        ctx.stroke();

        // Runes
        for (let i = 0; i < 6; i++) {
            ctx.save();
            ctx.rotate(i * Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(45, 0);
            ctx.lineTo(55, 5);
            ctx.lineTo(55, -5);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    drawOrbitalParticles(ctx) {
        for (const particle of this.orbitalParticles) {
            const px = Math.cos(particle.angle) * particle.distance;
            const py = Math.sin(particle.angle) * particle.distance * 0.5 - 20;

            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(px, py, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    drawMageBody(ctx) {
        const bob = Math.sin(this.animTimer * 0.1) * 3;
        const breathe = Math.sin(this.animTimer * 0.08) * 1.5;
        const isAttacking = this.state.startsWith('attack_');
        const floatOffset = Math.sin(this.animTimer * 0.05) * 5; // Floating effect

        // === MAGICAL AURA (behind) ===
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(this.animTimer * 0.1) * 0.1;
        const auraGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 80);
        auraGrad.addColorStop(0, this.color);
        auraGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 60 + Math.sin(this.animTimer * 0.15) * 10, 70, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // === ROBE BASE ===
        // Outer robe
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-32, 78 + floatOffset);
        ctx.lineTo(-38, 25 + bob + floatOffset);
        ctx.quadraticCurveTo(-35, -15 + bob + floatOffset, -22, -42 + bob + floatOffset);
        ctx.lineTo(22, -42 + bob + floatOffset);
        ctx.quadraticCurveTo(35, -15 + bob + floatOffset, 38, 25 + bob + floatOffset);
        ctx.lineTo(32, 78 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Robe gradient overlay
        const robeGrad = ctx.createLinearGradient(-35, -40 + bob, 35, 75);
        robeGrad.addColorStop(0, 'rgba(100, 180, 255, 0.2)');
        robeGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        robeGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        ctx.fillStyle = robeGrad;
        ctx.beginPath();
        ctx.moveTo(-32, 78 + floatOffset);
        ctx.lineTo(-38, 25 + bob + floatOffset);
        ctx.quadraticCurveTo(-35, -15 + bob + floatOffset, -22, -42 + bob + floatOffset);
        ctx.lineTo(22, -42 + bob + floatOffset);
        ctx.quadraticCurveTo(35, -15 + bob + floatOffset, 38, 25 + bob + floatOffset);
        ctx.lineTo(32, 78 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Robe trim (magical glow)
        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#4cc9f0';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Robe pattern (arcane symbols)
        ctx.strokeStyle = '#5a9fff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(-15 + i * 10, 40 + bob + floatOffset, 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Inner robe layer
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-22, 78 + floatOffset);
        ctx.lineTo(-18, 5 + bob + floatOffset);
        ctx.lineTo(18, 5 + bob + floatOffset);
        ctx.lineTo(22, 78 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Inner robe highlight
        ctx.fillStyle = '#5a9fff';
        ctx.beginPath();
        ctx.moveTo(-18, 78 + floatOffset);
        ctx.lineTo(-14, 10 + bob + floatOffset);
        ctx.lineTo(-5, 10 + bob + floatOffset);
        ctx.lineTo(-8, 78 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // === BELT/SASH ===
        ctx.fillStyle = '#7209b7';
        ctx.beginPath();
        ctx.roundRect(-28, 18 + bob + floatOffset, 56, 14, 4);
        ctx.fill();

        // Belt pattern
        ctx.strokeStyle = '#9d4edd';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-25, 25 + bob + floatOffset);
        ctx.lineTo(25, 25 + bob + floatOffset);
        ctx.stroke();

        // Main gem
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 25 + bob + floatOffset, 8, 0, Math.PI * 2);
        ctx.fill();

        // Gem inner glow
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, 23 + bob + floatOffset, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Side gems
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(-18, 25 + bob + floatOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(18, 25 + bob + floatOffset, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // === SHOULDERS ===
        // Left shoulder pad
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(-30, -30 + bob + floatOffset, 14, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4cc9f0';
        ctx.beginPath();
        ctx.arc(-30, -30 + bob + floatOffset, 5, 0, Math.PI * 2);
        ctx.fill();

        // Right shoulder pad
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.ellipse(30, -30 + bob + floatOffset, 14, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#4cc9f0';
        ctx.beginPath();
        ctx.arc(30, -30 + bob + floatOffset, 5, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS ===
        // Left arm (sleeve)
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-42, -25 + bob + floatOffset, 15, 45, 6);
        ctx.fill();
        // Wide sleeve opening
        ctx.beginPath();
        ctx.moveTo(-45, 15 + bob + floatOffset);
        ctx.lineTo(-50, 35 + bob + floatOffset);
        ctx.lineTo(-35, 35 + bob + floatOffset);
        ctx.lineTo(-30, 15 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();
        // Hand
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.roundRect(-44, 30 + bob + floatOffset, 12, 14, 5);
        ctx.fill();

        // Right arm (staff arm)
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(27, -25 + bob + floatOffset, 15, 45, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(25, 15 + bob + floatOffset);
        ctx.lineTo(20, 35 + bob + floatOffset);
        ctx.lineTo(35, 35 + bob + floatOffset);
        ctx.lineTo(40, 15 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.roundRect(28, 30 + bob + floatOffset, 12, 14, 5);
        ctx.fill();

        // === STAFF ===
        ctx.save();
        ctx.translate(38, 35 + bob + floatOffset);
        if (isAttacking) {
            ctx.rotate(-0.4);
        } else {
            ctx.rotate(0.1);
        }

        // Staff pole
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-4, -120, 8, 130, 3);
        ctx.fill();

        // Pole detail bands
        ctx.fillStyle = '#6b4423';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.roundRect(-5, -100 + i * 25, 10, 6, 2);
            ctx.fill();
        }

        // Staff head frame
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-15, -125);
        ctx.lineTo(0, -145);
        ctx.lineTo(15, -125);
        ctx.lineTo(10, -120);
        ctx.lineTo(0, -130);
        ctx.lineTo(-10, -120);
        ctx.closePath();
        ctx.fill();

        // Staff orb
        const orbPulse = Math.sin(this.animTimer * 0.15) * 3;
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 25 + orbPulse * 2;
        ctx.beginPath();
        ctx.arc(0, -135, 12 + orbPulse, 0, Math.PI * 2);
        ctx.fill();

        // Orb inner layers
        ctx.fillStyle = '#88ffff';
        ctx.beginPath();
        ctx.arc(0, -135, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -137, 4, 0, Math.PI * 2);
        ctx.fill();

        // Orb sparkles (animated)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = this.animTimer * 0.08 + i * Math.PI / 3;
            const dist = 16 + Math.sin(this.animTimer * 0.2 + i) * 4;
            ctx.globalAlpha = 0.5 + Math.sin(this.animTimer * 0.1 + i) * 0.3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * 10, -135 + Math.sin(angle) * 10);
            ctx.lineTo(Math.cos(angle) * dist, -135 + Math.sin(angle) * dist);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        ctx.restore();

        // === HEAD ===
        // Neck
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.roundRect(-6, -50 + bob + floatOffset, 12, 12, 4);
        ctx.fill();

        // Head
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -60 + bob + floatOffset, 20, 0, Math.PI * 2);
        ctx.fill();

        // Face shadow
        ctx.fillStyle = '#e6c090';
        ctx.beginPath();
        ctx.arc(3, -58 + bob + floatOffset, 16, 0, Math.PI);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -62 + bob + floatOffset, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(28, -45 + bob + floatOffset);
        ctx.quadraticCurveTo(22, -55 + bob + floatOffset, 18, -85 + bob + floatOffset);
        ctx.lineTo(-18, -85 + bob + floatOffset);
        ctx.quadraticCurveTo(-22, -55 + bob + floatOffset, -28, -45 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Hood highlight
        ctx.fillStyle = '#034078';
        ctx.beginPath();
        ctx.moveTo(-15, -82 + bob + floatOffset);
        ctx.quadraticCurveTo(-18, -60 + bob + floatOffset, -24, -48 + bob + floatOffset);
        ctx.lineTo(-20, -50 + bob + floatOffset);
        ctx.quadraticCurveTo(-15, -65 + bob + floatOffset, -12, -80 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Hood edge glow
        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#4cc9f0';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, -62 + bob + floatOffset, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = isAttacking ? 30 : 15;
        ctx.beginPath();
        ctx.ellipse(-6, -60 + bob + floatOffset, 5, 4, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -60 + bob + floatOffset, 5, 4, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Glowing pupils
        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.arc(-6, -60 + bob + floatOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(6, -60 + bob + floatOffset, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(-7, -61 + bob + floatOffset, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(5, -61 + bob + floatOffset, 1, 0, Math.PI * 2);
        ctx.fill();

        // === CASTING EFFECTS ===
        if (isAttacking) {
            // Extended casting arm
            ctx.fillStyle = '#ffd6a5';
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.roundRect(-50, -25 + bob + floatOffset, 55, 16, 8);
            ctx.fill();

            // Magic gathering orbs
            for (let i = 0; i < 3; i++) {
                const orbAngle = this.animTimer * 0.2 + i * Math.PI * 2 / 3;
                const orbX = -75 + Math.cos(orbAngle) * 15;
                const orbY = -17 + bob + floatOffset + Math.sin(orbAngle) * 8;

                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.6 + Math.sin(this.animTimer * 0.3 + i) * 0.3;
                ctx.beginPath();
                ctx.arc(orbX, orbY, 8 + Math.sin(this.animTimer * 0.4 + i) * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // Central casting sphere
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-75, -17 + bob + floatOffset, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(-75, -17 + bob + floatOffset, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // === HIT STATE ===
        if (this.state === 'hitstun') {
            const flash = Math.floor(this.animTimer / 3) % 2 === 0;
            if (flash) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.ellipse(0, 0 + floatOffset, 50, 80, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // Shake effect
            ctx.translate(Math.sin(this.animTimer * 0.8) * 3, 0);
        }
    }

    drawUltimateBeam(ctx) {
        const beamWidth = 150;
        const beamLength = 400;
        const intensity = this.ultimateTimer / 60;

        ctx.save();
        ctx.translate(40, -10);

        // Beam glow layers
        for (let i = 3; i >= 0; i--) {
            const width = beamWidth * (1 + i * 0.3);
            ctx.fillStyle = i === 0 ? '#ffffff' : this.color;
            ctx.globalAlpha = intensity * (0.3 - i * 0.07);
            ctx.beginPath();
            ctx.ellipse(beamLength / 2, 0, beamLength / 2, width / 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Core beam
        ctx.globalAlpha = intensity;
        ctx.fillStyle = '#00f5d4';
        ctx.beginPath();
        ctx.ellipse(beamLength / 2, 0, beamLength / 2, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner white core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(beamLength / 2, 0, beamLength / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Beam particles
        ctx.globalAlpha = 1;
        for (let i = 0; i < 10; i++) {
            const px = Math.random() * beamLength;
            const py = (Math.random() - 0.5) * 50;
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#00f5d4';
            ctx.beginPath();
            ctx.arc(px, py, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawProjectiles(ctx) {
        for (const proj of this.projectiles) {
            ctx.save();
            ctx.translate(proj.x + proj.width / 2, proj.y + proj.height / 2);

            // Magic missile glow
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 25;

            // Outer glow
            ctx.fillStyle = proj.color;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, proj.width / 2 + 10, 0, Math.PI * 2);
            ctx.fill();

            // Main orb
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(0, 0, proj.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, proj.width / 4, 0, Math.PI * 2);
            ctx.fill();

            // Trailing particles
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = proj.color;
                ctx.globalAlpha = 0.5 - i * 0.15;
                ctx.beginPath();
                ctx.arc(-15 - i * 10, (Math.random() - 0.5) * 10, 5 - i, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    drawMageWalk(ctx) {
        const cycle = this.animTimer * 0.12;
        const bob = Math.abs(Math.sin(cycle)) * 4;
        const floatOffset = Math.sin(this.animTimer * 0.05) * 3;
        const robeSwing = Math.sin(cycle) * 0.05;

        // Magical trail
        ctx.save();
        ctx.globalAlpha = 0.3;
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(-20 - i * 15, 50 + i * 5 + floatOffset, 8 - i * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Robe with movement
        ctx.save();
        ctx.rotate(robeSwing);
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-30, 78 + bob + floatOffset);
        ctx.lineTo(-36, 25 + bob + floatOffset);
        ctx.quadraticCurveTo(-33, -15 + bob + floatOffset, -20, -40 + bob + floatOffset);
        ctx.lineTo(20, -40 + bob + floatOffset);
        ctx.quadraticCurveTo(33, -15 + bob + floatOffset, 36, 25 + bob + floatOffset);
        ctx.lineTo(30, 78 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Inner robe
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-20, 78 + bob + floatOffset);
        ctx.lineTo(-16, 5 + bob + floatOffset);
        ctx.lineTo(16, 5 + bob + floatOffset);
        ctx.lineTo(20, 78 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Belt
        ctx.fillStyle = '#7209b7';
        ctx.beginPath();
        ctx.roundRect(-26, 18 + bob + floatOffset, 52, 12, 4);
        ctx.fill();

        // Gem
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 24 + bob + floatOffset, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Arms swinging
        ctx.fillStyle = this.secondaryColor;
        ctx.save();
        ctx.translate(-32, -18 + bob + floatOffset);
        ctx.rotate(Math.sin(cycle) * 0.3);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 40, 6);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(32, -18 + bob + floatOffset);
        ctx.rotate(-Math.sin(cycle) * 0.3);
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 40, 6);
        ctx.fill();
        ctx.restore();

        // Head
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -58 + bob + floatOffset, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -60 + bob + floatOffset, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(26, -45 + bob + floatOffset);
        ctx.quadraticCurveTo(20, -55 + bob + floatOffset, 16, -83 + bob + floatOffset);
        ctx.lineTo(-16, -83 + bob + floatOffset);
        ctx.quadraticCurveTo(-20, -55 + bob + floatOffset, -26, -45 + bob + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-6, -58 + bob + floatOffset, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -58 + bob + floatOffset, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Staff bobbing
        ctx.save();
        ctx.translate(38, 35 + bob + floatOffset);
        ctx.rotate(0.1 + Math.sin(cycle) * 0.1);
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-4, -120, 8, 130, 3);
        ctx.fill();

        // Staff orb
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(0, -130, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawMageJump(ctx) {
        const rise = Math.min(this.animTimer * 0.08, 1);

        // Magical updraft
        ctx.save();
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 6; i++) {
            const angle = this.animTimer * 0.15 + i * Math.PI / 3;
            const dist = 30 + i * 5;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * 20, 60 + Math.sin(angle) * 10 + i * 10, 6 - i * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Robe billowing
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-35, 85);
        ctx.lineTo(-40, 30);
        ctx.quadraticCurveTo(-38, -10, -22, -38);
        ctx.lineTo(22, -38);
        ctx.quadraticCurveTo(38, -10, 40, 30);
        ctx.lineTo(35, 85);
        ctx.closePath();
        ctx.fill();

        // Inner robe spread
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-25, 85);
        ctx.lineTo(-20, 10);
        ctx.lineTo(20, 10);
        ctx.lineTo(25, 85);
        ctx.closePath();
        ctx.fill();

        // Body
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-28, -35, 56, 50, 10);
        ctx.fill();

        // Arms spread
        ctx.save();
        ctx.translate(-35, -25);
        ctx.rotate(-0.8);
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-6, 0, 14, 42, 6);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(35, -25);
        ctx.rotate(0.8);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 14, 42, 6);
        ctx.fill();
        ctx.restore();

        // Head
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -55, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -58, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(26, -42);
        ctx.quadraticCurveTo(20, -52, 16, -80);
        ctx.lineTo(-16, -80);
        ctx.quadraticCurveTo(-20, -52, -26, -42);
        ctx.closePath();
        ctx.fill();

        // Glowing eyes (looking up)
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.ellipse(-6, -58, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -58, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Staff held horizontal
        ctx.save();
        ctx.translate(0, -20);
        ctx.rotate(-0.3);
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-60, -4, 120, 8, 3);
        ctx.fill();

        // Orb on left
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(-65, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Jump trail
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(0, 90);
        ctx.lineTo(0, 120);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawMageFall(ctx) {
        const wave = Math.sin(this.animTimer * 0.2) * 5;

        // Robe flying up
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-38, -20);
        ctx.quadraticCurveTo(-45 + wave, -50, -40 + wave, -90);
        ctx.lineTo(-32 + wave, -85);
        ctx.quadraticCurveTo(-38 + wave * 0.5, -45, -30, -18);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(38, -20);
        ctx.quadraticCurveTo(45 - wave, -50, 40 - wave, -90);
        ctx.lineTo(32 - wave, -85);
        ctx.quadraticCurveTo(38 - wave * 0.5, -45, 30, -18);
        ctx.closePath();
        ctx.fill();

        // Main robe
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-30, -30, 60, 55, 10);
        ctx.fill();

        // Inner robe
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-18, 25);
        ctx.lineTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.lineTo(18, 25);
        ctx.closePath();
        ctx.fill();

        // Arms out
        ctx.fillStyle = this.secondaryColor;
        ctx.save();
        ctx.translate(-32, -15);
        ctx.rotate(-0.5);
        ctx.beginPath();
        ctx.roundRect(-6, 0, 14, 38, 6);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(32, -15);
        ctx.rotate(0.5);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 14, 38, 6);
        ctx.fill();
        ctx.restore();

        // Head looking down
        ctx.save();
        ctx.rotate(0.1);
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -45, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -48, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(26, -32);
        ctx.quadraticCurveTo(20, -42, 16, -70);
        ctx.lineTo(-16, -70);
        ctx.quadraticCurveTo(-20, -42, -26, -32);
        ctx.closePath();
        ctx.fill();

        // Eyes looking down
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-6, -42, 4, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -42, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // Wind lines
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-25 + i * 18, -80);
            ctx.lineTo(-25 + i * 18, -60);
            ctx.stroke();
        }
    }

    drawMageHit(ctx) {
        const flash = Math.floor(this.animTimer / 2) % 2 === 0;
        const shake = Math.sin(this.animTimer * 0.6) * 6;

        ctx.save();
        ctx.translate(shake, 0);
        ctx.rotate(0.2);

        // Robe disheveled
        ctx.fillStyle = flash ? '#aaccff' : this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-32, 75);
        ctx.lineTo(-38, 20);
        ctx.quadraticCurveTo(-35, -15, -20, -35);
        ctx.lineTo(20, -35);
        ctx.quadraticCurveTo(35, -15, 38, 20);
        ctx.lineTo(32, 75);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        // Head thrown back
        ctx.save();
        ctx.translate(-10 + shake, -50);
        ctx.rotate(-0.25);

        ctx.fillStyle = flash ? '#ffffff' : '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hood askew
        ctx.fillStyle = flash ? '#aaccff' : this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -3, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(26, 8);
        ctx.quadraticCurveTo(20, -2, 16, -28);
        ctx.lineTo(-16, -28);
        ctx.quadraticCurveTo(-20, -2, -26, 8);
        ctx.closePath();
        ctx.fill();

        // X eyes
        ctx.strokeStyle = flash ? '#00f5d4' : '#333';
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

        // Mouth open
        ctx.fillStyle = '#660000';
        ctx.beginPath();
        ctx.ellipse(0, 10, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Magic disruption particles
        ctx.save();
        ctx.translate(15, -20);
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + this.animTimer * 0.18;
            const dist = 30 + Math.sin(this.animTimer * 0.3 + i) * 10;
            ctx.fillStyle = i % 2 === 0 ? '#00f5d4' : '#ff6b6b';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * dist, Math.sin(angle) * dist, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Staff dropped
        ctx.save();
        ctx.translate(40, 30);
        ctx.rotate(0.8 + shake * 0.02);
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-4, -60, 8, 90, 3);
        ctx.fill();
        ctx.fillStyle = '#00f5d4';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(0, -68, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    drawMageBlock(ctx) {
        const pulse = Math.sin(this.animTimer * 0.15) * 0.2;

        // Magic shield
        ctx.save();
        ctx.globalAlpha = 0.6 + pulse * 0.3;
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(15, -10, 50, -0.8, 0.8);
        ctx.stroke();

        // Shield runes
        ctx.fillStyle = '#00f5d4';
        for (let i = 0; i < 5; i++) {
            const a = -0.6 + i * 0.3;
            ctx.beginPath();
            ctx.arc(15 + Math.cos(a) * 50, -10 + Math.sin(a) * 50, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Robe compact
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-28, 60);
        ctx.lineTo(-32, 15);
        ctx.quadraticCurveTo(-30, -10, -18, -30);
        ctx.lineTo(18, -30);
        ctx.quadraticCurveTo(30, -10, 32, 15);
        ctx.lineTo(28, 60);
        ctx.closePath();
        ctx.fill();

        // Arms forward casting shield
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-5, -22, 45, 16, 7);
        ctx.fill();

        // Hand glowing
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(42, -14, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(42, -14, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Head
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -45, 18, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -48, 22, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(24, -32);
        ctx.quadraticCurveTo(18, -42, 14, -68);
        ctx.lineTo(-14, -68);
        ctx.quadraticCurveTo(-18, -42, -24, -32);
        ctx.closePath();
        ctx.fill();

        // Determined eyes
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.ellipse(-5, -46, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -46, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawMageCrouch(ctx) {
        const floatOffset = Math.sin(this.animTimer * 0.08) * 2;

        // Robe pooling
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-35, 45 + floatOffset);
        ctx.lineTo(-30, 5 + floatOffset);
        ctx.quadraticCurveTo(-25, -12 + floatOffset, -15, -22 + floatOffset);
        ctx.lineTo(15, -22 + floatOffset);
        ctx.quadraticCurveTo(25, -12 + floatOffset, 30, 5 + floatOffset);
        ctx.lineTo(35, 45 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Inner robe
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-18, 45 + floatOffset);
        ctx.lineTo(-14, 5 + floatOffset);
        ctx.lineTo(14, 5 + floatOffset);
        ctx.lineTo(18, 45 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Belt
        ctx.fillStyle = '#7209b7';
        ctx.beginPath();
        ctx.roundRect(-22, 8 + floatOffset, 44, 10, 3);
        ctx.fill();

        // Arms at sides
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-35, -10 + floatOffset, 12, 30, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(23, -10 + floatOffset, 12, 30, 5);
        ctx.fill();

        // Head lowered
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -32 + floatOffset, 16, 0, Math.PI * 2);
        ctx.fill();

        // Hood covering more
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -35 + floatOffset, 20, Math.PI * 0.7, Math.PI * 0.3);
        ctx.lineTo(22, -22 + floatOffset);
        ctx.quadraticCurveTo(16, -30 + floatOffset, 12, -55 + floatOffset);
        ctx.lineTo(-12, -55 + floatOffset);
        ctx.quadraticCurveTo(-16, -30 + floatOffset, -22, -22 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Eyes (alert)
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-4, -32 + floatOffset, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -32 + floatOffset, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Staff low
        ctx.save();
        ctx.translate(35, 20 + floatOffset);
        ctx.rotate(0.4);
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-3, -80, 6, 100, 3);
        ctx.fill();
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, -88, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    drawMageAttack(ctx) {
        const attack = this.attacks[this.currentAttack];
        const progress = 1 - (this.attackTimer / attack?.duration || 0);
        const castPower = Math.sin(progress * Math.PI);
        const floatOffset = Math.sin(this.animTimer * 0.05) * 5;

        // Intense aura
        ctx.save();
        ctx.globalAlpha = 0.4 + castPower * 0.3;
        const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 80 + castPower * 30);
        auraGrad.addColorStop(0, this.color);
        auraGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 70 + castPower * 20, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Robe floating
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.moveTo(-32, 80 + floatOffset);
        ctx.lineTo(-40 - castPower * 5, 25 + floatOffset);
        ctx.quadraticCurveTo(-38, -15 + floatOffset, -22, -42 + floatOffset);
        ctx.lineTo(22, -42 + floatOffset);
        ctx.quadraticCurveTo(38, -15 + floatOffset, 40 + castPower * 5, 25 + floatOffset);
        ctx.lineTo(32, 80 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Robe trim glowing
        ctx.strokeStyle = '#4cc9f0';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#4cc9f0';
        ctx.shadowBlur = 15 + castPower * 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Casting arms
        ctx.fillStyle = this.secondaryColor;
        ctx.save();
        ctx.translate(-35, -20 + floatOffset);
        ctx.rotate(-0.8 - castPower * 0.4);
        ctx.beginPath();
        ctx.roundRect(-6, 0, 14, 45, 6);
        ctx.fill();
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, 48, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Right arm with staff raised
        ctx.save();
        ctx.translate(35, -20 + floatOffset);
        ctx.rotate(0.5 + castPower * 0.5);
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-7, 0, 14, 45, 6);
        ctx.fill();

        // Staff
        ctx.translate(0, 48);
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-4, -30, 8, 100, 3);
        ctx.fill();

        // Powered orb
        const orbSize = 14 + castPower * 8;
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 30 + castPower * 20;
        ctx.beginPath();
        ctx.arc(0, -38, orbSize, 0, Math.PI * 2);
        ctx.fill();

        // Orb inner
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -38, orbSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Energy rays
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = this.animTimer * 0.1 + i * Math.PI / 4;
            ctx.globalAlpha = 0.5 + castPower * 0.5;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * orbSize, -38 + Math.sin(angle) * orbSize);
            ctx.lineTo(Math.cos(angle) * (orbSize + 20), -38 + Math.sin(angle) * (orbSize + 20));
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        ctx.restore();

        // Head
        ctx.fillStyle = '#ffd6a5';
        ctx.beginPath();
        ctx.arc(0, -60 + floatOffset, 20, 0, Math.PI * 2);
        ctx.fill();

        // Hood
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -63 + floatOffset, 24, Math.PI * 0.75, Math.PI * 0.25);
        ctx.lineTo(28, -48 + floatOffset);
        ctx.quadraticCurveTo(22, -58 + floatOffset, 18, -88 + floatOffset);
        ctx.lineTo(-18, -88 + floatOffset);
        ctx.quadraticCurveTo(-22, -58 + floatOffset, -28, -48 + floatOffset);
        ctx.closePath();
        ctx.fill();

        // Intense glowing eyes
        ctx.fillStyle = '#00f5d4';
        ctx.shadowColor = '#00f5d4';
        ctx.shadowBlur = 25 + castPower * 15;
        ctx.beginPath();
        ctx.ellipse(-6, -60 + floatOffset, 5 + castPower * 2, 4 + castPower, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -60 + floatOffset, 5 + castPower * 2, 4 + castPower, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Magic gathering at casting hand
        if (castPower > 0.3) {
            ctx.save();
            ctx.translate(-55 - castPower * 20, 10 + floatOffset);
            for (let i = 0; i < 5; i++) {
                const orbAngle = this.animTimer * 0.25 + i * Math.PI * 2 / 5;
                const orbDist = 15 + Math.sin(this.animTimer * 0.3 + i) * 5;
                ctx.fillStyle = this.color;
                ctx.globalAlpha = 0.6 + castPower * 0.3;
                ctx.beginPath();
                ctx.arc(Math.cos(orbAngle) * orbDist, Math.sin(orbAngle) * orbDist, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = castPower;
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.globalAlpha = 1;
    }
}
