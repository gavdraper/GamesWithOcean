// Game State Manager
const Game = {
    currentTable: null,
    currentQuestion: null,
    correctAnswers: 0,
    zombiePosition: CONFIG.maxZombieDistance,
    totalRankingChange: 0,
    gameStartTime: null,
    questionStartTime: null,
    questionTimer: null,
    questionHistory: {}, // Track question attempts: { "2x3": { attempts: 2, bestTime: 2.5 } }

    // Start a new game
    start(tableNumber) {
        this.currentTable = tableNumber;
        this.correctAnswers = 0;
        this.zombiePosition = CONFIG.maxZombieDistance;
        this.totalRankingChange = 0;
        this.gameStartTime = Date.now();
        this.questionHistory = {}; // Reset history for new game
        this.generateQuestion();
        this.startQuestionTimer();
    },

    // Generate a new multiplication question
    generateQuestion() {
        const multiplier = Math.floor(
            Math.random() * (CONFIG.multiplicationRange.max - CONFIG.multiplicationRange.min + 1)
        ) + CONFIG.multiplicationRange.min;

        this.currentQuestion = {
            multiplier: multiplier,
            answer: this.currentTable * multiplier
        };

        this.questionStartTime = Date.now();
    },

    // Start the question timer
    startQuestionTimer() {
        this.stopQuestionTimer();
        this.questionTimer = setInterval(() => {
            const elapsed = ((Date.now() - this.questionStartTime) / 1000).toFixed(1);
            document.getElementById('question-timer').textContent = `${elapsed}s`;
        }, 100);
    },

    // Stop the question timer
    stopQuestionTimer() {
        if (this.questionTimer) {
            clearInterval(this.questionTimer);
            this.questionTimer = null;
        }
    },

    // Get time taken for current question in seconds
    getQuestionTime() {
        return (Date.now() - this.questionStartTime) / 1000;
    },

    // Get adjusted speed thresholds based on question history
    getAdjustedThresholds() {
        const questionKey = `${this.currentTable}x${this.currentQuestion.multiplier}`;
        const history = this.questionHistory[questionKey];

        // If we've seen this question before and answered correctly, expect faster
        if (history && history.attempts > 0 && history.bestTime) {
            // Reduce thresholds by 20% for each previous attempt (minimum 50% of original)
            const reduction = Math.min(0.2 * history.attempts, 0.5);
            return {
                fast: CONFIG.speedThresholds.fast * (1 - reduction),
                medium: CONFIG.speedThresholds.medium * (1 - reduction),
                slow: CONFIG.speedThresholds.slow * (1 - reduction)
            };
        }

        return CONFIG.speedThresholds;
    },

    // Calculate ranking points based on speed
    calculateRankingPoints(isCorrect, timeInSeconds) {
        const thresholds = this.getAdjustedThresholds();

        if (isCorrect) {
            if (timeInSeconds < thresholds.fast) {
                return CONFIG.rankingPoints.correct.fast;
            } else if (timeInSeconds < thresholds.medium) {
                return CONFIG.rankingPoints.correct.medium;
            } else if (timeInSeconds < thresholds.slow) {
                return CONFIG.rankingPoints.correct.slow;
            } else {
                return CONFIG.rankingPoints.correct.verySlow;
            }
        } else {
            if (timeInSeconds < thresholds.fast) {
                return CONFIG.rankingPoints.wrong.fast;
            } else if (timeInSeconds < thresholds.medium) {
                return CONFIG.rankingPoints.wrong.medium;
            } else {
                return CONFIG.rankingPoints.wrong.slow;
            }
        }
    },

    // Check answer
    checkAnswer(userAnswer) {
        const timeInSeconds = this.getQuestionTime();
        const isCorrect = parseInt(userAnswer) === this.currentQuestion.answer;
        const rankingPoints = this.calculateRankingPoints(isCorrect, timeInSeconds);

        this.totalRankingChange += rankingPoints;

        // Update question history
        const questionKey = `${this.currentTable}x${this.currentQuestion.multiplier}`;
        if (!this.questionHistory[questionKey]) {
            this.questionHistory[questionKey] = { attempts: 0, bestTime: null };
        }

        if (isCorrect) {
            this.questionHistory[questionKey].attempts++;
            if (!this.questionHistory[questionKey].bestTime || timeInSeconds < this.questionHistory[questionKey].bestTime) {
                this.questionHistory[questionKey].bestTime = timeInSeconds;
            }
            this.correctAnswers++;
            this.handleCorrectAnswer(timeInSeconds, rankingPoints);
        } else {
            this.handleWrongAnswer(rankingPoints);
        }

        return isCorrect;
    },

    // Handle correct answer
    handleCorrectAnswer(timeInSeconds, rankingPoints) {
        const questionKey = `${this.currentTable}x${this.currentQuestion.multiplier}`;
        const history = this.questionHistory[questionKey];
        const thresholds = this.getAdjustedThresholds();

        let speedMessage = '';
        let extraFeedback = '';
        let speedLevel = 'medium';

        // Determine base speed message using adjusted thresholds
        if (timeInSeconds < thresholds.fast) {
            speedMessage = '⚡ LIGHTNING FAST!';
            speedLevel = 'fast';
        } else if (timeInSeconds < thresholds.medium) {
            speedMessage = '🚀 GREAT SPEED!';
            speedLevel = 'medium';
        } else if (timeInSeconds < thresholds.slow) {
            speedMessage = '👍 GOOD!';
            speedLevel = 'medium';
        } else {
            speedMessage = '✓ CORRECT';
            speedLevel = 'slow';
        }

        // Add improvement feedback for repeated questions
        if (history && history.attempts > 1) {
            if (timeInSeconds < history.bestTime) {
                extraFeedback = ' 🔥 NEW RECORD!';
            } else if (timeInSeconds <= history.bestTime * 1.2) {
                extraFeedback = ' 💪 CONSISTENT!';
            }
        }

        UI.showFeedback(speedMessage + extraFeedback + ` (+${rankingPoints})`, 'correct', timeInSeconds);

        // Play correct answer sound based on speed
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playCorrectSound(speedLevel);
        }

        // Trigger player celebration animation
        if (typeof PhaserGameManager !== 'undefined') {
            PhaserGameManager.playerCelebrate();
        }

        // Check if game won
        if (this.correctAnswers >= CONFIG.questionsToWin) {
            // Play victory sound
            if (typeof AudioManager !== 'undefined') {
                AudioManager.playVictorySound();
            }
            this.endGame(true);
        } else {
            // Generate next question
            setTimeout(() => {
                this.generateQuestion();
                UI.updateQuestion(this.currentQuestion);
                this.startQuestionTimer();
            }, 1500);
        }
    },

    // Handle wrong answer
    handleWrongAnswer(rankingPoints) {
        this.zombiePosition--;
        UI.showFeedback(`❌ WRONG! (${rankingPoints})`, 'wrong');
        UI.updateZombiePosition(this.zombiePosition);

        // Play wrong answer sound
        if (typeof AudioManager !== 'undefined') {
            AudioManager.playWrongSound();
        }

        // Check if game over
        if (this.zombiePosition <= 0) {
            console.log('Game over! Zombie position is 0');
            // Trigger zombie attack animation before game over
            this.stopQuestionTimer();

            console.log('PhaserGameManager exists?', typeof PhaserGameManager !== 'undefined');
            if (typeof PhaserGameManager !== 'undefined') {
                console.log('Calling PhaserGameManager.zombieAttack');
                PhaserGameManager.zombieAttack(() => {
                    // End game after animation completes
                    this.endGame(false);
                });
            } else {
                console.log('PhaserGameManager not found, ending game immediately');
                this.endGame(false);
            }
        } else {
            // Generate next question
            setTimeout(() => {
                this.generateQuestion();
                UI.updateQuestion(this.currentQuestion);
                this.startQuestionTimer();
            }, 1500);
        }
    },

    // End the game
    endGame(won) {
        this.stopQuestionTimer();

        // Calculate total time played
        const totalTimeSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);

        // Update ranking
        const newRanking = Storage.updateRanking(this.currentTable, this.totalRankingChange);

        // Update stats
        Storage.updateStats(this.currentTable, totalTimeSeconds);

        // Show game over screen
        setTimeout(() => {
            UI.showGameOver(won, this.correctAnswers, newRanking, this.currentTable);
        }, 1000);
    },

    // Get current question
    getCurrentQuestion() {
        return this.currentQuestion;
    },

    // Get current table
    getCurrentTable() {
        return this.currentTable;
    },

    // Get current score
    getCurrentScore() {
        return this.correctAnswers;
    },

    // Get zombie position
    getZombiePosition() {
        return this.zombiePosition;
    }
};
