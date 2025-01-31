

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function updateLeaderboard(gameMode, gridSize, time) {
    const key = `leaderboard-${gameMode.name}-${gridSize}`;
    let leaderboard = JSON.parse(localStorage.getItem(key) || '[]');
    
    const newScore = {
        time,
        date: new Date().toISOString()
    };

    leaderboard.push(newScore);
    leaderboard.sort((a, b) => a.time - b.time);
    leaderboard = leaderboard.slice(0, 5); // Keep top 5

    localStorage.setItem(key, JSON.stringify(leaderboard));
    
    return {
        leaderboard,
        rank: leaderboard.findIndex(score => score.time === time) + 1
    };
}

function getLeaderboard(gameMode, gridSize) {
    const key = `leaderboard-${gameMode.name}-${gridSize}`;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function generateGrid(gridSize, gameMode) {
    console.log('Generating grid...', { gridSize, gameMode });
    
    // Only restrict the starting number to be < 10
    let startNum;
    do {
        startNum = Math.floor(Math.random() * 8) + 1; // 1-9
    } while (startNum > 9);
    
    console.log('Using start number:', startNum);
    
    const finalGrid = [];
    const finalAnswers = [];
    
    for (let i = 0; i < gridSize; i++) {
        const row = [];
        const answerRow = [];
        for (let j = 0; j < gridSize; j++) {
            const value = startNum + (j * gameMode.rightStep) + (i * gameMode.downStep);
            // Show about 40% of numbers initially
            row.push(Math.random() < 0.4 ? value : null);
            answerRow.push(value);
        }
        finalGrid.push(row);
        finalAnswers.push(answerRow);
    }
    
    console.log('Grid generated successfully:', { finalGrid, finalAnswers });
    return {
        grid: finalGrid,
        answers: finalAnswers
    };
}

function generateDemoGrid(mode, size = 3) {
    console.log('Generating demo grid...', { mode, size });
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