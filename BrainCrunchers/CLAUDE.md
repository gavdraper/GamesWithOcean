# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Brain Crunchers is a multiplication table practice game where a player races against a zombie. It's a single-page web application built with vanilla JavaScript, HTML, CSS, and Phaser 3 for game graphics.

## Architecture

The codebase follows a modular architecture with separate concerns:

### Core Modules

- **config.js**: Central configuration for game mechanics, scoring, and difficulty settings
  - `CONFIG.maxZombieDistance`: Controls difficulty (wrong answers before game over)
  - `CONFIG.questionsToWin`: Target questions per session
  - `CONFIG.speedThresholds`: Time-based scoring brackets
  - `CONFIG.rankingPoints`: Point values for different speed/accuracy combinations

- **game.js**: Core game state and logic
  - `Game` object manages: current table, questions, scoring, timers, zombie position
  - Speed-based ranking system: faster correct answers = more points (2-10 points)
  - Penalty system: wrong answers move zombie closer and reduce ranking (-3 to -7 points)

- **phaserGame.js**: Phaser 3 game rendering and animations
  - `GameScene`: Creates player/zombie sprites programmatically (no image assets)
  - `PhaserGameManager`: Manages Phaser lifecycle and scene interactions
  - Key animations: player celebration, zombie movement, attack sequence (splits player sprite)

- **storage.js**: LocalStorage persistence layer
  - Stores rankings per table, game statistics, play time
  - Key: `brainCrunchersData` in localStorage
  - Tracks: rankings, games played, time per table, most played table

- **ui.js**: Screen management and user interaction
  - Manages 5 screens: menu, table-select, game, game-over, stats
  - Keyboard navigation with hotkeys (P=play, S=stats, E=exit, ESC=back, arrow keys)
  - Number pad interface for touch/mobile input

### Data Flow

1. User selects table → `UI.startGame()` → `Game.start()`
2. Game generates question → Updates UI → Starts timer
3. User submits answer → `Game.checkAnswer()` → Calculates speed-based points
4. Correct: player celebrates, next question | Wrong: zombie moves closer
5. Game end: Updates `Storage` rankings/stats → Shows game-over screen

### Key Integration Points

- **Phaser-Game Communication**: Game logic calls `PhaserGameManager` methods for visual feedback
  - `updateZombiePosition()`: Called when wrong answer moves zombie
  - `playerCelebrate()`: Called on correct answer
  - `zombieAttack()`: Called on game over (includes callback for timing)

- **Screen Transitions**: UI module coordinates between screens and initializes/resets Phaser game
  - Phaser must be initialized AFTER game screen is visible (needs DOM dimensions)
  - Reset vs Init: Reuse existing Phaser instance when playing again

## Development Workflow

This is a static web application with no build process. Development workflow:

1. **Running locally**: Open `index.html` in a browser or use a local server
   - Python: `python -m http.server 8000`
   - Node: `npx http-server`

2. **No build/compile step**: All JavaScript files are loaded directly via script tags

3. **Testing changes**: Refresh browser to see updates

4. **Storage debugging**: Use browser DevTools → Application → Local Storage → `brainCrunchersData`

## Important Implementation Details

- **Timing is critical**: Speed-based scoring means timer precision matters (100ms intervals)
- **Phaser lifecycle**: Game initialization must wait for DOM (uses setTimeout/events)
- **LocalStorage schema**: Rankings are cumulative (never decrease below 0), stats are additive
- **Responsive design**: Phaser canvas resizes on window resize, sprite positions recalculate
- **No external dependencies**: Phaser 3 loaded from CDN, everything else is vanilla JS

## Code Quality Standards

When writing or modifying code in this repository, always follow these principles:

- **Clean Code**: Write code that is readable, self-documenting, and easy to understand
  - Use meaningful variable and function names
  - Keep functions small and focused on a single responsibility
  - Avoid deep nesting and complex conditionals

- **Testable Code**: Structure code to be easily testable
  - Minimize side effects and global state mutations
  - Design functions with clear inputs and outputs
  - Separate concerns to allow unit testing of individual components

- **SOLID Principles**: Adhere to SOLID design principles
  - **Single Responsibility**: Each module/function should have one reason to change
  - **Open/Closed**: Open for extension, closed for modification
  - **Liskov Substitution**: Derived types must be substitutable for their base types
  - **Interface Segregation**: No code should depend on methods it doesn't use
  - **Dependency Inversion**: Depend on abstractions, not concretions
