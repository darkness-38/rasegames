// ===================================
// WARRIOR CHARACTER
// Melee-focused with high damage and defense
// ===================================

class Warrior extends Character {
    constructor(options = {}) {
        super({
            name: 'Shadow Warrior',
            type: 'warrior',
            speed: 5,
            jumpForce: -14,
            maxHealth: 1200,
            defense: 0.9, // Takes less damage
            color: '#ff6b35',
            secondaryColor: '#8b2500',
            ...options
        });

        // Warrior-specific attacks
        this.attacks = {
            light: {
                damage: 35,
                knockback: 4,
                duration: 12,
                cooldown: 18,
                hitboxWidth: 70,
                hitboxHeight: 45,
                energyGain: 6
            },
            heavy: {
                damage: 80,
                knockback: 15,
                duration: 30,
                cooldown: 40,
                hitboxWidth: 100,
                hitboxHeight: 60,
                energyGain: 12
            },
            special: {
                damage: 60,
                knockback: 20,
                duration: 35,
                cooldown: 50,
                hitboxWidth: 120,
                hitboxHeight: 80,
                energyCost: 25,
                energyGain: 0
            },
            ultimate: {
                damage: 250,
                knockback: 35,
                duration: 70,
                cooldown: 100,
                hitboxWidth: 180,
                hitboxHeight: 120,
                energyCost: 100,
                energyGain: 0
            }
        };

        // Armor ability
        this.armorActive = false;
        this.armorTimer = 0;
    }

    startAttack(type) {
        super.startAttack(type);

        // Warrior special activates armor
        if (type === 'special') {
            this.armorActive = true;
            this.armorTimer = 30;
        }
    }

    update(input, opponent) {
        super.update(input, opponent);

        // Update armor
        if (this.armorActive) {
            this.armorTimer--;
            if (this.armorTimer <= 0) {
                this.armorActive = false;
            }
        }
    }

    takeDamage(damage, knockback, attacker) {
        // Armor reduces damage and knockback
        if (this.armorActive) {
            damage = Math.floor(damage * 0.5);
            knockback = Math.floor(knockback * 0.3);
        }

        return super.takeDamage(damage, knockback, attacker);
    }

    draw(ctx) {
        ctx.save();

        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.direction, 1);

        // Shadow (smaller when jumping)
        const shadowScale = this.isGrounded ? 1 : 0.5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 + 5, (this.width / 2 + 5) * shadowScale, 12 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Armor glow when active
        if (this.armorActive) {
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 30;
        }

        // Draw based on state
        switch (this.state) {
            case 'hitstun':
                this.drawWarriorHit(ctx);
                break;
            case 'block':
            case 'blockstun':
                this.drawWarriorBlock(ctx);
                break;
            case 'crouch':
                this.drawWarriorCrouch(ctx);
                break;
            case 'walk':
                this.drawWarriorWalk(ctx);
                break;
            case 'jump':
                this.drawWarriorJump(ctx);
                break;
            case 'fall':
                this.drawWarriorFall(ctx);
                break;
            case 'attack_light':
            case 'attack_heavy':
            case 'attack_special':
            case 'attack_ultimate':
                this.drawWarriorAttack(ctx);
                break;
            default:
                this.drawWarriorIdle(ctx);
        }

        ctx.restore();

