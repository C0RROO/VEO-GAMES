// Main Game Class

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;

        // Wave system
        this.wave = 1;
        this.waveDuration = 28;
        this.waveTimer = this.waveDuration;
        this.shopEveryNWaves = 3;
        this.wavesUntilShop = this.shopEveryNWaves;
        this.isShopOpen = false;
        this.awaitingShopClear = false;
        this.frostAuraTick = 0;
        this.kiteDirector = {
            active: false,
            kiteTime: 0,
            driftTime: 0,
            interceptCooldown: 0,
            playerMoveDir: { x: 0, z: 1 },
            previousPosition: null
        };

        // Event system
        this.runEventTimer = 0;
        this.runEventCooldown = 24;
        this.activeRunEvent = null;
        this.activeRunEventTimeLeft = 0;
        this.runModifiers = {
            bonusCoinsPerKill: 0,
            enemyDamageMultiplier: 1,
            enemySpeedMultiplier: 1,
            playerRegenPerSecond: 0
        };

        // Shop
        this.shopState = {
            options: [],
            rerollCost: 25
        };
        this.objectiveZone = {
            active: false,
            timerToNext: 18,
            timeLimit: 22,
            timeLeft: 0,
            progress: 0,
            required: 7.5,
            radius: 3.2,
            position: new THREE.Vector3(),
            ring: null,
            halo: null,
            earlyShown: false
        };

        this.init();
    }

    init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupGround();
        this.setupHotkeys();

        this.ui = new UIManager();
        this.soundManager = new SoundManager();
        this.player = new Player(this.scene);
        this.enemyManager = new EnemyManager(this.scene, this.player);
        this.coinManager = new CoinManager(this.scene, this.player);
        this.healthPickupManager = new HealthPickupManager(this.scene, this.player);
        this.effectsManager = new EffectsManager(this.scene);
        this.combatManager = new CombatManager(
            this.player,
            this.enemyManager,
            this.coinManager,
            this.healthPickupManager,
            this.effectsManager,
            this.ui,
            this.camera,
            this.canvas,
            this.soundManager
        );
        this.kiteDirector.previousPosition = this.player.getPosition().clone();

        this.ui.onRestart(() => this.restart());
        this.ui.onHelpToggle((open) => {
            this.isPaused = open || this.isShopOpen || this.ui.isPauseMenuOpen();
        });
        this.ui.onPauseContinue(() => this.closePauseMenu());
        this.ui.onPauseExit(() => {
            window.location.assign('./menu.html');
        });
        this.ui.onSkillUpgrade((skillId) => this.handleSkillUpgrade(skillId));
        this.ui.updateRunEvent('СОБЫТИЕ: нет', false);
        this.ui.updateWave(this.wave, this.waveTimer, this.waveDuration, this.shopEveryNWaves);
        this.ui.updateSkillHud(this.player.getSkillHudState());
        this.ui.updateObjectiveProgress({ visible: false });

        this.start();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        this.scene.fog = new THREE.Fog(0x0a0e27, 20, 50);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.camera.position.set(0, 20, 15);
        this.camera.lookAt(0, 0, 0);
        this.cameraOffset = new THREE.Vector3(0, 14, 10);
        this.cameraTarget = new THREE.Vector3(0, 14, 10);
        this.cameraLookTarget = new THREE.Vector3(0, 0, 0);
        this.cameraLookDesired = new THREE.Vector3(0, 0, 0);
        this.cameraFollowSpeed = 14;
        this.cameraLookSpeed = 18;
        this.cameraSnapDistance = 5;
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        this.playerLight = new THREE.PointLight(0x6366f1, 1, 10);
        this.playerLight.position.y = 5;
        this.scene.add(this.playerLight);
    }

    setupGround() {
        const groundSize = 100;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: 0x1a1a2e,
            shininess: 10
        });

        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        const gridHelper = new THREE.GridHelper(groundSize, 50, 0x6366f1, 0x2a2a3e);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.scene.add(gridHelper);
    }

    setupHotkeys() {
        window.addEventListener('keydown', (e) => {
            const isEscape = e.key === 'Escape' || e.key === 'Esc' || e.code === 'Escape' || e.keyCode === 27;
            if (!isEscape) return;
            e.preventDefault();
            this.togglePauseMenu();
        }, true);
    }

    togglePauseMenu() {
        if (!this.ui || this.isShopOpen) return;
        if (this.ui.gameOverScreen && !this.ui.gameOverScreen.classList.contains('hidden')) return;

        if (this.ui.isHelpOpen()) {
            this.ui.closeHelp();
            this.isPaused = this.isShopOpen || this.ui.isPauseMenuOpen();
            return;
        }

        if (this.ui.isPauseMenuOpen()) {
            this.closePauseMenu();
            return;
        }

        this.ui.showPauseMenu();
        this.isPaused = true;
    }

    closePauseMenu() {
        if (!this.ui) return;
        this.ui.hidePauseMenu();
        this.isPaused = this.isShopOpen || this.ui.isHelpOpen();
    }

    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (!this.isPaused) {
            this.update(deltaTime);
        }

        this.render();
    }

    update(deltaTime) {
        deltaTime = Math.min(deltaTime, 0.1);

        // Wave progression
        if (!this.awaitingShopClear && !this.isShopOpen) {
            this.waveTimer -= deltaTime;
            if (this.waveTimer <= 0) {
                this.onWaveTimerElapsed();
            }
        }

        this.player.update(deltaTime, this.camera, this.canvas);

        if (this.player.ultimateJustActivated) {
            this.effectsManager.createUltimateEffect(this.player.getPosition());
            this.player.ultimateJustActivated = false;
        }
        if (this.player.dashJustActivated) {
            this.effectsManager.createDashEffect(this.player.getPosition());
            this.player.dashJustActivated = false;
        }
        if (this.player.shieldRechargeJustActivated) {
            this.effectsManager.createShieldRechargeEffect(this.player.getPosition());
            this.player.shieldRechargeJustActivated = false;
        }
        if (this.player.damageBoostJustActivated) {
            this.effectsManager.createDamageBoostEffect(this.player.getPosition());
            this.player.damageBoostJustActivated = false;
        }
        if (this.player.slowFieldJustActivated) {
            this.effectsManager.createSlowFieldEffect(this.player.getPosition(), this.player.abilities.slowField.radius);
            this.player.slowFieldJustActivated = false;
        }
        if (this.player.abilities.slowField.active) {
            this.frostAuraTick += deltaTime;
            if (this.frostAuraTick >= 0.09) {
                this.frostAuraTick = 0;
                this.effectsManager.createFrostAuraTick(this.player.getPosition(), 1.2);
            }
        } else {
            this.frostAuraTick = 0;
        }

        this.updateRunEvents(deltaTime);
        this.updateObjectiveZone(deltaTime);
        this.updateAntiKiteDirector(deltaTime);

        const waveProgress = this.awaitingShopClear
            ? 1
            : clamp(1 - (this.waveTimer / this.waveDuration), 0, 1);
        this.enemyManager.setWaveState(this.wave, waveProgress);
        this.enemyManager.update(deltaTime);

        const playerDied = this.combatManager.update(deltaTime);
        if (playerDied) {
            this.gameOver();
            return;
        }

        if (
            this.awaitingShopClear &&
            this.enemyManager.getEnemies().length === 0 &&
            !this.combatManager.hasActiveEnemyThreats()
        ) {
            this.awaitingShopClear = false;
            this.openWaveShop();
        }

        this.effectsManager.update(deltaTime);

        const playerPos = this.player.getPosition();
        this.cameraTarget.set(
            playerPos.x + this.cameraOffset.x,
            playerPos.y + this.cameraOffset.y,
            playerPos.z + this.cameraOffset.z
        );

        const followSpeed = this.player.abilities.dash.active
            ? this.cameraFollowSpeed * 1.35
            : this.cameraFollowSpeed;
        const followAlpha = 1 - Math.exp(-followSpeed * deltaTime);

        if (this.camera.position.distanceTo(this.cameraTarget) > this.cameraSnapDistance) {
            this.camera.position.copy(this.cameraTarget);
        } else {
            this.camera.position.lerp(this.cameraTarget, followAlpha);
        }

        this.cameraLookDesired.set(playerPos.x, 0.6, playerPos.z);
        const lookAlpha = 1 - Math.exp(-this.cameraLookSpeed * deltaTime);
        this.cameraLookTarget.lerp(this.cameraLookDesired, lookAlpha);
        this.camera.lookAt(this.cameraLookTarget);

        this.playerLight.position.x = playerPos.x;
        this.playerLight.position.z = playerPos.z;

        this.ui.updateHealth(this.player.health, this.player.maxHealth);
        this.ui.updateXP(this.player.xp, this.player.xpRequired);
        this.ui.updateLevel(this.player.level);
        this.ui.updateCoins(this.player.coins);
        this.ui.updateKills(this.player.kills);
        this.ui.updateWave(this.wave, this.waveTimer, this.waveDuration, this.shopEveryNWaves);
        this.ui.updateUltimate(this.player.ultimateKills, this.player.ultimateKillsRequired);
        this.ui.updateShield(this.player.shield, this.player.maxShield);
        this.ui.updateSkillHud(this.player.getSkillHudState());

        const currentTimeSec = Date.now() / 1000;

        const dashCooldown = this.player.getDashCooldownPercent();
        this.ui.updateAbilityCooldown(1, dashCooldown);

        const shieldRechargeCooldown = this.player.isAbilityUnlocked('shieldRecharge')
            ? Math.max(0, (this.player.abilities.shieldRecharge.cooldown - (currentTimeSec - this.player.abilities.shieldRecharge.lastUsed)) / this.player.abilities.shieldRecharge.cooldown) * 100
            : 100;
        this.ui.updateAbilityCooldown(2, shieldRechargeCooldown);

        const boostUnlocked = this.player.isAbilityUnlocked('damageBoost');
        const boostCooldown = boostUnlocked
            ? Math.max(0, (this.player.abilities.damageBoost.cooldown - (currentTimeSec - this.player.abilities.damageBoost.lastUsed)) / this.player.abilities.damageBoost.cooldown) * 100
            : 100;
        this.ui.updateAbilityCooldown(3, boostCooldown);

        const slowUnlocked = this.player.isAbilityUnlocked('slowField');
        const slowCooldown = slowUnlocked
            ? Math.max(0, (this.player.abilities.slowField.cooldown - (currentTimeSec - this.player.abilities.slowField.lastUsed)) / this.player.abilities.slowField.cooldown) * 100
            : 100;
        this.ui.updateAbilityCooldown(4, slowCooldown);

        const arcUnlocked = this.player.isAbilityUnlocked('arcShot');
        const arcCooldown = arcUnlocked
            ? Math.max(0, (this.player.abilities.arcShot.cooldown - (currentTimeSec - this.player.abilities.arcShot.lastUsed)) / this.player.abilities.arcShot.cooldown) * 100
            : 100;
        this.ui.updateAbilityCooldown(5, arcCooldown);

        const shockwave = this.player.abilities.shockwave;
        const shockwaveCooldown = shockwave.unlocked
            ? Math.max(0, (shockwave.cooldown - (currentTimeSec - shockwave.lastUsed)) / shockwave.cooldown) * 100
            : 100;
        this.ui.updateAbilityCooldown(6, shockwaveCooldown);

        if (this.awaitingShopClear) {
            this.ui.waveTimer.textContent = 'ОЧИСТКА';
        } else if (this.isShopOpen) {
            this.ui.waveTimer.textContent = 'ЛАВКА';
        } else {
            this.ui.waveTimer.textContent = 'БОЙ';
        }
    }

    handleSkillUpgrade(skillId) {
        const result = this.player.upgradeSkill(skillId);
        this.ui.updateSkillHud(this.player.getSkillHudState());
        if (result.success) {
            this.ui.showMinorNotice(result.message, 'good');
            if (this.soundManager) this.soundManager.playUiSuccess();
        } else {
            this.ui.showMinorNotice(result.message || 'Недостаточно очков', 'error');
            if (this.soundManager) this.soundManager.playUiError();
        }
    }

    onWaveStarted() {
        this.ui.showEventBroadcast(`ВОЛНА ${this.wave}`);
        this.ui.showMinorNotice(`Волна ${this.wave} началась`, 'info', 3600);

        // incremental difficulty pressure
        this.enemyManager.maxEnemies += 2;
        this.enemyManager.spawnInterval = Math.max(0.38, this.enemyManager.spawnInterval * 0.94);

    }

    onWaveTimerElapsed() {
        this.wavesUntilShop -= 1;

        // Every 3rd combat wave: stop spawning and wait for full clear before shop.
        if (this.wavesUntilShop <= 0) {
            this.awaitingShopClear = true;
            this.enemyManager.spawningEnabled = false;
            this.waveTimer = 0;
            this.ui.showEventBroadcast('Зачистите волну для открытия лавки');
            this.ui.showMinorNotice('Зачистка: лавка откроется после убийства всех врагов', 'info', 4200);
            return;
        }

        this.wave += 1;
        this.waveTimer = this.waveDuration;
        this.enemyManager.spawningEnabled = true;
        this.onWaveStarted();
    }

    updateRunEvents(deltaTime) {
        this.runEventTimer += deltaTime;

        if (this.activeRunEvent) {
            this.activeRunEventTimeLeft -= deltaTime;
            this.ui.updateRunEvent(
                `СОБЫТИЕ: ${this.activeRunEvent} (${Math.max(0, Math.ceil(this.activeRunEventTimeLeft))}с)`,
                true
            );

            if (this.runModifiers.playerRegenPerSecond > 0) {
                this.player.health = Math.min(
                    this.player.maxHealth,
                    this.player.health + this.runModifiers.playerRegenPerSecond * deltaTime
                );
            }

            if (this.activeRunEventTimeLeft <= 0) {
                this.clearRunEvent();
            }
        } else if (this.runEventTimer >= this.runEventCooldown) {
            this.triggerRandomRunEvent();
            this.runEventTimer = 0;
        }

        this.enemyManager.globalSpeedMultiplier = this.runModifiers.enemySpeedMultiplier;
        this.enemyManager.globalDamageMultiplier = this.runModifiers.enemyDamageMultiplier;
        this.combatManager.setRunModifiers(this.runModifiers);
    }

    triggerRandomRunEvent() {
        const roll = Math.random();
        const duration = 14;

        if (roll < 0.34) {
            this.activeRunEvent = 'КРОВАВАЯ ЛУНА';
            this.runModifiers.enemySpeedMultiplier = 1.32;
            this.runModifiers.enemyDamageMultiplier = 1.18;
            this.runModifiers.bonusCoinsPerKill = 0;
            this.runModifiers.playerRegenPerSecond = 0;
        } else if (roll < 0.67) {
            this.activeRunEvent = 'ЗОЛОТАЯ ЛИХОРАДКА';
            this.runModifiers.enemySpeedMultiplier = 1;
            this.runModifiers.enemyDamageMultiplier = 1;
            this.runModifiers.bonusCoinsPerKill = 1;
            this.runModifiers.playerRegenPerSecond = 0;
        } else {
            this.activeRunEvent = 'ЖИВИТЕЛЬНЫЙ ТУМАН';
            this.runModifiers.enemySpeedMultiplier = 0.92;
            this.runModifiers.enemyDamageMultiplier = 1;
            this.runModifiers.bonusCoinsPerKill = 0;
            this.runModifiers.playerRegenPerSecond = 4.5;
        }

        this.activeRunEventTimeLeft = duration;
        this.ui.updateRunEvent(`СОБЫТИЕ: ${this.activeRunEvent}`, true);
        this.ui.showEventBroadcast(this.activeRunEvent);
        this.ui.showMinorNotice(`Событие началось: ${this.activeRunEvent}`, 'info', 4200);
    }

    clearRunEvent() {
        const finishedEvent = this.activeRunEvent;
        this.activeRunEvent = null;
        this.activeRunEventTimeLeft = 0;
        this.runModifiers.enemySpeedMultiplier = 1;
        this.runModifiers.enemyDamageMultiplier = 1;
        this.runModifiers.bonusCoinsPerKill = 0;
        this.runModifiers.playerRegenPerSecond = 0;
        this.ui.updateRunEvent('СОБЫТИЕ: нет', false);
        if (finishedEvent) {
            this.ui.showMinorNotice(`Событие завершено: ${finishedEvent}`, 'good', 3200);
        }
    }

    spawnObjectiveZone() {
        if (this.objectiveZone.active || this.isShopOpen || this.awaitingShopClear) return;
        const playerPos = this.player.getPosition();
        const p = randomPositionAround(playerPos, 6, 11);
        this.objectiveZone.position.set(p.x, 0, p.z);
        this.objectiveZone.active = true;
        this.objectiveZone.progress = 0;
        this.objectiveZone.timeLeft = this.objectiveZone.timeLimit;
        this.objectiveZone.timerToNext = randomFloat(28, 42);

        const ringGeometry = new THREE.TorusGeometry(this.objectiveZone.radius, 0.12, 10, 48);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x22d3ee,
            transparent: true,
            opacity: 0.72
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.set(p.x, 0.08, p.z);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);
        this.objectiveZone.ring = ring;

        const haloGeometry = new THREE.CircleGeometry(this.objectiveZone.radius, 48);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0x0891b2,
            transparent: true,
            opacity: 0.14,
            side: THREE.DoubleSide
        });
        const halo = new THREE.Mesh(haloGeometry, haloMaterial);
        halo.position.set(p.x, 0.03, p.z);
        halo.rotation.x = -Math.PI / 2;
        this.scene.add(halo);
        this.objectiveZone.halo = halo;

        this.ui.showEventBroadcast('Захватите зону контроля');
        this.ui.showMinorNotice('Новая цель: захватите зону контроля', 'info', 4200);
    }

    clearObjectiveZone() {
        if (this.objectiveZone.ring) {
            this.scene.remove(this.objectiveZone.ring);
            this.objectiveZone.ring.geometry.dispose();
            this.objectiveZone.ring.material.dispose();
            this.objectiveZone.ring = null;
        }
        if (this.objectiveZone.halo) {
            this.scene.remove(this.objectiveZone.halo);
            this.objectiveZone.halo.geometry.dispose();
            this.objectiveZone.halo.material.dispose();
            this.objectiveZone.halo = null;
        }
        this.objectiveZone.active = false;
        this.objectiveZone.progress = 0;
        this.objectiveZone.timeLeft = 0;
        this.ui.updateObjectiveProgress({ visible: false });
    }

    updateObjectiveZone(deltaTime) {
        if (this.isShopOpen || this.awaitingShopClear) {
            this.ui.updateObjectiveProgress({ visible: false });
            return;
        }
        if (this.wave < 3) {
            this.ui.updateObjectiveProgress({ visible: false });
            return;
        }

        if (!this.objectiveZone.active) {
            if (this.wave < 5 && this.objectiveZone.earlyShown) {
                this.ui.updateObjectiveProgress({ visible: false });
                return;
            }
            this.objectiveZone.timerToNext -= deltaTime;
            if (this.objectiveZone.timerToNext <= 0) {
                this.spawnObjectiveZone();
                if (this.wave < 5) this.objectiveZone.earlyShown = true;
            }
            this.ui.updateObjectiveProgress({ visible: false });
            return;
        }

        this.objectiveZone.timeLeft -= deltaTime;
        const playerPos = this.player.getPosition();
        const dist = distance2D(playerPos, this.objectiveZone.position);
        const inZone = dist <= this.objectiveZone.radius;

        if (inZone) {
            this.objectiveZone.progress += deltaTime;
            this.player.health = Math.min(this.player.maxHealth, this.player.health + deltaTime * 1.6);
        } else {
            this.objectiveZone.progress = Math.max(0, this.objectiveZone.progress - deltaTime * 0.6);
        }

        if (this.objectiveZone.ring && this.objectiveZone.halo) {
            const p = clamp(this.objectiveZone.progress / this.objectiveZone.required, 0, 1);
            this.objectiveZone.ring.rotation.z += deltaTime * (1.4 + p * 2.2);
            const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.05;
            this.objectiveZone.ring.scale.set(pulse, pulse, 1);
            this.objectiveZone.halo.material.opacity = 0.1 + p * 0.18;
            this.objectiveZone.ring.material.color.setHex(inZone ? 0x34d399 : 0x22d3ee);
        }

        const progress = clamp(this.objectiveZone.progress / this.objectiveZone.required, 0, 1);
        this.ui.updateObjectiveProgress({
            visible: true,
            title: 'ЗОНА КОНТРОЛЯ',
            progress,
            timeLeft: this.objectiveZone.timeLeft
        });

        if (this.objectiveZone.progress >= this.objectiveZone.required) {
            const rewardCoins = 18 + this.wave * 2;
            this.player.addCoins(rewardCoins);
            this.player.xp += 10 + this.wave * 2;
            this.player.abilities.dash.lastUsed -= 1.4;
            this.player.abilities.arcShot.lastUsed -= 1.2;
            this.ui.showEventBroadcast(`Зона захвачена: +${rewardCoins} монет`);
            this.ui.showMinorNotice(`Зона захвачена: +${rewardCoins} монет`, 'good', 4200);
            this.clearObjectiveZone();
            return;
        }

        if (this.objectiveZone.timeLeft <= 0) {
            this.enemyManager.applyDirectorBoost(1.24, 10);
            this.ui.showEventBroadcast('Зона потеряна: враги ускорены');
            this.ui.showMinorNotice('Зона потеряна: враги ускорены', 'error', 4200);
            this.clearObjectiveZone();
        }
    }

    updateAntiKiteDirector(deltaTime) {
        if (this.isShopOpen || this.awaitingShopClear) {
            this.kiteDirector.active = false;
            this.kiteDirector.kiteTime = 0;
            this.kiteDirector.driftTime = 0;
            this.kiteDirector.interceptCooldown = 0;
            return;
        }

        const playerPos = this.player.getPosition();
        if (!this.kiteDirector.previousPosition) {
            this.kiteDirector.previousPosition = playerPos.clone();
            return;
        }

        const dx = playerPos.x - this.kiteDirector.previousPosition.x;
        const dz = playerPos.z - this.kiteDirector.previousPosition.z;
        const traveled = Math.sqrt(dx * dx + dz * dz);
        const moveSpeed = traveled / Math.max(0.0001, deltaTime);
        if (traveled > 0.03) {
            const dir = normalize2D(dx, dz);
            this.kiteDirector.playerMoveDir.x = dir.x;
            this.kiteDirector.playerMoveDir.z = dir.z;
        }
        this.kiteDirector.previousPosition.copy(playerPos);

        const enemiesAlive = this.enemyManager.getEnemies().filter((enemy) => !enemy.isDead).length;
        const engagement = this.combatManager.getPlayerEngagementScore();
        const sinceEngagement = this.combatManager.getSecondsSincePlayerEngagement();
        const sinceMelee = this.combatManager.getSecondsSinceMeleeHit();
        const pureRun = enemiesAlive >= 8 && moveSpeed > 3.8;
        const lowEngagement = (engagement < 0.85 && sinceEngagement > 2.4) || sinceMelee > 7.5;
        const activeCombat = engagement >= 1.15 || sinceMelee < 2.1;
        const runningWithoutFight = pureRun && lowEngagement;

        if (pureRun) {
            this.kiteDirector.driftTime += deltaTime;
        } else {
            this.kiteDirector.driftTime = Math.max(0, this.kiteDirector.driftTime - deltaTime * 1.5);
        }

        if (activeCombat) {
            this.kiteDirector.kiteTime = Math.max(0, this.kiteDirector.kiteTime - deltaTime * 5.5);
            this.kiteDirector.driftTime = Math.max(0, this.kiteDirector.driftTime - deltaTime * 4);
        } else if (runningWithoutFight) {
            this.kiteDirector.kiteTime += deltaTime;
        } else {
            this.kiteDirector.kiteTime = Math.max(0, this.kiteDirector.kiteTime - deltaTime * 2.2);
        }

        if (!activeCombat && this.kiteDirector.driftTime > 10) {
            this.kiteDirector.kiteTime = Math.max(this.kiteDirector.kiteTime, 3.2);
        }

        if (this.kiteDirector.active && this.kiteDirector.kiteTime <= 0.75) {
            this.kiteDirector.active = false;
            this.kiteDirector.interceptCooldown = Math.max(0.6, this.kiteDirector.interceptCooldown);
            this.ui.showEventBroadcast('Охота окончена');
            this.ui.showMinorNotice('Охота окончена', 'good', 3200);
            return;
        }

        if (this.kiteDirector.kiteTime < 2.3) {
            return;
        }

        if (!this.kiteDirector.active) {
            this.kiteDirector.active = true;
            this.ui.showEventBroadcast('Охота началась');
            this.ui.showMinorNotice('Охота началась: награда за охотников не выдается', 'error', 4200);
        }

        const intensity = clamp((this.kiteDirector.kiteTime - 2.3) / 5, 0.4, 2.4);
        this.enemyManager.applyDirectorBoost(1.22 + intensity * 0.2, 1.4);
        this.kiteDirector.interceptCooldown -= deltaTime;
        if (this.kiteDirector.interceptCooldown <= 0) {
            this.enemyManager.spawnInterceptPack(this.kiteDirector.playerMoveDir, intensity);
            this.kiteDirector.interceptCooldown = Math.max(2.2 - intensity * 0.55, 1.0);
        }
    }

    openWaveShop() {
        this.isPaused = true;
        this.isShopOpen = true;
        if (this.soundManager) this.soundManager.playUiOpen();
        this.ui.showMinorNotice('Лавка открыта', 'good', 3200);

        this.shopState.options = this.generateShopOptions();
        this.shopState.rerollCost = Math.max(25, 18 + this.wave * 3);

        this.ui.showShop(
            {
                coins: this.player.coins,
                options: this.shopState.options,
                rerollCost: this.shopState.rerollCost
            },
            (id) => this.buyShopOption(id),
            () => this.closeWaveShop(),
            () => this.rerollShop()
        );
    }

    rerollShop() {
        if (this.player.coins < this.shopState.rerollCost) {
            if (this.soundManager) this.soundManager.playUiError();
            this.ui.showShopMessage(
                `Недостаточно монет: нужно ${formatNumber(this.shopState.rerollCost)}, у вас ${formatNumber(this.player.coins)}`,
                true
            );
            return;
        }
        if (this.soundManager) this.soundManager.playUiClick();
        this.player.coins -= this.shopState.rerollCost;
        this.shopState.options = this.generateShopOptions();
        this.ui.renderShop(
            { coins: this.player.coins, options: this.shopState.options, rerollCost: this.shopState.rerollCost },
            (id) => this.buyShopOption(id)
        );
        this.ui.shopRerollButton.textContent = `Обновить (${formatNumber(this.shopState.rerollCost)})`;
        this.ui.showShopMessage('Ассортимент обновлен');
    }

    buyShopOption(optionId) {
        const option = this.shopState.options.find((it) => it.id === optionId);
        if (!option) return;
        if (!option.available) {
            if (this.soundManager) this.soundManager.playUiError();
            this.ui.showShopMessage(option.unavailableReason || 'Это улучшение недоступно', true);
            return;
        }

        if (this.player.coins < option.cost) {
            if (this.soundManager) this.soundManager.playUiError();
            this.ui.showShopMessage(
                `Недостаточно монет: цена ${formatNumber(option.cost)}, у вас ${formatNumber(this.player.coins)}`,
                true
            );
            return;
        }

        const result = this.player.applyShopOption(option.effect);
        if (!result || result.success === false) {
            if (this.soundManager) this.soundManager.playUiError();
            this.ui.showShopMessage((result && result.message) || 'Покупка недоступна', true);
            return;
        }

        if (this.soundManager) this.soundManager.playUiSuccess();
        this.player.coins -= option.cost;
        this.ui.showShopMessage(`${option.title} приобретено`);
        this.shopState.options = this.generateShopOptions(this.shopState.options.map((o) => o.id));
        this.ui.renderShop(
            { coins: this.player.coins, options: this.shopState.options, rerollCost: this.shopState.rerollCost },
            (id) => this.buyShopOption(id)
        );
    }

    closeWaveShop() {
        this.isShopOpen = false;
        this.isPaused = false;
        this.ui.hideShop();
        if (this.soundManager) this.soundManager.playUiClose();
        this.ui.showMinorNotice('Лавка закрыта, бой продолжается', 'info', 3200);

        // Continue with next wave only after leaving the shop.
        this.wave += 1;
        this.waveTimer = this.waveDuration;
        this.wavesUntilShop = this.shopEveryNWaves;
        this.enemyManager.spawningEnabled = true;
        this.onWaveStarted();
    }

    generateShopOptions(existingIds = null) {
        const pool = this.createShopPool();
        const byId = {};
        for (const item of pool) byId[item.id] = item;

        if (existingIds && existingIds.length > 0) {
            return existingIds.map((id) => byId[id]).filter(Boolean);
        }

        const mandatory = ['heart_pet', 'attack_pet'];
        const mandatorySet = new Set(mandatory);
        const randomPool = pool.filter((item) => !mandatorySet.has(item.id));
        const result = [];
        const used = new Set();

        while (result.length < 3 && used.size < randomPool.length) {
            const idx = randomInt(0, randomPool.length - 1);
            if (used.has(idx)) continue;
            used.add(idx);
            result.push(randomPool[idx]);
        }

        return result.concat(mandatory.map((id) => byId[id]).filter(Boolean));
    }

    createShopPool() {
        const waveFactor = Math.max(1, this.wave);
        const levels = this.player.upgradeLevels;
        const mk = (id, title, description, rarity, baseCost, growth = 1.18, maxLevel = null, effect = null, preview = '') => {
            const level = levels[id] || 0;
            const cost = Math.ceil(baseCost * Math.pow(growth, level));
            const available = maxLevel == null || level < maxLevel;
            return {
                id,
                title,
                description,
                rarity,
                cost,
                effect: effect || { type: id },
                level,
                maxLevel,
                available,
                unavailableReason: available ? '' : 'Максимальный уровень',
                preview
            };
        };

        return [
            mk(
                'blade_core',
                'Кровавый клинок',
                '+6 урон, -0.02с кд удара',
                'Редкий',
                24 + waveFactor * 2,
                1.17,
                null,
                { type: 'blade_core' },
                `Урон: ${Math.round(this.player.damage)} -> ${Math.round(this.player.damage + 6)}`
            ),
            mk(
                'aegis_shell',
                'Эгида бастиона',
                '+26 макс. щита, +7 реген щита',
                'Редкий',
                26 + waveFactor * 2,
                1.18,
                null,
                { type: 'aegis_shell' },
                `Щит: ${Math.round(this.player.maxShield)} -> ${Math.round(this.player.maxShield + 26)}`
            ),
            mk(
                'rune_forge',
                'Кузня рун',
                'Усиление Arc Shot',
                'Магический',
                28 + waveFactor * 3,
                1.2,
                null,
                { type: 'rune_forge' },
                `Радиус руны: ${this.player.abilities.arcShot.explodeRadius.toFixed(1)} -> ${(this.player.abilities.arcShot.explodeRadius + 0.35).toFixed(1)}`
            ),
            mk(
                'magnet_core',
                'Магнитное ядро',
                '+1.2 радиус автоподбора, +3 притяжение',
                'Магический',
                22 + waveFactor * 2,
                1.19,
                null,
                { type: 'magnet_core' },
                `Радиус подбора: ${this.player.getCoinMagnetRadius().toFixed(1)} -> ${(this.player.getCoinMagnetRadius() + 1.2).toFixed(1)}`
            ),
            mk(
                'vampiric_edge',
                'Вампирическая грань',
                '+4% вампиризма',
                'Эпический',
                34 + waveFactor * 3,
                1.22,
                6,
                { type: 'vampiric_edge' },
                `Вампиризм: ${(this.player.lifestealPercent * 100).toFixed(0)}% -> ${((this.player.lifestealPercent + 0.04) * 100).toFixed(0)}%`
            ),
            mk(
                'celerity',
                'Всплеск темпа',
                '-6% ко всем кулдаунам, +0.35 скорость',
                'Редкий',
                30 + waveFactor * 3,
                1.2,
                10,
                { type: 'celerity' },
                `Скорость: ${this.player.moveSpeed.toFixed(2)} -> ${(this.player.moveSpeed + 0.35).toFixed(2)}`
            ),
            mk(
                'heart_pet',
                'Питомец-собиратель',
                'Собирает сердца в большом радиусе',
                'Легендарный',
                80 + waveFactor * 6,
                1.35,
                6,
                { type: 'heart_pet' },
                `Ур. ${this.player.pets.heart.level} -> ${this.player.pets.heart.level + 1}`
            ),
            mk(
                'attack_pet',
                'Боевой питомец',
                'Автоматически атакует ближайших врагов',
                'Легендарный',
                95 + waveFactor * 6,
                1.34,
                6,
                { type: 'attack_pet' },
                `Ур. ${this.player.pets.attack.level} -> ${this.player.pets.attack.level + 1}`
            )
        ];
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    gameOver() {
        this.isPaused = true;
        this.ui.showGameOver(this.player.level, this.player.coins, this.player.kills);
    }

    restart() {
        this.isPaused = false;
        this.isShopOpen = false;
        this.closePauseMenu();
        this.player.reset();
        this.enemyManager.reset();
        this.coinManager.reset();
        this.healthPickupManager.reset();
        this.effectsManager.clear();
        this.combatManager.clearProjectiles();
        this.clearObjectiveZone();

        this.wave = 1;
        this.waveTimer = this.waveDuration;
        this.wavesUntilShop = this.shopEveryNWaves;
        this.awaitingShopClear = false;
        this.frostAuraTick = 0;
        this.kiteDirector.active = false;
        this.kiteDirector.kiteTime = 0;
        this.kiteDirector.driftTime = 0;
        this.kiteDirector.interceptCooldown = 0;
        this.kiteDirector.playerMoveDir = { x: 0, z: 1 };
        this.kiteDirector.previousPosition = this.player.getPosition().clone();
        this.objectiveZone.timerToNext = 18;
        this.objectiveZone.earlyShown = false;
        if (this.soundManager) this.soundManager.playUiClick();
        this.runEventTimer = 0;
        this.clearRunEvent();

        this.ui.hideShop();
        this.ui.hideGameOver();

        this.ui.updateHealth(this.player.health, this.player.maxHealth);
        this.ui.updateXP(this.player.xp, this.player.xpRequired);
        this.ui.updateLevel(this.player.level);
        this.ui.updateCoins(this.player.coins);
        this.ui.updateKills(this.player.kills);
        this.ui.updateWave(this.wave, this.waveTimer, this.waveDuration, this.shopEveryNWaves);
        this.ui.updateRunEvent('СОБЫТИЕ: нет', false);
        this.ui.updateSkillHud(this.player.getSkillHudState());
        this.ui.updateObjectiveProgress({ visible: false });
        this.enemyManager.setWaveState(this.wave, 0);
    }
}

window.addEventListener('load', () => {
    new Game();
});
