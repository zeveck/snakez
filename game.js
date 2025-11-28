// game.js - Game logic (config is in config.js)

// Helper: Get snake sprite name based on state
function getSnakeSpriteName(spritePrefix, state, inWater, onGround) {
    if (state === 'rolling') return `${spritePrefix}_rolling`;
    if (state === 'whipping') return `${spritePrefix}_extended`;
    if (inWater) return `${spritePrefix}_swimming`;
    if (!onGround) return `${spritePrefix}_jumping`;
    return `${spritePrefix}_idle`;
}

// Helper: Calculate sprite dimensions preserving aspect ratio
function getSpriteSize(sprite, targetSize) {
    const aspect = sprite.width / sprite.height;
    if (aspect > 1) {
        // Wider than tall
        return { width: targetSize, height: targetSize / aspect };
    }
    // Taller than wide (or square)
    return { width: targetSize * aspect, height: targetSize };
}

// Particle pool for object reuse (reduces GC pressure)
const particlePool = {
    pool: [],
    maxPoolSize: CONFIG.PARTICLE_POOL_SIZE,
    maxActiveParticles: CONFIG.PARTICLE_MAX_ACTIVE,

    get(x, y, vx, vy, color, life) {
        let particle = this.pool.pop();
        if (particle) {
            particle.reset(x, y, vx, vy, color, life);
        } else {
            particle = new Particle(x, y, vx, vy, color, life);
        }
        return particle;
    },

    release(particle) {
        if (this.pool.length < this.maxPoolSize) {
            this.pool.push(particle);
        }
    }
};

// Snake character variants
const SNAKE_VARIANTS = {
    green: {
        id: 'green',
        displayName: 'Jade',
        color: '#4CAF50',
        spritePrefix: 'snake_p1',
        playerId: 1,  // Keep for sprite loading compatibility
        hudBorderColor: '#4CAF50',
        size: 66  // Title screen display size
    },
    orange: {
        id: 'orange',
        displayName: 'Blaze',
        color: '#FF9800',
        spritePrefix: 'snake_p2',
        playerId: 2,  // Keep for sprite loading compatibility
        hudBorderColor: '#FF9800',
        size: 98  // Title screen display size
    }
};

