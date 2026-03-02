// File-based SFX manager.

class SoundManager {
    constructor() {
        this.enabled = true;
        this.lastPlayed = {};
        this.sfx = {};
        this.load();
    }

    load() {
        const mk = (file, volume = 0.35, poolSize = 6) => {
            const pool = [];
            for (let i = 0; i < poolSize; i++) {
                const audio = new Audio(`assets/sfx/${file}`);
                audio.preload = 'auto';
                pool.push(audio);
            }
            return { pool, volume, idx: 0 };
        };

        this.sfx = {
            coin: mk('coin_pickup.wav', 0.32),
            heart: mk('heart_pickup.wav', 0.34),
            uiOpen: mk('ui_open.wav', 0.28, 3),
            uiClick: mk('ui_click.wav', 0.22, 4),
            uiClose: mk('ui_open.wav', 0.2, 3),
            uiError: mk('ui_error.wav', 0.25, 3),
            uiSuccess: mk('ui_click.wav', 0.25, 4)
        };
    }

    canPlay(tag, minIntervalSec = 0.03) {
        const now = performance.now() / 1000;
        const last = this.lastPlayed[tag] || 0;
        if (now - last < minIntervalSec) return false;
        this.lastPlayed[tag] = now;
        return true;
    }

    play(id, minIntervalSec = 0.03, pitchJitter = 0) {
        if (!this.enabled || !this.canPlay(id, minIntervalSec)) return;
        const sound = this.sfx[id];
        if (!sound || !sound.pool || sound.pool.length === 0) return;

        const inst = sound.pool[sound.idx];
        sound.idx = (sound.idx + 1) % sound.pool.length;
        inst.currentTime = 0;
        inst.volume = sound.volume;
        if (pitchJitter > 0) {
            inst.playbackRate = 1 + (Math.random() * 2 - 1) * pitchJitter;
        } else {
            inst.playbackRate = 1;
        }
        inst.play().catch(() => {});
    }

    playCoin() { this.play('coin', 0.04, 0.06); }
    playHeart() { this.play('heart', 0.06, 0.04); }
    playUiOpen() { this.play('uiOpen', 0.08, 0.02); }
    playUiClick() { this.play('uiClick', 0.05, 0.03); }
    playUiClose() { this.play('uiClose', 0.08, 0.02); }
    playUiError() { this.play('uiError', 0.08, 0.01); }
    playUiSuccess() { this.play('uiSuccess', 0.05, 0.04); }
}
