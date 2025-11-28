# Changelog

All notable changes to Snake Style will be documented in this file.

For the most up-to-date version history, see the "Version History" section in README.md.

## [0.6.0] - 2025-11-28

### Added
- `?wave=NUM` URL parameter to start the game at a specific wave number
- `?multiwave=NUM` URL parameter for multi-wave challenge mode (waves 2 through NUM spawn simultaneously after clearing wave 1)
- Support for combined parameters: `?wave=3&multiwave=6` starts at wave 3, then spawns waves 4-6 together
- HUD displays "Waves X-Y" during multiwave phase

### Changed
- Waves completed now calculated relative to starting wave for accurate scoring with custom start waves
- Share URL encodes waves completed relative to starting wave

### Fixed
- Critical bug: Wave counter was incrementing every frame during 2-second inter-wave delay (could cause wave to jump to ~120+ instantly)
- Added `waveTransitioning` guard flag to prevent multiple wave increments

## [0.5.10] - 2025-11-28

### Added
- (Features added)

### Changed
- (Changes made)

### Fixed
- (Bugs fixed)

## [0.5.9] - 2025-11-14

### Fixed
- Pause/unpause input mode consistency: On desktop, pause overlay now only unpauses with P key (not click)
- Prevents accidental unpause when clicking window to regain focus
- Mobile behavior unchanged: tap overlay to unpause as expected

## [0.5.8] - 2025-11-12

### Changed
- Pause overlay is now less opaque (50% instead of 85%) for better visibility of paused game

## [0.5.7] - 2025-11-12

### Added
- Pause functionality: Press P on keyboard or tap pause button (⏸) on mobile to pause/resume
- Pause overlay shows "PAUSED" with resume instructions
- Interactive snake portrait on Game Over/share screen responds to keyboard commands
- Press 0 to make snake roll (with spinning animation)
- Press 1 to make snake whip
- Press UP to make snake jump
- Press DOWN to make snake swim

### Changed
- Roll animation now actually rotates the portrait for visual spinning effect (600ms duration)
- Jump animation now actually moves the portrait up and down with bounce effect (500ms duration)
- Game updates are skipped when paused but rendering continues
- Portrait animations cannot be interrupted on game over screen

## [0.5.6] - 2025-11-12

### Added
- Lily pads now regenerate with fresh random positions at the start of each game
- Player now starts centered on the leftmost lily pad for consistent gameplay

### Changed
- Player starts higher up (dramatic fall-in entrance to each game)
- Lily pad generation now ensures all pads stay fully within canvas bounds
- Each game session now has unique lily pad layout instead of static positions

## [0.5.5] - 2025-11-12

### Fixed
- Enter key now works on share screen to activate the "Play" button
- Share screen now properly reloads the page when clicking "Play", ensuring full initialization
- Keyboard controls are now registered even when loading from a share URL
- Fixed missing lily pads when starting game from share screen

### Changed
- Moved control setup earlier in initialization to support keyboard interaction on share screen
- Share screen "Play" button now triggers a clean page reload instead of attempting partial restart

## [0.5.4] - 2025-11-11

### Added
- Snake portrait in HUD that animates based on player actions (idle, rolling, whipping, jumping)
- Snake portrait in corner of "Frogs Defeated" box on Game Over screen
- Snake parameter in shareable URLs to preserve character selection

### Changed
- Share URLs now include snake parameter (e.g., `&snake=green` or `&snake=orange`)
- "Play" and "Play Again" buttons now use the snake from shared URLs
- Playing from a shared URL preserves the character from that game
- HUD layout updated with portrait alongside player stats
- Game Over screen layout optimized with centered scores and corner snake portrait

## [0.5.3] - 2025-11-11

### Changed
- Selection indicator now only appears after user interaction (click or arrow key press)
- Title screen no longer shows a pre-selected snake on initial load
- Improved first-time user experience by requiring explicit character selection
- Removed localStorage persistence for character selection
- "Play Again" now remembers your character, but "Return to Title" clears selection
- Character selection defaults to Jade when starting a new game