// Asset Manager
const assets = {
    images: {},
    loaded: 0,
    total: 0,

    // Define all image paths
    manifest: {
        // Title and backgrounds
        'logo_title': 'graphics/logo_title.png',
        'background_swamp': 'graphics/swamp-background-day.jpg',
        'title_background': 'graphics/title-background_swamp.jpg',

        // Green Snake
        'snake_p1_idle': 'graphics/snake_p1_idle.png',
        'snake_p1_extended': 'graphics/snake_p1_extended.png',
        'snake_p1_jumping': 'graphics/snake_p1_jumping.png',
        'snake_p1_rolling': 'graphics/snake_p1_rolling.png',
        'snake_p1_swimming': 'graphics/snake_p1_swimming.png',

        // Orange Snake
        'snake_p2_idle': 'graphics/snake_p2_idle.png',
        'snake_p2_extended': 'graphics/snake_p2_extended.png',
        'snake_p2_jumping': 'graphics/snake_p2_jumping.png',
        'snake_p2_rolling': 'graphics/snake_p2_rolling.png',
        'snake_p2_swimming': 'graphics/snake_p2_swimming.png',

        // Enemies
        'frog_small_idle': 'graphics/frog_small_idle.png',
        'frog_small_jumping': 'graphics/frog_small_jumping.png',
        'frog_medium_idle': 'graphics/frog_medium_idle.png',
        'frog_medium_jumping': 'graphics/frog_medium_jumping.png',
        'frog_large_boss_idle': 'graphics/frog_large_boss_idle.png',
        'frog_large_boss_jumping': 'graphics/frog_large_boss_jumping.png',
        'frog_poison_dart_idle': 'graphics/frog_poison_dart_idle.png',
        'frog_poison_dart_jumping': 'graphics/frog_poison_dart_jumping.png',

        // Environment
        'lilypad_small': 'graphics/lilypad_small.png',
        'lilypad_large': 'graphics/lilypad_large.png',

        // Effects
        'effect_splash': 'graphics/effect_splash.png',
        'effect_hit': 'graphics/effect_hit.png',
        'effect_combo': 'graphics/effect_combo.png',
        'effect_death_particles': 'graphics/effect_death_particles.png',

        // UI
        'ui_combo_star': 'graphics/ui_combo_star.png',
    },

    load(callback) {
        this.total = Object.keys(this.manifest).length;
        this.loaded = 0;
        this.failed = 0;

        const checkComplete = () => {
            if (this.loaded + this.failed === this.total && callback) {
                if (this.failed > 0) {
                    console.log(`${this.failed} asset(s) failed to load`);
                }
                callback();
            }
        };

        for (const [key, path] of Object.entries(this.manifest)) {
            const img = new Image();
            img.onload = () => {
                this.loaded++;
                checkComplete();
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${path}`);
                this.failed++;
                checkComplete();
            };
            img.src = path;
            this.images[key] = img;
        }
    },

    get(key) {
        return this.images[key];
    },

    getProgress() {
        return this.total > 0 ? this.loaded / this.total : 0;
    }
};

// Audio Manager
const audioManager = {
    titleMusic: null,
    bgMusic: null,
    currentTrack: null,
    muted: true, // Default to muted
    toggleButton: null,
    hasInteracted: false,
    volumeMenu: null,
    longPressTimer: null,
    
    // Volume levels (0-1)
    volumes: {
        overall: 0.6,
        music: 1.0,
        sfx: 1.0
    },

    init() {
        this.titleMusic = document.getElementById('titleMusic');
        this.bgMusic = document.getElementById('bgMusic');
        this.toggleButton = document.getElementById('audioToggle');
        this.volumeMenu = document.getElementById('volumeMenu');

        // Load settings from localStorage
        this.loadSettings();

        // Set initial button state
        this.updateButtonState();

        // Initialize volume sliders
        this.initVolumeSliders();

        // Add click handler for mute toggle
        this.toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        // Add right-click handler
        this.toggleButton.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showVolumeMenu();
        });

        // Add long press handler for mobile
        this.toggleButton.addEventListener('touchstart', (e) => {
            this.longPressTimer = setTimeout(() => {
                this.showVolumeMenu();
            }, 500);
        }, { passive: true });

        this.toggleButton.addEventListener('touchend', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }, { passive: true });

        this.toggleButton.addEventListener('touchmove', () => {
            if (this.longPressTimer) {
                clearTimeout(this.longPressTimer);
                this.longPressTimer = null;
            }
        }, { passive: true });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.volumeMenu.classList.contains('visible') && 
                !this.volumeMenu.contains(e.target) && 
                !this.toggleButton.contains(e.target)) {
                this.hideVolumeMenu();
            }
        });

        // Apply initial volumes
        this.updateVolumes();

        // Handle first user interaction for autoplay
        const startAudioOnInteraction = () => {
            this.hasInteracted = true;
            // Try to start title music if unmuted and on title screen
            if (!this.muted) {
                const titleScreen = document.getElementById('titleScreen');
                if (titleScreen && titleScreen.classList.contains('active')) {
                    this.playTitle();
                }
            }
            // Remove listener after first interaction
            document.removeEventListener('click', startAudioOnInteraction);
            document.removeEventListener('keydown', startAudioOnInteraction);
            document.removeEventListener('touchstart', startAudioOnInteraction);
        };
        document.addEventListener('click', startAudioOnInteraction);
        document.addEventListener('keydown', startAudioOnInteraction);
        document.addEventListener('touchstart', startAudioOnInteraction, { passive: true });
    },

    initVolumeSliders() {
        const overallSlider = document.getElementById('overallVolume');
        const musicSlider = document.getElementById('musicVolume');
        const sfxSlider = document.getElementById('sfxVolume');

        const overallValue = document.getElementById('overallValue');
        const musicValue = document.getElementById('musicValue');
        const sfxValue = document.getElementById('sfxValue');

        // Set initial values
        overallSlider.value = this.volumes.overall * 100;
        musicSlider.value = this.volumes.music * 100;
        sfxSlider.value = this.volumes.sfx * 100;

        overallValue.textContent = Math.round(this.volumes.overall * 100);
        musicValue.textContent = Math.round(this.volumes.music * 100);
        sfxValue.textContent = Math.round(this.volumes.sfx * 100);

        // Add event listeners (debounce saveSettings to avoid localStorage spam during drag)
        let saveTimeout;
        const debouncedSave = () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => this.saveSettings(), 300);
        };

        overallSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            overallValue.textContent = val;
            this.volumes.overall = val / 100;
            this.updateVolumes();
            debouncedSave();
        });

        musicSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            musicValue.textContent = val;
            this.volumes.music = val / 100;
            this.updateVolumes();
            debouncedSave();
        });

        sfxSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            sfxValue.textContent = val;
            this.volumes.sfx = val / 100;
            debouncedSave();
        });
    },

    loadSettings() {
        const savedMuted = localStorage.getItem('snakeStyleAudioMuted');
        this.muted = savedMuted === null ? true : savedMuted === 'true';

        const savedVolumes = localStorage.getItem('snakeStyleVolumes');
        if (savedVolumes) {
            try {
                const parsed = JSON.parse(savedVolumes);
                this.volumes.overall = parsed.overall ?? 0.6;
                this.volumes.music = parsed.music ?? 1.0;
                this.volumes.sfx = parsed.sfx ?? 1.0;
            } catch (e) {
                console.log('Failed to load volume settings:', e);
            }
        }
    },

    saveSettings() {
        localStorage.setItem('snakeStyleAudioMuted', this.muted);
        localStorage.setItem('snakeStyleVolumes', JSON.stringify(this.volumes));
    },

    showVolumeMenu() {
        this.volumeMenu.classList.add('visible');
    },

    hideVolumeMenu() {
        this.volumeMenu.classList.remove('visible');
    },

    toggle() {
        this.muted = !this.muted;
        this.saveSettings();
        this.updateButtonState();

        if (this.muted) {
            // Just pause, don't reset position
            this.pause();
        } else {
            // Check if we have a current track to resume
            if (this.currentTrack) {
                // Resume from where it was paused
                this.resume();
            } else {
                // No track was playing, start appropriate music for current screen
                const titleScreen = document.getElementById('titleScreen');
                const gameScreen = document.getElementById('gameScreen');
                
                if (titleScreen && titleScreen.classList.contains('active')) {
                    this.playTitle();
                } else if (gameScreen && gameScreen.classList.contains('active') && game.running) {
                    this.playBackground();
                }
            }
        }
    },

    updateButtonState() {
        if (this.muted) {
            this.toggleButton.classList.remove('unmuted');
        } else {
            this.toggleButton.classList.add('unmuted');
        }
    },

    updateVolumes() {
        // Apply overall and music-specific volumes
        const musicVol = this.volumes.overall * this.volumes.music;
        
        if (this.titleMusic) this.titleMusic.volume = musicVol * 0.6;
        if (this.bgMusic) this.bgMusic.volume = musicVol * 0.5;
    },

    playTitle() {
        if (this.muted) return;
        if (!this.hasInteracted) return; // Wait for user interaction

        // Only start if not already playing title music
        if (this.currentTrack === this.titleMusic && !this.titleMusic.paused) {
            return; // Already playing, don't restart
        }

        this.stopAll();
        this.currentTrack = this.titleMusic;
        if (this.titleMusic) {
            this.titleMusic.currentTime = 0;
            this.titleMusic.play().catch(e => console.log('Title music play failed:', e));
        }
    },


    playBackground() {
        if (this.muted) return;
        if (!this.hasInteracted) return; // Wait for user interaction

        // Only start if not already playing background music
        if (this.currentTrack === this.bgMusic && !this.bgMusic.paused) {
            return; // Already playing, don't restart
        }

        this.stopAll();
        this.currentTrack = this.bgMusic;
        if (this.bgMusic) {
            this.bgMusic.currentTime = 0;
            this.bgMusic.play().catch(e => console.log('Background music play failed:', e));
        }
    },


    pause() {
        // Just pause without resetting time
        if (this.titleMusic && !this.titleMusic.paused) {
            this.titleMusic.pause();
        }
        if (this.bgMusic && !this.bgMusic.paused) {
            this.bgMusic.pause();
        }
    },

    resume() {
        // Resume current track from where it was paused
        if (this.currentTrack && this.currentTrack.paused) {
            this.currentTrack.play().catch(e => console.log('Audio resume failed:', e));
        }
    },

    stopAll() {
        if (this.titleMusic) {
            this.titleMusic.pause();
            this.titleMusic.currentTime = 0;
        }
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
        }
        this.currentTrack = null;
    }
};


// Game State
const game = {
    canvas: null,
    ctx: null,
    running: false,
    wave: 1,
    score: 0,
    player: null,
    enemies: [],
    lilyPads: [],
    particles: [],
    keys: {},
    lastTime: 0,
    time: 0, // Current frame timestamp from requestAnimationFrame
    screen: 'title',
    defeatedFrogs: [],
    titleSnakes: {
        left: { y: 0, vy: 0, jumping: false, selected: false },
        right: { y: 0, vy: 0, jumping: false, selected: false }
    },
    selectedSnakeId: null,
    isMobile: false,
    gameOverPortraitState: 'idle',
    gameOverPortraitTimer: 0,
    paused: false,
    hudElements: null,
    // Wave system
    waveTransitioning: false,  // Prevents multiple wave increments during delay
    startingWave: 1,           // For ?wave=NUM param
    multiwaveTarget: null,     // For ?multiwave=NUM param
    multiwaveTriggered: false, // Has multiwave been spawned this game?
    inMultiwave: false,        // Currently fighting multiwave enemies?
};

// Input handlers
const input = {
    x: 0,
    y: 0,
    roll: false,
    whip: false
};

// Entity Classes
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.inWater = false;
    }

    update() {
        // Apply gravity
        if (!this.onGround) {
            this.vy += CONFIG.GRAVITY;
        }

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.CANVAS_WIDTH) this.x = CONFIG.CANVAS_WIDTH - this.width;

        // Check lily pad collisions FIRST
        this.onGround = false;
        let onLilyPad = false;
        for (const pad of game.lilyPads) {
            // Check if entity is on or near the lily pad (with tolerance for bobbing)
            const isNearPad = this.x < pad.x + pad.width &&
                             this.x + this.width > pad.x &&
                             this.y + this.height >= pad.y - 5 &&  // 5px tolerance above
                             this.y + this.height <= pad.y + 15;   // 15px tolerance below

            if (isNearPad && this.vy >= 0 && !this.droppingThrough) {
                this.y = pad.y - this.height;
                this.vy = 0;
                this.onGround = true;
                onLilyPad = true;
                break;
            }
        }
        // Reset droppingThrough flag if we've passed below all lily pads
        if (this.droppingThrough) {
            let stillDroppingThrough = false;
            for (const pad of game.lilyPads) {
                const overlapsHorizontally = this.x < pad.x + pad.width && this.x + this.width > pad.x;
                const isAboveOrNear = this.y + this.height <= pad.y + 20;
                if (overlapsHorizontally && isAboveOrNear) {
                    stillDroppingThrough = true;
                    break;
                }
            }
            if (!stillDroppingThrough) {
                this.droppingThrough = false;
            }
        }

        // Water surface
        if (this.y + this.height > CONFIG.WATER_LEVEL + 50) {
            this.y = CONFIG.WATER_LEVEL + 50 - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Check water - but NOT if on lily pad
        this.inWater = !onLilyPad && this.y + this.height > CONFIG.WATER_LEVEL;

        // Apply friction
        const friction = this.inWater ? CONFIG.WATER_FRICTION : CONFIG.FRICTION;
        this.vx *= friction;
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Snake extends Entity {
    constructor(x, y, variant) {
        super(x, y, 50, 40);
        this.variant = variant;
        this.playerId = variant.playerId;  // Needed for sprite loading (snake_p1 vs snake_p2)
        this.color = variant.color;
        this.health = 100;
        this.maxHealth = 100;
        this.dead = false;
        this.state = 'idle';
        this.facing = 1;
        this.combo = 0;
        this.comboTimer = 0;
        this.rollTimer = 0;
        this.rollCooldown = 0;
        this.whipTimer = 0;
        this.whipCooldown = 0;
        this.invulnerable = 0;
        this.droppingThrough = false;
        this.groundedFrames = 0;
    }

    update() {
        // Don't update dead players
        if (this.dead) {
            return;
        }

        super.update();

        // Track how long we've been on ground to avoid jittering sprites
        if (this.onGround) {
            this.groundedFrames++;
        } else {
            this.groundedFrames = 0;
        }

        // Update timers
        if (this.rollTimer > 0) this.rollTimer--;
        if (this.rollCooldown > 0) this.rollCooldown--;
        if (this.whipTimer > 0) this.whipTimer--;
        if (this.whipCooldown > 0) this.whipCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            this.combo = 0;
        }

        // Get input
        const playerInput = input;

        // Handle states
        if (this.state === 'rolling') {
            this.handleRollState();
        } else if (this.state === 'whipping') {
            this.handleWhipState();
        } else {
            this.handleNormalMovement(playerInput);
        }

        // Roll attack
        if (playerInput.roll && this.rollCooldown === 0 && this.state === 'idle') {
            this.startRoll();
        }

        // Whip attack
        if (playerInput.whip && this.whipCooldown === 0 && this.state === 'idle') {
            this.startWhip();
        }
    }

    handleNormalMovement(playerInput) {
        this.state = 'idle';

        // Horizontal movement
        if (playerInput.x !== 0) {
            const speed = this.inWater ? CONFIG.PLAYER_SPEED * 0.5 : CONFIG.PLAYER_SPEED;
            this.vx = playerInput.x * speed;
            this.facing = playerInput.x > 0 ? 1 : -1;
        }

        // Jump
        if (playerInput.y < 0 && this.onGround) {
            this.vy = this.inWater ? -CONFIG.WATER_JUMP : -CONFIG.PLAYER_JUMP;
            this.onGround = false;
            if (this.inWater) {
                createSplash(this.x + this.width / 2, this.y + this.height);
            }
        }

        // Drop through lily pad
        if (playerInput.y > 0 && this.onGround && !this.inWater && !this.droppingThrough) {
            // Check if on a lily pad (not on water surface)
            for (const pad of game.lilyPads) {
                const isOnPad = this.x < pad.x + pad.width &&
                               this.x + this.width > pad.x &&
                               Math.abs(this.y + this.height - pad.y) < 5;
                if (isOnPad) {
                    this.droppingThrough = true;
                    break;
                }
            }
        }

        // Sink in water
        if (this.inWater && !this.onGround) {
            this.vy = Math.min(this.vy, 2);
        }
    }

    startRoll() {
        this.state = 'rolling';
        this.rollTimer = 30;
        this.rollCooldown = 45;
        this.vx = this.facing * 15;
        this.invulnerable = 30;
    }

    handleRollState() {
        if (this.rollTimer === 0) {
            this.state = 'idle';
            return;
        }

        // Check hit enemies
        for (const enemy of game.enemies) {
            if (enemy.alive && this.collidesWith(enemy)) {
                this.hitEnemy(enemy, 25, this.facing * 12, -8);
            }
        }

        // Spin effect
        this.width = 40;
        this.height = 40;
    }

    startWhip() {
        this.state = 'whipping';
        this.whipTimer = 20; // Tongue whip duration
        this.whipCooldown = 60;

        // Damage enemies in range with tongue whip
        for (const enemy of game.enemies) {
            if (enemy.alive && this.inWhipRange(enemy)) {
                this.hitEnemy(enemy, 30, this.facing * 12, -8);
            }
        }
    }

    inWhipRange(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const facingEnemy = (dx > 0 && this.facing > 0) || (dx < 0 && this.facing < 0);
        return dist < 100 && facingEnemy;
    }

    handleWhipState() {
        if (this.whipTimer === 0) {
            this.state = 'idle';
            this.width = 50;
            this.height = 40;
            return;
        }

        // Extend animation
        this.width = 70;
        this.height = 35;
    }

    hitEnemy(enemy, damage, vx, vy) {
        enemy.takeDamage(damage);
        enemy.vx = vx;
        enemy.vy = vy;
        this.combo++;
        this.comboTimer = CONFIG.COMBO_TIMEOUT / 16.67; // Convert ms to frames
        game.score += damage * this.combo;
        createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
    }

    takeDamage(damage) {
        if (this.invulnerable > 0) return;

        this.health -= damage;
        this.invulnerable = 60;

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
        createPlayerDeathEffect(this.x + this.width / 2, this.y + this.height / 2);
        gameOver();
    }

    draw(ctx) {
        // Don't render dead players
        if (this.dead) {
            return;
        }

        // Determine which sprite to use
        const playerPrefix = this.variant.spritePrefix;
        const spriteName = getSnakeSpriteName(playerPrefix, this.state, this.inWater, this.onGround);
        let sprite = assets.get(spriteName);

        // Fallback to idle if sprite doesn't exist (e.g., P1 swimming)
        if (!sprite || !sprite.complete) {
            sprite = assets.get(`${playerPrefix}_idle`);
        }

        // Flashing when invulnerable (but not during roll, which has its own visual)
        if (this.invulnerable > 0 && this.state !== 'rolling' && Math.floor(this.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        if (sprite && sprite.complete) {
            // Draw sprite
            ctx.save();

            // Calculate sprite size preserving aspect ratio
            // Adjust size based on state
            let targetSize;
            if (this.state === 'rolling') {
                targetSize = 40; // Smaller for rolling ball
            } else if (this.inWater) {
                targetSize = 80; // Larger for swimming visibility
            } else if (this.state === 'whipping') {
                // Both whipping sprites are bigger
                targetSize = this.playerId === 2 ? 85 : 75;
            } else if (!this.onGround) {
                // Green snake (P1) jumping sprite is bigger
                targetSize = this.playerId === 1 ? 65 : 55;
            } else {
                targetSize = 55; // Default idle size
            }

            // Scale sprite to fit target size while preserving aspect ratio
            const { width: spriteWidth, height: spriteHeight } = getSpriteSize(sprite, targetSize);

            // Center the sprite on the entity position
            const drawX = this.x + this.width / 2 - spriteWidth / 2;
            const drawY = this.y + this.height / 2 - spriteHeight / 2;

            // Flip sprite if facing left
            if (this.facing < 0) {
                ctx.translate(drawX + spriteWidth / 2, drawY + spriteHeight / 2);
                ctx.scale(-1, 1);
                ctx.translate(-(drawX + spriteWidth / 2), -(drawY + spriteHeight / 2));
            }

            // Add rotation effect for rolling
            if (this.state === 'rolling') {
                ctx.translate(drawX + spriteWidth / 2, drawY + spriteHeight / 2);
                ctx.rotate((game.time / 50) % (Math.PI * 2));
                ctx.drawImage(sprite, -spriteWidth / 2, -spriteHeight / 2, spriteWidth, spriteHeight);
            } else {
                ctx.drawImage(sprite, drawX, drawY, spriteWidth, spriteHeight);
            }

            ctx.restore();
        } else {
            // Fallback to colored rectangle if sprite not loaded
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        ctx.globalAlpha = 1;
    }
}

class Frog extends Entity {
    constructor(x, y, type = 'small') {
        const config = FROG_TYPES[type];
        super(x, y, config.width, config.height);
        this.type = type;
        this.config = config;  // Store reference for easy access
        this.health = config.health;
        this.maxHealth = config.health;
        this.alive = true;
        this.jumpTimer = 0;
        this.jumpCooldown = Math.random() * 60 + 40;
        this.color = config.color;
        this.attackTimer = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.groundedFrames = 0; // Track how long we've been on ground
        this.jumpPower = config.jumpPower;

        // Random hue for poison dart frogs (pre-compute filter string)
        this.hueRotation = config.hasRandomHue ? Math.floor(Math.random() * 360) : 0;
        this.hueFilter = config.hasRandomHue ? `hue-rotate(${this.hueRotation}deg)` : null;
    }

    update() {
        if (!this.alive) return;

        super.update();

        // Track how long we've been on ground to avoid jittering sprites
        if (this.onGround) {
            this.groundedFrames++;
        } else {
            this.groundedFrames = 0;
        }

        // AI behavior
        this.jumpTimer++;
        this.attackTimer++;

        // Find nearest player
        const target = this.findNearestPlayer();

        if (target && this.onGround && this.jumpTimer > this.jumpCooldown) {
            this.jumpTowards(target);
            this.jumpTimer = 0;
            this.jumpCooldown = Math.random() * 60 + 40;
        }

        // Attack nearby players
        if (target && this.attackTimer > 90) {
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 35) {
                target.takeDamage(this.config.attackDamage);
                this.attackTimer = 0;
            }
        }
    }

    findNearestPlayer() {
        // Return the player if alive, otherwise null
        if (!game.player || game.player.dead) {
            return null;
        }
        return game.player;
    }

    jumpTowards(target) {
        const dx = target.x - this.x;
        const direction = dx > 0 ? 1 : -1;
        this.facing = direction;
        this.vx = direction * (Math.random() * 3 + 2);
        this.vy = -this.jumpPower;
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        game.score += this.config.score;
        game.defeatedFrogs.push({ type: this.type }); // Track for game over parade
        createDeathEffect(this.x + this.width / 2, this.y + this.height / 2);
    }

    draw(ctx) {
        if (!this.alive) return;


        // Determine which sprite to use
        // Require 3 frames on ground before showing idle sprite to prevent jittering
        const isInAir = this.groundedFrames < 3;
        const suffix = this.config.spriteSuffix;
        const spriteName = isInAir ? `frog_${suffix}_jumping` : `frog_${suffix}_idle`;

        const sprite = assets.get(spriteName);

        if (sprite && sprite.complete) {
            // Calculate sprite size preserving aspect ratio
            // Use entity dimensions as target size, with optional boost when jumping
            let targetSize = Math.max(this.width, this.height);

            // Some frog types have boosted size when jumping for visibility
            if (isInAir && this.config.jumpingTargetSize) {
                targetSize = this.config.jumpingTargetSize;
            }

            // Scale sprite to fit target size while preserving aspect ratio
            const { width: spriteWidth, height: spriteHeight } = getSpriteSize(sprite, targetSize);

            // Center the sprite on the entity position
            const drawX = this.x + this.width / 2 - spriteWidth / 2;
            const drawY = this.y + this.height / 2 - spriteHeight / 2;

            // Flip sprite based on facing direction
            ctx.save();
            // Apply hue rotation for poison dart frogs (using pre-computed filter string)
            if (this.hueFilter) {
                ctx.filter = this.hueFilter;
            }
            if (this.facing < 0) {
                ctx.translate(drawX + spriteWidth / 2, drawY + spriteHeight / 2);
                ctx.scale(-1, 1);
                ctx.translate(-(drawX + spriteWidth / 2), -(drawY + spriteHeight / 2));
            }

            ctx.drawImage(sprite, drawX, drawY, spriteWidth, spriteHeight);
            ctx.restore();
        } else {
            // Fallback to colored rectangle if sprite not loaded
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // Health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.width;
            const barHeight = 4;
            ctx.fillStyle = '#f00';
            ctx.fillRect(this.x, this.y - 10, barWidth, barHeight);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(this.x, this.y - 10, barWidth * (this.health / this.maxHealth), barHeight);
        }
    }
}

class LilyPad {
    constructor(x, y, width = 80) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = 25;
        this.bob = Math.random() * Math.PI * 2;
    }

    update() {
        this.bob += 0.02;
        this.y += Math.sin(this.bob) * 0.15;
    }

    draw(ctx) {
        // Choose sprite based on size
        const spriteName = this.width > 90 ? 'lilypad_large' : 'lilypad_small';
        const sprite = assets.get(spriteName);

        if (sprite && sprite.complete) {
            // Scale to match lily pad width while preserving aspect ratio
            const { width: spriteWidth, height: spriteHeight } = getSpriteSize(sprite, this.width);

            const drawX = this.x + this.width / 2 - spriteWidth / 2;
            const drawY = this.y + this.height / 2 - spriteHeight / 2;

            ctx.drawImage(sprite, drawX, drawY, spriteWidth, spriteHeight);
        } else {
            // Fallback
            ctx.fillStyle = '#2E7D32';
            ctx.beginPath();
            ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1B5E20';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.reset(x, y, vx, vy, color, life);
    }

    reset(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.life--;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Parade Frog - simplified frog for Game Over parade
class ParadeFrog {
    constructor(type, canvasHeight, jumpMode = 'steady') {
        this.type = type;
        const config = FROG_TYPES[type];
        this.config = config;
        this.width = config.width;
        this.height = config.height;

        // Start off-screen left - further back during wave phase for surge effect
        if (jumpMode === 'wave') {
            // Wave phase: spawn in a cluster far off-screen for dramatic wave entrance
            this.x = -300 - Math.random() * 200; // -300 to -500
        } else {
            // Normal: just off-screen
            this.x = -this.width - 20;
        }

        // Ground level is near bottom with some randomization
        this.groundY = canvasHeight - this.height - 10 - Math.random() * 20;
        this.y = this.groundY;

        // Movement
        this.vx = 2 + Math.random() * 2; // Horizontal speed
        this.vy = 0;
        this.gravity = 0.5;

        // Jump power based on mode
        if (jumpMode === 'wave') {
            // Wave phase: super high jumps for dramatic effect
            this.jumpPower = -16 - Math.random() * 8; // -16 to -24
        } else if (jumpMode === 'transition') {
            // Transition phase: high jumps but less extreme
            this.jumpPower = -12 - Math.random() * 6; // -12 to -18
        } else {
            // Steady phase: varied jumps for visual interest
            const jumpVariation = Math.random();
            if (jumpVariation < 0.2) {
                // 20% chance for super high jumps
                this.jumpPower = -14 - Math.random() * 6; // -14 to -20
            } else if (jumpVariation < 0.5) {
                // 30% chance for high jumps
                this.jumpPower = -10 - Math.random() * 4; // -10 to -14
            } else {
                // 50% chance for normal jumps
                this.jumpPower = -7 - Math.random() * 3; // -7 to -10
            }
        }

        // Animation
        this.groundedFrames = 0;
        this.facing = 1; // Always face right for parade

        // Random hue for poison dart frogs (pre-compute filter string)
        this.hue = config.hasRandomHue ? Math.random() * 360 : 0;
        this.hueFilter = config.hasRandomHue ? `hue-rotate(${this.hue}deg)` : null;
    }

    update() {
        // Move horizontally
        this.x += this.vx;

        // Simple jump physics
        this.vy += this.gravity;
        this.y += this.vy;

        // Prevent clipping at top of screen
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0; // Stop upward movement if hitting ceiling
        }

        // Ground collision
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.vy = 0;
            this.groundedFrames++;

            // Jump periodically
            if (this.groundedFrames > 20 && Math.random() < 0.1) {
                this.vy = this.jumpPower;
                this.groundedFrames = 0;
            }
        } else {
            this.groundedFrames = 0;
        }
    }

    draw(ctx) {
        // Determine sprite (idle when grounded for 3+ frames, jumping otherwise)
        const isIdle = this.groundedFrames >= 3;
        const spriteState = isIdle ? 'idle' : 'jumping';
        const spriteName = `frog_${this.config.spriteSuffix}_${spriteState}`;
        const sprite = assets.get(spriteName);

        if (sprite && sprite.complete) {
            // Use boosted size when jumping if configured
            const targetSize = (!isIdle && this.config.jumpingTargetSize)
                ? this.config.jumpingTargetSize
                : this.width;
            let { width: spriteWidth, height: spriteHeight } = getSpriteSize(sprite, targetSize);

            const drawX = this.x + this.width / 2 - spriteWidth / 2;
            const drawY = this.y + this.height / 2 - spriteHeight / 2;

            ctx.save();

            // Apply hue rotation for poison dart frogs (using pre-computed filter string)
            if (this.hueFilter) {
                ctx.filter = this.hueFilter;
            }

            // No flipping needed - always face right
            ctx.drawImage(sprite, drawX, drawY, spriteWidth, spriteHeight);
            ctx.restore();
        }
    }

    isOffScreen(canvasWidth) {
        return this.x > canvasWidth + 20;
    }
}

// Frog Parade System for Game Over screen
class FrogParade {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.frogs = [];
        this.frogQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 0;
        this.running = false;
        this.animationId = null;

        // Wave system for dramatic opening
        this.phase = 'steady'; // 'wave', 'transition', 'steady'
        this.phaseTimer = 0;
        this.waveDuration = 0;
        this.transitionDuration = 0;
        this.waveSpawnRate = 0;
        this.steadyReserve = 0; // Minimum frogs reserved for steady phase
        this.maxFrogsOnScreen = 2500; // Performance cap

        // Speed control and replay
        this.speed = 1; // Current playback speed (1x, 2x, 3x)
        this.originalDefeatedFrogs = []; // Store for replay
    }

    start(defeatedFrogs) {
        // Store original list for replay
        this.originalDefeatedFrogs = [...defeatedFrogs];

        // Get canvas and setup
        this.canvas = document.getElementById('paradeCanvas');
        if (!this.canvas) return;

        // Set canvas size - full window height for parade
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');

        // Copy defeated frogs to queue (shuffle for variety)
        this.frogQueue = [...defeatedFrogs].sort(() => Math.random() - 0.5);
        this.frogs = [];
        this.spawnTimer = 0;
        this.spawnInterval = this.calculateSpawnInterval();
        this.running = true;

        // Configure wave parameters based on total defeated
        const totalDefeated = defeatedFrogs.length;

        if (totalDefeated >= 10000) {
            // 10,000+ frogs: ABSOLUTE MAYHEM
            this.phase = 'wave';
            this.transitionDuration = 180; // 3 seconds
            this.waveSpawnRate = 10; // 10 frogs per frame
            // Cap wave at 75% to guarantee 5% for steady phase
            const waveCapacity = Math.floor(totalDefeated * 0.75);
            this.waveDuration = Math.ceil(waveCapacity / this.waveSpawnRate);
            // Reserve 5% minimum for steady phase
            this.steadyReserve = Math.ceil(totalDefeated * 0.05);
        } else if (totalDefeated >= 1000) {
            // 1,000-9,999 frogs: Very intense wave
            this.phase = 'wave';
            this.transitionDuration = 120; // 2 seconds
            this.waveSpawnRate = 7;
            // Cap wave at 75% to guarantee 5% for steady phase
            const waveCapacity = Math.floor(totalDefeated * 0.75);
            this.waveDuration = Math.ceil(waveCapacity / this.waveSpawnRate);
            this.steadyReserve = Math.ceil(totalDefeated * 0.05);
        } else if (totalDefeated >= 100) {
            // 100-999 frogs: Initial dramatic wave
            this.phase = 'wave';
            this.transitionDuration = 90; // 1.5 seconds
            this.waveSpawnRate = 5;
            // Cap wave at 75% to guarantee 5% for steady phase
            const waveCapacity = Math.floor(totalDefeated * 0.75);
            this.waveDuration = Math.ceil(waveCapacity / this.waveSpawnRate);
            this.steadyReserve = Math.ceil(totalDefeated * 0.05);
        } else {
            // Less than 100 frogs: skip wave phase, normal parade
            this.phase = 'steady';
            this.waveDuration = 0;
            this.transitionDuration = 0;
            this.waveSpawnRate = 0;
            this.steadyReserve = 0;
        }

        this.phaseTimer = 0;

        // Start animation loop
        this.animate();
    }

    calculateSpawnInterval() {
        // 2x density - doubled spawn rate for much denser parade
        const baseInterval = 3; // frames (~20 frogs/second at 60 FPS)
        const count = this.frogQueue.length;
        if (count > 100) return 1;   // Ultra dense - ~60 frogs/second
        if (count > 50) return 2;    // Very dense - ~30 frogs/second
        if (count > 20) return 2;    // Dense - ~30 frogs/second
        return baseInterval;
    }

    animate() {
        if (!this.running) return;

        // Update multiple times based on speed (1x, 2x, or 3x)
        for (let i = 0; i < this.speed; i++) {
            this.update();
        }
        this.render();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    update() {
        // Update phase timer and check for phase transitions
        this.phaseTimer++;

        if (this.phase === 'wave' && this.phaseTimer >= this.waveDuration) {
            this.phase = 'transition';
            this.phaseTimer = 0;
        } else if (this.phase === 'transition' && this.phaseTimer >= this.transitionDuration) {
            this.phase = 'steady';
            this.phaseTimer = 0;
        }

        // Spawn frogs based on current phase
        this.spawnFrogs();

        // Update all frogs
        for (let i = 0; i < this.frogs.length; i++) {
            this.frogs[i].update();
        }

        // Remove frogs that are off screen (in-place to avoid GC pressure)
        for (let i = this.frogs.length - 1; i >= 0; i--) {
            if (this.frogs[i].isOffScreen(this.canvas.width)) {
                this.frogs.splice(i, 1);
            }
        }
    }

    spawnFrogs() {
        let spawnCount = 0;

        if (this.phase === 'wave') {
            // WAVE PHASE: Spawn many frogs per frame for dramatic effect
            if (this.frogs.length < this.maxFrogsOnScreen && this.frogQueue.length > 0) {
                spawnCount = Math.min(
                    this.waveSpawnRate,
                    this.frogQueue.length,
                    this.maxFrogsOnScreen - this.frogs.length
                );
            }
        } else if (this.phase === 'transition') {
            // TRANSITION PHASE: Gradually reduce spawn rate, but preserve reserve for steady
            const progress = this.phaseTimer / this.transitionDuration;
            // Start at waveSpawnRate, reduce to 1 by end of transition
            const currentRate = Math.ceil(this.waveSpawnRate * (1 - progress * 0.9));

            this.spawnTimer++;
            if (this.spawnTimer >= 3) { // Spawn every 3 frames during transition
                // Don't spawn if we've reached the steady reserve
                const availableToSpawn = Math.max(0, this.frogQueue.length - this.steadyReserve);
                spawnCount = Math.min(
                    currentRate,
                    availableToSpawn,
                    this.maxFrogsOnScreen - this.frogs.length
                );
                this.spawnTimer = 0;
            }
        } else {
            // STEADY PHASE: Doubled pace - spawn 2 at a time
            this.spawnTimer++;
            if (this.spawnTimer >= this.spawnInterval && this.frogQueue.length > 0) {
                spawnCount = Math.min(2, this.frogQueue.length, this.maxFrogsOnScreen - this.frogs.length);
                this.spawnTimer = 0;
                // Add some randomness to spawn timing (reduced for faster pace)
                this.spawnInterval = this.calculateSpawnInterval() + Math.floor(Math.random() * 5);
            }
        }

        // Create the frogs with appropriate jump mode
        for (let i = 0; i < spawnCount; i++) {
            if (this.frogQueue.length > 0 && this.frogs.length < this.maxFrogsOnScreen) {
                const frogData = this.frogQueue.shift();
                this.frogs.push(new ParadeFrog(frogData.type, this.canvas.height, this.phase));
            }
        }
    }

    render() {
        if (!this.ctx) return;

        // Clear canvas with transparency
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all frogs
        this.frogs.forEach(frog => frog.draw(this.ctx));
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.frogs = [];
        this.frogQueue = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    replay() {
        // Stop current parade
        this.stop();
        // Restart with original defeated frogs
        if (this.originalDefeatedFrogs.length > 0) {
            this.start(this.originalDefeatedFrogs);
        }
    }

    cycleSpeed() {
        // Cycle through speeds: 1x -> 2x -> 3x -> 1x
        this.speed = this.speed >= 3 ? 1 : this.speed + 1;
    }
}

// Global parade instance
let frogParade = null;

// Particle effects (using pool with cap)
function createSplash(x, y) {
    const count = Math.min(8, particlePool.maxActiveParticles - game.particles.length);
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = Math.random() * 3 + 2;
        game.particles.push(particlePool.get(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 2,
            '#4FC3F7',
            30
        ));
    }
}

function createHitEffect(x, y) {
    const count = Math.min(12, particlePool.maxActiveParticles - game.particles.length);
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = Math.random() * 4 + 3;
        game.particles.push(particlePool.get(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#FFD700',
            20
        ));
    }
}

function createDeathEffect(x, y) {
    const count = Math.min(20, particlePool.maxActiveParticles - game.particles.length);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        game.particles.push(particlePool.get(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#4CAF50',
            40
        ));
    }
}

function createPlayerDeathEffect(x, y) {
    // Create larger, more dramatic particle explosion for player death
    const count = Math.min(30, particlePool.maxActiveParticles - game.particles.length);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        game.particles.push(particlePool.get(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            i % 2 === 0 ? '#FF6B6B' : '#FFD700',
            60
        ));
    }
}

// Mobile detection
function detectMobile() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isSmallScreen = window.innerWidth < 768;
    game.isMobile = isTouchDevice && isSmallScreen;

    // Update control visibility classes on body
    if (game.isMobile) {
        document.body.classList.add('is-mobile');
    } else {
        document.body.classList.remove('is-mobile');
    }
}

// Parse URL query parameters for wave configuration
function parseGameParams() {
    const params = new URLSearchParams(window.location.search);

    const wave = parseInt(params.get('wave'));
    if (!isNaN(wave) && wave >= 1) {
        game.startingWave = wave;
    }

    const multiwave = parseInt(params.get('multiwave'));
    if (!isNaN(multiwave) && multiwave >= 2) {
        game.multiwaveTarget = multiwave;
    }
}

// Game functions
function initGame() {
    // Parse URL params for wave configuration (do this first)
    parseGameParams();

    game.canvas = document.getElementById('gameCanvas');
    game.titleCanvas = document.getElementById('titleCanvas');
    game.titleCtx = game.titleCanvas.getContext('2d');

    // Set title canvas size
    game.titleCanvas.width = CONFIG.CANVAS_WIDTH;
    game.titleCanvas.height = CONFIG.CANVAS_HEIGHT;
    game.ctx = game.canvas.getContext('2d');

    // Set canvas size (debounced to avoid rapid-fire during drag resize)
    resizeCanvas();
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(resizeCanvas, 150);
    });

    // Cache HUD DOM elements (avoid repeated lookups)
    game.hudElements = {
        healthBar: document.getElementById('player-health'),
        comboDisplay: document.getElementById('player-combo'),
        playerName: document.getElementById('player-name'),
        portrait: document.getElementById('player-portrait'),
        waveNumber: document.getElementById('waveNumber'),
        enemyCount: document.getElementById('enemyCount'),
        pauseOverlay: document.getElementById('pauseOverlay'),
    };

    // Show loading message
    const startBtn = document.getElementById('startBtn');
    const originalText = startBtn.textContent;
    startBtn.textContent = 'Loading...';
    startBtn.disabled = true;

    // Load all assets first
    assets.load(() => {
        // Assets loaded successfully
        startBtn.textContent = originalText;
        startBtn.disabled = false;
        if (assets.failed === 0) {
            console.log('All assets loaded successfully!');
        } else {
            console.log(`Assets loaded with ${assets.failed} failure(s)`);
        }

        // Pre-render Game Over background so it's ready when needed
        const gameOverBg = document.getElementById('gameOverBg');
        const bg = assets.get('background_swamp');
        if (gameOverBg && bg && bg.complete) {
            gameOverBg.src = bg.src;
        }

        // Set up Game Over button listeners (before shared URL check so they work on shared results)
        document.getElementById('restartBtn').addEventListener('click', restartGame);
        document.getElementById('titleBtn').addEventListener('click', returnToTitle);
        document.getElementById('shareBtn').addEventListener('click', () => {
            // Calculate frog counts from game.defeatedFrogs
            const frogCounts = { small: 0, medium: 0, poison_dart: 0, large: 0 };
            game.defeatedFrogs.forEach(frog => {
                if (frogCounts.hasOwnProperty(frog.type)) {
                    frogCounts[frog.type]++;
                }
            });

            // Get snake ID from player or selectedSnakeId
            const snakeId = game.player ? game.player.variant.id : (game.selectedSnakeId || 'green');

            // Generate URL (waves completed is relative to starting wave)
            const wavesCompleted = game.wave - game.startingWave;
            const url = `${window.location.origin}${window.location.pathname}#score=${game.score}&waves=${wavesCompleted}&small=${frogCounts.small}&medium=${frogCounts.medium}&poison=${frogCounts.poison_dart}&boss=${frogCounts.large}&snake=${snakeId}`;

            // Copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                // Show feedback
                const feedback = document.getElementById('shareFeedback');
                feedback.style.display = 'block';
                setTimeout(() => {
                    feedback.style.display = 'none';
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy URL:', err);
            });
        });

        // Parade control buttons
        document.getElementById('paradeReplayBtn').addEventListener('click', () => {
            if (frogParade) {
                const replayBtn = document.getElementById('paradeReplayBtn');
                replayBtn.classList.add('rotating');
                setTimeout(() => replayBtn.classList.remove('rotating'), 500);
                frogParade.replay();
            }
        });

        document.getElementById('paradeSpeedBtn').addEventListener('click', () => {
            if (frogParade) {
                frogParade.cycleSpeed();
                // Update button text with arrow symbols
                const speedBtn = document.getElementById('paradeSpeedBtn');
                const speedSymbols = ['❯', '❯❯', '❯❯❯'];
                speedBtn.textContent = speedSymbols[frogParade.speed - 1];
            }
        });

        // Pause button and overlay
        document.getElementById('pauseBtn').addEventListener('click', togglePause);
        document.getElementById('pauseOverlay').addEventListener('click', () => {
            // Only allow click/tap to unpause on mobile devices
            // On desktop, must use P key to maintain input mode consistency
            if (game.isMobile) {
                togglePause();
            }
        });

        // Setup controls (needed for Enter key on share screen)
        setupControls();

        // Check for shared Game Over URL
        const urlData = parseGameOverURL();
        if (urlData) {
            // Skip title screen, go directly to Game Over with shared data
            populateFromURL(urlData);
            game.isSharedResult = true;
            gameOver(true);
            return; // Stop initialization here
        }

        // Initialize audio manager
        audioManager.init();

        // Create initial lily pads
        createLilyPads();

        // Detect mobile device
        detectMobile();

        // UI event listeners
        startBtn.addEventListener('click', () => {
            // Default to Jade if no selection made
            if (!game.selectedSnakeId) {
                game.selectedSnakeId = 'green';
            }
            startGame();
        });

        // How to Play toggle functionality
        const closeInstructionsBtn = document.getElementById('closeInstructions');
        const instructions = document.getElementById('instructions');
        const instructionsHeader = document.querySelector('.instructions-header');

        // Click on instructions panel to toggle expand/collapse
        if (instructions) {
            instructions.addEventListener('click', (e) => {
                // If clicking the header or panel when collapsed, expand
                if (!instructions.classList.contains('expanded')) {
                    instructions.classList.add('expanded');
                    e.stopPropagation();
                } else {
                    // If expanded, clicking anywhere (including close button) collapses
                    instructions.classList.remove('expanded');
                    e.stopPropagation();
                }
            });
        }

        // Close button explicitly removes expanded class
        if (closeInstructionsBtn) {
            closeInstructionsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                instructions.classList.remove('expanded');
            });
        }

        // Add title screen click handler for snake jump animation and snake selection
        const titleScreen = document.getElementById('titleScreen');
        const handleTitleClick = (e) => {
            // Don't trigger if clicking the start button, instructions, or title overlay buttons
            if (e.target.id === 'startBtn' ||
                e.target.id === 'closeInstructions' ||
                e.target.closest('#instructions') ||
                e.target.closest('.title-overlay button')) {
                return;
            }

            // Get click/touch position relative to canvas
            const rect = game.titleCanvas.getBoundingClientRect();
            const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
            const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            const canvasX = (clientX - rect.left) * scaleX;
            const canvasY = (clientY - rect.top) * scaleY;

            // Check if clicked on left snake (P1)
            const leftSnakeX = 270;
            const leftSnakeY = 195;
            const snakeSize = 66; // Match green snake size
            const leftHitbox = {
                x: leftSnakeX - snakeSize / 2,
                y: leftSnakeY - snakeSize / 2,
                width: snakeSize,
                height: snakeSize
            };

            // Check if clicked on right snake (P2)
            const rightSnakeX = CONFIG.CANVAS_WIDTH - 270;
            const rightSnakeY = 195;
            const rightHitbox = {
                x: rightSnakeX - snakeSize / 2,
                y: rightSnakeY - snakeSize / 2,
                width: snakeSize,
                height: snakeSize
            };

            // Check if clicked on left snake
            if (canvasX >= leftHitbox.x && canvasX <= leftHitbox.x + leftHitbox.width &&
                canvasY >= leftHitbox.y && canvasY <= leftHitbox.y + leftHitbox.height) {
                selectSnake('green');
                return;
            }

            // Check if clicked on right snake
            if (canvasX >= rightHitbox.x && canvasX <= rightHitbox.x + rightHitbox.width &&
                canvasY >= rightHitbox.y && canvasY <= rightHitbox.y + rightHitbox.height) {
                selectSnake('orange');
                return;
            }

            // Click anywhere else on canvas makes snakes jump
            makeTitleSnakesJump();
        };
        titleScreen.addEventListener('click', handleTitleClick);
        titleScreen.addEventListener('touchstart', handleTitleClick, { passive: true });

        // Add hover cursor for snakes
        const handleTitleHover = (e) => {
            const rect = game.titleCanvas.getBoundingClientRect();
            const scaleX = CONFIG.CANVAS_WIDTH / rect.width;
            const scaleY = CONFIG.CANVAS_HEIGHT / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;

            const snakeSize = 66; // Match green snake size
            const leftSnakeHitbox = {
                x: 270 - snakeSize / 2,
                y: 195 - snakeSize / 2,
                width: snakeSize,
                height: snakeSize
            };
            const rightSnakeHitbox = {
                x: (CONFIG.CANVAS_WIDTH - 270) - snakeSize / 2,
                y: 195 - snakeSize / 2,
                width: snakeSize,
                height: snakeSize
            };

            // Check if hovering over either snake
            const overLeftSnake = mouseX >= leftSnakeHitbox.x && mouseX <= leftSnakeHitbox.x + leftSnakeHitbox.width &&
                                  mouseY >= leftSnakeHitbox.y && mouseY <= leftSnakeHitbox.y + leftSnakeHitbox.height;
            const overRightSnake = mouseX >= rightSnakeHitbox.x && mouseX <= rightSnakeHitbox.x + rightSnakeHitbox.width &&
                                   mouseY >= rightSnakeHitbox.y && mouseY <= rightSnakeHitbox.y + rightSnakeHitbox.height;

            game.titleCanvas.style.cursor = (overLeftSnake || overRightSnake) ? 'pointer' : 'default';
        };
        titleScreen.addEventListener('mousemove', handleTitleHover);

        // Draw title screen with graphics
        drawTitleScreen();
    });
}

