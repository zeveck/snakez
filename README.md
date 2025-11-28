# Snake Style 🐍⚔️

Choose your serpent warrior and defend the swamp from endless waves of hostile frogs!

<p align="center">
  <img src="graphics/logo_title.png" alt="Snake Style" width="600">
</p>

**Version 0.6.4**

## 🎮 Game Features

### Core Gameplay
- **Character Selection** - Choose between Jade or Blaze
- **Wave-Based Combat** - Survive increasingly difficult frog invasions
- **Combo System** - Chain attacks together for massive score multipliers
- **Multiple Enemy Types** - Small, medium, poison dart, and boss frogs with unique behaviors
- **Dynamic Water Mechanics** - Jump between lily pads or swim through the swamp
- **Retro Pixel Art** - Beautiful hand-crafted sprites and animations
- **Audio System** - Dynamic music system with title and gameplay tracks
- **Volume Controls** - Customizable overall, music, and SFX volume levels

### Combat Moves
Each snake warrior has two powerful attacks:

- **🌀 Roll Attack (0)** - Spin into a defensive ball and crash through enemies
  - Deals 25 damage
  - Grants temporary invulnerability
  - Perfect for escaping tight situations

- **👅 Tongue Whip (1)** - Lash out with your tongue to strike enemies
  - Instant ranged attack (100px reach)
  - Deals 30 damage with knockback
  - Strike enemies in the direction you're facing
  - Great for keeping enemies at bay

## 🕹️ Controls

### Desktop
- **Movement**: Arrow Keys `↑` `←` `↓` `→` or `WASD`
- **Roll Attack**: `0` (zero key)
- **Whip Attack**: `1` (one key)
- **Pause**: `P` key
- **Drop Through Lily Pad**: `↓` or `S` (while on a pad)

### Mobile Touch Controls
- **Virtual Joystick** - On-screen joystick for movement
- **Action Buttons** - Touch-friendly buttons for attacks

## 🎯 How to Play

1. **Select Your Snake** - Click on Jade or Blaze on the title screen
2. **Start the Game** - Click "Start" or press Enter
3. **Audio Controls** - Click the speaker icon (lower left) to toggle audio; right-click for volume controls
4. **Survive the Waves** - Defeat all frogs to progress to the next wave
5. **Build Combos** - Attack enemies in quick succession to multiply your score
6. **Use the Environment** - Jump on lily pads to avoid the water and gain tactical advantage
7. **Watch Your Health** - Avoid frog attacks and use invulnerability frames wisely

## 🏆 Scoring System

- **Small Frog**: 10 points base
- **Medium Frog**: 25 points base
- **Poison Dart Frog**: 35 points base (appears wave 4+)
- **Large Boss Frog**: 50 points base
- **Combo Multiplier**: Each consecutive hit multiplies damage dealt into score
- **Wave Bonus**: Points increase with each wave survived

## 🌊 Game Mechanics

### Water Physics
- **Swimming**: Slower movement and reduced jump height in water
- **Lily Pads**: Platforms that gently bob on the water surface
- **Water Jumping**: Reduced jump power when submerged

### Enemy AI
- **Target Seeking**: Frogs jump toward the player
- **Attack Pattern**: Different frog types have varying jump speeds and damage
- **Poison Dart Frogs**: Fast and deadly, appear in random colors from wave 4+
- **Boss Behavior**: Large frogs are tankier but slower

### Health System
- Player starts with 100 HP
- Invulnerability frames after taking damage
- Visual health bar shows current HP
- Game over when player is defeated

## 🚀 Running the Game

### Local Development
```bash
npm start
```
Then open your browser to `http://localhost:1990`

### Alternative Method
```bash
npx http-server -p 8080
```
Or simply open `index.html` in a modern web browser.

## 📁 Project Structure

```
snakez/
├── index.html          # Main game page
├── config.js          # Game configuration constants
├── game.js            # Game logic and mechanics
├── style.css          # UI styling
├── graphics/          # All game sprites and images
│   ├── logo_title.png
│   ├── snake_p1_*.png     # Jade snake sprites
│   ├── snake_p2_*.png     # Blaze snake sprites
│   ├── frog_*.png         # Enemy sprites
│   ├── lilypad_*.png      # Platform sprites
│   ├── effect_*.png       # Visual effects
│   └── ui_*.png           # UI elements
└── package.json       # Project metadata
```

## 🎨 Graphics

All pixel art graphics are located in the `/graphics` folder:

- **23 unique sprites** covering all game elements
- **Multiple animation states** for characters
- **Visual effects** for impacts, combos, and water splashes
- **Custom UI elements** for health bars and combo indicators

## 🔧 Technical Details

