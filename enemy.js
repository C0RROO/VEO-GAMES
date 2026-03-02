// Enemy Class

class Enemy {
    constructor(scene, position, level, type = 'crawler', isMini = false) {
        this.scene = scene;
        this.level = level;
        this.type = type;
        this.isMini = isMini;

        this.config = this.getTypeConfig(type, isMini);

        // Stats based on level and enemy type
        this.maxHealth = Math.floor((30 + (level * 10)) * this.config.healthMultiplier);
        this.health = this.maxHealth;
        this.damage = Math.floor((5 + (level * 2)) * this.config.damageMultiplier);
        this.moveSpeed = (2 + (level * 0.1)) * this.config.speedMultiplier;
        this.attackRange = this.config.attackRange;
        this.attackCooldown = this.config.attackCooldown;
        this.lastAttackTime = 0;
        this.hitRadius = this.config.hitRadius ?? 0.5;

        // Rewards
        this.xpReward = Math.floor((20 + (level * 5)) * this.config.xpMultiplier);
        this.coinDropMin = this.config.coinDropMin;
        this.coinDropMax = this.config.coinDropMax;
        this.healthDropBonus = this.config.healthDropBonus;

        // State
        this.isDead = false;
        this.knockbackVelocity = { x: 0, z: 0 };
        this.hitFlashTime = 0;
        this.baseEmissiveIntensity = this.config.baseEmissiveIntensity;

        // Type behavior state
        this.dashTimer = randomFloat(0, 2);
        this.isDashing = false;
        this.dashTime = 0;
        this.dashDirection = { x: 0, z: 0 };
        this.behaviorSeed = Math.random() * Math.PI * 2;

        // Create mesh
        this.createMesh(position);
    }

