/**
 * Console Renderer
 * Basic text-based renderer for MVP/testing
 * Can be replaced with visual renderer later
 */

class ConsoleRenderer extends RendererInterface {
  constructor() {
    super();
    this.gameEngine = null;
  }
  
  initialize(gameEngine) {
    this.gameEngine = gameEngine;
    console.log('=== Queen\'s Garden ===');
    console.log('Game initialized!');
  }
  
  render(gameState) {
    console.clear();
    console.log('=== Queen\'s Garden ===');
    console.log(`Turn: ${gameState.turn}`);
    console.log(`Health: ${gameState.player.health}/${GAME_RULES.startingHealth}`);
    console.log(`Position: (${gameState.player.position.x}, ${gameState.player.position.y})`);
    console.log(`Deck Size: ${gameState.deckSize}`);
    console.log('');
    
    // Party display
    console.log('Party:');
    gameState.player.party.forEach((queen, i) => {
      console.log(`  ${i + 1}. ${queen.toString()}`);
    });
    console.log(`Immunities: ${gameState.player.getImmunities().join(', ')}`);
    console.log('');
    
    // Collected Kings
    if (gameState.player.collectedKings.length > 0) {
      console.log('Collected Kings:');
      gameState.player.collectedKings.forEach((king, i) => {
        console.log(`  ${i + 1}. ${king.toString()}`);
      });
      console.log('');
    }
    
    // Board display (simple grid)
    this._renderBoard(gameState.board, gameState.player.position);
    
    if (gameState.gameOver) {
      if (gameState.victory) {
        console.log('\n🎉 VICTORY! You collected all 4 Kings! 🎉');
      } else {
        console.log('\n💀 GAME OVER - You died! 💀');
      }
    } else {
      console.log('\nUse arrow keys to move, or type commands in console');
    }
  }
  
  _renderBoard(board, playerPos) {
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
    
    console.log('Board:');
    console.log('  ' + ' '.repeat((maxX - minX + 1) * 4));
    
    // Render from top to bottom (y descending)
    for (let y = maxY; y >= minY; y--) {
      let row = '  ';
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`;
        const tile = board.get(key);
        
        if (x === playerPos.x && y === playerPos.y) {
          row += '[P] ';
        } else if (tile) {
          if (tile.isCentralChamber) {
            row += '[C] ';
          } else if (tile.card) {
            const card = tile.card;
            const suitSymbol = this._getSuitSymbol(card.suit);
            const rankSymbol = this._getRankSymbol(card.rank);
            row += `${rankSymbol}${suitSymbol} `;
          } else {
            row += '[ ] ';
          }
        } else {
          row += ' .  ';
        }
      }
      console.log(row);
    }
    console.log('');
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
  
  onDamage(amount, newHealth, source = null) {
    const sourceMsg = source ? ` from ${source}` : '';
    console.log(`\n⚔️  Took ${amount} damage${sourceMsg}! Health: ${newHealth}`);
  }
  
  onQueenCollected(queen) {
    console.log(`\n👑 Collected ${queen.toString()}! Added to party.`);
  }
  
  onKingCollected(king) {
    console.log(`\n👑👑 Collected ${king.toString()}!`);
  }
  
  onGameOver(victory) {
    // Handled in render()
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConsoleRenderer;
}

