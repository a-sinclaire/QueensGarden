/**
 * Player Model
 * Represents the player's state
 */

class Player {
  constructor(startingQueen) {
    this.startingQueen = startingQueen;
    this.party = [startingQueen];  // Queens in party (max 3)
    this.collectedKings = [];  // Collected Kings
    this.health = GAME_RULES.startingHealth;
    this.position = { x: 0, y: 0 };  // Start at central chamber
    this.usedKingAbilities = new Set();  // Track which Kings have used destroy ability
  }
  
  /**
   * Get all suits the player is immune to (from party Queens)
   */
  getImmunities() {
    return this.party.map(queen => queen.suit);
  }
  
  /**
   * Check if player is immune to a suit
   */
  isImmuneTo(suit) {
    return this.getImmunities().includes(suit);
  }
  
  /**
   * Add a Queen to party
   */
  addQueenToParty(queen) {
    if (this.party.length >= GAME_RULES.cardBehaviors.queen.maxPartySize) {
      return false;  // Party full
    }
    this.party.push(queen);
    return true;
  }
  
  /**
   * Remove a Queen from party (used when collecting a King)
   */
  removeQueenFromParty(queen) {
    const index = this.party.findIndex(q => 
      q.suit === queen.suit && q.rank === queen.rank
    );
    if (index !== -1) {
      this.party.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Collect a King
   */
  collectKing(king) {
    this.collectedKings.push(king);
  }
  
  /**
   * Check if King ability has been used
   */
  hasKingAbilityUsed(king) {
    const key = `${king.suit}_${king.rank}`;
    return this.usedKingAbilities.has(key);
  }
  
  /**
   * Mark King ability as used
   */
  useKingAbility(king) {
    const key = `${king.suit}_${king.rank}`;
    this.usedKingAbilities.add(key);
  }
  
  /**
   * Take damage
   */
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health;
  }
  
  /**
   * Check if player is dead
   */
  isDead() {
    return this.health <= 0;
  }
  
  /**
   * Check if player has won (collected all 4 Kings)
   */
  hasWon() {
    return this.collectedKings.length >= GAME_RULES.cardBehaviors.king.totalKingsToWin;
  }
  
  /**
   * Get the King that corresponds to starting Queen (must be collected last)
   */
  getFinalKing() {
    // Same color, different suit
    const startingColor = this.startingQueen.getColor();
    const startingSuit = this.startingQueen.suit;
    
    const sameColorSuits = Object.keys(GAME_RULES.suitColors)
      .filter(suit => GAME_RULES.suitColors[suit] === startingColor && suit !== startingSuit);
    
    // Should only be one suit of same color but different suit
    return sameColorSuits[0];  // Return suit name of the final King
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}

