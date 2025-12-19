// ===================================
// PHYSICS ENGINE
// Gravity, collision, and movement
// ===================================

class Physics {
    constructor() {
        this.gravity = 0.6;
        this.friction = 0.85;
        this.groundLevel = 0; // Will be set by game
        this.platformHeight = 50;
        this.stageWidth = 0;
        this.stageHeight = 0;
        this.stagePadding = 100;
    }

    setStageSize(width, height) {
        this.stageWidth = width;
        this.stageHeight = height;
        this.groundLevel = height - 100; // Ground 100px from bottom
    }

    applyGravity(entity) {
        if (!entity.isGrounded) {
            entity.velocityY += this.gravity;
        }
    }

    applyMovement(entity) {
        // Apply velocity
        entity.x += entity.velocityX;
        entity.y += entity.velocityY;

        // Apply friction when grounded
        if (entity.isGrounded) {
            entity.velocityX *= this.friction;
        }

        // Check ground collision
        if (entity.y + entity.height >= this.groundLevel) {
            entity.y = this.groundLevel - entity.height;
            entity.velocityY = 0;
            entity.isGrounded = true;
            entity.canDoubleJump = true;
        } else {
            entity.isGrounded = false;
        }

        // Stage boundaries
        if (entity.x < this.stagePadding) {
            entity.x = this.stagePadding;
            entity.velocityX = 0;
        }
        if (entity.x + entity.width > this.stageWidth - this.stagePadding) {
            entity.x = this.stageWidth - this.stagePadding - entity.width;
            entity.velocityX = 0;
        }

        // Ceiling
        if (entity.y < 0) {
            entity.y = 0;
            entity.velocityY = 0;
        }
    }

    checkHitboxCollision(hitbox, target) {
        // hitbox = {x, y, width, height}
        // target = entity with x, y, width, height

        return (
            hitbox.x < target.x + target.width &&
            hitbox.x + hitbox.width > target.x &&
            hitbox.y < target.y + target.height &&
            hitbox.y + hitbox.height > target.y
        );
    }

    getDistance(entity1, entity2) {
        const cx1 = entity1.x + entity1.width / 2;
        const cy1 = entity1.y + entity1.height / 2;
        const cx2 = entity2.x + entity2.width / 2;
        const cy2 = entity2.y + entity2.height / 2;

        return Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
    }

    applyKnockback(entity, direction, force, verticalForce = 0) {
        entity.velocityX = direction * force;
        entity.velocityY = verticalForce || -force * 0.5;
        entity.isGrounded = false;
    }

    pushApart(entity1, entity2) {
        // Prevent characters from overlapping
        const overlap = (entity1.x + entity1.width) - entity2.x;

        if (entity1.x < entity2.x && overlap > 0 && overlap < entity1.width) {
            const pushForce = overlap / 2;
            entity1.x -= pushForce;
            entity2.x += pushForce;
        } else if (entity1.x > entity2.x) {
            const overlap2 = (entity2.x + entity2.width) - entity1.x;
            if (overlap2 > 0 && overlap2 < entity2.width) {
                const pushForce = overlap2 / 2;
                entity1.x += pushForce;
                entity2.x -= pushForce;
            }
        }
    }
}

// Global physics instance
const physics = new Physics();
