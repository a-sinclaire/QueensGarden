/**
 * Game Engine
 * Core game state management and game loop coordination
 */

class GameEngine {
  constructor(rules, renderer) {
    this.rules = rules;
    this.renderer = renderer;
    this.deckManager = null;
    this.board = new Map();  // Key: "x,y", Value: Tile
    this.player = null;
    this.rulesEngine = new RulesEngine(rules);
    this.turn = 0;
    this.gameOver = false;
    this.victory = false;
  }
  
  /**
   * Initialize a new game
   */
  initialize(startingQueen) {
    // Store starting queen for reference
    this.startingQueen = startingQueen;
    
    // Create starting Queen card
    const queenCard = new Card(startingQueen.suit, 'queen');
    
    // Create deck (excluding starting Queen)
    this.deckManager = new DeckManager(this.rules);
    this.deckManager.createDeck(queenCard);
    this.deckManager.shuffle();
    
    // Create player
    this.player = new Player(queenCard);
    
    // Initialize board with central chamber
    const centralChamber = new Tile(0, 0, null);
    this.board.set('0,0', centralChamber);
    
    // Reveal initial directions
    this._revealInitialTiles();
    
    // Check for Jack adjacent damage from initial revealed tiles
    // Player starts at (0,0), so check adjacent positions
    this._checkJackAdjacentDamage(this.player.position);
    
    // Reset game state
    this.turn = 0;
    this.gameOver = false;
    this.victory = false;
    
    // Initial render
    this.renderer.initialize(this);
    this.renderer.render(this.getGameState());
  }
  
  /**
   * Reveal initial tiles in cardinal directions
   */
  _revealInitialTiles() {
    const directions = this.rules.board.initialRevealDirections;
    
    for (const dir of directions) {
      const card = this.deckManager.drawCard();
      if (card) {
        const tile = new Tile(dir.x, dir.y, card);
        card.position = { x: dir.x, y: dir.y };
        card.revealed = true;
        this.board.set(`${dir.x},${dir.y}`, tile);
      }
    }
  }
  
  /**
   * Reveal adjacent tiles to current position
   */
  _revealAdjacentTiles() {
    if (!this.rules.board.revealAdjacentOnMove) {
      return;
    }
    
    const currentTile = this.board.get(`${this.player.position.x},${this.player.position.y}`);
    if (!currentTile) return;
    
    const adjacentPositions = currentTile.getAdjacentPositions();
    
    for (const pos of adjacentPositions) {
      const key = `${pos.x},${pos.y}`;
      
      // Skip if already revealed
      if (this.board.has(key)) {
        continue;
      }
      
      // Draw card and create tile
      const card = this.deckManager.drawCard();
      if (card) {
        const tile = new Tile(pos.x, pos.y, card);
        card.position = { x: pos.x, y: pos.y };
        card.revealed = true;
        this.board.set(key, tile);
      }
    }
  }
  
  /**
   * Move player to a new position (by direction)
   */
  movePlayer(direction) {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }
    
    const currentPos = this.player.position;
    const newPos = this._getNewPosition(currentPos, direction);
    