function drawTitleScreen() {
    const ctx = game.titleCtx;

    // Play title screen music
    audioManager.playTitle();

    // Draw background
    const bg = assets.get('title_background');
    if (bg && bg.complete) {
        ctx.drawImage(bg, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, '#2C5F2D');
        gradient.addColorStop(1, '#1C3F1D');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    // Update title snake animations
    updateTitleSnakes();

    // Draw left snake (P1 - Green)
    const leftSprite = game.titleSnakes.left.jumping ?
        assets.get('snake_p1_jumping') : assets.get('snake_p1_idle');
    if (leftSprite && leftSprite.complete) {
        const snakeSize = 66;
        const snakeX = 270;
        const snakeY = 195 + game.titleSnakes.left.y;
        const aspect = leftSprite.width / leftSprite.height;
        const width = snakeSize;
        const height = width / aspect;
        ctx.drawImage(leftSprite, snakeX - width/2, snakeY - height/2, width, height);

        // Selection indicator for Jade
        if (game.titleSnakes.left.selected) {
            ctx.save();
            ctx.strokeStyle = '#4CAF50';
            ctx.shadowColor = '#4CAF50';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 4;
            ctx.strokeRect(snakeX - width/2 - 5, snakeY - height/2 - 5, width + 10, height + 10);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('▼ SELECTED ▼', snakeX, snakeY - height/2 - 15);
            ctx.restore();
        }
    }

    // Draw logo in center
    const logo = assets.get('logo_title');
    if (logo && logo.complete) {
        const logoScale = 0.3;
        const logoWidth = logo.width * logoScale;
        const logoHeight = logo.height * logoScale;
        const logoX = (CONFIG.CANVAS_WIDTH - logoWidth) / 2;
        const logoY = -10;
        ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
    }

    // Draw right snake (P2 - Orange) facing left
    const rightSprite = game.titleSnakes.right.jumping ?
        assets.get('snake_p2_jumping') : assets.get('snake_p2_idle');
    if (rightSprite && rightSprite.complete) {
        const snakeSize = 98;
        const snakeX = CONFIG.CANVAS_WIDTH - 270;
        const snakeY = 195 + game.titleSnakes.right.y;
        const aspect = rightSprite.width / rightSprite.height;
        const width = snakeSize;
        const height = width / aspect;

        // Flip horizontally to face left
        ctx.save();
        ctx.translate(snakeX, snakeY);
        ctx.scale(-1, 1);
        ctx.drawImage(rightSprite, -width/2, -height/2, width, height);
        ctx.restore();

        // Selection indicator for Blaze
        if (game.titleSnakes.right.selected) {
            ctx.save();
            ctx.strokeStyle = '#FF9800';
            ctx.shadowColor = '#FF9800';
            ctx.shadowBlur = 15;
            ctx.lineWidth = 4;
            ctx.strokeRect(snakeX - width/2 - 5, snakeY - height/2 - 5, width + 10, height + 10);
            ctx.shadowBlur = 0;

            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 16px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('▼ SELECTED ▼', snakeX, snakeY - height/2 - 15);
            ctx.restore();
        }
    }
}

function updateTitleSnakes() {
    const gravity = 0.6;
    const groundY = 0;

    // Update left snake
    if (game.titleSnakes.left.jumping) {
        game.titleSnakes.left.vy += gravity;
        game.titleSnakes.left.y += game.titleSnakes.left.vy;
        
        if (game.titleSnakes.left.y >= groundY) {
            game.titleSnakes.left.y = groundY;
            game.titleSnakes.left.vy = 0;
            game.titleSnakes.left.jumping = false;
        }
    }

    // Update right snake
    if (game.titleSnakes.right.jumping) {
        game.titleSnakes.right.vy += gravity;
        game.titleSnakes.right.y += game.titleSnakes.right.vy;
        
        if (game.titleSnakes.right.y >= groundY) {
            game.titleSnakes.right.y = groundY;
            game.titleSnakes.right.vy = 0;
            game.titleSnakes.right.jumping = false;
        }
    }

    // Redraw title screen if snakes are animating
    if (game.titleSnakes.left.jumping || game.titleSnakes.right.jumping) {
        requestAnimationFrame(drawTitleScreen);
    }
}

function makeTitleSnakesJump() {
    game.titleSnakes.left.jumping = true;
    game.titleSnakes.left.vy = -12;
    
    game.titleSnakes.right.jumping = true;
    game.titleSnakes.right.vy = -12;
    
    requestAnimationFrame(drawTitleScreen);
}

function resizeCanvas() {
    const container = document.getElementById('gameScreen');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - 100; // Account for HUD

    const scale = Math.min(
        containerWidth / CONFIG.CANVAS_WIDTH,
        containerHeight / CONFIG.CANVAS_HEIGHT
    );

    game.canvas.width = CONFIG.CANVAS_WIDTH;
    game.canvas.height = CONFIG.CANVAS_HEIGHT;
    game.canvas.style.width = (CONFIG.CANVAS_WIDTH * scale) + 'px';
    game.canvas.style.height = (CONFIG.CANVAS_HEIGHT * scale) + 'px';
}

function createLilyPads() {
    game.lilyPads = [];
    for (let i = 0; i < 8; i++) {
        const width = 80 + Math.random() * 30;
        let x = 100 + i * 140 + Math.random() * 40;
        // Ensure lily pad stays fully on screen
        x = Math.min(x, CONFIG.CANVAS_WIDTH - width);
        const y = CONFIG.WATER_LEVEL - 20 + Math.random() * 30;
        game.lilyPads.push(new LilyPad(x, y, width));
    }
}

function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;

        // Start game with Enter on title screen or game over screen
        if (e.key === 'Enter' && !game.running) {
            const restartBtn = document.getElementById('restartBtn');
            const startBtn = document.getElementById('startBtn');

            // Check which button is visible and click it
            if (restartBtn && restartBtn.offsetParent !== null) {
                restartBtn.click();
            } else if (startBtn && !startBtn.disabled) {
                startBtn.click();
            }
        }

        // Arrow keys to select snake on title screen
        if (game.screen === 'title' && !game.running) {
            if (e.key === 'ArrowLeft') {
                selectSnake('green');
            } else if (e.key === 'ArrowRight') {
                selectSnake('orange');
            }
        }

        // Interactive portrait on game over screen (ignore key repeats to prevent jitter)
        // Don't allow interrupting an animation that's already playing
        if (game.screen === 'gameover' && !game.running && !e.repeat && game.gameOverPortraitTimer === 0) {
            if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
                // Roll animation (longer to show full roll)
                game.gameOverPortraitState = 'rolling';
                game.gameOverPortraitTimer = 600; // Long enough to see a complete roll
                updateGameOverPortrait();
            } else if (e.key === '1' || e.code === 'Digit1') {
                // Whip animation (temporary)
                game.gameOverPortraitState = 'whipping';
                game.gameOverPortraitTimer = 500; // Reset after 500ms
                updateGameOverPortrait();
            } else if (e.key === 'ArrowDown') {
                // Swimming (temporary)
                game.gameOverPortraitState = 'swimming';
                game.gameOverPortraitTimer = 600; // Reset after 600ms
                updateGameOverPortrait();
            } else if (e.key === 'ArrowUp') {
                // Jump and return to idle
                game.gameOverPortraitState = 'jumping';
                game.gameOverPortraitTimer = 500; // Match animation duration
                updateGameOverPortrait();
            }
        }

        // Pause game with P key
        if ((e.key === 'p' || e.key === 'P') && game.running && game.screen === 'game') {
            togglePause();
        }

        // Playtesting shortcut: Delete key to instantly die
        if (e.key === 'Delete' && game.running && game.player && !game.player.dead) {
            game.player.health = 0;
            game.player.die();
        }

        // Action buttons (0 = roll, 1 = whip)
        if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') input.roll = true;
        if (e.key === '1' || e.code === 'Digit1') input.whip = true;
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;

        if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') input.roll = false;
        if (e.key === '1' || e.code === 'Digit1') input.whip = false;
    });

    // Mobile touch controls - only register on mobile/touch devices
    const isMobile = window.matchMedia('(max-width: 768px)').matches ||
                     window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
        setupMobileControls();
    }
}

