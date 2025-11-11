# Snake Style: Single-Player Refactor Plan (Final)

**Version**: 0.5.0 Target
**Objective**: Convert from 2-player co-op to single-player with character selection while preserving gameplay quality, visual layout, and ensuring clean, maintainable code.

---

## 🚀 EXECUTION INSTRUCTIONS (For Claude Executing This Plan)

**If you are a fresh Claude instance executing this plan, start here:**

### Context
You are refactoring the Snake Style browser game from 2-player co-op to single-player with character selection. The codebase consists of:
- `game.js` (2466 lines) - Main game logic
- `index.html` - Page structure and meta tags
- `style.css` - Styling
- Graphics/audio assets (unchanged)

### Critical Requirements
1. **Follow phases sequentially**: Phase 1 → Phase 2 → ... → Phase 8 (see Table of Contents below)
2. **Code comment quality**: Comments must explain BEHAVIOR/INTENT, never "// Removed X" or "// Changed from Y". Plan annotations like `// ← PLAN NOTE:` are FOR YOU to understand changes, NOT for actual code.
3. **Use TodoWrite**: Track progress through the Implementation Checklist (see Table of Contents). Mark items `in_progress` before starting, `completed` after finishing.
4. **Test incrementally**: After each phase, verify game loads without console errors before proceeding.

### Workflow
1. ✅ Read this entire document (use Table of Contents to navigate)
2. Create git branch: `git checkout -b refactor/single-player-v0.5.0`
3. Execute Phase 1, using checklist items from Implementation Checklist section
4. After each phase, test the game (`npm start` runs on port 1990)
5. Complete all 8 phases sequentially
6. Run Playwright MCP verification tests (Phase 8, Section 8.2)
7. Verify all 20 Success Criteria are met (see Success Criteria section)

### Success Definition
All 20 criteria in "Success Criteria" section pass + All Playwright verification tests pass

**Now proceed to the Table of Contents below and begin Phase 1.**

---

## 📋 FOR HUMANS: Handoff Prompt

**To start a fresh Claude session to execute this plan, paste this:**

```
Read and execute the single-player refactor plan in `/workspaces/snakez/1P_REFACTOR_PLAN_FINAL.md`.

Start by reading the "🚀 EXECUTION INSTRUCTIONS" section at the very top.

Confirm you understand, then begin Phase 1.
```

---

## Executive Summary

This plan refactors Snake Style from a 2-player cooperative game to a single-player game with character selection. Players will click to select between the green or orange snake on the title screen, then press Start to begin gameplay with their chosen character. All 2-player logic will be removed, resulting in a cleaner, more maintainable codebase.

**Key Principles:**
1. **Preserve existing title screen layout** - only add subtle selection indicators
2. **Single source of truth** - exactly one `game.player`, one `input` object, one HUD
3. **No orphaned references** - comprehensive cleanup of all 2-player code and documentation
4. **Testable** - include Playwright MCP verification steps
5. **Clean comments** - all code comments must explain behavior/intent, NOT describe changes (avoid "// Removed X" or "// Changed from Y")

**Note on Plan Annotations:** Comments in this plan with arrows like `// ← REMOVE` are annotations for the reader to understand the refactoring steps. These should NOT be included in the actual code.

---

## Table of Contents

