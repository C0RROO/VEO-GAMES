// Visual Effects System

class EffectsManager {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
    }

    // Create hit effect particles
    createHitEffect(position, color = 0xffaa00) {
        const particleCount = 8;
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: color });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.5;

            // Random velocity
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = randomFloat(2, 4);
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: randomFloat(2, 4),
                z: Math.sin(angle) * speed
            };

            particle.lifetime = 0.5;
            particle.maxLifetime = 0.5;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    // Create death explosion effect
    createDeathEffect(position, color = 0xff4444) {
        const particleCount = 20;
        const geometry = new THREE.SphereGeometry(0.15, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: color });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.5;

            // Random velocity in all directions
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = randomFloat(3, 6);

            particle.velocity = {
                x: Math.sin(phi) * Math.cos(theta) * speed,
                y: randomFloat(3, 6),
                z: Math.sin(phi) * Math.sin(theta) * speed
            };

            particle.lifetime = 1.0;
            particle.maxLifetime = 1.0;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    // Create level up effect
    createLevelUpEffect(position) {
        const particleCount = 30;
        const geometry = new THREE.SphereGeometry(0.12, 4, 4);

        for (let i = 0; i < particleCount; i++) {
            const hue = i / particleCount;
            const color = hslToRgb(hue, 1.0, 0.6);
            const material = new THREE.MeshBasicMaterial({ color: color });

            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.5;

            // Spiral upward
            const angle = (Math.PI * 2 * i) / particleCount;
            const radius = 2;

            particle.velocity = {
                x: Math.cos(angle) * radius,
                y: randomFloat(4, 6),
                z: Math.sin(angle) * radius
            };

            particle.lifetime = 1.5;
            particle.maxLifetime = 1.5;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    // Create coin collection effect
    createCoinEffect(position) {
        const particleCount = 12;
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.3;

            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = randomFloat(1, 2);

            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: randomFloat(2, 3),
                z: Math.sin(angle) * speed
            };

            particle.lifetime = 0.6;
            particle.maxLifetime = 0.6;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    // Create ultimate activation effect
    createUltimateEffect(position) {
        const particleCount = 40;
        const geometry = new THREE.SphereGeometry(0.15, 6, 6);

        for (let i = 0; i < particleCount; i++) {
            const hue = 0.75; // Purple/blue
            const color = hslToRgb(hue, 1.0, 0.6);
            const material = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.95
            });

            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.5;

            // Spiral outward and upward
            const angle = (Math.PI * 2 * i) / particleCount;
            const radius = 3;
            const spiralSpeed = 2;

            particle.velocity = {
                x: Math.cos(angle) * radius,
                y: randomFloat(5, 8),
                z: Math.sin(angle) * radius
            };

            particle.angularVelocity = spiralSpeed;
            particle.angle = angle;

            particle.lifetime = 1.2;
            particle.maxLifetime = 1.2;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createDashEffect(position) {
        const particleCount = 24;
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x60a5fa });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.5;

            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = randomFloat(3, 7);
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: randomFloat(1, 2.5),
                z: Math.sin(angle) * speed
            };

            particle.lifetime = 0.35;
            particle.maxLifetime = 0.35;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createShieldRechargeEffect(position) {
        const particleCount = 18;
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.7;

            const angle = (Math.PI * 2 * i) / particleCount;
            particle.velocity = {
                x: Math.cos(angle) * 1.8,
                y: randomFloat(2, 4),
                z: Math.sin(angle) * 1.8
            };

            particle.lifetime = 0.7;
            particle.maxLifetime = 0.7;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createDamageBoostEffect(position) {
        const particleCount = 22;
        const geometry = new THREE.SphereGeometry(0.09, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color: 0xf97316 });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.6;

            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = randomFloat(2, 5);
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: randomFloat(2, 5),
                z: Math.sin(angle) * speed
            };

            particle.lifetime = 0.8;
            particle.maxLifetime = 0.8;

            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createSlowFieldEffect(position, radius) {
        const ringGeometry = new THREE.TorusGeometry(radius, 0.08, 8, 48);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.65
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.position.y = 0.08;
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        let time = 0;
        const duration = 0.7;
        const animate = () => {
            time += 0.016;
            const t = time / duration;
            if (t >= 1) {
                this.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
                return;
            }

            const scale = 1 + t * 0.35;
            ring.scale.set(scale, scale, scale);
            ringMaterial.opacity = (1 - t) * 0.65;
            requestAnimationFrame(animate);
        };
        animate();
    }

    createGroundWarning(position, radius, color = 0xff8844, duration = 0.9) {
        const ringGeometry = new THREE.RingGeometry(radius * 0.7, radius, 36);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.55,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(position.x, 0.06, position.z);
        this.scene.add(ring);

        let t = 0;
        const animate = () => {
            t += 0.016;
            const p = t / duration;
            if (p >= 1) {
                this.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
                return;
            }
            ringMaterial.opacity = 0.2 + (1 - p) * 0.6;
            ring.scale.setScalar(1 + p * 0.15);
            requestAnimationFrame(animate);
        };
        animate();
    }

    createShockwaveBurst(position, radius) {
        this.createGroundWarning(position, radius, 0xa78bfa, 0.45);
        const particleCount = 26;
        const geometry = new THREE.SphereGeometry(0.1, 5, 5);
        const material = new THREE.MeshBasicMaterial({ color: 0xc4b5fd });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);
            particle.position.y = 0.5;
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = randomFloat(4, 7);
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: randomFloat(1.2, 3),
                z: Math.sin(angle) * speed
            };
            particle.lifetime = 0.45;
            particle.maxLifetime = 0.45;
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createProjectileTrail(position, color = 0x7dd3fc) {
        const geometry = new THREE.SphereGeometry(0.06, 4, 4);
        const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.lifetime = 0.2;
        particle.maxLifetime = 0.2;
        particle.velocity = { x: 0, y: 0, z: 0 };
        this.scene.add(particle);
        this.particles.push(particle);
    }

    createFrostAuraTick(position, radius = 1.2) {
        const particleCount = 6;
        const geometry = new THREE.SphereGeometry(0.05, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: 0x99f6e4,
            transparent: true,
            opacity: 0.85
        });

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const ringRadius = radius * randomFloat(0.55, 1.05);
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(
                position.x + Math.cos(angle) * ringRadius,
                0.25 + Math.random() * 0.45,
                position.z + Math.sin(angle) * ringRadius
            );
            particle.velocity = {
                x: Math.cos(angle) * randomFloat(0.25, 0.7),
                y: randomFloat(0.6, 1.5),
                z: Math.sin(angle) * randomFloat(0.25, 0.7)
            };
            particle.lifetime = 0.45;
            particle.maxLifetime = 0.45;
            this.scene.add(particle);
            this.particles.push(particle);
        }
    }

    createShockwavePulse(position, radius, color = 0xc4b5fd) {
        const ringGeometry = new THREE.RingGeometry(0.5, 0.8, 48);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(position.x, 0.08, position.z);
        this.scene.add(ring);

        let t = 0;
        const duration = 0.42;
        const animate = () => {
            t += 0.016;
            const p = t / duration;
            if (p >= 1) {
                this.scene.remove(ring);
                ringGeometry.dispose();
                ringMaterial.dispose();
                return;
            }
            const currentRadius = 0.8 + (radius * 1.15 - 0.8) * p;
            ring.scale.set(currentRadius, currentRadius, 1);
            ringMaterial.opacity = (1 - p) * 0.9;
            requestAnimationFrame(animate);
        };
        animate();
    }

    // Update all particles
    update(deltaTime) {
        const gravity = -9.8;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];

            // Update lifetime
            particle.lifetime -= deltaTime;

            if (particle.lifetime <= 0) {
                // Remove particle
                this.scene.remove(particle);
                this.particles.splice(i, 1);
                continue;
            }

            // Apply velocity
            particle.position.x += particle.velocity.x * deltaTime;
            particle.position.y += particle.velocity.y * deltaTime;
            particle.position.z += particle.velocity.z * deltaTime;

            // Spiral effect for ultimate particles
            if (particle.angularVelocity) {
                particle.angle += particle.angularVelocity * deltaTime;
                const radius = 2 * (1 - particle.lifetime / particle.maxLifetime);
                particle.position.x += Math.cos(particle.angle) * radius * deltaTime;
                particle.position.z += Math.sin(particle.angle) * radius * deltaTime;
            }

            // Apply gravity
            particle.velocity.y += gravity * deltaTime;

            // Fade out
            const alpha = particle.lifetime / particle.maxLifetime;
            particle.material.opacity = alpha;
            particle.material.transparent = true;

            // Shrink
            const scale = alpha;
            particle.scale.set(scale, scale, scale);
        }
    }

    // Clear all particles
    clear() {
        for (const particle of this.particles) {
            this.scene.remove(particle);
        }
        this.particles = [];
    }
}
