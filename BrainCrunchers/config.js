// Game Configuration
const CONFIG = {
    // Available multiplication tables
    availableTables: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],

    // Game mechanics
    maxZombieDistance: 3, // How many wrong answers before game over
    questionsToWin: 15, // How many questions per game session

    // Speed-based scoring (in seconds)
    speedThresholds: {
        fast: 3,      // Under 3 seconds = maximum points
        medium: 6,    // 3-6 seconds = good points
        slow: 10      // 6-10 seconds = reduced points
        // Over 10 seconds = minimal points
    },

    // Ranking points (adjusted by speed multiplier)
    rankingPoints: {
        correct: {
            fast: 10,      // < 3 seconds
            medium: 7,     // 3-6 seconds
            slow: 4,       // 6-10 seconds
            verySlow: 2    // > 10 seconds
        },
        wrong: {
            fast: -3,      // Quick wrong answer (guessing)
            medium: -5,    // Normal wrong answer
            slow: -7       // Slow wrong answer
        }
    },

    // Medal thresholds
    medals: {
        bronze: 100,
        silver: 250,
        gold: 500
    },

    // Multiplication range for questions (e.g., 2 × 1 through 2 × 12)
    multiplicationRange: {
        min: 1,
        max: 12
    }
};
