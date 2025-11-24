/**
 * Rules Engine
 * Validates actions and applies game rules
 */

class RulesEngine {
  constructor(rules) {
    this.rules = rules;
  }
  
  /**
   * Check if a move is valid
   */
  canMove(from, to, board, player) {
    // Cannot move to the same position you're already on
    if (from.x === to.x && from.y === to.y) {
      return { valid: false, reason: 'Cannot move to the same position' };
    }
    
    // Check if destination exists
    const targetTile = board.get(`${to.x},${to.y}`);
    if (!targetTile) {
      return { valid: false, reason: 'Destination tile does not exist' };
    }
    
    // Get current tile
    const currentTile = board.get(`${from.x},${from.y}`);
    const isOnAce = currentTile && currentTile.card && currentTile.card.getType() === 'ace';
    
    // Check if destination is adjacent OR if we're teleporting (on Ace to Ace/central chamber)
    const isAdjacent = this._isAdjacent(from, to);
    const isTeleport = isOnAce && (
      (targetTile.card && targetTile.card.getType() === 'ace') ||
      targetTile.isCentralChamber
    );
    
    if (!isAdjacent && !isTeleport) {
      return { valid: false, reason: 'Can only move to adjacent tiles, or teleport from Ace to Ace/central chamber' };
    }
    
    // For teleport moves (non-adjacent from Ace), skip passability checks
    // Teleports can go to Aces or central chamber regardless of passability
    if (!isTeleport) {
      // Check if tile is a Queen and party is full (Queens become walls when party is full)
      if (targetTile.card && targetTile.card.getType() === 'queen') {
        const canCollect = this.canCollectQueen(targetTile.card, player);
        if (!canCollect.valid && canCollect.reason === 'Party is full (max 3 Queens)') {
          return { valid: false, reason: 'Tile is impassable (Queen - party is full)' };
        }
      }
      
      // Check if tile is a King (Kings are walls unless you can collect them)
      if (targetTile.card && targetTile.card.getType() === 'king') {
        const canCollect = this.canCollectKing(targetTile.card, player);
        if (!canCollect.valid) {
          return { valid: false, reason: 'Tile is impassable (King - cannot collect)' };
        }
      }
      
      if (!targetTile.isPassable()) {
        return { valid: false, reason: 'Tile is impassable (wall or Jack)' };
      }
    }
    
    return { valid: true };
  }
  
  /**
   * Calculate damage from moving onto a tile
   * Note: This checks immunities dynamically from the player's current party state.
   * When a Queen is removed from the party (e.g., when collecting a King),
   * the immunity is immediately lost and future damage calculations will reflect this.
   */
  calculateDamage(tile, player) {
    if (!tile.card) {
      return 0;  // Empty tiles deal no damage
    }
    
    const card = tile.card;
    const cardType = card.getType();
    
    // Check immunity (reads from current party state - updates immediately when Queens are added/removed)
    if (player.isImmuneTo(card.suit)) {
      return 0;
    }
    
    // Number cards deal face value damage
    if (cardType === 'number') {
      return card.value;
    }
    
    // Aces deal damage equal to their value (1) when stepped on
    if (cardType === 'ace') {
      // Use card.value which should be 1 from GAME_RULES.cardBehaviors.ace.value
      // Debug: Log if value seems wrong
      if (card.value !== 1 && typeof GAME_RULES !== 'undefined') {
        console.warn('Ace card.value is', card.value, 'expected 1. Card:', card);
      }
      return card.value; // Aces are worth 1
    }
    
    // Jacks deal adjacent damage (handled separately, not on step)
    // Queens and Kings don't deal damage on step (they're collected)
    // 10s (walls) are impassable, so you can't step on them
    
    return 0;
  }
  
  /**
   * Calculate damage from being adjacent to a Jack
   */
  calculateJackAdjacentDamage(jackCard, player) {
    if (player.isImmuneTo(jackCard.suit)) {
      return 0;
    }
    return this.rules.cardBehaviors.jack.adjacentDamage;
  }
  
