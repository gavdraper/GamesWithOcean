// LocalStorage Manager
const Storage = {
    // Initialize storage with default values
    init() {
        if (!localStorage.getItem('brainCrunchersData')) {
            const defaultData = {
                rankings: {}, // { tableNumber: rankingPoints }
                stats: {
                    gamesPlayed: 0,
                    totalTimePlayedSeconds: 0,
                    tableTimePlayed: {}, // { tableNumber: timeInSeconds }
                    tableGamesPlayed: {} // { tableNumber: gamesPlayed }
                }
            };
            this.saveData(defaultData);
        }
    },

    // Get all data
    getData() {
        const data = localStorage.getItem('brainCrunchersData');
        return data ? JSON.parse(data) : null;
    },

    // Save all data
    saveData(data) {
        localStorage.setItem('brainCrunchersData', JSON.stringify(data));
    },

    // Get ranking for a specific table
    getRanking(tableNumber) {
        const data = this.getData();
        return data.rankings[tableNumber] || 0;
    },

    // Update ranking for a specific table
    updateRanking(tableNumber, points) {
        const data = this.getData();
        if (!data.rankings[tableNumber]) {
            data.rankings[tableNumber] = 0;
        }
        data.rankings[tableNumber] = Math.max(0, data.rankings[tableNumber] + points);
        this.saveData(data);
        return data.rankings[tableNumber];
    },

    // Get medal for a ranking
    getMedal(ranking) {
        if (ranking >= CONFIG.medals.gold) return '🥇';
        if (ranking >= CONFIG.medals.silver) return '🥈';
        if (ranking >= CONFIG.medals.bronze) return '🥉';
        return '';
    },

    // Update stats after a game
    updateStats(tableNumber, timePlayedSeconds) {
        const data = this.getData();

        data.stats.gamesPlayed++;
        data.stats.totalTimePlayedSeconds += timePlayedSeconds;

        if (!data.stats.tableTimePlayed[tableNumber]) {
            data.stats.tableTimePlayed[tableNumber] = 0;
        }
        data.stats.tableTimePlayed[tableNumber] += timePlayedSeconds;

        if (!data.stats.tableGamesPlayed[tableNumber]) {
            data.stats.tableGamesPlayed[tableNumber] = 0;
        }
        data.stats.tableGamesPlayed[tableNumber]++;

        this.saveData(data);
    },

    // Get all stats
    getStats() {
        const data = this.getData();
        return data.stats;
    },

    // Get most played table
    getMostPlayedTable() {
        const data = this.getData();
        const tableGames = data.stats.tableGamesPlayed;

        let mostPlayed = null;
        let maxGames = 0;

        for (const table in tableGames) {
            if (tableGames[table] > maxGames) {
                maxGames = tableGames[table];
                mostPlayed = table;
            }
        }

        return mostPlayed;
    },

    // Format seconds to readable time
    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        } else if (seconds < 3600) {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}m ${secs}s`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${mins}m`;
        }
    },

    // Get all rankings
    getAllRankings() {
        const data = this.getData();
        return data.rankings;
    }
};

// Initialize storage on load
Storage.init();