**Start Here:**
- [🚀 Execution Instructions](#-execution-instructions-for-claude-executing-this-plan) ← **Read First If Executing**
- [📋 For Humans: Handoff Prompt](#-for-humans-handoff-prompt)

**Implementation Phases:**
1. [Phase 1: Core State & Configuration](#phase-1-core-state--configuration)
2. [Phase 2: Entity & Game Logic Updates](#phase-2-entity--game-logic-updates)
3. [Phase 3: Input System Consolidation](#phase-3-input-system-consolidation)
4. [Phase 4: UI Updates (HUD & Controls)](#phase-4-ui-updates-hud--controls)
5. [Phase 5: Title Screen Selection System](#phase-5-title-screen-selection-system)
6. [Phase 6: Meta Tags & Documentation](#phase-6-meta-tags--documentation)
7. [Phase 7: Code Cleanup & Validation](#phase-7-code-cleanup--validation)
8. [Phase 8: Testing & Verification](#phase-8-testing--verification)

**Reference:**
9. [Implementation Checklist](#implementation-checklist)
10. [Risk Mitigation](#risk-mitigation)
11. [Success Criteria](#success-criteria)
12. [Additional Notes](#additional-notes)

---

## Phase 1: Core State & Configuration

### 1.1 Define Snake Variant Configuration

**Location:** `game.js` - Add after `CONFIG` object (after line 14)

**Add:**
```javascript
// Snake character variants
const SNAKE_VARIANTS = {
    green: {
        id: 'green',
        displayName: 'Green Snake',
        color: '#4CAF50',
        spritePrefix: 'snake_p1',
        playerId: 1,  // Keep for sprite loading compatibility
        hudBorderColor: '#4CAF50',
        size: 66  // Title screen display size
    },
    orange: {
        id: 'orange',
        displayName: 'Orange Snake',
        color: '#FF9800',
        spritePrefix: 'snake_p2',
        playerId: 2,  // Keep for sprite loading compatibility
        hudBorderColor: '#FF9800',
        size: 98  // Title screen display size
    }
};
```

### 1.2 Restructure Game State Object

**Location:** `game.js:381-400`

**Current:**
```javascript
const game = {
    canvas: null,
    ctx: null,
    running: false,
    wave: 1,
    score: 0,
    players: [],  // ← REMOVE
    enemies: [],
    lilyPads: [],
    particles: [],
    keys: {},
    touches: {},
    lastTime: 0,
    screen: 'title',
    defeatedFrogs: [],
    titleSnakes: {
        left: { y: 0, vy: 0, jumping: false },
        right: { y: 0, vy: 0, jumping: false }
    },
    singlePlayer: false,  // ← REMOVE
    activePlayer: null,   // ← REMOVE
    isMobile: false,
};
```

**New:**
```javascript
const game = {
    canvas: null,
    ctx: null,
    running: false,
    wave: 1,
    score: 0,
    player: null,  // ← PLAN NOTE: Single player object replaces players array
    enemies: [],
    lilyPads: [],
    particles: [],
    keys: {},
    touches: {},
    lastTime: 0,
    screen: 'title',
    defeatedFrogs: [],
    titleSnakes: {
        left: { y: 0, vy: 0, jumping: false, selected: true },  // ← PLAN NOTE: Add selected flag
        right: { y: 0, vy: 0, jumping: false, selected: false }
    },
    selectedSnakeId: 'green',  // ← PLAN NOTE: Track which snake is selected ('green' or 'orange')
    isMobile: false,
};
```

### 1.3 Simplify Input Object

**Location:** `game.js:402-406`

**Current:**
```javascript
const input = {
    player1: { x: 0, y: 0, roll: false, whip: false },
    player2: { x: 0, y: 0, roll: false, whip: false },
};
```

**New:**
```javascript
const input = {
    x: 0,
    y: 0,
    roll: false,
    whip: false
};
```

---

## Phase 2: Entity & Game Logic Updates

### 2.1 Update Snake Constructor

**Location:** `game.js:492-512`

**Current:**
```javascript
class Snake extends Entity {
    constructor(x, y, playerId, color) {
        super(x, y, 50, 40);
        this.playerId = playerId;
        this.color = color;
        // ...
    }
}
```

**New:**
```javascript
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
        this.segments = [];
        this.droppingThrough = false;
        this.groundedFrames = 0;
        this.initSegments();
    }
}
```

### 2.2 Update Snake.update() Input Reading

**Location:** `game.js:521-572` (find the playerInput line around line 549)

**Current:**
```javascript
const playerInput = this.playerId === 1 ? input.player1 : input.player2;
```

**New:**
```javascript
const playerInput = input;
```

### 2.3 Simplify Snake.die()

**Location:** `game.js:695-711`

**Current:**
```javascript
die() {
    this.dead = true;
    createPlayerDeathEffect(this.x + this.width / 2, this.y + this.height / 2);

    if (game.singlePlayer) {
        gameOver();
    } else {
        const alivePlayers = game.players.filter(p => !p.dead);
        if (alivePlayers.length === 0) {
            gameOver();
        }
    }
}
```

**New:**
```javascript
die() {
    this.dead = true;
    createPlayerDeathEffect(this.x + this.width / 2, this.y + this.height / 2);
    gameOver();
}
```

### 2.4 Update Snake.draw() Sprite Selection

**Location:** `game.js:726-824` (find playerPrefix line)

**Current:**
```javascript
const playerPrefix = this.playerId === 1 ? 'snake_p1' : 'snake_p2';
```

**New:**
```javascript
const playerPrefix = this.variant.spritePrefix;
```

### 2.5 Simplify Frog.findNearestPlayer()

**Location:** `game.js:907-923`

**Current:**
```javascript
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
```

**New:**
```javascript
findNearestPlayer() {
    // Return the player if alive, otherwise null
    if (!game.player || game.player.dead || game.player.health <= 0) {
        return null;
    }
    return game.player;
}
```

### 2.6 Update Game Loop Functions

**Location:** `game.js:2240-2269` (update function)

**Current:**
```javascript
function update() {
    updateKeyboardInput();

    // Update players
    game.players.forEach(player => player.update());

    // Update enemies
    game.enemies.forEach(enemy => enemy.update());
    // ...
}
```

**New:**
```javascript
function update() {
    updateKeyboardInput();

    if (game.player && !game.player.dead) {
        game.player.update();
    }

    game.enemies.forEach(enemy => enemy.update());
    // ... rest unchanged
}
```

**Location:** `game.js:2271-2319` (render function)

**Current:**
```javascript
function render() {
    const ctx = game.ctx;

    // ... background drawing ...

    // Draw players
    game.players.forEach(player => player.draw(ctx));

    // ... rest of rendering ...
}
```

**New:**
```javascript
function render() {
    const ctx = game.ctx;

    // ... background drawing ...

    if (game.player) {
        game.player.draw(ctx);
    }

    // ... rest of rendering ...
}
```

---

## Phase 3: Input System Consolidation

### 3.1 Rewrite Keyboard Event Handlers

**Location:** `game.js:1932-2000` (setupControls function)

**Current:** Complex branching for singlePlayer/activePlayer and separate player1/player2 controls

**New:**
```javascript
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
```

### 3.2 Simplify updateKeyboardInput()

**Location:** `game.js:2077-2110`

**Current:** Complex branching for single player vs 2-player modes

**New:**
```javascript
function updateKeyboardInput() {
    input.x = 0;
    input.y = 0;
    if (game.keys['arrowleft']) input.x = -1;
    if (game.keys['arrowright']) input.x = 1;
    if (game.keys['arrowup']) input.y = -1;
    if (game.keys['arrowdown']) input.y = 1;
}
```

### 3.3 Rewrite Mobile Controls Setup

**Location:** `game.js:2002-2075` (setupMobileControls and handleJoystickMove)

**Current:** Handles two joysticks with playerId logic

**New:**
```javascript
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
```

### 3.4 Remove Obsolete Functions

**Delete entirely:**
- `updateMobileControlsVisibility()` (lines 1526-1541)
- `updateDesktopControlsVisibility()` (lines 1543-1554)

---

## Phase 4: UI Updates (HUD & Controls)

### 4.1 Update HUD HTML

**Location:** `index.html:118-137`

**Current:** Two `.player-hud` divs (p1 and p2)

**New:**
```html
            <div id="hud">
                <div class="player-hud">
                    <div class="player-name" id="player-name">Snake</div>
                    <div class="health-bar">
                        <div id="player-health" class="health-fill"></div>
                    </div>
                    <div class="combo">Combo: <span id="player-combo">0</span></div>
                </div>
                <div class="wave-info">
                    <div id="waveNumber">Wave 1</div>
                    <div id="enemyCount">Frogs: 0</div>
                </div>
            </div>
```

### 4.2 Update HUD JavaScript

**Location:** `game.js:2321-2355`

**Current:** Updates both p1-health and p2-health with visibility toggling

**New:**
```javascript
function updateHUD() {
    if (!game.player) return;

    const healthBar = document.getElementById('player-health');
    if (healthBar) {
        healthBar.style.width = game.player.health + '%';
    }

    const comboDisplay = document.getElementById('player-combo');
    if (comboDisplay) {
        comboDisplay.textContent = game.player.combo;
    }

    const playerName = document.getElementById('player-name');
    if (playerName && game.player.variant) {
        playerName.textContent = game.player.variant.displayName;
    }

    const waveNumber = document.getElementById('waveNumber');
    if (waveNumber) {
        waveNumber.textContent = `Wave ${game.wave}`;
    }

    const enemyCount = document.getElementById('enemyCount');
    if (enemyCount) {
        enemyCount.textContent = `Frogs: ${game.enemies.length}`;
    }
}
```

### 4.3 Update Desktop Controls HTML

**Location:** `index.html:140-153`

**Current:** Two control hint divs (P1 and P2)

**New:**
```html
            <!-- Desktop Controls Reminder -->
            <div id="desktopControls" class="desktop-only">
                <div class="control-hint">
                    <span class="keys">Arrow Keys</span> Move
                    <span class="keys">0</span> Roll
                    <span class="keys">1</span> Whip
                </div>
            </div>
```

### 4.4 Update Mobile Controls HTML

**Location:** `index.html:156-177`

**Current:** Two joysticks and two action button sets

**New:**
```html
            <!-- Mobile Touch Controls -->
            <div id="mobileControls" class="mobile-only">
                <div class="joystick-container" id="joystick1">
                    <div class="joystick-base">
                        <div class="joystick-stick"></div>
                    </div>
                    <div class="joystick-label">Move</div>
                </div>
                <div class="action-buttons" id="actions1">
                    <button class="action-btn roll-btn">Roll</button>
                    <button class="action-btn whip-btn">Whip</button>
                </div>
            </div>
```

### 4.5 Update CSS Styles

**Location:** `style.css`

**Changes needed:**

1. Remove `.player-hud.p2` specific styles
2. Remove `.p1-label` and `.p2-label` styles
3. Update mobile controls layout from 2x2 grid to horizontal flex:

```css
#mobileControls {
    display: none;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 20px;
    gap: 20px;
}

#mobileControls.active {
    display: flex;
}
```

4. Update `.player-hud` to be standalone (remove p1/p2 border variations)

---

## Phase 5: Title Screen Selection System

### 5.1 Add Selection Function

**Location:** `game.js` - Add new function before `startGame()`

**Add:**
```javascript
function selectSnake(snakeId) {
    game.selectedSnakeId = snakeId;
    game.titleSnakes.left.selected = (snakeId === 'green');
    game.titleSnakes.right.selected = (snakeId === 'orange');

    // Persist selection to localStorage (optional feature)
    try {
        localStorage.setItem('snakeStyleSelectedSnake', snakeId);
    } catch (e) {
        // Ignore localStorage errors (e.g., disabled, quota exceeded)
    }

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
```

### 5.2 Update Title Click Handler

**Location:** `game.js:1698-1759` (handleTitleClick function)

**Current:** Clicking snake immediately starts game

**Changes:**
```javascript
// Around line 1740-1744: PLAN NOTE - change from startGame(true, 0) to selectSnake
if (canvasX >= leftHitbox.x && canvasX <= leftHitbox.x + leftHitbox.width &&
    canvasY >= leftHitbox.y && canvasY <= leftHitbox.y + leftHitbox.height) {
    selectSnake('green');
    return;
}

// Around line 1748-1752: PLAN NOTE - change from startGame(true, 1) to selectSnake
if (canvasX >= rightHitbox.x && canvasX <= rightHitbox.x + rightHitbox.width &&
    canvasY >= rightHitbox.y && canvasY <= rightHitbox.y + rightHitbox.height) {
    selectSnake('orange');
    return;
}
```

### 5.3 Add Visual Selection Indicator

**Location:** `game.js:1798-1861` (drawTitleScreen function)

**Add after drawing each snake:**

```javascript
function drawTitleScreen() {
    const ctx = game.titleCtx;

    // ... existing background and snake drawing code ...

    // Draw left snake (around line 1819-1830)
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

        // Selection indicator for green snake
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

    // ... logo drawing ...

    // Draw right snake (around line 1843-1860)
    const rightSprite = game.titleSnakes.right.jumping ?
        assets.get('snake_p2_jumping') : assets.get('snake_p2_idle');
    if (rightSprite && rightSprite.complete) {
        const snakeSize = 98;
        const snakeX = CONFIG.CANVAS_WIDTH - 270;
        const snakeY = 195 + game.titleSnakes.right.y;
        const aspect = rightSprite.width / rightSprite.height;
        const width = snakeSize;
        const height = width / aspect;

        ctx.save();
        ctx.translate(snakeX, snakeY);
        ctx.scale(-1, 1);
        ctx.drawImage(rightSprite, -width/2, -height/2, width, height);
        ctx.restore();

        // Selection indicator for orange snake
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
```

### 5.4 Update Start Button Handler

**Location:** `game.js:1668`

**Current:**
```javascript
startBtn.addEventListener('click', () => startGame(false, null));
```

**New:**
```javascript
startBtn.addEventListener('click', () => {
    // Default to green snake if no selection made
    if (!game.selectedSnakeId) {
        game.selectedSnakeId = 'green';
    }
    startGame();
});
```

### 5.5 Initialize Default Selection

**Location:** `game.js` - in `initGame()` after assets load (around line 1647)

**Add:**
```javascript
// Restore saved selection from localStorage if available
try {
    const savedSelection = localStorage.getItem('snakeStyleSelectedSnake');
    if (savedSelection === 'green' || savedSelection === 'orange') {
        game.selectedSnakeId = savedSelection;
        game.titleSnakes.left.selected = (savedSelection === 'green');
        game.titleSnakes.right.selected = (savedSelection === 'orange');
    }
} catch (e) {
    // localStorage may be disabled or unavailable
}

// Fallback to green snake if no selection set
if (!game.selectedSnakeId) {
    game.selectedSnakeId = 'green';
    game.titleSnakes.left.selected = true;
    game.titleSnakes.right.selected = false;
}

drawTitleScreen();
```

### 5.6 Rewrite startGame()

**Location:** `game.js:2112-2169`

**Current:** Takes singlePlayer and activePlayer parameters, complex initialization

**New:**
```javascript
function startGame() {
    setScreen('game');
    audioManager.hasInteracted = true;
    audioManager.playBackground();
    game.running = true;
    game.wave = 1;
    game.score = 0;
    game.enemies = [];
    game.particles = [];
    game.defeatedFrogs = [];

    // Use selected variant, defaulting to green if somehow not set
    const variantId = game.selectedSnakeId || 'green';
    const variant = SNAKE_VARIANTS[variantId];

    game.player = new Snake(100, 300, variant);

    // Initialize player to starting state
    game.player.health = 100;
    game.player.dead = false;
    game.player.x = 100;
    game.player.y = 300;
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
```

### 5.7 Update Instructions Text

**Location:** `index.html:89-111`

**Current:**
```html
<p>Click Start for 2-player co-op, or click a snake for solo play</p>
<h3>Desktop Controls</h3>
<p><strong>Player 1:</strong> Arrow keys to move | 0 to roll | 1 to whip</p>
<p><strong>Player 2:</strong> WASD to move | F to roll | G to whip</p>
```

**New:**
```html
<p>Click a snake to select your character, then press Start!</p>
<h3>Desktop Controls</h3>
<p>Arrow keys to move | 0 to roll | 1 to whip</p>
```

Keep mobile section unchanged:
```html
<div class="controls-section mobile-only">
    <h3>Mobile Controls</h3>
    <p>Touch joysticks appear on screen</p>
    <p>Tap attack buttons to roll and whip!</p>
</div>
```

### 5.8 Update restartGame() and returnToTitle()

**Location:** `game.js:2171-2200`

**restartGame() - no changes needed** (already calls startGame with no params after refactor)

**returnToTitle():**
```javascript
function returnToTitle() {
    if (frogParade) {
        frogParade.stop();
    }
    game.running = false;
    audioManager.stopAll();

    // Selection persists across game sessions
    // Optionally reset to default by uncommenting:
    // game.selectedSnakeId = 'green';
    // game.titleSnakes.left.selected = true;
    // game.titleSnakes.right.selected = false;

    setScreen('title');
    drawTitleScreen();
    audioManager.playTitle();
}
```

---

## Phase 6: Meta Tags & Documentation

### 6.1 Update HTML Meta Tags

**Location:** `index.html:1-65`

**Changes:**

**Line 10 - Description:**
```html
<meta name="description" content="Snake Style - A retro beat 'em up arcade game. Choose your serpent warrior and battle waves of hostile frogs in a swamp adventure. Features pixel art graphics, combo attacks, and character selection.">
```

**Line 11 - Keywords:**
```html
<meta name="keywords" content="snake game, beat em up, retro game, pixel art game, arcade game, browser game, snake vs frogs, swamp game, character selection, single player">
```

**Line 18 - OG Title:**
```html
<meta property="og:title" content="Snake Style - Retro Beat 'Em Up Arcade Game">
```

**Line 19 - OG Description:**
```html
<meta property="og:description" content="Choose your serpent warrior in this retro pixel art beat 'em up! Battle waves of frogs with roll attacks, whip combos, and swamp platforming.">
```

**Line 28 - Twitter Title:**
```html
<meta property="twitter:title" content="Snake Style - Retro Beat 'Em Up Arcade Game">
```

**Line 29 - Twitter Description:**
```html
<meta property="twitter:description" content="Choose your serpent warrior and battle waves of frogs in this retro arcade adventure.">
```

**Line 32 - Page Title:**
```html
<title>Snake Style - Retro Beat 'Em Up Arcade Game</title>
```

**Lines 44-47 - JSON-LD Structured Data:**
```json
"description": "A retro beat 'em up arcade game where you choose your serpent warrior to battle waves of hostile frogs",
"numberOfPlayers": "1",
"playMode": "SinglePlayer",
```

### 6.2 Update README.md

**Location:** `/workspaces/snakez/README.md`

**Line 3:**
```markdown
**Version 0.5.0** - A swamp-based beat 'em up arcade game with character selection
```

**Line 5:**
```markdown
Choose your serpent warrior and defend the swamp from endless waves of hostile frogs!
```

**Lines 11-21 - Core Gameplay:**
```markdown
### Core Gameplay
- **Character Selection** - Choose between the green or orange snake warrior
- **Wave-Based Combat** - Survive increasingly difficult frog invasions
- **Combo System** - Chain attacks together for massive score multipliers
- **Multiple Enemy Types** - Small, medium, and boss-sized frogs with unique behaviors
- **Dynamic Water Mechanics** - Jump between lily pads or swim through the swamp
- **Retro Pixel Art** - Beautiful hand-crafted sprites and animations
- **Audio System** - Dynamic music system with title and gameplay tracks
- **Volume Controls** - Customizable overall, music, and SFX volume levels
```

**Lines 37-52 - Controls:**
```markdown
## 🕹️ Controls

### Desktop
- **Movement**: Arrow Keys `↑` `←` `↓` `→`
- **Roll Attack**: `0` (zero key)
- **Whip Attack**: `1` (one key)

### Mobile Touch Controls
- **Virtual Joystick** - On-screen joystick for movement
- **Action Buttons** - Touch-friendly buttons for attacks

## 🎯 How to Play

1. **Select Your Snake** - Click on the green or orange snake on the title screen
2. **Start the Game** - Click "Start" or press Enter
3. **Audio Controls** - Click the speaker icon (lower left) to toggle audio; right-click for volume controls
```

**Lines 84-87 - Health System:**
```markdown
### Health System
- Player starts with 100 HP
- Invulnerability frames after taking damage
- Visual health bar shows current HP
- Game over when player is defeated
```

### 6.3 Update package.json

**Location:** `/workspaces/snakez/package.json`

**Changes:**
```json
{
  "name": "snake-style",
  "version": "0.5.0",
  "description": "Snake Style - A swamp-based beat 'em up game featuring serpent warriors battling waves of frogs with character selection",
  "scripts": {
    "start": "npx http-server -p 1990 -a 0.0.0.0"
  },
  "keywords": ["game", "snake", "beat-em-up", "single-player", "pixel-art", "arcade", "character-selection"],
  "author": "",
  "license": "MIT"
}
```

### 6.4 Update CHANGELOG.md

**Location:** `/workspaces/snakez/CHANGELOG.md`

**Add at top:**
```markdown
## [0.5.0] - 2025-11-10

### Changed - Major Refactor to Single Player
- Converted game from 2-player co-op to single-player with character selection
- Title screen now allows selecting between green and orange snake before starting
- Removed all 2-player specific code, controls, and UI elements
- Simplified codebase by removing dual-player state management

### Added
- Character selection system with visual indicators on title screen
- Snake variant configuration system for data-driven character properties
- Selection persistence via localStorage (optional)
- Selected snake name displayed in HUD

### Removed
- 2-player cooperative mode
- Player 2 controls (WASD, F, G keys)
- Player 2 mobile joystick and action buttons
- Player 2 HUD elements
- `singlePlayer` and `activePlayer` state flags
- Dual input system (`input.player1` and `input.player2`)
- Mobile and desktop control visibility toggle functions

### Updated
- Meta tags and SEO content to reflect single-player gameplay
- README.md with single-player instructions and character selection info
- All documentation references from "2-player" to "single-player"
- Game loop to handle single player object instead of players array
- Enemy AI to target single player directly
- Input system consolidated to single input object
```

---

## Phase 7: Code Cleanup & Validation

### 7.1 Global Search & Replace

**Execute these searches in game.js and verify all instances are updated:**

1. **Find:** `game.players[0]` **→ Replace with:** `game.player`
2. **Find:** `game.players[1]` **→ Delete or handle** (should be removed)
3. **Find:** `game.players.forEach` **→ Replace with:** single player logic
4. **Find:** `game.players.filter` **→ Replace with:** single player check
5. **Find:** `game.players.find` **→ Replace with:** `game.player` reference
6. **Find:** `game.singlePlayer` **→ Delete** (no longer needed)
7. **Find:** `game.activePlayer` **→ Delete** (no longer needed)
8. **Find:** `input.player1` **→ Replace with:** `input`
9. **Find:** `input.player2` **→ Delete** (no longer needed)

### 7.2 Search Documentation for 2-Player References

**Run these searches across all files:**

```bash
# In terminal/bash:
grep -r "2-player" --exclude-dir=node_modules
grep -r "2 player" --exclude-dir=node_modules
grep -r "co-op" --exclude-dir=node_modules
grep -r "coop" --exclude-dir=node_modules
grep -r "Player 1" --exclude-dir=node_modules
grep -r "Player 2" --exclude-dir=node_modules
grep -r "P1" --exclude-dir=node_modules | grep -v "P1_PLAN"
grep -r "P2" --exclude-dir=node_modules
```

**Expected results:**
- Should only find references in CHANGELOG.md under old versions (acceptable)
- Should NOT find in current code, HTML, CSS, README, or meta tags

### 7.3 Verify No Console Errors

After all changes, check that:
1. No JavaScript errors in browser console
2. All sprites load correctly
3. No missing DOM element errors
4. No undefined variable references

### 7.4 Update Version Display

**Location:** Search for version display in HTML

If found (e.g., `<div id="version">v0.4.13</div>`), update to:
```html
<div id="version">v0.5.0</div>
```

---

## Phase 8: Testing & Verification

### 8.1 Manual Testing Checklist

**Title Screen:**
- [ ] Default selection shows green snake highlighted on load
- [ ] Clicking green snake shows selection indicator and makes it jump
- [ ] Clicking orange snake switches selection and makes it jump
- [ ] Selection indicator clearly visible (glow/outline/text)
- [ ] Click elsewhere on canvas still makes both snakes jump
- [ ] Start button begins game with selected snake
- [ ] Enter key begins game with selected snake
- [ ] Selection persists across multiple clicks

**Gameplay - Green Snake:**
- [ ] Game starts with green snake character
- [ ] Green snake sprites display correctly (idle, jumping, rolling, extended, swimming)
- [ ] Movement controls work (arrow keys on desktop)
- [ ] Roll attack works (0 key / Roll button)
- [ ] Whip attack works (1 key / Whip button)
- [ ] Health bar updates correctly
- [ ] Combo counter updates correctly
- [ ] HUD shows "Green Snake" (or correct name)
- [ ] Death triggers immediate game over
- [ ] No console errors

**Gameplay - Orange Snake:**
- [ ] Game starts with orange snake character
- [ ] Orange snake sprites display correctly (all states)
- [ ] Movement controls work
- [ ] Roll attack works
- [ ] Whip attack works
- [ ] Health bar updates correctly
- [ ] Combo counter updates correctly
- [ ] HUD shows "Orange Snake" (or correct name)
- [ ] Death triggers immediate game over
- [ ] No console errors

**Desktop Controls:**
- [ ] Arrow keys control movement
- [ ] 0 key triggers roll
- [ ] 1 key triggers whip
- [ ] Delete key instantly kills player (dev shortcut)
- [ ] Control hints show only one set of controls
- [ ] No P2 controls visible
- [ ] Control hints accurate

**Mobile Controls (Test on mobile device or responsive mode):**
- [ ] Only one joystick visible
- [ ] Only one set of action buttons visible
- [ ] Joystick controls movement
- [ ] Roll button works
- [ ] Whip button works
- [ ] Touch targets appropriate size
- [ ] No P2 controls visible
- [ ] Layout looks good in portrait
- [ ] Layout looks good in landscape

**Enemy AI:**
- [ ] Frogs target player correctly
- [ ] Frogs jump toward player
- [ ] Frogs attack player
- [ ] No targeting errors
- [ ] No null reference errors

**Game Flow:**
- [ ] Wave progression works
- [ ] Score increases correctly
- [ ] Combo system works
- [ ] Game over screen displays correctly
- [ ] Restart button works (preserves selection)
- [ ] Return to Title works
- [ ] Selection state preserved/reset appropriately

**Audio:**
- [ ] Title music plays
- [ ] Background music plays during gameplay
- [ ] Music toggle works
- [ ] Volume controls work
- [ ] Audio persists correctly

### 8.2 Playwright MCP Verification

**Use Playwright MCP tools to verify the following:**

#### Test 1: Title Screen Selection
```javascript
// Navigate to the game
await mcp__playwright__browser_navigate({ url: "http://localhost:1990" });
await mcp__playwright__browser_snapshot({});

// Verify title screen loads
// Check that snakes are visible and one is selected by default

// Click on left snake (green)
await mcp__playwright__browser_click({
    element: "green snake on title screen",
    ref: "[aria-label='Select green snake']"  // or canvas click coordinates
});

// Take snapshot to verify selection indicator
await mcp__playwright__browser_snapshot({});

// Click on right snake (orange)
await mcp__playwright__browser_click({
    element: "orange snake on title screen",
    ref: "[aria-label='Select orange snake']"
});

// Verify selection changed
await mcp__playwright__browser_snapshot({});
```

#### Test 2: Start Game with Green Snake
```javascript
// Select green snake
await mcp__playwright__browser_click({
    element: "green snake",
    ref: "canvas-left-snake-hitbox"
});

// Click Start button
await mcp__playwright__browser_click({
    element: "Start button",
    ref: "#startBtn"
});

await mcp__playwright__browser_wait_for({ time: 2 });

// Take screenshot of gameplay
await mcp__playwright__browser_take_screenshot({
    filename: "gameplay-green-snake.png"
});

// Verify HUD shows correct snake
await mcp__playwright__browser_snapshot({});

// Check console for errors
const consoleMessages = await mcp__playwright__browser_console_messages({ onlyErrors: true });
// Verify no console errors
```

#### Test 3: Start Game with Orange Snake
```javascript
// Return to title (if needed)
await mcp__playwright__browser_navigate({ url: "http://localhost:1990" });

// Select orange snake
await mcp__playwright__browser_click({
    element: "orange snake",
    ref: "canvas-right-snake-hitbox"
});

// Press Enter key to start
await mcp__playwright__browser_press_key({ key: "Enter" });

await mcp__playwright__browser_wait_for({ time: 2 });

// Take screenshot
await mcp__playwright__browser_take_screenshot({
    filename: "gameplay-orange-snake.png"
});

// Verify correct sprite rendering
await mcp__playwright__browser_snapshot({});
```

#### Test 4: Mobile Layout
```javascript
// Resize to mobile dimensions
await mcp__playwright__browser_resize({ width: 375, height: 667 });

await mcp__playwright__browser_navigate({ url: "http://localhost:1990" });

// Verify only one joystick visible
await mcp__playwright__browser_snapshot({});

// Take screenshot
await mcp__playwright__browser_take_screenshot({
    filename: "mobile-title-screen.png"
});

// Start game and verify mobile controls
await mcp__playwright__browser_click({
    element: "Start button",
    ref: "#startBtn"
});

await mcp__playwright__browser_wait_for({ time: 2 });

await mcp__playwright__browser_take_screenshot({
    filename: "mobile-gameplay.png"
});

// Verify single joystick and action buttons
await mcp__playwright__browser_snapshot({});
```

#### Test 5: Verify No 2-Player UI Elements
```javascript
await mcp__playwright__browser_navigate({ url: "http://localhost:1990" });

// Evaluate page content
const check = await mcp__playwright__browser_evaluate({
    function: `() => {
        const p2Hud = document.querySelector('.player-hud.p2');
        const p2Controls = document.getElementById('p2Controls');
        const joystick2 = document.getElementById('joystick2');
        const actions2 = document.getElementById('actions2');

        return {
            p2HudExists: !!p2Hud,
            p2ControlsExists: !!p2Controls,
            joystick2Exists: !!joystick2,
            actions2Exists: !!actions2,
            bodyText: document.body.innerText
        };
    }`
});

// Verify all P2 elements are removed
// Verify no "Player 2" or "2-player" text in visible content
```

#### Test 6: Game Over Flow
```javascript
await mcp__playwright__browser_navigate({ url: "http://localhost:1990" });

// Start game
await mcp__playwright__browser_click({
    element: "Start button",
    ref: "#startBtn"
});

await mcp__playwright__browser_wait_for({ time: 2 });

// Trigger instant death (Delete key)
await mcp__playwright__browser_press_key({ key: "Delete" });

await mcp__playwright__browser_wait_for({ time: 1 });

// Verify game over screen
await mcp__playwright__browser_snapshot({});

await mcp__playwright__browser_take_screenshot({
    filename: "game-over-screen.png"
});

// Click Restart
await mcp__playwright__browser_click({
    element: "Restart button",
    ref: "#restartBtn"  // or appropriate selector
});

await mcp__playwright__browser_wait_for({ time: 2 });

// Verify game restarted with same snake
await mcp__playwright__browser_snapshot({});
```

#### Test 7: Shared Game Over URL
```javascript
// Navigate directly to a shared game over URL
await mcp__playwright__browser_navigate({
    url: "http://localhost:1990/#score=1000&wave=5&frogs=50,25,10"
});

await mcp__playwright__browser_wait_for({ time: 2 });

// Verify game over screen shows
await mcp__playwright__browser_snapshot({});

// Click "Play Again" or return to title
// Verify selection defaults to green snake
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Backup current codebase
- [ ] Create new git branch for refactor
- [ ] Run game locally to verify current state

### Phase 1: Core State
- [ ] Add SNAKE_VARIANTS configuration
- [ ] Update game state object (remove players array, add player)
- [ ] Update game state (remove singlePlayer, activePlayer)
- [ ] Add selectedSnakeId to game state
- [ ] Update titleSnakes with selected flags
- [ ] Simplify input object
- [ ] Test: Game loads without errors

### Phase 2: Entity Updates
- [ ] Update Snake constructor to accept variant
- [ ] Update Snake.update() input reading
- [ ] Update Snake.die() - remove multiplayer logic
- [ ] Update Snake.draw() sprite prefix
- [ ] Simplify Frog.findNearestPlayer()
- [ ] Update game loop update() function
- [ ] Update game loop render() function
- [ ] Test: No console errors on load

### Phase 3: Input System
- [ ] Rewrite keyboard event handlers
- [ ] Simplify updateKeyboardInput()
- [ ] Rewrite setupMobileControls()
- [ ] Update handleJoystickMove()
- [ ] Remove updateMobileControlsVisibility()
- [ ] Remove updateDesktopControlsVisibility()
- [ ] Test: Keyboard controls work

### Phase 4: UI Updates
- [ ] Update HUD HTML (remove P2 elements)
- [ ] Update HUD JavaScript function
- [ ] Update desktop controls HTML
- [ ] Update mobile controls HTML
- [ ] Update CSS (remove P2 styles)
- [ ] Update mobile controls CSS layout
- [ ] Test: UI looks correct, single HUD shows

### Phase 5: Title Screen
- [ ] Add selectSnake() function
- [ ] Update title click handlers
- [ ] Add visual selection indicators
- [ ] Update Start button handler
- [ ] Initialize default selection
- [ ] Rewrite startGame() function
- [ ] Update instructions text
- [ ] Update restartGame() (if needed)
- [ ] Update returnToTitle()
- [ ] Test: Selection system works

### Phase 6: Meta & Docs
- [ ] Update HTML meta tags
- [ ] Update README.md
- [ ] Update package.json
- [ ] Update CHANGELOG.md
- [ ] Update version display in HTML
- [ ] Test: Documentation accurate

### Phase 7: Cleanup
- [ ] Run global search/replace for game.players
- [ ] Search/remove singlePlayer references
- [ ] Search/remove activePlayer references
- [ ] Search/remove input.player1/player2
- [ ] Search documentation for 2-player terms
- [ ] Remove commented-out code
- [ ] Update code comments
- [ ] Test: No console errors

### Phase 8: Testing
- [ ] Complete manual testing checklist
- [ ] Run Playwright verification tests
- [ ] Test on desktop (Chrome, Firefox, Safari)
- [ ] Test on mobile (iOS, Android)
- [ ] Test different screen sizes
- [ ] Verify no console errors
- [ ] Verify all sprites load
- [ ] Verify audio works
- [ ] Test game flow end-to-end

### Post-Implementation
- [ ] Git commit with detailed message
- [ ] Create pull request
- [ ] Deploy to staging
- [ ] Final QA pass
- [ ] Deploy to production

---

## Risk Mitigation

### Risk 1: Missed Array References
**Risk:** Code still references `game.players[0]` or `game.players[1]` somewhere

**Mitigation:**
- Use comprehensive find/replace
- Search for `game.players` and verify each instance
- Test thoroughly after changes
- Use browser dev tools to catch runtime errors

### Risk 2: Sprite Loading Issues
**Risk:** Snake sprites don't load correctly after changing from playerId to variant

**Mitigation:**
- Maintain `playerId` field in variant config for sprite compatibility
- Test both green and orange snake sprite rendering
- Verify all sprite states (idle, jumping, rolling, extended, swimming)

### Risk 3: Input System Breaks
**Risk:** Input handling has edge cases not covered by refactor

**Mitigation:**
- Test keyboard controls thoroughly
- Test mobile touch controls on actual device
- Verify joystick and button responsiveness
- Test rapid input changes

### Risk 4: Enemy AI Targeting Errors
**Risk:** Enemies fail to target player or throw null reference errors

**Mitigation:**
- Add null checks in findNearestPlayer()
- Test enemy behavior immediately after refactor
- Verify enemies jump toward and attack player
- Check for console errors during gameplay

### Risk 5: Selection State Persistence
**Risk:** Selection state doesn't persist correctly or causes bugs

**Mitigation:**
- Wrap localStorage in try-catch
- Always have fallback default selection
- Test selection across page reloads
- Test with localStorage disabled

### Risk 6: Mobile Layout Issues
**Risk:** Mobile controls don't display correctly after removing P2 elements

**Mitigation:**
- Test on actual mobile devices
- Use browser responsive mode for testing
- Verify CSS grid/flex changes
- Test portrait and landscape orientations

### Risk 7: Shared Game Over URLs Break
**Risk:** Direct links to game over screen don't work correctly

**Mitigation:**
- Test shared URL flow specifically
- Ensure default selection works without title screen visit
- Verify game can restart from shared URL state

### Risk 8: Incomplete Documentation Updates
**Risk:** Documentation still references 2-player mode

**Mitigation:**
- Run comprehensive grep searches
- Check all markdown files
- Verify meta tags in browser dev tools
- Review README, CHANGELOG, and package.json

---

## Success Criteria

The refactor is complete and successful when:

1. ✅ Game loads without console errors
2. ✅ Title screen allows snake selection with clear visual feedback
3. ✅ Start button and Enter key launch game with selected snake
4. ✅ Both green and orange snakes playable with correct sprites
5. ✅ Single player HUD displays correctly
6. ✅ Single set of controls (desktop and mobile)
7. ✅ Enemy AI targets player correctly
8. ✅ Game over occurs immediately on player death
9. ✅ Restart and return to title work correctly
10. ✅ No references to `game.players` array in code
11. ✅ No references to `singlePlayer` or `activePlayer` in code
12. ✅ No references to `input.player1` or `input.player2` in code
13. ✅ No P2 HUD elements visible
14. ✅ No P2 mobile controls visible
15. ✅ No P2 desktop control hints visible
16. ✅ Documentation updated (README, CHANGELOG, package.json)
17. ✅ Meta tags updated to single-player
18. ✅ No "2-player" or "co-op" in visible UI or current docs
19. ✅ All Playwright verification tests pass
20. ✅ Mobile and desktop both work correctly

---

## Additional Notes

### Code Line Numbers
Line numbers referenced in this plan are approximate based on the current codebase (game.js has 2466 lines). They may shift as edits are made. Use code context and function names to locate correct sections.

### Optional Enhancements
These are not required for the refactor but can be added later:

1. **Character Stats Variation**
   - Give different stats to each snake (speed, health, damage)
   - Display stats on title screen during selection

2. **Unlockable Characters**
   - Start with green snake unlocked
   - Unlock orange after reaching certain wave/score

3. **Smooth Transitions**
   - Add fade-in/fade-out when starting game
   - Animate selection indicator
   - Bounce selected snake continuously

4. **Sound Effects**
   - Add sound when selecting snake
   - Add sound when confirming selection (Start button)
   - Different voice/sound per character

### Backward Compatibility
This refactor is not backward compatible with:
- Existing 2-player gameplay
- WASD/F/G controls
- Dual HUD displays
- P2 mobile controls

Save states or localStorage from previous versions should not conflict as we're using new keys.

---

## Appendix: File Modification Summary

### Files with Extensive Changes
- `game.js` (2466 lines)
  - ~400 lines modified
  - ~60 lines removed
  - ~80 lines added
  - Net: ~340 lines after cleanup

### Files with Moderate Changes
- `index.html`
  - Meta tags section (lines 1-65)
  - HUD section (lines 118-137)
  - Controls sections (lines 140-177)
  - Instructions (lines 89-111)

- `style.css`
  - Remove P2 HUD styles
  - Update mobile controls layout
  - Remove P2 control hint styles

- `README.md`
  - Update version, description
  - Update controls section
  - Update how to play section

### Files with Minor Changes
- `package.json` - version, description, keywords
- `CHANGELOG.md` - add 0.5.0 entry

### Files Not Modified
- All graphics assets (kept for character selection)
- Audio assets
- Other static assets

---

## Version History

- **Draft 1**: Initial comprehensive plan created from analysis of 1P_PLAN.md, SINGLE_PLAYER_REFACTOR.md, and CODEX_FINAL_1P_REFACTOR_PLAN.md
- **Draft 2**: Added detailed Playwright verification steps
- **Final**: This version - ready for implementation

---

**End of Plan**

This plan provides everything needed for a successful refactor. Follow phases in order, use the checklist to track progress, and verify with Playwright tests. Good luck! 🐍
