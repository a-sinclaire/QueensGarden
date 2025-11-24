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
    alert('No Kings with unused destroy abilities available!');
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

/**
 * Handle tile click for movement, destroy mode, and teleportation
 */
function handleTileClick(x, y) {
  if (!gameEngine) {
    return;
  }
  
  // Handle destroy mode
  if (destroyMode && selectedKing) {
    const result = gameEngine.destroyTile({ x, y }, selectedKing);
    
    if (result.success) {
      // Exit destroy mode after successful destroy
      toggleDestroyMode();
    } else {
      // Show error
      alert(result.message);
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
  console.log('handleTileClick called:', { x, y, playerPos });
  const result = gameEngine.moveToPosition(x, y);
  if (!result.success) {
    // Visual feedback for invalid move
    console.log('Cannot move:', result.message);
    // Don't alert for same position - just silently ignore
    if (result.message !== 'Cannot move to the same position') {
      alert(result.message);
    }
  }
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

// Make handleTileClick available globally for renderer
window.handleTileClick = handleTileClick;