        this.drawProjectiles(ctx);
    }

    drawWarriorIdle(ctx) {
        const bob = Math.sin(this.animTimer * 0.08) * 2;
        const breathe = Math.sin(this.animTimer * 0.06) * 1.5;

        // === CAPE ===
        ctx.save();
        const capeWave = Math.sin(this.animTimer * 0.05) * 5;
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-30, -30 + bob);
        ctx.quadraticCurveTo(-45 + capeWave, 20 + bob, -35 + capeWave * 0.5, 70);
        ctx.lineTo(-25, 70);
        ctx.quadraticCurveTo(-30, 20 + bob, -25, -25 + bob);
        ctx.closePath();
        ctx.fill();
        // Cape highlight
        ctx.fillStyle = '#a52a2a';
        ctx.beginPath();
        ctx.moveTo(-28, -28 + bob);
        ctx.quadraticCurveTo(-38 + capeWave, 10 + bob, -32 + capeWave * 0.5, 50);
        ctx.lineTo(-30, 50);
        ctx.quadraticCurveTo(-32, 10 + bob, -26, -26 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // === LEGS WITH ARMOR ===
        // Left leg
        ctx.fillStyle = '#3d2914';
        ctx.beginPath();
        ctx.roundRect(-22, 28 + bob, 20, 52, 6);
        ctx.fill();
        // Leg armor plate
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(-20, 30 + bob, 16, 25, 4);
        ctx.fill();
        // Leg armor highlight
        ctx.fillStyle = '#ff7733';
        ctx.beginPath();
        ctx.roundRect(-18, 32 + bob, 6, 20, 2);
        ctx.fill();
        // Leg armor shadow
        ctx.fillStyle = '#993300';
        ctx.beginPath();
        ctx.roundRect(-8, 32 + bob, 4, 20, 2);
        ctx.fill();
        // Knee guard
        ctx.fillStyle = '#dd6600';
        ctx.beginPath();
        ctx.ellipse(-12, 55 + bob, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.ellipse(-14, 53 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right leg
        ctx.fillStyle = '#3d2914';
        ctx.beginPath();
        ctx.roundRect(2, 28 + bob, 20, 52, 6);
        ctx.fill();
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(4, 30 + bob, 16, 25, 4);
        ctx.fill();
        ctx.fillStyle = '#ff7733';
        ctx.beginPath();
        ctx.roundRect(6, 32 + bob, 6, 20, 2);
        ctx.fill();
        ctx.fillStyle = '#993300';
        ctx.beginPath();
        ctx.roundRect(16, 32 + bob, 4, 20, 2);
        ctx.fill();
        ctx.fillStyle = '#dd6600';
        ctx.beginPath();
        ctx.ellipse(12, 55 + bob, 12, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffaa44';
        ctx.beginPath();
        ctx.ellipse(10, 53 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Boots
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.roundRect(-24, 72 + bob, 24, 12, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(0, 72 + bob, 24, 12, 4);
        ctx.fill();
        // Boot metal trim
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-22, 70 + bob, 20, 3, 1);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(2, 70 + bob, 20, 3, 1);
        ctx.fill();

        // === TORSO - DETAILED ARMOR ===
        // Base body
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(-38, -42 + bob + breathe, 76, 75, 14);
        ctx.fill();

        // Main chest plate
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-35, -38 + bob + breathe, 70, 68, 12);
        ctx.fill();

        // Chest plate gradient overlay
        const chestGrad = ctx.createLinearGradient(-35, -38 + bob, 35, 30 + bob);
        chestGrad.addColorStop(0, 'rgba(255, 200, 150, 0.3)');
        chestGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        chestGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = chestGrad;
        ctx.beginPath();
        ctx.roundRect(-35, -38 + bob + breathe, 70, 68, 12);
        ctx.fill();

        // Chest muscle definition
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -30 + bob + breathe);
        ctx.lineTo(0, 15 + bob + breathe);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-15, -15 + bob + breathe, 12, 0.5, 2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(15, -15 + bob + breathe, 12, 0.6, 2.6);
        ctx.stroke();

        // Abs definition
        ctx.fillStyle = this.secondaryColor;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.roundRect(-12, 2 + i * 12 + bob + breathe, 10, 8, 2);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(2, 2 + i * 12 + bob + breathe, 10, 8, 2);
            ctx.fill();
        }

        // Belt
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-38, 22 + bob, 76, 12, 3);
        ctx.fill();
        // Belt buckle
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.roundRect(-8, 23 + bob, 16, 10, 2);
        ctx.fill();
        ctx.fillStyle = '#ffee88';
        ctx.beginPath();
        ctx.roundRect(-5, 25 + bob, 10, 6, 1);
        ctx.fill();
        // Belt studs
        ctx.fillStyle = '#c0c0c0';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(-30 + i * 12, 28 + bob, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(18 + i * 5, 28 + bob, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // === SHOULDER ARMOR (PAULDRONS) ===
        // Left pauldron
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-40, -28 + bob, 18, 14, -0.2, 0, Math.PI * 2);
        ctx.fill();
        // Pauldron layers
        ctx.fillStyle = '#cc4400';
        ctx.beginPath();
        ctx.ellipse(-40, -24 + bob, 16, 10, -0.2, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#bb3300';
        ctx.beginPath();
        ctx.ellipse(-40, -20 + bob, 14, 8, -0.2, 0, Math.PI);
        ctx.fill();
        // Pauldron spike
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(-40, -42 + bob);
        ctx.lineTo(-44, -30 + bob);
        ctx.lineTo(-36, -30 + bob);
        ctx.closePath();
        ctx.fill();
        // Pauldron highlight
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.ellipse(-44, -32 + bob, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right pauldron
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(40, -28 + bob, 18, 14, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cc4400';
        ctx.beginPath();
        ctx.ellipse(40, -24 + bob, 16, 10, 0.2, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#bb3300';
        ctx.beginPath();
        ctx.ellipse(40, -20 + bob, 14, 8, 0.2, 0, Math.PI);
        ctx.fill();
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(40, -42 + bob);
        ctx.lineTo(36, -30 + bob);
        ctx.lineTo(44, -30 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff8844';
        ctx.beginPath();
        ctx.ellipse(44, -32 + bob, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS ===
        // Left arm (behind)
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(-45, -15 + bob, 14, 35, 6);
        ctx.fill();
        // Arm armor
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(-44, -10 + bob, 12, 20, 4);
        ctx.fill();
        // Gauntlet
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-46, 18 + bob, 16, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.roundRect(-44, 20 + bob, 5, 10, 2);
        ctx.fill();

        // Right arm (sword arm)
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(31, -15 + bob, 14, 35, 6);
        ctx.fill();
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(32, -10 + bob, 12, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(30, 18 + bob, 16, 14, 4);
        ctx.fill();
        ctx.fillStyle = '#aaaaaa';
        ctx.beginPath();
        ctx.roundRect(38, 20 + bob, 5, 10, 2);
        ctx.fill();

        // === SWORD (at rest) ===
        ctx.save();
        ctx.translate(42, 30 + bob);
        ctx.rotate(0.3);
        // Sword handle
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-3, 0, 6, 25, 2);
        ctx.fill();
        // Handle wrap
        ctx.strokeStyle = '#2a1a0a';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(-3, 3 + i * 5);
            ctx.lineTo(3, 5 + i * 5);
            ctx.stroke();
        }
        // Pommel
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 27, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 27, 2, 0, Math.PI * 2);
        ctx.fill();
        // Guard
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-12, -3, 24, 6, 2);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(-10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        // Blade
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(-4, -5);
        ctx.lineTo(0, -80);
        ctx.lineTo(4, -5);
        ctx.closePath();
        ctx.fill();
        // Blade edge highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-2, -8);
        ctx.lineTo(0, -75);
        ctx.lineTo(0, -8);
        ctx.closePath();
        ctx.fill();
        // Blade runes
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 1;
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 5;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-1, -15 - i * 15);
            ctx.lineTo(1, -20 - i * 15);
            ctx.lineTo(-1, -25 - i * 15);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();

        // === HEAD AND HELMET ===
        // Neck
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(-8, -48 + bob, 16, 12, 4);
        ctx.fill();

        // Head base
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, -60 + bob, 22, 0, Math.PI * 2);
        ctx.fill();

        // Face shadow
        ctx.fillStyle = '#e6b888';
        ctx.beginPath();
        ctx.arc(3, -58 + bob, 18, 0, Math.PI);
        ctx.fill();

        // Helmet base
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -62 + bob, 24, Math.PI, 0);
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = '#aa2200';
        ctx.beginPath();
        ctx.moveTo(0, -88 + bob);
        ctx.lineTo(-5, -62 + bob);
        ctx.lineTo(5, -62 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#cc3300';
        ctx.beginPath();
        ctx.moveTo(0, -85 + bob);
        ctx.lineTo(-2, -65 + bob);
        ctx.lineTo(2, -65 + bob);
        ctx.closePath();
        ctx.fill();

        // Helmet visor
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(-15, -65 + bob, 30, 10, 3);
        ctx.fill();

        // Eyes through visor
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(-6, -60 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -60 + bob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Helmet cheek guards
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-22, -55 + bob, 8, 18, 3);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(14, -55 + bob, 8, 18, 3);
        ctx.fill();

        // Chin guard
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-10, -42 + bob, 20, 6, 2);
        ctx.fill();
    }

    drawWarriorAttack(ctx) {
        const attack = this.attacks[this.currentAttack];
        const progress = 1 - (this.attackTimer / attack?.duration || 0);
        const swing = Math.sin(progress * Math.PI);
        const intensity = this.currentAttack === 'ultimate' ? 2 : 1;

        // === CAPE FLYING BACK ===
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-30, -30);
        ctx.quadraticCurveTo(-55 - swing * 20, 10, -60 - swing * 30, 60);
        ctx.lineTo(-45 - swing * 25, 55);
        ctx.quadraticCurveTo(-45 - swing * 15, 5, -25, -25);
        ctx.closePath();
        ctx.fill();

        // === LEGS - lunging stance ===
        ctx.fillStyle = '#3d2914';
        // Back leg
        ctx.beginPath();
        ctx.roundRect(-25 - swing * 10, 25, 20, 52, 6);
        ctx.fill();
        // Front leg
        ctx.beginPath();
        ctx.roundRect(5 + swing * 15, 20, 20, 55, 6);
        ctx.fill();

        // Leg armor
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(-23 - swing * 10, 30, 16, 25, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(7 + swing * 15, 25, 16, 25, 4);
        ctx.fill();

        // === BODY leaning forward ===
        ctx.save();
        ctx.rotate(-0.15 - swing * 0.25);

        // Torso
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-38, -42, 76, 75, 14);
        ctx.fill();

        // Chest plate gradient
        const chestGrad = ctx.createLinearGradient(-38, -42, 38, 33);
        chestGrad.addColorStop(0, 'rgba(255, 200, 150, 0.3)');
        chestGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = chestGrad;
        ctx.beginPath();
        ctx.roundRect(-38, -42, 76, 75, 14);
        ctx.fill();

        // Shoulder pad
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-40, -28, 18, 14, -0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // === SWORD ARM with swing ===
        ctx.save();
        ctx.rotate(swing * Math.PI * 0.7 * intensity - 0.6);

        // Upper arm
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(15, -18, 55, 24, 10);
        ctx.fill();

        // Arm armor
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(18, -15, 25, 18, 5);
        ctx.fill();

        // Gauntlet
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(45, -16, 18, 20, 6);
        ctx.fill();

        // === SWORD ===
        // Handle
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(62, -8, 25, 12, 3);
        ctx.fill();

        // Guard
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.roundRect(60, -14, 6, 24, 2);
        ctx.fill();

        // Blade
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(88, -10);
        ctx.lineTo(155 + swing * 20, -5);
        ctx.lineTo(88, 6);
        ctx.closePath();
        ctx.fill();

        // Blade edge highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(90, -8);
        ctx.lineTo(150 + swing * 18, -5);
        ctx.lineTo(90, -3);
        ctx.closePath();
        ctx.fill();

        // Blade glow
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 15 * intensity;
        ctx.strokeStyle = '#ff6600';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(88, -10);
        ctx.lineTo(155 + swing * 20, -5);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();

        // === HEAD ===
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, -58, 22, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -62, 24, Math.PI, 0);
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = '#aa2200';
        ctx.beginPath();
        ctx.moveTo(0, -88);
        ctx.lineTo(-5, -62);
        ctx.lineTo(5, -62);
        ctx.closePath();
        ctx.fill();

        // Helmet visor
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.roundRect(-15, -65, 30, 10, 3);
        ctx.fill();

        // Fierce eyes
        ctx.fillStyle = '#ff3300';
        ctx.shadowColor = '#ff3300';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.ellipse(-6, -60, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -60, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // === ATTACK TRAIL ===
        if (swing > 0.2) {
            ctx.save();
            ctx.globalAlpha = swing * 0.6;

            // Multiple slash trails
            for (let i = 0; i < 3; i++) {
                ctx.strokeStyle = i === 0 ? '#ffffff' : this.color;
                ctx.lineWidth = 10 - i * 3;
                ctx.beginPath();
                ctx.arc(60, 0, 70 + i * 15, -Math.PI * 0.6, Math.PI * 0.4 * swing);
                ctx.stroke();
            }

            // Sparks
            ctx.fillStyle = '#ffff00';
            for (let i = 0; i < 5; i++) {
                const sparkAngle = swing * Math.PI * 0.3 + i * 0.2;
                const sparkDist = 80 + Math.random() * 30;
                ctx.beginPath();
                ctx.arc(60 + Math.cos(sparkAngle) * sparkDist, Math.sin(sparkAngle) * sparkDist, 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Ultimate attack extra effects
        if (this.currentAttack === 'ultimate' && swing > 0.3) {
            ctx.save();
            ctx.globalAlpha = swing * 0.4;
            ctx.fillStyle = '#ff6600';
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 50;
            ctx.beginPath();
            ctx.ellipse(80, 0, 100 * swing, 60 * swing, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    drawWarriorBlock(ctx) {
        // Compact blocking stance
        ctx.fillStyle = '#4a1000';
        ctx.beginPath();
        ctx.roundRect(-18, 30, 16, 45, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(2, 30, 16, 45, 5);
        ctx.fill();

        // Body crouched
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-30, -20, 60, 55, 12);
        ctx.fill();

        // Shield
        ctx.fillStyle = '#8b4513';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(40, -30);
        ctx.lineTo(55, -20);
        ctx.lineTo(55, 25);
        ctx.lineTo(40, 35);
        ctx.lineTo(30, 25);
        ctx.lineTo(30, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Shield glow
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Head tucked
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(-5, -35, 18, 0, Math.PI * 2);
        ctx.fill();

        // Helmet visible
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(-5, -38, 20, Math.PI, 0);
        ctx.fill();
    }

    drawWarriorHit(ctx) {
        const flash = Math.floor(this.animTimer / 3) % 2 === 0;
        const shake = Math.sin(this.animTimer * 0.5) * 5;
        const recoil = Math.min(this.animTimer * 0.3, 1);

        ctx.save();
        ctx.translate(shake, 0);
        ctx.rotate(0.2 + Math.sin(this.animTimer * 0.3) * 0.1);

        // === CAPE crumpled ===
        ctx.fillStyle = flash ? '#ffaaaa' : '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-25, -25);
        ctx.quadraticCurveTo(-40, 20, -35, 60);
        ctx.lineTo(-28, 55);
        ctx.quadraticCurveTo(-30, 15, -22, -20);
        ctx.closePath();
        ctx.fill();

        // === LEGS stumbling ===
        ctx.fillStyle = flash ? '#ffcccc' : '#3d2914';
        ctx.beginPath();
        ctx.roundRect(-25 - recoil * 5, 25, 20, 50, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(5 + recoil * 10, 30, 20, 48, 6);
        ctx.fill();

        // Leg armor
        ctx.fillStyle = flash ? '#ffaa88' : '#cc5500';
        ctx.beginPath();
        ctx.roundRect(-23 - recoil * 5, 30, 16, 22, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(7 + recoil * 10, 35, 16, 22, 4);
        ctx.fill();

        // === BODY recoiling ===
        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.roundRect(-38, -40, 76, 72, 14);
        ctx.fill();

        // Chest damage marks
        if (!flash) {
            ctx.strokeStyle = '#aa3300';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-10, -20);
            ctx.lineTo(10, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(5, -25);
            ctx.lineTo(15, -10);
            ctx.stroke();
        }

        // Shoulder (one drooping)
        ctx.fillStyle = flash ? '#ffaa88' : '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-38, -25, 16, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS flailing ===
        ctx.fillStyle = flash ? '#ffddcc' : '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(-50, -10, 14, 35, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(35, -20 + recoil * 15, 14, 35, 6);
        ctx.fill();

        ctx.restore();

        // === HEAD thrown back ===
        ctx.save();
        ctx.translate(-10 + shake, -52);
        ctx.rotate(-0.2);

        ctx.fillStyle = flash ? '#ffffff' : '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = flash ? '#ffcccc' : this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -4, 24, Math.PI, 0);
        ctx.fill();

        // Pained expression (X eyes)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        // Left X
        ctx.beginPath();
        ctx.moveTo(-10, -2);
        ctx.lineTo(-4, 4);
        ctx.moveTo(-4, -2);
        ctx.lineTo(-10, 4);
        ctx.stroke();
        // Right X
        ctx.beginPath();
        ctx.moveTo(4, -2);
        ctx.lineTo(10, 4);
        ctx.moveTo(10, -2);
        ctx.lineTo(4, 4);
        ctx.stroke();

        // Open mouth
        ctx.fillStyle = '#330000';
        ctx.beginPath();
        ctx.ellipse(0, 12, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // === HIT EFFECTS ===
        // Impact stars
        ctx.save();
        ctx.translate(20, -20);
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + this.animTimer * 0.15;
            const dist = 30 + Math.sin(this.animTimer * 0.3 + i) * 10;

            ctx.fillStyle = i % 2 === 0 ? '#ffff00' : '#ff6600';
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * dist, Math.sin(angle) * dist);
            ctx.lineTo(Math.cos(angle + 0.1) * (dist + 15), Math.sin(angle + 0.1) * (dist + 15));
            ctx.lineTo(Math.cos(angle + 0.2) * dist, Math.sin(angle + 0.2) * dist);
            ctx.fill();
        }
        ctx.restore();

        // Blood/damage particles
        ctx.fillStyle = '#ff3333';
        for (let i = 0; i < 4; i++) {
            const px = 15 + Math.sin(this.animTimer * 0.2 + i * 2) * 20;
            const py = -10 + (this.animTimer * 2 + i * 5) % 40;
            ctx.globalAlpha = 1 - (py + 10) / 50;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawWarriorWalk(ctx) {
        const cycle = this.animTimer * 0.15;
        const legSwing = Math.sin(cycle) * 15;
        const armSwing = Math.sin(cycle) * 0.3;
        const bodyBob = Math.abs(Math.sin(cycle)) * 4;

        // === CAPE flowing ===
        const capeWave = Math.sin(cycle * 0.8) * 8;
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-28, -28 + bodyBob);
        ctx.quadraticCurveTo(-45 + capeWave, 15 + bodyBob, -40 + capeWave * 0.5, 65);
        ctx.lineTo(-30, 60);
        ctx.quadraticCurveTo(-32 + capeWave * 0.3, 10 + bodyBob, -24, -24 + bodyBob);
        ctx.closePath();
        ctx.fill();

        // === LEGS walking cycle ===
        ctx.fillStyle = '#3d2914';
        // Left leg
        ctx.save();
        ctx.translate(-12, 28 + bodyBob);
        ctx.rotate(legSwing * 0.02);
        ctx.beginPath();
        ctx.roundRect(-10, 0, 20, 50, 6);
        ctx.fill();
        // Leg armor
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(-8, 5, 16, 22, 4);
        ctx.fill();
        // Boot
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.roundRect(-12, 45, 24, 12, 4);
        ctx.fill();
        ctx.restore();

        // Right leg
        ctx.fillStyle = '#3d2914';
        ctx.save();
        ctx.translate(12, 28 + bodyBob);
        ctx.rotate(-legSwing * 0.02);
        ctx.beginPath();
        ctx.roundRect(-10, 0, 20, 50, 6);
        ctx.fill();
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.roundRect(-8, 5, 16, 22, 4);
        ctx.fill();
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.roundRect(-12, 45, 24, 12, 4);
        ctx.fill();
        ctx.restore();

        // === TORSO ===
        ctx.save();
        ctx.translate(0, bodyBob);
        ctx.rotate(armSwing * 0.1);

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-36, -40, 72, 72, 14);
        ctx.fill();

        // Chest gradient
        const grad = ctx.createLinearGradient(-36, -40, 36, 32);
        grad.addColorStop(0, 'rgba(255, 200, 150, 0.25)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-36, -40, 72, 72, 14);
        ctx.fill();

        // Belt
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-36, 24, 72, 10, 3);
        ctx.fill();

        ctx.restore();

        // === SHOULDERS ===
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-38, -26 + bodyBob, 16, 12, armSwing, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(38, -26 + bodyBob, 16, 12, -armSwing, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS swinging ===
        ctx.save();
        ctx.translate(-42, -18 + bodyBob);
        ctx.rotate(armSwing);
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 38, 5);
        ctx.fill();
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-7, 32, 14, 12, 4);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(42, -18 + bodyBob);
        ctx.rotate(-armSwing);
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(-6, 0, 12, 38, 5);
        ctx.fill();
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.roundRect(-7, 32, 14, 12, 4);
        ctx.fill();
        ctx.restore();

        // === HEAD ===
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, -58 + bodyBob, 22, 0, Math.PI * 2);
        ctx.fill();

        // Helmet
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -62 + bodyBob, 24, Math.PI, 0);
        ctx.fill();

        // Helmet crest
        ctx.fillStyle = '#aa2200';
        ctx.beginPath();
        ctx.moveTo(0, -88 + bodyBob);
        ctx.lineTo(-5, -62 + bodyBob);
        ctx.lineTo(5, -62 + bodyBob);
        ctx.closePath();
        ctx.fill();

        // Eyes forward
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(-6, -58 + bodyBob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -58 + bodyBob, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dust particles at feet
        ctx.fillStyle = 'rgba(150, 120, 90, 0.5)';
        for (let i = 0; i < 3; i++) {
            const dustX = Math.sin(cycle + i) * 20;
            const dustY = 78 + Math.random() * 5;
            ctx.beginPath();
            ctx.arc(dustX, dustY, 3 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawWarriorJump(ctx) {
        const rise = Math.min(this.animTimer * 0.1, 1);

        // === CAPE flying up ===
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-25, -25);
        ctx.quadraticCurveTo(-50, 30 + rise * 20, -45, 80);
        ctx.lineTo(-35, 75);
        ctx.quadraticCurveTo(-40, 25 + rise * 15, -22, -22);
        ctx.closePath();
        ctx.fill();

        // === LEGS tucked ===
        ctx.fillStyle = '#3d2914';
        ctx.save();
        ctx.rotate(-0.3);
        ctx.beginPath();
        ctx.roundRect(-25, 20, 22, 45, 6);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.3);
        ctx.beginPath();
        ctx.roundRect(5, 20, 22, 45, 6);
        ctx.fill();
        ctx.restore();

        // Leg armor
        ctx.fillStyle = '#cc5500';
        ctx.save();
        ctx.rotate(-0.3);
        ctx.beginPath();
        ctx.roundRect(-23, 25, 18, 20, 4);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.3);
        ctx.beginPath();
        ctx.roundRect(7, 25, 18, 20, 4);
        ctx.fill();
        ctx.restore();

        // === BODY stretched up ===
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-36, -45, 72, 70, 14);
        ctx.fill();

        // Shoulder pads raised
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-42, -35, 18, 14, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(42, -35, 18, 14, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS up ===
        ctx.fillStyle = '#ffcc99';
        ctx.save();
        ctx.translate(-40, -30);
        ctx.rotate(-0.8);
        ctx.beginPath();
        ctx.roundRect(-6, 0, 14, 40, 6);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(40, -30);
        ctx.rotate(0.8);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 14, 40, 6);
        ctx.fill();
        ctx.restore();

        // === SWORD held high ===
        ctx.save();
        ctx.translate(55, -50);
        ctx.rotate(0.5);
        // Handle
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-3, 0, 6, 22, 2);
        ctx.fill();
        // Guard
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.roundRect(-10, -2, 20, 5, 2);
        ctx.fill();
        // Blade
        ctx.fillStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(-3, -5);
        ctx.lineTo(0, -70);
        ctx.lineTo(3, -5);
        ctx.closePath();
        ctx.fill();
        // Blade glow
        ctx.strokeStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, -68);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();

        // === HEAD looking up ===
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, -62, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -66, 24, Math.PI, 0);
        ctx.fill();

        // Crest
        ctx.fillStyle = '#aa2200';
        ctx.beginPath();
        ctx.moveTo(0, -92);
        ctx.lineTo(-5, -66);
        ctx.lineTo(5, -66);
        ctx.closePath();
        ctx.fill();

        // Determined eyes
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(-6, -60, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -60, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Jump trail
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, 80);
        ctx.lineTo(0, 100 + rise * 20);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    drawWarriorFall(ctx) {
        // === CAPE billowing ===
        const wave = Math.sin(this.animTimer * 0.2) * 5;
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-25, -20);
        ctx.quadraticCurveTo(-55 + wave, -40, -50 + wave, -80);
        ctx.lineTo(-40 + wave, -75);
        ctx.quadraticCurveTo(-45 + wave, -35, -22, -18);
        ctx.closePath();
        ctx.fill();

        // === LEGS spread ===
        ctx.fillStyle = '#3d2914';
        ctx.save();
        ctx.rotate(-0.4);
        ctx.beginPath();
        ctx.roundRect(-28, 15, 22, 50, 6);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.rotate(0.4);
        ctx.beginPath();
        ctx.roundRect(8, 15, 22, 50, 6);
        ctx.fill();
        ctx.restore();

        // === BODY bracing ===
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-38, -38, 76, 65, 14);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-40, -25, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(40, -25, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS out for balance ===
        ctx.fillStyle = '#ffcc99';
        ctx.save();
        ctx.translate(-42, -18);
        ctx.rotate(-0.5);
        ctx.beginPath();
        ctx.roundRect(-6, 0, 14, 40, 6);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.translate(42, -18);
        ctx.rotate(0.5);
        ctx.beginPath();
        ctx.roundRect(-8, 0, 14, 40, 6);
        ctx.fill();
        ctx.restore();

        // === HEAD looking down ===
        ctx.save();
        ctx.rotate(0.1);
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, -55, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -59, 24, Math.PI, 0);
        ctx.fill();

        // Crest
        ctx.fillStyle = '#aa2200';
        ctx.beginPath();
        ctx.moveTo(0, -85);
        ctx.lineTo(-5, -59);
        ctx.lineTo(5, -59);
        ctx.closePath();
        ctx.fill();

        // Focused eyes
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.ellipse(-6, -53, 4, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(6, -53, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Wind lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(-30 + i * 20, -80);
            ctx.lineTo(-30 + i * 20, -60);
            ctx.stroke();
        }
    }

    drawWarriorCrouch(ctx) {
        // === CAPE pooling ===
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.moveTo(-22, -5);
        ctx.quadraticCurveTo(-40, 20, -35, 50);
        ctx.lineTo(-25, 48);
        ctx.quadraticCurveTo(-30, 18, -20, -2);
        ctx.closePath();
        ctx.fill();

        // === LEGS bent ===
        ctx.fillStyle = '#3d2914';
        ctx.beginPath();
        ctx.roundRect(-25, 15, 22, 35, 6);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(5, 15, 22, 35, 6);
        ctx.fill();

        // Knee guards visible
        ctx.fillStyle = '#cc5500';
        ctx.beginPath();
        ctx.ellipse(-14, 35, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(16, 35, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // === BODY lowered ===
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-34, -20, 68, 55, 12);
        ctx.fill();

        // Belt
        ctx.fillStyle = '#4a3520';
        ctx.beginPath();
        ctx.roundRect(-34, 25, 68, 10, 3);
        ctx.fill();

        // Shoulders
        ctx.fillStyle = '#dd5500';
        ctx.beginPath();
        ctx.ellipse(-35, -10, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(35, -10, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // === ARMS ready ===
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.roundRect(-42, -5, 12, 30, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(30, -5, 12, 30, 5);
        ctx.fill();

        // === HEAD lowered ===
        ctx.fillStyle = '#ffcc99';
        ctx.beginPath();
        ctx.arc(0, -35, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.arc(0, -38, 22, Math.PI, 0);
        ctx.fill();

        // Eyes alert
        ctx.fillStyle = '#ff6600';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(-5, -33, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(5, -33, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