function setupMobileControls() {
    const joystick = document.querySelector('#joystick1 .joystick-base');
    const stick = joystick.querySelector('.joystick-stick');
    let touchId = null;

    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        touchId = e.changedTouches[0].identifier;
        handleJoystickMove(e.changedTouches[0], joystick, stick);
    }, { passive: false });

    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let touch of e.changedTouches) {
            if (touch.identifier === touchId) {
                handleJoystickMove(touch, joystick, stick);
            }
        }
    }, { passive: false });

    joystick.addEventListener('touchend', () => {
        stick.style.transform = 'translate(-50%, -50%)';
        input.x = 0;
        input.y = 0;
        touchId = null;
    }, { passive: true });

    // Action buttons
    const actionButtons = document.querySelectorAll('#actions1 .action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (btn.classList.contains('roll-btn')) input.roll = true;
            if (btn.classList.contains('whip-btn')) input.whip = true;
        }, { passive: false });

        btn.addEventListener('touchend', () => {
            input.roll = false;
            input.whip = false;
        }, { passive: true });
    });
}

function handleJoystickMove(touch, joystick, stick) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
    const angle = Math.atan2(dy, dx);

    stick.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;

    const deadzone = 10;
    input.x = Math.abs(dx) > deadzone ? Math.max(-1, Math.min(1, dx / 30)) : 0;
    input.y = Math.abs(dy) > deadzone ? Math.max(-1, Math.min(1, dy / 30)) : 0;
}