    getTypeConfig(type, isMini) {
        if (isMini) {
            return {
                healthMultiplier: 0.45,
                damageMultiplier: 0.7,
                speedMultiplier: 1.35,
                attackRange: 1.2,
                attackCooldown: 1.2,
                xpMultiplier: 0.55,
                coinDropMin: 0,
                coinDropMax: 1,
                healthDropBonus: -0.08,
                colorHue: 0.02,
                colorSaturation: 0.9,
                lightnessOffset: 0.06,
                coreColor: 0xff8844,
                scale: 0.72,
                hitRadius: 0.38,
                canSplit: false,
                baseEmissiveIntensity: 0.28,
                eyeColor: 0xffee88,
                spikeScale: 0.8
            };
        }

        switch (type) {
            case 'brute':
                return {
                    healthMultiplier: 2.2,
                    damageMultiplier: 1.3,
                    speedMultiplier: 0.62,
                    attackRange: 1.8,
                    attackCooldown: 1.35,
                    xpMultiplier: 1.6,
                    coinDropMin: 2,
                    coinDropMax: 4,
                    healthDropBonus: 0.08,
                    colorHue: 0.0,
                    colorSaturation: 0.95,
                    lightnessOffset: -0.1,
                    coreColor: 0xff3300,
                    scale: 1.28,
                    hitRadius: 0.76,
                    canSplit: false,
                    baseEmissiveIntensity: 0.36,
                    eyeColor: 0xffcc44,
                    spikeScale: 1.25
                };
            case 'dasher':
                return {
                    healthMultiplier: 0.95,
                    damageMultiplier: 1.05,
                    speedMultiplier: 1.15,
                    attackRange: 1.35,
                    attackCooldown: 0.9,
                    xpMultiplier: 1.2,
                    coinDropMin: 1,
                    coinDropMax: 3,
                    healthDropBonus: 0,
                    colorHue: 0.62,
                    colorSaturation: 0.92,
                    lightnessOffset: 0.04,
                    coreColor: 0x60a5fa,
                    scale: 0.92,
                    hitRadius: 0.5,
                    canSplit: false,
                    baseEmissiveIntensity: 0.32,
                    eyeColor: 0x93c5fd,
                    spikeScale: 0.85
                };
            case 'splitter':
                return {
                    healthMultiplier: 1.1,
                    damageMultiplier: 0.9,
                    speedMultiplier: 0.95,
                    attackRange: 1.45,
                    attackCooldown: 1.0,
                    xpMultiplier: 1.25,
                    coinDropMin: 1,
                    coinDropMax: 3,
                    healthDropBonus: 0.03,
                    colorHue: 0.12,
                    colorSaturation: 0.9,
                    lightnessOffset: 0.02,
                    coreColor: 0xffb020,
                    scale: 0.96,
                    hitRadius: 0.52,
                    canSplit: true,
                    baseEmissiveIntensity: 0.3,
                    eyeColor: 0xfff08a,
                    spikeScale: 1.0
                };
            case 'bomber':
                return {
                    healthMultiplier: 0.8,
                    damageMultiplier: 1.7,
                    speedMultiplier: 1.05,
                    attackRange: 1.35,
                    attackCooldown: 2.1,
                    xpMultiplier: 1.35,
                    coinDropMin: 2,
                    coinDropMax: 4,
                    healthDropBonus: -0.02,
                    colorHue: 0.92,
                    colorSaturation: 0.95,
                    lightnessOffset: 0.03,
                    coreColor: 0xfb7185,
                    scale: 0.9,
                    hitRadius: 0.5,
                    canSplit: false,
                    baseEmissiveIntensity: 0.4,
                    eyeColor: 0xffd1dc,
                    spikeScale: 0.95
                };
            case 'sniper':
                return {
                    healthMultiplier: 0.68,
                    damageMultiplier: 1.05,
                    speedMultiplier: 0.95,
                    attackRange: 8.4,
                    attackCooldown: 2.8,
                    xpMultiplier: 1.4,
                    coinDropMin: 2,
                    coinDropMax: 5,
                    healthDropBonus: 0,
                    colorHue: 0.56,
                    colorSaturation: 0.85,
                    lightnessOffset: 0.06,
                    coreColor: 0x60a5fa,
                    scale: 0.82,
                    hitRadius: 0.44,
                    canSplit: false,
                    baseEmissiveIntensity: 0.38,
                    eyeColor: 0xb6e3ff,
                    spikeScale: 0.88
                };
            case 'stomper':
                return {
                    healthMultiplier: 0.92,
                    damageMultiplier: 2.7,
                    speedMultiplier: 0.34,
                    attackRange: 2.2,
                    attackCooldown: 3.2,
                    xpMultiplier: 1.7,
                    coinDropMin: 2,
                    coinDropMax: 5,
                    healthDropBonus: 0.02,
                    colorHue: 0.03,
                    colorSaturation: 0.88,
                    lightnessOffset: -0.04,
                    coreColor: 0xff6b35,
                    scale: 1.2,
                    hitRadius: 0.72,
                    canSplit: false,
                    baseEmissiveIntensity: 0.4,
                    eyeColor: 0xffd8a8,
                    spikeScale: 1.25
                };
            case 'crusher':
                return {
                    healthMultiplier: 3.1,
                    damageMultiplier: 2.4,
                    speedMultiplier: 0.48,
                    attackRange: 1.9,
                    attackCooldown: 1.85,
                    xpMultiplier: 2.0,
                    coinDropMin: 3,
                    coinDropMax: 6,
                    healthDropBonus: 0.12,
                    colorHue: 0.0,
                    colorSaturation: 0.92,
                    lightnessOffset: -0.18,
                    coreColor: 0xff3b30,
                    scale: 1.42,
                    hitRadius: 0.84,
                    canSplit: false,
                    baseEmissiveIntensity: 0.45,
                    eyeColor: 0xffdd8c,
                    spikeScale: 1.45
                };
            case 'elite':
                return {
                    healthMultiplier: 2.8,
                    damageMultiplier: 1.65,
                    speedMultiplier: 1.0,
                    attackRange: 1.9,
                    attackCooldown: 0.85,
                    xpMultiplier: 2.6,
                    coinDropMin: 4,
                    coinDropMax: 7,
                    healthDropBonus: 0.18,
                    colorHue: 0.82,
                    colorSaturation: 0.9,
                    lightnessOffset: -0.02,
                    coreColor: 0xc084fc,
                    scale: 1.34,
                    hitRadius: 0.78,
                    canSplit: false,
                    baseEmissiveIntensity: 0.42,
                    eyeColor: 0xf5d0fe,
                    spikeScale: 1.35
                };
            case 'crawler':
            default:
                return {
                    healthMultiplier: 1.0,
                    damageMultiplier: 1.0,
                    speedMultiplier: 1.0,
                    attackRange: 1.5,
                    attackCooldown: 1.0,
                    xpMultiplier: 1.0,
                    coinDropMin: 1,
                    coinDropMax: 3,
                    healthDropBonus: 0,
                    colorHue: 0,
                    colorSaturation: 0.9,
                    lightnessOffset: 0,
                    coreColor: 0xff0000,
                    scale: 1.0,
                    hitRadius: 0.56,
                    canSplit: false,
                    baseEmissiveIntensity: 0.3,
                    eyeColor: 0xffff00,
                    spikeScale: 1.0
                };
        }
    }