- **Pure JavaScript** - No frameworks or dependencies
- **HTML5 Canvas** - Hardware-accelerated 2D rendering
- **Responsive Design** - Works on desktop and mobile devices
- **60 FPS Target** - Smooth gameplay with requestAnimationFrame
- **Asset Preloading** - All graphics loaded before game start

## 📝 Version History

### v0.6.4 (Current)
- 📐 Increased Jade's jumping sprite size for better visibility
- 📝 Documentation updates: fixed stale controls, added poison dart frogs, WASD controls, config.js

### v0.6.3
- 🎯 Targeted water jumps: snakes now arc precisely onto lily pads when well-aligned underneath
- 🐸 Rebalanced wave difficulty with configurable frog counts (5 → 100 → 1000+ per wave)
- 🪷 Improved lily pad landing detection for more reliable platforming

### v0.6.2
- 🏷️ Title screen now shows snake names (JADE/BLAZE) instead of generic "SELECTED" text

### v0.6.1
- 🎯 Improved game over summary screen readability
- 📊 Added "N Frogs Defeated" total count in summary
- ✨ Added animated counter effect - stats count up from 0 when screen appears

### v0.6.0
- 🐛 Fixed wave completion bug that caused wave counter to increment rapidly during inter-wave delay
- 🎮 Added `?wave=NUM` URL parameter to start at a specific wave
- 🌊 Added `?multiwave=NUM` URL parameter for multi-wave challenge mode (all waves spawn at once)
- 📊 Waves completed now calculated relative to starting wave

### v0.5.10
- Added /commitcheckpoint and /revversion Claude commands

### v0.5.9
- 🔧 Fixed pause/unpause input mode consistency on desktop
- 🎮 Desktop: pause overlay now requires P key to unpause (prevents accidental unpause from clicks)
- 📱 Mobile: unchanged, tap overlay to unpause as expected

### v0.5.8
- ⏸️ Improved pause overlay transparency for better game visibility

### v0.5.7
- ⏸️ Added pause functionality with P key or pause button
- 🐍 Interactive snake portrait on Game Over screen responds to controls
- 🎮 Portrait animations for roll (0), whip (1), jump (UP), and swim (DOWN)

### v0.5.6
- 🌊 Made lily pads randomly placed with snake centered at game start

### v0.5.5
- ▶️ Fixed Play button on Share screen to work properly with click and Enter

### v0.4.13
- 📤 Added shareable Game Over screen URLs - share your results with friends!
- 🔗 URL format: `#score=X&waves=Y&small=N&medium=N&poison=N&boss=N`
- 🎯 Game Over screen can be loaded directly from URL with full parade
- 📋 Share button copies shareable link to clipboard
- 🏷️ Shared results display banner to indicate they're from a URL

### v0.4.12
- 🗑️ Removed unused healthbar UI graphics (~1.4 MB)
- ⚡ Optimized backgrounds: converted to JPG format (saved ~4.4 MB)
- 🧹 Cleaned up unused ChatGPT placeholder image
- 🐛 Fixed Game Over screen background flash by pre-rendering

### v0.4.11
- 🧹 Removed unused assets from manifest (water_tile, snake_p2_biting)
- 🐛 Eliminated 404 errors on asset loading

### v0.4.10
- 🎨 Added swamp background to Game Over screen with red overlay
- ⚡ Reduced maximum parade frogs from 5,000 to 2,500 for better performance

### v0.4.9
- 🎨 Added new swamp background image for gameplay
- 🔄 Improved parade control button styling with fixed width
- ↻ Enhanced replay button with larger size and rotation animation
- ⏩ Speed control uses arrow symbols (❯, ❯❯, ❯❯❯)

### v0.4.8
- ↻ Added replay button to restart parade from beginning
- ⏩ Added speed control button to cycle through 1x, 2x, 3x playback speeds
- 🎛️ Parade control buttons in Frogs Defeated box header

### v0.4.7
- 🌊 Enhanced Game Over parade with dramatic wave system
- 🎭 Added 3-phase parade: wave surge (80% of frogs), transition, and steady flow
- 📏 Wave intensity scales with defeated frogs (100-999, 1000-9999, 10000+)
- 🖼️ Full-screen parade canvas for maximum visual impact
- 🚫 Ceiling collision prevents frogs from clipping off-screen
- ⚡ Doubled steady phase pace for faster completion
- 🎯 Wave frogs spawn off-screen (-300 to -500px) for surge effect

### v0.4.6
- 🎮 Changed whip attack control from Right Ctrl to 1 key for easier accessibility
- 📝 Updated all control documentation across UI and docs

