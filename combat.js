// Combat System

class CombatManager {
    constructor(player, enemyManager, coinManager, healthPickupManager, effectsManager, ui, camera, canvas, soundManager = null) {
        this.player = player;
        this.enemyManager = enemyManager;
        this.coinManager = coinManager;
        this.healthPickupManager = healthPickupManager;
        this.effectsManager = effectsManager;
        this.ui = ui;
        this.camera = camera;
        this.canvas = canvas;
        this.soundManager = soundManager;

        this.playerHitRadius = 0.5;
        this.enemyHitRadius = 0.5;
        this.projectiles = [];
        this.runModifiers = {
            bonusCoinsPerKill: 0,
            enemyDamageMultiplier: 1
        };
        this.petAttackTimer = 0;
        this.enemyProjectiles = [];
        this.enemyTelegraphs = [];
        this.iceMeteors = [];
        this.lastCombatActionTime = Date.now() / 1000;
        this.playerEngagement = 0;
        this.lastPlayerEngagementTime = Date.now() / 1000;
        this.lastMeleeHitTime = Date.now() / 1000;
    }

    getEnemyHitRadius(enemy) {
        if (enemy && typeof enemy.getHitRadius === 'function') {
            return Math.max(0.25, enemy.getHitRadius());
        }
        return this.enemyHitRadius;
    }

