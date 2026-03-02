// UI Manager

class UIManager {
    constructor() {
        // HUD Elements
        this.levelDisplay = document.getElementById('level-display');
        this.healthBar = document.getElementById('health-bar');
        this.healthText = document.getElementById('health-text');
        this.xpBar = document.getElementById('xp-bar');
        this.xpText = document.getElementById('xp-text');
        this.coinDisplay = document.getElementById('coin-display');
        this.killsDisplay = document.getElementById('kills-display');
        this.waveDisplay = document.getElementById('wave-display');
        this.waveTimer = document.getElementById('wave-timer');
        this.waveProgressFill = document.getElementById('wave-progress-fill');
        this.waveMilestones = document.getElementById('wave-milestones');
        this.waveCurrentLabel = document.getElementById('wave-current-label');
        this.waveNextLabel = document.getElementById('wave-next-label');
        this.runEvent = document.getElementById('run-event');
        this.heroUpgradeHint = document.getElementById('hero-upgrade-hint');
        this.objectiveTrack = document.getElementById('objective-track');
        this.objectiveTitle = document.getElementById('objective-title');
        this.objectiveFill = document.getElementById('objective-fill');
        this.objectiveMeta = document.getElementById('objective-meta');

        // Ability Elements
        this.ultimateBar = document.getElementById('ultimate-bar');
        this.ultimateText = document.getElementById('ultimate-text');
        this.shieldBar = document.getElementById('shield-bar');
        this.shieldText = document.getElementById('shield-text');
        this.skillPointsDisplay = document.getElementById('skill-points-display');
        this.skillTooltip = document.getElementById('skill-tooltip');
        this.helpScreen = document.getElementById('help-screen');
        this.helpOpenButton = document.getElementById('help-open-button');
        this.helpCloseButton = document.getElementById('help-close-button');
        this.helpSkillsList = document.getElementById('help-skills-list');
        this.helpToggleCallback = null;
        this.pauseScreen = document.getElementById('pause-screen');
        this.pauseContinueButton = document.getElementById('pause-continue-button');
        this.pauseExitButton = document.getElementById('pause-exit-button');
        this.pauseContinueCallback = null;
        this.pauseExitCallback = null;
        this.abilityLocks = {
            1: document.getElementById('ability1-lock'),
            2: document.getElementById('ability2-lock'),
            3: document.getElementById('ability3-lock'),
            4: document.getElementById('ability4-lock'),
            5: document.getElementById('ability5-lock'),
            6: document.getElementById('ability6-lock')
        };
        this.abilityTiers = {
            1: document.getElementById('ability1-tier'),
            2: document.getElementById('ability2-tier'),
            3: document.getElementById('ability3-tier'),
            4: document.getElementById('ability4-tier'),
            5: document.getElementById('ability5-tier'),
            6: document.getElementById('ability6-tier')
        };
        this.abilitySlots = Array.from(document.querySelectorAll('.ability-slot[data-skill-id]'));
        this.skillHudState = null;
        this.skillUpgradeCallback = null;
        this.hoveredSkillId = null;
        this.eventQueue = [];
        this.isEventShowing = false;
        this.bindSkillSlots();
        this.bindHelp();
        this.bindPauseMenu();

        // Event Broadcast
        this.eventOverlay = document.getElementById('event-overlay');
        this.eventBanner = document.getElementById('event-banner');
        this.eventTimeout = null;

        // Shop Modal
        this.shopScreen = document.getElementById('shop-screen');
        this.shopCoinsLabel = document.getElementById('shop-coins-label');
        this.shopCards = document.getElementById('shop-cards');
        this.shopMessage = document.getElementById('shop-message');
        this.shopRerollButton = document.getElementById('shop-reroll-button');
        this.shopCloseButton = document.getElementById('shop-close-button');
        this.shopMessageTimeout = null;

        // Level Up Notification
        this.levelUpNotification = document.getElementById('level-up-notification');
        this.newLevelText = document.getElementById('new-level');

        // Game Over Screen
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.finalLevel = document.getElementById('final-level');
        this.finalCoins = document.getElementById('final-coins');
        this.finalKills = document.getElementById('final-kills');
        this.restartButton = document.getElementById('restart-button');

        // Damage Numbers Container
        this.damageNumbersContainer = document.getElementById('damage-numbers');
        this.notificationFeed = document.getElementById('notification-feed');
    }

