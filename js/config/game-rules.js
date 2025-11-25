/**
 * Game Rules Configuration
 * All game rules are defined here as configurable data
 * Modify these values to change game behavior without touching core engine
 */

const GAME_RULES = {
  // Starting conditions
  startingHealth: 20,
  
  // Deck configuration
  removedRanks: [2, 3, 4],  // Ranks removed from deck
  suits: ['hearts', 'diamonds', 'clubs', 'spades'],
  
  // Rank values
  ranks: {
    number: [5, 6, 7, 8, 9],
    ace: 1,
    jack: 11,
    queen: 12,
    king: 13,
    ten: 10
  },
  
  // Card behaviors
  cardBehaviors: {
    ace: {
      type: 'teleporter',
      sameSuitDamage: 0,
      differentSuitDamage: 1,
      value: 1
    },
    jack: {
      type: 'trap',
      adjacentDamage: 4,
      impassable: true,
      value: 11
    },
    queen: {
      type: 'collectible',
      maxPartySize: 3,
      grantsImmunity: true,
      value: 12
    },
    king: {
      type: 'victory',
      collectionRequirement: 'sameColorDifferentSuit',
      destroyAbility: true,
      destroyUses: 1,
      value: 13,
      totalKingsToWin: 4
    },
    ten: {
      type: 'wall',
      impassable: true,
      value: 10
    }
  },
  
  // Suit colors (for King collection requirement)
  suitColors: {
    hearts: 'red',
    diamonds: 'red',
    clubs: 'black',
    spades: 'black'
  },
  
  // Movement
  movement: {
    adjacentOnly: true,
    orthogonalOnly: true
  },
  
  // Board
  board: {
    centralChamberPosition: { x: 0, y: 0 },
    size: 10,  // Size in each direction from center (10 = 21x21 grid total)
    bufferZoneSize: 3,  // Tiles to show around revealed tiles (3 = 7x7 area around each revealed tile)
    initialRevealDirections: [
      { x: 0, y: 1 },   // North
      { x: 0, y: -1 },  // South
      { x: 1, y: 0 },   // East
      { x: -1, y: 0 }   // West
    ],
    revealAdjacentOnMove: true
  },
  
  // Rendering
  rendering: {
    tileWidth: {
      mobile: 65,  // px
      desktop: 70   // px
    },
    tileHeight: {
      mobile: 85,  // px
      desktop: 90  // px
    },
    tileGap: 2,  // px gap between tiles
    mobileBreakpoint: 480  // px - switch between mobile/desktop tile sizes
  },
  
  // Damage rules
  damage: {
    numberCardDamage: 'faceValue',  // Number cards deal damage equal to face value
    aceTeleportDamage: 1,  // Damage when using different suit Ace
    jackAdjacentDamage: 4   // Damage when adjacent to Jack
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_RULES;
}

