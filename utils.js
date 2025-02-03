function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateLeaderboard(gameMode, gridSize, hardMode, time) {
    const key = `leaderboard-${gameMode.name}-${gridSize}-${hardMode ? 'hard' : 'normal'}`;
    let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');

    const newScore = {
        time,
        date: new Date().toISOString()
    };

    leaderboard.push(newScore);
    leaderboard.sort((a, b) => a.time - b.time);
    leaderboard = leaderboard.slice(0, 5);

    localStorage.setItem(key, JSON.stringify(leaderboard));

    return {
        leaderboard,
        rank: leaderboard.findIndex(score => score.time === time) + 1
    };
}

function getLeaderboard(gameMode, gridSize, hardMode) {
    const key = `leaderboard-${gameMode.name}-${gridSize}-${hardMode ? 'hard' : 'normal'}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}


function generateGrid(gridSize, gameMode, hardMode) {
    const startNum = Math.floor(Math.random() * 90) + 1;

    const finalGrid = [];
    const finalAnswers = [];

    // Generate full grid first
    for (let i = 0; i < gridSize; i++) {
        const row = [];
        const answerRow = [];
        for (let j = 0; j < gridSize; j++) {
            const value = startNum + (j * gameMode.rightStep) + (i * gameMode.downStep);
            row.push(hardMode ? null : (Math.random() < 0.4 ? value : null));
            answerRow.push(value);
        }
        finalGrid.push(row);
        finalAnswers.push(answerRow);
    }

    // For hard mode, ensure exactly one visible number
    if (hardMode) {
        const permanentI = Math.floor(Math.random() * gridSize);
        const permanentJ = Math.floor(Math.random() * gridSize);
        finalGrid[permanentI][permanentJ] = finalAnswers[permanentI][permanentJ];
    }

    return {
        grid: finalGrid,
        answers: finalAnswers
    };
}


function generateDemoGrid(mode, size) {
    const startNum = mode === GAME_MODES.ONES_TENS ? 4 : 2;
    const grid = [];

    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const value = startNum + (j * mode.rightStep) + (i * mode.downStep);
            row.push(value);
        }
        grid.push(row);
    }

    return grid;
}

function getColorForPosition(row, col, total) {
    const hue = ((row + col) * (360 / (total * 2))) % 360;
    return `hsl(${hue}, 85%, 97%)`;
}