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
    // Track previous player position and scroll for relative scrolling
    this.lastPlayerPos = null;
    this.lastPlayerPixelX = null;
    this.lastPlayerPixelY = null;
    this.lastScrollX = null;
    this.lastScrollY = null;
    // Dead zone configuration: 0.7 = 70% of viewport (15% margin on each side)
    this.deadZoneSize = 0.7;
    // Track if this is the very first render (game initialization)
    this.isFirstRender = true;
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
    // Reset scroll tracking
    this.lastPlayerPos = null;
    this.lastPlayerPixelX = null;
    this.lastPlayerPixelY = null;
    this.lastScrollX = null;
    this.lastScrollY = null;
    // Mark as first render (will center player)
    this.isFirstRender = true;
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
    
    // Create debug overlay for dead zone visualization
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
   * Center board on player position (mobile) - Simple scrollable approach
   */
  _centerBoardOnPlayer(boardEl, playerPos, minX, maxX, minY, maxY) {
    // Simple approach: Let CSS handle the container, we just scroll to center the player
    // Use setTimeout to ensure DOM is fully rendered and browser has recalculated layout
    setTimeout(() => {
      // Always update stored scroll position from actual scroll (handles manual scrolling)
      // This ensures relative scrolling works even if user manually scrolled
      const actualScrollX = boardEl.scrollLeft;
      const actualScrollY = boardEl.scrollTop;
      
      // If scroll position changed significantly from what we stored, user manually scrolled
      // We'll update stored positions after calculating current player pixel position
      let detectedManualScroll = false;
      if (this.lastScrollX !== null && this.lastScrollY !== null) {
        const scrollThreshold = 5; // 5px threshold to detect manual scrolling
        if (Math.abs(actualScrollX - this.lastScrollX) > scrollThreshold ||
            Math.abs(actualScrollY - this.lastScrollY) > scrollThreshold) {
          detectedManualScroll = true;
        }
      }
      // Calculate tile size (including gap) - match CSS values
      // Store these for use in scroll calculation
      const tileWidth = window.innerWidth <= 480 ? 65 : 70;
      const tileHeight = window.innerWidth <= 480 ? 85 : 90;
      const gap = 2;
      const totalTileWidth = tileWidth + gap;
      const totalTileHeight = tileHeight + gap;
      
      // Get padding from computed style
      const computedStyle = window.getComputedStyle(boardEl);
      const padding = parseInt(computedStyle.paddingTop) || parseInt(computedStyle.paddingLeft) || (window.innerWidth <= 768 ? 8 : 16);
      
      // Calculate expected board height to ensure container is tall enough
      const expectedBoardHeight = padding * 2 + (maxY - minY + 1) * totalTileHeight;
      
      // Get viewport dimensions - use window, not container (container may have grown)
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate player's position relative to board bounds
      const playerXOffset = playerPos.x - minX;
      const playerYOffset = maxY - playerPos.y; // Y is inverted (maxY is top)
      
      // Calculate player tile center position in pixels
      const tileStartX = padding + (playerXOffset * totalTileWidth);
      const tileStartY = padding + (playerYOffset * totalTileHeight);
      const playerPixelX = tileStartX + (tileWidth / 2);
      const playerPixelY = tileStartY + (tileHeight / 2);
      
      // Use the actual scroll position
      const currentScrollX = boardEl.scrollLeft;
      const currentScrollY = boardEl.scrollTop;
      
      // Calculate desired scroll position
      // Logic: Don't auto-scroll if player is within dead zone (configurable % of viewport)
      // If player goes outside that area, scroll by exactly how much the queen moves (tile + gap)
      
      // Calculate where player would be on screen with current scroll
      const playerScreenX = playerPixelX - currentScrollX;
      const playerScreenY = playerPixelY - currentScrollY;
      
      // Dead zone: configurable size (default 70% = 15% margin on each side)
      const deadZoneMargin = (1 - this.deadZoneSize) / 2; // e.g., 0.15 for 70% dead zone
      const deadZoneLeft = viewportWidth * deadZoneMargin;
      const deadZoneRight = viewportWidth * (1 - deadZoneMargin);
      const deadZoneTop = viewportHeight * deadZoneMargin;
      const deadZoneBottom = viewportHeight * (1 - deadZoneMargin);
      
      // Update debug overlay to show dead zone
      this._updateDeadZoneDebug(deadZoneLeft, deadZoneTop, deadZoneRight - deadZoneLeft, deadZoneBottom - deadZoneTop);
      
      // Start with current scroll position
      let scrollX = currentScrollX;
      let scrollY = currentScrollY;
      
      // Simplified logic: Queen starts in middle, then always follow deadzone rules
      if (this.isFirstRender) {
        // Very first render - always center the player completely
        scrollX = playerPixelX - (viewportWidth / 2);
        scrollY = playerPixelY - (viewportHeight / 2);
        // Mark that we've done the first render
        this.isFirstRender = false;
      } else {
        // After first render - always use deadzone rules
        // If player is outside dead zone, scroll by exactly one tile spacing
        
        if (playerScreenX < deadZoneLeft) {
          // Player too far left - scroll LEFT (decrease scrollX) to move board right, bringing player right
          scrollX = currentScrollX - totalTileWidth;
        } else if (playerScreenX > deadZoneRight) {
          // Player too far right - scroll RIGHT (increase scrollX) to move board left, bringing player left
          scrollX = currentScrollX + totalTileWidth;
        }
        // If player is within dead zone horizontally, don't scroll horizontally
        
        if (playerScreenY < deadZoneTop) {
          // Player too far up - scroll UP (decrease scrollY) to move board down, bringing player down
          scrollY = currentScrollY - totalTileHeight;
        } else if (playerScreenY > deadZoneBottom) {
          // Player too far down - scroll DOWN (increase scrollY) to move board up, bringing player up
          scrollY = currentScrollY + totalTileHeight;
        }
        // If player is within dead zone vertically, don't scroll vertically
      }
      
      // Calculate minimum board height needed to allow scrolling to player position
      // Need: playerPixelY + (viewportHeight / 2) to allow scrolling down
      // And: playerPixelY - (viewportHeight / 2) >= 0 to allow scrolling up
      const minBoardHeightForScroll = Math.max(
        expectedBoardHeight, // At least as tall as content
        playerPixelY + (viewportHeight / 2) // Tall enough to scroll down to center player
      );
      
      // CRITICAL: Ensure container stays at viewport height for scrolling to work
      // Container must have: clientHeight = viewport (710px), scrollHeight > clientHeight
      // If container has grown (clientHeight > viewport), force it back to viewport height
      const currentClientHeight = boardEl.clientHeight;
      if (currentClientHeight > viewportHeight) {
        // Container grew - force it back to viewport height
        boardEl.style.height = `${viewportHeight}px`;
        boardEl.style.maxHeight = `${viewportHeight}px`;
        // Force reflow
        void boardEl.offsetHeight;
      }
      
      // Force reflow to ensure browser has calculated scrollHeight correctly
      void boardEl.offsetHeight;
      void boardEl.scrollHeight;
      void boardEl.offsetHeight;
      
      // Force browser to recalculate layout - read multiple times to ensure it's updated
      void boardEl.offsetHeight;
      void boardEl.scrollHeight;
      void boardEl.offsetHeight; // Force again
      
      // Get actual scroll dimensions from browser (most reliable)
      const actualScrollWidth = boardEl.scrollWidth;
      const actualScrollHeight = boardEl.scrollHeight;
      
      // Calculate expected board width from bounds (height already calculated above)
      const expectedBoardWidth = padding * 2 + (maxX - minX + 1) * totalTileWidth;
      
      // Use the larger of actual scroll height or minimum needed height
      const boardWidth = actualScrollWidth > 0 ? actualScrollWidth : expectedBoardWidth;
      const boardHeight = Math.max(actualScrollHeight, minBoardHeightForScroll);
      
      // Calculate max scroll positions
      const maxScrollX = Math.max(0, boardWidth - viewportWidth);
      const maxScrollY = Math.max(0, boardHeight - viewportHeight);
      
      // Clamp scroll values to valid range
      const finalScrollX = Math.max(0, Math.min(scrollX, maxScrollX));
      const finalScrollY = Math.max(0, Math.min(scrollY, maxScrollY));
      
      // Only scroll if position changed significantly (more than 1px)
      const scrollThreshold = 1;
      const needsScrollX = Math.abs(finalScrollX - currentScrollX) > scrollThreshold;
      const needsScrollY = Math.abs(finalScrollY - currentScrollY) > scrollThreshold;
      
      if (needsScrollX || needsScrollY) {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
          // Mobile: direct assignment for instant scroll
          if (needsScrollX) {
            boardEl.scrollLeft = finalScrollX;
          }
          if (needsScrollY) {
            // If board isn't tall enough to scroll, force it to be taller first
            if (boardEl.scrollHeight <= boardEl.clientHeight && expectedBoardHeight > boardEl.clientHeight) {
              // Force the container to be tall enough to enable scrolling
              boardEl.style.minHeight = `${expectedBoardHeight}px`;
              // Force reflow
              void boardEl.offsetHeight;
              // Recalculate after forcing height
              const newScrollHeight = boardEl.scrollHeight;
              const newMaxScrollY = Math.max(0, newScrollHeight - viewportHeight);
              const newFinalScrollY = Math.max(0, Math.min(scrollY, newMaxScrollY));
              boardEl.scrollTop = newFinalScrollY;
            } else {
              boardEl.scrollTop = finalScrollY;
            }
          }
        } else {
          // Desktop: smooth scrolling
          boardEl.scrollTo({
            left: finalScrollX,
            top: finalScrollY,
            behavior: 'smooth'
          });
        }
      }
      
      // Always update stored position and scroll to actual DOM values
      // This ensures manual scrolling is tracked correctly
      this.lastPlayerPos = { x: playerPos.x, y: playerPos.y };
      this.lastPlayerPixelX = playerPixelX;
      this.lastPlayerPixelY = playerPixelY;
      // Use actual scroll position from DOM (handles manual scrolling and programmatic scrolling)
      this.lastScrollX = boardEl.scrollLeft;
      this.lastScrollY = boardEl.scrollTop;
      
      // If user manually scrolled, make sure stored positions reflect the manual scroll
      // This ensures next movement maintains relative position from manual scroll
      if (detectedManualScroll && !needsScrollX && !needsScrollY) {
        // User manually scrolled but we didn't programmatically scroll
        // Update stored scroll to match manual scroll (already done above, but ensure it's correct)
        this.lastScrollX = boardEl.scrollLeft;
        this.lastScrollY = boardEl.scrollTop;
      }
    }, 0); // Use setTimeout(0) to ensure DOM is fully rendered
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
    
    // Calculate row width to ensure content is wide enough for scrolling
    const tileWidth = window.innerWidth <= 480 ? 65 : 70;
    const gap = 2;
    const totalTileWidth = tileWidth + gap;
    const rowWidth = (maxX - minX + 1) * totalTileWidth;
    
    // Create rows (from top to bottom, y descending)
    for (let y = maxY; y >= minY; y--) {
      const row = document.createElement('div');
      row.className = 'board-row';
      // Ensure row is wide enough to make container scrollable
      row.style.minWidth = `${rowWidth}px`;
      row.style.width = `${rowWidth}px`;
      
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
          
          // Check if this was a tap (not a scroll) by comparing start/end positions
          let wasTap = false;
          if (touchStartPos && e.changedTouches[0]) {
            const touch = e.changedTouches[0];
            const moveX = Math.abs(touch.clientX - touchStartPos.x);
            const moveY = Math.abs(touch.clientY - touchStartPos.y);
            // Only treat as tap if moved less than 10px (allows for small finger movement)
            wasTap = moveX < 10 && moveY < 10;
          }
          
          // Only handle as normal tap if not a long press and it was actually a tap (not scroll)
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
    
    // Add spacer at bottom to ensure board is tall enough for scrolling (mobile only)
    if (window.innerWidth <= 768) {
      const tileHeight = window.innerWidth <= 480 ? 85 : 90;
      const gap = 2;
      const totalTileHeight = tileHeight + gap;
      const computedStyle = window.getComputedStyle(boardEl);
      const padding = parseInt(computedStyle.paddingTop) || parseInt(computedStyle.paddingLeft) || 8;
      const expectedBoardHeight = padding * 2 + (maxY - minY + 1) * totalTileHeight;
      // Use window.innerHeight, not clientHeight (container may have grown)
      const viewportHeight = window.innerHeight;
      const playerYOffset = maxY - playerPos.y;
      const tileStartY = padding + (playerYOffset * totalTileHeight);
      const playerPixelY = tileStartY + (tileHeight / 2);
      const minBoardHeightForScroll = Math.max(
        expectedBoardHeight,
        playerPixelY + (viewportHeight / 2)
      );
      
      if (minBoardHeightForScroll > viewportHeight) {
        // Add spacer to make content tall enough
        let spacer = boardEl.querySelector('.scroll-spacer');
        if (!spacer) {
          spacer = document.createElement('div');
          spacer.className = 'scroll-spacer';
          spacer.style.width = '100%';
          spacer.style.flexShrink = '0';
          boardEl.appendChild(spacer);
        }
        // Calculate spacer height needed
        void boardEl.offsetHeight; // Force reflow
        const currentScrollHeight = boardEl.scrollHeight;
        const spacerHeight = Math.max(0, minBoardHeightForScroll - currentScrollHeight);
        spacer.style.height = `${spacerHeight}px`;
      } else {
        // Remove spacer if not needed
        const spacer = boardEl.querySelector('.scroll-spacer');
        if (spacer) {
          spacer.remove();
        }
      }
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
  
  /**
   * Update debug overlay to show the dead zone (middle 50% of viewport)
   * @private
   */
  _updateDeadZoneDebug(left, top, width, height) {
    const debugOverlay = document.getElementById('debug-deadzone');
    if (debugOverlay) {
      debugOverlay.style.display = 'block';
      debugOverlay.style.left = `${left}px`;
      debugOverlay.style.top = `${top}px`;
      debugOverlay.style.width = `${width}px`;
      debugOverlay.style.height = `${height}px`;
    }
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

