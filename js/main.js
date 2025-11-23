/**
 * Main Entry Point
 * Initializes game and handles user input
 */

let gameEngine = null;
let renderer = null;
let destroyMode = false;
let selectedKing = null;
let keyboardHandler = null; // Store reference to keyboard event handler

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
 */
function setupMobileControls() {
  const mobileButtons = document.querySelectorAll('.mobile-btn');
  
  mobileButtons.forEach(btn => {
    // Use both click and touchend for better mobile support
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
    
    // Prevent default touch behaviors
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
    }, { passive: false });
    
    btn.addEventListener('click', handleMove);
    btn.addEventListener('touchend', handleMove);
  });
  
  // Add swipe gesture support for movement
  setupSwipeControls();
}

/**
 * Setup swipe gesture controls for mobile
 */
function setupSwipeControls() {
  let touchStartX = null;
  let touchStartY = null;
  let touchEndX = null;
  let touchEndY = null;
  
  const minSwipeDistance = 50; // Minimum distance for a swipe
  
  const handleTouchStart = (e) => {
    if (destroyMode) return; // Don't interfere with destroy mode
    
    const firstTouch = e.touches[0];
    touchStartX = firstTouch.clientX;
    touchStartY = firstTouch.clientY;
  };
  
  const handleTouchEnd = (e) => {
    if (!gameEngine || gameEngine.gameOver || destroyMode) {
      return;
    }
    
    if (touchStartX === null || touchStartY === null) {
      return;
    }
    
    const lastTouch = e.changedTouches[0];
    touchEndX = lastTouch.clientX;
    touchEndY = lastTouch.clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Check if it's a significant swipe
    if (Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      return; // Not a swipe, might be a tap
    }
    
    // Determine direction based on which axis has larger movement
    let direction = null;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        direction = 'east';
      } else {
        direction = 'west';
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        direction = 'south';
      } else {
        direction = 'north';
      }
    }
    
    if (direction) {
      e.preventDefault();
      const result = gameEngine.movePlayer(direction);
      if (!result.success) {
        // Visual feedback could be added here
        console.log('Invalid move:', result.message);
      }
    }
    
    // Reset
    touchStartX = null;
    touchStartY = null;
  };
  
  // Add swipe listeners to the game board
  const gameBoard = document.getElementById('game-board');
  if (gameBoard) {
    gameBoard.addEventListener('touchstart', handleTouchStart, { passive: true });
    gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });
  }
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
  
  // Re-render to show highlights
  if (gameEngine) {
    renderer.render(gameEngine.getGameState());
  }
}

/**
 * Handle tile click for destroy mode and teleportation
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
  
  // Handle teleportation (when not in destroy mode)
  // Can only teleport FROM Aces, not from central chamber
  const playerPos = gameEngine.player.position;
  const currentTile = gameEngine.board.get(`${playerPos.x},${playerPos.y}`);
  
  if (currentTile) {
    const isOnAce = currentTile.card && currentTile.card.getType() === 'ace';
    
    // Only allow teleportation from Aces
    if (isOnAce) {
      // Check if clicked tile is a valid teleport destination
      const targetTile = gameEngine.board.get(`${x},${y}`);
      if (targetTile) {
        const targetIsAce = targetTile.card && targetTile.card.getType() === 'ace';
        const targetIsCentralChamber = targetTile.isCentralChamber;
        
        if (targetIsAce || targetIsCentralChamber) {
          // Teleport!
          const result = gameEngine.teleport({ x, y });
          if (!result.success) {
            alert(result.message);
          }
          // Success is handled by renderer update
        }
      }
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
  
  gameEngine = null;
  renderer = null;
  destroyMode = false;
  selectedKing = null;
}

// Make handleTileClick available globally for renderer
window.handleTileClick = handleTileClick;

