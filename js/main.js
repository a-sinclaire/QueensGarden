/**
 * Main Entry Point
 * Initializes game and handles user input
 */

let gameEngine = null;
let renderer = null;
let destroyMode = false;
let selectedKing = null;
let keyboardHandler = null; // Store reference to keyboard event handler

/**
 * Mobile console logger - shows console messages on screen
 */
function addMobileConsoleLog(message, type = 'log') {
  if (window.innerWidth <= 768) {
    const consoleEl = document.getElementById('mobile-console');
    if (consoleEl) {
      consoleEl.style.display = 'block';
      const logEntry = document.createElement('div');
      logEntry.className = `console-${type}`;
      logEntry.textContent = `[${type.toUpperCase()}] ${message}`;
      consoleEl.appendChild(logEntry);
      // Keep only last 5 messages
      while (consoleEl.children.length > 5) {
        consoleEl.removeChild(consoleEl.firstChild);
      }
      // Auto-scroll to bottom
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }
}

// Override console methods to show on mobile
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  const originalError = console.error;
  console.warn = function(...args) {
    originalWarn.apply(console, args);
    addMobileConsoleLog(args.join(' '), 'warn');
  };
  console.error = function(...args) {
    originalError.apply(console, args);
    addMobileConsoleLog(args.join(' '), 'error');
  };
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  setupQueenSelection();
  setupVersion();
});

/**
 * Setup version number display
 */
function setupVersion() {
  const versionEl = document.getElementById('version-number');
  if (versionEl && typeof GAME_VERSION !== 'undefined') {
    versionEl.textContent = GAME_VERSION.toString();
  }
  
  // Also set mobile version number
  const mobileVersionEl = document.getElementById('mobile-version-number');
  if (mobileVersionEl && typeof GAME_VERSION !== 'undefined') {
    mobileVersionEl.textContent = GAME_VERSION.toString();
  }
}

/**
 * Setup queen selection screen
 */
function setupQueenSelection() {
  const queenButtons = document.querySelectorAll('.queen-btn');
  
  queenButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const suit = btn.dataset.suit;
      startGame(suit);
    });
  });
}

/**
 * Start a new game with chosen queen
 */
function startGame(queenSuit) {
  // Hide setup screen, show game screen
  document.getElementById('game-setup').style.display = 'none';
  document.getElementById('game-play').style.display = 'flex';
  
  // Create renderer (DOM renderer for web)
  renderer = new DOMRenderer('game-play');
  
  // Create game engine
  gameEngine = new GameEngine(GAME_RULES, renderer);
  
  // Create starting queen
  const startingQueen = { suit: queenSuit, rank: 'queen' };
  
  // Initialize game
  gameEngine.initialize(startingQueen);
  
  // Setup keyboard controls
  setupKeyboardControls();
  
  // Setup mobile touch controls
  setupMobileControls();
  
  // Setup restart button
  document.getElementById('restart-btn').addEventListener('click', () => {
    resetGame();
  });
  
  // Setup destroy mode button
  const destroyBtn = document.getElementById('destroy-mode-btn');
  if (destroyBtn) {
    destroyBtn.addEventListener('click', () => {
      toggleDestroyMode();
    });
  }
}

/**
 * Setup mobile touch controls
 * Note: Tap-to-move is handled in the renderer when tiles are clicked
 */
function setupMobileControls() {
  // Mobile controls are now handled via tap-to-move on tiles
  // Keep button controls as backup option
  const mobileButtons = document.querySelectorAll('.mobile-btn');
  
  mobileButtons.forEach(btn => {
    const handleMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!gameEngine || gameEngine.gameOver || destroyMode) {
        return;
      }
      
      const direction = btn.dataset.direction;
      if (direction) {
        const result = gameEngine.movePlayer(direction);
        if (!result.success) {
          // Visual feedback for invalid move
          btn.style.backgroundColor = 'var(--health-color)';
          setTimeout(() => {
            btn.style.backgroundColor = '';
          }, 200);
        } else {
          // Visual feedback for successful move
          btn.style.backgroundColor = 'var(--party-color)';
          setTimeout(() => {
            btn.style.backgroundColor = '';
          }, 150);
        }
      }
    };
    
    btn.addEventListener('click', handleMove);
    btn.addEventListener('touchend', handleMove);
  });
}