    update(deltaTime) {
        const playerPos = this.player.getPosition();
        const enemies = this.enemyManager.getEnemies();
        const now = Date.now();
        this.playerEngagement = Math.max(0, this.playerEngagement - deltaTime * 0.7);

        this.handleArcShotInput();
        this.handleShockwaveInput();
        this.updateProjectiles(deltaTime, playerPos);
        this.updateEnemyProjectiles(deltaTime, playerPos);
        this.updateEnemyTelegraphs(deltaTime, playerPos);
        this.updatePetAttacks(deltaTime, playerPos);

        // Dash collisions: short burst damage and knockback while dashing.
        if (this.player.abilities.dash.active) {
            const dashDamage = this.player.getAttackDamage() * 0.8;
            for (const enemy of enemies) {
                if (enemy.isDead) continue;

                const enemyPos = enemy.getPosition();
                const distance = distance2D(playerPos, enemyPos);
                const hitRadius = this.getEnemyHitRadius(enemy);
                if (distance < 0.8 + hitRadius && (!enemy.lastDashHitTime || now - enemy.lastDashHitTime > 180)) {
                    enemy.lastDashHitTime = now;
                    const isDead = enemy.takeDamage(dashDamage, playerPos, 12);
                    this.markCombatAction();
                    this.registerPlayerEngagement(0.38);
                    this.applyLifesteal(dashDamage);

                    const damagePos = enemyPos.clone();
                    damagePos.y = 1;
                    this.ui.showDamageNumber(dashDamage, damagePos, this.camera, this.canvas, true);
                    this.effectsManager.createHitEffect(enemyPos, 0x8b5cf6);

                    if (isDead) {
                        this.handleEnemyDeath(enemy, enemyPos, playerPos);
                    }
                }
            }
        }

        // Ultimate ability damage (spinning attack)
        if (this.player.isUltimateActive) {
            const ultimateRange = this.player.attackRange * 1.5; // Larger range for ultimate
            const ultimateDamage = this.player.getAttackDamage() * 2.2;

            for (const enemy of enemies) {
                if (enemy.isDead) continue;

                const enemyPos = enemy.getPosition();
                const distance = distance2D(playerPos, enemyPos);

                if (distance < ultimateRange) {
                    // Damage every 0.2 seconds during ultimate
                    if (!enemy.lastUltimateDamageTime || Date.now() - enemy.lastUltimateDamageTime > 200) {
                        enemy.lastUltimateDamageTime = Date.now();

                        const isDead = enemy.takeDamage(ultimateDamage, playerPos, 16);
                        this.markCombatAction();
                        this.registerPlayerEngagement(0.26);
                        this.applyLifesteal(ultimateDamage);

                        // Show damage number
                        const damagePos = enemyPos.clone();
                        damagePos.y = 1;
                        this.ui.showDamageNumber(ultimateDamage, damagePos, this.camera, this.canvas, true);

                        // Blood effect
                        this.effectsManager.createHitEffect(enemyPos, 0xff0000);

                        if (isDead) {
                            this.handleEnemyDeath(enemy, enemyPos, playerPos);
                        }
                    }
                }
            }
        }

        // Slow field now also burns enemies over time for better zone control gameplay.
        if (this.player.abilities.slowField.active) {
            const slowField = this.player.abilities.slowField;
            const tickDamage = this.player.getAttackDamage() * 0.22;
            for (const enemy of enemies) {
                if (enemy.isDead) continue;
                const enemyPos = enemy.getPosition();
                const dist = distance2D(playerPos, enemyPos);
                if (dist > slowField.radius) continue;

                if (!enemy.lastSlowFieldTick || now - enemy.lastSlowFieldTick > 360) {
                    enemy.lastSlowFieldTick = now;
                    const isDead = enemy.takeDamage(tickDamage, playerPos, 4);
                    this.markCombatAction();
                    this.registerPlayerEngagement(0.08);
                    this.applyLifesteal(tickDamage * 0.35);
                    const damagePos = enemyPos.clone();
                    damagePos.y = 1;
                    this.ui.showDamageNumber(tickDamage, damagePos, this.camera, this.canvas);
                    this.effectsManager.createHitEffect(enemyPos, 0x67e8f9);

                    if (isDead) {
                        this.handleEnemyDeath(enemy, enemyPos, playerPos);
                    }
                }
            }
        }

        // Player attacks enemies with area attack
        if (this.player.keys.space) {
            const attackData = this.player.attack();

            if (attackData) {
                // Show slash line effect
                this.createSlashEffect(attackData.position, attackData.direction, attackData.range);

                // Area attack - hit all enemies in semicircle
                for (let i = enemies.length - 1; i >= 0; i--) {
                    const enemy = enemies[i];
                    if (enemy.isDead) continue;

                    const enemyPos = enemy.getPosition();
                    const distance = distance2D(playerPos, enemyPos);
                    const hitRadius = this.getEnemyHitRadius(enemy);

                    // Check if enemy is within range
                    if (distance < attackData.range + hitRadius * 0.55) {
                        // Check if enemy is in front (semicircle, 180 degrees)
                        const angleToEnemy = Math.atan2(
                            enemyPos.x - playerPos.x,
                            enemyPos.z - playerPos.z
                        );

                        let angleDiff = angleToEnemy - attackData.direction;
                        // Normalize angle to -PI to PI
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                        // Check if within 60 degree arc (30 degrees on each side) - reduced from 90
                        if (Math.abs(angleDiff) < Math.PI / 4) { // 45 degrees for a less punishing melee feel
                            // Deal damage
                            const damage = attackData.damage;
                            const isDead = enemy.takeDamage(damage, playerPos, 8);
                            this.markCombatAction();
                            this.registerPlayerEngagement(1.1, true);
                            this.applyLifesteal(damage);

                            // Show damage number
                            const damagePos = enemyPos.clone();
                            damagePos.y = 1;
                            this.ui.showDamageNumber(damage, damagePos, this.camera, this.canvas);

                            // Blood effect on hit
                            this.effectsManager.createHitEffect(enemyPos, 0xff0000);

                            if (this.player.abilities.damageBoost.active) {
                                this.applyDamageBoostCleave(enemy, enemyPos, playerPos);
                            }

                            if (isDead) {
                                this.handleEnemyDeath(enemy, enemyPos, playerPos);
                            }
                        }
                    }
                }
            }
        }

        // Enemies attack player
        for (const enemy of enemies) {
            if (enemy.isDead) continue;

            const enemyPos = enemy.getPosition();
            const distance = distance2D(playerPos, enemyPos);

            if (enemy.type === 'bomber' && distance < enemy.attackRange && enemy.canAttack()) {
                enemy.attack();
                this.effectsManager.createDeathEffect(enemyPos, 0xff6688);

                const explosionDamage = enemy.damage * this.runModifiers.enemyDamageMultiplier;
                const blastRadius = 2.8;
                if (distance < blastRadius) {
                    const playerDied = this.player.takeDamage(explosionDamage);
                    this.markCombatAction();
                    const damagePos = playerPos.clone();
                    damagePos.y = 1.2;
                    this.ui.showDamageNumber(explosionDamage, damagePos, this.camera, this.canvas, true);
                    if (playerDied) {
                        this.enemyManager.removeEnemy(enemy);
                        return true;
                    }
                }

                this.enemyManager.removeEnemy(enemy);
                continue;
            }

            if (enemy.type === 'stomper' && distance < enemy.attackRange && enemy.canAttack()) {
                enemy.attack();
                enemy.slamCharging = true;
                enemy.slamChargeTime = 1.0;
                enemy.slamRadius = 3.2;
                enemy.slamOrigin = enemyPos.clone();
                this.effectsManager.createGroundWarning(enemy.slamOrigin, enemy.slamRadius, 0xff8a3d, 1.0);
                continue;
            }

            // If enemy is in attack range and can attack
            if (distance < enemy.attackRange && enemy.canAttack()) {
                if (enemy.type === 'sniper') {
                    enemy.attack();
                    this.spawnSniperTelegraph(enemy, playerPos, enemy.damage * 0.92, 10);
                    continue;
                }

                const damage = enemy.attack() * this.runModifiers.enemyDamageMultiplier;
                const playerDied = this.player.takeDamage(damage);
                this.markCombatAction();

                // Show damage number on player
                const damagePos = playerPos.clone();
                damagePos.y = 1;
                this.ui.showDamageNumber(damage, damagePos, this.camera, this.canvas);

                // Hit effect on player
                this.effectsManager.createHitEffect(playerPos, 0xff4444);

                if (playerDied) {
                    return true; // Player died
                }
            }
        }

        const stompKill = this.updateStomperSlams(deltaTime, playerPos);
        if (stompKill) {
            return true;
        }
        this.updateSlowMeteorRain(deltaTime, playerPos);

        // Collect coins (using CoinManager's update method)
        const collectedCoin = this.coinManager.update(deltaTime);
        if (collectedCoin) {
            this.effectsManager.createCoinEffect(collectedCoin.getPosition());
            if (this.soundManager) this.soundManager.playCoin();
        }

        // Collect health pickups (using HealthPickupManager's update method)
        const heartPetRadius = this.player.getHeartPetPickupRadius ? this.player.getHeartPetPickupRadius() : null;
        const collectedHealth = this.healthPickupManager.update(deltaTime, heartPetRadius);
        if (collectedHealth) {
            if (collectedHealth.healAmount > 0) {
                if (this.soundManager) this.soundManager.playHeart();
                const healPos = playerPos.clone();
                healPos.y = 1.5;
                this.ui.showDamageNumber(collectedHealth.healAmount, healPos, this.camera, this.canvas, false, true);

                // Heal effect
                this.effectsManager.createLevelUpEffect(playerPos);
            }
        }

        return false; // Player alive
    }

