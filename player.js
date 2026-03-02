// Player Class

class Player {
    constructor(scene) {
        this.scene = scene;

        // Stats
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.damage = 15;
        this.moveSpeed = 5;
        this.attackRange = 2.5;
        this.attackCooldown = 0.35;
        this.lastAttackTime = 0;

        // Progression
        this.level = 1;
        this.xp = 0;
        this.xpRequired = 100;
        this.coins = 0;
        this.kills = 0;
        this.setupShop();
        this.lifestealPercent = 0;
        this.globalCooldownScale = 1;

        // Ultimate ability
        this.ultimateKills = 0;
        this.ultimateKillsRequired = 20; // Increased from 10 to 20
        this.isUltimateActive = false;
        this.ultimateTime = 0;
        this.ultimateDuration = 4.0; // Increased from 3 to 4 seconds

        // Shield
        this.maxShield = 100;
        this.shield = this.maxShield;
        this.isShieldActive = false;
        this.shieldDrainRate = 15; // Units per second when active
        this.shieldDamageDrainMultiplier = 3; // Drains 3x faster when taking damage
        this.shieldRegenRate = 5; // Units per second when not active
        this.shieldRegenDelay = 3.0; // Seconds before regen starts
        this.lastShieldDamageTime = 0;
        this.shieldOverchargeTime = 0;
        this.shieldOverchargeDrainMultiplier = 0.55;
        this.shieldOverchargeRegenMultiplier = 1.8;

        // Coin magnet
        this.coinMagnetRadius = 3.4;
        this.coinMagnetPullStrength = 9.5;
        this.coinMagnetPulse = 0;
        this.stunTime = 0;

        // Active Abilities (1,2,3,4)
        this.abilities = {
            dash: {
                cooldown: 6.0,
                lastUsed: 0,
                duration: 0.2,
                active: false,
                activeTime: 0,
                speed: 11
            },
            shieldRecharge: {
                cooldown: 11.0,
                lastUsed: 0,
                amount: 35,
                active: false,
                overchargeDuration: 2.5
            },
            damageBoost: {
                cooldown: 18.0,
                lastUsed: 0,
                duration: 3.5,
                active: false,
                activeTime: 0,
                multiplier: 1.35
            },
            slowField: {
                cooldown: 16.0,
                lastUsed: 0,
                duration: 3.0,
                active: false,
                activeTime: 0,
                radius: 4.0,
                slowAmount: 0.35
            },
            arcShot: {
                cooldown: 4.4,
                lastUsed: 0,
                speed: 22,
                maxDistance: 20,
                radius: 0.5,
                damageMultiplier: 1.05,
                explodeRadius: 1.9
            },
            shockwave: {
                unlocked: false,
                cooldown: 14,
                lastUsed: 0,
                radius: 2.8,
                damageMultiplier: 0.9,
                knockback: 11
            }
        };
        this.skillPoints = 1;
        this.skillTierCosts = [1, 2, 2]; // cumulative 1/3/5
        this.nextSkillPointLevel = 2;
        this.skillTiers = {
            dash: 0,
            shieldRecharge: 0,
            damageBoost: 0,
            slowField: 0,
            arcShot: 0,
            shockwave: 0
        };
        this.skillOrder = ['dash', 'shieldRecharge', 'damageBoost', 'slowField', 'arcShot', 'shockwave'];
        this.slowMeteorCharges = 0;
        this.slowMeteorTimer = 0;
        this.dashCharges = 0;
        this.dashMaxCharges = 1;
        this.dashRechargeTimer = 0;

        // Create mesh
        this.createMesh();

        // Input
        this.keys = {};
        this.mousePosition = { x: 0, y: 0 };
        this.dashDirection = { x: 0, z: -1 };
        this._mouseNdc = new THREE.Vector2();
        this._aimRaycaster = new THREE.Raycaster();
        this._aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this._aimIntersection = new THREE.Vector3();
        this.applySkillTierEffects();
        this.setupInput();
    }

    createMesh() {
        // Create player group
        this.mesh = new THREE.Group();
        this.mesh.position.y = 0;

        // Main body - glowing cylinder
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.45, 1.4, 12);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x6366f1,
            emissive: 0x6366f1,
            emissiveIntensity: 0.4,
            shininess: 60,
            specular: 0x8b5cf6
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.7;
        this.mesh.add(body);

        // Top crystal/gem
        const crystalGeometry = new THREE.OctahedronGeometry(0.35, 0);
        const crystalMaterial = new THREE.MeshPhongMaterial({
            color: 0xa78bfa,
            emissive: 0xa78bfa,
            emissiveIntensity: 0.6,
            shininess: 100,
            transparent: true,
            opacity: 0.9
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.position.y = 1.6;
        this.mesh.add(crystal);
        this.crystal = crystal;

        // Energy rings around body
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x8b5cf6,
            transparent: true,
            opacity: 0.6
        });

        const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
        ring1.position.y = 0.5;
        ring1.rotation.x = Math.PI / 2;
        this.mesh.add(ring1);
        this.ring1 = ring1;

        const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
        ring2.position.y = 0.9;
        ring2.rotation.x = Math.PI / 2;
        this.mesh.add(ring2);
        this.ring2 = ring2;