/**
 * Setup keyboard controls for movement
 */
function setupKeyboardControls() {
  // Remove existing handler if it exists
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
  }
  
  // Create new handler
  keyboardHandler = (e) => {
    if (!gameEngine || gameEngine.gameOver) {
      return;
    }
    
    // Handle destroy mode toggle
    if (e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      toggleDestroyMode();
      return;
    }
    
    // Don't allow movement in destroy mode
    if (destroyMode) {
      return;
    }
    
    let direction = null;
    
    switch(e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'north';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'south';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'west';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'east';
        break;
      default:
        return; // Ignore other keys
    }
    
    e.preventDefault();
    
    if (direction) {
      const result = gameEngine.movePlayer(direction);
      if (!result.success) {
        // Show error message (can be enhanced with visual feedback)
        console.log(result.message);
      }
    }
  };
  
  // Add the new handler
  document.addEventListener('keydown', keyboardHandler);
}

/**
 * Toggle destroy mode
 */
function toggleDestroyMode() {
  if (!gameEngine || gameEngine.gameOver) {
    return;
  }
  
  // Check if player has any Kings with unused abilities
  const availableKings = gameEngine.player.collectedKings.filter(king => 
    !gameEngine.player.hasKingAbilityUsed(king)
  );
  
  if (availableKings.length === 0 && !destroyMode) {
    // Silently ignore - no popup needed
    return;
  }
  
  destroyMode = !destroyMode;
  
  // Select first available King if entering destroy mode
  if (destroyMode && availableKings.length > 0) {
    selectedKing = availableKings[0];
  } else {
    selectedKing = null;
  }
  
  // Update UI
  const destroyModeEl = document.getElementById('destroy-mode');
  const destroyBtn = document.getElementById('destroy-mode-btn');
  
  if (destroyModeEl) {
    destroyModeEl.style.display = destroyMode ? 'block' : 'none';
  }
  
  if (destroyBtn) {
    destroyBtn.textContent = destroyMode 
      ? 'Cancel Destroy Mode (X)' 
      : `Use King to Destroy Tile (X)`;
    destroyBtn.style.display = availableKings.length > 0 ? 'block' : 'none';
  }
  
  // Update renderer to show/hide destroyable tiles
  if (renderer && renderer.updateDestroyMode) {
    renderer.updateDestroyMode(destroyMode, selectedKing);
  }
  
  // Store in window for renderer access
  window.destroyMode = destroyMode;
  window.selectedKing = selectedKing;
  window.toggleDestroyMode = toggleDestroyMode; // Make available for mobile HUD
  
  // Re-render to show highlights
  if (gameEngine) {
    renderer.render(gameEngine.getGameState());
  }
}

// Track last tile click to prevent double-firing from touch + click events
let lastTileClick = { x: null, y: null, time: 0 };
const TILE_CLICK_COOLDOWN = 300; // ms - prevent same tile click within 300ms

/**
 * Handle tile click for movement, destroy mode, and teleportation
 */
function handleTileClick(x, y) {
  if (!gameEngine) {
    return;
  }
  
  // Prevent double-firing from both touch and click events
  const now = Date.now();
  if (lastTileClick.x === x && lastTileClick.y === y && (now - lastTileClick.time) < TILE_CLICK_COOLDOWN) {
    return; // Ignore duplicate click within cooldown period
  }
  lastTileClick = { x, y, time: now };
  
  // Handle destroy mode
  if (destroyMode && selectedKing) {
    const result = gameEngine.destroyTile({ x, y }, selectedKing);
    
    if (result.success) {
      // Exit destroy mode after successful destroy
      toggleDestroyMode();
    } else {
      // Visual feedback for destroy errors
      showErrorFeedback(x, y, result.message);
    }
    return;
  }
  
  const playerPos = gameEngine.player.position;
  const currentTile = gameEngine.board.get(`${playerPos.x},${playerPos.y}`);
  const targetTile = gameEngine.board.get(`${x},${y}`);
  
  if (!targetTile) {
    return; // Tile doesn't exist
  }
  
  // Check if clicked tile is adjacent to player (for movement)
  const isAdjacent = Math.abs(x - playerPos.x) + Math.abs(y - playerPos.y) === 1;
  
  // Handle all moves (both adjacent and teleport) using moveToPosition
  // This consolidates move and teleport logic into one place
  const result = gameEngine.moveToPosition(x, y);
  if (!result.success) {
    // Visual feedback for move errors
    showErrorFeedback(x, y, result.message);
    // Don't render on failed moves - prevents cards from flipping
    return;
  }
  // Only render if move was successful (tiles will be revealed)
  renderer.render(gameEngine.getGameState());
}

