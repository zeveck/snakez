# Changelog

All notable changes to Snake Warriors will be documented in this file.

## [Unreleased] - 2025-10-02

### Added - Initial Game Implementation

#### Core Game Features
- **2-player local co-op** - Snake warriors vs frog invasion
- **Combat System**
  - Roll attack: Snakes coil up and spin into enemies (whip attack)
  - Grab attack: Grapple enemies and throw them
  - Combo system: Chain attacks for score multipliers
  - Invulnerability frames on spawn (120 frames / 2 seconds)

#### Player Mechanics
- **Movement**: WASD (P1) and Arrow keys (P2) for 8-directional movement
- **Physics**: Gravity, friction, water resistance
- **Water mechanics**: Snakes sink slowly in water, can swim but movement is slowed
- **Platforming**: Jump between lily pads to stay above water
- **Snake body segments**: Visual trailing effect with 5 body segments

#### Enemy AI
- **Three frog types**:
  - Small frogs: 20 HP, fast jumps, 3 damage
  - Medium frogs: 40 HP, higher jumps, 6 damage
  - Large bullfrogs: 80 HP, boss-type, 12 damage
- **Intelligent behavior**: Frogs jump toward nearest player and attack on contact
- **Balanced attack timing**: 90 frame cooldown, 35 pixel attack range

#### Environment
- **Water physics**: Water level at y=450, snakes sink and swim
- **Lily pads**: 8 randomly placed floating platforms with bobbing animation
- **Wave system**: Progressively harder waves (3 + wave * 2 enemies)
- **Particle effects**: Splashes, hit effects, death explosions

#### UI/UX
- **Responsive design**: Works on desktop (1200x600) and mobile devices
- **Three screens**: Title screen, game screen, game over screen
- **HUD elements**:
  - Player health bars with real-time updates
  - Combo counters for both players
  - Wave number and enemy count
  - Color-coded player indicators (P1 green, P2 orange)

#### Mobile Support
- **Touch controls**: Virtual joysticks for both players
- **Action buttons**: Dedicated Roll and Grab buttons
- **Responsive layout**: Adapts to portrait and landscape orientations
- **Mobile-specific controls**: Touch-optimized button sizes (70x70px)

#### Visual Design
- **Sky gradient**: Light blue to powder blue
- **Animated water**: Wave effects with sine wave animation
- **Lily pads**: Green platforms with pink flowers
- **Snake sprites**: Colored rectangles with eyes (placeholder for graphics)
- **Frog sprites**: Colored rectangles with eyes (placeholder for graphics)

### Technical Implementation

#### Files Created
- `index.html` - Game structure with responsive screens and mobile controls
- `style.css` - Responsive styling for desktop and mobile viewports
- `game.js` - Complete game engine (900+ lines)
- `GRAPHICS_PROMPTS.md` - 25+ AI image generation prompts for game assets
- `CHANGELOG.md` - This file

#### Game Engine Architecture
- **Entity system**: Base Entity class with Snake and Frog subclasses
- **Game loop**: RequestAnimationFrame-based game loop at 60 FPS
- **Collision detection**: AABB (Axis-Aligned Bounding Box) collision
- **State management**: Global game state object
- **Input handling**: Keyboard and touch input systems

#### Code Organization
```
/workspaces/snakez/
├── index.html          # Main game HTML
├── style.css           # Responsive styles
├── game.js             # Game engine
├── GRAPHICS_PROMPTS.md # Asset generation prompts
└── CHANGELOG.md        # This file
```

### Game Configuration
- Canvas: 1200x600 pixels
- Water level: 450px
- Gravity: 0.5
- Friction: 0.85 (air), 0.5 (water)
- Player speed: 5 (normal), 2.5 (in water)
- Player jump: -12 (air), -6 (water)
- Combo timeout: 2000ms

### Graphics Assets Planned
Created detailed prompts for 25+ game assets:

#### Characters (7 assets)
- Snake P1: idle, extended, rolling
- Snake P2: idle, extended, rolling
- Snake swimming sprite

#### Enemies (6 assets)
- Small frog: idle, jumping
- Medium frog: idle, jumping
- Large bullfrog boss
- Poison dart frog

#### Environment (5 assets)
- Small lily pad
- Large lily pad with flower
- Water texture tile (64x64, seamless)
- Swamp background (1920x400)
- Sky background (1920x300)

#### Effects (5 assets)
- Water splash (4-frame sprite sheet)
- Hit/impact burst
- Combo swirl effect
- Grapple/coil effect
- Death particles (5 variations)

#### UI (4 assets)
- Health bar frame with snake scales
- Health bar fill texture
- Combo star icon
- "SNAKE WARRIORS" logo

### Testing
- ✅ Desktop testing: 1280x720 viewport via Playwright
- ✅ Mobile testing: 375x667 viewport (iPhone size)
- ✅ Gameplay mechanics verified
- ✅ Both players functional
- ✅ Combat system working
- ✅ Wave progression tested
- ✅ Mobile touch controls responsive

### Known Issues
- Graphics are placeholder colored rectangles (waiting for AI-generated assets)
- No sound effects or music
- No game settings or difficulty levels
- Single-device multiplayer only (no online play)

### Future Enhancements
- Replace placeholder graphics with pixel art assets
- Add sound effects and background music
- Implement power-ups and special abilities
- Add more enemy types and boss battles
- Create additional levels/biomes
- Add local storage for high scores
- Implement difficulty settings
- Add game pause functionality
- Create tutorial/how-to-play animations

---

## Development Notes

### Design Philosophy
The game was designed based on the nostalgic memory of a snake vs frog beat 'em up with:
- Side-scrolling view (not isometric)
- Water hazards that slow movement
- Lily pads as platforms
- Multiple attack types using snake coiling mechanics
- 2-player cooperative gameplay

### Inspiration & Design Context

**Original User Description:**
> "Video game where we were like a weird snake worm and you could roll in different ways to do different attacks and you could roll and counter roll to do a combo attack. Was it two player? Yes. Is it like 3D isomorphic or side view? Side view. What kind of enemies was it? Frogs just frogs different kinds of frogs they jump different amounts of something. Oh okay so when you unroll you kind of whipping the frogs or doing different things like that you might be a spring and bounce them off or something. Oh like you could wrap around them and throw them like a grapple kind of like a beat him up where you're a snake against a bunch of frogs."

**Additional Context:**
> "You said there was some water elements so I assume the snake swam the frog swam or maybe the snakes had to jump from frog to frog but you know talking about that a little wouldn't hurt!"

**User's Memory:**
> "I remembered falling in the water as the snek and sinking. I think you could swim but it was better to jump/sliver on the lily pads"

**Development Approach:**
User requested to "Ultrathink" and create a comprehensive graphical asset list with AI prompts, implement carefully for both desktop and mobile, and use Playwright MCP to test throughout development.

### Technology Stack
- HTML5 Canvas for rendering
- Vanilla JavaScript (ES6+)
- CSS3 for responsive layout
- No external libraries or frameworks
- Progressive Web App ready

### Performance Considerations
- Efficient particle system with lifecycle management
- Minimal DOM updates (canvas-based rendering)
- Optimized collision detection (only active entities)
- Request animation frame for smooth 60 FPS
- Mobile-optimized touch event handling

---

*Generated with Claude Code on 2025-10-02*