    setRunModifiers(modifiers) {
        this.runModifiers.bonusCoinsPerKill = modifiers.bonusCoinsPerKill ?? 0;
        this.runModifiers.enemyDamageMultiplier = modifiers.enemyDamageMultiplier ?? 1;
    }

    handleArcShotInput() {
        if (!this.player.keys.arcShot) return;
        this.player.keys.arcShot = false;

        const shot = this.player.tryUseArcShot();
        if (!shot) return;

        const geometry = new THREE.SphereGeometry(0.22, 10, 10);
        const material = new THREE.MeshBasicMaterial({
            color: 0x7dd3fc,
            transparent: true,
            opacity: 0.95
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(shot.position);
        mesh.position.y = 0.9;
        this.effectsManager.scene.add(mesh);

        this.projectiles.push({
            mesh,
            position: shot.position.clone(),
            direction: shot.direction,
            speed: shot.speed,
            maxDistance: shot.maxDistance,
            radius: shot.radius,
            damage: shot.damage,
            explodeRadius: shot.explodeRadius,
            traveled: 0
        });
    }

    updateProjectiles(deltaTime, playerPos) {
        const enemies = this.enemyManager.getEnemies();

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const step = projectile.speed * deltaTime;
            projectile.traveled += step;

            projectile.position.x += projectile.direction.x * step;
            projectile.position.z += projectile.direction.z * step;
            projectile.mesh.position.x = projectile.position.x;
            projectile.mesh.position.z = projectile.position.z;
            projectile.mesh.rotation.y += deltaTime * 8;

            let hitPoint = null;
            for (const enemy of enemies) {
                if (enemy.isDead) continue;
                const dist = distance2D(projectile.position, enemy.getPosition());
                if (dist <= projectile.radius + this.getEnemyHitRadius(enemy)) {
                    hitPoint = enemy.getPosition().clone();
                    break;
                }
            }

            if (hitPoint || projectile.traveled >= projectile.maxDistance) {
                this.explodeArcShot(projectile, hitPoint || projectile.position.clone(), enemies, playerPos);
                this.removeProjectile(i);
            }
        }
    }

    explodeArcShot(projectile, center, enemies, playerPos) {
        this.effectsManager.createHitEffect(center, 0x7dd3fc);

        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const enemyPos = enemy.getPosition();
            const dist = distance2D(center, enemyPos);
            if (dist > projectile.explodeRadius) continue;

            const damageFalloff = 1 - (dist / projectile.explodeRadius) * 0.45;
            const damage = Math.max(1, projectile.damage * damageFalloff);
            const isDead = enemy.takeDamage(damage, center, 10);
            this.markCombatAction();
            this.registerPlayerEngagement(0.22);
            this.applyLifesteal(damage * 0.7);

            const damagePos = enemyPos.clone();
            damagePos.y = 1;
            this.ui.showDamageNumber(damage, damagePos, this.camera, this.canvas, true);

            if (isDead) {
                this.handleEnemyDeath(enemy, enemyPos, playerPos);
            }
        }
    }

