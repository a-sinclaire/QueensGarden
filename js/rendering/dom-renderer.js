/**
 * DOM Renderer
 * Visual renderer for web browser
 * This is a placeholder that can be fully implemented later
 */

class DOMRenderer extends RendererInterface {
  constructor(containerId) {
    super();
    this.container = document.getElementById(containerId);
    this.gameEngine = null;
    this.destroyMode = false;
    this.selectedKing = null;
  }
  
  initialize(gameEngine) {
    this.gameEngine = gameEngine;
    if (!this.container) {
      console.error('Container element not found');
      return;
    }
    // Initialize DOM structure
    this._createDOMStructure();
  }
  
  render(gameState) {
    if (!this.container) return;
    
    // Sync destroy mode state from global variables (if available)
    if (typeof window !== 'undefined' && window.destroyMode !== undefined) {
      this.destroyMode = window.destroyMode;
      this.selectedKing = window.selectedKing || null;
    }
    
    // Update health display
    this._updateHealth(gameState.player.health);
    
    // Update party display
    this._updateParty(gameState.player.party);
    
    // Update collected Kings
    this._updateKings(gameState.player.collectedKings);
    
    // Update board
    this._updateBoard(gameState.board, gameState.player.position);
    
    // Update turn counter
    this._updateTurn(gameState.turn);
    
    // Update game over state
    if (gameState.gameOver) {
      this._showGameOver(gameState.victory);
    }
  }
  
  _createDOMStructure() {
    // This will be implemented with full HTML structure
    // For now, just ensure container exists
  }
  
  _updateHealth(health) {
    const healthEl = document.getElementById('health-display');
    if (healthEl) {
      healthEl.textContent = `Health: ${health}/${GAME_RULES.startingHealth}`;
    }
  }
  
  _updateParty(party) {
    const partyEl = document.getElementById('party-display');
    if (partyEl) {
      partyEl.innerHTML = party.map(q => `<div>${q.toString()}</div>`).join('');
    }
    
    // Update immunities display
    const immunitiesEl = document.getElementById('immunities-display');
    if (immunitiesEl && this.gameEngine) {
      const immunities = this.gameEngine.player.getImmunities();
      immunitiesEl.textContent = immunities.length > 0 
        ? `Immune to: ${immunities.join(', ')}`
        : '';
    }
  }
  
  _updateKings(kings) {
    const kingsEl = document.getElementById('kings-display');
    if (kingsEl) {
      kingsEl.innerHTML = kings.map(k => {
        const used = this.gameEngine && this.gameEngine.player.hasKingAbilityUsed(k);
        const status = used ? ' (used)' : ' (available)';
        return `<div>${k.toString()}${status}</div>`;
      }).join('');
    }
    
    // Show/hide destroy button based on available Kings
    const destroyBtn = document.getElementById('destroy-mode-btn');
    if (destroyBtn && this.gameEngine) {
      const availableKings = kings.filter(k => 
        !this.gameEngine.player.hasKingAbilityUsed(k)
      );
      destroyBtn.style.display = availableKings.length > 0 ? 'block' : 'none';
    }
  }
  
  _updateBoard(board, playerPos) {
    const boardEl = document.getElementById('game-board');
    if (!boardEl) return;
    
    // Find bounds
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    
    for (const [key, tile] of board.entries()) {
      minX = Math.min(minX, tile.x);
      maxX = Math.max(maxX, tile.x);
      minY = Math.min(minY, tile.y);
      maxY = Math.max(maxY, tile.y);
    }
    
    // Expand bounds for visibility
    minX -= 2;
    maxX += 2;
    minY -= 2;
    maxY += 2;
    
    // Clear board
    boardEl.innerHTML = '';
    
    // Get destroyable tiles if in destroy mode
    const destroyableTiles = this.destroyMode && this.selectedKing && this.gameEngine
      ? this._getDestroyableTiles(board, playerPos)
      : [];
    
    // Get teleport destinations if player is on Ace or central chamber
    const teleportDestinations = this._getTeleportDestinations(board, playerPos);
    
    // Get adjacent tiles for tap-to-move highlighting (mobile)
    const adjacentTiles = this._getAdjacentMoveableTiles(board, playerPos);
    
    // Create rows (from top to bottom, y descending)
    for (let y = maxY; y >= minY; y--) {
      const row = document.createElement('div');
      row.className = 'board-row';
      
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        const tile = board.get(key);
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        
        // Add click and touch handlers for mobile support
        const handleTileAction = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.handleTileClick) {
            window.handleTileClick(x, y);
          }
        };
        
