# Queen's Garden

A web-based implementation of the Queen's Garden tabletop game.

## Quick Start

Simply open `index.html` in a modern web browser. No installation or build process required!

## How to Play

1. Choose your starting Queen (Hearts, Diamonds, Clubs, or Spades)
2. Use arrow keys (or WASD) to move your Queen around the board
3. Collect the other three Queens to gain immunities
4. Collect all 4 Kings to win (your starting Queen's corresponding King must be collected last)
5. Avoid taking too much damage - you start with 20 health!

## Controls

- **Arrow Keys** or **WASD**: Move your Queen
- **Arrow Up / W**: Move North
- **Arrow Down / S**: Move South
- **Arrow Left / A**: Move West
- **Arrow Right / D**: Move East

## Game Rules

See `game rules` file for complete rules.

## Project Structure

```
queens-garden/
├── index.html              # Main entry point
├── css/                    # Stylesheets
├── js/
│   ├── config/            # Game rules and asset configuration
│   ├── core/              # Core game engine
│   ├── models/            # Data models (Card, Tile, Player)
│   ├── rendering/         # Renderer interfaces and implementations
│   └── main.js            # Entry point and input handling
└── assets/                # Game assets (images, sounds, etc.)
```

## Architecture

The game is built with a clean separation of concerns:

- **Rules Engine**: Validates actions and applies game rules
- **Game Engine**: Manages game state and coordinates gameplay
- **Renderer Interface**: Allows swapping renderers without changing core logic
- **Configurable Rules**: All game rules are in `js/config/game-rules.js`

## Development

### Adding New Features

1. **New Card Behaviors**: Add to `GAME_RULES.cardBehaviors` in `js/config/game-rules.js`
2. **New Renderer**: Extend `RendererInterface` in `js/rendering/renderer-interface.js`
3. **New Actions**: Add methods to `GameEngine` class

### Customizing Assets

Assets are organized by "skins" in `assets/skins/`. To add a new skin:

1. Create a new folder in `assets/skins/`
2. Add your assets following the naming convention
3. Update `ASSET_CONFIG` in `js/config/assets-config.js`

## Browser Compatibility

Requires a modern browser with ES6+ support:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

[Add your license here]

## Credits

Game design and rules by [Your Name]

