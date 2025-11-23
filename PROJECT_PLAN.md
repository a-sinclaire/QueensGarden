# Queen's Garden - Project Plan

## Overview
A web-based implementation of the Queen's Garden tabletop game, designed to be easily playable without installation, with configurable rules and replaceable assets.

---

## Technology Stack

### Core Technologies
- **HTML5**: Structure
- **CSS3**: Styling (with CSS variables for theming)
- **Vanilla JavaScript (ES6+)**: Game logic (no frameworks required)
- **GitHub Pages**: Hosting (free, no build step needed)

### Rationale
- No build tools or dependencies required
- Works in any modern browser
- Easy to deploy via GitHub Pages
- Simple to modify and extend

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (HTML/CSS - UI, Rendering, Assets)    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Game Engine Layer              │
│  (Game State, Turn Logic, Validation)  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Rules Engine Layer             │
│  (Configurable Rules, Card Behaviors)   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│          Data Layer                     │
│  (Game Config, Asset Config, State)    │
└─────────────────────────────────────────┘
```

---

## File Structure

```
queens-garden/
├── index.html                 # Main entry point
├── css/
│   ├── main.css              # Core styles
│   ├── game-board.css        # Board layout styles
│   ├── cards.css             # Card rendering styles
│   └── ui.css                # UI elements (health, party, etc.)
├── js/
│   ├── config/
│   │   ├── game-rules.js     # All game rules as config
│   │   └── assets-config.js  # Asset paths and skin config
│   ├── core/
│   │   ├── game-engine.js    # Core game loop and state management
│   │   ├── rules-engine.js   # Rules validation and application
│   │   └── deck-manager.js   # Deck creation, shuffling, drawing
│   ├── models/
│   │   ├── card.js           # Card data model
│   │   ├── tile.js           # Tile/board position model
│   │   └── player.js         # Player state model
│   ├── rendering/
│   │   ├── board-renderer.js # Board rendering logic
│   │   ├── card-renderer.js  # Card rendering logic
│   │   └── ui-renderer.js    # UI elements rendering
│   ├── actions/
│   │   ├── movement.js       # Movement logic
│   │   ├── damage.js         # Damage calculation
│   │   ├── collection.js     # Collecting cards (Queens/Kings)
│   │   └── special-actions.js # Teleport, destroy tile, etc.
│   └── main.js               # Entry point, initialization
├── assets/
│   ├── skins/
│   │   ├── default/
│   │   │   ├── cards/        # Card images
│   │   │   ├── board/        # Board/tile images
│   │   │   └── ui/           # UI elements
│   │   └── [future-skins]/   # Additional skin folders
│   └── sounds/               # Optional: sound effects
└── README.md
```

---

## Core Components

### 1. Rules Configuration (`config/game-rules.js`)
**Purpose**: Centralize all game rules as configurable data

```javascript
const GAME_RULES = {
  startingHealth: 20,
  removedRanks: [2, 3, 4],
  suits: ['hearts', 'diamonds', 'clubs', 'spades'],
  ranks: {
    number: [5, 6, 7, 8, 9],
    ace: 1,
    jack: 11,
    queen: 12,
    king: 13,
    ten: 10
  },
  cardBehaviors: {
    ace: {
      type: 'teleporter',
      sameSuitDamage: 0,
      differentSuitDamage: 1
    },
    jack: {
      type: 'trap',
      adjacentDamage: 4,
      impassable: true
    },
    queen: {
      type: 'collectible',
      maxPartySize: 3,
      grantsImmunity: true
    },
    king: {
      type: 'victory',
      collectionRequirement: 'sameColorDifferentSuit',
      destroyAbility: true,
      destroyUses: 1
    },
    ten: {
      type: 'wall',
      impassable: true
    }
  },
  // ... more rules
};
```

### 2. Game Engine (`core/game-engine.js`)
**Purpose**: Manage game state and coordinate game flow

**Key Responsibilities**:
- Initialize game state
- Manage turn flow
- Coordinate between rules engine and rendering
- Handle game over/victory conditions

**Core Game Loop**:
1. Initialize (setup deck, choose Queen, reveal initial tiles)
2. Player Action (move, teleport, use ability)
3. Validate Action (rules engine)
4. Apply Action (update state)
5. Check Triggers (damage, collection, etc.)
6. Render Update
7. Check Win Condition
8. Repeat

### 3. Rules Engine (`core/rules-engine.js`)
**Purpose**: Validate actions and apply rules

**Key Functions**:
- `canMove(from, to, gameState)` - Check if movement is valid
- `calculateDamage(card, playerState)` - Calculate damage from tile
- `canCollect(card, playerState)` - Check collection requirements
- `checkImmunity(suit, playerState)` - Check if player is immune
- `validateAction(action, gameState)` - General validation

### 4. Deck Manager (`core/deck-manager.js`)
**Purpose**: Handle deck creation, shuffling, and card drawing

**Key Functions**:
- `createDeck(rules)` - Create deck based on rules
- `shuffle(deck)` - Shuffle deck
- `drawCard(deck)` - Draw from top
- `removeCard(deck, card)` - Remove specific card

### 5. Board Renderer (`rendering/board-renderer.js`)
**Purpose**: Render the game board and tiles

**Key Functions**:
- `renderBoard(gameState)` - Render entire board
- `renderTile(position, card, revealed)` - Render individual tile
- `updatePlayerPosition(position)` - Update player marker
- `highlightValidMoves(positions)` - Show available moves

### 6. Card Renderer (`rendering/card-renderer.js`)
**Purpose**: Render card visuals

**Key Functions**:
- `renderCard(card, size, revealed)` - Render card image/visual
- `getCardAsset(card, skin)` - Get asset path for card
- `renderCardBack()` - Render face-down card

---

## Data Models

### Card Model
```javascript
{
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades',
  rank: number | 'ace' | 'jack' | 'queen' | 'king',
  value: number,  // Numeric value for damage/calculations
  revealed: boolean,
  position: { x: number, y: number } | null
}
```

### Player State
```javascript
{
  startingQueen: Card,
  party: Card[],  // Queens in party (max 3)
  collectedKings: Card[],  // Collected Kings
  health: number,
  position: { x: number, y: number },
  immunities: string[]  // Suits player is immune to
}
```

### Game State
```javascript
{
  rules: GAME_RULES,
  deck: Card[],
  board: Map<position, Card>,  // Revealed tiles
  player: PlayerState,
  turn: number,
  gameOver: boolean,
  victory: boolean
}
```

---

## Asset System

### Asset Configuration (`config/assets-config.js`)
```javascript
const ASSET_CONFIG = {
  currentSkin: 'default',
  skins: {
    default: {
      cards: {
        basePath: 'assets/skins/default/cards/',
        naming: '{suit}_{rank}.png'  // e.g., hearts_queen.png
      },
      board: {
        basePath: 'assets/skins/default/board/',
        tile: 'tile.png',
        centralChamber: 'chamber.png'
      },
      ui: {
        basePath: 'assets/skins/default/ui/',
        healthBar: 'health.png',
        partyArea: 'party.png'
      }
    }
    // Future skins can be added here
  }
};
```

### Asset Loading
- Lazy load assets as needed
- Preload critical assets (starting cards, UI)
- Fallback to CSS/Unicode if images missing

---

## Implementation Phases

### Phase 1: Core Engine (MVP)
**Goal**: Basic playable game with minimal visuals

- [ ] Rules configuration system
- [ ] Deck creation and management
- [ ] Basic game state management
- [ ] Movement system
- [ ] Damage calculation
- [ ] Simple text-based rendering
- [ ] Basic UI (health, party display)

### Phase 2: Visual Rendering
**Goal**: Visual card-based board

- [ ] Card rendering system
- [ ] Board layout and rendering
- [ ] Tile reveal system
- [ ] Player position marker
- [ ] Asset loading system
- [ ] Basic card images/assets

### Phase 3: Special Cards & Actions
**Goal**: All game mechanics working

- [ ] Ace teleportation
- [ ] Jack trap damage
- [ ] Queen collection and immunities
- [ ] King collection and requirements
- [ ] King destroy ability
- [ ] Wall (10s) blocking
- [ ] Win condition checking

### Phase 4: Polish & UX
**Goal**: Smooth, intuitive gameplay

- [ ] Move validation and highlighting
- [ ] Action feedback (animations, messages)
- [ ] Error handling and user feedback
- [ ] Game state persistence (localStorage)
- [ ] Settings/options menu
- [ ] Help/tutorial system

### Phase 5: Extensibility
**Goal**: Easy to modify and extend

- [ ] Skin system implementation
- [ ] Rules modification UI (optional)
- [ ] Save/load game states
- [ ] Statistics tracking
- [ ] Documentation

---

## Key Design Principles

### 1. Separation of Concerns
- **Data**: Pure data structures, no logic
- **Logic**: Pure functions, no rendering
- **Rendering**: Only display, no game logic

### 2. Configuration Over Code
- Rules should be data, not hardcoded logic
- Easy to modify rules without touching core engine
- Asset paths configurable

### 3. Extensibility
- Plugin-like architecture for card behaviors
- Skin system allows easy asset swapping
- Rules engine can be extended with new behaviors

### 4. Human Readable
- Clear function and variable names
- Well-commented code
- Logical file organization
- Self-documenting structure

### 5. Simple Core Loop
- Game loop should be straightforward
- Complex logic broken into small functions
- Easy to trace game flow

---

## Technical Considerations

### State Management
- Single source of truth (game state object)
- Immutable updates where possible
- State changes trigger re-renders

### Performance
- Only render visible tiles
- Lazy load assets
- Efficient board representation (sparse grid)

### Browser Compatibility
- ES6+ features (modern browsers)
- CSS Grid/Flexbox for layout
- No external dependencies

### Testing Strategy
- Unit tests for core logic (optional, but recommended)
- Manual testing for rendering/interaction
- Test with different rule configurations

---

## Future Enhancements (Post-MVP)

1. **Multiple Skins**: Different visual themes
2. **Rule Variants**: Alternative rule sets
3. **AI Opponent**: Computer player
4. **Multiplayer**: Online or local multiplayer
5. **Statistics**: Win/loss tracking, best times
6. **Animations**: Smooth transitions and effects
7. **Sound Effects**: Audio feedback
8. **Mobile Support**: Touch controls, responsive design

---

## Questions to Consider

1. **Board Representation**: 
   - Grid-based? Graph-based? 
   - How to handle infinite exploration?

2. **Tile Revealing**:
   - Reveal on move? Reveal adjacent?
   - How to handle fog of war?

3. **Save System**:
   - Save to localStorage?
   - Export/import game states?

4. **Difficulty**:
   - Configurable starting health?
   - Different deck compositions?

5. **Accessibility**:
   - Keyboard navigation?
   - Screen reader support?
   - Color-blind friendly?

---

## Next Steps

1. Review and refine this plan
2. Set up project structure
3. Begin Phase 1 implementation
4. Create basic HTML/CSS skeleton
5. Implement core game engine

