




class CombatSystem {
    constructor() {
        this.hitEffects = [];
        this.damageNumbers = [];
        this.comboTimers = { p1: 0, p2: 0 };
    }

    update(player1, player2) {
        
        this.checkAttack(player1, player2, 1);

        
        this.checkAttack(player2, player1, 2);

        
        physics.pushApart(player1, player2);

        
        this.updateEffects();

        
        if (this.comboTimers.p1 > 0) this.comboTimers.p1--;
        if (this.comboTimers.p2 > 0) this.comboTimers.p2--;
    }

    checkAttack(attacker, defender, attackerNum) {
        const hitbox = attacker.getHitbox();

        if (hitbox && !attacker.hasHit) {
            if (physics.checkHitboxCollision(hitbox, defender)) {
                
                const result = defender.takeDamage(hitbox.damage, hitbox.knockback, attacker);
                attacker.hasHit = true;

                
                attacker.addEnergy(hitbox.energyGain || 0);

                
                const comboCount = attacker.addCombo();

                
                this.createHitEffect(
                    defender.x + defender.width / 2,
                    defender.y + defender.height / 2,
                    result.blocked,
                    hitbox.damage
                );

                
                this.createDamageNumber(
                    defender.x + defender.width / 2,
                    defender.y,
                    result.damage,
                    result.blocked,
                    comboCount
                );

                
                const comboKey = attackerNum === 1 ? 'p1' : 'p2';
                this.comboTimers[comboKey] = 120; 

                return true;
            }
        }

        return false;
    }

    createHitEffect(x, y, blocked, damage) {
        const effect = {
            x,
            y,
            blocked,
            damage,
            life: 15,
            maxLife: 15,
            particles: []
        };

        
        const particleCount = blocked ? 5 : 10 + Math.floor(damage / 20);
        for (let i = 0; i < particleCount; i++) {
            effect.particles.push({
                x: 0,
                y: 0,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: 3 + Math.random() * 5,
                color: blocked ? '#00ff88' : '#ff4444'
            });
        }

        this.hitEffects.push(effect);
    }

    createDamageNumber(x, y, damage, blocked, combo) {
        this.damageNumbers.push({
            x,
            y,
            damage,
            blocked,
            combo,
            life: 60,
            maxLife: 60,
            vy: -3
        });
    }

    updateEffects() {
        
        for (let i = this.hitEffects.length - 1; i >= 0; i--) {
            const effect = this.hitEffects[i];
            effect.life--;

            for (const particle of effect.particles) {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.3; 
                particle.size *= 0.95;
            }

            if (effect.life <= 0) {
                this.hitEffects.splice(i, 1);
            }
        }

        
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const num = this.damageNumbers[i];
            num.life--;
            num.y += num.vy;
            num.vy *= 0.95;

            if (num.life <= 0) {
                this.damageNumbers.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        
        for (const effect of this.hitEffects) {
            const alpha = effect.life / effect.maxLife;

            ctx.save();
            ctx.translate(effect.x, effect.y);
            ctx.globalAlpha = alpha;

            
            for (const particle of effect.particles) {
                ctx.fillStyle = particle.color;
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }

            
            if (effect.life > effect.maxLife - 5) {
                ctx.fillStyle = effect.blocked ? 'rgba(0, 255, 136, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(0, 0, 30 * (effect.maxLife - effect.life) / 5, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        
        for (const num of this.damageNumbers) {
            const alpha = Math.min(1, num.life / 30);
            const scale = 1 + (1 - num.life / num.maxLife) * 0.5;

            ctx.save();
            ctx.translate(num.x, num.y);
            ctx.scale(scale, scale);
            ctx.globalAlpha = alpha;

            
            ctx.font = 'bold 28px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(num.damage, 2, 2);

            
            if (num.blocked) {
                ctx.fillStyle = '#00ff88';
                ctx.fillText('BLOCKED', 0, 0);
            } else {
                ctx.fillStyle = num.damage >= 100 ? '#ff4444' : '#ffffff';
                ctx.shadowColor = num.damage >= 100 ? '#ff4444' : '#ffaa00';
                ctx.shadowBlur = 10;
                ctx.fillText(num.damage, 0, 0);

                
                if (num.combo > 1) {
                    ctx.font = 'bold 18px Orbitron';
                    ctx.fillStyle = '#ffaa00';
                    ctx.fillText(`${num.combo} HIT!`, 0, 25);
                }
            }

            ctx.restore();
        }
    }

    reset() {
        this.hitEffects = [];
        this.damageNumbers = [];
        this.comboTimers = { p1: 0, p2: 0 };
    }

    getComboCount(playerNum) {
        const key = playerNum === 1 ? 'p1' : 'p2';
        return this.comboTimers[key] > 0;
    }
}


const combatSystem = new CombatSystem();