    updateHealth(current, max) {
        const percentage = (current / max) * 100;
        this.healthBar.style.width = percentage + '%';
        this.healthText.textContent = `HP ${Math.ceil(current)} / ${max}`;
    }

    updateXP(current, required) {
        const percentage = (current / required) * 100;
        this.xpBar.style.width = percentage + '%';
        this.xpText.textContent = `XP ${current} / ${required}`;
    }

    updateLevel(level) {
        this.levelDisplay.textContent = level;
    }

    updateCoins(coins) {
        this.coinDisplay.textContent = formatNumber(coins);
    }

    updateKills(kills) {
        this.killsDisplay.textContent = formatNumber(kills);
    }

    updateWave(wave, timeLeft, waveDuration = 28, shopEvery = 3) {
        this.waveDisplay.textContent = wave;
        const nextWave = wave + 1;
        const nextIsShop = nextWave % shopEvery === 0;
        if (this.waveCurrentLabel) this.waveCurrentLabel.textContent = `Волна ${wave}`;
        if (this.waveNextLabel) this.waveNextLabel.textContent = `${nextIsShop ? '🛒 ' : ''}${nextWave}`;

        const progress = clamp(1 - (timeLeft / Math.max(1, waveDuration)), 0, 1);
        if (this.waveProgressFill) {
            this.waveProgressFill.style.width = `${Math.floor(progress * 100)}%`;
        }
        if (this.waveTimer && !this.waveTimer.textContent) {
            this.waveTimer.textContent = 'БОЙ';
        }

        if (this.waveMilestones) {
            const currentBlockStart = Math.floor((wave - 1) / shopEvery) * shopEvery + 1;
            let html = '';
            for (let i = 0; i < 6; i++) {
                const w = currentBlockStart + i;
                const shop = w % shopEvery === 0;
                const cls = `milestone${w === wave ? ' current' : ''}${shop ? ' shop' : ''}`;
                html += `<div class="${cls}">${shop ? `🛒${w}` : w}</div>`;
            }
            this.waveMilestones.innerHTML = html;
        }
    }

    updateRunEvent(text, isActive = false) {
        if (!this.runEvent) return;
        this.runEvent.textContent = text;
        this.runEvent.classList.toggle('active', isActive);
    }

    bindSkillSlots() {
        for (const slot of this.abilitySlots) {
            const skillId = slot.dataset.skillId;
            slot.addEventListener('mouseenter', (e) => {
                this.hoveredSkillId = skillId;
                this.renderSkillTooltip(skillId, e.clientX, e.clientY);
            });
            slot.addEventListener('mousemove', (e) => {
                if (this.hoveredSkillId !== skillId) return;
                this.renderSkillTooltip(skillId, e.clientX, e.clientY);
            });
            slot.addEventListener('mouseleave', () => {
                if (this.hoveredSkillId === skillId) {
                    this.hoveredSkillId = null;
                    this.hideSkillTooltip();
                }
            });
            slot.addEventListener('click', () => {
                if (this.skillUpgradeCallback) {
                    this.skillUpgradeCallback(skillId);
                }
            });
        }
    }

    onSkillUpgrade(callback) {
        this.skillUpgradeCallback = callback;
    }

