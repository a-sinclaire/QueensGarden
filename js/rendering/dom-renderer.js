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
  
  /**
   * Center board on player position (mobile) - Camera Handler
   */
  _centerBoardOnPlayer(boardEl, playerPos, minX, maxX, minY, maxY) {
    // Use multiple requestAnimationFrame calls to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Calculate tile size (including gap) - match CSS values
        const tileWidth = window.innerWidth <= 480 ? 65 : 70; // Mobile tile width
        const tileHeight = window.innerWidth <= 480 ? 85 : 90; // Mobile tile height
        const gap = 2;
        const totalTileWidth = tileWidth + gap;
        const totalTileHeight = tileHeight + gap;
        
        // Get viewport dimensions (what's visible)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate actual board content size (tiles only)
        const padding = 8;
        const boardContentWidth = (maxX - minX + 1) * totalTileWidth + (padding * 2);
        const boardContentHeight = (maxY - minY + 1) * totalTileHeight + (padding * 2);
        
        // Add viewport-sized padding on all sides to allow scrolling in all directions
        const extraPaddingX = viewportWidth;
        const extraPaddingY = viewportHeight;
        const totalBoardWidth = boardContentWidth + (extraPaddingX * 2);
        const totalBoardHeight = boardContentHeight + (extraPaddingY * 2);
        
        // Set board container size to allow scrolling
        boardEl.style.width = `${totalBoardWidth}px`;
        boardEl.style.height = `${totalBoardHeight}px`;
        boardEl.style.minWidth = `${totalBoardWidth}px`;
        boardEl.style.minHeight = `${totalBoardHeight}px`;
        
        // Add padding to board container to create scrollable space
        boardEl.style.paddingLeft = `${extraPaddingX}px`;
        boardEl.style.paddingTop = `${extraPaddingY}px`;
        boardEl.style.paddingRight = `${extraPaddingX}px`;
        boardEl.style.paddingBottom = `${extraPaddingY}px`;
        
        // Calculate player's position relative to board bounds
        const playerXOffset = playerPos.x - minX;
        const playerYOffset = maxY - playerPos.y; // Y is inverted (maxY is top)
        
        // Calculate player tile center position in pixels (relative to board content)
        // Account for the padding we added
        // Use exact center of tile: (offset * tileSize) + (tileSize / 2) + padding
        const playerPixelX = (playerXOffset * totalTileWidth) + (totalTileWidth / 2) + padding + extraPaddingX;
        const playerPixelY = (playerYOffset * totalTileHeight) + (totalTileHeight / 2) + padding + extraPaddingY;
        
        // Calculate scroll position to center player EXACTLY in viewport
        // This centers the player tile's center point in the viewport center
        const scrollX = playerPixelX - (viewportWidth / 2);
        const scrollY = playerPixelY - (viewportHeight / 2);
        
        // Wait for size to apply, then scroll
        setTimeout(() => {
          // Force a reflow to ensure sizes are applied
          void boardEl.offsetWidth;
          void boardEl.offsetHeight;
          
          // Get actual scrollable dimensions after size is set
          const scrollWidth = boardEl.scrollWidth;
          const scrollHeight = boardEl.scrollHeight;
          
          // Debug: check if board is actually scrollable
          console.log('Board dimensions:', {
            width: boardEl.offsetWidth,
            height: boardEl.offsetHeight,
            scrollWidth,
            scrollHeight,
            viewportWidth,
            viewportHeight,
            canScrollX: scrollWidth > viewportWidth,
            canScrollY: scrollHeight > viewportHeight
          });
          
          // Calculate maximum scroll positions
          const maxScrollX = Math.max(0, scrollWidth - viewportWidth);
          const maxScrollY = Math.max(0, scrollHeight - viewportHeight);
          
          // Always center on player - don't clamp if it would prevent centering
          // But ensure we don't scroll beyond bounds
          let finalScrollX = scrollX;
          let finalScrollY = scrollY;
          
          // Only clamp if we're at the edges and can't center perfectly
          if (scrollX < 0) {
            finalScrollX = 0;
          } else if (scrollX > maxScrollX) {
            finalScrollX = maxScrollX;
          }
          
          if (scrollY < 0) {
            finalScrollY = 0;
          } else if (scrollY > maxScrollY) {
            finalScrollY = maxScrollY;
          }
          
          // Debug display (on-screen for mobile)
          const debugEl = document.getElementById('mobile-debug');
          if (debugEl && window.innerWidth <= 768) {
            const debugContent = debugEl.querySelector('.debug-content');
            if (debugContent) {
              const canScrollX = scrollWidth > viewportWidth;
              const canScrollY = scrollHeight > viewportHeight;
              debugContent.textContent = `Player: (${playerPos.x}, ${playerPos.y})
Bounds: X[${minX}, ${maxX}] Y[${minY}, ${maxY}]
Offset: X=${playerXOffset} Y=${playerYOffset}
Pixel: X=${Math.round(playerPixelX)} Y=${Math.round(playerPixelY)}
Scroll: X=${Math.round(scrollX)} Y=${Math.round(scrollY)}
Board: ${boardEl.offsetWidth}x${boardEl.offsetHeight}
Scroll: ${scrollWidth}x${scrollHeight}
CanScroll: X=${canScrollX} Y=${canScrollY}
MaxScroll: X=${Math.round(maxScrollX)} Y=${Math.round(maxScrollY)}
Final: X=${Math.round(finalScrollX)} Y=${Math.round(finalScrollY)}
Current: X=${Math.round(boardEl.scrollLeft)} Y=${Math.round(boardEl.scrollTop)}
Viewport: ${viewportWidth}x${viewportHeight}`;
            }
          }
          
          // Also log to console for desktop debugging
          console.log('Camera centering:', {
            playerPos: { x: playerPos.x, y: playerPos.y },
            bounds: { minX, maxX, minY, maxY },
            playerOffset: { x: playerXOffset, y: playerYOffset },
            playerPixel: { x: playerPixelX, y: playerPixelY },
            scroll: { x: scrollX, y: scrollY },
            scrollDims: { width: scrollWidth, height: scrollHeight },
            maxScroll: { x: maxScrollX, y: maxScrollY },
            finalScroll: { x: finalScrollX, y: finalScrollY },
            viewport: { width: viewportWidth, height: viewportHeight }
          });
          
          // Scroll the board container
          // Use instant scroll on first render to avoid dead space, smooth for subsequent moves
          const isFirstRender = !boardEl.dataset.hasScrolled;
          boardEl.dataset.hasScrolled = 'true';
          
          boardEl.scrollTo({
            left: finalScrollX,
            top: finalScrollY,
            behavior: isFirstRender ? 'auto' : 'smooth' // Instant on first render
          });
        }, 50);
      });
    });
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
        tileEl.addEventListener('touchstart', (e) => {
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
          
          // Only handle as normal tap if not a long press
          if (!isLongPress && touchStartTime && (Date.now() - touchStartTime) < 500) {
            handleTileAction(e);
          }
          
          touchStartTime = null;
        });
        
        // Touch cancel - cleanup
        tileEl.addEventListener('touchcancel', () => {
          if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
          }
          touchStartTime = null;
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
          // Unexplored tile - still show border so grid is visible
          tileEl.style.opacity = '0.3';
          tileEl.style.border = '1px solid rgba(83, 52, 131, 0.3)'; // Subtle border for grid visibility
        }
        
        row.appendChild(tileEl);
      }
      
      boardEl.appendChild(row);
    }
    
    // Center camera on player AFTER board is rendered (mobile only)
    if (window.innerWidth <= 768) {
      this._centerBoardOnPlayer(boardEl, playerPos, minX, maxX, minY, maxY);
    }
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOMRenderer;
}

