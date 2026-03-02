// Coin Class

class Coin {
    constructor(scene, position) {
        this.scene = scene;
        this.value = 1;
        this.collected = false;

        // Create mesh
        this.createMesh(position);
    }

    createMesh(position) {
        // Simple rotating coin (cylinder)
        const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xfbbf24,
            emissive: 0xfbbf24,
            emissiveIntensity: 0.5,
            shininess: 100
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.position.y = 0.5; // Increased from 0.3
        this.mesh.rotation.x = Math.PI / 2;

        this.scene.add(this.mesh);
    }

    update(deltaTime, isAttracted = false) {
        if (this.collected) return;

        // Rotate coin
        this.mesh.rotation.z += deltaTime * 3;

        // Bob up and down unless currently magnetized.
        if (!isAttracted) {
            this.mesh.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.15;
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

// Coin Manager
class CoinManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.coins = [];
        this.collectionRadius = 1.0;
    }

    update(deltaTime) {
        const playerPos = this.player.getPosition();
        const magnetRadius = this.player.getCoinMagnetRadius
            ? this.player.getCoinMagnetRadius()
            : this.collectionRadius;
        const pullStrength = this.player.coinMagnetPullStrength || 8;
        let anyAttracted = false;

        // Update all coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const coinPos = coin.getPosition();
            const initialDistance = distance2D(playerPos, coinPos);
            const inMagnetZone = initialDistance < magnetRadius;
            anyAttracted = anyAttracted || inMagnetZone;

            coin.update(deltaTime, inMagnetZone);

            if (inMagnetZone) {
                const dir = normalize2D(playerPos.x - coinPos.x, playerPos.z - coinPos.z);
                const t = 1 - (initialDistance / Math.max(0.01, magnetRadius));
                const speed = 3.5 + pullStrength * Math.max(0.1, t);

                coin.mesh.position.x += dir.x * speed * deltaTime;
                coin.mesh.position.z += dir.z * speed * deltaTime;
                coin.mesh.position.y = lerp(coin.mesh.position.y, 0.62, Math.min(1, deltaTime * 10));
            }

            // Check for collection
            if (!coin.collected) {
                const distance = distance2D(playerPos, coin.getPosition());
                if (distance < this.collectionRadius) {
                    coin.collect();
                    this.player.addCoins(coin.value);

                    // Remove coin after a short delay
                    setTimeout(() => {
                        coin.destroy();
                    }, 100);

                    this.coins.splice(i, 1);

                    return coin; // Return collected coin for effects
                }
            }
        }

        this.player.coinMagnetPulse = anyAttracted ? 1 : Math.max(0, this.player.coinMagnetPulse || 0);

        return null;
    }

    spawnCoin(position) {
        const coin = new Coin(this.scene, position);
        this.coins.push(coin);
    }

    clear() {
        for (const coin of this.coins) {
            coin.destroy();
        }
        this.coins = [];
    }

    reset() {
        this.clear();
    }
}