    attack() {
        this.lastAttackTime = Date.now() / 1000;
        return this.damage;
    }

    createMesh(position) {
        this.mesh = new THREE.Group();
        this.mesh.position.copy(position);
        this.mesh.position.y = 0;
        this.body = null;
        this.core = null;
        this.spikes = [];
        this.crown = null;
        this.stompRing = null;

        const hue = this.config.colorHue;
        const saturation = this.config.colorSaturation;
        const lightness = (0.55 - (this.level * 0.02)) + this.config.lightnessOffset;
        const bodyColor = hslToRgb(hue, saturation, Math.max(0.28, Math.min(0.7, lightness)));
        const coreColor = this.config.coreColor;
        const eyeColor = this.config.eyeColor;
        const scale = this.config.scale;

        const archetype = this.getVisualArchetype();
        if (archetype === 'stomper') {
            this.buildStomperVisual(scale, bodyColor, coreColor, eyeColor);
        } else if (archetype === 'warden') {
            this.buildWardenVisual(scale, bodyColor, coreColor, eyeColor);
        } else if (archetype === 'prism') {
            this.buildPrismVisual(scale, bodyColor, coreColor, eyeColor);
        } else {
            this.buildBursterVisual(scale, bodyColor, coreColor, eyeColor);
        }

        this.scene.add(this.mesh);
    }

    getVisualArchetype() {
        if (this.type === 'stomper' || this.type === 'brute' || this.type === 'crusher') return 'stomper';
        if (this.type === 'sniper' || this.type === 'dasher') return 'prism';
        if (this.type === 'bomber' || this.type === 'splitter' || this.isMini) return 'burster';
        return 'warden';
    }

