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

    // Start a new game
    start(tableNumber) {
        this.currentTable = tableNumber;
        this.correctAnswers = 0;
        this.zombiePosition = CONFIG.maxZombieDistance;
        this.totalRankingChange = 0;
        this.gameStartTime = Date.now();
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

    // Calculate ranking points based on speed
    calculateRankingPoints(isCorrect, timeInSeconds) {
        if (isCorrect) {
            if (timeInSeconds < CONFIG.speedThresholds.fast) {
                return CONFIG.rankingPoints.correct.fast;
            } else if (timeInSeconds < CONFIG.speedThresholds.medium) {
                return CONFIG.rankingPoints.correct.medium;
            } else if (timeInSeconds < CONFIG.speedThresholds.slow) {
                return CONFIG.rankingPoints.correct.slow;
            } else {
                return CONFIG.rankingPoints.correct.verySlow;
            }
        } else {
            if (timeInSeconds < CONFIG.speedThresholds.fast) {
                return CONFIG.rankingPoints.wrong.fast;
            } else if (timeInSeconds < CONFIG.speedThresholds.medium) {
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

        if (isCorrect) {
            this.correctAnswers++;
            this.handleCorrectAnswer(timeInSeconds, rankingPoints);
        } else {
            this.handleWrongAnswer(rankingPoints);
        }

        return isCorrect;
    },

    // Handle correct answer
    handleCorrectAnswer(timeInSeconds, rankingPoints) {
        let speedMessage = '';
        if (timeInSeconds < CONFIG.speedThresholds.fast) {
            speedMessage = '⚡ LIGHTNING FAST!';
        } else if (timeInSeconds < CONFIG.speedThresholds.medium) {
            speedMessage = '🚀 GREAT SPEED!';
        } else if (timeInSeconds < CONFIG.speedThresholds.slow) {
            speedMessage = '👍 GOOD!';
        } else {
            speedMessage = '✓ CORRECT';
        }

        UI.showFeedback(speedMessage + ` (+${rankingPoints})`, 'correct');

        // Trigger player celebration animation
        if (typeof PhaserGameManager !== 'undefined') {
            PhaserGameManager.playerCelebrate();
        }

        // Check if game won
        if (this.correctAnswers >= CONFIG.questionsToWin) {
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

        // Check if game over
        if (this.zombiePosition <= 0) {
            // Trigger zombie attack animation before game over
            this.stopQuestionTimer();

            if (typeof PhaserGameManager !== 'undefined') {
                PhaserGameManager.zombieAttack(() => {
                    // End game after animation completes
                    this.endGame(false);
                });
            } else {
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
