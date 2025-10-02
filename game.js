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

        // Check water
        this.inWater = this.y + this.height > CONFIG.WATER_LEVEL;

        // Apply friction
        const friction = this.inWater ? CONFIG.WATER_FRICTION : CONFIG.FRICTION;
        this.vx *= friction;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Boundaries
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > CONFIG.CANVAS_WIDTH) this.x = CONFIG.CANVAS_WIDTH - this.width;

        // Water surface
        if (this.y + this.height > CONFIG.WATER_LEVEL + 50) {
            this.y = CONFIG.WATER_LEVEL + 50 - this.height;
            this.vy = 0;
            this.onGround = true;
        }

        // Check lily pad collisions
        this.onGround = false;
        for (const pad of game.lilyPads) {
            if (this.collidesWith(pad) && this.vy >= 0 && this.y + this.height - this.vy <= pad.y + 10) {
                this.y = pad.y - this.height;
                this.vy = 0;
                this.onGround = true;
                break;
            }
        }

        // Ground check (water surface acts as ground when sinking)
        if (this.inWater && this.y + this.height >= CONFIG.WATER_LEVEL + 50) {
            this.onGround = true;
        }
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
        this.state = 'idle'; // idle, rolling, extended, grabbing
        this.facing = 1; // 1 = right, -1 = left
        this.combo = 0;
        this.comboTimer = 0;
        this.rollTimer = 0;
        this.rollCooldown = 0;
        this.grabTimer = 0;
        this.grabCooldown = 0;
        this.grabbedEnemy = null;
        this.invulnerable = 0;
        this.segments = [];
        this.initSegments();
    }

    initSegments() {
        // Create body segments for visual effect
        for (let i = 0; i < 5; i++) {
            this.segments.push({ x: this.x - i * 8, y: this.y + this.height / 2 });
        }
    }

    update() {
        super.update();

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

        // Keep grabbed enemy with snake
        if (this.grabbedEnemy && this.state === 'grabbing') {
            this.grabbedEnemy.x = this.x + this.width / 2 - this.grabbedEnemy.width / 2;
            this.grabbedEnemy.y = this.y - this.grabbedEnemy.height;
            this.grabbedEnemy.vx = 0;
            this.grabbedEnemy.vy = 0;
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
        this.grabTimer = 60;
        this.grabCooldown = 90;

        // Check for nearby enemy
        for (const enemy of game.enemies) {
            if (enemy.alive && this.canGrab(enemy)) {
                this.grabbedEnemy = enemy;
                enemy.grabbed = true;
                break;
            }
        }

        if (!this.grabbedEnemy) {
            this.grabTimer = 20; // Short whiff animation
        }
    }

    canGrab(enemy) {
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 80 && !enemy.grabbed;
    }

    handleGrabState() {
        if (this.grabTimer === 0) {
            this.state = 'idle';
            if (this.grabbedEnemy) {
                // Throw enemy
                this.grabbedEnemy.grabbed = false;
                this.grabbedEnemy.vx = this.facing * 20;
                this.grabbedEnemy.vy = -15;
                this.hitEnemy(this.grabbedEnemy, 35, this.facing * 20, -15);
                this.grabbedEnemy = null;
            }
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
        // Check game over
        const alivePlayers = game.players.filter(p => p.health > 0);
        if (alivePlayers.length === 0) {
            gameOver();
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
        // Draw body segments first
        ctx.fillStyle = this.color;
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const alpha = 1 - (i / this.segments.length) * 0.5;
            ctx.globalAlpha = alpha;
            const size = 30 - i * 2;
            ctx.beginPath();
            ctx.arc(this.segments[i].x, this.segments[i].y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Flashing when invulnerable
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw main body
        ctx.fillStyle = this.color;
        if (this.state === 'rolling') {
            // Draw as coiled disc
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate((Date.now() / 50) % (Math.PI * 2));
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.restore();
        } else {
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }

        // Draw eyes
        ctx.fillStyle = '#fff';
        const eyeX = this.facing > 0 ? this.x + this.width - 15 : this.x + 10;
        ctx.beginPath();
        ctx.arc(eyeX, this.y + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(eyeX + this.facing * 2, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }
}

class Frog extends Entity {
    constructor(x, y, type = 'small') {
        super(x, y, 30, 30);
        this.type = type;
        this.health = type === 'small' ? 20 : type === 'medium' ? 40 : 80;
        this.maxHealth = this.health;
        this.alive = true;
        this.jumpTimer = 0;
        this.jumpCooldown = Math.random() * 60 + 40;
        this.grabbed = false;
        this.color = type === 'small' ? '#4CAF50' : type === 'medium' ? '#2196F3' : '#FF5722';
        this.attackTimer = 0;

        // Type specific properties
        if (type === 'small') {
            this.width = 30;
            this.height = 30;
            this.jumpPower = 8;
        } else if (type === 'medium') {
            this.width = 40;
            this.height = 40;
            this.jumpPower = 12;
        } else {
            this.width = 60;
            this.height = 60;
            this.jumpPower = 10;
        }
    }

    update() {
        if (!this.alive || this.grabbed) return;

        super.update();

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
                target.takeDamage(this.type === 'small' ? 3 : this.type === 'medium' ? 6 : 12);
                this.attackTimer = 0;
            }
        }
    }

    findNearestPlayer() {
        let nearest = null;
        let minDist = Infinity;

        for (const player of game.players) {
            if (player.health <= 0) continue;
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
        game.score += this.type === 'small' ? 10 : this.type === 'medium' ? 25 : 50;
        createDeathEffect(this.x + this.width / 2, this.y + this.height / 2);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, this.width * 0.12, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, this.width * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x + this.width * 0.3, this.y + this.height * 0.3, this.width * 0.06, 0, Math.PI * 2);
        ctx.arc(this.x + this.width * 0.7, this.y + this.height * 0.3, this.width * 0.06, 0, Math.PI * 2);
        ctx.fill();

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
        this.height = 15;
        this.bob = Math.random() * Math.PI * 2;
    }

    update() {
        this.bob += 0.02;
        this.y += Math.sin(this.bob) * 0.3;
    }

    draw(ctx) {
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Flower detail
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 8, 0, Math.PI * 2);
        ctx.fill();
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

// Game functions
function initGame() {
    game.canvas = document.getElementById('gameCanvas');
    game.ctx = game.canvas.getContext('2d');

    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create players
    game.players = [
        new Snake(100, 300, 1, '#4CAF50'),
        new Snake(200, 300, 2, '#FF9800')
    ];

    // Create initial lily pads
    createLilyPads();

    // Setup controls
    setupControls();

    // UI event listeners
    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
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

        // Player 1 controls (WASD + F/G)
        if (e.key.toLowerCase() === 'f') input.player1.roll = true;
        if (e.key.toLowerCase() === 'g') input.player1.grab = true;

        // Player 2 controls (Arrows + K/L)
        if (e.key.toLowerCase() === 'k') input.player2.roll = true;
        if (e.key.toLowerCase() === 'l') input.player2.grab = true;
    });

    window.addEventListener('keyup', (e) => {
        game.keys[e.key.toLowerCase()] = false;

        if (e.key.toLowerCase() === 'f') input.player1.roll = false;
        if (e.key.toLowerCase() === 'g') input.player1.grab = false;
        if (e.key.toLowerCase() === 'k') input.player2.roll = false;
        if (e.key.toLowerCase() === 'l') input.player2.grab = false;
    });

    // Mobile touch controls
    setupMobileControls();
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
            e.preventDefault();
            touchId = e.changedTouches[0].identifier;
            handleJoystickMove(e.changedTouches[0], joystick, stick, playerId);
        });

        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                if (touch.identifier === touchId) {
                    handleJoystickMove(touch, joystick, stick, playerId);
                }
            }
        });

        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            stick.style.transform = 'translate(-50%, -50%)';
            const playerInput = playerId === 1 ? input.player1 : input.player2;
            playerInput.x = 0;
            playerInput.y = 0;
            touchId = null;
        });
    });

    // Action buttons
    actionBtns.forEach(btn => {
        const playerId = parseInt(btn.dataset.player);
        const playerInput = playerId === 1 ? input.player1 : input.player2;

        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (btn.classList.contains('roll-btn')) {
                playerInput.roll = true;
            } else if (btn.classList.contains('grab-btn')) {
                playerInput.grab = true;
            }
        });

        btn.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (btn.classList.contains('roll-btn')) {
                playerInput.roll = false;
            } else if (btn.classList.contains('grab-btn')) {
                playerInput.grab = false;
            }
        });
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
    // Player 1 (WASD)
    input.player1.x = 0;
    input.player1.y = 0;
    if (game.keys['a']) input.player1.x = -1;
    if (game.keys['d']) input.player1.x = 1;
    if (game.keys['w']) input.player1.y = -1;
    if (game.keys['s']) input.player1.y = 1;

    // Player 2 (Arrows)
    input.player2.x = 0;
    input.player2.y = 0;
    if (game.keys['arrowleft']) input.player2.x = -1;
    if (game.keys['arrowright']) input.player2.x = 1;
    if (game.keys['arrowup']) input.player2.y = -1;
    if (game.keys['arrowdown']) input.player2.y = 1;
}

function startGame() {
    setScreen('game');
    game.running = true;
    game.wave = 1;
    game.score = 0;
    game.enemies = [];
    game.particles = [];

    // Reset players
    game.players.forEach((player, i) => {
        player.health = 100;
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
        player.grabbedEnemy = null;
        player.invulnerable = 120;
        player.onGround = false;
        player.width = 50;
        player.height = 40;
    });

    spawnWave();
    gameLoop();
}

function restartGame() {
    startGame();
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
    const count = 3 + game.wave * 2;
    for (let i = 0; i < count; i++) {
        const x = Math.random() * (CONFIG.CANVAS_WIDTH - 100) + 50;
        const y = 100;
        let type = 'small';
        if (game.wave > 2 && Math.random() < 0.3) type = 'medium';
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
}

function gameOver() {
    game.running = false;
    document.getElementById('finalScore').textContent = `Score: ${game.score}`;
    document.getElementById('finalWave').textContent = `Waves Completed: ${game.wave - 1}`;
    setTimeout(() => setScreen('gameover'), 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
