// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 600,
    WATER_LEVEL: 450,
    GRAVITY: 0.5,
    FRICTION: 0.85,
    WATER_FRICTION: 0.5,
    PLAYER_SPEED: 5,
    PLAYER_JUMP: 12,
    WATER_JUMP: 6,
    COMBO_TIMEOUT: 2000,
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
        'background_swamp': 'graphics/background_swamp.png',
        'title_background': 'graphics/title-background_swamp.png',
        'water_tile': 'graphics/snakez_water_tile_64.png',

        // Player 1 (Green Snake)
        'snake_p1_idle': 'graphics/snake_p1_idle.png',
        'snake_p1_extended': 'graphics/snake_p1_extended.png',
        'snake_p1_jumping': 'graphics/snake_p1_jumping.png',
        'snake_p1_rolling': 'graphics/snake_p1_rolling.png',
        'snake_p1_swimming': 'graphics/snake_p1_swimming.png',

        // Player 2 (Orange Snake)
        'snake_p2_idle': 'graphics/snake_p2_idle.png',
        'snake_p2_extended': 'graphics/snake_p2_extended.png',
        'snake_p2_jumping': 'graphics/snake_p2_jumping.png',
        'snake_p2_biting': 'graphics/snake_p2_biting.png',
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
        'ui_healthbar_frame': 'graphics/ui_healthbar_frame.png',
        'ui_healthbar_fill': 'graphics/ui_healthbar_fill.png',
        'ui_combo_star': 'graphics/ui_combo_star.png',
    },

    load(callback) {
        this.total = Object.keys(this.manifest).length;
        this.loaded = 0;

        for (const [key, path] of Object.entries(this.manifest)) {
            const img = new Image();
            img.onload = () => {
                this.loaded++;
                if (this.loaded === this.total && callback) {
                    callback();
                }
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${path}`);
                this.loaded++;
                if (this.loaded === this.total && callback) {
                    callback();
                }
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

        // Add event listeners
        overallSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            overallValue.textContent = val;
            this.volumes.overall = val / 100;
            this.updateVolumes();
            this.saveSettings();
        });

        musicSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            musicValue.textContent = val;
            this.volumes.music = val / 100;
            this.updateVolumes();
            this.saveSettings();
        });

        sfxSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            sfxValue.textContent = val;
            this.volumes.sfx = val / 100;
            this.saveSettings();
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
    players: [],
    enemies: [],
    lilyPads: [],
    particles: [],
    keys: {},
    touches: {},
    lastTime: 0,
    screen: 'title',
    gameOverTimer: null,
    titleSnakes: { left: { y: 0, vy: 0, jumping: false }, right: { y: 0, vy: 0, jumping: false } },
    singlePlayer: false,
    activePlayer: null, // 0 for P1, 1 for P2 in single player
    isMobile: false,
};

// Input handlers
const input = {
    player1: { x: 0, y: 0, roll: false, grab: false },
    player2: { x: 0, y: 0, roll: false, grab: false },
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
    constructor(x, y, playerId, color) {
        super(x, y, 50, 40);
        this.playerId = playerId;
        this.color = color;
        this.health = 100;
        this.maxHealth = 100;
        this.dead = false;
        this.state = 'idle'; // idle, rolling, extended, grabbing
        this.facing = 1; // 1 = right, -1 = left
        this.combo = 0;
        this.comboTimer = 0;
        this.rollTimer = 0;
        this.rollCooldown = 0;
        this.grabTimer = 0;
        this.grabCooldown = 0;
        this.invulnerable = 0;
        this.segments = [];
        this.droppingThrough = false; // Flag for dropping through lily pads
        this.initSegments();
    }

    initSegments() {
        // Create body segments for visual effect
        for (let i = 0; i < 5; i++) {
            this.segments.push({ x: this.x - i * 8, y: this.y + this.height / 2 });
        }
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
        if (this.grabTimer > 0) this.grabTimer--;
        if (this.grabCooldown > 0) this.grabCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.comboTimer > 0) {
            this.comboTimer--;
        } else if (this.combo > 0) {
            this.combo = 0;
        }

        // Get input
        const playerInput = this.playerId === 1 ? input.player1 : input.player2;

        // Handle states
        if (this.state === 'rolling') {
            this.handleRollState();
        } else if (this.state === 'grabbing') {
            this.handleGrabState();
        } else {
            this.handleNormalMovement(playerInput);
        }

        // Roll attack
        if (playerInput.roll && this.rollCooldown === 0 && this.state === 'idle') {
            this.startRoll();
        }

        // Grab attack
        if (playerInput.grab && this.grabCooldown === 0 && this.state === 'idle') {
            this.startGrab();
        }

        // Update body segments
        this.updateSegments();
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

    startGrab() {
        this.state = 'grabbing';
        this.grabTimer = 20; // Tongue whip duration
        this.grabCooldown = 60;

        // Damage enemies in range with tongue whip
        for (const enemy of game.enemies) {
            if (enemy.alive && this.inGrabRange(enemy)) {
                this.hitEnemy(enemy, 30, this.facing * 12, -8);
            }
        }
    }

    inGrabRange(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const facingEnemy = (dx > 0 && this.facing > 0) || (dx < 0 && this.facing < 0);
        return dist < 100 && facingEnemy;
    }

    handleGrabState() {
        if (this.grabTimer === 0) {
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
        // Create death particle explosion
        createPlayerDeathEffect(this.x + this.width / 2, this.y + this.height / 2);

        // Check game over
        if (game.singlePlayer) {
            // In single player, death = immediate game over
            gameOver();
        } else {
            // In 2-player mode, check if both players are dead
            const alivePlayers = game.players.filter(p => !p.dead);
            if (alivePlayers.length === 0) {
                gameOver();
            }
        }
    }

    updateSegments() {
        // Follow the snake head
        if (this.segments.length > 0) {
            this.segments[0].x += (this.x - this.segments[0].x) * 0.3;
            this.segments[0].y += (this.y + this.height / 2 - this.segments[0].y) * 0.3;

            for (let i = 1; i < this.segments.length; i++) {
                this.segments[i].x += (this.segments[i - 1].x - this.segments[i].x) * 0.25;
                this.segments[i].y += (this.segments[i - 1].y - this.segments[i].y) * 0.25;
            }
        }
    }

    draw(ctx) {
        // Don't render dead players
        if (this.dead) {
            return;
        }

        // Determine which sprite to use
        const playerPrefix = this.playerId === 1 ? 'snake_p1' : 'snake_p2';
        let spriteName = `${playerPrefix}_idle`;

        if (this.state === 'rolling') {
            spriteName = `${playerPrefix}_rolling`;
        } else if (this.state === 'grabbing') {
            spriteName = `${playerPrefix}_extended`;
        } else if (this.inWater) {
            spriteName = `${playerPrefix}_swimming`;
        } else if (!this.onGround) {
            spriteName = `${playerPrefix}_jumping`;
        }

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
            } else if (this.state === 'grabbing') {
                // Both whipping sprites are bigger
                targetSize = this.playerId === 2 ? 85 : 75;
            } else if (!this.onGround) {
                // Green snake (P1) jumping sprite is bigger
                targetSize = this.playerId === 1 ? 65 : 55;
            } else {
                targetSize = 55; // Default idle size
            }

            // Scale sprite to fit target size while preserving aspect ratio
            const spriteAspect = sprite.width / sprite.height;
            let spriteWidth, spriteHeight;

            if (spriteAspect > 1) {
                // Wider than tall - scale based on width
                spriteWidth = targetSize;
                spriteHeight = spriteWidth / spriteAspect;
            } else {
                // Taller than wide - scale based on height
                spriteHeight = targetSize;
                spriteWidth = spriteHeight * spriteAspect;
            }

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
                ctx.rotate((Date.now() / 50) % (Math.PI * 2));
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
        super(x, y, 30, 30);
        this.type = type;
        this.health = type === 'small' ? 20 : type === 'medium' ? 40 : type === 'poison_dart' ? 15 : 80;
        this.maxHealth = this.health;
        this.alive = true;
        this.jumpTimer = 0;
        this.jumpCooldown = Math.random() * 60 + 40;
        this.color = type === 'small' ? '#4CAF50' : type === 'medium' ? '#2196F3' : type === 'poison_dart' ? '#FF00FF' : '#FF5722';
        this.attackTimer = 0;
        this.facing = 1; // 1 = right, -1 = left
        this.groundedFrames = 0; // Track how long we've been on ground
        this.hueRotation = type === 'poison_dart' ? Math.floor(Math.random() * 360) : 0; // Random color for poison darts

        // Type specific properties
        if (type === 'small') {
            this.width = 30;
            this.height = 30;
            this.jumpPower = 8;
        } else if (type === 'medium') {
            this.width = 40;
            this.height = 40;
            this.jumpPower = 12;
        } else if (type === 'poison_dart') {
            this.width = 25;
            this.height = 25;
            this.jumpPower = 14;
        } else {
            this.width = 60;
            this.height = 60;
            this.jumpPower = 10;
        }
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
                target.takeDamage(this.type === 'small' ? 3 : this.type === 'medium' ? 6 : this.type === 'poison_dart' ? 10 : 12);
                this.attackTimer = 0;
            }
        }
    }

    findNearestPlayer() {
        let nearest = null;
        let minDist = Infinity;

        for (const player of game.players) {
            if (player.health <= 0 || player.dead) continue;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = player;
            }
        }

        return nearest;
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
        game.score += this.type === 'small' ? 10 : this.type === 'medium' ? 25 : this.type === 'poison_dart' ? 35 : 50;
        createDeathEffect(this.x + this.width / 2, this.y + this.height / 2);
    }

    draw(ctx) {
        if (!this.alive) return;


        // Determine which sprite to use
        // Require 3 frames on ground before showing idle sprite to prevent jittering
        const isInAir = this.groundedFrames < 3;
        let spriteName;
        if (this.type === 'large') {
            spriteName = isInAir ? 'frog_large_boss_jumping' : 'frog_large_boss_idle';
        } else if (this.type === 'poison_dart') {
            spriteName = isInAir ? 'frog_poison_dart_jumping' : 'frog_poison_dart_idle';
        } else if (this.type === 'medium') {
            spriteName = isInAir ? 'frog_medium_jumping' : 'frog_medium_idle';
        } else {
            spriteName = isInAir ? 'frog_small_jumping' : 'frog_small_idle';
        }

        const sprite = assets.get(spriteName);

        if (sprite && sprite.complete) {
            // Calculate sprite size preserving aspect ratio
            // Use entity dimensions as target size, with boost for small jumping frogs
            let targetSize = Math.max(this.width, this.height);

            // Make small jumping frogs more visible
            if (this.type === 'small' && isInAir) {
                targetSize = 50; // Larger for jumping small frogs
            }

            // Scale sprite to fit target size while preserving aspect ratio
            const spriteAspect = sprite.width / sprite.height;
            let spriteWidth, spriteHeight;

            if (spriteAspect > 1) {
                // Wider than tall - scale based on width
                spriteWidth = targetSize;
                spriteHeight = spriteWidth / spriteAspect;
            } else {
                // Taller than wide - scale based on height
                spriteHeight = targetSize;
                spriteWidth = spriteHeight * spriteAspect;
            }

            // Center the sprite on the entity position
            const drawX = this.x + this.width / 2 - spriteWidth / 2;
            const drawY = this.y + this.height / 2 - spriteHeight / 2;

            // Flip sprite based on facing direction
            ctx.save();
            // Apply hue rotation for poison dart frogs
            if (this.type === 'poison_dart') {
                ctx.filter = `hue-rotate(${this.hueRotation}deg)`;
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
            // Calculate sprite size preserving aspect ratio
            // Scale to match lily pad width
            const spriteAspect = sprite.width / sprite.height;
            const spriteWidth = this.width;
            const spriteHeight = spriteWidth / spriteAspect;

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

// Particle effects
function createSplash(x, y) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = Math.random() * 3 + 2;
        game.particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed - 2,
            '#4FC3F7',
            30
        ));
    }
}

function createHitEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = Math.random() * 4 + 3;
        game.particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            '#FFD700',
            20
        ));
    }
}

function createDeathEffect(x, y) {
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        game.particles.push(new Particle(
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
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        game.particles.push(new Particle(
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

function updateMobileControlsVisibility() {
    if (!game.isMobile) {
        return; // Desktop always shows both controls
    }

    // Hide P2 controls on mobile
    const joystick2 = document.getElementById('joystick2');
    const actions2 = document.getElementById('actions2');

    if (joystick2) {
        joystick2.style.display = 'none';
    }
    if (actions2) {
        actions2.style.display = 'none';
    }
}

function updateDesktopControlsVisibility() {
    const p2Controls = document.getElementById('p2Controls');

    if (!p2Controls) return;

    // Hide P2 controls in single player mode
    if (game.singlePlayer) {
        p2Controls.style.display = 'none';
    } else {
        p2Controls.style.display = 'block';
    }
}

// Game functions
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.titleCanvas = document.getElementById('titleCanvas');
    game.titleCtx = game.titleCanvas.getContext('2d');

    // Set title canvas size
    game.titleCanvas.width = CONFIG.CANVAS_WIDTH;
    game.titleCanvas.height = CONFIG.CANVAS_HEIGHT;
    game.ctx = game.canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

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
        console.log('All assets loaded successfully!');

        // Initialize audio manager
        audioManager.init();

        // Create players
        game.players = [
            new Snake(100, 300, 1, '#4CAF50'),
            new Snake(200, 300, 2, '#FF9800')
        ];

        // Create initial lily pads
        createLilyPads();

        // Setup controls
        setupControls();

        // Detect mobile device
        detectMobile();

        // UI event listeners
        startBtn.addEventListener('click', () => startGame(false, null)); // Two-player co-op
        document.getElementById('restartBtn').addEventListener('click', restartGame);

        // Add title screen click handler for snake jump animation and snake selection
        const titleScreen = document.getElementById('titleScreen');
        const handleTitleClick = (e) => {
            // Don't trigger if clicking the start button, instructions, or title overlay
            if (e.target.id === 'startBtn' ||
                e.target.closest('#instructions') ||
                e.target.closest('.title-overlay')) {
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
                // Start single player as P1
                startGame(true, 0);
                return;
            }

            // Check if clicked on right snake
            if (canvasX >= rightHitbox.x && canvasX <= rightHitbox.x + rightHitbox.width &&
                canvasY >= rightHitbox.y && canvasY <= rightHitbox.y + rightHitbox.height) {
                // Start single player as P2
                startGame(true, 1);
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
        const snakeSize = 66; // Smaller size for green snake
        const snakeX = 270;
        const snakeY = 195 + game.titleSnakes.left.y;
        const aspect = leftSprite.width / leftSprite.height;
        const width = snakeSize;
        const height = width / aspect;
        ctx.drawImage(leftSprite, snakeX - width/2, snakeY - height/2, width, height);
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
        const x = 100 + i * 140 + Math.random() * 40;
        const y = CONFIG.WATER_LEVEL - 20 + Math.random() * 30;
        game.lilyPads.push(new LilyPad(x, y, 80 + Math.random() * 30));
    }
}

function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        game.keys[e.key.toLowerCase()] = true;

        // Start game with Enter on title screen
        if (e.key === 'Enter' && !game.running) {
            const startBtn = document.getElementById('startBtn');
            if (startBtn && !startBtn.disabled) {
                startBtn.click();
            }
        }

        // Single player controls (Arrow keys + 0/RCtrl)
        if (game.singlePlayer) {
            const activeInput = game.activePlayer === 0 ? input.player1 : input.player2;
            if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') activeInput.roll = true;
            if (e.code === 'ControlRight') activeInput.grab = true;
        }

        // Player 1 controls (Arrows + 0/RCtrl) - two player mode
        if (!game.singlePlayer) {
            if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') input.player1.roll = true;
            if (e.code === 'ControlRight') input.player1.grab = true;
        }

        // Player 2 controls (WASD + F/G) - two player mode
        if (!game.singlePlayer) {
            if (e.key.toLowerCase() === 'f') input.player2.roll = true;
            if (e.key.toLowerCase() === 'g') input.player2.grab = true;
        }
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;

        // Single player controls
        if (game.singlePlayer) {
            const activeInput = game.activePlayer === 0 ? input.player1 : input.player2;
            if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') activeInput.roll = false;
            if (e.code === 'ControlRight') activeInput.grab = false;
        }

        // Two player controls
        if (!game.singlePlayer) {
            if (e.key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') input.player1.roll = false;
            if (e.code === 'ControlRight') input.player1.grab = false;
            if (e.key.toLowerCase() === 'f') input.player2.roll = false;
            if (e.key.toLowerCase() === 'g') input.player2.grab = false;
        }
    });

    // Mobile touch controls - only register on mobile/touch devices
    const isMobile = window.matchMedia('(max-width: 768px)').matches ||
                     window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
        setupMobileControls();
    }
}

function setupMobileControls() {
    const joysticks = document.querySelectorAll('.joystick-base');
    const actionBtns = document.querySelectorAll('.action-btn');

    // Joystick controls
    joysticks.forEach((joystick, index) => {
        const playerId = index + 1;
        const stick = joystick.querySelector('.joystick-stick');
        let touchId = null;

        joystick.addEventListener('touchstart', (e) => {
            touchId = e.changedTouches[0].identifier;
            handleJoystickMove(e.changedTouches[0], joystick, stick, playerId);
        }, { passive: true });

        joystick.addEventListener('touchmove', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    handleJoystickMove(touch, joystick, stick, playerId);
                }
            }
        }, { passive: true });

        joystick.addEventListener('touchend', (e) => {
            stick.style.transform = 'translate(-50%, -50%)';
            const playerInput = playerId === 1 ? input.player1 : input.player2;
            playerInput.x = 0;
            playerInput.y = 0;
            touchId = null;
        }, { passive: true });
    });

    // Action buttons
    actionBtns.forEach(btn => {
        const playerId = parseInt(btn.dataset.player);
        const playerInput = playerId === 1 ? input.player1 : input.player2;

        btn.addEventListener('touchstart', (e) => {
            if (btn.classList.contains('roll-btn')) {
                playerInput.roll = true;
            } else if (btn.classList.contains('grab-btn')) {
                playerInput.grab = true;
            }
        }, { passive: true });

        btn.addEventListener('touchend', (e) => {
            if (btn.classList.contains('roll-btn')) {
                playerInput.roll = false;
            } else if (btn.classList.contains('grab-btn')) {
                playerInput.grab = false;
            }
        }, { passive: true });
    });
}

function handleJoystickMove(touch, joystick, stick, playerId) {
    const rect = joystick.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), rect.width / 2 - 10);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * distance;
    const stickY = Math.sin(angle) * distance;

    stick.style.transform = `translate(calc(-50% + ${stickX}px), calc(-50% + ${stickY}px))`;

    const playerInput = playerId === 1 ? input.player1 : input.player2;
    const deadzone = 10;
    playerInput.x = Math.abs(dx) > deadzone ? Math.max(-1, Math.min(1, dx / 30)) : 0;
    playerInput.y = Math.abs(dy) > deadzone ? Math.max(-1, Math.min(1, dy / 30)) : 0;
}

function updateKeyboardInput() {
    if (game.singlePlayer) {
        // Single player mode - always use Arrow keys regardless of which snake
        const activeInput = game.activePlayer === 0 ? input.player1 : input.player2;
        activeInput.x = 0;
        activeInput.y = 0;
        if (game.keys['arrowleft']) activeInput.x = -1;
        if (game.keys['arrowright']) activeInput.x = 1;
        if (game.keys['arrowup']) activeInput.y = -1;
        if (game.keys['arrowdown']) activeInput.y = 1;

        // Reset inactive player input
        const inactiveInput = game.activePlayer === 0 ? input.player2 : input.player1;
        inactiveInput.x = 0;
        inactiveInput.y = 0;
    } else {
        // Two player mode - separate controls
        // Player 1 (Arrows)
        input.player1.x = 0;
        input.player1.y = 0;
        if (game.keys['arrowleft']) input.player1.x = -1;
        if (game.keys['arrowright']) input.player1.x = 1;
        if (game.keys['arrowup']) input.player1.y = -1;
        if (game.keys['arrowdown']) input.player1.y = 1;

        // Player 2 (WASD)
        input.player2.x = 0;
        input.player2.y = 0;
        if (game.keys['a']) input.player2.x = -1;
        if (game.keys['d']) input.player2.x = 1;
        if (game.keys['w']) input.player2.y = -1;
        if (game.keys['s']) input.player2.y = 1;
    }
}

function startGame(singlePlayer = false, activePlayer = null) {
    setScreen('game');
    audioManager.hasInteracted = true;
    audioManager.playBackground();
    game.running = true;
    game.wave = 1;
    game.score = 0;
    game.enemies = [];
    game.particles = [];

    // Set single player mode
    if (game.isMobile) {
        // Force single player on mobile
        game.singlePlayer = true;
        game.activePlayer = 0; // Always P1 on mobile
    } else {
        game.singlePlayer = singlePlayer;
        game.activePlayer = activePlayer;
    }

    // Update mobile controls visibility
    updateMobileControlsVisibility();

    // Update desktop controls visibility
    updateDesktopControlsVisibility();

    // Reset players
    game.players.forEach((player, i) => {
        // In single player mode, only initialize the active player
        if (game.singlePlayer && i !== game.activePlayer) {
            player.health = 0;
            player.dead = true;
            return;
        }

        player.health = 100;
        player.dead = false;
        player.x = 100 + i * 100;
        player.y = 300;
        player.vx = 0;
        player.vy = 0;
        player.combo = 0;
        player.comboTimer = 0;
        player.state = 'idle';
        player.rollTimer = 0;
        player.rollCooldown = 0;
        player.grabTimer = 0;
        player.grabCooldown = 0;
        player.invulnerable = 0;
        player.onGround = false;
        player.width = 50;
        player.height = 40;
    });

    spawnWave();
    gameLoop();
}

function restartGame() {
    // Clear game over timer if active
    if (game.gameOverTimer) {
        clearTimeout(game.gameOverTimer);
        game.gameOverTimer = null;
    }
    startGame();
}

function returnToTitle() {
    // Clear game over timer
    if (game.gameOverTimer) {
        clearTimeout(game.gameOverTimer);
        game.gameOverTimer = null;
    }
    setScreen('title');
    audioManager.playTitle();
}

function setScreen(screen) {
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

function gameLoop(timestamp = 0) {
    if (!game.running) return;

    const deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;

    update();
    render();

    requestAnimationFrame(gameLoop);
}

function update() {
    updateKeyboardInput();

    // Update players
    game.players.forEach(player => player.update());

    // Update enemies
    game.enemies.forEach(enemy => enemy.update());

    // Remove dead enemies
    game.enemies = game.enemies.filter(e => e.alive);

    // Check wave completion
    if (game.enemies.length === 0 && game.running) {
        game.wave++;
        setTimeout(() => {
            if (game.running) spawnWave();
        }, 2000);
    }

    // Update lily pads
    game.lilyPads.forEach(pad => pad.update());

    // Update particles
    game.particles.forEach(p => p.update());
    game.particles = game.particles.filter(p => p.life > 0);

    // Update HUD
    updateHUD();
}

function render() {
    const ctx = game.ctx;

    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Draw background gradient (sky)
    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.WATER_LEVEL);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#B0E0E6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.WATER_LEVEL);

    // Draw water
    ctx.fillStyle = '#4FC3F7';
    ctx.fillRect(0, CONFIG.WATER_LEVEL, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.WATER_LEVEL);

    // Water waves effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 20) {
            const y = CONFIG.WATER_LEVEL + Math.sin((x + Date.now() / 200 + i * 100) / 30) * 5 + i * 15;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Draw lily pads
    game.lilyPads.forEach(pad => pad.draw(ctx));

    // Draw players
    game.players.forEach(player => player.draw(ctx));

    // Draw enemies
    game.enemies.forEach(enemy => enemy.draw(ctx));

    // Draw particles
    game.particles.forEach(p => p.draw(ctx));
}

function updateHUD() {
    // Health bars
    document.getElementById('p1-health').style.width = game.players[0].health + '%';
    document.getElementById('p2-health').style.width = game.players[1].health + '%';

    // Combos
    document.getElementById('p1-combo').textContent = game.players[0].combo;
    document.getElementById('p2-combo').textContent = game.players[1].combo;

    // Wave info
    document.getElementById('waveNumber').textContent = `Wave ${game.wave}`;
    document.getElementById('enemyCount').textContent = `Frogs: ${game.enemies.length}`;

    // Hide HUD for inactive players in single player mode
    if (game.singlePlayer) {
        const p1Hud = document.querySelector('.player-hud.p1');
        const p2Hud = document.querySelector('.player-hud.p2');

        if (game.activePlayer === 0) {
            // P1 active, hide P2 HUD
            if (p1Hud) p1Hud.style.display = '';
            if (p2Hud) p2Hud.style.display = 'none';
        } else if (game.activePlayer === 1) {
            // P2 active, hide P1 HUD
            if (p1Hud) p1Hud.style.display = 'none';
            if (p2Hud) p2Hud.style.display = '';
        }
    } else {
        // Show both HUDs in 2-player mode
        const p1Hud = document.querySelector('.player-hud.p1');
        const p2Hud = document.querySelector('.player-hud.p2');
        if (p1Hud) p1Hud.style.display = '';
        if (p2Hud) p2Hud.style.display = '';
    }
}

function gameOver() {
    game.running = false;
    audioManager.stopAll();
    document.getElementById('finalScore').textContent = `Score: ${game.score}`;
    document.getElementById('finalWave').textContent = `Waves Completed: ${game.wave - 1}`;
    setTimeout(() => {
        setScreen('gameover');
        // Start timer to return to title screen after 10 seconds
        if (game.gameOverTimer) clearTimeout(game.gameOverTimer);
        game.gameOverTimer = setTimeout(() => {
            returnToTitle();
        }, 10000);
    }, 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
