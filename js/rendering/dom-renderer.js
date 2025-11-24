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
    // Dead zone configuration: 1.0 = 1 tile width/height from each edge
    // This ensures consistent deadzone size regardless of screen size
    this.deadZoneTiles = 1.0;
    // Track if this is the very first render (game initialization)
    this.isFirstRender = true;
    // Track previous board bounds to detect bounds changes
    this.lastBoardBounds = null;
    // Track if user has manually scrolled (if true, don't auto-center)
    this.hasManuallyScrolled = false;
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
  
  /**
   * Center board on player position (mobile) - Simple scrollable approach
   */
  _centerBoardOnPlayer(boardEl, playerPos, minX, maxX, minY, maxY) {
    // Ensure debug panel is visible and ready on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const debugPanel = document.getElementById('mobile-debug');
      const debugContent = document.getElementById('debug-content');
      if (debugPanel) {
        if (!debugPanel.style.display || debugPanel.style.display === 'none') {
          debugPanel.style.display = 'block';
          debugPanel.style.visibility = 'visible';
          debugPanel.style.opacity = '1';
        }
      }
      if (debugContent && debugContent.textContent === 'Waiting for camera update...') {
        debugContent.textContent = 'Initializing camera...';
      }
    }
    
    // Simple approach: Let CSS handle the container, we just scroll to center the player
    // Use setTimeout to ensure DOM is fully rendered and browser has recalculated layout
    
    // Capture preserved scroll BEFORE setTimeout (in case board was just rebuilt)
    const preservedScroll = this._savedScrollBeforeRebuild 
      ? { x: this._savedScrollBeforeRebuild.x, y: this._savedScrollBeforeRebuild.y }
      : null;
    
    setTimeout(() => {
      // Debug: Verify setTimeout callback is executing
      if (window.innerWidth <= 768) {
        console.log('_centerBoardOnPlayer setTimeout callback executing', {
          playerPos: { x: playerPos.x, y: playerPos.y },
          isFirstRender: this.isFirstRender
        });
      }
      
      // Always update stored scroll position from actual scroll (handles manual scrolling)
      // This ensures relative scrolling works even if user manually scrolled
      // BUT: If we have preserved scroll (board was just rebuilt), use that instead
      const actualScrollX = preservedScroll ? preservedScroll.x : boardEl.scrollLeft;
      const actualScrollY = preservedScroll ? preservedScroll.y : boardEl.scrollTop;
      
      // Detect manual scrolling: if scroll changed and we didn't cause it, user scrolled manually
      if (this.lastScrollX !== null && this.lastScrollY !== null && !this.isFirstRender) {
        const scrollThreshold = 5; // 5px threshold to detect manual scrolling
        if (Math.abs(actualScrollX - this.lastScrollX) > scrollThreshold ||
            Math.abs(actualScrollY - this.lastScrollY) > scrollThreshold) {
          // Check if this change was from board expansion adjustment
          // If preserved scroll exists, it was from board rebuild, not manual scroll
          if (!preservedScroll) {
            this.hasManuallyScrolled = true;
          }
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
      
      // Calculate expected board dimensions to ensure container is tall/wide enough
      const expectedBoardHeight = padding * 2 + (maxY - minY + 1) * totalTileHeight;
      const expectedBoardWidth = padding * 2 + (maxX - minX + 1) * totalTileWidth;
      
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
      
      // Use the actual scroll position from the board element
      // CRITICAL: Use actualScrollX/Y which accounts for preserved scroll (if board was just rebuilt)
      // This ensures we use the correct scroll position for calculations
      const currentScrollX = actualScrollX;
      const currentScrollY = actualScrollY;
      
      // Calculate desired scroll position
      // Logic: Don't auto-scroll if player is within dead zone (configurable % of viewport)
      // If player goes outside that area, scroll by exactly how much the queen moves (tile + gap)
      
      // Check if player moved (for deadzone logic - only scroll if player moved)
      const playerMoved = this.lastPlayerPos && 
        (this.lastPlayerPos.x !== playerPos.x || this.lastPlayerPos.y !== playerPos.y);
      
      // Store playerMoved for use later in the function
      window._debugPlayerMoved = playerMoved;
      
      // Dead zone: tile-based (1 tile from each edge)
      // This ensures consistent deadzone size regardless of screen size
      const deadZoneLeft = this.deadZoneTiles * totalTileWidth;
      const deadZoneRight = viewportWidth - (this.deadZoneTiles * totalTileWidth);
      const deadZoneTop = this.deadZoneTiles * totalTileHeight;
      const deadZoneBottom = viewportHeight - (this.deadZoneTiles * totalTileHeight);
      
      // Update debug overlay to show dead zone
      this._updateDeadZoneDebug(deadZoneLeft, deadZoneTop, deadZoneRight - deadZoneLeft, deadZoneBottom - deadZoneTop);
      
      // Update center guide to show where center tile should be
      this._updateCenterGuide(viewportWidth, viewportHeight);
      
      // Calculate where player is NOW (after move) on screen with current scroll
      // This is the SINGLE source of truth for player screen position
      const playerScreenX = playerPixelX - currentScrollX;
      const playerScreenY = playerPixelY - currentScrollY;
      
      // Calculate scroll position needed
      // ONLY center on first render - after that, maintain relative offset
      let scrollX = currentScrollX;
      let scrollY = currentScrollY;
      
      if (this.isFirstRender) {
        // Use the center scroll values calculated in _updateBoard
        const centerScrollX = this._centerScrollX || (playerPixelX - (viewportWidth / 2));
        const centerScrollY = this._centerScrollY || (playerPixelY - (viewportHeight / 2));
        const leftSpacer = this._leftSpacerNeeded || 0;
        const topSpacer = this._topSpacerNeeded || 0;
        
        // Spacers push content, so scroll = centerScroll + spacer
        scrollX = centerScrollX + leftSpacer;
        scrollY = centerScrollY + topSpacer;
      }
      // After first render: keep current scroll (no auto-centering)
      
      // Calculate minimum board dimensions needed to allow scrolling to center player in all directions
      // For first render centering: need enough space to scroll to center position
      // For normal scrolling: need space for deadzone + movement
      let minBoardHeightForScroll, minBoardWidthForScroll;
      
      if (this.isFirstRender) {
        // On first render, we need enough space to scroll to the center position
        // Center scroll position is: playerPixelX/Y - viewportWidth/Height / 2
        const centerScrollX = playerPixelX - (viewportWidth / 2);
        const centerScrollY = playerPixelY - (viewportHeight / 2);
        
        // If centerScrollY is negative, we need extra space ABOVE the board to allow scrolling up
        // Add top padding/spacer equal to the absolute value of negative scroll
        const topSpacerNeeded = centerScrollY < 0 ? Math.abs(centerScrollY) : 0;
        const leftSpacerNeeded = centerScrollX < 0 ? Math.abs(centerScrollX) : 0;
        
        // Board needs to be at least: center scroll position + viewport size + any negative scroll offset
        minBoardWidthForScroll = Math.max(
          expectedBoardWidth,
          centerScrollX + viewportWidth + leftSpacerNeeded,
          playerPixelX + (viewportWidth / 2) + leftSpacerNeeded // Also ensure we can scroll right if needed
        );
        minBoardHeightForScroll = Math.max(
          expectedBoardHeight,
          centerScrollY + viewportHeight + topSpacerNeeded,
          playerPixelY + (viewportHeight / 2) + topSpacerNeeded // Also ensure we can scroll down if needed
        );
        
        // Store spacer needs for use when adding spacers
        this._topSpacerNeeded = topSpacerNeeded;
        this._leftSpacerNeeded = leftSpacerNeeded;
      } else {
        this._topSpacerNeeded = 0;
        this._leftSpacerNeeded = 0;
        // Normal scrolling: need space for deadzone + movement
        minBoardHeightForScroll = Math.max(
          expectedBoardHeight,
          playerPixelY + (viewportHeight / 2),
          playerPixelY + viewportHeight
        );
        minBoardWidthForScroll = Math.max(
          expectedBoardWidth,
          playerPixelX + (viewportWidth / 2),
          playerPixelX + viewportWidth
        );
      }
      
      // CRITICAL: Ensure container stays at viewport height for scrolling to work
      // Container must have: clientHeight = viewport, scrollHeight > clientHeight
      // BUT: Don't force height if we need more space for scrolling (spacer will handle it)
      // Only constrain if container has grown beyond what's needed
      const currentClientHeight = boardEl.clientHeight;
      // Only force height if it's way too tall (more than viewport + some margin)
      // This allows the spacer to make it tall enough for scrolling
      if (currentClientHeight > viewportHeight * 1.1) {
        // Container grew too much - force it back to viewport height
        boardEl.style.height = `${viewportHeight}px`;
        boardEl.style.maxHeight = `${viewportHeight}px`;
        // Force reflow
        void boardEl.offsetHeight;
      } else {
        // Ensure we have a max-height constraint but allow min-height to grow
        boardEl.style.maxHeight = `${viewportHeight}px`;
        // Don't set height - let content determine it, but ensure min-height allows scrolling
        if (minBoardHeightForScroll > viewportHeight) {
          boardEl.style.minHeight = `${minBoardHeightForScroll}px`;
        }
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
      
      // expectedBoardWidth already calculated above (before minBoardWidthForScroll calculation)
      
      // Use the larger of actual scroll dimensions or minimum needed dimensions
      // (minBoardWidthForScroll and minBoardHeightForScroll already calculated above)
      const boardWidth = Math.max(actualScrollWidth, expectedBoardWidth, minBoardWidthForScroll);
      const boardHeight = Math.max(actualScrollHeight, minBoardHeightForScroll);
      
      // Calculate max scroll positions
      const maxScrollX = Math.max(0, boardWidth - viewportWidth);
      const maxScrollY = Math.max(0, boardHeight - viewportHeight);
      
      // Clamp scroll values to valid range
      // scrollX/Y already account for spacers (if first render), so use them directly
      const finalScrollX = Math.max(0, Math.min(scrollX, maxScrollX));
      const finalScrollY = Math.max(0, Math.min(scrollY, maxScrollY));
      
      // Determine if we need to scroll
      // ONLY scroll on first render (centering) - after that, maintain relative offset
      const scrollThreshold = 1;
      const needsScrollX = this.isFirstRender ? Math.abs(finalScrollX - currentScrollX) > 0.1 : false;
      const needsScrollY = this.isFirstRender ? Math.abs(finalScrollY - currentScrollY) > 0.1 : false;
      
      // Debug: Update debug panel with scroll decision
      // Always show debug on mobile, not just when player moved
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        // Force find debug element - try multiple times if needed
        let debugEl = document.getElementById('debug-content');
        if (!debugEl) {
          console.error('Debug element not found! Looking for #debug-content');
          // Try to find it again
          debugEl = document.querySelector('#debug-content');
          if (!debugEl) {
            console.error('Still not found! Trying #mobile-debug .debug-content');
            const debugPanel = document.getElementById('mobile-debug');
            if (debugPanel) {
              debugEl = debugPanel.querySelector('.debug-content');
            }
          }
        }
        
        // Always update debug panel if we're on mobile, even if element not found
        console.log('Updating debug panel:', {
          isMobile,
          debugElFound: !!debugEl,
          windowWidth: window.innerWidth
        });
        
        if (debugEl) {
          let debugText = `Viewport: ${viewportWidth}×${viewportHeight}\n`;
          debugText += `Board Bounds: X(${minX}-${maxX}) Y(${minY}-${maxY})\n`;
          debugText += `Player Pixel: X=${Math.round(playerPixelX)} Y=${Math.round(playerPixelY)}\n`;
          debugText += `Player Screen: X=${Math.round(playerScreenX)} Y=${Math.round(playerScreenY)}\n`;
          debugText += `Deadzone X: ${Math.round(deadZoneLeft)}-${Math.round(deadZoneRight)}\n`;
          debugText += `Deadzone Y: ${Math.round(deadZoneTop)}-${Math.round(deadZoneBottom)}\n`;
          debugText += `In Deadzone X: ${playerScreenX >= deadZoneLeft && playerScreenX <= deadZoneRight}\n`;
          debugText += `In Deadzone Y: ${playerScreenY >= deadZoneTop && playerScreenY <= deadZoneBottom}\n`;
          debugText += `Current Scroll: X=${Math.round(currentScrollX)} Y=${Math.round(currentScrollY)}\n`;
          debugText += `Calculated Scroll: X=${Math.round(scrollX)} Y=${Math.round(scrollY)}\n`;
          debugText += `Final Scroll: X=${Math.round(finalScrollX)} Y=${Math.round(finalScrollY)}\n`;
          debugText += `Player Pos: (${playerPos.x}, ${playerPos.y})\n`;
          debugText += `First Render: ${this.isFirstRender}\n`;
          debugText += `Player Moved: ${playerMoved}\n`;
          
          // Show previous values for comparison
          if (this.lastPlayerPixelX !== null) {
            debugText += `\nLast Pixel: X=${Math.round(this.lastPlayerPixelX)} Y=${Math.round(this.lastPlayerPixelY)}`;
            debugText += `\nPixel Delta: X=${Math.round(playerPixelX - this.lastPlayerPixelX)} Y=${Math.round(playerPixelY - this.lastPlayerPixelY)}`;
          }
          
          // Determine scroll action
          let scrollAction = '';
          if (this.isFirstRender) {
            scrollAction = '→ CENTERING';
          } else if (playerMoved) {
            if (playerScreenX < deadZoneLeft) {
              scrollAction = '→ Scroll LEFT';
            } else if (playerScreenX > deadZoneRight) {
              scrollAction = '→ Scroll RIGHT';
            } else {
              scrollAction = '✓ No X scroll';
            }
            
            if (playerScreenY < deadZoneTop) {
              scrollAction += ' / Scroll UP';
            } else if (playerScreenY > deadZoneBottom) {
              scrollAction += ' / Scroll DOWN';
            } else {
              scrollAction += ' / ✓ No Y scroll';
            }
          } else {
            scrollAction = '✓ No move, no scroll';
          }
          
          debugText += scrollAction;
          debugText += `\n\nWill scroll: X=${needsScrollX} Y=${needsScrollY}`;
          debugText += `\n  Scroll Delta X: ${Math.round(finalScrollX - currentScrollX)} (threshold: ${this.isFirstRender ? '0.1' : '1'})`;
          debugText += `\n  Scroll Delta Y: ${Math.round(finalScrollY - currentScrollY)} (threshold: ${this.isFirstRender ? '0.1' : '1'})`;
          debugText += `\n  Max Scroll: X=${Math.round(maxScrollX)} Y=${Math.round(maxScrollY)}`;
          debugText += `\n  Board Size: W=${Math.round(boardWidth)} H=${Math.round(boardHeight)}`;
          debugText += `\n  Board ScrollSize: W=${Math.round(boardEl.scrollWidth)} H=${Math.round(boardEl.scrollHeight)}`;
          debugText += `\n  Board ClientSize: W=${Math.round(boardEl.clientWidth)} H=${Math.round(boardEl.clientHeight)}`;
          debugText += `\n  Viewport: W=${viewportWidth} H=${viewportHeight}`;
          debugText += `\n  Tile Size: W=${tileWidth} H=${tileHeight} Gap=${gap}`;
          debugText += `\n  Total Tile: W=${totalTileWidth} H=${totalTileHeight}`;
          debugText += `\n  Padding: ${padding}`;
          debugText += `\n  Min Board For Scroll: W=${Math.round(minBoardWidthForScroll)} H=${Math.round(minBoardHeightForScroll)}`;
          
          // Add spacer and offset info
          const offsetX = playerPixelX - (viewportWidth / 2);
          const offsetY = playerPixelY - (viewportHeight / 2);
          debugText += `\n\n=== CENTERING INFO ===`;
          debugText += `\n  Offset from center: X=${Math.round(offsetX)} Y=${Math.round(offsetY)}`;
          debugText += `\n  Spacers: Top=${this._topSpacerNeeded || 0} Bottom=${this._bottomSpacerNeeded || 0} Left=${this._leftSpacerNeeded || 0} Right=${this._rightSpacerNeeded || 0}`;
          
          // Add first render specific info
          if (this.isFirstRender) {
            debugText += `\n\n=== FIRST RENDER ===`;
            debugText += `\n  Center Scroll Calc: X=${Math.round(scrollX)} Y=${Math.round(scrollY)}`;
            debugText += `\n  Clamped Scroll: X=${Math.round(finalScrollX)} Y=${Math.round(finalScrollY)}`;
            debugText += `\n  Board can scroll X: ${boardEl.scrollWidth > boardEl.clientWidth}`;
            debugText += `\n  Board can scroll Y: ${boardEl.scrollHeight > boardEl.clientHeight}`;
          }
          
          try {
            debugEl.textContent = debugText;
            console.log('Debug Panel Updated Successfully');
          } catch (e) {
            console.error('Error updating debug panel:', e);
          }
          
          // Also log to console for easier debugging
          console.log('Debug Panel Updated:', {
            needsScrollX,
            needsScrollY,
            finalScrollX,
            finalScrollY,
            currentScrollX,
            currentScrollY,
            boardScrollWidth: boardEl.scrollWidth,
            boardScrollHeight: boardEl.scrollHeight,
            boardClientWidth: boardEl.clientWidth,
            boardClientHeight: boardEl.clientHeight,
            isFirstRender: this.isFirstRender,
            debugTextLength: debugText.length
          });
        } else {
          // Element not found - log to console as fallback
          console.log('DEBUG INFO (element not found):', {
            viewport: `${viewportWidth}×${viewportHeight}`,
            playerPixel: `X=${Math.round(playerPixelX)} Y=${Math.round(playerPixelY)}`,
            currentScroll: `X=${Math.round(currentScrollX)} Y=${Math.round(currentScrollY)}`,
            finalScroll: `X=${Math.round(finalScrollX)} Y=${Math.round(finalScrollY)}`,
            needsScroll: `X=${needsScrollX} Y=${needsScrollY}`,
            isFirstRender: this.isFirstRender
          });
        }
      }
      
      if (needsScrollX || needsScrollY) {
        const isMobile = window.innerWidth <= 768;
        
        // CRITICAL: On first render, ensure board is tall/wide enough before scrolling
        if (this.isFirstRender) {
          // Force board to be tall/wide enough for centering
          if (minBoardHeightForScroll > boardEl.scrollHeight) {
            boardEl.style.minHeight = `${minBoardHeightForScroll}px`;
            void boardEl.offsetHeight; // Force reflow
          }
          if (minBoardWidthForScroll > boardEl.scrollWidth) {
            // Width is handled by row width, but ensure it's wide enough
            const rows = boardEl.querySelectorAll('.board-row');
            rows.forEach(row => {
              row.style.minWidth = `${minBoardWidthForScroll}px`;
            });
            void boardEl.offsetWidth; // Force reflow
          }
          // Recalculate max scroll after forcing size
          const newMaxScrollX = Math.max(0, boardEl.scrollWidth - viewportWidth);
          const newMaxScrollY = Math.max(0, boardEl.scrollHeight - viewportHeight);
          // Re-clamp scroll values with new max
          const clampedScrollX = Math.max(0, Math.min(scrollX, newMaxScrollX));
          const clampedScrollY = Math.max(0, Math.min(scrollY, newMaxScrollY));
          
          // Debug: Log centering scroll
          if (window.innerWidth <= 768) {
            console.log('First render scroll:', {
              scrollX,
              scrollY,
              clampedScrollX,
              clampedScrollY,
              newMaxScrollX,
              newMaxScrollY,
              boardWidth: boardEl.scrollWidth,
              boardHeight: boardEl.scrollHeight,
              minBoardWidthForScroll,
              minBoardHeightForScroll
            });
          }
          
          if (isMobile) {
            boardEl.scrollLeft = clampedScrollX;
            boardEl.scrollTop = clampedScrollY;
          } else {
            boardEl.scrollTo({
              left: clampedScrollX,
              top: clampedScrollY,
              behavior: 'smooth'
            });
          }
        } else {
          // Normal scrolling after first render
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
      }
      
      // Always update stored position and scroll to actual DOM values
      // This ensures manual scrolling is tracked correctly
      this.lastPlayerPos = { x: playerPos.x, y: playerPos.y };
      this.lastPlayerPixelX = playerPixelX;
      this.lastPlayerPixelY = playerPixelY;
      
      // Update stored scroll position AFTER scrolling has happened
      // Read from DOM to get actual scroll (handles both manual and programmatic scrolling)
      // Use preserved scroll only if board was just rebuilt and we didn't scroll
      if (preservedScroll && !needsScrollX && !needsScrollY) {
        // Board was rebuilt but we didn't scroll - use preserved scroll
        this.lastScrollX = preservedScroll.x;
        this.lastScrollY = preservedScroll.y;
      } else {
        // Use actual DOM scroll position (after any scrolling we just did)
        this.lastScrollX = boardEl.scrollLeft;
        this.lastScrollY = boardEl.scrollTop;
      }
      
      // Clear preserved scroll after using it
      if (preservedScroll) {
        this._savedScrollBeforeRebuild = null;
      }
      
      // Update debug panel with final scroll values AFTER scrolling
      if (isMobile) {
        const debugEl = document.getElementById('debug-content');
        if (!debugEl) {
          console.error('Debug element not found after scroll! Looking for #debug-content');
        }
        if (debugEl) {
          const actualScrollAfter = boardEl.scrollLeft;
          const actualScrollYAfter = boardEl.scrollTop;
          debugEl.textContent += `\n\n=== AFTER SCROLL ===`;
          debugEl.textContent += `\n  Expected Scroll: X=${Math.round(finalScrollX)} Y=${Math.round(finalScrollY)}`;
          debugEl.textContent += `\n  Actual DOM Scroll: X=${Math.round(actualScrollAfter)} Y=${Math.round(actualScrollYAfter)}`;
          debugEl.textContent += `\n  Stored Scroll: X=${Math.round(this.lastScrollX)} Y=${Math.round(this.lastScrollY)}`;
          debugEl.textContent += `\n  Scroll Match X: ${Math.abs(actualScrollAfter - finalScrollX) < 1}`;
          debugEl.textContent += `\n  Scroll Match Y: ${Math.abs(actualScrollYAfter - finalScrollY) < 1}`;
          
          // Check if scroll actually happened
          if (needsScrollX || needsScrollY) {
            if (this.isFirstRender) {
              debugEl.textContent += `\n  ⚠️ FIRST RENDER: Scroll should have happened!`;
            }
            if (needsScrollX && Math.abs(actualScrollAfter - finalScrollX) > 1) {
              debugEl.textContent += `\n  ❌ X SCROLL FAILED! Expected ${Math.round(finalScrollX)}, got ${Math.round(actualScrollAfter)}`;
            }
            if (needsScrollY && Math.abs(actualScrollYAfter - finalScrollY) > 1) {
              debugEl.textContent += `\n  ❌ Y SCROLL FAILED! Expected ${Math.round(finalScrollY)}, got ${Math.round(actualScrollYAfter)}`;
            }
          }
          
          console.log('After scroll check:', {
            needsScrollX,
            needsScrollY,
            expectedX: finalScrollX,
            expectedY: finalScrollY,
            actualX: actualScrollAfter,
            actualY: actualScrollYAfter,
            matchX: Math.abs(actualScrollAfter - finalScrollX) < 1,
            matchY: Math.abs(actualScrollYAfter - finalScrollY) < 1
          });
        }
      }
      
      // Mark first render as complete ONLY after we've actually scrolled
      // This ensures first render centering happens reliably
      if (this.isFirstRender && (needsScrollX || needsScrollY)) {
        // Wait a bit more to ensure scroll has completed
        setTimeout(() => {
          this.isFirstRender = false;
        }, 50);
      } else if (this.isFirstRender && !needsScrollX && !needsScrollY) {
        // If we didn't need to scroll (player already centered), mark as complete immediately
        this.isFirstRender = false;
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
    
    // Store current bounds for bounds change detection (used in _centerBoardOnPlayer)
    const currentBounds = { minX, maxX, minY, maxY };
    const boundsChanged = this.lastBoardBounds && (
      this.lastBoardBounds.minX !== minX || this.lastBoardBounds.maxX !== maxX ||
      this.lastBoardBounds.minY !== minY || this.lastBoardBounds.maxY !== maxY
    );
    
    // Preserve scroll position before clearing board (prevents jump when bounds change)
    // CRITICAL: When board bounds change, clearing innerHTML can reset scroll position
    // We need to preserve it and pass it to _centerBoardOnPlayer to use instead of reading it
    let savedScrollX = boardEl.scrollLeft;
    let savedScrollY = boardEl.scrollTop;
    
    // Adjust scroll position when bounds change to maintain player's visual position
    // When board expands, the player's pixel position relative to board changes
    // We need to adjust scroll to compensate
    if (boundsChanged && this.lastBoardBounds) {
      // Calculate tile dimensions for scroll adjustment
      const tileWidth = window.innerWidth <= 480 ? 65 : 70;
      const tileHeight = window.innerWidth <= 480 ? 85 : 90;
      const gap = 2;
      const totalTileWidth = tileWidth + gap;
      const totalTileHeight = tileHeight + gap;
      
      const deltaMinX = minX - this.lastBoardBounds.minX; // Negative if expanded left
      const deltaMinY = minY - this.lastBoardBounds.minY; // Negative if expanded up
      
      // Adjust scroll: if board expanded left (deltaMinX < 0), we need to scroll right (increase scrollX)
      // to keep the player in the same visual position
      // The adjustment is: deltaMinX * totalTileWidth (negative delta = positive scroll adjustment)
      savedScrollX += -deltaMinX * totalTileWidth;
      savedScrollY += -deltaMinY * totalTileHeight;
      
      // Clamp to valid range (will be clamped again after board rebuild)
      savedScrollX = Math.max(0, savedScrollX);
      savedScrollY = Math.max(0, savedScrollY);
    }
    
    this.lastBoardBounds = currentBounds;
    
    // Store saved scroll for use in _centerBoardOnPlayer
    this._savedScrollBeforeRebuild = { x: savedScrollX, y: savedScrollY };
    
    // Clear board
    boardEl.innerHTML = '';
    
    // Restore scroll position immediately after clearing (before browser recalculates layout)
    // This prevents the scroll from jumping when the board is rebuilt
    // Set immediately first (synchronous)
    boardEl.scrollLeft = savedScrollX;
    boardEl.scrollTop = savedScrollY;
    // Then use requestAnimationFrame to ensure DOM is ready and scroll sticks
    requestAnimationFrame(() => {
      boardEl.scrollLeft = savedScrollX;
      boardEl.scrollTop = savedScrollY;
      // Force a second frame to ensure scroll sticks
      requestAnimationFrame(() => {
        boardEl.scrollLeft = savedScrollX;
        boardEl.scrollTop = savedScrollY;
      });
    });
    
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
          // Apply cache-bust color for debugging (changes with each deployment)
          marker.style.backgroundColor = this.cacheBustColor;
          marker.style.borderColor = this.cacheBustColor;
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
    
    // Add spacers to ensure board is large enough for scrolling in all directions (mobile only)
    if (window.innerWidth <= 768) {
      const tileWidth = window.innerWidth <= 480 ? 65 : 70;
      const tileHeight = window.innerWidth <= 480 ? 85 : 90;
      const gap = 2;
      const totalTileWidth = tileWidth + gap;
      const totalTileHeight = tileHeight + gap;
      const computedStyle = window.getComputedStyle(boardEl);
      const padding = parseInt(computedStyle.paddingTop) || parseInt(computedStyle.paddingLeft) || 8;
      const expectedBoardHeight = padding * 2 + (maxY - minY + 1) * totalTileHeight;
      const expectedBoardWidth = padding * 2 + (maxX - minX + 1) * totalTileWidth;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate player pixel positions
      const playerXOffset = playerPos.x - minX;
      const playerYOffset = maxY - playerPos.y;
      const tileStartX = padding + (playerXOffset * totalTileWidth);
      const tileStartY = padding + (playerYOffset * totalTileHeight);
      const playerPixelX = tileStartX + (tileWidth / 2);
      const playerPixelY = tileStartY + (tileHeight / 2);
      
      // Calculate spacer needs for centering
      // Always add spacers on all sides (at least viewport/2) to allow scrolling to center
      // This ensures we can always scroll in any direction to center the queen
      const minSpacerWidth = viewportWidth / 2;
      const minSpacerHeight = viewportHeight / 2;
      
      // Calculate how much we need to scroll to center
      const centerScrollX = playerPixelX - (viewportWidth / 2);
      const centerScrollY = playerPixelY - (viewportHeight / 2);
      
      // Add spacers: at least minSpacer on each side, plus any extra needed
      const topSpacer = Math.max(minSpacerHeight, centerScrollY < 0 ? Math.abs(centerScrollY) : minSpacerHeight);
      const bottomSpacer = Math.max(minSpacerHeight, centerScrollY > 0 ? centerScrollY : minSpacerHeight);
      const leftSpacer = Math.max(minSpacerWidth, centerScrollX < 0 ? Math.abs(centerScrollX) : minSpacerWidth);
      const rightSpacer = Math.max(minSpacerWidth, centerScrollX > 0 ? centerScrollX : minSpacerWidth);
      
      // Store for reference and scrolling
      this._topSpacerNeeded = topSpacer;
      this._leftSpacerNeeded = leftSpacer;
      this._bottomSpacerNeeded = bottomSpacer;
      this._rightSpacerNeeded = rightSpacer;
      this._centerScrollX = centerScrollX;
      this._centerScrollY = centerScrollY;
      
      // Calculate minimum dimensions needed for centering in all directions
      const minBoardHeightForScroll = Math.max(
        expectedBoardHeight,
        playerPixelY + (viewportHeight / 2) + topSpacer, // Tall enough to scroll down to center
        playerPixelY + viewportHeight + topSpacer // Allow scrolling up to center
      );
      const minBoardWidthForScroll = Math.max(
        expectedBoardWidth,
        playerPixelX + (viewportWidth / 2) + leftSpacer, // Wide enough to scroll right to center
        playerPixelX + viewportWidth + leftSpacer // Allow scrolling left to center
      );
      
      // Add top spacer if needed for centering
      if (topSpacer > 0) {
        let topSpacerEl = boardEl.querySelector('.scroll-spacer-top');
        if (!topSpacerEl) {
          topSpacerEl = document.createElement('div');
          topSpacerEl.className = 'scroll-spacer-top';
          topSpacerEl.style.width = '100%';
          topSpacerEl.style.flexShrink = '0';
          // Insert at the beginning of the board
          boardEl.insertBefore(topSpacerEl, boardEl.firstChild);
        }
        topSpacerEl.style.height = `${topSpacer}px`;
      } else {
        const topSpacerEl = boardEl.querySelector('.scroll-spacer-top');
        if (topSpacerEl) {
          topSpacerEl.remove();
        }
      }
      
      // Add left spacer if needed for centering
      // Add to each row at the beginning (like right spacer is at the end)
      if (leftSpacer > 0) {
        const rows = boardEl.querySelectorAll('.board-row');
        rows.forEach(row => {
          let leftSpacerEl = row.querySelector('.scroll-spacer-left');
          if (!leftSpacerEl) {
            leftSpacerEl = document.createElement('div');
            leftSpacerEl.className = 'scroll-spacer-left';
            leftSpacerEl.style.width = `${leftSpacer}px`;
            leftSpacerEl.style.height = '100%';
            leftSpacerEl.style.flexShrink = '0';
            leftSpacerEl.style.display = 'inline-block';
            leftSpacerEl.style.verticalAlign = 'top';
            // Insert at the beginning of the row
            row.insertBefore(leftSpacerEl, row.firstChild);
          }
          leftSpacerEl.style.width = `${leftSpacer}px`;
        });
      } else {
        // Remove left spacers from all rows
        const leftSpacers = boardEl.querySelectorAll('.scroll-spacer-left');
        leftSpacers.forEach(spacer => spacer.remove());
      }
      
      // Add bottom spacer (always add for centering)
      const bottomSpacerNeeded = this._bottomSpacerNeeded || 0;
      if (bottomSpacerNeeded > 0) {
        let spacer = boardEl.querySelector('.scroll-spacer-bottom');
        if (!spacer) {
          spacer = document.createElement('div');
          spacer.className = 'scroll-spacer-bottom';
          spacer.style.width = '100%';
          spacer.style.flexShrink = '0';
          boardEl.appendChild(spacer);
        }
        spacer.style.height = `${bottomSpacerNeeded}px`;
      }
      
      // Add right spacer (always add for centering)
      const rightSpacerNeeded = this._rightSpacerNeeded || 0;
      const rows = boardEl.querySelectorAll('.board-row');
      
      if (rightSpacerNeeded > 0) {
        rows.forEach(row => {
          let spacer = row.querySelector('.scroll-spacer-right');
          if (!spacer) {
            spacer = document.createElement('div');
            spacer.className = 'scroll-spacer-right';
            spacer.style.height = '100%';
            spacer.style.flexShrink = '0';
            spacer.style.display = 'inline-block';
            spacer.style.verticalAlign = 'top';
            row.appendChild(spacer);
          }
          spacer.style.width = `${rightSpacerNeeded}px`;
        });
      }
    }
    
    // Note: We don't restore scroll here because _centerBoardOnPlayer will handle it
    // The preserved scroll is passed to _centerBoardOnPlayer via _savedScrollBeforeRebuild
    // and it will use it if needed. Restoring here would interfere with the deadzone logic.
    
    // Scroll to center the queen after spacers are added (mobile only)
    // NOTE: Don't set isFirstRender = false here - let _centerBoardOnPlayer handle it
    if (window.innerWidth <= 768) {
      // Always call _centerBoardOnPlayer to update debug overlays and handle scrolling
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
  _updateCenterGuide(viewportWidth, viewportHeight) {
    // Draw a box around the center tile to help visualize centering
    let guide = document.getElementById('center-guide');
    if (!guide) {
      guide = document.createElement('div');
      guide.id = 'center-guide';
      guide.style.position = 'fixed';
      guide.style.pointerEvents = 'none';
      guide.style.zIndex = '9999';
      guide.style.border = '2px dashed rgba(255, 0, 0, 0.5)';
      guide.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      document.body.appendChild(guide);
    }
    
    // Center tile should be at viewport center
    const tileWidth = window.innerWidth <= 480 ? 65 : 70;
    const tileHeight = window.innerWidth <= 480 ? 85 : 90;
    const centerX = (viewportWidth / 2) - (tileWidth / 2);
    const centerY = (viewportHeight / 2) - (tileHeight / 2);
    
    guide.style.left = `${centerX}px`;
    guide.style.top = `${centerY}px`;
    guide.style.width = `${tileWidth}px`;
    guide.style.height = `${tileHeight}px`;
  }
  
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