function updateKeyboardInput() {
    input.x = 0;
    input.y = 0;
    if (game.keys['arrowleft'] || game.keys['a']) input.x = -1;
    if (game.keys['arrowright'] || game.keys['d']) input.x = 1;
    if (game.keys['arrowup'] || game.keys['w']) input.y = -1;
    if (game.keys['arrowdown'] || game.keys['s']) input.y = 1;
}

function selectSnake(snakeId) {
    game.selectedSnakeId = snakeId;
    game.titleSnakes.left.selected = (snakeId === 'green');
    game.titleSnakes.right.selected = (snakeId === 'orange');

    drawTitleScreen();

    // Visual feedback: make the selected snake jump
    if (snakeId === 'green') {
        game.titleSnakes.left.vy = -12;
        game.titleSnakes.left.jumping = true;
    } else {
        game.titleSnakes.right.vy = -12;
        game.titleSnakes.right.jumping = true;
    }
}

function startGame() {
    setScreen('game');
    audioManager.hasInteracted = true;
    audioManager.playBackground();
    game.running = true;
    game.paused = false;
    document.getElementById('pauseOverlay').style.display = 'none';
    game.wave = game.startingWave;
    game.score = 0;
    game.enemies = [];
    game.particles = [];
    game.defeatedFrogs = [];
    // Reset wave transition flags
    game.waveTransitioning = false;
    game.multiwaveTriggered = false;
    game.inMultiwave = false;

    // Generate fresh lily pads for this game
    createLilyPads();

    // Use selected variant, defaulting to green if somehow not set
    const variantId = game.selectedSnakeId || 'green';
    const variant = SNAKE_VARIANTS[variantId];

    // Calculate starting position on leftmost lily pad (start a bit higher for fall-in effect)
    const firstPad = game.lilyPads[0];
    const startX = firstPad.x + firstPad.width / 2 - 25; // 25 = player.width / 2
    const startY = firstPad.y - 300; // Start higher to fall onto lily pad

    game.player = new Snake(startX, startY, variant);

    // Initialize player to starting state
    game.player.health = 100;
    game.player.dead = false;
    game.player.x = startX;
    game.player.y = startY;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.combo = 0;
    game.player.comboTimer = 0;
    game.player.state = 'idle';
    game.player.rollTimer = 0;
    game.player.rollCooldown = 0;
    game.player.whipTimer = 0;
    game.player.whipCooldown = 0;
    game.player.invulnerable = 0;
    game.player.onGround = false;
    game.player.width = 50;
    game.player.height = 40;

    spawnWave();
    gameLoop();
}