        tileEl.addEventListener('click', handleTileAction);
        tileEl.addEventListener('touchend', handleTileAction);
        
        // Check if destroyable (in destroy mode)
        const isDestroyable = destroyableTiles.some(dt => dt.x === x && dt.y === y);
        if (isDestroyable) {
          tileEl.classList.add('destroyable');
          tileEl.style.cursor = 'pointer';
          tileEl.title = 'Click to destroy this tile';
        }
        
        // Check if teleport destination (when on Ace or central chamber)
        const isTeleportDest = teleportDestinations.some(td => td.x === x && td.y === y);
        if (isTeleportDest && !this.destroyMode) {
          tileEl.classList.add('teleport-destination');
          tileEl.style.cursor = 'pointer';
          tileEl.title = 'Click to teleport here';
        }
        
        // Highlight adjacent tiles for tap-to-move (mobile)
        const isAdjacentMoveable = adjacentTiles.some(at => at.x === x && at.y === y);
        if (isAdjacentMoveable && !this.destroyMode && !isTeleportDest) {
          tileEl.classList.add('adjacent-moveable');
          tileEl.title = 'Tap to move here';
        }
        
        // Check if player is here
        if (x === playerPos.x && y === playerPos.y) {
          tileEl.classList.add('player-position');
          const marker = document.createElement('div');
          marker.className = 'tile-player-marker';
          tileEl.appendChild(marker);
        }
        
        if (tile) {
          if (tile.isCentralChamber) {
            tileEl.classList.add('central-chamber');
            tileEl.classList.add('revealed');
            const content = document.createElement('div');
            content.className = 'tile-content';
            content.textContent = 'C';
            tileEl.appendChild(content);
          } else if (tile.card) {
            tileEl.classList.add('revealed');
            const card = tile.card;
            const cardType = card.getType();
            tileEl.classList.add(`card-type-${cardType}`);
            tileEl.classList.add(`suit-${card.suit}`);
            
            const content = document.createElement('div');
            content.className = 'tile-content';
            
            const rankEl = document.createElement('span');
            rankEl.className = 'card-rank';
            rankEl.textContent = this._getRankSymbol(card.rank);
            
            const suitEl = document.createElement('span');
            suitEl.className = 'card-suit';
            suitEl.textContent = this._getSuitSymbol(card.suit);
            
            content.appendChild(rankEl);
            content.appendChild(suitEl);
            tileEl.appendChild(content);
          } else {
            tileEl.classList.add('empty');
            tileEl.classList.add('revealed');
          }
        } else {
          // Unexplored tile
          tileEl.style.opacity = '0.3';
        }
        
