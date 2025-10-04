// UI Manager
const UI = {
    currentFocusIndex: 0,
    focusableElements: [],

    // Initialize UI and event listeners
    init() {
        this.setupEventListeners();
        this.showScreen('menu-screen');
    },

    // Setup all event listeners
    setupEventListeners() {
        // Global keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Menu buttons
        document.getElementById('play-btn').addEventListener('click', () => {
            this.showTableSelect();
        });

        document.getElementById('stats-btn').addEventListener('click', () => {
            this.showStats();
        });

        // Table select
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
        });

        // Stats
        document.getElementById('back-from-stats-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
        });

        // Game
        document.getElementById('answer-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.submitAnswer();
            }
        });


        // Game over
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.startGame(Game.getCurrentTable());
        });

        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showScreen('menu-screen');
        });
    },

    // Handle keyboard navigation
    handleKeyboard(e) {
        const activeScreen = document.querySelector('.screen.active');
        if (!activeScreen) return;

        const screenId = activeScreen.id;

        // Escape key - go back
        if (e.key === 'Escape') {
            if (screenId === 'table-select-screen' || screenId === 'stats-screen') {
                this.showScreen('menu-screen');
            } else if (screenId === 'game-screen') {
                Game.stopQuestionTimer();
                this.showScreen('menu-screen');
            } else if (screenId === 'game-over-screen') {
                this.showScreen('menu-screen');
            }
            return;
        }

        // Arrow key navigation
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.handleArrowNavigation(e.key, screenId);
            return;
        }

        // Enter key - activate focused element
        if (e.key === 'Enter') {
            if (screenId !== 'game-screen') { // Don't interfere with answer input
                this.activateFocusedElement();
                return;
            }
        }

        // Menu screen hotkeys
        if (screenId === 'menu-screen') {
            if (e.key === 'p' || e.key === 'P') {
                this.showTableSelect();
            } else if (e.key === 's' || e.key === 'S') {
                this.showStats();
            }
        }

        // Table select screen - number keys
        if (screenId === 'table-select-screen') {
            const num = parseInt(e.key);
            if (num >= 2 && num <= 12) {
                this.startGame(num);
            }
        }

        // Game over screen hotkeys (only for non-arrow/enter keys)
        if (screenId === 'game-over-screen') {
            if (e.key === 'm' || e.key === 'M') {
                this.showScreen('menu-screen');
            }
        }
    },

    // Handle arrow key navigation
    handleArrowNavigation(key, screenId) {
        this.updateFocusableElements(screenId);

        if (this.focusableElements.length === 0) return;

        // Remove current focus
        this.focusableElements.forEach(el => el.classList.remove('focused'));

        // Calculate new focus index based on arrow key
        if (key === 'ArrowUp' || key === 'ArrowLeft') {
            this.currentFocusIndex--;
            if (this.currentFocusIndex < 0) {
                this.currentFocusIndex = this.focusableElements.length - 1;
            }
        } else if (key === 'ArrowDown' || key === 'ArrowRight') {
            this.currentFocusIndex++;
            if (this.currentFocusIndex >= this.focusableElements.length) {
                this.currentFocusIndex = 0;
            }
        }

        // Apply focus to new element
        this.focusableElements[this.currentFocusIndex].classList.add('focused');
        this.focusableElements[this.currentFocusIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    // Update the list of focusable elements for current screen
    updateFocusableElements(screenId) {
        const screen = document.getElementById(screenId);
        if (!screen) return;

        // Get all buttons in the current screen
        this.focusableElements = Array.from(screen.querySelectorAll('.menu-btn, .table-btn, .back-btn'));

        // Ensure current index is valid
        if (this.currentFocusIndex >= this.focusableElements.length) {
            this.currentFocusIndex = 0;
        }
    },

    // Activate the currently focused element
    activateFocusedElement() {
        if (this.focusableElements.length > 0 && this.focusableElements[this.currentFocusIndex]) {
            this.focusableElements[this.currentFocusIndex].click();
        }
    },

    // Show a specific screen
    showScreen(screenId) {
        // Remove focus from all elements
        this.focusableElements.forEach(el => el.classList.remove('focused'));

        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        // Reset focus index and initialize first element focus
        this.currentFocusIndex = 0;
        this.updateFocusableElements(screenId);
        if (this.focusableElements.length > 0) {
            this.focusableElements[0].classList.add('focused');
        }
    },

    // Show table selection screen
    showTableSelect() {
        const container = document.getElementById('table-buttons');
        container.innerHTML = '';

        CONFIG.availableTables.forEach(table => {
            const button = document.createElement('button');
            button.className = 'table-btn';

            const ranking = Storage.getRanking(table);
            const medal = Storage.getMedal(ranking);

            button.innerHTML = `
                ${medal ? `<span class="medal">${medal}</span>` : ''}
                <div>${table}x</div>
                <span class="ranking">Rank: ${ranking}</span>
            `;

            button.addEventListener('click', () => {
                this.startGame(table);
            });

            container.appendChild(button);
        });

        this.showScreen('table-select-screen');
    },

    // Show stats screen
    showStats() {
        const stats = Storage.getStats();

        // Total games
        document.getElementById('total-games').textContent = stats.gamesPlayed;

        // Most played table
        const mostPlayed = Storage.getMostPlayedTable();
        document.getElementById('most-played').textContent = mostPlayed ? `${mostPlayed}x` : '-';

        // Total time
        document.getElementById('total-time').textContent = Storage.formatTime(stats.totalTimePlayedSeconds);

        // Table times
        const tableTimesContainer = document.getElementById('table-times');
        tableTimesContainer.innerHTML = '';

        CONFIG.availableTables.forEach(table => {
            const timeSeconds = stats.tableTimePlayed[table] || 0;
            const div = document.createElement('div');
            div.className = 'table-time-item';
            div.innerHTML = `
                <div class="table-num">${table}x</div>
                <div class="time-value">${Storage.formatTime(timeSeconds)}</div>
            `;
            tableTimesContainer.appendChild(div);
        });

        this.showScreen('stats-screen');
    },

    // Start a game
    startGame(tableNumber) {
        Game.start(tableNumber);

        // Update UI
        document.getElementById('current-table').textContent = tableNumber;
        document.getElementById('current-score').textContent = 0;
        document.getElementById('question-timer').textContent = '0.0s';

        this.updateQuestion(Game.getCurrentQuestion());

        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';

        // Show screen FIRST so the container has dimensions
        this.showScreen('game-screen');

        // THEN initialize or reset Phaser game after screen is visible
        setTimeout(() => {
            if (!PhaserGameManager.game) {
                PhaserGameManager.init();
            } else {
                PhaserGameManager.reset();
            }

            // Focus on input
            document.getElementById('answer-input').focus();
        }, 100);
    },

    // Update question display
    updateQuestion(question) {
        document.getElementById('question').textContent =
            `${Game.getCurrentTable()} × ${question.multiplier} = ?`;
        document.getElementById('answer-input').value = '';
        document.getElementById('feedback').textContent = '';
        document.getElementById('feedback').className = 'feedback';
    },

    // Submit answer
    submitAnswer() {
        const input = document.getElementById('answer-input');
        const userAnswer = input.value.trim();

        if (userAnswer === '') {
            return;
        }

        const isCorrect = Game.checkAnswer(userAnswer);
        document.getElementById('current-score').textContent = Game.getCurrentScore();
    },

    // Show feedback
    showFeedback(message, type) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = message;
        feedback.className = `feedback ${type}`;
    },

    // Update zombie position
    updateZombiePosition(position) {
        PhaserGameManager.updateZombiePosition(position);
    },

    // Show game over screen
    showGameOver(won, correctAnswers, newRanking, tableNumber) {
        const message = won
            ? `🎉 You survived! Great job on your ${tableNumber}x table!`
            : `The zombie got you! Better luck next time with ${tableNumber}x!`;

        document.getElementById('game-over-message').textContent = message;
        document.getElementById('final-correct').textContent = correctAnswers;
        document.getElementById('final-ranking').textContent = newRanking;

        this.showScreen('game-over-screen');
    }
};

// Initialize UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