function restartGame() {
    // Stop frog parade
    if (frogParade) {
        frogParade.stop();
    }

    // If coming from shared URL, reload page without hash for fresh start
    if (game.isSharedResult) {
        window.location.href = window.location.pathname;
        return;
    } else if (game.player && game.player.variant) {
        // Remember which snake we were playing as for Play Again
        game.selectedSnakeId = game.player.variant.id;
    }

    startGame();
}

function returnToTitle() {
    if (frogParade) {
        frogParade.stop();
    }
    game.running = false;
    audioManager.stopAll();

    // Clear selection when returning to title
    game.selectedSnakeId = null;
    game.titleSnakes.left.selected = false;
    game.titleSnakes.right.selected = false;

    setScreen('title');
    drawTitleScreen();
    audioManager.playTitle();
}

function setScreen(screen) {
    game.screen = screen;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (screen === 'title') {
        document.getElementById('titleScreen').classList.add('active');
    } else if (screen === 'game') {
        document.getElementById('gameScreen').classList.add('active');
    } else if (screen === 'gameover') {
        document.getElementById('gameOverScreen').classList.add('active');
    }
}

function spawnWave() {
    audioManager.playBackground();
    const count = 3 + game.wave * 2;
    for (let i = 0; i < count; i++) {
        const x = Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50;
        const y = 100;
        let type = 'small';
        if (game.wave > 2 && Math.random() < 0.3) type = 'medium';
        if (game.wave > 3 && Math.random() < 0.2) type = 'poison_dart';
        if (game.wave > 5 && Math.random() < 0.1) type = 'large';

        game.enemies.push(new Frog(x, y, type));
    }
}

