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
});

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

