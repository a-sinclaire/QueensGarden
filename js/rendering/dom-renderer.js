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
    // Track existing tile elements by coordinate for in-place updates
    this.tileElements = new Map(); // key: "x,y" -> tile element
    this.rowElements = new Map(); // key: y -> row element
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
    // Reset render tracking for centering on new game
    this._hasRendered = false;
    // Clear tile/row element tracking
    this.tileElements.clear();
    this.rowElements.clear();
    
    // Clear the board DOM completely for new game
    const boardEl = document.getElementById('game-board');
    if (boardEl) {
      boardEl.innerHTML = '';
    }
  }
  
  render(gameState) {
    if (!this.container) return;
    
    // Track if this is the first render (for centering on central chamber)
    const isFirstRender = !this._hasRendered;
    this._hasRendered = true;
    
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
    
    // Center board on central chamber on first render (game start/reset/refresh)
    if (isFirstRender) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        this._centerBoardOnCentralChamber();
      }, 0);
    }
    
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
    
    // Hide mobile debug panel
    const debugPanel = document.getElementById('mobile-debug');
    if (debugPanel) {
      debugPanel.style.display = 'none';
    }
  }
  
  _updateHealth(health) {
    const healthEl = document.getElementById('health-display');
    if (healthEl) {
      healthEl.textContent = `Health: ${health}`;
    }
  }
  
  _updateParty(party) {
    const partyEl = document.getElementById('party-display');
    if (partyEl) {
      partyEl.innerHTML = '';
      party.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.textContent = `${card.rank} of ${card.suit}`;
        partyEl.appendChild(cardEl);
      });
    }
  }
  
  _updateKings(kings) {
    const kingsEl = document.getElementById('kings-display');
    if (kingsEl) {
      kingsEl.innerHTML = '';
      kings.forEach(king => {
        const kingEl = document.createElement('div');
        kingEl.textContent = `${king.rank} of ${king.suit}`;
        kingsEl.appendChild(kingEl);
      });
    }
  }
  
  _updateTurn(turn) {
    const turnEl = document.getElementById('turn-display');
    if (turnEl) {
      turnEl.textContent = `Turn: ${turn}`;
    }
  }
  
  /**
   * Get or create a row element for the given y coordinate
   * @private
   */
  _getOrCreateRow(boardEl, y, rowWidth) {
    let row = this.rowElements.get(y);
    if (!row) {
      row = document.createElement('div');
      row.className = 'board-row';
      row.style.width = `${rowWidth}px`;
      row.dataset.y = y.toString();
      
      // Insert row in correct Y order (higher Y values first, since we render top to bottom)
      // Find the first row with a lower Y value to insert before
      const insertBefore = Array.from(boardEl.children).find(child => {
        const childY = parseInt(child.dataset.y || '999');
        return childY < y; // Insert before rows with lower Y
      });
      
      if (insertBefore) {
        boardEl.insertBefore(row, insertBefore);
      } else {
        boardEl.appendChild(row);
      }
      
      this.rowElements.set(y, row);
    }
    return row;
  }
  
  /**
   * Get or create a tile element for the given coordinates
   * @private
   */
  _getOrCreateTile(row, x, y, tileWidth, tileHeight) {
    const key = `${x},${y}`;
    let tileEl = this.tileElements.get(key);
    
    if (!tileEl) {
      // Create new tile element
      tileEl = document.createElement('div');
      tileEl.className = 'tile';
      tileEl.dataset.x = x.toString();
      tileEl.dataset.y = y.toString();
      tileEl.style.width = `${tileWidth}px`;
      tileEl.style.height = `${tileHeight}px`;
      tileEl.style.flexShrink = '0'; // Prevent shrinking
      
      // Add event listeners once (only on creation)
      this._attachTileEventListeners(tileEl, x, y);
      
      // Insert tile in correct X order (left to right)
      // Find the first tile/spacer with a higher X value to insert before
      const insertBefore = Array.from(row.children).find(child => {
        const childX = parseInt(child.dataset.x || '999');
        return childX > x; // Insert before tiles/spacers with higher X
      });
      
      if (insertBefore) {
        row.insertBefore(tileEl, insertBefore);
      } else {
        row.appendChild(tileEl);
      }
      
      this.tileElements.set(key, tileEl);
    }
    
    return tileEl;
  }
  
  /**
   * Attach event listeners to a tile element (only called once on creation)
   * @private
   */
  _attachTileEventListeners(tileEl, x, y) {
    let touchStartTime = null;
    let touchTimer = null;
    let isLongPress = false;
    let touchStartPos = null;
    let hasMoved = false;
    
    const handleTileAction = (e) => {
      // Don't handle if it was a long press
      if (isLongPress) {
        isLongPress = false;
        return;
      }
      // Don't prevent default - allow native scrolling to work
      // Only stop propagation to prevent event bubbling
      e.stopPropagation();
      if (window.handleTileClick) {
        window.handleTileClick(x, y);
      }
    };
    
    // Touch start - begin long press timer
    tileEl.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      touchStartTime = Date.now();
      isLongPress = false;
      hasMoved = false;
      
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
    
    // Touch move - detect if user is scrolling (not tapping)
    tileEl.addEventListener('touchmove', (e) => {
      if (touchStartPos && e.touches[0]) {
        const touch = e.touches[0];
        const moveX = Math.abs(touch.clientX - touchStartPos.x);
        const moveY = Math.abs(touch.clientY - touchStartPos.y);
        // If moved more than 10px, user is scrolling, not tapping
        if (moveX > 10 || moveY > 10) {
          hasMoved = true;
          // Cancel long press timer if scrolling
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
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
      
      // Only handle as normal tap if not a long press, not scrolling, and it was actually a tap
      if (!isLongPress && !hasMoved && touchStartTime && (Date.now() - touchStartTime) < 500 && wasTap) {
        handleTileAction(e);
      }
      
      touchStartTime = null;
      touchStartPos = null;
      hasMoved = false;
    }, { passive: true });
    
    // Touch cancel - cleanup
    tileEl.addEventListener('touchcancel', () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
      touchStartTime = null;
      touchStartPos = null;
      hasMoved = false;
      isLongPress = false;
    }, { passive: true });
    
    // Click handler for desktop
    tileEl.addEventListener('click', handleTileAction);
  }
  
  /**
   * Update a tile element's visual state (classes, content, etc.)
   * @private
   */
  _updateTileElement(tileEl, tile, x, y, playerPos, destroyableTiles, teleportDestinations, adjacentTiles) {
    // Reset all state classes
    tileEl.className = 'tile';
    tileEl.style.opacity = '';
    tileEl.style.border = '';
    tileEl.style.cursor = '';
    tileEl.title = '';
    
    // Remove player marker if it exists
    const existingMarker = tileEl.querySelector('.tile-player-marker');
    if (existingMarker) {
      existingMarker.remove();
    }
    
    // Remove tile content if it exists
    const existingContent = tileEl.querySelector('.tile-content');
    if (existingContent) {
      existingContent.remove();
    }
    
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
    // CSS gap is only BETWEEN tiles, so: numTiles * tileWidth + (numTiles - 1) * gap
    const numTilesPerRow = renderMaxX - renderMinX + 1;
    const rowWidth = (numTilesPerRow * tileWidth) + ((numTilesPerRow - 1) * gap);
    
    // Update rows and tiles in place (no clearing!)
    // Render ALL tiles in the fixed grid bounds (not just buffer zone)
    // This ensures the grid structure is always complete for scrolling
    for (let y = renderMaxY; y >= renderMinY; y--) {
      const row = this._getOrCreateRow(boardEl, y, rowWidth);
      
      for (let x = renderMinX; x <= renderMaxX; x++) {
        const key = `${x},${y}`;
        const tile = board.get(key);
        
        // Only populate content if tile should be visible (revealed or within buffer)
        const shouldPopulate = tilesToPopulate.has(key);
        if (!shouldPopulate) {
          // Create invisible spacer to maintain grid structure without rendering content
          // Remove tile if it exists and replace with spacer
          if (this.tileElements.has(key)) {
            const existingTileEl = this.tileElements.get(key);
            existingTileEl.remove();
            this.tileElements.delete(key);
          }
          // Check if spacer already exists
          const existingSpacer = Array.from(row.children).find(child => 
            child.dataset.x === x.toString() && child.dataset.y === y.toString() && child.style.visibility === 'hidden'
          );
          if (!existingSpacer) {
            const spacer = document.createElement('div');
            spacer.style.width = `${tileWidth}px`;
            spacer.style.height = `${tileHeight}px`;
            spacer.style.flexShrink = '0';
            spacer.style.visibility = 'hidden';
            spacer.dataset.x = x.toString();
            spacer.dataset.y = y.toString();
            // Insert spacer at correct position
            const insertBefore = Array.from(row.children).find(child => {
              const childX = parseInt(child.dataset.x || '999');
              return childX > x;
            });
            if (insertBefore) {
              row.insertBefore(spacer, insertBefore);
            } else {
              row.appendChild(spacer);
            }
          }
          continue;
        }
        
        // Tile should be populated - remove spacer if it exists
        const existingSpacer = Array.from(row.children).find(child => 
          child.dataset.x === x.toString() && child.dataset.y === y.toString() && child.style.visibility === 'hidden'
        );
        if (existingSpacer) {
          existingSpacer.remove();
        }
        
        // Get or create tile element (will create if it doesn't exist)
        const tileEl = this._getOrCreateTile(row, x, y, tileWidth, tileHeight);
        
        // Show tile and update visual state
        this._updateTileElement(tileEl, tile, x, y, playerPos, destroyableTiles, teleportDestinations, adjacentTiles);
      }
    }
    
    // Debug rectangle disabled - uncomment to enable
    // this._addBoardBoundaryDebug(boardEl, renderMinX, renderMaxX, renderMinY, renderMaxY, tileWidth, tileHeight, gap, rowWidth);
    
    // No need to restore scroll position - we never cleared the DOM!
  }
  
  /**
   * Get list of adjacent tiles that can be moved to
   * @private
   */
  _getAdjacentMoveableTiles(board, playerPos) {
    if (!this.gameEngine) {
      return [];
    }
    
    const adjacentTiles = [];
    const directions = [
      { x: 0, y: 1, name: 'north' },
      { x: 0, y: -1, name: 'south' },
      { x: 1, y: 0, name: 'east' },
      { x: -1, y: 0, name: 'west' }
    ];
    
    for (const dir of directions) {
      const newX = playerPos.x + dir.x;
      const newY = playerPos.y + dir.y;
      const tile = board.get(`${newX},${newY}`);
      
      if (tile) {
        adjacentTiles.push({ x: newX, y: newY });
      }
    }
    
    return adjacentTiles;
  }
  
  /**
   * Get list of destroyable tiles (adjacent to player)
   * @private
   */
  _getDestroyableTiles(board, playerPos) {
    if (!this.selectedKing || !this.gameEngine) {
      return [];
    }
    
    const destroyableTiles = [];
    const directions = [
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: -1, y: 0 }
    ];
    
    for (const dir of directions) {
      const x = playerPos.x + dir.x;
      const y = playerPos.y + dir.y;
      const tile = board.get(`${x},${y}`);
      
      if (tile && tile.card) {
        destroyableTiles.push({ x, y });
      }
    }
    
    return destroyableTiles;
  }
  
  /**
   * Get list of teleport destinations (Aces and central chamber)
   * Can only teleport FROM Aces, not from central chamber
   * @private
   */
  _getTeleportDestinations(board, playerPos) {
    if (!this.gameEngine) {
      return [];
    }
    
    const playerTile = board.get(`${playerPos.x},${playerPos.y}`);
    if (!playerTile || !playerTile.card) {
      return [];
    }
    
    // Check if player is on Ace (can only teleport FROM Aces, not central chamber)
    const isOnAce = playerTile.card.getType() === 'ace';
    if (!isOnAce) {
      return [];
    }
    
    // Find all Aces and central chamber
    const destinations = [];
    for (const [key, tile] of board.entries()) {
      if (tile) {
        const [x, y] = key.split(',').map(Number);
        
        // Skip current position
        if (x === playerPos.x && y === playerPos.y) {
          continue;
        }
        
        // Add central chamber
        if (tile.isCentralChamber) {
          destinations.push({ x, y });
        }
        // Add other Aces
        else if (tile.card && tile.card.getType() === 'ace') {
          destinations.push({ x, y });
        }
      }
    }
    
    return destinations;
  }
  
  /**
   * Update mobile HUD display
   * @private
   */
  _updateMobileHUD(player) {
    // Update mobile health display
    const mobileHealthValueEl = document.getElementById('mobile-health-value');
    if (mobileHealthValueEl) {
      mobileHealthValueEl.textContent = `${player.health}/20`;
    }
    
    // Update mobile party suits display
    const mobilePartySuitsEl = document.getElementById('mobile-party-suits');
    if (mobilePartySuitsEl) {
      mobilePartySuitsEl.innerHTML = '';
      if (player.party && player.party.length > 0) {
        // Get player's starting suit (own suit) if available
        const ownSuit = player.startingQueen ? player.startingQueen.suit : null;
        
        player.party.forEach(queen => {
          const suitEl = document.createElement('span');
          suitEl.className = 'party-suit';
          if (ownSuit && queen.suit === ownSuit) {
            suitEl.classList.add('own-suit');
          }
          suitEl.textContent = this._getSuitSymbol(queen.suit);
          suitEl.title = `${queen.rank} of ${queen.suit}`;
          mobilePartySuitsEl.appendChild(suitEl);
        });
      }
    }
    
    // Update mobile Kings suits display
    const mobileKingsSuitsEl = document.getElementById('mobile-kings-suits');
    if (mobileKingsSuitsEl) {
      mobileKingsSuitsEl.innerHTML = '';
      if (player.collectedKings && player.collectedKings.length > 0) {
        player.collectedKings.forEach(king => {
          const suitEl = document.createElement('span');
          suitEl.className = 'kings-suit';
          suitEl.textContent = this._getSuitSymbol(king.suit);
          suitEl.title = `${king.rank} of ${king.suit}`;
          if (this.gameEngine && this.gameEngine.player.hasKingAbilityUsed(king)) {
            suitEl.style.opacity = '0.5'; // Dim used kings
          }
          mobileKingsSuitsEl.appendChild(suitEl);
        });
      }
    }
    
    // Update mobile Kings count
    const mobileKingsCountEl = document.getElementById('mobile-kings-count');
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
    const mobileDestroyBtn = document.getElementById('mobile-destroy-btn');
    if (mobileDestroyBtn) {
      mobileDestroyBtn.style.display = 'none';
    }
  }
  
  /**
   * Center the board viewport on the central chamber (0,0)
   * Called on game start, reset, and page refresh
   * @private
   */
  _centerBoardOnCentralChamber() {
    const boardEl = document.getElementById('game-board');
    if (!boardEl) return;
    
    // Find the central chamber tile (at 0,0)
    const centralChamberTile = boardEl.querySelector('.tile.central-chamber');
    if (!centralChamberTile) {
      // If central chamber doesn't exist yet, try again after a short delay
      setTimeout(() => this._centerBoardOnCentralChamber(), 100);
      return;
    }
    
    // Use scrollIntoView for reliable centering - simpler and more reliable
    // This centers the element both horizontally and vertically within its scrollable container
    centralChamberTile.scrollIntoView({
      behavior: 'auto', // Instant scroll
      block: 'center',  // Center vertically
      inline: 'center'  // Center horizontally
    });
    
    // Debug info
    setTimeout(() => {
      const tileRect = centralChamberTile.getBoundingClientRect();
      const containerRect = boardEl.getBoundingClientRect();
      console.log('Center Board Debug:', {
        tileRect: { left: tileRect.left, top: tileRect.top, width: tileRect.width, height: tileRect.height },
        containerRect: { left: containerRect.left, top: containerRect.top, width: containerRect.width, height: containerRect.height },
        scrollPosition: { left: boardEl.scrollLeft, top: boardEl.scrollTop },
        containerSize: { width: boardEl.clientWidth, height: boardEl.clientHeight },
        containerScrollSize: { width: boardEl.scrollWidth, height: boardEl.scrollHeight },
        tileCenterInViewport: {
          x: tileRect.left + tileRect.width / 2,
          y: tileRect.top + tileRect.height / 2
        },
        containerCenterInViewport: {
          x: containerRect.left + containerRect.width / 2,
          y: containerRect.top + containerRect.height / 2
        }
      });
    }, 10);
  }
  
  /**
   * Show game over screen
   * @private
   */
  _showGameOver(victory) {
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) {
      gameOverEl.style.display = 'flex';
      const messageEl = document.getElementById('game-over-title');
      if (messageEl) {
        messageEl.textContent = victory ? 'Victory!' : 'Game Over';
      }
    }
  }
  
  onGameOver(victory) {
    this._showGameOver(victory);
  }
  
  clearHighlights() {
    // Clear all highlights
  }
  
  /**
   * Add debug rectangle showing board boundaries
   * @private
   */
  _addBoardBoundaryDebug(boardEl, minX, maxX, minY, maxY, tileWidth, tileHeight, gap, rowWidth) {
    // Remove existing debug rectangle if present
    const existingDebug = boardEl.querySelector('.board-boundary-debug');
    if (existingDebug) {
      existingDebug.remove();
    }
    
    // Calculate board dimensions (21x21 tiles from -10 to +10)
    // CSS gap is only BETWEEN tiles, not at edges
    // So: numTiles * tileSize + (numTiles - 1) * gap
    const numTilesX = maxX - minX + 1; // 21 tiles
    const numTilesY = maxY - minY + 1; // 21 tiles
    const numGapsX = numTilesX - 1; // 20 gaps
    const numGapsY = numTilesY - 1; // 20 gaps
    const boardWidth = (numTilesX * tileWidth) + (numGapsX * gap);
    const boardHeight = (numTilesY * tileHeight) + (numGapsY * gap);
    
    // Calculate position - board starts at top-left of first row (no padding)
    // Rows are rendered from maxY down to minY, so top row is at y=maxY
    // The debug rectangle should outline the entire grid area
    // Position it at the exact top-left where the first row starts
    const firstRow = boardEl.querySelector('.board-row');
    const firstRowRect = firstRow ? firstRow.getBoundingClientRect() : null;
    const containerRect = boardEl.getBoundingClientRect();
    
    // Calculate offset: where does the first row start relative to container?
    // Since rows start at top:0, left:0 of container, offset should be 0
    // But we'll use actual measurements to ensure perfect alignment
    const offsetLeft = firstRowRect ? firstRowRect.left - containerRect.left + boardEl.scrollLeft : 0;
    const offsetTop = firstRowRect ? firstRowRect.top - containerRect.top + boardEl.scrollTop : 0;
    
    const debugRect = document.createElement('div');
    debugRect.className = 'board-boundary-debug';
    debugRect.style.cssText = `
      position: absolute;
      top: ${offsetTop}px;
      left: ${offsetLeft}px;
      width: ${boardWidth}px;
      height: ${boardHeight}px;
      border: 3px solid #ff0000;
      box-sizing: border-box;
      pointer-events: none;
      z-index: 1000;
      background: transparent;
    `;
    
    // Debug info: log container and board dimensions
    const computedStyle = window.getComputedStyle(boardEl);
    console.log('Board Debug:', {
      containerWidth: boardEl.offsetWidth,
      containerScrollWidth: boardEl.scrollWidth,
      rowWidth: rowWidth,
      boardWidth: boardWidth,
      viewportWidth: window.innerWidth,
      scrollLeft: boardEl.scrollLeft,
      scrollTop: boardEl.scrollTop,
      containerLeft: containerRect.left,
      containerRight: containerRect.right,
      firstRowLeft: firstRowRect ? firstRowRect.left : null,
      firstRowWidth: firstRowRect ? firstRowRect.width : null
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
    
    // Add center marker (0,0) - positioned at 50% to mark the board center
    // The central chamber card should be centered at this position
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
  
  /**
   * Get symbol for card rank
   * @private
   */
  _getRankSymbol(rank) {
    const symbols = {
      'ace': 'A',
      'king': 'K',
      'queen': 'Q',
      'jack': 'J',
      '10': '10',
      'ten': '10', // Handle both '10' and 'ten' formats
      '9': '9',
      '8': '8',
      '7': '7',
      '6': '6',
      '5': '5',
      '4': '4',
      '3': '3',
      '2': '2'
    };
    return symbols[rank] || rank;
  }
  
  /**
   * Get symbol for card suit
   * @private
   */
  _getSuitSymbol(suit) {
    const symbols = {
      'hearts': '♥',
      'diamonds': '♦',
      'clubs': '♣',
      'spades': '♠'
    };
    return symbols[suit] || suit;
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