function spawnMultiWave(fromWave, toWave) {
    audioManager.playBackground();
    for (let w = fromWave; w <= toWave; w++) {
        const count = 3 + w * 2;
        for (let i = 0; i < count; i++) {
            const x = Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50;
            // Spread y positions vertically for a "raining frogs" effect
            const y = Math.random() * 300 - 100;
            let type = 'small';
            if (w > 2 && Math.random() < 0.3) type = 'medium';
            if (w > 3 && Math.random() < 0.2) type = 'poison_dart';
            if (w > 5 && Math.random() < 0.1) type = 'large';
            game.enemies.push(new Frog(x, y, type));
        }
    }
}

function togglePause() {
    if (!game.running || game.screen !== 'game') return;

    game.paused = !game.paused;
    game.hudElements.pauseOverlay.style.display = game.paused ? 'flex' : 'none';
}

function gameLoop(timestamp = 0) {
    if (!game.running) return;

    game.time = timestamp; // Store for use in animations
    const deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;

    // Skip updates when paused, but keep rendering
    if (!game.paused) {
        update();
    }
    render();

    requestAnimationFrame(gameLoop);
}

function update() {
    updateKeyboardInput();

    if (game.player && !game.player.dead) {
        game.player.update();
    }

    game.enemies.forEach(enemy => enemy.update());

    // Remove dead enemies (in-place to avoid creating new array every frame)
    for (let i = game.enemies.length - 1; i >= 0; i--) {
        if (!game.enemies[i].alive) {
            game.enemies.splice(i, 1);
        }
    }

    // Check wave completion
    if (game.enemies.length === 0 && game.running && !game.waveTransitioning) {
        game.waveTransitioning = true;

        // Check if we should trigger multiwave
        const shouldTriggerMultiwave =
            game.multiwaveTarget &&
            !game.multiwaveTriggered &&
            game.wave === game.startingWave &&
            game.multiwaveTarget > game.startingWave;

        if (game.inMultiwave) {
            // Just cleared multiwave - jump to after multiwaveTarget
            game.wave = game.multiwaveTarget + 1;
            game.inMultiwave = false;
            setTimeout(() => {
                if (game.running) {
                    spawnWave();
                    game.waveTransitioning = false;
                }
            }, 2000);
        } else if (shouldTriggerMultiwave) {
            // Trigger multiwave
            game.wave = game.startingWave + 1;
            game.multiwaveTriggered = true;
            game.inMultiwave = true;
            setTimeout(() => {
                if (game.running) {
                    spawnMultiWave(game.startingWave + 1, game.multiwaveTarget);
                    game.waveTransitioning = false;
                }
            }, 2000);
        } else {
            // Normal wave progression
            game.wave++;
            setTimeout(() => {
                if (game.running) {
                    spawnWave();
                    game.waveTransitioning = false;
                }
            }, 2000);
        }
    }

    // Update lily pads
    game.lilyPads.forEach(pad => pad.update());

    // Update particles (return dead ones to pool for reuse)
    for (let i = game.particles.length - 1; i >= 0; i--) {
        game.particles[i].update();
        if (game.particles[i].life <= 0) {
            particlePool.release(game.particles[i]);
            game.particles.splice(i, 1);
        }
    }

    // Update HUD
    updateHUD();
}