### v0.4.5
- 🐸 Added defeated frog parade on Game Over screen - watch all the frogs you defeated hop across!
- 📊 Added frog type counter with sprite icons showing exactly how many of each frog type you defeated
- ⚡ Enhanced parade with varied jump heights for visual variety
- 🎮 Added Delete key shortcut for instant death (playtesting)
- 🔘 Added "Return to Title" button on Game Over screen
- 🚫 Removed automatic return to title after 10 seconds
- ✨ Removed exclamation mark from "Game Over!" title

### v0.4.4
- 📱 Added collapsible "How to Play" panel for small screens
- 🎨 Improved Start button positioning with proper spacing from title
- ♿ Better responsive layout for various screen sizes

### v0.4.3
- 🐸 Added poison dart frogs as fast & deadly enemies (wave 4+, random colors)
- 🎨 Moved green snake and title up 10 pixels on title screen
- ⬇️ Added ability to drop through lily pads with down key

### v0.4.2
- 📱 Added comprehensive Open Graph and Twitter Card meta tags for social media sharing
- 🔍 Added SEO meta tags including description, keywords, and structured data
- 🌐 Added JSON-LD schema markup for search engines
- 🎨 Enhanced page title and added canonical URL

### v0.4.0
- 🎨 New canvas-based title screen with pixel art logo and snake sprites
- ✨ Interactive title screen - click to make snakes jump
- 🎵 Added audio system with title screen and gameplay music
- 🔊 Volume controls with overall, music, and SFX sliders
- 🎶 Background music restarts at the beginning of each wave
- ⏱️ Game over screen returns to title after 10 seconds of inactivity
- 🖱️ Right-click or long-press audio button for volume controls
- 💾 Audio settings persisted via localStorage
- 🔇 Audio defaults to muted with 60% overall volume
- 🧹 Removed water slowdown tip from instructions

### v0.3.1
- 🎨 Rebranded game from "Snake Warriors" to "Snake Style"
- ✨ Added Player 2 jumping sprite integration
- 🐛 Fixed frog sprite flickering at jump peak - now uses stable ground detection
- 🐛 Fixed frog sprite jittering when landing in water - added 3-frame stabilization
- 🎨 Increased small jumping frog sprite size (40px → 50px) for better visibility
- ⌨️ Added Enter key support to start game from title screen

### v0.3.0
- 🐛 Fixed sprite sizing issues - all sprites now display at correct entity dimensions
- 🐛 Fixed sprite flickering on lily pads - improved collision detection with tolerance for bobbing
- 🐛 Fixed water detection - snakes on lily pads are never marked as swimming
- 🐛 Fixed missing P2 jumping sprite - uses idle sprite as fallback
- 🐛 Fixed missing P1 swimming sprite - uses idle sprite with 1.5x size multiplier
- 🎨 Improved lily pad visuals - increased height (15→25px) and reduced bobbing motion
- 💻 Added desktop control hints - keyboard controls displayed at bottom of game screen
- 📱 Improved responsive design - mobile controls hidden on desktop, desktop controls hidden on mobile
- 🎨 Enhanced swimming sprites - 50% larger for better visibility in water

### v0.2.0
- ✨ Added complete pixel art sprite system
- ✨ Integrated 23 custom graphics for all game elements
- ✨ Implemented sprite-based animations for all characters
- ✨ Added title screen with custom logo and background
- ✨ Created asset loading system with fallback support
- 🎨 Enhanced visual presentation with swamp theme
- 📱 Maintained mobile touch control support

### v0.1.0
- 🎮 Initial release with core gameplay
- 👥 2-player local multiplayer
- 🌊 Basic water and lily pad mechanics
- 🐸 Three frog enemy types
- 💥 Roll and whip attack systems
- 🏆 Combo and scoring system

## 🎮 Game Tips

1. **Combo Mastery** - Keep your combo going by attacking continuously
2. **Roll for Safety** - Use roll attack to escape when surrounded
3. **Whip Strategy** - Use the tongue whip to keep enemies at a safe distance
4. **Platform Advantage** - Fight on lily pads to avoid water slowdown
5. **Water Jumping** - Position yourself under a lily pad for precise targeted jumps
6. **Boss Focus** - Prioritize large frogs to prevent being overwhelmed

## 🐛 Known Issues

- None reported yet! Please submit any bugs you find.

## 📜 License

MIT License - Feel free to modify and share!

## 🙏 Credits

- Game Design: Sera Galvin & Rich Conlan
- Programming: Claude Code
- Pixel Art Graphics: ChatGPT + manual edits as needed
- Sound Effects: TBD
- Music: TBD

---

**Enjoy the game!** 🐍🎮🐸

For issues, feedback, or contributions, please visit the project repository.
