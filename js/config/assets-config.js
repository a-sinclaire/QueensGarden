/**
 * Asset Configuration
 * Defines asset paths and skin system
 */

const ASSET_CONFIG = {
  currentSkin: 'default',
  
  skins: {
    default: {
      cards: {
        basePath: 'assets/skins/default/cards/',
        naming: '{suit}_{rank}.png',  // e.g., hearts_queen.png
        fallback: 'card_back.png'
      },
      board: {
        basePath: 'assets/skins/default/board/',
        tile: 'tile.png',
        centralChamber: 'chamber.png',
        emptyTile: 'empty.png'
      },
      ui: {
        basePath: 'assets/skins/default/ui/',
        healthBar: 'health.png',
        partyArea: 'party.png'
      }
    }
    // Future skins can be added here
  },
  
  /**
   * Get asset path for a card
   */
  getCardAsset(card, skin = null) {
    const activeSkin = skin || this.currentSkin;
    const skinConfig = this.skins[activeSkin];
    if (!skinConfig) return null;
    
    const rank = card.rank === 'ace' ? 'ace' : 
                 card.rank === 'jack' ? 'jack' :
                 card.rank === 'queen' ? 'queen' :
                 card.rank === 'king' ? 'king' :
                 card.rank;
    
    const filename = skinConfig.cards.naming
      .replace('{suit}', card.suit)
      .replace('{rank}', rank);
    
    return skinConfig.cards.basePath + filename;
  },
  
  /**
   * Get asset path for board element
   */
  getBoardAsset(element, skin = null) {
    const activeSkin = skin || this.currentSkin;
    const skinConfig = this.skins[activeSkin];
    if (!skinConfig) return null;
    
    return skinConfig.board.basePath + (skinConfig.board[element] || 'tile.png');
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ASSET_CONFIG;
}