function render() {
    const ctx = game.ctx;

    // Draw background image
    const bg = assets.get('background_swamp');
    ctx.drawImage(bg, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw lily pads
    game.lilyPads.forEach(pad => pad.draw(ctx));

    if (game.player) {
        game.player.draw(ctx);
    }

    game.enemies.forEach(enemy => enemy.draw(ctx));

    // Draw particles
    game.particles.forEach(p => p.draw(ctx));
}

function updateHUD() {
    if (!game.player || !game.hudElements) return;

    const hud = game.hudElements;

    if (hud.healthBar) {
        hud.healthBar.style.width = game.player.health + '%';
    }

    if (hud.comboDisplay) {
        hud.comboDisplay.textContent = game.player.combo;
    }

    if (hud.playerName && game.player.variant) {
        hud.playerName.textContent = game.player.variant.displayName;
    }

    // Update player portrait based on current action
    if (hud.portrait && game.player.variant) {
        const spritePrefix = game.player.variant.spritePrefix;
        const spriteName = getSnakeSpriteName(spritePrefix, game.player.state, game.player.inWater, game.player.onGround);

        // Update portrait src if sprite is available (fallback to idle if sprite missing)
        if (assets.images[spriteName]) {
            hud.portrait.src = assets.images[spriteName].src;
        } else if (assets.images[`${spritePrefix}_idle`]) {
            hud.portrait.src = assets.images[`${spritePrefix}_idle`].src;
        }
    }

    if (hud.waveNumber) {
        if (game.inMultiwave) {
            hud.waveNumber.textContent = `Waves ${game.startingWave + 1}-${game.multiwaveTarget}`;
        } else {
            hud.waveNumber.textContent = `Wave ${game.wave}`;
        }
    }

    if (hud.enemyCount) {
        hud.enemyCount.textContent = `Frogs: ${game.enemies.length}`;
    }
}

// Parse Game Over URL parameters for shareable results
function parseGameOverURL() {
    const hash = window.location.hash.substring(1);
    if (!hash) return null;

    const params = new URLSearchParams(hash);

    // Check if this is a game over share URL
    if (!params.has('score')) return null;

    const score = parseInt(params.get('score'));
    const waves = parseInt(params.get('waves'));
    const small = parseInt(params.get('small'));
    const medium = parseInt(params.get('medium'));
    const poison = parseInt(params.get('poison'));
    const boss = parseInt(params.get('boss'));
    const snake = params.get('snake') || 'green'; // Default to green/Jade if not specified

    // Validate all are non-negative integers
    if (isNaN(score) || score < 0 || isNaN(waves) || waves < 0 ||
        isNaN(small) || small < 0 || isNaN(medium) || medium < 0 ||
        isNaN(poison) || poison < 0 || isNaN(boss) || boss < 0) {
        return null;
    }

    // Validate snake is valid ID
    if (snake !== 'green' && snake !== 'orange') {
        return null;
    }

    return { score, waves, small, medium, poison, boss, snake };
}

// Populate game state from URL parameters
function populateFromURL(urlData) {
    game.score = urlData.score;
    game.wave = urlData.waves + 1; // Add 1 because gameOver() displays wave - 1
    game.selectedSnakeId = urlData.snake; // Remember which snake was used

    // Build defeatedFrogs array
    game.defeatedFrogs = [];
    for (let i = 0; i < urlData.small; i++) {
        game.defeatedFrogs.push({ type: 'small' });
    }
    for (let i = 0; i < urlData.medium; i++) {
        game.defeatedFrogs.push({ type: 'medium' });
    }
    for (let i = 0; i < urlData.poison; i++) {
        game.defeatedFrogs.push({ type: 'poison_dart' });
    }
    for (let i = 0; i < urlData.boss; i++) {
        game.defeatedFrogs.push({ type: 'large' });
    }
}

// Animate a counter from 0 to targetValue with ease-out effect
function animateCounter(element, targetValue, duration = 500, delay = 0) {
    element.textContent = '0';
    if (targetValue === 0) return;

    setTimeout(() => {
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.floor(targetValue * eased);

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = targetValue;
            }
        }

        requestAnimationFrame(update);
    }, delay);
}

function gameOver(isSharedResult = false) {
    game.running = false;
    if (!isSharedResult) {
        audioManager.stopAll();
    }

    // Calculate frog counts by type
    const frogCounts = {
        small: 0,
        medium: 0,
        poison_dart: 0,
        large: 0
    };

    game.defeatedFrogs.forEach(frog => {
        if (frogCounts.hasOwnProperty(frog.type)) {
            frogCounts[frog.type]++;
        }
    });

    const totalFrogs = game.defeatedFrogs.length;
    const wavesCompleted = game.wave - game.startingWave;

    // Get all counter elements (score/wave use inner spans for animation)
    const scoreEl = document.getElementById('finalScoreValue');
    const waveEl = document.getElementById('finalWaveValue');
    const totalFrogsEl = document.getElementById('totalFrogs');
    const smallEl = document.getElementById('smallFrogCount');
    const mediumEl = document.getElementById('mediumFrogCount');
    const poisonEl = document.getElementById('poisonFrogCount');
    const bossEl = document.getElementById('bossFrogCount');

    // Initialize all to 0
    [scoreEl, waveEl, totalFrogsEl, smallEl, mediumEl, poisonEl, bossEl].forEach(el => {
        if (el) el.textContent = '0';
    });

    // Update snake portrait on Game Over screen
    game.gameOverPortraitState = 'idle';
    game.gameOverPortraitTimer = 0;
    updateGameOverPortrait();

    // Update buttons for shared results
    const shareBtn = document.getElementById('shareBtn');
    const restartBtn = document.getElementById('restartBtn');
    const titleBtn = document.getElementById('titleBtn');

    if (isSharedResult) {
        // Hide share button (can't share a share)
        if (shareBtn) shareBtn.style.display = 'none';
        // Change "Play Again" to "Play" and hide "Return to Title"
        if (restartBtn) restartBtn.textContent = 'Play';
        if (titleBtn) titleBtn.style.display = 'none';
    } else {
        // Regular game over - show all buttons with normal text
        if (shareBtn) shareBtn.style.display = '';
        if (restartBtn) restartBtn.textContent = 'Play Again';
        if (titleBtn) titleBtn.style.display = '';
    }

    setTimeout(() => {
        // Background already set during init, just show the screen
        setScreen('gameover');

        // Animate all counters together when screen becomes visible
        animateCounter(scoreEl, game.score, 2000, 0);
        animateCounter(waveEl, wavesCompleted, 2000, 0);
        animateCounter(totalFrogsEl, totalFrogs, 2000, 0);
        animateCounter(smallEl, frogCounts.small, 2000, 0);
        animateCounter(mediumEl, frogCounts.medium, 2000, 0);
        animateCounter(poisonEl, frogCounts.poison_dart, 2000, 0);
        animateCounter(bossEl, frogCounts.large, 2000, 0);

        // Start the frog parade
        if (!frogParade) frogParade = new FrogParade();
        frogParade.start(game.defeatedFrogs);
    }, 1000);
}

function updateGameOverPortrait() {
    const gameOverPortrait = document.getElementById('gameOverSnakePortrait');
    if (!gameOverPortrait) return;

    const snakeId = game.selectedSnakeId || 'green';
    const variant = SNAKE_VARIANTS[snakeId];
    if (!variant) return;

    const spritePrefix = variant.spritePrefix;
    const state = game.gameOverPortraitState;
    const spriteName = getSnakeSpriteName(spritePrefix, state, state === 'swimming', state !== 'jumping');

    // Handle CSS animation classes
    gameOverPortrait.classList.remove('rolling', 'jumping');
    if (state === 'rolling') {
        gameOverPortrait.classList.add('rolling');
    } else if (state === 'jumping') {
        gameOverPortrait.classList.add('jumping');
    }

    // Update portrait src if sprite is available (fallback to idle if sprite missing)
    if (assets.images[spriteName]) {
        gameOverPortrait.src = assets.images[spriteName].src;
    } else if (assets.images[`${spritePrefix}_idle`]) {
        gameOverPortrait.src = assets.images[`${spritePrefix}_idle`].src;
    }

    // Handle timer countdown for temporary animations
    if (game.gameOverPortraitTimer > 0) {
        setTimeout(() => {
            game.gameOverPortraitTimer = 0;
            game.gameOverPortraitState = 'idle';
            updateGameOverPortrait();
        }, game.gameOverPortraitTimer);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
