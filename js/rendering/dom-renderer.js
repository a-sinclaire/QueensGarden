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
    // Cache-bust color for debugging (changes with each deployment)
    this.cacheBustColor = this._getCacheBustColor();
  }
  
  /**
   * Generate a color from cache-bust value for debugging
   * @private
   */
  _getCacheBustColor() {
    // Try to extract cache-bust value from script tags
    const scripts = document.querySelectorAll('script[src*="?cb="]');
    let cacheBust = 'default';
    if (scripts.length > 0) {
      const src = scripts[0].getAttribute('src');
      const match = src.match(/[?&]cb=([^&"']+)/);
      if (match) {
        cacheBust = match[1];
      }
    }
    
    // Simple hash function to convert string to color
    let hash = 0;
    for (let i = 0; i < cacheBust.length; i++) {
      hash = cacheBust.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate RGB values (bright colors for visibility)
    const r = (hash & 0xFF0000) >> 16;
    const g = (hash & 0x00FF00) >> 8;
    const b = hash & 0x0000FF;
    
    // Ensure minimum brightness
    const minBrightness = 100;
    const finalR = Math.max(r, minBrightness);
    const finalG = Math.max(g, minBrightness);
    const finalB = Math.max(b, minBrightness);
    
    return `rgb(${finalR}, ${finalG}, ${finalB})`;
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
    
    // Update board first (needed for destroy mode state)
    this._updateBoard(gameState.board, gameState.player.position);
    
    // Update mobile HUD (after board to sync destroy mode state)
    this._updateMobileHUD(gameState.player);
    
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
    
    // Create debug overlay
    const gameArea = document.querySelector('.game-area');
    if (gameArea && !document.getElementById('debug-deadzone')) {
      const debugOverlay = document.createElement('div');
      debugOverlay.id = 'debug-deadzone';
      debugOverlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px dashed rgba(255, 0, 0, 0.5);
        z-index: 10000;
        display: none;
      `;
      gameArea.appendChild(debugOverlay);
    }
    
    // Force debug panel to be visible on mobile (in case CSS is cached)
    if (window.innerWidth <= 768) {
      const debugPanel = document.getElementById('mobile-debug');
      if (debugPanel) {
        debugPanel.style.display = 'block';
        debugPanel.style.visibility = 'visible';
        debugPanel.style.opacity = '1';
        debugPanel.style.zIndex = '9999';
        debugPanel.style.position = 'fixed';
        debugPanel.style.bottom = '10px';
        debugPanel.style.left = '10px';
        debugPanel.style.right = '10px';
        debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        debugPanel.style.border = '2px solid #ffd700';
        debugPanel.style.borderRadius = '8px';
        debugPanel.style.padding = '0.5rem';
        debugPanel.style.fontSize = '0.65rem';
        debugPanel.style.color = '#fff';
        debugPanel.style.maxHeight = '200px';
        debugPanel.style.overflowY = 'auto';
        debugPanel.style.pointerEvents = 'auto';
        console.log('Debug panel forced visible');
      } else {
        console.warn('Debug panel element not found!');
      }
    }
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
  
  /**
   * Update mobile HUD (health, party, and kings display)
   */
  _updateMobileHUD(player) {
    // Update mobile health display
    const mobileHealthEl = document.getElementById('mobile-health-value');
    if (mobileHealthEl) {
      mobileHealthEl.textContent = `${player.health}/${GAME_RULES.startingHealth}`;
    }
    
    // Update mobile party display (compact suit display - Queens only)
    const mobilePartyEl = document.getElementById('mobile-party-suits');
    if (mobilePartyEl && this.gameEngine && this.gameEngine.startingQueen) {
      // Get starting queen suit (own suit)
      const ownSuit = this.gameEngine.startingQueen.suit;
      
      // Only show Queens in party
      const partySuits = player.party.map(q => ({ suit: q.suit }));
      
      // Sort: own suit first, then others
      partySuits.sort((a, b) => {
        if (a.suit === ownSuit) return -1;
        if (b.suit === ownSuit) return 1;
        return 0;
      });
      
      // Render suits
      mobilePartyEl.innerHTML = partySuits.map(item => {
        const suitSymbol = this._getSuitSymbol(item.suit);
        const isOwn = item.suit === ownSuit;
        return `<span class="party-suit ${isOwn ? 'own-suit' : ''}" title="Queen of ${item.suit}">${suitSymbol}</span>`;
      }).join('');
      
      // If no party, show placeholder
      if (partySuits.length === 0) {
        mobilePartyEl.innerHTML = '<span style="opacity: 0.5; font-size: 0.8rem;">None</span>';
      }
    }
    
    // Update mobile kings display
    const mobileKingsEl = document.getElementById('mobile-kings-suits');
    const mobileKingsCountEl = document.getElementById('mobile-kings-count');
    const mobileDestroyBtn = document.getElementById('mobile-destroy-btn');
    
    if (mobileKingsEl && this.gameEngine) {
      // Show Kings as suits
      const kingSuits = player.collectedKings.map(k => k.suit);
      
      // Render king suits
      mobileKingsEl.innerHTML = kingSuits.map(suit => {
        const suitSymbol = this._getSuitSymbol(suit);
        return `<span class="kings-suit" title="King of ${suit}">${suitSymbol}</span>`;
      }).join('');
      
      // If no kings, show placeholder
      if (kingSuits.length === 0) {
        mobileKingsEl.innerHTML = '<span style="opacity: 0.5; font-size: 0.8rem;">None</span>';
      }
      
      // Update bomb count (available destroy abilities)
      if (mobileKingsCountEl) {
        const totalKings = player.collectedKings.length;
        const usedKings = player.collectedKings.filter(k => 
          this.gameEngine.player.hasKingAbilityUsed(k)
        ).length;
        const availableKings = totalKings - usedKings;
        mobileKingsCountEl.textContent = `${availableKings}/${totalKings}`;
        mobileKingsCountEl.title = `${availableKings} destroy ability${availableKings !== 1 ? 'ies' : ''} available. Tap and hold adjacent tiles to destroy.`;
      }
      
      // Destroy button is hidden - using tap and hold instead
      if (mobileDestroyBtn) {
        mobileDestroyBtn.style.display = 'none';
      }
    }
  }
  
  _updateBoard(board, playerPos) {
    const boardEl = document.getElementById('game-board');
    if (!boardEl) return;
    
    // Fixed 20x20 grid bounds (10 in each direction from center)
    // Always render the full fixed grid - never changes size
    const BOARD_SIZE = 10; // 10 in each direction = 20x20 total
    const minX = -BOARD_SIZE;
    const maxX = BOARD_SIZE;
    const minY = -BOARD_SIZE;
    const maxY = BOARD_SIZE;
    
    // Always render the full fixed grid (never changes)
    const renderMinX = minX;
    const renderMaxX = maxX;
    const renderMinY = minY;
    const renderMaxY = maxY;
    
    // Find all revealed tiles (tiles that exist in the board)
    const revealedTiles = new Set();
    for (const [key, tile] of board.entries()) {
      if (tile) {
        revealedTiles.add(key);
      }
    }
    
    // Calculate which tiles should be populated (revealed + 2-tile buffer)
    const tilesToPopulate = new Set();
    
    // If no revealed tiles yet, start with player position as the "revealed" area
    if (revealedTiles.size === 0) {
      revealedTiles.add(`${playerPos.x},${playerPos.y}`);
    }
    
    for (const key of revealedTiles) {
      const [x, y] = key.split(',').map(Number);
      // Add revealed tile
      tilesToPopulate.add(key);
      // Add tiles within 2 tiles in all directions (buffer zone)
      // This creates a 5x5 area (2 tiles on each side + center)
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const bufferX = x + dx;
          const bufferY = y + dy;
          // Only add if within grid bounds
          if (bufferX >= minX && bufferX <= maxX && bufferY >= minY && bufferY <= maxY) {
            tilesToPopulate.add(`${bufferX},${bufferY}`);
          }
        }
      }
    }
    
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
    
    // Calculate tile dimensions and spacing
    const tileWidth = window.innerWidth <= 480 ? 65 : 70;
    const tileHeight = window.innerWidth <= 480 ? 85 : 90;
    const gap = 2; // Gap between tiles
    const totalTileWidth = tileWidth + gap;
    const totalTileHeight = tileHeight + gap;
    
    // Calculate row width based on render bounds
    const rowWidth = (renderMaxX - renderMinX + 1) * totalTileWidth;
    
    // Get container padding to calculate total width needed
    const computedStyle = window.getComputedStyle(boardEl);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    
    // Set container width to row width + padding to ensure it's wide enough for horizontal scrolling
    // This ensures the container is exactly as wide as needed, enabling left/right scrolling
    const totalContainerWidth = rowWidth + paddingLeft + paddingRight;
    boardEl.style.width = `${totalContainerWidth}px`;
    boardEl.style.minWidth = `${totalContainerWidth}px`;
    
    // Create rows (from top to bottom, y descending)
    // Render all tiles in the render bounds (revealed tiles + buffer)
    for (let y = renderMaxY; y >= renderMinY; y--) {
      const row = document.createElement('div');
      row.className = 'board-row';
      row.style.width = `${rowWidth}px`;
      
      for (let x = renderMinX; x <= renderMaxX; x++) {
        const key = `${x},${y}`;
        const tile = board.get(key);
        
        // Only create DOM element if tile should be populated (revealed or within buffer)
        const shouldPopulate = tilesToPopulate.has(key);
        if (!shouldPopulate) {
          // Create invisible spacer to maintain grid structure without rendering content
          const spacer = document.createElement('div');
          spacer.style.width = `${tileWidth}px`;
          spacer.style.height = `${tileHeight}px`;
          spacer.style.flexShrink = '0';
          spacer.style.visibility = 'hidden'; // Takes up space but invisible
          row.appendChild(spacer);
          continue;
        }
        
        // Create tile element for revealed tiles or buffer zone tiles
        const tileEl = document.createElement('div');
        tileEl.className = 'tile';
        
        // Add click and touch handlers for mobile support
        let touchStartTime = null;
        let touchTimer = null;
        let isLongPress = false;
        
        const handleTileAction = (e) => {
          // Don't handle if it was a long press
          if (isLongPress) {
            isLongPress = false;
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          if (window.handleTileClick) {
            window.handleTileClick(x, y);
          }
        };
        
        // Touch start - begin long press timer
        let touchStartPos = null;
        tileEl.addEventListener('touchstart', (e) => {
          const touch = e.touches[0];
          touchStartPos = { x: touch.clientX, y: touch.clientY };
          touchStartTime = Date.now();
          isLongPress = false;
          
          // Check if this tile is destroyable (adjacent to player)
          if (this.gameEngine && !this.destroyMode) {
            const playerPos = this.gameEngine.player.position;
            const isAdjacent = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) === 1;
            
            if (isAdjacent) {
              // Start long press timer (500ms)
              touchTimer = setTimeout(() => {
                isLongPress = true;
                
                // Check if player has available Kings
                const availableKings = this.gameEngine.player.collectedKings.filter(king => 
                  !this.gameEngine.player.hasKingAbilityUsed(king)
                );
                
                if (availableKings.length > 0) {
                  // Activate destroy mode
                  if (window.toggleDestroyMode) {
                    window.toggleDestroyMode();
                  }
                  
                  // Provide haptic feedback if available
                  if (navigator.vibrate) {
                    navigator.vibrate(50);
                  }
                  
                  // Visual feedback
                  tileEl.style.transform = 'scale(1.1)';
                  tileEl.style.transition = 'transform 0.1s';
                  
                  // After activating, handle the tile click for destroy
                  setTimeout(() => {
                    if (window.handleTileClick) {
                      window.handleTileClick(x, y);
                    }
                  }, 100);
                }
              }, 500); // 500ms hold time
            }
          }
        }, { passive: true });
        
        // Touch end - cancel timer if released early
        tileEl.addEventListener('touchend', (e) => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
          
          // Check if this was a tap by comparing start/end positions
          let wasTap = false;
          if (touchStartPos && e.changedTouches[0]) {
            const touch = e.changedTouches[0];
            const moveX = Math.abs(touch.clientX - touchStartPos.x);
            const moveY = Math.abs(touch.clientY - touchStartPos.y);
            // Only treat as tap if moved less than 10px (allows for small finger movement)
            wasTap = moveX < 10 && moveY < 10;
          }
          
          // Only handle as normal tap if not a long press and it was actually a tap
          if (!isLongPress && touchStartTime && (Date.now() - touchStartTime) < 500 && wasTap) {
            handleTileAction(e);
          }
          
          touchStartTime = null;
          touchStartPos = null;
        });
        
        // Touch cancel - cleanup
        tileEl.addEventListener('touchcancel', () => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
          touchStartTime = null;
          touchStartPos = null;
          isLongPress = false;
        });
        
        // Click handler for desktop
        tileEl.addEventListener('click', handleTileAction);
        
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
          // Apply cache-bust color for debugging (changes with each deployment)
          marker.style.backgroundColor = this.cacheBustColor;
          marker.style.borderColor = this.cacheBustColor;
          tileEl.appendChild(marker);
        }
        
        // Check if this tile exists in the board (all tiles in board are revealed)
        const isRevealed = tile !== undefined && tile !== null;
        
        if (isRevealed) {
          // This tile has been explored/revealed
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
            // Empty revealed tile
            tileEl.classList.add('empty');
            tileEl.classList.add('revealed');
          }
        } else {
          // Unexplored tile within render bounds (buffer zone)
          // Show subtle border so grid is visible but clearly unexplored
          tileEl.style.opacity = '0.3';
          tileEl.style.border = '1px solid rgba(83, 52, 131, 0.3)';
        }
        
        row.appendChild(tileEl);
      }
      
      boardEl.appendChild(row);
    }
    
    // Add debug rectangle showing board boundaries (21x21 grid from -10 to +10)
    this._addBoardBoundaryDebug(boardEl, renderMinX, renderMaxX, renderMinY, renderMaxY, totalTileWidth, totalTileHeight);
    
  }
  
  /**
   * Get list of adjacent tiles that can be moved to
   */
  _getAdjacentMoveableTiles(board, playerPos) {
    if (!this.gameEngine) {
      return [];
    }
    
    const adjacentPositions = [
      { x: playerPos.x, y: playerPos.y + 1 },   // North
      { x: playerPos.x, y: playerPos.y - 1 },   // South
      { x: playerPos.x + 1, y: playerPos.y },   // East
      { x: playerPos.x - 1, y: playerPos.y }     // West
    ];
    
    const moveableTiles = [];
    
    for (const pos of adjacentPositions) {
      const tile = board.get(`${pos.x},${pos.y}`);
      if (tile) {
        // Check if move is valid
        const validation = this.gameEngine.rulesEngine.canMove(
          playerPos,
          pos,
          board,
          this.gameEngine.player
        );
        if (validation.valid) {
          moveableTiles.push(pos);
        }
      }
    }
    
    return moveableTiles;
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
  
  /**
   * Add debug rectangle showing board boundaries
   * @private
   */
  _addBoardBoundaryDebug(boardEl, minX, maxX, minY, maxY, totalTileWidth, totalTileHeight) {
    // Remove existing debug rectangle if present
    const existingDebug = boardEl.querySelector('.board-boundary-debug');
    if (existingDebug) {
      existingDebug.remove();
    }
    
    // Calculate board dimensions (21x21 tiles from -10 to +10)
    const boardWidth = (maxX - minX + 1) * totalTileWidth;
    const boardHeight = (maxY - minY + 1) * totalTileHeight;
    
    // Get container padding to account for it in positioning
    const computedStyle = window.getComputedStyle(boardEl);
    const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
    
    // Calculate position - board starts at top-left of first row, accounting for padding
    // Rows are rendered from maxY down to minY, so top row is at y=maxY
    // The debug rectangle should outline the entire grid area
    // Position it exactly where the rows start (after padding)
    const debugRect = document.createElement('div');
    debugRect.className = 'board-boundary-debug';
    debugRect.style.cssText = `
      position: absolute;
      top: ${paddingTop}px;
      left: ${paddingLeft}px;
      width: ${boardWidth}px;
      height: ${boardHeight}px;
      border: 3px solid #ff0000;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 1000;
      background: transparent;
    `;
    
    // Debug info: log container and board dimensions
    console.log('Board Debug:', {
      containerWidth: boardEl.offsetWidth,
      containerScrollWidth: boardEl.scrollWidth,
      rowWidth: rowWidth,
      boardWidth: boardWidth,
      padding: { top: paddingTop, left: paddingLeft, right: paddingRight, bottom: paddingBottom },
      viewportWidth: window.innerWidth
    });
    
    // Add corner markers for easier visualization
    const corners = [
      { top: '0', left: '0', label: `(${minX},${maxY})` },
      { top: '0', right: '0', left: 'auto', label: `(${maxX},${maxY})` },
      { bottom: '0', left: '0', top: 'auto', label: `(${minX},${minY})` },
      { bottom: '0', right: '0', top: 'auto', left: 'auto', label: `(${maxX},${minY})` }
    ];
    
    corners.forEach((corner, index) => {
      const marker = document.createElement('div');
      marker.style.cssText = `
        position: absolute;
        ${corner.top !== undefined ? `top: ${corner.top};` : ''}
        ${corner.bottom !== undefined ? `bottom: ${corner.bottom};` : ''}
        ${corner.left !== undefined ? `left: ${corner.left};` : ''}
        ${corner.right !== undefined ? `right: ${corner.right};` : ''}
        width: 20px;
        height: 20px;
        background: rgba(255, 0, 0, 0.5);
        border: 2px solid #ff0000;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: #fff;
        font-weight: bold;
      `;
      marker.textContent = corner.label;
      debugRect.appendChild(marker);
    });
    
    // Add center marker (0,0)
    const centerMarker = document.createElement('div');
    centerMarker.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 30px;
      height: 30px;
      background: rgba(0, 255, 0, 0.5);
      border: 2px solid #00ff00;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1001;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #fff;
      font-weight: bold;
    `;
    centerMarker.textContent = '(0,0)';
    debugRect.appendChild(centerMarker);
    
    boardEl.appendChild(debugRect);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMRenderer;
}

// Make available globally for script tag usage
if (typeof window !== 'undefined') {
  window.DOMRenderer = DOMRenderer;
}

