/**
 * Tile Model
 * Represents a position on the game board
 */

class Tile {
  constructor(x, y, card = null) {
    this.x = x;
    this.y = y;
    this.card = card;  // Card object or null (for empty tiles like central chamber)
    this.revealed = card !== null;  // Empty tiles are always "revealed"
    this.isCentralChamber = x === 0 && y === 0;
  }
  
  /**
   * Check if tile is empty (no card)
   */
  isEmpty() {
    return this.card === null;
  }
  
  /**
   * Check if tile is passable
   */
  isPassable() {
    if (this.isEmpty()) return true;
    
    const cardType = this.card.getType();
    // Walls (10s) and Jacks are impassable
    return cardType !== 'ten' && cardType !== 'jack';
  }
  
  /**
   * Get adjacent positions (orthogonal only)
   */
  getAdjacentPositions() {
    return [
      { x: this.x, y: this.y + 1 },   // North
      { x: this.x, y: this.y - 1 },   // South
      { x: this.x + 1, y: this.y },   // East
      { x: this.x - 1, y: this.y }    // West
    ];
  }
  
  /**
   * Check if this tile is adjacent to another position
   */
  isAdjacentTo(x, y) {
    const dx = Math.abs(this.x - x);
    const dy = Math.abs(this.y - y);
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
  }
  
  /**
   * String representation
   */
  toString() {
    if (this.isCentralChamber) return 'Central Chamber';
    if (this.isEmpty()) return `Empty tile at (${this.x}, ${this.y})`;
    return `${this.card.toString()} at (${this.x}, ${this.y})`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Tile;
}

