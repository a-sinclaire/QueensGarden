/**
 * Card Model
 * Represents a playing card
 */

class Card {
  constructor(suit, rank, value = null) {
    this.suit = suit;  // 'hearts', 'diamonds', 'clubs', 'spades'
    this.rank = rank;  // number (5-9) or 'ace', 'jack', 'queen', 'king', 'ten'
    this.value = value || this._calculateValue();
    this.revealed = false;
    this.position = null;  // { x, y } when placed on board
  }
  
  /**
   * Calculate card value based on rank
   */
  _calculateValue() {
    if (typeof this.rank === 'number') {
      return this.rank;
    }
    
    const valueMap = {
      'ace': 1,
      'jack': 11,
      'queen': 12,
      'king': 13,
      'ten': 10
    };
    
    return valueMap[this.rank] || 0;
  }
  
  /**
   * Get card type based on rank
   */
  getType() {
    if (this.rank === 'ace') return 'ace';
    if (this.rank === 'jack') return 'jack';
    if (this.rank === 'queen') return 'queen';
    if (this.rank === 'king') return 'king';
    if (this.rank === 'ten') return 'ten';
    return 'number';
  }
  
  /**
   * Check if card is a face card
   */
  isFaceCard() {
    return ['ace', 'jack', 'queen', 'king'].includes(this.rank);
  }
  
  /**
   * Get suit color (red or black)
   */
  getColor() {
    const redSuits = ['hearts', 'diamonds'];
    return redSuits.includes(this.suit) ? 'red' : 'black';
  }
  
  /**
   * Create a copy of the card
   */
  clone() {
    const card = new Card(this.suit, this.rank, this.value);
    card.revealed = this.revealed;
    card.position = this.position ? { ...this.position } : null;
    return card;
  }
  
  /**
   * String representation
   */
  toString() {
    const rankStr = typeof this.rank === 'number' ? this.rank : this.rank.toUpperCase();
    return `${rankStr} of ${this.suit}`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Card;
}

