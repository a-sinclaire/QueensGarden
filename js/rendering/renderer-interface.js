/**
 * Renderer Interface
 * Abstract interface that all renderers must implement
 * This allows swapping renderers without changing the game engine
 */

class RendererInterface {
  /**
   * Initialize the renderer with game engine
   */
  initialize(gameEngine) {
    throw new Error('initialize() must be implemented');
  }
  
  /**
   * Render the entire game state
   */
  render(gameState) {
    throw new Error('render() must be implemented');
  }
  
  /**
   * Called when player takes damage
   */
  onDamage(amount, newHealth, source = null) {
    // Optional - default implementation does nothing
  }
  
  /**
   * Called when a Queen is collected
   */
  onQueenCollected(queen) {
    // Optional - default implementation does nothing
  }
  
  /**
   * Called when a King is collected
   */
  onKingCollected(king) {
    // Optional - default implementation does nothing
  }
  
  /**
   * Called when game ends
   */
  onGameOver(victory) {
    // Optional - default implementation does nothing
  }
  
  /**
   * Highlight valid moves (for UI feedback)
   */
  highlightValidMoves(positions) {
    // Optional - default implementation does nothing
  }
  
  /**
   * Clear highlights
   */
  clearHighlights() {
    // Optional - default implementation does nothing
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RendererInterface;
}