  /**
   * Check if player can collect a Queen
   */
  canCollectQueen(queenCard, player) {
    // Check party limit
    if (player.party.length >= this.rules.cardBehaviors.queen.maxPartySize) {
      return { valid: false, reason: 'Party is full (max 3 Queens)' };
    }
    
    // Check if already in party
    const alreadyInParty = player.party.some(q => 
      q.suit === queenCard.suit && q.rank === queenCard.rank
    );
    if (alreadyInParty) {
      return { valid: false, reason: 'Queen already in party' };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if player can collect a King
   */
  canCollectKing(kingCard, player) {
    // Check if already collected
    const alreadyCollected = player.collectedKings.some(k =>
      k.suit === kingCard.suit && k.rank === kingCard.rank
    );
    if (alreadyCollected) {
      return { valid: false, reason: 'King already collected' };
    }
    
    // Check if this is the final King
    const finalKingSuit = player.getFinalKing();
    const isFinalKing = kingCard.suit === finalKingSuit;
    // Must have all other kings before collecting final king
    const requiredOtherKings = this.rules.cardBehaviors.king.totalKingsToWin - 1;
    const hasAllOtherKings = player.collectedKings.length >= requiredOtherKings;
    
    if (isFinalKing && !hasAllOtherKings) {
      return { valid: false, reason: 'Must collect all other Kings before the final King' };
    }
    
    // Check if player has required Queen (same color, different suit)
    const kingColor = kingCard.getColor();
    const requiredQueen = player.party.find(queen => {
      const queenColor = queen.getColor();
      return queenColor === kingColor && queen.suit !== kingCard.suit;
    });
    
    if (!requiredQueen) {
      return { valid: false, reason: 'Need Queen of same color but different suit' };
    }
    
    return { valid: true, requiredQueen: requiredQueen };
  }
  
  /**
   * Check if player can use Ace teleporter
   */
  canTeleport(fromAce, toAce, player) {
    if (!fromAce || !toAce) {
      return { valid: false, reason: 'Invalid teleporter' };
    }
    
    if (fromAce.card.getType() !== 'ace' || toAce.card.getType() !== 'ace') {
      return { valid: false, reason: 'Both tiles must be Aces' };
    }
    
    return { valid: true };
  }
  
  /**
   * Calculate damage from teleporting
   */
  calculateTeleportDamage(aceCard, player) {
    if (player.isImmuneTo(aceCard.suit)) {
      return 0;
    }
    return this.rules.cardBehaviors.ace.differentSuitDamage;
  }
  
  /**
   * Check if player can destroy a tile with King ability
   */
  canDestroyTile(kingCard, targetTile, player) {
    // Check if King is collected
    const hasKing = player.collectedKings.some(k =>
      k.suit === kingCard.suit && k.rank === kingCard.rank
    );
    if (!hasKing) {
      return { valid: false, reason: 'King not collected' };
    }
    
    // Check if ability already used
    if (player.hasKingAbilityUsed(kingCard)) {
      return { valid: false, reason: 'King ability already used' };
    }
    
    // Check if tile is adjacent
    if (!targetTile.isAdjacentTo(player.position.x, player.position.y)) {
      return { valid: false, reason: 'Tile must be adjacent' };
    }
    
    // Cannot destroy central chamber
    if (targetTile.isCentralChamber) {
      return { valid: false, reason: 'Cannot destroy central chamber' };
    }
    
    // Cannot destroy Queens
    if (targetTile.card && targetTile.card.getType() === 'queen') {
      return { valid: false, reason: 'Cannot destroy Queens' };
    }
    
    // Cannot destroy Kings
    if (targetTile.card && targetTile.card.getType() === 'king') {
      return { valid: false, reason: 'Cannot destroy Kings' };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if two positions are adjacent
   */
  _isAdjacent(pos1, pos2) {
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RulesEngine;
}

