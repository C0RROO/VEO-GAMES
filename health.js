// Health Pickup (Heart) Class

class HealthPickup {
    constructor(scene, position) {
        this.scene = scene;
        this.healAmount = 30; // Heals 30 HP
        this.collected = false;

        // Create mesh
        this.createMesh(position);
    }

    createMesh(position) {
        // Create heart group
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.6; // Increased from 0.4

        // Heart made from two spheres and a rotated cube
        const heartMaterial = new THREE.MeshPhongMaterial({
            color: 0xff1744,
            emissive: 0xff1744,
            emissiveIntensity: 0.5,
            shininess: 50
        });

        // Left sphere
        const leftSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            heartMaterial
        );
        leftSphere.position.set(-0.12, 0.15, 0);
        leftSphere.scale.set(1, 1.2, 0.8);
        this.mesh.add(leftSphere);

        // Right sphere
        const rightSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 8, 8),
            heartMaterial
        );
        rightSphere.position.set(0.12, 0.15, 0);
        rightSphere.scale.set(1, 1.2, 0.8);
        this.mesh.add(rightSphere);

        // Bottom point (rotated box)
        const bottomBox = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.2),
            heartMaterial
        );
        bottomBox.position.set(0, -0.05, 0);
        bottomBox.rotation.z = Math.PI / 4;
        this.mesh.add(bottomBox);

        // Glow effect (larger transparent sphere)
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 8, 8),
            glowMaterial
        );
        this.mesh.add(glow);
        this.glow = glow;

        this.scene.add(this.mesh);
    }

    update(deltaTime) {
        if (this.collected) return;

        // Rotate heart
        this.mesh.rotation.y += deltaTime * 2;

        // Bob up and down
        this.mesh.position.y = 0.6 + Math.sin(Date.now() * 0.004) * 0.2; // Increased amplitude

        // Pulse glow
        if (this.glow) {
            const pulse = Math.sin(Date.now() * 0.006) * 0.5 + 0.5;
            this.glow.scale.setScalar(1 + pulse * 0.3);
            this.glow.material.opacity = 0.2 + pulse * 0.2;
        }
    }

    getPosition() {
        return this.mesh.position;
    }

    collect() {
        this.collected = true;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

// Health Pickup Manager
class HealthPickupManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.pickups = [];
        this.collectionRadius = 1.0;
        this.dropChance = 0.15; // 15% chance to drop from enemy
    }

    update(deltaTime, overrideCollectionRadius = null) {
        const playerPos = this.player.getPosition();
        const radius = overrideCollectionRadius ?? this.collectionRadius;

        // Update all health pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.update(deltaTime);

            // Check for collection
            if (!pickup.collected) {
                const distance = distance2D(playerPos, pickup.getPosition());
                if (distance < radius) {
                    pickup.collect();

                    // Heal player
                    const oldHealth = this.player.health;
                    this.player.health = Math.min(this.player.maxHealth, this.player.health + pickup.healAmount);
                    const actualHeal = this.player.health - oldHealth;

                    // Remove pickup after a short delay
                    setTimeout(() => {
                        pickup.destroy();
                    }, 100);

                    this.pickups.splice(i, 1);

                    return { pickup, healAmount: actualHeal }; // Return for effects
                }
            }
        }

        return null;
    }

    trySpawnPickup(position, bonusChance = 0) {
        // Random chance to spawn health pickup
        const chance = clamp(this.dropChance + bonusChance, 0, 0.9);
        if (Math.random() < chance) {
            const pickup = new HealthPickup(this.scene, position);
            this.pickups.push(pickup);
            return true;
        }
        return false;
    }

    clear() {
        for (const pickup of this.pickups) {
            pickup.destroy();
        }
        this.pickups = [];
    }

    reset() {
        this.clear();
    }
}