    addEyePair(scale, color = 0xffffff, y = 0.55, z = 0.36) {
        const eyeGeometry = new THREE.SphereGeometry(0.08 * scale, 6, 6);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15 * scale, y * scale, z * scale);
        rightEye.position.set(0.15 * scale, y * scale, z * scale);
        this.mesh.add(leftEye);
        this.mesh.add(rightEye);
    }

    buildStomperVisual(scale, bodyColor, coreColor, eyeColor) {
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: bodyColor,
            emissive: bodyColor,
            emissiveIntensity: this.baseEmissiveIntensity,
            shininess: 22
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.04 * scale, 0.9 * scale, 1.0 * scale), bodyMaterial);
        body.position.y = 0.72 * scale;
        this.mesh.add(body);
        this.body = body;

        const shoulderGeometry = new THREE.BoxGeometry(0.34 * scale, 0.26 * scale, 0.4 * scale);
        const shoulderMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 18 });
        for (const sx of [-0.56, 0.56]) {
            const shoulder = new THREE.Mesh(shoulderGeometry, shoulderMat);
            shoulder.position.set(sx * scale, 0.9 * scale, 0);
            this.mesh.add(shoulder);
        }

        const legGeometry = new THREE.BoxGeometry(0.3 * scale, 0.52 * scale, 0.3 * scale);
        const legMat = new THREE.MeshPhongMaterial({ color: coreColor, shininess: 16 });
        for (const sx of [-0.3, 0.3]) {
            const leg = new THREE.Mesh(legGeometry, legMat);
            leg.position.set(sx * scale, 0.28 * scale, 0.08 * scale);
            this.mesh.add(leg);
        }

        const feetGeometry = new THREE.BoxGeometry(0.44 * scale, 0.16 * scale, 0.48 * scale);
        for (const sx of [-0.3, 0.3]) {
            const foot = new THREE.Mesh(feetGeometry, legMat);
            foot.position.set(sx * scale, 0.02 * scale, 0.16 * scale);
            this.mesh.add(foot);
        }

        const core = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.18 * scale, 0),
            new THREE.MeshBasicMaterial({ color: eyeColor })
        );
        core.position.set(0, 0.74 * scale, 0.5 * scale);
        this.mesh.add(core);
        this.core = core;

        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.02 * scale, 0.06 * scale, 8, 34),
            new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.62 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.04 * scale;
        this.mesh.add(ring);
        this.stompRing = ring;

        this.addEyePair(scale * 1.2, eyeColor, 0.6, 0.43);
    }

    buildWardenVisual(scale, bodyColor, coreColor, eyeColor) {
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: bodyColor,
            emissive: bodyColor,
            emissiveIntensity: this.baseEmissiveIntensity,
            shininess: 72
        });
        const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.56 * scale, 0), bodyMaterial);
        body.position.y = 0.6 * scale;
        this.mesh.add(body);
        this.body = body;

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.18 * scale, 8, 8),
            new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.9 })
        );
        core.position.y = 0.6 * scale;
        this.mesh.add(core);
        this.core = core;

        const halo = new THREE.Mesh(
            new THREE.TorusGeometry(0.78 * scale, 0.07 * scale, 8, 24),
            new THREE.MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.78 })
        );
        halo.rotation.x = Math.PI / 2;
        halo.position.y = 0.24 * scale;
        this.mesh.add(halo);
        this.crown = halo;

        this.addEyePair(scale, eyeColor, 0.55, 0.36);
    }

    buildPrismVisual(scale, bodyColor, coreColor, eyeColor) {
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: bodyColor,
            emissive: bodyColor,
            emissiveIntensity: this.baseEmissiveIntensity,
            shininess: 82
        });
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.52 * scale, 1.05 * scale, 4), bodyMaterial);
        body.position.y = 0.64 * scale;
        body.rotation.y = Math.PI / 4;
        this.mesh.add(body);
        this.body = body;

        const core = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.2 * scale, 0),
            new THREE.MeshBasicMaterial({ color: coreColor, transparent: true, opacity: 0.9 })
        );
        core.position.y = 1.2 * scale;
        this.mesh.add(core);
        this.core = core;

        const finMat = new THREE.MeshPhongMaterial({ color: eyeColor, shininess: 65 });
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12 * scale, 0.08 * scale, 0.84 * scale), finMat);
        fin.position.set(0, 0.68 * scale, 0.58 * scale);
        this.mesh.add(fin);

        this.addEyePair(scale * 0.9, eyeColor, 0.68, 0.43);
    }

    buildBursterVisual(scale, bodyColor, coreColor, eyeColor) {
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: bodyColor,
            emissive: bodyColor,
            emissiveIntensity: this.baseEmissiveIntensity,
            shininess: 58
        });
        const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 * scale, 0), bodyMaterial);
        body.position.y = 0.58 * scale;
        this.mesh.add(body);
        this.body = body;

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.14 * scale, 8, 8),
            new THREE.MeshBasicMaterial({ color: eyeColor, transparent: true, opacity: 0.95 })
        );
        core.position.y = 0.58 * scale;
        this.mesh.add(core);
        this.core = core;

        const legGeometry = new THREE.CylinderGeometry(0.035 * scale, 0.06 * scale, 0.56 * scale, 6);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: coreColor,
            emissive: coreColor,
            emissiveIntensity: 0.55,
            shininess: 70
        });
        const spikeCount = 8;
        for (let i = 0; i < spikeCount; i++) {
            const a = (i / spikeCount) * Math.PI * 2;
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(Math.cos(a) * 0.54 * scale, 0.34 * scale, Math.sin(a) * 0.54 * scale);
            const dir = new THREE.Vector3(Math.cos(a), -0.42, Math.sin(a)).normalize();
            leg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            this.mesh.add(leg);
            this.spikes.push(leg);
        }

        this.addEyePair(scale, eyeColor, 0.56, 0.38);
    }

    markAsHunter() {
        if (this.isHunterMarked) return;
        this.isHunterMarked = true;

        const ringGeometry = new THREE.TorusGeometry(0.82 * this.config.scale, 0.06, 8, 28);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.95
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.1;
        this.mesh.add(ring);
        this.hunterRing = ring;

        const sigilGeometry = new THREE.RingGeometry(0.2 * this.config.scale, 0.34 * this.config.scale, 20);
        const sigilMaterial = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const sigil = new THREE.Mesh(sigilGeometry, sigilMaterial);
        sigil.rotation.x = -Math.PI / 2;
        sigil.position.y = 1.15 * this.config.scale;
        this.mesh.add(sigil);
        this.hunterSigil = sigil;
    }

    update(deltaTime, player, slowFieldActive = false, speedMultiplierGlobal = 1, slotIndex = 0, slotCount = 1, pressure = 1) {
        if (this.isDead) return;
        const playerPosition = player.getPosition();

        const direction = {
            x: playerPosition.x - this.mesh.position.x,
            z: playerPosition.z - this.mesh.position.z
        };
        const normalized = normalize2D(direction.x, direction.z);
        const distToPlayer = distance2D(this.mesh.position, playerPosition);

        if (this.slamCharging) {
            const chargePulse = 1 + Math.sin(Date.now() * 0.03) * 0.08;
            this.mesh.scale.set(chargePulse, Math.max(0.75, 1 - (1 - chargePulse) * 1.6), chargePulse);
            return;
        } else {
            this.mesh.scale.set(1, 1, 1);
        }

        let speedMultiplier = 1;
        if (slowFieldActive) {
            const slowAbility = player.abilities.slowField;
            if (distToPlayer < slowAbility.radius) {
                speedMultiplier = Math.max(0.1, 1 - slowAbility.slowAmount);
            }
        }

        // Dasher-type enemies periodically burst forward.
        if (this.type === 'dasher' && !this.isMini) {
            this.dashTimer += deltaTime;
            if (!this.isDashing && this.dashTimer >= 2.4) {
                this.isDashing = true;
                this.dashTime = 0.28;
                this.dashTimer = 0;
                this.dashDirection.x = normalized.x;
                this.dashDirection.z = normalized.z;
            }

            if (this.isDashing) {
                this.dashTime -= deltaTime;
                this.mesh.position.x += this.dashDirection.x * this.moveSpeed * 3.2 * deltaTime;
                this.mesh.position.z += this.dashDirection.z * this.moveSpeed * 3.2 * deltaTime;
                if (this.dashTime <= 0) {
                    this.isDashing = false;
                }
            }
        }

        this.mesh.position.x += this.knockbackVelocity.x * deltaTime;
        this.mesh.position.z += this.knockbackVelocity.z * deltaTime;

        // Brutes resist knockback more.
        const knockbackDamp = this.type === 'brute' || this.type === 'elite' ? 12 : 10;
        this.knockbackVelocity.x *= Math.max(0, 1 - deltaTime * knockbackDamp);
        this.knockbackVelocity.z *= Math.max(0, 1 - deltaTime * knockbackDamp);

        let moveVector = { x: normalized.x, z: normalized.z };

        if (this.type !== 'sniper') {
            const ringRadius = this.attackRange + (this.type === 'stomper' ? 1.1 : 0.9);
            const slotAngle = ((slotIndex / Math.max(1, slotCount)) * Math.PI * 2) + this.behaviorSeed;
            const targetSlot = {
                x: playerPosition.x + Math.cos(slotAngle) * ringRadius,
                z: playerPosition.z + Math.sin(slotAngle) * ringRadius
            };
            const toSlot = normalize2D(
                targetSlot.x - this.mesh.position.x,
                targetSlot.z - this.mesh.position.z
            );
            const slotBlend = clamp((distToPlayer - ringRadius + 1.4) / 3, 0.2, 0.78);
            const mixed = normalize2D(
                normalized.x * (1 - slotBlend) + toSlot.x * slotBlend,
                normalized.z * (1 - slotBlend) + toSlot.z * slotBlend
            );
            const perp = { x: -mixed.z, z: mixed.x };
            const strafe = Math.sin(Date.now() * 0.002 + this.behaviorSeed * 3.2) * 0.18;
            moveVector = normalize2D(
                mixed.x + perp.x * strafe,
                mixed.z + perp.z * strafe
            );
        }

        let finalSpeed = this.moveSpeed * speedMultiplier * speedMultiplierGlobal;
        const catchupBoost = this.type === 'sniper'
            ? 0
            : clamp((distToPlayer - 5.5) / 9, 0, this.type === 'stomper' ? 0.22 : 0.58);
        finalSpeed *= 1 + catchupBoost + Math.max(0, pressure - 1) * 0.18;
        if (this.type === 'sniper') {
            const preferredDistance = 7.2;
            if (distToPlayer < preferredDistance - 1.2) {
                finalSpeed *= -0.9;
            } else if (distToPlayer > preferredDistance + 1.6) {
                finalSpeed *= 1.1;
            } else {
                finalSpeed = 0;
            }
        }
        this.mesh.position.x += moveVector.x * finalSpeed * deltaTime;
        this.mesh.position.z += moveVector.z * finalSpeed * deltaTime;

        const angle = Math.atan2(moveVector.x, moveVector.z);
        this.mesh.rotation.y = angle;

        const time = Date.now() * 0.005;
        if (this.core) {
            const pulseStrength = this.type === 'elite' ? 0.35 : 0.2;
            const pulse = Math.sin(time * 2) * pulseStrength + 1;
            this.core.scale.setScalar(pulse);
        }

        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= deltaTime;
            if (this.body) this.body.material.emissiveIntensity = 0.95;
        } else if (this.body) {
            this.body.material.emissiveIntensity = this.baseEmissiveIntensity;
        }

        if (this.spikes) {
            const animRate = this.type === 'dasher' ? 6 : 3;
            this.spikes.forEach((spike, i) => {
                spike.scale.y = this.config.spikeScale * (1 + Math.sin(time * animRate + i) * 0.3);
            });
        }

        if (this.crown) {
            this.crown.rotation.z += deltaTime * 2;
        }

        if (this.stompRing) {
            const pulse = 0.94 + Math.sin(Date.now() * 0.011 + this.behaviorSeed) * 0.08;
            this.stompRing.scale.set(pulse, pulse, 1);
            this.stompRing.rotation.z += deltaTime * 1.8;
        }

        if (this.hunterRing) {
            this.hunterRing.rotation.z += deltaTime * 3.4;
            const pulse = 0.92 + Math.sin(Date.now() * 0.011) * 0.08;
            this.hunterRing.scale.set(pulse, pulse, 1);
        }
        if (this.hunterSigil) {
            this.hunterSigil.rotation.z -= deltaTime * 2.5;
        }
    }

    takeDamage(damage, sourcePosition = null, knockbackForce = 0) {
        this.health -= damage;
        this.hitFlashTime = 0.08;

        if (sourcePosition && knockbackForce > 0) {
            const away = normalize2D(
                this.mesh.position.x - sourcePosition.x,
                this.mesh.position.z - sourcePosition.z
            );
            const resist = this.type === 'brute' || this.type === 'elite' ? 0.45 : 1;
            this.knockbackVelocity.x += away.x * knockbackForce * resist;
            this.knockbackVelocity.z += away.z * knockbackForce * resist;
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            return true;
        }
        return false;
    }

    canAttack() {
        const currentTime = Date.now() / 1000;
        return currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    getPosition() {
        return this.mesh.position;
    }

    getHitRadius() {
        return this.hitRadius;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

// Enemy Manager
class EnemyManager {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.enemies = [];

        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.maxEnemies = 20;
        this.spawnDistance = 15;

        this.spawnCount = 0;
        this.eliteSpawnEvery = 18;
        this.globalSpeedMultiplier = 1;
        this.globalDamageMultiplier = 1;
        this.spawningEnabled = true;
        this.currentWave = 1;
        this.waveProgress = 0;
        this.spawnPressure = 1;
        this.directorSpeedBoost = 1;
        this.directorBoostTime = 0;
    }

    update(deltaTime) {
        if (this.directorBoostTime > 0) {
            this.directorBoostTime -= deltaTime;
            if (this.directorBoostTime <= 0) {
                this.directorBoostTime = 0;
                this.directorSpeedBoost = 1;
            }
        }

        const waveFactor = Math.max(1, this.currentWave);
        this.spawnPressure = 1 + (waveFactor - 1) * 0.08 + this.waveProgress * 0.5;
        const earlyWave = waveFactor <= 3;
        const targetSpawnIntervalBase = earlyWave
            ? (2.4 - waveFactor * 0.22 - this.waveProgress * 0.24)
            : (1.65 - waveFactor * 0.075 - this.waveProgress * 0.42);
        const targetSpawnInterval = Math.max(0.24, targetSpawnIntervalBase) / this.directorSpeedBoost;
        const targetMaxEnemies = earlyWave
            ? Math.max(8, Math.floor(9 + waveFactor * 2 + this.waveProgress * 4))
            : Math.max(16, Math.floor(16 + waveFactor * 3 + this.waveProgress * 10));
        this.spawnInterval = lerp(this.spawnInterval, targetSpawnInterval, clamp(deltaTime * 2.2, 0, 1));
        this.maxEnemies = targetMaxEnemies;

        this.spawnTimer += deltaTime;

        if (this.spawningEnabled && this.spawnTimer >= this.spawnInterval && this.enemies.length < this.maxEnemies) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        const slowFieldActive = this.player.abilities.slowField.active;
        const activeEnemies = this.enemies.filter((enemy) => !enemy.isDead && enemy.type !== 'sniper');
        activeEnemies.sort((a, b) => a.mesh.position.x - b.mesh.position.x);
        const slotByEnemy = new Map();
        for (let i = 0; i < activeEnemies.length; i++) {
            slotByEnemy.set(activeEnemies[i], i);
        }

        for (const enemy of this.enemies) {
            const slotIndex = slotByEnemy.get(enemy) || 0;
            const slotCount = Math.max(1, activeEnemies.length);
            enemy.update(
                deltaTime,
                this.player,
                slowFieldActive,
                this.globalSpeedMultiplier * this.directorSpeedBoost,
                slotIndex,
                slotCount,
                this.spawnPressure
            );
        }
    }

    getSpawnType() {
        this.spawnCount++;
        const wave = Math.max(1, this.currentWave);
        const unlockStep = Math.floor((wave - 1) / 3);
        const unlockedOrder = ['crawler', 'splitter', 'dasher', 'bomber', 'sniper', 'stomper', 'brute', 'crusher'];
        const maxIndex = clamp(unlockStep, 0, unlockedOrder.length - 1);
        const unlocked = unlockedOrder.slice(0, maxIndex + 1);

        // Elite appears only in much later waves.
        if (unlockStep >= 6 && this.spawnCount % this.eliteSpawnEvery === 0) {
            return 'elite';
        }

        // Gradually increase chance for newest type inside each 3-wave block.
        const roll = Math.random();
        if (unlocked.length === 1) return unlocked[0];
        const waveInBlock = (wave - 1) % 3; // 0,1,2
        const newestShareBase = 0.12 + unlockStep * 0.02;
        const newestShare = clamp(newestShareBase + waveInBlock * 0.08, 0.12, 0.34);
        if (roll < newestShare) {
            return unlocked[unlocked.length - 1];
        }

        const older = unlocked.slice(0, -1);
        if (older.length === 1) return older[0];

        // Weighted pick among older: recent types slightly more likely than very old.
        let totalWeight = 0;
        const weights = [];
        for (let i = 0; i < older.length; i++) {
            const w = 0.65 + i * 0.22;
            weights.push(w);
            totalWeight += w;
        }
        let pick = Math.random() * totalWeight;
        for (let i = older.length - 1; i >= 0; i--) {
            pick -= weights[i];
            if (pick <= 0) return older[i];
        }
        return older[0];
    }

    spawnEnemy(type = null, positionOverride = null, isMini = false, options = null) {
        const playerPos = this.player.getPosition();
        const spawnPos = positionOverride || randomPositionAround(playerPos, this.spawnDistance, this.spawnDistance + 5);

        const enemyType = type || this.getSpawnType();
        const enemyLevel = Math.max(this.player.level, Math.ceil(this.currentWave * 0.8));

        const enemy = new Enemy(
            this.scene,
            new THREE.Vector3(spawnPos.x, 0, spawnPos.z),
            enemyLevel,
            enemyType,
            isMini
        );

        if (options && options.hunter) {
            enemy.isHunter = true;
            enemy.coinDropMin = 0;
            enemy.coinDropMax = 0;
            enemy.xpReward = Math.max(0, Math.floor(enemy.xpReward * 0.2));
            enemy.healthDropBonus = -1;
            enemy.markAsHunter();
        }

        this.enemies.push(enemy);
        return enemy;
    }

    spawnSplitterFragments(position, level) {
        const spawned = [];

        for (let i = 0; i < 2; i++) {
            const angle = (Math.PI * 2 * i) / 2 + randomFloat(-0.3, 0.3);
            const offset = {
                x: position.x + Math.cos(angle) * 0.8,
                z: position.z + Math.sin(angle) * 0.8
            };

            const miniEnemy = new Enemy(
                this.scene,
                new THREE.Vector3(offset.x, 0, offset.z),
                Math.max(1, level - 1),
                'splitter',
                true
            );
            miniEnemy.knockbackVelocity.x = Math.cos(angle) * 3;
            miniEnemy.knockbackVelocity.z = Math.sin(angle) * 3;
            this.enemies.push(miniEnemy);
            spawned.push(miniEnemy);
        }

        return spawned;
    }

    removeEnemy(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            enemy.destroy();
        }
    }

    getEnemies() {
        return this.enemies;
    }

    clear() {
        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];
    }

    reset() {
        this.clear();
        this.spawnTimer = 0;
        this.spawnInterval = 2.0;
        this.maxEnemies = 20;
        this.spawnCount = 0;
        this.globalSpeedMultiplier = 1;
        this.globalDamageMultiplier = 1;
        this.spawningEnabled = true;
        this.currentWave = 1;
        this.waveProgress = 0;
        this.spawnPressure = 1;
        this.directorSpeedBoost = 1;
        this.directorBoostTime = 0;
    }

    setWaveState(wave, waveProgress = 0) {
        this.currentWave = Math.max(1, wave);
        this.waveProgress = clamp(waveProgress, 0, 1);
    }

    applyDirectorBoost(multiplier = 1.2, duration = 5) {
        this.directorSpeedBoost = Math.max(this.directorSpeedBoost, multiplier);
        this.directorBoostTime = Math.max(this.directorBoostTime, duration);
    }

    spawnInterceptPack(moveDir, intensity = 1) {
        if (!this.spawningEnabled) return;
        const playerPos = this.player.getPosition();
        const dir = normalize2D(moveDir.x, moveDir.z);
        if (dir.x === 0 && dir.z === 0) return;

        const baseAngle = Math.atan2(dir.z, dir.x);
        const waveFactor = Math.max(1, this.currentWave);
        const unlockStep = Math.floor((waveFactor - 1) / 3);
        const unlockedOrder = ['crawler', 'splitter', 'dasher', 'bomber', 'sniper', 'stomper', 'brute', 'crusher'];
        const maxIndex = clamp(unlockStep, 0, unlockedOrder.length - 1);
        const unlocked = unlockedOrder.slice(0, maxIndex + 1);
        const packSize = clamp(Math.floor(2 + intensity + waveFactor / 5), 2, 6);

        for (let i = 0; i < packSize; i++) {
            const spread = randomFloat(-0.7, 0.7);
            const angle = baseAngle + spread;
            const dist = randomFloat(9, 13);
            const spawnPos = {
                x: playerPos.x + Math.cos(angle) * dist,
                z: playerPos.z + Math.sin(angle) * dist
            };
            const type = this.getSpawnType();
            this.spawnEnemy(type, spawnPos, false, { hunter: true });
        }
    }
}
