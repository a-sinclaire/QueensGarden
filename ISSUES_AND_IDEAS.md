# Issues and Ideas

This file tracks current bugs, issues, and ideas for future improvements.

## Current Issues / Bugs

### Critical Bugs

1. **Buffer zone not expanding**
   - **Issue**: When approaching the edge of the barrier that shows 2 tiles away from revealed tiles, the barrier does not expand
   - **Impact**: Cannot leave the original zone of active tiles
   - **Status**: Needs investigation

2. **Game over screen missing text / skipped**
   - **Issue**: Game over screen seems to have lost its text. Sometimes when dying, it seems like the game over screen is skipped entirely
   - **Impact**: Players can't see game over message
   - **Status**: Needs investigation

3. **Game should end on final king collection**
   - **Issue**: Game should end immediately when you collect the final king, even if there is a jack next to the final king that would kill you
   - **Impact**: Player can die after winning, which is confusing
   - **Status**: Needs fix

## Planned Features / Improvements

### High Priority

1. **Press and hold to destroy - release to confirm**
   - **Description**: Press and hold to destroy should only destroy when the hold is released, not when the timer expires
   - **Benefit**: Allows player to change their mind and move their finger away before releasing
   - **Status**: Planned

2. **Ace counter**
   - **Description**: Add a counter showing number of aces revealed
   - **Benefit**: Helps players track progress and plan teleportation
   - **Status**: Planned

3. **Card flip animation**
   - **Description**: Add animation when a card is revealed (maybe change to different animation later)
   - **Benefit**: Better visual feedback, more polished feel
   - **Status**: Planned

4. **Improved visual clarity for safe/dangerous tiles**
   - **Description**: Change visual design to make it easier to tell where you can and can't move safely (without taking damage), and be more clear how much damage you will take
   - **Benefit**: Better gameplay experience, reduces frustration
   - **Status**: Planned

5. **Quick restart on central chamber**
   - **Description**: Hold down on central chamber to quick restart game
   - **Benefit**: Faster iteration for testing and replaying
   - **Status**: Planned

6. **Game simulator**
   - **Description**: Make a simulator to play games automatically to estimate which percentage of them are possible/winnable
   - **Benefit**: Helps balance game difficulty and understand game mechanics
   - **Status**: Planned

## AI Ideas

*Note: These ideas need human approval before implementation*

1. **Visual damage preview**
   - Show damage numbers on hover/tap for unrevealed tiles based on current party immunities
   - Could use color coding (green = safe, yellow = some damage, red = high damage)

2. **Mini-map**
   - Small overview map showing explored area and player position
   - Could be toggleable or always visible in corner

3. **Move history / undo**
   - Allow undoing last move (maybe limited to 1-3 undos)
   - Could help with learning and reduce frustration from accidental moves

4. **Difficulty settings**
   - Easy: More starting health, easier king requirements
   - Hard: Less health, stricter rules
   - Could make game accessible to more players

5. **Statistics tracking**
   - Track games played, wins, losses, average moves, etc.
   - Could store in localStorage and show in a stats screen

6. **Sound effects**
   - Add subtle sound effects for moves, card reveals, damage, victory
   - Could enhance immersion without being distracting

7. **Accessibility improvements**
   - Keyboard navigation for all UI elements
   - Screen reader support
   - High contrast mode
   - Colorblind-friendly color schemes

8. **Save/load game state**
   - Allow saving current game state to localStorage
   - Resume later from saved state
   - Could help with longer play sessions

9. **Tutorial mode**
   - Interactive tutorial explaining game mechanics
   - Step-by-step guidance for first-time players

10. **Replay system**
    - Record game moves and allow replaying
    - Could help with debugging and sharing interesting games