    bindHelp() {
        if (this.helpOpenButton) {
            this.helpOpenButton.addEventListener('click', () => this.openHelp());
        }
        if (this.helpCloseButton) {
            this.helpCloseButton.addEventListener('click', () => this.closeHelp());
        }
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key !== 'h' && key !== 'р') return;
            if (this.helpScreen && !this.helpScreen.classList.contains('hidden')) {
                this.closeHelp();
            } else {
                this.openHelp();
            }
        });
    }

    onHelpToggle(callback) {
        this.helpToggleCallback = callback;
    }

    bindPauseMenu() {
        if (this.pauseContinueButton) {
            this.pauseContinueButton.addEventListener('click', () => {
                if (this.pauseContinueCallback) this.pauseContinueCallback();
            });
        }
        if (this.pauseExitButton) {
            this.pauseExitButton.addEventListener('click', () => {
                if (this.pauseExitCallback) this.pauseExitCallback();
            });
        }
    }

    onPauseContinue(callback) {
        this.pauseContinueCallback = callback;
    }

    onPauseExit(callback) {
        this.pauseExitCallback = callback;
    }

    showPauseMenu() {
        if (!this.pauseScreen) return;
        this.pauseScreen.classList.remove('hidden');
    }

    hidePauseMenu() {
        if (!this.pauseScreen) return;
        this.pauseScreen.classList.add('hidden');
    }

    isPauseMenuOpen() {
        return !!(this.pauseScreen && !this.pauseScreen.classList.contains('hidden'));
    }

    isHelpOpen() {
        return !!(this.helpScreen && !this.helpScreen.classList.contains('hidden'));
    }

    openHelp() {
        if (!this.helpScreen) return;
        this.helpScreen.classList.remove('hidden');
        if (this.helpToggleCallback) this.helpToggleCallback(true);
    }

    closeHelp() {
        if (!this.helpScreen) return;
        this.helpScreen.classList.add('hidden');
        if (this.helpToggleCallback) this.helpToggleCallback(false);
    }

    updateSkillHud(skillHudState) {
        this.skillHudState = skillHudState;
        if (!skillHudState || !skillHudState.skills) return;

        if (this.skillPointsDisplay) {
            this.skillPointsDisplay.textContent = `${skillHudState.points}`;
        }
        if (this.heroUpgradeHint) {
            this.heroUpgradeHint.textContent = '';
        }
        this.renderHelpSkills(skillHudState);

        for (const skillId of Object.keys(skillHudState.skills)) {
            const skill = skillHudState.skills[skillId];
            const lockEl = this.abilityLocks[skill.slot];
            const tierEl = this.abilityTiers[skill.slot];
            const isUnlocked = skill.tier > 0;
            if (tierEl) tierEl.textContent = `T${skill.tier}`;
            if (lockEl) {
                lockEl.style.display = isUnlocked ? 'none' : 'flex';
                lockEl.textContent = `+${skill.nextCost}`;
            }
        }

        if (this.hoveredSkillId) {
            this.renderSkillTooltip(this.hoveredSkillId);
        }
    }

    renderHelpSkills(skillHudState) {
        if (!this.helpSkillsList) return;
        const rows = Object.values(skillHudState.skills || {})
            .map((skill) => `
                <div class="skill-row">
                    <div class="title">${skill.title} [${skill.key}] - T${skill.tier}/${skill.maxTier}</div>
                    ${skill.lines.map((line) => `<div class="line">${line}</div>`).join('')}
                </div>
            `)
            .join('');
        this.helpSkillsList.innerHTML = rows;
    }

    renderSkillTooltip(skillId, x = null, y = null) {
        if (!this.skillTooltip || !this.skillHudState || !this.skillHudState.skills) return;
        const skill = this.skillHudState.skills[skillId];
        if (!skill) return;

        const lines = skill.lines
            .map((line, idx) => `<div class="line ${skill.tier >= idx + 1 ? 'active' : ''}">${line}</div>`)
            .join('');
        const costText = skill.tier >= skill.maxTier
            ? 'MAX'
            : `Следующий ранг: ${skill.nextCost} очк.`;

        this.skillTooltip.innerHTML = `
            <div class="head"><span>${skill.title} [${skill.key}]</span><span>T${skill.tier}/${skill.maxTier}</span></div>
            ${lines}
            <div class="line">${costText}</div>
            <div class="line">Нажми на иконку для прокачки</div>
        `;

        this.skillTooltip.classList.remove('hidden');
        if (x != null && y != null) {
            const left = Math.min(window.innerWidth - 340, x + 14);
            const top = Math.min(window.innerHeight - 220, y + 14);
            this.skillTooltip.style.left = `${left}px`;
            this.skillTooltip.style.top = `${top}px`;
        }
    }

    hideSkillTooltip() {
        if (!this.skillTooltip) return;
        this.skillTooltip.classList.add('hidden');
    }

    showEventBroadcast(text, type = null) {
        // Large broadcast overlay disabled by design.
        if (this.eventOverlay) this.eventOverlay.classList.add('hidden');
    }

    showMinorNotice(text, type = 'info', lifetimeMs = 3200) {
        if (!this.notificationFeed) return;
        const finalLifetime = Math.max(4200, lifetimeMs || 0);
        const item = document.createElement('div');
        item.className = `notice-item${type === 'error' ? ' error' : (type === 'good' ? ' good' : '')}`;
        item.textContent = text;
        this.notificationFeed.appendChild(item);
        while (this.notificationFeed.children.length > 4) {
            this.notificationFeed.removeChild(this.notificationFeed.firstChild);
        }
        setTimeout(() => item.classList.add('fade-out'), Math.max(120, finalLifetime - 320));
        setTimeout(() => {
            if (item.parentNode) item.parentNode.removeChild(item);
        }, finalLifetime);
    }

    playNextBroadcast() {
        if (!this.eventOverlay || !this.eventBanner) return;
        if (this.eventQueue.length === 0) {
            this.isEventShowing = false;
            return;
        }
        this.isEventShowing = true;
        const payload = this.eventQueue.shift();
        const text = payload?.text || '';
        const eventType = payload?.type || this.resolveEventType(text);
        this.eventBanner.textContent = text;
        this.eventOverlay.classList.remove('event-hunt', 'event-blood', 'event-heal', 'event-gold');
        this.eventBanner.classList.remove('event-hunt', 'event-blood', 'event-heal', 'event-gold');
        if (eventType) {
            this.eventBanner.classList.add(`event-${eventType}`);
            this.eventOverlay.classList.add(`event-${eventType}`);
        }
        this.eventOverlay.classList.remove('hidden');

        if (this.eventTimeout) {
            clearTimeout(this.eventTimeout);
        }

        this.eventTimeout = setTimeout(() => {
            this.eventOverlay.classList.add('hidden');
            this.eventTimeout = null;
            setTimeout(() => this.playNextBroadcast(), 120);
        }, 1500);
    }

    resolveEventType(text) {
        const source = String(text || '').toLowerCase();
        if (source.includes('охота')) return 'hunt';
        if (source.includes('кровавая луна')) return 'blood';
        if (source.includes('живительный туман')) return 'heal';
        if (source.includes('золотая лихорадка')) return 'gold';
        return null;
    }

    updateObjectiveProgress({ visible = false, title = 'ЗОНА КОНТРОЛЯ', progress = 0, timeLeft = 0 } = {}) {
        if (!this.objectiveTrack || !this.objectiveFill || !this.objectiveMeta) return;
        this.objectiveTrack.classList.toggle('hidden', !visible);
        if (!visible) return;

        if (this.objectiveTitle) this.objectiveTitle.textContent = title;
        const clampedProgress = clamp(progress, 0, 1);
        this.objectiveFill.style.width = `${Math.floor(clampedProgress * 100)}%`;
        this.objectiveMeta.textContent = `${Math.floor(clampedProgress * 100)}% • ${Math.max(0, Math.ceil(timeLeft))}с`;
    }

    updateUltimate(current, required) {
        const percentage = Math.min((current / required) * 100, 100);
        this.ultimateBar.style.width = percentage + '%';
        this.ultimateText.textContent = `${current} / ${required}`;
    }

    updateShield(current, max) {
        const percentage = (current / max) * 100;
        this.shieldBar.style.width = percentage + '%';
        this.shieldText.textContent = `${Math.ceil(current)} / ${max}`;
    }

    updateAbilityCooldown(abilityNumber, cooldownPercent) {
        const cooldownEl = document.getElementById(`ability${abilityNumber}-cooldown`);
        if (cooldownEl) {
            cooldownEl.style.height = `${cooldownPercent}%`;
        }
    }

    showLevelUp(newLevel) {
        // Large level-up popup disabled; level-up is shown in compact feed.
        if (!this.levelUpNotification) return;
        this.newLevelText.textContent = newLevel;
        this.levelUpNotification.classList.remove('show');
        this.levelUpNotification.classList.add('hidden');
    }

    showDamageNumber(damage, worldPos, camera, canvas, isCritical = false, isHeal = false) {
        const screenPos = worldToScreen(worldPos, camera, canvas);

        const damageNumber = document.createElement('div');
        let className = 'damage-number';
        if (isCritical) className += ' critical';
        if (isHeal) className += ' heal';

        damageNumber.className = className;
        damageNumber.textContent = (isHeal ? '+' : '') + Math.ceil(damage);
        damageNumber.style.left = screenPos.x + 'px';
        damageNumber.style.top = screenPos.y + 'px';

        this.damageNumbersContainer.appendChild(damageNumber);

        setTimeout(() => {
            damageNumber.remove();
        }, 1000);
    }

    showShop(shopState, onBuy, onClose, onReroll) {
        this.shopScreen.classList.remove('hidden');
        this.renderShop(shopState, onBuy);
        this.shopRerollButton.textContent = `Обновить (${formatNumber(shopState.rerollCost || 25)})`;

        this.shopRerollButton.onclick = () => onReroll();
        this.shopCloseButton.onclick = () => onClose();
    }

    hideShop() {
        this.shopScreen.classList.add('hidden');
        this.shopCards.innerHTML = '';
        this.showShopMessage('');
    }

    renderShop(shopState, onBuy) {
        this.shopCoinsLabel.textContent = `Монеты: ${formatNumber(shopState.coins)}`;
        this.shopCards.innerHTML = '';

        for (const option of shopState.options) {
            const card = document.createElement('div');
            card.className = 'shop-card';

            const canBuy = option.available && shopState.coins >= option.cost;
            const buttonClass = canBuy ? 'shop-buy-btn' : 'shop-buy-btn disabled';
            const levelText = option.maxLevel == null
                ? `Ур: ${option.level}`
                : `Ур: ${option.level}/${option.maxLevel}`;
            const statusText = option.available ? '' : (option.unavailableReason || 'Недоступно');
            const lackText = option.available
                ? `Нужно ${formatNumber(option.cost)}`
                : statusText;

            card.innerHTML = `
                <div class="shop-card-title">${option.title}</div>
                <div class="shop-card-desc">${option.description}</div>
                <div class="shop-card-meta">
                    <span>Редкость: ${option.rarity}</span>
                    <span>Цена: ${formatNumber(option.cost)}</span>
                </div>
                <div class="shop-card-meta">
                    <span>${levelText}</span>
                    <span>${option.preview || ''}</span>
                </div>
                <button class="${buttonClass}" data-id="${option.id}">
                    ${canBuy ? 'Купить' : (lackText || 'Недоступно')}
                </button>
            `;

            const button = card.querySelector('button');
            if (canBuy) {
                button.addEventListener('click', () => onBuy(option.id));
            }

            this.shopCards.appendChild(card);
        }
    }

    showShopMessage(text, isError = false) {
        if (!this.shopMessage) return;

        this.shopMessage.textContent = text;
        this.shopMessage.classList.toggle('error', isError);

        if (this.shopMessageTimeout) {
            clearTimeout(this.shopMessageTimeout);
            this.shopMessageTimeout = null;
        }

        if (text) {
            this.showMinorNotice(text, isError ? 'error' : 'good', isError ? 3600 : 3000);
            this.shopMessageTimeout = setTimeout(() => {
                this.shopMessage.textContent = '';
                this.shopMessage.classList.remove('error');
                this.shopMessageTimeout = null;
            }, 1400);
        }
    }

    showGameOver(level, coins, kills) {
        this.finalLevel.textContent = level;
        this.finalCoins.textContent = formatNumber(coins);
        this.finalKills.textContent = formatNumber(kills);

        this.gameOverScreen.classList.remove('hidden');
        setTimeout(() => {
            this.gameOverScreen.classList.add('show');
        }, 100);
    }

    hideGameOver() {
        this.gameOverScreen.classList.remove('show');
        setTimeout(() => {
            this.gameOverScreen.classList.add('hidden');
        }, 500);
    }

    onRestart(callback) {
        this.restartButton.addEventListener('click', callback);
    }
}
