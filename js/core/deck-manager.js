/**
 * Deck Manager
 * Handles deck creation, shuffling, and card drawing
 */

class DeckManager {
  constructor(rules) {
    this.rules = rules;
    this.deck = [];
  }
  
  /**
   * Create a full deck based on rules
   */
  createDeck(excludeQueen = null) {
    const deck = [];
    
    // Create all cards
    for (const suit of this.rules.suits) {
      // Number cards (5-9)
      for (const rank of this.rules.ranks.number) {
        deck.push(new Card(suit, rank));
      }
      
      // Ace
      deck.push(new Card(suit, 'ace'));
      
      // Jack
      deck.push(new Card(suit, 'jack'));
      
      // Queen (unless it's the starting Queen)
      if (!excludeQueen || excludeQueen.suit !== suit || excludeQueen.rank !== 'queen') {
        deck.push(new Card(suit, 'queen'));
      }
      
      // King
      deck.push(new Card(suit, 'king'));
      
      // Ten
      deck.push(new Card(suit, 'ten'));
    }
    
    this.deck = deck;
    return deck;
  }
  
  /**
   * Shuffle deck using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    return this.deck;
  }
  
  /**
   * Draw a card from the top of the deck
   */
  drawCard() {
    if (this.deck.length === 0) {
      return null;
    }
    return this.deck.shift();
  }
  
  /**
   * Draw multiple cards
   */
  drawCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const card = this.drawCard();
      if (card) {
        cards.push(card);
      } else {
        break;
      }
    }
    return cards;
  }
  
  /**
   * Remove a specific card from deck
   */
  removeCard(card) {
    const index = this.deck.findIndex(c => 
      c.suit === card.suit && c.rank === card.rank
    );
    if (index !== -1) {
      return this.deck.splice(index, 1)[0];
    }
    return null;
  }
  
  /**
   * Get remaining deck size
   */
  getSize() {
    return this.deck.length;
  }
  
  /**
   * Check if deck is empty
   */
  isEmpty() {
    return this.deck.length === 0;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeckManager;
}

