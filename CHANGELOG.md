# Changelog

All notable changes to Queen's Garden will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-01-XX

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