## [0.5.2] - 2025-11-11

### Changed
- Updated character names from "Green Snake" and "Orange Snake" to "Jade" and "Blaze"
- Character names now display as "Jade" (green) and "Blaze" (orange) in the HUD

## [0.5.1] - 2025-11-11

### Added
- Keyboard navigation for character selection on title screen
  - Press Left Arrow to select Jade
  - Press Right Arrow to select Blaze
  - Provides quick keyboard-only navigation flow: arrow keys to select, Enter to start

## [0.5.0] - 2025-11-11

### Changed - Major Refactor to Single Player
- Converted game from 2-player co-op to single-player with character selection
- Title screen now allows selecting between Jade and Blaze before starting
- Removed all 2-player specific code, controls, and UI elements
- Simplified codebase by removing dual-player state management

### Added
- Character selection system with visual indicators on title screen
- Snake variant configuration system for data-driven character properties
- Selection persistence via localStorage
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

## [0.4.0] - 2025-11-02
## [0.4.1] - 2025-11-02

### Added
- Comprehensive Open Graph meta tags for Facebook, LinkedIn, and other social platforms
- Twitter Card meta tags for enhanced Twitter sharing previews
- SEO meta tags including description, keywords, author, and theme color
- JSON-LD structured data for improved search engine indexing
- Canonical URL to prevent duplicate content issues
- Apple touch icon for iOS home screen bookmarks
- Enhanced page title with more descriptive text

### Changed
- Improved meta description for better search engine results
- Added Schema.org VideoGame structured data markup


### Added
- Canvas-based title screen with pixel art logo and snake sprites
- Interactive title screen - click anywhere to make snakes jump with physics
- Audio system with separate title screen and gameplay music tracks
- Volume controls with overall, music, and SFX sliders accessible via right-click/long-press
- Audio settings persistence via localStorage
- Background music restarts at the beginning of each wave for fresh energy
- Automatic return to title screen after 10 seconds of game over inactivity

### Changed
- Audio defaults to muted state with 60% overall volume
- Audio toggle button opacity reduced to 50% for subtler appearance
- Removed HTML text title in favor of canvas-rendered logo
- Start button text remains "Start" (reverted from "Slither In")

### Fixed
- Background music now plays correctly when starting game after page reload
- User interaction flag properly set when clicking Start button

## [0.3.1] - Previous

### Changed
- Rebranded game from "Snake Warriors" to "Snake Style"
- Added Player 2 jumping sprite integration

### Fixed
- Fixed frog sprite flickering at jump peak with stable ground detection
- Fixed frog sprite jittering when landing in water with 3-frame stabilization
- Increased small jumping frog sprite size (40px → 50px) for better visibility

### Added
- Enter key support to start game from title screen

## [0.3.0] - Previous

### Fixed
- Fixed sprite sizing issues - all sprites now display at correct entity dimensions
- Fixed sprite flickering on lily pads with improved collision detection
- Fixed water detection - snakes on lily pads are never marked as swimming
- Fixed missing P2 jumping sprite with idle sprite fallback
- Fixed missing P1 swimming sprite with 1.5x size multiplier

### Changed
- Improved lily pad visuals - increased height (15→25px) and reduced bobbing
- Enhanced swimming sprites - 50% larger for better visibility

### Added
- Desktop control hints displayed at bottom of game screen
- Improved responsive design - proper mobile/desktop control visibility

## [0.2.0] - Previous

### Added
- Complete pixel art sprite system with 23 custom graphics
- Title screen with custom logo and swamp background
- Asset loading system with fallback support
- Sprite-based animations for all characters and effects

## [0.1.0] - Initial Release

### Added
- 2-player local multiplayer gameplay
- Wave-based frog invasion combat
- Roll and whip attack systems
- Combo and scoring system
- Water mechanics and lily pad platforming
- Three frog enemy types (small, medium, large)
- Mobile touch control support
- Responsive desktop and mobile UI

---

*For detailed development notes and technical information, see the original CHANGELOG entries or README.md*
