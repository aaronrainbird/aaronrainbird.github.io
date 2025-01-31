class NumberGridGame {
    constructor() {
        // Game state
        this.gameMode = GAME_MODES[DEFAULT_MODE];
        this.gridSize = DEFAULT_SIZE;
        this.grid = null;
        this.answers = null;
        this.selectedCell = null;
        this.wrongAttempts = 0;
        this.time = 0;
        this.timerInterval = null;

        // Cache DOM elements
        this.cacheElements();

        // Set up game
        this.loadLastGameSettings(); // This loads both mode and size
        this.updateModeButtons();    // Add this
        this.updateSizeButtons();    // Add this
        this.bindEventListeners();
        this.updateDemoGrid();
        this.updateLeaderboard();
    }

    loadLastGameSettings() {
        const lastMode = localStorage.getItem('lastGameMode');
        const lastSize = localStorage.getItem('lastGridSize');

        this.gameMode = lastMode && GAME_MODES[lastMode] ? GAME_MODES[lastMode] : GAME_MODES.ONES_TENS;
        this.gridSize = lastSize ? parseInt(lastSize) : 3;

        // Ensure we have valid selections
        if (this.gridSize < 3 || this.gridSize > 5) this.gridSize = 3;
    }


    cacheElements() {
        this.mainMenu = document.getElementById('mainMenu');
        this.gameScreen = document.getElementById('gameScreen');
        this.gameGrid = document.getElementById('gameGrid');
        this.gameModeDisplay = document.getElementById('gameModeDisplay');
        this.timerDisplay = document.getElementById('timer');
        this.demoGrid = document.getElementById('demoGrid');
        this.exitConfirmModal = document.getElementById('exitConfirmModal');
        this.completionModal = document.getElementById('completionModal');
        this.clearScoresBtn = document.getElementById('clearScoresBtn');
        this.clearScoresModal = document.getElementById('clearScoresModal');
    }

    bindEventListeners() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.dataset.mode;
                if (mode) {
                    this.handleModeSelection(mode);
                }
            });
        });

        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                if (!isNaN(size)) {
                    this.handleSizeSelection(size);
                }
            });
        });

        document.getElementById('startBtn').addEventListener('click', () => this.startGame());
        document.getElementById('exitButton').addEventListener('click', () => this.showExitConfirmation());
        document.getElementById('confirmExit').addEventListener('click', () => this.exitGame());
        document.getElementById('cancelExit').addEventListener('click', () => this.hideExitConfirmation());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.returnToMenu());
        this.clearScoresBtn.addEventListener('click', () => this.showClearScoresConfirmation());
        document.getElementById('cancelClear').addEventListener('click', () => this.hideClearScoresConfirmation());
        document.getElementById('confirmClear').addEventListener('click', () => this.clearCurrentScores());

    }

    getColorForPosition(row, col) {
        // Create a subtle gradient pattern based on position
        const hue = ((row + col) * 30) % 360; // Vary hue based on position
        return `hsl(${hue}, 70%, 97%)`; // Very light saturation and high lightness
    }

    renderGrid() {
        this.gameGrid.innerHTML = '';
        this.gameGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, minmax(0, 1fr))`;

        this.grid.forEach((row, i) => {
            row.forEach((value, j) => {
                const cell = document.createElement('div');
                cell.className = `
                    aspect-square flex items-center justify-center text-2xl font-bold
                    border-2 rounded-lg cursor-pointer transition-all duration-200
                    min-w-[3rem] min-h-[3rem] md:min-w-[4rem] md:min-h-[4rem]
                    ${value === null ? 'bg-white' : 'bg-white'}
                `;

                if (value !== null) {
                    cell.textContent = value;
                }

                cell.addEventListener('click', () => this.handleCellClick(i, j, cell));
                this.gameGrid.appendChild(cell);
            });
        });
    }

    handleCellClick(row, col, cell) {
        if (this.grid[row][col] !== null || this.isEditing) return;

        this.isEditing = true;
        this.selectedCell = { row, col, element: cell };

        // Create input element
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'w-full h-full text-center text-2xl font-bold bg-transparent focus:outline-none';
        input.style.width = '100%';
        input.style.height = '100%';

        // Style the cell
        cell.innerHTML = '';
        cell.style.borderColor = 'rgb(249, 115, 22)'; // Tailwind orange-500
        cell.appendChild(input);

        input.focus();

        // Handle input completion
        const completeInput = () => {
            if (input.value) {
                this.checkAnswer(parseInt(input.value), row, col, cell);
            } else {
                cell.style.borderColor = 'rgb(229, 231, 235)'; // Reset border
            }
            this.isEditing = false;
        };

        input.addEventListener('blur', completeInput);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                completeInput();
                input.blur();
            }
        });
    }

    checkAnswer(userAnswer, row, col, cell) {
        const correctAnswer = this.answers[row][col];
        const isCorrect = userAnswer === correctAnswer;

        if (!isCorrect) {
            this.wrongAttempts++;
        }

        // Update grid state
        this.grid[row][col] = userAnswer;

        // Update cell appearance
        cell.innerHTML = userAnswer;
        if (isCorrect) {
            cell.style.backgroundColor = 'rgb(220, 252, 231)'; // Light green
            cell.style.borderColor = 'rgb(34, 197, 94)'; // Tailwind green-500
            cell.style.color = 'rgb(21, 128, 61)'; // Tailwind green-700
        } else {
            cell.style.backgroundColor = 'rgb(254, 226, 226)'; // Light red
            cell.style.borderColor = 'rgb(239, 68, 68)'; // Tailwind red-500
            cell.style.color = 'rgb(185, 28, 28)'; // Tailwind red-700
        }

        if (this.isGridComplete()) {
            this.completeGame();
        }
    }

    startGame() {
        localStorage.setItem('lastGameMode', Object.keys(GAME_MODES).find(key =>
            GAME_MODES[key].name === this.gameMode.name
        ));
        localStorage.setItem('lastGridSize', this.gridSize.toString());

        const { grid, answers } = generateGrid(this.gridSize, this.gameMode);
        this.grid = grid;
        this.answers = answers;
        this.wrongAttempts = 0;
        this.selectedCell = null;
        this.time = 0;
        this.isEditing = false;

        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        this.gameModeDisplay.textContent = `${this.gameMode.name} Mode`;
        this.renderGrid();
        this.startTimer();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.time++;
            this.timerDisplay.textContent = formatTime(this.time);
        }, 1000);
    }

    completeGame() {
        clearInterval(this.timerInterval);
        let leaderboardData = null;

        if (this.wrongAttempts === 0) {
            leaderboardData = updateLeaderboard(this.gameMode, this.gridSize, this.time);
        }

        const messageDiv = document.getElementById('completionMessage');
        if (this.wrongAttempts === 0) {
            messageDiv.innerHTML = `
                <div class="flex items-center justify-center space-x-2 text-3xl font-bold text-green-600 mb-4">
                    ⭐ PERFECT! ⭐
                </div>
                <p class="text-xl text-green-600 mb-2">
                    Time: ${formatTime(this.time)}
                </p>
                ${leaderboardData && leaderboardData.rank <= 5 ?
                    `<p class="text-lg text-blue-600">New High Score! Rank #${leaderboardData.rank}</p>` :
                    ''}
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="text-2xl font-bold mb-4">
                    Completed!
                </div>
                <p class="text-lg">
                    Time: ${formatTime(this.time)}<br>
                    ${this.wrongAttempts} incorrect ${this.wrongAttempts === 1 ? 'answer' : 'answers'}
                </p>
            `;
        }

        this.completionModal.classList.remove('hidden');
    }

    showExitConfirmation() {
        this.exitConfirmModal.classList.remove('hidden');
    }

    hideExitConfirmation() {
        this.exitConfirmModal.classList.add('hidden');
    }

    exitGame() {
        clearInterval(this.timerInterval);
        this.hideExitConfirmation();
        this.returnToMenu();
    }

    returnToMenu() {
        this.gameScreen.classList.add('hidden');
        this.completionModal.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
        this.showCurrentLeaderboard();
    }



    updateModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const mode = btn.dataset.mode;
            if (mode) {
                const isSelected = GAME_MODES[mode].name === this.gameMode.name;
                btn.className = `mode-btn flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
                    }`;
            }
        });
    }

    updateSizeButtons() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            const isSelected = parseInt(btn.dataset.size) === this.gridSize;
            btn.className = `size-btn flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
                }`;
        });
    }

    updateDemoGrid() {
        const demoGrid = generateDemoGrid(this.gameMode, this.gridSize);
        this.demoGrid.innerHTML = '';
        this.demoGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, minmax(0, 1fr))`;

        demoGrid.forEach((row, i) => {
            row.forEach((value, j) => {
                const cell = document.createElement('div');
                const baseColor = this.getColorForPosition(i, j);
                cell.className = 'demo-cell aspect-square flex items-center justify-center font-bold border rounded bg-gray-50';
                cell.style.backgroundColor = baseColor;
                cell.textContent = value;
                this.demoGrid.appendChild(cell);
            });
        });
    }

    loadLastPlayedMode() {
        const lastMode = localStorage.getItem('lastGameMode');
        if (lastMode && GAME_MODES[lastMode]) {
            this.gameMode = GAME_MODES[lastMode];
            this.updateModeButtons();
        }
    }

    isGridComplete() {
        return this.grid.every(row => row.every(cell => cell !== null));
    }

    handleModeSelection(mode) {
        if (GAME_MODES[mode]) {
            this.gameMode = GAME_MODES[mode];
            this.updateModeButtons();
            this.updateDemoGrid();
            this.updateLeaderboard();
        }
    }

    handleSizeSelection(size) {
        if (size >= 3 && size <= 5) {
            this.gridSize = size;
            this.updateSizeButtons();
            this.updateDemoGrid();
            this.updateLeaderboard();
        }
    }

    showClearScoresConfirmation() {
        this.clearScoresModal.classList.remove('hidden');
    }
    
    hideClearScoresConfirmation() {
        this.clearScoresModal.classList.add('hidden');
    }
    
    clearCurrentScores() {
        const key = `leaderboard-${this.gameMode.name}-${this.gridSize}`;
        localStorage.removeItem(key);
        this.updateLeaderboard();
        this.hideClearScoresConfirmation();
    }
    
    updateLeaderboard() {
        const leaderboard = getLeaderboard(this.gameMode, this.gridSize);
        const leaderboardDiv = document.getElementById('leaderboard');
        document.getElementById('currentLeaderboardDisplay').textContent = 
            `${this.gridSize}x${this.gridSize} ${this.gameMode.name}`;
        
        if (leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<p class="text-gray-500 text-center">No scores yet!</p>';
            this.clearScoresBtn.classList.add('hidden');
            return;
        }
    
        this.clearScoresBtn.classList.remove('hidden');
        leaderboardDiv.innerHTML = leaderboard.map((score, index) => `
            <div class="flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-50 border border-yellow-200' : ''}">
                <div class="flex items-center gap-2">
                    ${index === 0 ? '🏅' : ''}
                    <span>#${index + 1}</span>
                </div>
                <div>${formatTime(score.time)}</div>
            </div>
        `).join('');
    }

    updateLeaderboardDisplay() {
        const mode = document.getElementById('leaderboardMode').value;
        const size = parseInt(document.getElementById('leaderboardSize').value);
        const selectedMode = GAME_MODES[mode];

        document.getElementById('currentLeaderboardDisplay').textContent =
            `Current: ${size}x${size} ${selectedMode.name}`;

        const leaderboard = getLeaderboard(selectedMode, size);
        const leaderboardDiv = document.getElementById('leaderboard');

        if (leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<p class="text-gray-500 text-center">No scores yet!</p>';
            return;
        }

        leaderboardDiv.innerHTML = leaderboard.map((score, index) => `
            <div class="flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-50' : ''}">
                <div class="flex items-center gap-2">
                    ${index === 0 ? '🏅' : ''}
                    <span>#${index + 1}</span>
                </div>
                <div>${formatTime(score.time)}</div>
            </div>
        `).join('');
    }

    showCurrentLeaderboard() {
        const leaderboard = getLeaderboard(this.gameMode, this.gridSize);
        document.getElementById('currentLeaderboardDisplay').textContent =
            `Current: ${this.gridSize}x${this.gridSize} ${this.gameMode.name}`;

        const leaderboardDiv = document.getElementById('leaderboard');
        if (leaderboard.length === 0) {
            leaderboardDiv.innerHTML = '<p class="text-gray-500 text-center">No scores yet!</p>';
            return;
        }

        leaderboardDiv.innerHTML = leaderboard.map((score, index) => `
            <div class="flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-50' : ''}">
                <div class="flex items-center gap-2">
                     ${index === 0 ? '🏅' : ''}
                    <span>#${index + 1}</span>
                </div>
                <div>${formatTime(score.time)}</div>
            </div>
        `).join('');
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new NumberGridGame();
});