/**
 * Reset game to setup screen
 */
function resetGame() {
  document.getElementById('game-over').style.display = 'none';
  document.getElementById('game-setup').style.display = 'flex';
  document.getElementById('game-play').style.display = 'none';
  
  // Remove keyboard event listener
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }
  
  // Reset renderer's render tracking so it centers on next game start
  if (renderer) {
    renderer._hasRendered = false;
  }
  
  gameEngine = null;
  renderer = null;
  destroyMode = false;
  selectedKing = null;
}

// Expose resetGame for quick restart
window.resetGame = resetGame;

/**
 * Show visual error feedback (shake tile, highlight relevant UI)
 */
function showErrorFeedback(x, y, errorMessage) {
  // Find the target tile element
  const boardEl = document.getElementById('game-board');
  if (!boardEl) return;
  
  const tileEl = boardEl.querySelector(`[data-x="${x}"][data-y="${y}"]`);
  if (tileEl) {
    // Shake animation
    tileEl.classList.add('error-shake');
    setTimeout(() => {
      tileEl.classList.remove('error-shake');
    }, 500);
  }
  
  // Check if this is a king collection error
  if (errorMessage && (errorMessage.includes('Queen') || errorMessage.includes('Need Queen'))) {
    // Try to extract the missing suit from the error or target tile
    let missingSuit = null;
    
    // Get the target tile to see what king we're trying to collect
    if (gameEngine) {
      const targetTile = gameEngine.board.get(`${x},${y}`);
      if (targetTile && targetTile.card && targetTile.card.getType() === 'king') {
        const kingCard = targetTile.card;
        const kingColor = kingCard.getColor();
        const kingSuit = kingCard.suit;
        
        // Find which queen is missing (same color, different suit)
        const allSuits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const sameColorSuits = allSuits.filter(suit => {
          const suitColor = GAME_RULES.suitColors[suit];
          return suitColor === kingColor && suit !== kingSuit;
        });
        
        // Check which one is missing from party
        if (gameEngine.player.party) {
          const ownedSuits = new Set(gameEngine.player.party.map(q => q.suit));
          missingSuit = sameColorSuits.find(suit => !ownedSuits.has(suit));
        }
      }
    }
    
    // Update party display with highlight
    if (renderer && missingSuit) {
      console.log('Highlighting missing queen suit:', missingSuit);
      renderer._updateParty(gameEngine.player.party, missingSuit);
      // Remove highlight after animation
      setTimeout(() => {
        if (renderer) {
          renderer._updateParty(gameEngine.player.party, null);
        }
      }, 2000);
    } else {
      console.log('Could not find missing suit. missingSuit:', missingSuit, 'renderer:', renderer);
      // Just highlight party display
      const partyDisplay = document.getElementById('party-display');
      const mobileParty = document.getElementById('mobile-party');
      if (partyDisplay) {
        partyDisplay.classList.add('error-glow');
        setTimeout(() => partyDisplay.classList.remove('error-glow'), 1000);
      }
      if (mobileParty) {
        mobileParty.classList.add('error-glow');
        setTimeout(() => mobileParty.classList.remove('error-glow'), 1000);
      }
    }
  }
  
  // Don't highlight king box for king collection errors - only highlight missing queen
  // (King-related errors like "no available kings" still highlight king box)
  if (errorMessage && errorMessage.includes('ability') && !errorMessage.includes('Queen')) {
    // Highlight kings display for ability-related errors (not collection errors)
    const kingsDisplay = document.getElementById('kings-display');
    const mobileKings = document.getElementById('mobile-kings');
    if (kingsDisplay) {
      kingsDisplay.classList.add('error-glow');
      setTimeout(() => kingsDisplay.classList.remove('error-glow'), 1000);
    }
    if (mobileKings) {
      mobileKings.classList.add('error-glow');
      setTimeout(() => mobileKings.classList.remove('error-glow'), 1000);
    }
  }
}

// Make handleTileClick available globally for renderer
window.handleTileClick = handleTileClick;