        row.appendChild(tileEl);
      }
      
      boardEl.appendChild(row);
    }
  }
  
  /**
   * Get list of teleport destinations (Aces and central chamber)
   * Can only teleport FROM Aces, not from central chamber
   */
  _getTeleportDestinations(board, playerPos) {
    if (!this.gameEngine) {
      return [];
    }
    
    const currentTile = board.get(`${playerPos.x},${playerPos.y}`);
    if (!currentTile) {
      return [];
    }
    
    // Check if player is on Ace (can only teleport FROM Aces, not central chamber)
    const isOnAce = currentTile.card && currentTile.card.getType() === 'ace';
    
    if (!isOnAce) {
      return [];
    }
    
    // Find all Aces and central chamber
    const destinations = [];
    
    for (const [key, tile] of board.entries()) {
      // Skip current position
      if (tile.x === playerPos.x && tile.y === playerPos.y) {
        continue;
      }
      
      // Add central chamber
      if (tile.isCentralChamber) {
        destinations.push({ x: tile.x, y: tile.y });
      }
      // Add Aces
      else if (tile.card && tile.card.getType() === 'ace') {
        destinations.push({ x: tile.x, y: tile.y });
      }
    }
    
    return destinations;
  }
  
  /**
   * Get list of tiles that can be destroyed
   */
  _getDestroyableTiles(board, playerPos) {
    if (!this.gameEngine || !this.selectedKing) {
      return [];
    }
    
    const destroyableTiles = [];
    const adjacentPositions = [
      { x: playerPos.x, y: playerPos.y + 1 },
      { x: playerPos.x, y: playerPos.y - 1 },
      { x: playerPos.x + 1, y: playerPos.y },
      { x: playerPos.x - 1, y: playerPos.y }
    ];
    
    for (const pos of adjacentPositions) {
      const tile = board.get(`${pos.x},${pos.y}`);
      if (tile) {
        const validation = this.gameEngine.rulesEngine.canDestroyTile(
          this.selectedKing, 
          tile, 
          this.gameEngine.player
        );
        if (validation.valid) {
          destroyableTiles.push(pos);
        }
      }
    }
    
    return destroyableTiles;
  }
  
  /**
   * Update destroy mode state
   */
  updateDestroyMode(enabled, king) {
    this.destroyMode = enabled;
    this.selectedKing = king;
  }
  
  _getSuitSymbol(suit) {
    const symbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    return symbols[suit] || '?';
  }
  
  _getRankSymbol(rank) {
    if (typeof rank === 'number') {
      return rank.toString();
    }
    const symbols = {
      'ace': 'A',
      'jack': 'J',
      'queen': 'Q',
      'king': 'K',
      'ten': '10'
    };
    return symbols[rank] || '?';
  }
  
  _updateTurn(turn) {
    const turnEl = document.getElementById('turn-display');
    if (turnEl) {
      turnEl.textContent = `Turn: ${turn}`;
    }
    
    // Update deck size
    const deckEl = document.getElementById('deck-size');
    if (deckEl && this.gameEngine) {
      deckEl.textContent = `Deck: ${this.gameEngine.deckManager.getSize()}`;
    }
  }
  
  _showGameOver(victory) {
    const gameOverEl = document.getElementById('game-over');
    const titleEl = document.getElementById('game-over-title');
    if (gameOverEl) {
      gameOverEl.style.display = 'flex';
      if (titleEl) {
        titleEl.textContent = victory ? '🎉 Victory! 🎉' : '💀 Game Over 💀';
      }
    }
  }
  
  onDamage(amount, newHealth, source = null) {
    // Show damage animation/notification
    const damageEl = document.getElementById('damage-notification');
    if (damageEl) {
      damageEl.textContent = `-${amount} ${source ? `(${source})` : ''}`;
      damageEl.style.display = 'block';
      setTimeout(() => {
        damageEl.style.display = 'none';
      }, 2000);
    }
  }
  
  onQueenCollected(queen) {
    // Show collection notification
    const notificationEl = document.getElementById('collection-notification');
    if (notificationEl) {
      notificationEl.textContent = `Collected ${queen.toString()}!`;
      notificationEl.style.display = 'block';
      setTimeout(() => {
        notificationEl.style.display = 'none';
      }, 3000);
    }
  }
  
  onKingCollected(king) {
    // Show King collection notification
    const notificationEl = document.getElementById('collection-notification');
    if (notificationEl) {
      notificationEl.textContent = `Collected ${king.toString()}!`;
      notificationEl.style.display = 'block';
      setTimeout(() => {
        notificationEl.style.display = 'none';
      }, 3000);
    }
  }
  
  onGameOver(victory) {
    this._showGameOver(victory);
  }
  
  highlightValidMoves(positions) {
    // Highlight valid move positions on board
    // Implementation for visual feedback
  }
  
  clearHighlights() {
    // Clear all highlights
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMRenderer;
}