    return this.moveToPosition(newPos.x, newPos.y);
  }
  
  /**
   * Move player to a specific position (handles both adjacent moves and teleports)
   */
  moveToPosition(x, y) {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }
    
    const currentPos = this.player.position;
    const newPos = { x, y };
    
    // Validate move (this now handles both adjacent moves and teleports)
    const validation = this.rulesEngine.canMove(currentPos, newPos, this.board, this.player);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }
    
    // Get target tile
    const targetTile = this.board.get(`${newPos.x},${newPos.y}`);
    
    // Move player
    this.player.position = newPos;
    this.turn++;
    
    // STEP 1: Check for card collection and victory FIRST
    // This ensures victory happens before any damage can kill the player
    if (targetTile.card) {
      this._handleCardCollection(targetTile);
      
      // Check for victory immediately after card collection
      if (this.player.hasWon()) {
        this.gameOver = true;
        this.victory = true;
        this.renderer.onGameOver(true);
        this.renderer.render(this.getGameState());
        return { success: true, damage: 0 };
      }
    }
    
    // STEP 2: Calculate and apply damage from stepping on tile
    // Use calculateDamage for all moves (including teleports) - Aces deal 1 damage
    const damage = this.rulesEngine.calculateDamage(targetTile, this.player);
    if (damage > 0) {
      this.player.takeDamage(damage);
      this.renderer.onDamage(damage, this.player.health);
    }
    
    // STEP 3: Reveal adjacent tiles (this will check for newly revealed Jacks)
    this._revealAdjacentTiles();
    
    // STEP 4: Check for Jack adjacent damage (for all adjacent Jacks, including newly revealed)
    // This ensures we catch Jacks that were already revealed before moving
    // Skip if game is already over (victory condition)
    if (!this.gameOver) {
      this._checkJackAdjacentDamage(newPos);
    }
    
    // STEP 5: Check game over conditions (death check)
    this._checkGameOver();
    
    // Render update
    this.renderer.render(this.getGameState());
    
    return { success: true, damage: damage };
  }
  
  /**
   * Get new position based on direction
   */
  _getNewPosition(currentPos, direction) {
    const directions = {
      'north': { x: 0, y: 1 },
      'south': { x: 0, y: -1 },
      'east': { x: 1, y: 0 },
      'west': { x: -1, y: 0 }
    };
    
    const delta = directions[direction.toLowerCase()];
    if (!delta) {
      return currentPos;
    }
    
    return {
      x: currentPos.x + delta.x,
      y: currentPos.y + delta.y
    };
  }
  
  /**
   * Check for Jack adjacent damage
   * CRITICAL: This must check ALL adjacent tiles, even if they're not revealed yet
   * (though unrevealed tiles won't have cards, so they'll be skipped)
   */
  _checkJackAdjacentDamage(position) {
    const adjacentPositions = [
      { x: position.x, y: position.y + 1 },
      { x: position.x, y: position.y - 1 },
      { x: position.x + 1, y: position.y },
      { x: position.x - 1, y: position.y }
    ];
    
    for (const pos of adjacentPositions) {
      const key = `${pos.x},${pos.y}`;
      const tile = this.board.get(key);
      
      // Debug: Log what we're checking
      if (window.DEBUG_JACK_DAMAGE) {
        console.log(`Checking adjacent position (${pos.x}, ${pos.y}):`, {
          tileExists: !!tile,
          hasCard: !!(tile && tile.card),
          cardType: tile && tile.card ? tile.card.getType() : 'none',
          isJack: tile && tile.card && tile.card.getType() === 'jack'
        });
      }
      
      if (tile && tile.card && tile.card.getType() === 'jack') {
        const damage = this.rulesEngine.calculateJackAdjacentDamage(tile.card, this.player);
        
        // Debug: Log damage calculation
        if (window.DEBUG_JACK_DAMAGE) {
          console.log(`Jack found at (${pos.x}, ${pos.y}):`, {
            jackSuit: tile.card.suit,
            playerImmunities: this.player.getImmunities(),
            isImmune: this.player.isImmuneTo(tile.card.suit),
            calculatedDamage: damage
          });
        }
        
        if (damage > 0) {
          this.player.takeDamage(damage);
          this.renderer.onDamage(damage, this.player.health, 'Jack trap');
        }
      }
    }
  }
  
  /**
   * Handle card collection when stepping on a tile
   */
  _handleCardCollection(tile) {
    const card = tile.card;
    if (!card) return;
    
    const cardType = card.getType();
    
    if (cardType === 'queen') {
      const validation = this.rulesEngine.canCollectQueen(card, this.player);
      if (validation.valid) {
        this.player.addQueenToParty(card.clone());
        // Remove card from board, replace with empty tile
        tile.card = null;
        tile.revealed = true; // Empty tiles are always revealed and passable
        this.renderer.onQueenCollected(card);
      }
    } else if (cardType === 'king') {
      const validation = this.rulesEngine.canCollectKing(card, this.player);
      if (validation.valid) {
        // Store the suit of the Queen being removed for verification
        const removedQueenSuit = validation.requiredQueen.suit;
        
        // Remove required Queen from party (this immediately removes the immunity)
        this.player.removeQueenFromParty(validation.requiredQueen);
        
        // Collect the King
        this.player.collectKing(card.clone());
        
        // Remove card from board, replace with empty tile
        // Note: Since the tile becomes empty, no damage is taken from it
        // Future moves will correctly calculate damage based on updated immunities
        tile.card = null;
        tile.revealed = true; // Empty tiles are always revealed and passable
        
        this.renderer.onKingCollected(card);
        
        // Verify immunity was removed (for debugging/logging)
        // The player is no longer immune to removedQueenSuit
        // This will affect all future damage calculations
      }
    }
  }
  
  /**
   * Teleport using an Ace
   */
  teleport(targetPosition) {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }
    
    const currentTile = this.board.get(`${this.player.position.x},${this.player.position.y}`);
    const targetTile = this.board.get(`${targetPosition.x},${targetPosition.y}`);
    
    // Check if current position is an Ace (can only teleport FROM Aces, not central chamber)
    const isOnAce = currentTile && currentTile.card && currentTile.card.getType() === 'ace';
    
    if (!isOnAce) {
      return { success: false, message: 'Must be on an Ace to teleport' };
    }
    
    // Check if target is an Ace or central chamber
    const targetIsAce = targetTile && targetTile.card && targetTile.card.getType() === 'ace';
    const targetIsCentralChamber = targetTile && targetTile.isCentralChamber;
    
    if (!targetIsAce && !targetIsCentralChamber) {
      return { success: false, message: 'Can only teleport to an Ace or central chamber' };
    }
    
    // Teleport
    this.player.position = targetPosition;
    this.turn++;
    
    // STEP 1: Check for card collection and victory FIRST
    // This ensures victory happens before any damage can kill the player
    if (targetTile.card) {
      this._handleCardCollection(targetTile);
      
      // Check for victory immediately after card collection
      if (this.player.hasWon()) {
        this.gameOver = true;
        this.victory = true;
        this.renderer.onGameOver(true);
        this.renderer.render(this.getGameState());
        return { success: true, damage: 0 };
      }
    }
    
    // STEP 2: Calculate and apply damage from the tile we're standing on
    // Use calculateDamage to handle all card types (Aces, number cards, etc.)
    // No damage when teleporting to central chamber (empty tile)
    let damage = 0;
    if (!targetIsCentralChamber) {
      damage = this.rulesEngine.calculateDamage(targetTile, this.player);
      if (damage > 0) {
        this.player.takeDamage(damage);
        this.renderer.onDamage(damage, this.player.health, 'Teleport');
      }
    }
    
    // STEP 3: Reveal adjacent tiles (this will check for newly revealed Jacks)
    this._revealAdjacentTiles();
    
    // STEP 4: Check for Jack adjacent damage (for all adjacent Jacks, including newly revealed)
    // This ensures we catch Jacks that were already revealed before teleporting
    // Skip if game is already over (victory condition)
    if (!this.gameOver) {
      this._checkJackAdjacentDamage(targetPosition);
    }
    
    // STEP 5: Check game over conditions (death check)
    this._checkGameOver();
    
    // Render update
    this.renderer.render(this.getGameState());
    
    return { success: true, damage: damage };
  }
  
  /**
   * Destroy a tile using King ability
   */
  destroyTile(targetPosition, kingCard) {
    if (this.gameOver) {
      return { success: false, message: 'Game is over' };
    }
    
    const targetTile = this.board.get(`${targetPosition.x},${targetPosition.y}`);
    if (!targetTile) {
      return { success: false, message: 'Tile does not exist' };
    }
    
    const validation = this.rulesEngine.canDestroyTile(kingCard, targetTile, this.player);
    if (!validation.valid) {
      return { success: false, message: validation.reason };
    }
    
    // Remove card from tile (make it empty)
    targetTile.card = null;
    this.player.useKingAbility(kingCard);
    this.turn++;
    
    // Render update
    this.renderer.render(this.getGameState());
    
    return { success: true };
  }
  
  /**
   * Check game over conditions
   */
  _checkGameOver() {
    if (this.player.isDead()) {
      this.gameOver = true;
      this.renderer.onGameOver(false);
    } else if (this.player.hasWon()) {
      this.gameOver = true;
      this.victory = true;
      this.renderer.onGameOver(true);
    }
  }
  
  /**
   * Get current game state (for rendering)
   */
  getGameState() {
    return {
      board: this.board,
      player: this.player,
      turn: this.turn,
      gameOver: this.gameOver,
      victory: this.victory,
      deckSize: this.deckManager.getSize()
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}

