/**
 * Version Information
 */

const GAME_VERSION = {
  major: 1,
  minor: 3,
  patch: 0,
  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_VERSION;
}

