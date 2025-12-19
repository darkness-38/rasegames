




class Character {
    constructor(options = {}) {
        
        this.x = options.x || 200;
        this.y = options.y || 400;
        this.width = options.width || 80;
        this.height = options.height || 150;

        
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = options.speed || 6;
        this.jumpForce = options.jumpForce || -15;
        this.isGrounded = false;
        this.canDoubleJump = true;
        this.direction = options.direction || 1; 

        
        this.maxHealth = options.maxHealth || 1000;
        this.health = this.maxHealth;
        this.maxEnergy = 100;
        this.energy = 0;
        this.defense = options.defense || 1.0;

        
        this.isBlocking = false;
        this.isCrouching = false;
        this.isAttacking = false;
        this.isHit = false;
        this.isInvincible = false;
        this.comboCount = 0;
        this.lastComboTime = 0;

        
        this.state = 'idle';
        this.stateTime = 0;
        this.attackCooldown = 0;
        this.hitStun = 0;
        this.blockStun = 0;

        
        this.name = options.name || 'Fighter';
        this.type = options.type || 'warrior';
        this.color = options.color || '#00f0ff';
        this.secondaryColor = options.secondaryColor || '#0088aa';

        
        this.attacks = {
            light: {
                damage: 30,
                knockback: 5,
                duration: 15,
                cooldown: 20,
                hitboxWidth: 60,
                hitboxHeight: 40,
                energyGain: 5
            },
            heavy: {
                damage: 60,
                knockback: 12,
                duration: 25,
                cooldown: 35,
                hitboxWidth: 80,
                hitboxHeight: 50,
                energyGain: 10
            },
            special: {
                damage: 45,
                knockback: 8,
                duration: 30,
                cooldown: 60,
                hitboxWidth: 100,
                hitboxHeight: 60,
                energyCost: 30,
                energyGain: 0
            },
            ultimate: {
                damage: 200,
                knockback: 25,
                duration: 60,
                cooldown: 120,
                hitboxWidth: 150,
                hitboxHeight: 100,
                energyCost: 100,
                energyGain: 0
            }
        };

        
        this.animFrame = 0;
        this.animTimer = 0;

        
        this.projectiles = [];
    }

