# Changelog

All notable changes to Queen's Garden will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2025-11-24

### Changed
- Improved mobile-desktop UI parity for cohesive experience
  - Desktop party/kings displays now use suit symbols (♥♦♣♠) like mobile
  - Health display simplified to show just number (no prefix/suffix) on both platforms
  - Removed immunities display (shown by party suits)
  - Removed king count from mobile HUD (shown via suit highlighting)
- Desktop now supports tap-and-hold to destroy tiles (same as mobile)
  - Hold mouse button for 500ms on adjacent tiles to activate destroy mode
  - Maintains keyboard accessibility with destroy mode button

### Added
- Help button on mobile HUD (bottom-right corner) for easy access to rules and controls
- Version number display on mobile HUD (bottom-left, subtle styling)
- Mouse event handlers for desktop tap-and-hold functionality

### Fixed
- Mobile HUD container height to ensure help button and version number are visible

## [1.3.0] - 2025-11-24

### Fixed
- Fixed game over screen text display (was looking for wrong element ID)
- Fixed final king victory timing - game now ends immediately when collecting final king, before Jack damage
- Fixed Ace damage calculation - now correctly deals 1 damage (was sometimes dealing 2)
- Fixed double damage from double-firing tile clicks (touch + click events)
- Fixed desktop deck counter display (was stuck at 0)
- Prevented moving to the same position (prevents teleporting to yourself)
- Fixed row and tile ordering - tiles now render in correct X/Y order
- Fixed buffer zone expansion - tiles now reveal correctly as you explore
- Fixed duplicate tileEl declaration error

### Changed
- Consolidated teleport logic into move logic - all movement now uses `moveToPosition()`
  - Removed separate `teleport()` method
  - Aces are now just valid move destinations, not a separate action
  - Simplified click handler to use single code path
- Reordered action sequence for moves/teleports:
  1. Card collection and victory check (FIRST)
  2. Damage from tile you're standing on
  3. Reveal adjacent tiles
  4. Check Jack adjacent damage
  5. Check game over conditions (death)
- Made card values read from `GAME_RULES` config instead of hard-coded
- Made board size configurable via `GAME_RULES.board.size`
- Made buffer zone size configurable via `GAME_RULES.board.bufferZoneSize`
- Made tile dimensions configurable via `GAME_RULES.rendering` section
- Health display now uses `GAME_RULES.startingHealth` instead of hard-coded 20
- Victory condition check now uses `totalKingsToWin - 1` instead of hard-coded 3
- Teleport destinations now exclude the Ace you're standing on

### Added
- `moveToPosition(x, y)` method that handles both adjacent moves and teleports
- Cooldown mechanism (300ms) to prevent duplicate tile clicks from touch+click events
- Configurable rendering settings in `game-rules.js`:
  - `board.size` - board size in each direction (default: 10)
  - `board.bufferZoneSize` - tiles to show around revealed tiles (default: 2)
  - `rendering.tileWidth` - mobile/desktop tile widths
  - `rendering.tileHeight` - mobile/desktop tile heights
  - `rendering.tileGap` - gap between tiles
  - `rendering.mobileBreakpoint` - viewport width threshold

## [1.2.0] - 2025-11-24

### Fixed
- **CRITICAL**: Fixed vertical and horizontal scrolling on mobile and desktop
  - Container now properly constrained to viewport height
  - Board content scrolls correctly in both directions
  - Fixed container expansion issues that prevented scrolling
- Fixed board reset on new game/refresh
- Fixed buffer zone updates - tiles now reveal correctly outside buffer
- Fixed display of rank "10" (was showing "ten")
- Fixed mobile HUD party display - queens now show with suit symbols
- Fixed cache-busting system for CSS files
- Fixed debug panel visibility (now properly hidden)

### Changed
- Refactored board rendering to update tiles in place instead of clearing DOM
  - Improves performance and preserves scroll position
  - All 21x21 tiles created initially, visibility managed dynamically
- Improved mobile HUD display
  - Party suits (queens) now display with symbols (♥♦♣♠)
  - Kings display with used/available indicators
  - Health display fixed
- Improved board centering on game start/reset/refresh
- Container height now uses viewport-based calculation for proper scrolling

### Added
- Mobile HUD with health, party suits, and kings display
- Auto-centering board on central chamber at game start/reset/refresh
- Improved touch event handling for mobile scrolling
- Better scroll position management during board updates

### Removed
- Debug panel and debug border (hidden for production)
- Zoom functionality (removed after testing)

## [Unreleased]

### Changed
- Increased dead zone size from 50% to 70% for camera scrolling
- Fixed camera scroll direction (now scrolls correctly when player leaves dead zone)
- Made dead zone size configurable via `DOMRenderer.deadZoneSize`

### Added
- Debug overlay to visualize dead zone boundaries (for debugging)
- Mobile HUD with health, party, and kings display
- Tap-to-move controls for mobile
- Tap-and-hold for destroy mode on mobile
- Relative camera scrolling (maintains player position on screen)
- Improved mobile camera scrolling with relative position tracking

## [1.1.0] - 2025-11-23

### Added
- Mobile support with responsive layout
- Tap-to-move controls for mobile devices
- Mobile-friendly board layout and scrolling
- Help modal with controls, rules, and credits
- Version number display

### Changed
- Improved mobile board scrolling and camera centering
- Mobile layout optimizations for smaller screens
- Made Kings act as walls unless collectible
- Ensured blank tiles are passable after card collection

### Fixed
- Grid visibility on mobile devices
- Missing function error for adjacent moveable tiles
- GitHub Pages deployment issues

## [1.0.0] - 2025-11-23

### Added
- Initial release
- Core game mechanics
- Web-based playable version
- GitHub Pages deployment
- Credits for Willow McKeon (game design)