        // Direction indicator - glowing cone
        const coneGeometry = new THREE.ConeGeometry(0.25, 0.6, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({
            color: 0xc4b5fd,
            transparent: true,
            opacity: 0.8
        });
        this.directionCone = new THREE.Mesh(coneGeometry, coneMaterial);
        this.directionCone.position.y = 0.8;
        this.directionCone.rotation.x = Math.PI / 2;
        this.directionCone.position.z = 0.6;
        this.mesh.add(this.directionCone);

        // Base platform
        const baseGeometry = new THREE.CylinderGeometry(0.5, 0.55, 0.15, 12);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x4c1d95,
            emissive: 0x4c1d95,
            emissiveIntensity: 0.2,
            shininess: 30
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 0.075;
        this.mesh.add(base);

        // Sword (same as before)
        const swordGroup = new THREE.Group();

        const bladeGeometry = new THREE.BoxGeometry(0.15, 1.2, 0.05);
        const bladeMaterial = new THREE.MeshPhongMaterial({
            color: 0xe0e0e0,
            emissive: 0xffffff,
            emissiveIntensity: 0.4,
            shininess: 120,
            specular: 0xffffff
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.y = 0.6;
        swordGroup.add(blade);

        const handleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
        const handleMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b4513,
            shininess: 20
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = -0.15;
        swordGroup.add(handle);

        const guardGeometry = new THREE.BoxGeometry(0.4, 0.08, 0.08);
        const guardMaterial = new THREE.MeshPhongMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.3,
            shininess: 80
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.y = 0;
        swordGroup.add(guard);

        swordGroup.position.set(0.6, 0.3, 0);
        swordGroup.rotation.z = -Math.PI / 4;
        swordGroup.visible = false;
        this.mesh.add(swordGroup);
        this.sword = swordGroup;

        // Shield visual (sphere around player)
        const shieldGeometry = new THREE.SphereGeometry(0.9, 16, 16);
        const shieldMaterial = new THREE.MeshBasicMaterial({
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: false
        });
        this.shieldMesh = new THREE.Mesh(shieldGeometry, shieldMaterial);
        this.shieldMesh.position.y = 0.8;
        this.shieldMesh.visible = false;
        this.mesh.add(this.shieldMesh);

        // Frost aura visual for slow-field state.
        const frostRingGeometry = new THREE.TorusGeometry(1.2, 0.06, 8, 36);
        const frostRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x67e8f9,
            transparent: true,
            opacity: 0.45
        });
        this.frostRing = new THREE.Mesh(frostRingGeometry, frostRingMaterial);
        this.frostRing.rotation.x = Math.PI / 2;
        this.frostRing.position.y = 0.08;
        this.frostRing.visible = false;
        this.mesh.add(this.frostRing);

        const frostHaloGeometry = new THREE.RingGeometry(0.9, 1.6, 40);
        const frostHaloMaterial = new THREE.MeshBasicMaterial({
            color: 0xa5f3fc,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide
        });
        this.frostHalo = new THREE.Mesh(frostHaloGeometry, frostHaloMaterial);
        this.frostHalo.rotation.x = -Math.PI / 2;
        this.frostHalo.position.y = 0.03;
        this.frostHalo.visible = false;
        this.mesh.add(this.frostHalo);


        // Pet visuals
        const heartPetGeometry = new THREE.SphereGeometry(0.18, 10, 10);
        const heartPetMaterial = new THREE.MeshBasicMaterial({
            color: 0xf472b6,
            transparent: true,
            opacity: 0.9
        });
        this.heartPetMesh = new THREE.Mesh(heartPetGeometry, heartPetMaterial);
        this.heartPetMesh.visible = false;
        this.scene.add(this.heartPetMesh);

        const attackPetGeometry = new THREE.SphereGeometry(0.2, 10, 10);
        const attackPetMaterial = new THREE.MeshBasicMaterial({
            color: 0x86efac,
            transparent: true,
            opacity: 0.9
        });
        this.attackPetMesh = new THREE.Mesh(attackPetGeometry, attackPetMaterial);
        this.attackPetMesh.visible = false;
        this.scene.add(this.attackPetMesh);

        // Ultimate visual effect - Electric discharge
        // Ground electric circle
        const ultimateCircleGeometry = new THREE.CircleGeometry(2.5, 32);
        const ultimateCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0x6366f1,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.ultimateCircle = new THREE.Mesh(ultimateCircleGeometry, ultimateCircleMaterial);
        this.ultimateCircle.rotation.x = -Math.PI / 2;
        this.ultimateCircle.position.y = 0.05;
        this.ultimateCircle.visible = false;
        this.mesh.add(this.ultimateCircle);

        // Electric ring (wireframe)
        const ultimateRingGeometry = new THREE.TorusGeometry(2.5, 0.1, 8, 32);
        const ultimateRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xa78bfa,
            transparent: true,
            opacity: 0.8,
            wireframe: true
        });
        this.ultimateRing = new THREE.Mesh(ultimateRingGeometry, ultimateRingMaterial);
        this.ultimateRing.rotation.x = Math.PI / 2;
        this.ultimateRing.position.y = 0.1;
        this.ultimateRing.visible = false;
        this.mesh.add(this.ultimateRing);

        // Lightning bolts from player (vertical lines)
        this.lightningBolts = [];
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const boltGeometry = new THREE.PlaneGeometry(0.1, 1.5);
            const boltMaterial = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });
            const bolt = new THREE.Mesh(boltGeometry, boltMaterial);
            bolt.position.x = Math.cos(angle) * 0.8;
            bolt.position.z = Math.sin(angle) * 0.8;
            bolt.position.y = 1.5;
            bolt.lookAt(new THREE.Vector3(0, 1.5, 0));
            bolt.visible = false;
            this.mesh.add(bolt);
            this.lightningBolts.push(bolt);
        }

        this.isAttacking = false;
        this.attackAnimationTime = 0;

        this.scene.add(this.mesh);
    }

    setupShop() {
        this.upgradeLevels = {
            blade_core: 0,
            aegis_shell: 0,
            rune_forge: 0,
            magnet_core: 0,
            vampiric_edge: 0,
            celerity: 0,
            shockwave_unlock: 0,
            heart_pet: 0,
            attack_pet: 0
        };

        this.pets = {
            heart: {
                level: 0,
                baseRange: 2.2
            },
            attack: {
                level: 0,
                baseDamage: 8,
                baseRange: 8
            }
        };
    }

    setupInput() {
        // Keyboard movement and abilities
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // Movement - English and Russian (map Russian to English keys)
            if (key === 'w' || key === 'ц') this.keys.w = true;
            if (key === 'a' || key === 'ф') this.keys.a = true;
            if (key === 's' || key === 'ы') this.keys.s = true;
            if (key === 'd' || key === 'в') this.keys.d = true;

            // Attack
            if (key === ' ') this.keys.space = true;

            // Ultimate - Q or Й (Russian)
            if (key === 'q' || key === 'й') this.keys.ultimate = true;

            // Abilities 1-4
            if (key === '1') this.keys.ability1 = true;
            if (key === '2') this.keys.ability2 = true;
            if (key === '3') this.keys.ability3 = true;
            if (key === '4') this.keys.ability4 = true;
            if (key === 'f' || key === 'а') this.keys.arcShot = true;
            if (key === 'e' || key === 'у') this.keys.shockwave = true;

            // Shop upgrades
            if (key === '5') this.keys.shop1 = true;
            if (key === '6') this.keys.shop2 = true;
            if (key === '7') this.keys.shop3 = true;
            if (key === '8') this.keys.shop4 = true;
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();

            // Movement - English and Russian
            if (key === 'w' || key === 'ц') this.keys.w = false;
            if (key === 'a' || key === 'ф') this.keys.a = false;
            if (key === 's' || key === 'ы') this.keys.s = false;
            if (key === 'd' || key === 'в') this.keys.d = false;

            // Attack
            if (key === ' ') this.keys.space = false;

            // Ultimate
            if (key === 'q' || key === 'й') this.keys.ultimate = false;

            // Abilities 1-4
            if (key === '1') this.keys.ability1 = false;
            if (key === '2') this.keys.ability2 = false;
            if (key === '3') this.keys.ability3 = false;
            if (key === '4') this.keys.ability4 = false;
            if (key === 'f' || key === 'а') this.keys.arcShot = false;
            if (key === 'e' || key === 'у') this.keys.shockwave = false;

            // Shop upgrades
            if (key === '5') this.keys.shop1 = false;
            if (key === '6') this.keys.shop2 = false;
            if (key === '7') this.keys.shop3 = false;
            if (key === '8') this.keys.shop4 = false;
        });

        // Mouse for shield (right click)
        window.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // Right mouse button
                this.keys.shield = true;
                e.preventDefault();
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.keys.shield = false;
                e.preventDefault();
            }
        });

        // Prevent context menu on right click
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Mouse position for rotation
        window.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
        });
    }

    update(deltaTime, camera, canvas) {
        const currentTime = Date.now() / 1000;
        this.stunTime = Math.max(0, this.stunTime - deltaTime);
        const isStunned = this.stunTime > 0;

        // Ability 1: Dash
        if (!isStunned && this.keys.ability1 && this.isAbilityUnlocked('dash') && this.canUseDash()) {
            this.activateDash();
        }

        // Ability 2: Shield Recharge
        if (
            !isStunned &&
            this.keys.ability2 &&
            this.isAbilityUnlocked('shieldRecharge') &&
            currentTime - this.abilities.shieldRecharge.lastUsed >= this.abilities.shieldRecharge.cooldown
        ) {
            this.activateShieldRecharge();
        }

        // Ability 3: Damage Boost
        if (
            !isStunned &&
            this.keys.ability3 &&
            this.isAbilityUnlocked('damageBoost') &&
            currentTime - this.abilities.damageBoost.lastUsed >= this.abilities.damageBoost.cooldown
        ) {
            this.activateDamageBoost();
        }

        // Ability 4: Slow Field
        if (
            !isStunned &&
            this.keys.ability4 &&
            this.isAbilityUnlocked('slowField') &&
            currentTime - this.abilities.slowField.lastUsed >= this.abilities.slowField.cooldown
        ) {
            this.activateSlowField();
        }

        if (
            !isStunned &&
            this.keys.shockwave &&
            this.isAbilityUnlocked('shockwave') &&
            currentTime - this.abilities.shockwave.lastUsed >= this.abilities.shockwave.cooldown
        ) {
            this.activateShockwave();
        }

        if (this.isAbilityUnlocked('dash')) {
            if (this.dashCharges < this.dashMaxCharges) {
                this.dashRechargeTimer += deltaTime;
                if (this.dashRechargeTimer >= this.abilities.dash.cooldown) {
                    this.dashRechargeTimer = 0;
                    this.dashCharges += 1;
                }
            } else {
                this.dashRechargeTimer = 0;
            }
        } else {
            this.dashCharges = 0;
            this.dashRechargeTimer = 0;
        }

        // Update active abilities
        if (this.abilities.dash.active) {
            this.abilities.dash.activeTime += deltaTime;
            if (this.abilities.dash.activeTime >= this.abilities.dash.duration) {
                this.abilities.dash.active = false;
                this.abilities.dash.activeTime = 0;
            }
        }

        if (this.abilities.damageBoost.active) {
            this.abilities.damageBoost.activeTime += deltaTime;
            if (this.abilities.damageBoost.activeTime >= this.abilities.damageBoost.duration) {
                this.abilities.damageBoost.active = false;
                this.abilities.damageBoost.activeTime = 0;
            }
        }

        if (this.abilities.slowField.active) {
            this.abilities.slowField.activeTime += deltaTime;
            if (this.abilities.slowField.activeTime >= this.abilities.slowField.duration) {
                this.abilities.slowField.active = false;
                this.abilities.slowField.activeTime = 0;
            }
        }

        if (this.shieldOverchargeTime > 0) {
            this.shieldOverchargeTime -= deltaTime;
            if (this.shieldOverchargeTime < 0) this.shieldOverchargeTime = 0;
        }

        // Ultimate ability activation
        if (this.keys.ultimate && !this.isUltimateActive && this.ultimateKills >= this.ultimateKillsRequired) {
            this.activateUltimate();
        }

        // Shield activation/deactivation
        if (this.keys.shield && this.shield > 0) {
            if (!this.isShieldActive) {
                this.isShieldActive = true;
            }
        } else {
            this.isShieldActive = false;
        }

        // Shield drain when active
        if (this.isShieldActive && this.shield > 0) {
            const drainMultiplier = this.shieldOverchargeTime > 0 ? this.shieldOverchargeDrainMultiplier : 1;
            this.shield -= this.shieldDrainRate * drainMultiplier * deltaTime;
            if (this.shield < 0) this.shield = 0;
            this.lastShieldDamageTime = Date.now() / 1000;
        }

        // Shield regeneration when not active
        if (!this.isShieldActive && this.shield < this.maxShield) {
            if (currentTime - this.lastShieldDamageTime >= this.shieldRegenDelay) {
                const regenMultiplier = this.shieldOverchargeTime > 0 ? this.shieldOverchargeRegenMultiplier : 1;
                this.shield += this.shieldRegenRate * regenMultiplier * deltaTime;
                if (this.shield > this.maxShield) this.shield = this.maxShield;
            }
        }

        // Ultimate spinning animation with electric discharge
        if (this.isUltimateActive) {
            this.ultimateTime += deltaTime;

            // Spin player rapidly
            this.mesh.rotation.y += deltaTime * 15; // Fast spin

            // Show sword during ultimate
            if (this.sword) {
                this.sword.visible = true;
                this.sword.rotation.z = -Math.PI / 4 + Math.sin(this.ultimateTime * 20) * 0.3;
            }

            // Electric circle on ground - pulse effect
            if (this.ultimateCircle) {
                this.ultimateCircle.visible = true;
                const pulse = Math.sin(this.ultimateTime * 8) * 0.5 + 1;
                this.ultimateCircle.scale.set(pulse, pulse, 1);
                this.ultimateCircle.material.opacity = 0.3 + Math.sin(this.ultimateTime * 8) * 0.2;
            }

            // Electric ring - rotate and pulse
            if (this.ultimateRing) {
                this.ultimateRing.visible = true;
                this.ultimateRing.rotation.z += deltaTime * 8;
                const pulse = Math.sin(this.ultimateTime * 10) * 0.2 + 1;
                this.ultimateRing.scale.set(pulse, pulse, 1);
            }

            // Lightning bolts - flicker randomly
            if (this.lightningBolts) {
                this.lightningBolts.forEach((bolt, index) => {
                    // Random flicker
                    if (Math.random() > 0.3) {
                        bolt.visible = true;
                        bolt.material.opacity = 0.5 + Math.random() * 0.5;
                        // Random scale for lightning effect
                        const scaleY = 0.8 + Math.random() * 0.4;
                        bolt.scale.y = scaleY;
                    } else {
                        bolt.visible = false;
                    }
                });
            }

            if (this.ultimateTime >= this.ultimateDuration) {
                this.isUltimateActive = false;
                this.ultimateTime = 0;
                if (this.sword) this.sword.visible = false;
                if (this.ultimateCircle) this.ultimateCircle.visible = false;
                if (this.ultimateRing) this.ultimateRing.visible = false;
                if (this.lightningBolts) {
                    this.lightningBolts.forEach(bolt => bolt.visible = false);
                }
            }

            // Skip normal movement and attacks during ultimate
            return;
        }

        // Calculate movement direction
        let moveX = 0;
        let moveZ = 0;

        if (this.keys.w) moveZ -= 1;
        if (this.keys.s) moveZ += 1;
        if (this.keys.a) moveX -= 1;
        if (this.keys.d) moveX += 1;

        // Normalize movement
        const velocity = { x: 0, z: 0 };
        if (isStunned) {
            this.abilities.dash.active = false;
        } else if (moveX !== 0 || moveZ !== 0) {
            const normalized = normalize2D(moveX, moveZ);
            this.dashDirection = normalized;

            const overchargeSpeedBonus = this.shieldOverchargeTime > 0 ? 0.75 : 0;
            const speed = this.abilities.dash.active ? this.abilities.dash.speed : this.moveSpeed + overchargeSpeedBonus;
            velocity.x = normalized.x * speed;
            velocity.z = normalized.z * speed;
        } else if (this.abilities.dash.active) {
            // If dash was activated without movement input, dash forward.
            velocity.x = this.dashDirection.x * this.abilities.dash.speed;
            velocity.z = this.dashDirection.z * this.abilities.dash.speed;
        }

        // Apply movement
        this.mesh.position.x += velocity.x * deltaTime;
        this.mesh.position.z += velocity.z * deltaTime;

        // Rotate player to face mouse cursor
        if (camera && canvas) {
            this._mouseNdc.set(
                (this.mousePosition.x / canvas.width) * 2 - 1,
                -(this.mousePosition.y / canvas.height) * 2 + 1
            );
            this._aimRaycaster.setFromCamera(this._mouseNdc, camera);

            if (this._aimRaycaster.ray.intersectPlane(this._aimPlane, this._aimIntersection)) {
                const dx = this._aimIntersection.x - this.mesh.position.x;
                const dz = this._aimIntersection.z - this.mesh.position.z;
                const angle = Math.atan2(dx, dz);
                this.mesh.rotation.y = angle;

                // Keep dash direction aligned with where player is aiming.
                const facing = normalize2D(Math.sin(angle), Math.cos(angle));
                this.dashDirection.x = facing.x;
                this.dashDirection.z = facing.z;
            }
        }

        // Pulsing effect on direction cone
        const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
        this.directionCone.scale.set(pulse, pulse, pulse);

        // Rotate crystal
        if (this.crystal) {
            this.crystal.rotation.y += deltaTime * 2;
            this.crystal.rotation.x = Math.sin(Date.now() * 0.003) * 0.2;
        }

        // Rotate rings
        if (this.ring1) this.ring1.rotation.z += deltaTime * 1.5;
        if (this.ring2) this.ring2.rotation.z -= deltaTime * 1.5;

        this.coinMagnetPulse = Math.max(0, this.coinMagnetPulse - deltaTime * 1.8);

        const t = Date.now() * 0.002;
        if (this.heartPetMesh) {
            this.heartPetMesh.visible = this.pets.heart.level > 0;
            if (this.heartPetMesh.visible) {
                const radius = 1.6;
                this.heartPetMesh.position.set(
                    this.mesh.position.x + Math.cos(t) * radius,
                    1.3 + Math.sin(t * 1.7) * 0.25,
                    this.mesh.position.z + Math.sin(t) * radius
                );
            }
        }

        if (this.attackPetMesh) {
            this.attackPetMesh.visible = this.pets.attack.level > 0;
            if (this.attackPetMesh.visible) {
                const radius = 2.1;
                this.attackPetMesh.position.set(
                    this.mesh.position.x + Math.cos(-t * 1.15) * radius,
                    1.45 + Math.sin(t * 1.2) * 0.2,
                    this.mesh.position.z + Math.sin(-t * 1.15) * radius
                );
            }
        }

        // Shield visual
        if (this.shieldMesh) {
            this.shieldMesh.visible = this.isShieldActive && this.shield > 0;

            if (this.shieldMesh.visible) {
                // Pulse effect
                const pulse = Math.sin(Date.now() * 0.008) * 0.1 + 1;
                this.shieldMesh.scale.setScalar(pulse);

                // Opacity based on shield strength
                const shieldPercent = this.shield / this.maxShield;
                this.shieldMesh.material.opacity = 0.2 + shieldPercent * 0.2;

                // Rotate shield
                this.shieldMesh.rotation.y += deltaTime * 2;
            }
        }

        if (this.frostRing && this.frostHalo) {
            const active = this.abilities.slowField.active;
            this.frostRing.visible = active;
            this.frostHalo.visible = active;
            if (active) {
                this.frostRing.rotation.z += deltaTime * 2.2;
                const pulse = 1 + Math.sin(Date.now() * 0.012) * 0.09;
                this.frostRing.scale.set(pulse, pulse, 1);
                this.frostHalo.material.opacity = 0.16 + (Math.sin(Date.now() * 0.018) * 0.08 + 0.08);
            }
        }

        // Attack animation
        if (this.isAttacking) {
            this.attackAnimationTime += deltaTime;
            const animDuration = 0.35;
            let progress = this.attackAnimationTime / animDuration;

            if (progress < 1) {
                // Easing function for more dynamic motion (ease-out-cubic)
                const eased = 1 - Math.pow(1 - progress, 3);

                // Slash arc from right to left (more natural sword swing)
                // Start: behind and to the right
                // Middle: in front of player
                // End: left side
                const startAngle = Math.PI * 0.4;  // ~72° to the right
                const endAngle = -Math.PI * 0.6;   // ~-108° to the left
                const currentAngle = startAngle + (endAngle - startAngle) * eased;

                // Distance from player (closer at start and end, farther in middle)
                const distanceCurve = 0.6 + Math.sin(progress * Math.PI) * 0.3;

                // Position sword along the arc
                this.sword.position.x = Math.sin(currentAngle) * distanceCurve;
                this.sword.position.z = Math.cos(currentAngle) * distanceCurve;
                this.sword.position.y = 0.5 + Math.sin(progress * Math.PI) * 0.2; // Slight vertical arc

                // Rotate sword to follow slash direction
                this.sword.rotation.y = currentAngle + Math.PI / 2;

                // Tilt sword during slash for dynamic effect
                const tiltAmount = Math.sin(progress * Math.PI) * 0.4;
                this.sword.rotation.z = -Math.PI / 6 + tiltAmount;
                this.sword.rotation.x = Math.sin(progress * Math.PI * 2) * 0.2;

                // Scale slightly for impact
                const scale = 1 + Math.sin(progress * Math.PI) * 0.15;
                this.sword.scale.set(scale, scale, scale);
            } else {
                // Reset attack
                this.isAttacking = false;
                this.sword.visible = false;
                this.sword.position.set(0.6, 0.3, 0);
                this.sword.rotation.set(0, 0, -Math.PI / 4);
                this.sword.scale.set(1, 1, 1);
            }
        }
    }

    attack() {
        const currentTime = Date.now() / 1000;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return null;
        }

        this.lastAttackTime = currentTime;
        this.isAttacking = true;
        this.attackAnimationTime = 0;
        if (this.sword) this.sword.visible = true;

        // Return attack data for combat system
        return {
            position: this.mesh.position.clone(),
            direction: this.mesh.rotation.y,
            range: this.attackRange,
            damage: this.getAttackDamage()
        };
    }

    getAttackDamage() {
        if (this.abilities.damageBoost.active) {
            return this.damage * this.abilities.damageBoost.multiplier;
        }
        return this.damage;
    }

    activateUltimate() {
        if (this.ultimateKills >= this.ultimateKillsRequired) {
            this.isUltimateActive = true;
            this.ultimateTime = 0;
            this.ultimateKills = 0; // Reset counter

            // Trigger visual effect (will be called from game.js with effectsManager)
            this.ultimateJustActivated = true;
        }
    }

    // Ability 1: Dash
    activateDash() {
        const currentTime = Date.now() / 1000;
        if (this.dashCharges <= 0) return;
        this.abilities.dash.lastUsed = currentTime;
        this.abilities.dash.active = true;
        this.abilities.dash.activeTime = 0;
        this.dashCharges -= 1;
        if (this.dashCharges < this.dashMaxCharges && this.dashRechargeTimer <= 0) {
            this.dashRechargeTimer = 0.001;
        }
        this.dashJustActivated = true; // Flag for visual effect
    }

    // Ability 2: Shield Recharge
    activateShieldRecharge() {
        const currentTime = Date.now() / 1000;
        if (this.shield < this.maxShield) {
            this.abilities.shieldRecharge.lastUsed = currentTime;
            this.shield = Math.min(this.shield + this.abilities.shieldRecharge.amount, this.maxShield);
            this.shieldOverchargeTime = this.abilities.shieldRecharge.overchargeDuration;
            this.shieldRechargeJustActivated = true; // Flag for visual effect
        }
    }

    // Ability 3: Damage Boost
    activateDamageBoost() {
        const currentTime = Date.now() / 1000;
        this.abilities.damageBoost.lastUsed = currentTime;
        this.abilities.damageBoost.active = true;
        this.abilities.damageBoost.activeTime = 0;
        this.damageBoostJustActivated = true; // Flag for visual effect
    }

    // Ability 4: Slow Field
    activateSlowField() {
        const currentTime = Date.now() / 1000;
        this.abilities.slowField.lastUsed = currentTime;
        this.abilities.slowField.active = true;
        this.abilities.slowField.activeTime = 0;
        if (this.skillTiers.slowField >= 3) {
            this.slowMeteorCharges = randomInt(1, 3);
            this.slowMeteorTimer = 0.35;
        } else {
            this.slowMeteorCharges = 0;
            this.slowMeteorTimer = 0;
        }
        this.slowFieldJustActivated = true; // Flag for visual effect
    }

    activateShockwave() {
        this.abilities.shockwave.lastUsed = Date.now() / 1000;
        this.shockwaveJustActivated = true;
    }

    takeDamage(damage) {
        // Shield blocks damage first
        if (this.isShieldActive && this.shield > 0) {
            const shieldDamage = damage * this.shieldDamageDrainMultiplier;
            this.shield -= shieldDamage;

            if (this.shield < 0) {
                // Shield broke, remaining damage goes to health
                const remainingDamage = Math.abs(this.shield / this.shieldDamageDrainMultiplier);
                this.shield = 0;
                this.health -= remainingDamage;
            }

            this.lastShieldDamageTime = Date.now() / 1000;
        } else {
            // No shield, take full damage
            this.health -= damage;
        }

        if (this.health <= 0) {
            this.health = 0;
            return true; // Player died
        }
        return false;
    }

    gainXP(amount) {
        this.xp += amount;

        if (this.xp >= this.xpRequired) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpRequired;
        this.xpRequired = Math.floor(this.xpRequired * 1.5);
        if (this.level >= this.nextSkillPointLevel) {
            this.skillPoints += 1;
            const step = this.nextSkillPointLevel < 20 ? 2 : 3;
            this.nextSkillPointLevel += step;
        }

        // Increase stats but don't restore health
        this.maxHealth += 20;
        // this.health = this.maxHealth; // REMOVED - no longer restore health on level up
        this.damage += 5;
        this.moveSpeed += 0.2;

        // Increase shield slightly
        this.maxShield += 10;

        // Scale auto-pickup utility with progression
        this.coinMagnetRadius += 0.16;
    }

    addCoins(amount) {
        this.coins += amount;
        this.coinMagnetPulse = 0.7;
    }

    getCoinMagnetRadius() {
        let radius = this.coinMagnetRadius;
        if (this.abilities.dash.active) radius += 1.1;
        if (this.abilities.damageBoost.active) radius += 0.7;
        if (this.shieldOverchargeTime > 0) radius += 0.5;
        return radius;
    }

    tryUseArcShot() {
        if (!this.isAbilityUnlocked('arcShot')) {
            return null;
        }
        const currentTime = Date.now() / 1000;
        const arcShot = this.abilities.arcShot;
        if (currentTime - arcShot.lastUsed < arcShot.cooldown) {
            return null;
        }

        arcShot.lastUsed = currentTime;
        const direction = {
            x: Math.sin(this.mesh.rotation.y),
            z: Math.cos(this.mesh.rotation.y)
        };

        return {
            position: this.mesh.position.clone(),
            direction: normalize2D(direction.x, direction.z),
            speed: arcShot.speed,
            maxDistance: arcShot.maxDistance,
            radius: arcShot.radius,
            damage: this.getAttackDamage() * arcShot.damageMultiplier,
            explodeRadius: arcShot.explodeRadius
        };
    }

    tryUseShockwave() {
        if (!this.shockwaveJustActivated || !this.isAbilityUnlocked('shockwave')) {
            return null;
        }
        this.shockwaveJustActivated = false;
        return {
            position: this.mesh.position.clone(),
            radius: this.abilities.shockwave.radius,
            damage: this.getAttackDamage() * this.abilities.shockwave.damageMultiplier,
            knockback: this.abilities.shockwave.knockback
        };
    }

    isAbilityUnlocked(abilityId) {
        const map = {
            dash: 'dash',
            shieldRecharge: 'shieldRecharge',
            damageBoost: 'damageBoost',
            slowField: 'slowField',
            arcShot: 'arcShot',
            shockwave: 'shockwave'
        };
        const key = map[abilityId] || abilityId;
        if (!this.skillTiers[key]) return false;
        return this.skillTiers[key] > 0;
    }

    canUseDash() {
        return this.dashCharges > 0;
    }

    getDashCooldownPercent() {
        if (!this.isAbilityUnlocked('dash')) return 100;
        if (this.dashCharges > 0) return 0;
        return clamp((this.abilities.dash.cooldown - this.dashRechargeTimer) / this.abilities.dash.cooldown, 0, 1) * 100;
    }

    getNextSkillTierCost(skillId) {
        const tier = this.skillTiers[skillId] || 0;
        if (tier >= 3) return 0;
        return this.skillTierCosts[tier];
    }

    upgradeSkill(skillId) {
        if (!(skillId in this.skillTiers)) {
            return { success: false, message: 'Неизвестный навык' };
        }
        const currentTier = this.skillTiers[skillId];
        if (currentTier >= 3) {
            return { success: false, message: 'Навык уже максимального уровня' };
        }
        const cost = this.getNextSkillTierCost(skillId);
        if (this.skillPoints < cost) {
            return { success: false, message: `Нужно ${cost} очк.` };
        }
        this.skillPoints -= cost;
        this.skillTiers[skillId] = currentTier + 1;
        this.applySkillTierEffects();
        return { success: true, message: `${this.getSkillTitle(skillId)}: ранг ${this.skillTiers[skillId]}` };
    }

    getSkillTitle(skillId) {
        const names = {
            dash: 'Рывок',
            shieldRecharge: 'Перезарядка щита',
            damageBoost: 'Усиление урона',
            slowField: 'Морозная зона',
            arcShot: 'Руна-выстрел',
            shockwave: 'Ударная волна'
        };
        return names[skillId] || skillId;
    }

    getSkillTierDescription(skillId, tier) {
        const d = {
            dash: [
                'Открыть: короткий рывок, высокий кд',
                'Рывок дальше, кд ниже',
                '2 заряда рывка, подряд'
            ],
            shieldRecharge: [
                'Открыть: слабая перезарядка щита',
                'Больше щита и оверчардж',
                'Сильная перезарядка, низкий кд'
            ],
            damageBoost: [
                'Открыть: слабый баф урона',
                'Средний баф и дольше',
                'Сильный баф и длительность'
            ],
            slowField: [
                'Открыть: базовое замедление',
                'Больше радиус и замедление',
                'Ледяной метеоритный дождь при активации'
            ],
            arcShot: [
                'Открыть: слабый снаряд',
                'Сильнее урон и взрыв',
                'Высокий урон, быстрый откат'
            ],
            shockwave: [
                'Открыть: малая волна',
                'Больше радиус и урон',
                'Сильный импульс и кд ниже'
            ]
        };
        return d[skillId] ? d[skillId][tier - 1] : '';
    }

    getSkillHudState() {
        const make = (id, slot, key) => {
            const tier = this.skillTiers[id];
            const nextCost = this.getNextSkillTierCost(id);
            return {
                id,
                slot,
                key,
                title: this.getSkillTitle(id),
                tier,
                maxTier: 3,
                nextCost,
                points: this.skillPoints,
                lines: [
                    `I: ${this.getSkillTierDescription(id, 1)}`,
                    `II: ${this.getSkillTierDescription(id, 2)}`,
                    `III: ${this.getSkillTierDescription(id, 3)}`
                ]
            };
        };

        return {
            points: this.skillPoints,
            nextPointLevel: this.nextSkillPointLevel,
            skills: {
                dash: make('dash', 1, '1'),
                shieldRecharge: make('shieldRecharge', 2, '2'),
                damageBoost: make('damageBoost', 3, '3'),
                slowField: make('slowField', 4, '4'),
                arcShot: make('arcShot', 5, 'F'),
                shockwave: make('shockwave', 6, 'E')
            }
        };
    }

    applySkillTierEffects() {
        const dashTier = this.skillTiers.dash;
        if (dashTier <= 0) {
            this.abilities.dash.speed = 11;
            this.abilities.dash.duration = 0.2;
            this.abilities.dash.cooldown = 6;
            this.dashMaxCharges = 1;
            this.dashCharges = 0;
        } else if (dashTier === 1) {
            this.abilities.dash.speed = 11;
            this.abilities.dash.duration = 0.2;
            this.abilities.dash.cooldown = 6;
            this.dashMaxCharges = 1;
            this.dashCharges = Math.max(1, this.dashCharges);
        } else if (dashTier === 2) {
            this.abilities.dash.speed = 13;
            this.abilities.dash.duration = 0.24;
            this.abilities.dash.cooldown = 4.8;
            this.dashMaxCharges = 1;
            this.dashCharges = Math.max(1, this.dashCharges);
        } else {
            this.abilities.dash.speed = 15;
            this.abilities.dash.duration = 0.28;
            this.abilities.dash.cooldown = 5.2;
            this.dashMaxCharges = 2;
            this.dashCharges = Math.max(2, this.dashCharges);
        }
        this.dashCharges = clamp(this.dashCharges, 0, this.dashMaxCharges);

        const shieldTier = this.skillTiers.shieldRecharge;
        if (shieldTier <= 0) {
            this.abilities.shieldRecharge.cooldown = 11;
            this.abilities.shieldRecharge.amount = 35;
            this.abilities.shieldRecharge.overchargeDuration = 2.5;
        } else if (shieldTier === 1) {
            this.abilities.shieldRecharge.cooldown = 11;
            this.abilities.shieldRecharge.amount = 35;
            this.abilities.shieldRecharge.overchargeDuration = 2.5;
        } else if (shieldTier === 2) {
            this.abilities.shieldRecharge.cooldown = 8.5;
            this.abilities.shieldRecharge.amount = 55;
            this.abilities.shieldRecharge.overchargeDuration = 4;
        } else {
            this.abilities.shieldRecharge.cooldown = 6.5;
            this.abilities.shieldRecharge.amount = 85;
            this.abilities.shieldRecharge.overchargeDuration = 5.5;
        }

        const boostTier = this.skillTiers.damageBoost;
        if (boostTier <= 0) {
            this.abilities.damageBoost.cooldown = 18;
            this.abilities.damageBoost.duration = 3.5;
            this.abilities.damageBoost.multiplier = 1.35;
        } else if (boostTier === 1) {
            this.abilities.damageBoost.cooldown = 18;
            this.abilities.damageBoost.duration = 3.5;
            this.abilities.damageBoost.multiplier = 1.35;
        } else if (boostTier === 2) {
            this.abilities.damageBoost.cooldown = 14;
            this.abilities.damageBoost.duration = 4.5;
            this.abilities.damageBoost.multiplier = 1.8;
        } else {
            this.abilities.damageBoost.cooldown = 12;
            this.abilities.damageBoost.duration = 6;
            this.abilities.damageBoost.multiplier = 2.2;
        }

        const slowTier = this.skillTiers.slowField;
        if (slowTier <= 0) {
            this.abilities.slowField.cooldown = 16;
            this.abilities.slowField.duration = 3;
            this.abilities.slowField.radius = 4;
            this.abilities.slowField.slowAmount = 0.35;
        } else if (slowTier === 1) {
            this.abilities.slowField.cooldown = 16;
            this.abilities.slowField.duration = 3;
            this.abilities.slowField.radius = 4;
            this.abilities.slowField.slowAmount = 0.35;
        } else if (slowTier === 2) {
            this.abilities.slowField.cooldown = 14;
            this.abilities.slowField.duration = 4;
            this.abilities.slowField.radius = 5.6;
            this.abilities.slowField.slowAmount = 0.5;
        } else {
            this.abilities.slowField.cooldown = 12;
            this.abilities.slowField.duration = 4.5;
            this.abilities.slowField.radius = 6.4;
            this.abilities.slowField.slowAmount = 0.6;
        }

        const arcTier = this.skillTiers.arcShot;
        if (arcTier <= 0) {
            this.abilities.arcShot.cooldown = 4.4;
            this.abilities.arcShot.damageMultiplier = 1.05;
            this.abilities.arcShot.explodeRadius = 1.9;
        } else if (arcTier === 1) {
            this.abilities.arcShot.cooldown = 4.4;
            this.abilities.arcShot.damageMultiplier = 1.05;
            this.abilities.arcShot.explodeRadius = 1.9;
        } else if (arcTier === 2) {
            this.abilities.arcShot.cooldown = 3.2;
            this.abilities.arcShot.damageMultiplier = 1.35;
            this.abilities.arcShot.explodeRadius = 2.6;
        } else {
            this.abilities.arcShot.cooldown = 2.2;
            this.abilities.arcShot.damageMultiplier = 1.8;
            this.abilities.arcShot.explodeRadius = 3.2;
        }

        const shockTier = this.skillTiers.shockwave;
        this.abilities.shockwave.unlocked = shockTier > 0;
        if (shockTier <= 0) {
            this.abilities.shockwave.cooldown = 14;
            this.abilities.shockwave.radius = 2.8;
            this.abilities.shockwave.damageMultiplier = 0.9;
            this.abilities.shockwave.knockback = 11;
        } else if (shockTier === 1) {
            this.abilities.shockwave.cooldown = 14;
            this.abilities.shockwave.radius = 2.8;
            this.abilities.shockwave.damageMultiplier = 0.9;
            this.abilities.shockwave.knockback = 11;
        } else if (shockTier === 2) {
            this.abilities.shockwave.cooldown = 10;
            this.abilities.shockwave.radius = 3.8;
            this.abilities.shockwave.damageMultiplier = 1.25;
            this.abilities.shockwave.knockback = 14;
        } else {
            this.abilities.shockwave.cooldown = 7.6;
            this.abilities.shockwave.radius = 4.8;
            this.abilities.shockwave.damageMultiplier = 1.55;
            this.abilities.shockwave.knockback = 18;
        }

        const scale = this.globalCooldownScale || 1;
        this.abilities.dash.cooldown = Math.max(1.2, this.abilities.dash.cooldown * scale);
        this.abilities.shieldRecharge.cooldown = Math.max(2.5, this.abilities.shieldRecharge.cooldown * scale);
        this.abilities.damageBoost.cooldown = Math.max(4, this.abilities.damageBoost.cooldown * scale);
        this.abilities.slowField.cooldown = Math.max(4, this.abilities.slowField.cooldown * scale);
        this.abilities.arcShot.cooldown = Math.max(1, this.abilities.arcShot.cooldown * scale);
        this.abilities.shockwave.cooldown = Math.max(4.5, this.abilities.shockwave.cooldown * scale);
    }

    applyShopOption(effect) {
        if (!effect || !effect.type) return;

        switch (effect.type) {
            case 'blade_core':
                this.upgradeLevels.blade_core++;
                this.damage += 6;
                this.attackCooldown = Math.max(0.2, this.attackCooldown - 0.02);
                return { success: true };
            case 'aegis_shell':
                this.upgradeLevels.aegis_shell++;
                this.maxShield += 26;
                this.shield = Math.min(this.maxShield, this.shield + 22);
                this.shieldRegenRate += 7;
                return { success: true };
            case 'rune_forge':
                this.upgradeLevels.rune_forge++;
                this.abilities.arcShot.damageMultiplier += 0.25;
                this.abilities.arcShot.explodeRadius += 0.35;
                return { success: true };
            case 'magnet_core':
                this.upgradeLevels.magnet_core++;
                this.coinMagnetRadius += 1.2;
                this.coinMagnetPullStrength += 3;
                return { success: true };
            case 'vampiric_edge':
                if (this.upgradeLevels.vampiric_edge >= 6) {
                    return { success: false, message: 'Вампиризм уже максимальный' };
                }
                this.upgradeLevels.vampiric_edge++;
                this.lifestealPercent += 0.04;
                return { success: true };
            case 'celerity':
                if (this.upgradeLevels.celerity >= 10) {
                    return { success: false, message: 'Темп уже максимальный' };
                }
                this.upgradeLevels.celerity++;
                this.moveSpeed += 0.35;
                this.applyCooldownScale(0.94);
                return { success: true };
            case 'shockwave_unlock':
                return { success: false, message: 'Теперь Ударная волна прокачивается только очками навыков' };
            case 'heart_pet':
                if (this.pets.heart.level >= 6) {
                    return { success: false, message: 'Питомец-собиратель уже максимальный' };
                }
                this.pets.heart.level++;
                this.upgradeLevels.heart_pet = this.pets.heart.level;
                return { success: true };
            case 'attack_pet':
                if (this.pets.attack.level >= 6) {
                    return { success: false, message: 'Боевой питомец уже максимальный' };
                }
                this.pets.attack.level++;
                this.upgradeLevels.attack_pet = this.pets.attack.level;
                return { success: true };
            default:
                return { success: false, message: 'Неизвестный апгрейд' };
        }
    }

    getHeartPetPickupRadius() {
        if (this.pets.heart.level <= 0) return null;
        return this.pets.heart.baseRange + this.pets.heart.level * 1.45;
    }

    getAttackPetStats() {
        if (this.pets.attack.level <= 0) return null;
        return {
            level: this.pets.attack.level,
            damage: this.pets.attack.baseDamage + this.pets.attack.level * 5 + this.damage * 0.2,
            range: this.pets.attack.baseRange + this.pets.attack.level * 2.2,
            interval: Math.max(0.45, 1.7 - this.pets.attack.level * 0.2),
            bolts: this.pets.attack.level >= 4 ? 2 : 1
        };
    }

    applyCooldownScale(scale) {
        if (scale <= 0) return;
        this.globalCooldownScale *= scale;
        this.applySkillTierEffects();
    }

    buyUpgrade(type) {
        const upgrade = this.shop[type];
        if (!upgrade) {
            return { success: false, message: 'Неизвестное улучшение' };
        }

        if (upgrade.level >= upgrade.maxLevel) {
            return { success: false, message: 'Улучшение уже максимального уровня' };
        }

        if (this.coins < upgrade.cost) {
            return { success: false, message: 'Недостаточно монет' };
        }

        this.coins -= upgrade.cost;
        upgrade.level += 1;
        upgrade.cost = Math.ceil(upgrade.baseCost * Math.pow(upgrade.growth, upgrade.level));

        if (type === 'damage') {
            this.damage += upgrade.bonus;
        } else if (type === 'health') {
            this.maxHealth += upgrade.bonus;
            this.health = Math.min(this.maxHealth, this.health + upgrade.bonus);
            this.maxShield += 4;
            this.shield = Math.min(this.maxShield, this.shield + 8);
        } else if (type === 'speed') {
            this.moveSpeed += upgrade.bonus;
        } else if (type === 'arc') {
            this.abilities.arcShot.damageMultiplier += upgrade.damageBonus;
            this.abilities.arcShot.cooldown = Math.max(1.05, this.abilities.arcShot.cooldown - upgrade.cooldownBonus);
        }

        return { success: true, message: 'Покупка успешна' };
    }

    addKill() {
        this.kills++;

        // Only increment ultimate charge if:
        // 1. Not currently using ultimate
        // 2. Haven't reached the required amount yet
        if (!this.isUltimateActive && this.ultimateKills < this.ultimateKillsRequired) {
            this.ultimateKills++;
        }

        // Momentum: aggressive play slightly accelerates your skill cycle.
        const cooldownRefund = 0.08;
        this.abilities.dash.lastUsed -= cooldownRefund;
        this.abilities.shieldRecharge.lastUsed -= cooldownRefund * 0.7;
        this.abilities.damageBoost.lastUsed -= cooldownRefund * 0.9;
        this.abilities.slowField.lastUsed -= cooldownRefund * 0.8;
        this.abilities.arcShot.lastUsed -= cooldownRefund;
    }

    getPosition() {
        return this.mesh.position;
    }

    reset() {
        this.level = 1;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.damage = 15;
        this.attackRange = 2.5;
        this.moveSpeed = 5;
        this.xp = 0;
        this.xpRequired = 100;
        this.coins = 0;
        this.skillPoints = 1;
        this.nextSkillPointLevel = 2;
        this.kills = 0;
        this.setupShop();

        // Reset abilities
        this.ultimateKills = 0;
        this.isUltimateActive = false;
        this.ultimateTime = 0;

        this.maxShield = 100;
        this.shield = this.maxShield;
        this.isShieldActive = false;
        this.lastShieldDamageTime = 0;
        this.shieldOverchargeTime = 0;
        this.coinMagnetRadius = 3.4;
        this.coinMagnetPullStrength = 9.5;
        this.coinMagnetPulse = 0;

        this.mesh.position.set(0, 0, 0);
        this.dashDirection = { x: 0, z: -1 };

        // Reset ability state flags used by effects.
        this.dashJustActivated = false;
        this.shieldRechargeJustActivated = false;
        this.damageBoostJustActivated = false;
        this.slowFieldJustActivated = false;
        this.ultimateJustActivated = false;
        this.shockwaveJustActivated = false;
        this.keys.shop1 = false;
        this.keys.shop2 = false;
        this.keys.shop3 = false;
        this.keys.shop4 = false;
        this.keys.arcShot = false;
        this.keys.shockwave = false;
        this.abilities.arcShot.lastUsed = 0;
        this.abilities.shockwave.lastUsed = 0;
        this.skillTiers = {
            dash: 0,
            shieldRecharge: 0,
            damageBoost: 0,
            slowField: 0,
            arcShot: 0,
            shockwave: 0
        };
        this.dashCharges = 0;
        this.dashRechargeTimer = 0;
        this.slowMeteorCharges = 0;
        this.slowMeteorTimer = 0;
        this.globalCooldownScale = 1;
        this.applySkillTierEffects();
        this.lifestealPercent = 0;
        if (this.heartPetMesh) this.heartPetMesh.visible = false;
        if (this.attackPetMesh) this.attackPetMesh.visible = false;
        if (this.frostRing) this.frostRing.visible = false;
        if (this.frostHalo) this.frostHalo.visible = false;
    }
}