    update(input, opponent) {
        
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.hitStun > 0) this.hitStun--;
        if (this.blockStun > 0) this.blockStun--;
        this.stateTime++;
        this.animTimer++;

        
        if (this.hitStun > 0) {
            this.state = 'hitstun';
            physics.applyGravity(this);
            physics.applyMovement(this);
            return;
        }

        
        if (this.blockStun > 0) {
            this.state = 'blockstun';
            physics.applyGravity(this);
            physics.applyMovement(this);
            return;
        }

        
        this.handleInput(input, opponent);

        
        physics.applyGravity(this);
        physics.applyMovement(this);

        
        this.updateState();

        
        this.updateProjectiles(opponent);

        
        if (opponent && !this.isAttacking) {
            this.direction = opponent.x > this.x ? 1 : -1;
        }
    }

    handleInput(input, opponent) {
        if (!input) return;

        
        this.isBlocking = input.block && this.isGrounded && !this.isAttacking;

        
        this.isCrouching = input.crouch && this.isGrounded && !this.isAttacking;

        
        if (!this.isAttacking && !this.isBlocking) {
            if (input.left) {
                this.velocityX = -this.speed;
            } else if (input.right) {
                this.velocityX = this.speed;
            }

            
            if (input.jump) {
                if (this.isGrounded) {
                    this.velocityY = this.jumpForce;
                    this.isGrounded = false;
                } else if (this.canDoubleJump) {
                    this.velocityY = this.jumpForce * 0.85;
                    this.canDoubleJump = false;
                }
            }
        }

        
        if (this.attackCooldown <= 0 && !this.isBlocking) {
            if (input.lightAttack) {
                this.startAttack('light');
            } else if (input.heavyAttack) {
                this.startAttack('heavy');
            } else if (input.special) {
                if (this.energy >= 100 && this.isCrouching) {
                    this.startAttack('ultimate');
                } else if (this.energy >= (this.attacks.special.energyCost || 0)) {
                    this.startAttack('special');
                }
            }
        }
    }

    startAttack(type) {
        const attack = this.attacks[type];
        if (!attack) return;

        
        if (attack.energyCost && this.energy < attack.energyCost) return;

        this.isAttacking = true;
        this.currentAttack = type;
        this.attackTimer = attack.duration;
        this.attackCooldown = attack.cooldown;
        this.hasHit = false;

        
        if (attack.energyCost) {
            this.energy -= attack.energyCost;
        }

        this.state = 'attack_' + type;
        this.stateTime = 0;
    }

    updateState() {
        
        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
                this.currentAttack = null;
            }
        }

        
        if (this.hitStun > 0) {
            this.state = 'hitstun';
        } else if (this.blockStun > 0) {
            this.state = 'blockstun';
        } else if (this.isAttacking) {
            this.state = 'attack_' + this.currentAttack;
        } else if (this.isBlocking) {
            this.state = 'block';
        } else if (this.isCrouching) {
            this.state = 'crouch';
        } else if (!this.isGrounded) {
            this.state = this.velocityY < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.velocityX) > 0.5) {
            this.state = 'walk';
        } else {
            this.state = 'idle';
        }

        
        if (this.animTimer >= 6) {
            this.animTimer = 0;
            this.animFrame++;
        }
    }

    getHitbox() {
        if (!this.isAttacking || !this.currentAttack) return null;

        const attack = this.attacks[this.currentAttack];
        if (!attack) return null;

        
        const progress = 1 - (this.attackTimer / attack.duration);
        if (progress < 0.2 || progress > 0.6) return null;

        const hitboxX = this.direction === 1
            ? this.x + this.width
            : this.x - attack.hitboxWidth;

        return {
            x: hitboxX,
            y: this.y + this.height / 2 - attack.hitboxHeight / 2,
            width: attack.hitboxWidth,
            height: attack.hitboxHeight,
            damage: attack.damage,
            knockback: attack.knockback,
            energyGain: attack.energyGain
        };
    }

    takeDamage(damage, knockback, attacker) {
        
        if (this.isBlocking) {
            
            const blockedDamage = Math.floor(damage * 0.1);
            this.health -= blockedDamage;
            this.blockStun = 10;

            
            this.energy = Math.min(this.maxEnergy, this.energy + 3);

            return { blocked: true, damage: blockedDamage };
        }

        
        const finalDamage = Math.floor(damage / this.defense);
        this.health -= finalDamage;
        this.hitStun = Math.floor(20 + knockback);

        
        const knockbackDir = attacker.x < this.x ? 1 : -1;
        physics.applyKnockback(this, knockbackDir, knockback, -knockback * 0.4);

        
        this.isAttacking = false;
        this.currentAttack = null;

        
        this.energy = Math.min(this.maxEnergy, this.energy + 5);

        
        this.comboCount = 0;

        return { blocked: false, damage: finalDamage };
    }

    addCombo() {
        const now = Date.now();
        if (now - this.lastComboTime < 2000) {
            this.comboCount++;
        } else {
            this.comboCount = 1;
        }
        this.lastComboTime = now;

        return this.comboCount;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    addEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    reset(x, direction) {
        this.x = x;
        this.y = physics.groundLevel - this.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.health = this.maxHealth;
        this.energy = 0;
        this.hitStun = 0;
        this.blockStun = 0;
        this.attackCooldown = 0;
        this.isAttacking = false;
        this.isBlocking = false;
        this.isCrouching = false;
        this.comboCount = 0;
        this.direction = direction;
        this.state = 'idle';
        this.projectiles = [];
    }

    updateProjectiles(opponent) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.velocityX;
            proj.life--;

            
            if (physics.checkHitboxCollision(proj, opponent)) {
                opponent.takeDamage(proj.damage, proj.knockback, this);
                this.addEnergy(proj.energyGain || 5);
                this.addCombo();
                this.projectiles.splice(i, 1);
                continue;
            }

            
            if (proj.life <= 0 || proj.x < 0 || proj.x > physics.stageWidth) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    fireProjectile(options) {
        this.projectiles.push({
            x: this.x + (this.direction === 1 ? this.width : -options.width),
            y: this.y + this.height / 2 - options.height / 2,
            width: options.width || 40,
            height: options.height || 30,
            velocityX: this.direction * (options.speed || 10),
            damage: options.damage || 30,
            knockback: options.knockback || 5,
            energyGain: options.energyGain || 5,
            life: options.life || 120,
            color: options.color || this.color
        });
    }

    draw(ctx) {
        
        const sprite = getImage('sprite_' + this.type);
        if (sprite) {
            this.drawSprite(ctx, sprite);
        } else {
            
            this.drawDefault(ctx);
        }

        
        this.drawProjectiles(ctx);
    }

    drawSprite(ctx, sprite) {
        ctx.save();

        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        ctx.translate(centerX, centerY);
        ctx.scale(this.direction, 1);

        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 + 5, this.width / 2 + 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        
        let scaleX = 1;
        let scaleY = 1;
        let offsetY = 0;
        let rotation = 0;

        switch (this.state) {
            case 'idle':
                
                scaleY = 1 + Math.sin(this.animTimer * 0.08) * 0.02;
                offsetY = Math.sin(this.animTimer * 0.08) * 2;
                break;
            case 'walk':
                
                offsetY = Math.abs(Math.sin(this.animTimer * 0.2)) * 5;
                scaleX = 1 + Math.sin(this.animTimer * 0.2) * 0.03;
                break;
            case 'attack_light':
            case 'attack_heavy':
            case 'attack_special':
            case 'attack_ultimate':
                
                const attackProgress = 1 - (this.attackTimer / (this.attacks[this.currentAttack]?.duration || 15));
                scaleX = 1 + Math.sin(attackProgress * Math.PI) * 0.15;
                rotation = Math.sin(attackProgress * Math.PI) * 0.1;
                break;
            case 'jump':
                
                scaleY = 1.1;
                scaleX = 0.95;
                break;
            case 'fall':
                
                scaleY = 0.95;
                scaleX = 1.05;
                break;
            case 'block':
            case 'blockstun':
                
                scaleY = 0.85;
                scaleX = 1.1;
                offsetY = 10;
                break;
            case 'hitstun':
                
                if (Math.floor(this.animTimer / 3) % 2 === 0) {
                    ctx.filter = 'brightness(2) saturate(0)';
                }
                rotation = Math.sin(this.animTimer * 0.5) * 0.1;
                break;
            case 'crouch':
                scaleY = 0.7;
                scaleX = 1.15;
                offsetY = 20;
                break;
        }

        
        ctx.rotate(rotation);
        ctx.scale(scaleX, scaleY);

        
        const drawHeight = this.height * 1.8;
        const aspectRatio = sprite.width / sprite.height;
        const drawWidth = drawHeight * aspectRatio;

        ctx.drawImage(
            sprite,
            -drawWidth / 2, -drawHeight / 2 + offsetY - 15,
            drawWidth, drawHeight
        );

        
        ctx.filter = 'none';

        ctx.restore();
    }

    drawDefault(ctx) {
        ctx.save();

        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        
        ctx.translate(centerX, centerY);
        ctx.scale(this.direction, 1);

        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, this.height / 2 + 5, this.width / 2, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        
        switch (this.state) {
            case 'hitstun':
                this.drawHitState(ctx);
                break;
            case 'block':
            case 'blockstun':
                this.drawBlockState(ctx);
                break;
            case 'crouch':
                this.drawCrouchState(ctx);
                break;
            case 'attack_light':
            case 'attack_heavy':
            case 'attack_special':
            case 'attack_ultimate':
                this.drawAttackState(ctx);
                break;
            case 'jump':
            case 'fall':
                this.drawAirState(ctx);
                break;
            case 'walk':
                this.drawWalkState(ctx);
                break;
            default:
                this.drawIdleState(ctx);
        }

        ctx.restore();
    }

    drawIdleState(ctx) {
        
        const bobY = Math.sin(this.animTimer * 0.1) * 3;

        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 10, -this.height / 2 + bobY + 15, this.width - 20, this.height - 30, 10);
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + bobY + 5, 25, 0, Math.PI * 2);
        ctx.fill();

        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawWalkState(ctx) {
        const walkCycle = Math.sin(this.animTimer * 0.3) * 10;

        
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(-15 + walkCycle, 20, 15, 55, 5);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(0 - walkCycle, 20, 15, 55, 5);
        ctx.fill();

        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 10, -this.height / 2 + 15, this.width - 20, this.height - 50, 10);
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 5, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawAirState(ctx) {
        const stretch = this.velocityY < 0 ? -5 : 5;

        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 10, -this.height / 2 + 15 - stretch, this.width - 20, this.height - 30 + stretch * 2, 10);
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 5 - stretch, 25, 0, Math.PI * 2);
        ctx.fill();

        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawAttackState(ctx) {
        const attackProgress = 1 - (this.attackTimer / this.attacks[this.currentAttack]?.duration || 0);
        const punchExtend = Math.sin(attackProgress * Math.PI) * 40;

        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 10, -this.height / 2 + 15, this.width - 20, this.height - 30, 10);
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 5, 25, 0, Math.PI * 2);
        ctx.fill();

        
        ctx.fillStyle = this.secondaryColor;
        ctx.beginPath();
        ctx.roundRect(this.width / 2 - 10, -10, 20 + punchExtend, 20, 10);
        ctx.fill();

        
        if (punchExtend > 20) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.8;

            
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(30 + punchExtend - 20 - i * 10, -5 + i * 5);
                ctx.lineTo(60 + punchExtend, -5 + i * 5);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }

        
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 25;
    }

    drawHitState(ctx) {
        
        const flash = Math.floor(this.animTimer / 2) % 2 === 0;

        ctx.fillStyle = flash ? '#ffffff' : this.color;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 10, -this.height / 2 + 20, this.width - 20, this.height - 30, 10);
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, -this.height / 2 + 10, 25, 0, Math.PI * 2);
        ctx.fill();

        
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 20;
        ctx.stroke();
    }

    drawBlockState(ctx) {
        
        ctx.fillStyle = this.secondaryColor;

        
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 5, -this.height / 2 + 25, this.width - 10, this.height - 40, 10);
        ctx.fill();

        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(10, 0, 40, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(-5, -this.height / 2 + 20, 22, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCrouchState(ctx) {
        
        ctx.fillStyle = this.color;

        
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 10, 0, this.width - 20, this.height / 2 - 10, 10);
        ctx.fill();

        
        ctx.beginPath();
        ctx.arc(0, -15, 25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawProjectiles(ctx) {
        for (const proj of this.projectiles) {
            ctx.save();
            ctx.translate(proj.x + proj.width / 2, proj.y + proj.height / 2);

            
            ctx.shadowColor = proj.color;
            ctx.shadowBlur = 20;

            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.ellipse(0, 0, proj.width / 2, proj.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();

            
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, proj.width / 4, proj.height / 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}
