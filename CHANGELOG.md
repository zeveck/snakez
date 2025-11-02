# Changelog

All notable changes to Snake Style will be documented in this file.

For the most up-to-date version history, see the "Version History" section in README.md.

## [0.4.0] - 2025-11-02

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