    handleShockwaveInput() {
        const wave = this.player.tryUseShockwave();
        if (!wave) return;

        const enemies = this.enemyManager.getEnemies();
        this.effectsManager.createHitEffect(wave.position, 0xa78bfa);
        this.effectsManager.createShockwavePulse(wave.position, wave.radius, 0xa78bfa);
        this.effectsManager.createShockwaveBurst(wave.position, wave.radius);
        let hitCount = 0;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            const enemyPos = enemy.getPosition();
            const dist = distance2D(wave.position, enemyPos);
            if (dist > wave.radius) continue;
            hitCount++;

            const falloff = 1 - (dist / wave.radius) * 0.4;
            const damage = Math.max(1, wave.damage * falloff);
            const isDead = enemy.takeDamage(damage, wave.position, wave.knockback);
            this.markCombatAction();
            this.registerPlayerEngagement(0.3);
            this.applyLifesteal(damage);

            const dmgPos = enemyPos.clone();
            dmgPos.y = 1;
            this.ui.showDamageNumber(damage, dmgPos, this.camera, this.canvas, true);

            if (isDead) {
                this.handleEnemyDeath(enemy, enemyPos, this.player.getPosition());
            }
        }

        this.ui.showMinorNotice(`Ударная волна: целей ${hitCount}`, hitCount > 0 ? 'good' : 'error', 1300);
    }

    handleEnemyDeath(enemy, enemyPos, playerPos) {
        this.effectsManager.createDeathEffect(enemyPos);
        const hunter = !!enemy.isHunter;

        const bonusHealthDrop = hunter ? -1 : (enemy.healthDropBonus || 0);
        this.healthPickupManager.trySpawnPickup(enemyPos, bonusHealthDrop);

        if (!hunter) {
            const coinMin = enemy.coinDropMin ?? 1;
            const coinMax = enemy.coinDropMax ?? 3;
            const finalMin = Math.min(coinMin, coinMax);
            const finalMax = Math.max(coinMin, coinMax);
            const coinCount = randomInt(finalMin, finalMax) + this.runModifiers.bonusCoinsPerKill;
            for (let j = 0; j < coinCount; j++) {
                const coinPos = enemyPos.clone();
                coinPos.x += randomFloat(-0.5, 0.5);
                coinPos.z += randomFloat(-0.5, 0.5);
                this.coinManager.spawnCoin(coinPos);
            }
        }

        if (enemy.type === 'splitter' && !enemy.isMini && enemy.config.canSplit) {
            this.enemyManager.spawnSplitterFragments(enemyPos, enemy.level);
        }

        const leveledUp = this.player.gainXP(enemy.xpReward);
        if (leveledUp) {
            this.ui.showLevelUp(this.player.level);
            this.ui.showMinorNotice(`Уровень повышен: ${this.player.level}`, 'good', 4200);
            this.effectsManager.createLevelUpEffect(playerPos);
        }

        this.player.addKill();
        this.enemyManager.removeEnemy(enemy);
    }

    removeProjectile(index) {
        const projectile = this.projectiles[index];
        this.effectsManager.scene.remove(projectile.mesh);
        projectile.mesh.geometry.dispose();
        projectile.mesh.material.dispose();
        this.projectiles.splice(index, 1);
    }

    clearProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            this.removeProjectile(i);
        }
        for (const p of this.enemyProjectiles) {
            if (p.mesh) {
                this.effectsManager.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                p.mesh.material.dispose();
            }
        }
        this.enemyProjectiles = [];
        for (const tele of this.enemyTelegraphs) {
            if (tele.line) this.effectsManager.scene.remove(tele.line);
            if (tele.lineGeometry) tele.lineGeometry.dispose();
            if (tele.lineMaterial) tele.lineMaterial.dispose();
        }
        this.enemyTelegraphs = [];
        this.iceMeteors = [];
    }

    hasActiveEnemyThreats() {
        return this.enemyProjectiles.length > 0 || this.enemyTelegraphs.length > 0;
    }

    applyDamageBoostCleave(primaryEnemy, hitPos, playerPos) {
        const cleaveDamage = this.player.getAttackDamage() * 0.34;
        const cleaveRadius = 2.2;
        const enemies = this.enemyManager.getEnemies();

        for (const enemy of enemies) {
            if (enemy === primaryEnemy || enemy.isDead) continue;
            const enemyPos = enemy.getPosition();
            const dist = distance2D(hitPos, enemyPos);
            if (dist > cleaveRadius) continue;

            const isDead = enemy.takeDamage(cleaveDamage, hitPos, 6);
            this.markCombatAction();
            this.registerPlayerEngagement(0.22);
            this.applyLifesteal(cleaveDamage * 0.8);
            const splashPos = enemyPos.clone();
            splashPos.y = 1;
            this.ui.showDamageNumber(cleaveDamage, splashPos, this.camera, this.canvas, true);
            this.effectsManager.createHitEffect(enemyPos, 0xf97316);

            if (isDead) {
                this.handleEnemyDeath(enemy, enemyPos, playerPos);
            }
        }
    }

    applyLifesteal(damageDealt) {
        if (!damageDealt || this.player.lifestealPercent <= 0) return;
        const heal = damageDealt * this.player.lifestealPercent;
        if (heal <= 0) return;
        this.player.health = Math.min(this.player.maxHealth, this.player.health + heal);
    }

    spawnEnemyProjectile(fromPos, toPos, damage, speed) {
        const dir = normalize2D(toPos.x - fromPos.x, toPos.z - fromPos.z);
        const geometry = new THREE.SphereGeometry(0.18, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x93c5fd,
            transparent: true,
            opacity: 0.95
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(fromPos.x, 0.85, fromPos.z);
        this.effectsManager.scene.add(mesh);

        this.enemyProjectiles.push({
            position: fromPos.clone(),
            direction: dir,
            speed,
            damage,
            radius: 0.45,
            ttl: 2.2,
            mesh
        });
    }

    updateEnemyProjectiles(deltaTime, playerPos) {
        for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
            const p = this.enemyProjectiles[i];
            p.ttl -= deltaTime;
            p.position.x += p.direction.x * p.speed * deltaTime;
            p.position.z += p.direction.z * p.speed * deltaTime;

            if (p.mesh) {
                p.mesh.position.x = p.position.x;
                p.mesh.position.z = p.position.z;
                p.mesh.rotation.y += deltaTime * 12;
                this.effectsManager.createProjectileTrail(p.mesh.position, 0x93c5fd);
            }

            if (distance2D(p.position, playerPos) < p.radius + 0.45) {
                const playerDied = this.player.takeDamage(p.damage * this.runModifiers.enemyDamageMultiplier);
                this.markCombatAction();
                const damagePos = playerPos.clone();
                damagePos.y = 1;
                this.ui.showDamageNumber(p.damage, damagePos, this.camera, this.canvas, true);
                if (p.mesh) {
                    this.effectsManager.scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    p.mesh.material.dispose();
                }
                this.enemyProjectiles.splice(i, 1);
                if (playerDied) {
                    return;
                }
                continue;
            }

            if (p.ttl <= 0) {
                if (p.mesh) {
                    this.effectsManager.scene.remove(p.mesh);
                    p.mesh.geometry.dispose();
                    p.mesh.material.dispose();
                }
                this.enemyProjectiles.splice(i, 1);
            }
        }
    }

    spawnSniperTelegraph(enemy, targetPos, damage, speed) {
        const start = enemy.getPosition().clone();
        const direction = normalize2D(targetPos.x - start.x, targetPos.z - start.z);
        const end = new THREE.Vector3(
            start.x + direction.x * 12,
            0.2,
            start.z + direction.z * 12
        );
        const points = [new THREE.Vector3(start.x, 0.2, start.z), end];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x93c5fd,
            transparent: true,
            opacity: 0.85
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.effectsManager.scene.add(line);

        this.enemyTelegraphs.push({
            enemy,
            delay: 0.55,
            direction,
            damage,
            speed,
            line,
            lineGeometry,
            lineMaterial
        });
    }

    updateEnemyTelegraphs(deltaTime, playerPos) {
        for (let i = this.enemyTelegraphs.length - 1; i >= 0; i--) {
            const tele = this.enemyTelegraphs[i];
            tele.delay -= deltaTime;
            if (tele.lineMaterial) {
                tele.lineMaterial.opacity = Math.max(0.2, tele.delay * 1.7);
            }
            if (tele.delay <= 0) {
                const origin = tele.enemy && !tele.enemy.isDead
                    ? tele.enemy.getPosition().clone()
                    : playerPos.clone().add(new THREE.Vector3(-tele.direction.x * 3, 0, -tele.direction.z * 3));
                const target = new THREE.Vector3(
                    origin.x + tele.direction.x * 10,
                    0,
                    origin.z + tele.direction.z * 10
                );
                this.spawnEnemyProjectile(origin, target, tele.damage, tele.speed);
                if (tele.line) this.effectsManager.scene.remove(tele.line);
                if (tele.lineGeometry) tele.lineGeometry.dispose();
                if (tele.lineMaterial) tele.lineMaterial.dispose();
                this.enemyTelegraphs.splice(i, 1);
            }
        }
    }

    updateStomperSlams(deltaTime, playerPos) {
        const enemies = this.enemyManager.getEnemies();
        for (const enemy of enemies) {
            if (!enemy.slamCharging) continue;
            enemy.slamChargeTime -= deltaTime;

            if (enemy.slamChargeTime > 0) continue;

            enemy.slamCharging = false;
            const center = enemy.slamOrigin || enemy.getPosition();
            const radius = enemy.slamRadius || 3.2;
            this.effectsManager.createShockwaveBurst(center, radius);

            const dist = distance2D(center, playerPos);
            if (dist <= radius) {
                const slamDamage = enemy.damage * 1.25 * this.runModifiers.enemyDamageMultiplier;
                const playerDied = this.player.takeDamage(slamDamage);
                this.markCombatAction();
                const damagePos = playerPos.clone();
                damagePos.y = 1.2;
                this.ui.showDamageNumber(slamDamage, damagePos, this.camera, this.canvas, true);
                if (playerDied) return true;
            }
        }
        return false;
    }

    updatePetAttacks(deltaTime, playerPos) {
        const petStats = this.player.getAttackPetStats ? this.player.getAttackPetStats() : null;
        if (!petStats) return;

        this.petAttackTimer += deltaTime;
        if (this.petAttackTimer < petStats.interval) return;
        this.petAttackTimer = 0;

        const enemies = this.enemyManager.getEnemies()
            .filter((enemy) => !enemy.isDead && distance2D(enemy.getPosition(), playerPos) < petStats.range)
            .sort((a, b) => distance2D(a.getPosition(), playerPos) - distance2D(b.getPosition(), playerPos));

        const targetCount = Math.min(petStats.bolts, enemies.length);
        for (let i = 0; i < targetCount; i++) {
            const enemy = enemies[i];
            const enemyPos = enemy.getPosition();
            const isDead = enemy.takeDamage(petStats.damage, playerPos, 5);
            this.markCombatAction();
            this.applyLifesteal(petStats.damage * 0.3);

            const damagePos = enemyPos.clone();
            damagePos.y = 1.2;
            this.ui.showDamageNumber(petStats.damage, damagePos, this.camera, this.canvas);
            this.effectsManager.createHitEffect(enemyPos, 0x86efac);

            if (isDead) {
                this.handleEnemyDeath(enemy, enemyPos, playerPos);
            }
        }
    }

    updateSlowMeteorRain(deltaTime, playerPos) {
        if (this.player.slowMeteorCharges > 0) {
            this.player.slowMeteorTimer -= deltaTime;
            if (this.player.slowMeteorTimer <= 0) {
                this.player.slowMeteorCharges -= 1;
                this.player.slowMeteorTimer = randomFloat(0.35, 0.7);
                const angle = Math.random() * Math.PI * 2;
                const dist = randomFloat(0.8, this.player.abilities.slowField.radius + 1.8);
                const impact = new THREE.Vector3(
                    playerPos.x + Math.cos(angle) * dist,
                    0,
                    playerPos.z + Math.sin(angle) * dist
                );
                this.effectsManager.createGroundWarning(impact, 1.5, 0x7dd3fc, 0.7);
                this.iceMeteors.push({
                    position: impact,
                    radius: 1.9,
                    damage: this.player.getAttackDamage() * 0.9,
                    delay: 0.7
                });
            }
        }

        if (this.iceMeteors.length === 0) return;
        const enemies = this.enemyManager.getEnemies();
        for (let i = this.iceMeteors.length - 1; i >= 0; i--) {
            const meteor = this.iceMeteors[i];
            meteor.delay -= deltaTime;
            if (meteor.delay > 0) continue;

            this.effectsManager.createShockwaveBurst(meteor.position, meteor.radius);
            for (const enemy of enemies) {
                if (enemy.isDead) continue;
                const enemyPos = enemy.getPosition();
                const dist = distance2D(meteor.position, enemyPos);
                if (dist > meteor.radius) continue;
                const damage = meteor.damage * (1 - (dist / meteor.radius) * 0.35);
                const isDead = enemy.takeDamage(damage, meteor.position, 9);
                this.markCombatAction();
                this.registerPlayerEngagement(0.22);
                this.applyLifesteal(damage * 0.35);
                const dmgPos = enemyPos.clone();
                dmgPos.y = 1.1;
                this.ui.showDamageNumber(damage, dmgPos, this.camera, this.canvas, true);
                if (isDead) {
                    this.handleEnemyDeath(enemy, enemyPos, playerPos);
                }
            }
            this.iceMeteors.splice(i, 1);
        }
    }

    createSlashEffect(position, direction, range) {
        // Simple, clear slash arc that matches hitbox
        const arcAngle = Math.PI / 3; // 60 degrees (30° each side)
        const segments = 20;
        const visualRange = range * 0.6; // Reduce visual range to 60% to match actual sword

        // Create arc points manually in 3D space
        const points3D = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            // Angle relative to player's facing direction
            const localAngle = -arcAngle / 2 + arcAngle * t;
            const worldAngle = direction + localAngle;

            // Calculate position on arc
            const x = position.x + Math.sin(worldAngle) * visualRange;
            const z = position.z + Math.cos(worldAngle) * visualRange;
            const y = 0.5;

            points3D.push(new THREE.Vector3(x, y, z));
        }

        // Create thick line geometry
        const slashGeometry = new THREE.BufferGeometry().setFromPoints(points3D);
        const slashMaterial = new THREE.LineBasicMaterial({
            color: 0xccddff,
            linewidth: 5,
            transparent: true,
            opacity: 0.8
        });

        const slashLine = new THREE.Line(slashGeometry, slashMaterial);
        this.effectsManager.scene.add(slashLine);

        // Add glow effect with tube
        const tubePath = new THREE.CatmullRomCurve3(points3D);
        const tubeGeometry = new THREE.TubeGeometry(tubePath, segments, 0.15, 8, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x8899ff,
            transparent: true,
            opacity: 0.6
        });
        const slashTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.effectsManager.scene.add(slashTube);

        // Animate slash - fade out only, no movement
        let time = 0;
        const duration = 0.35; // Match attack duration

        const animateSlash = () => {
            time += 0.016; // ~60fps
            const progress = time / duration;

            if (progress >= 1) {
                // Remove slash
                this.effectsManager.scene.remove(slashLine);
                this.effectsManager.scene.remove(slashTube);
                if (slashGeometry) slashGeometry.dispose();
                if (slashMaterial) slashMaterial.dispose();
                if (tubeGeometry) tubeGeometry.dispose();
                if (tubeMaterial) tubeMaterial.dispose();
                return;
            }

            // Fade out
            const opacity = 1 - progress;
            slashMaterial.opacity = opacity * 0.8;
            tubeMaterial.opacity = opacity * 0.6;

            requestAnimationFrame(animateSlash);
        };

        animateSlash();
    }

    markCombatAction() {
        this.lastCombatActionTime = Date.now() / 1000;
    }

    getCombatIdleSeconds() {
        return (Date.now() / 1000) - this.lastCombatActionTime;
    }

    registerPlayerEngagement(weight = 0.2, isMelee = false) {
        const now = Date.now() / 1000;
        this.playerEngagement = Math.min(4, this.playerEngagement + Math.max(0, weight));
        this.lastPlayerEngagementTime = now;
        if (isMelee) {
            this.lastMeleeHitTime = now;
        }
    }

    getPlayerEngagementScore() {
        return this.playerEngagement;
    }

    getSecondsSincePlayerEngagement() {
        return (Date.now() / 1000) - this.lastPlayerEngagementTime;
    }

    getSecondsSinceMeleeHit() {
        return (Date.now() / 1000) - this.lastMeleeHitTime;
    }
}
