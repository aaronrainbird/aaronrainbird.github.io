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
        this.setupModal = document.getElementById('setupModal');
        this.startScreen = document.getElementById('startScreen');
        this.gameScreen = document.getElementById('gameScreen');
        this.completionScreen = document.getElementById('completionScreen');
        this.demoGrid = document.getElementById('demoGrid');
        this.gameGrid = document.getElementById('gameGrid');
        this.inputArea = document.getElementById('inputArea');
        this.numberInput = document.getElementById('numberInput');
        this.timerDisplay = document.getElementById('timer');
        this.gameModeDisplay = document.getElementById('gameModeDisplay');

        // Initialize the game
        this.bindEventListeners();
        this.loadLastPlayedMode();
        this.updateDemoGrid();
    }

    bindEventListeners() {
        // Start game button
        document.getElementById('startGameBtn').addEventListener('click', () => {
            this.showSetupModal();
        });

        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleModeSelection(e.target.dataset.mode);
            });
        });

        // Grid size selection
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleSizeSelection(parseInt(e.target.dataset.size));
            });
        });

        // Start button
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });

        // Check button
        document.getElementById('checkButton').addEventListener('click', () => {
            this.checkAnswer();
        });

        // Number input
        this.numberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.checkAnswer();
            }
        });

        // Play again button
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.showSetupModal();
        });
    }

    loadLastPlayedMode() {
        const lastMode = localStorage.getItem('lastGameMode');
        if (lastMode && GAME_MODES[lastMode]) {
            this.gameMode = GAME_MODES[lastMode];
            this.updateModeButtons();
        }
    }

    handleModeSelection(mode) {
        this.gameMode = GAME_MODES[mode];
        this.updateModeButtons();
        this.updateDemoGrid();
    }

    handleSizeSelection(size) {
        this.gridSize = size;
        this.updateSizeButtons();
        this.updateDemoGrid(); // Update demo grid when size changes
    }

    updateDemoGrid() {
        const demoGrid = generateDemoGrid(this.gameMode, this.gridSize);
        this.demoGrid.innerHTML = '';
        this.demoGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, minmax(0, 1fr))`;
        
        const cellSize = this.gridSize <= 3 ? 'text-sm' : 
                        this.gridSize === 4 ? 'text-xs' : 
                        'text-xs';
        
        demoGrid.forEach((row, i) => {
            row.forEach((value, j) => {
                const cell = document.createElement('div');
                cell.className = `aspect-square flex items-center justify-center ${cellSize} font-bold border border-gray-200 rounded bg-gray-50`;
                cell.textContent = value;
                this.demoGrid.appendChild(cell);
            });
        });
    }

    updateModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const isSelected = GAME_MODES[btn.dataset.mode].name === this.gameMode.name;
            btn.className = `mode-btn flex-1 px-4 py-2 rounded-lg border-2 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`;
        });
    }

    updateSizeButtons() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            const isSelected = parseInt(btn.dataset.size) === this.gridSize;
            btn.className = `size-btn flex-1 px-4 py-2 rounded-lg border-2 ${
                isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`;
        });
    }

   

    startGame() {
        try {
            console.log('Starting game...');
            
            // Store last played mode
            const modeKey = Object.keys(GAME_MODES).find(key => 
                GAME_MODES[key].name === this.gameMode.name
            );
            console.log('Storing last played mode:', modeKey);
            localStorage.setItem('lastGameMode', modeKey);

            // Generate new grid
            console.log('About to generate grid with:', {
                gridSize: this.gridSize,
                gameMode: this.gameMode
            });
            const { grid, answers } = generateGrid(this.gridSize, this.gameMode);
            console.log('Grid generated:', { grid, answers });
            
            this.grid = grid;
            this.answers = answers;
            
            // Reset game state
            this.wrongAttempts = 0;
            this.selectedCell = null;
            this.time = 0;

            // Update UI visibility
            console.log('Updating UI visibility...');
            this.setupModal.classList.add('hidden');
            this.startScreen.classList.add('hidden');
            this.gameScreen.classList.remove('hidden');
            this.completionScreen.classList.add('hidden');
            this.inputArea.classList.add('hidden');

            // Update game mode display
            console.log('Updating game mode display...');
            this.gameModeDisplay.textContent = `${this.gameMode.name} Mode`;
            
            // Render grid and start timer
            console.log('Rendering grid...');
            this.renderGrid();
            console.log('Starting timer...');
            this.startTimer();
            
            console.log('Game started successfully');
        } catch (error) {
            console.error('Error starting game:', error);
            // Try to recover UI state
            this.setupModal.classList.remove('hidden');
            alert('There was an error starting the game. Please try again.');
        }
    }

    renderGrid() {
        console.log('renderGrid called', {
            grid: this.grid,
            gridSize: this.gridSize
        });
        this.gameGrid.innerHTML = '';
        this.gameGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, minmax(0, 1fr))`;
        
        this.grid.forEach((row, i) => {
            row.forEach((value, j) => {
                const cell = document.createElement('div');
                cell.className = `
                    aspect-square flex items-center justify-center text-2xl font-bold
                    border-2 rounded cursor-pointer
                    ${value === null ? 'bg-gray-100' : ''}
                    border-gray-200
                `;
                if (value !== null) {
                    cell.textContent = value;
                }
                cell.addEventListener('click', () => this.handleCellClick(i, j));
                this.gameGrid.appendChild(cell);
            });
        });
        console.log('Grid rendered');
    }

    handleCellClick(row, col) {
        if (this.grid[row][col] !== null) return;

        // Reset previous selected cell
        if (this.selectedCell) {
            const prevCell = this.gameGrid.children[this.selectedCell.row * this.gridSize + this.selectedCell.col];
            prevCell.classList.remove('border-blue-500');
        }

        this.selectedCell = { row, col };
        const cell = this.gameGrid.children[row * this.gridSize + col];
        cell.classList.add('border-blue-500');
        
        this.numberInput.value = '';
        this.inputArea.classList.remove('hidden');
        this.numberInput.focus();
    }

    checkAnswer() {
        if (!this.selectedCell || !this.numberInput.value) return;

        const { row, col } = this.selectedCell;
        const userAnswer = parseInt(this.numberInput.value);
        const correctAnswer = this.answers[row][col];
        const isCorrect = userAnswer === correctAnswer;

        if (!isCorrect) {
            this.wrongAttempts++;
        }

        // Update grid
        this.grid[row][col] = userAnswer;
        const cell = this.gameGrid.children[row * this.gridSize + col];
        cell.textContent = userAnswer;
        
        // Remove old classes first
        cell.classList.remove('border-blue-500', 'bg-gray-100');
        
        // Add new classes separately
        if (isCorrect) {
            cell.classList.add('bg-green-100');
            cell.classList.add('border-green-500');
        } else {
            cell.classList.add('bg-red-100');
            cell.classList.add('border-red-500');
        }

        // Reset selection
        this.selectedCell = null;
        this.numberInput.value = '';
        this.inputArea.classList.add('hidden');

        // Check if game is complete after a short delay to allow for DOM updates
        setTimeout(() => {
            if (this.isGridComplete()) {
                this.completeGame();
            }
        }, 100);
    }

    isGridComplete() {
        // Check if all cells have values and at least one cell is correct (to prevent empty grid from being "complete")
        let hasCorrectCell = false;
        const allFilled = this.grid.every(row => 
            row.every(cell => {
                if (cell !== null) {
                    hasCorrectCell = true;
                    return true;
                }
                return false;
            })
        );
        return allFilled && hasCorrectCell;
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.time++;
            this.timerDisplay.textContent = formatTime(this.time);
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    completeGame() {
        this.stopTimer();
        let leaderboardData = null;

        if (this.wrongAttempts === 0) {
            leaderboardData = updateLeaderboard(this.gameMode, this.gridSize, this.time);
        }

        this.gameScreen.classList.add('hidden');
        this.completionScreen.classList.remove('hidden');

        // Show completion message
        const messageDiv = document.getElementById('completionMessage');
        if (this.wrongAttempts === 0) {
            messageDiv.innerHTML = `
                <div class="flex items-center justify-center space-x-2 text-3xl font-bold text-green-600 mb-4">
                    <span>★</span>
                    <span>✨</span>
                    <span>PERFECT!</span>
                    <span>✨</span>
                    <span>★</span>
                </div>
                <p class="text-xl text-green-600 mb-4">
                    Amazing job! You got everything right on the first try!
                    Time: ${formatTime(this.time)}
                </p>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="text-2xl font-bold text-green-600 mb-4">
                    Grid completed!
                </div>
                <p class="text-lg mb-4">
                    Time: ${formatTime(this.time)}
                    <br>
                    You had ${this.wrongAttempts} incorrect ${this.wrongAttempts === 1 ? 'answer' : 'answers'} 
                    - only perfect scores make the leaderboard
                </p>
            `;
        }

        // Show leaderboard if we have a perfect score
        const leaderboardDiv = document.getElementById('leaderboard');
        if (leaderboardData) {
            const leaderboard = leaderboardData.leaderboard;
            const rank = leaderboardData.rank;

            leaderboardDiv.innerHTML = `
                <h3 class="text-xl font-bold mb-3 flex items-center gap-2">
                    🏆 ${this.gridSize}x${this.gridSize} ${this.gameMode.name} Perfect Score Leaderboard
                </h3>
                ${leaderboard.map((score, index) => `
                    <div class="flex justify-between items-center p-2 rounded
                        ${rank === index + 1 ? 'bg-yellow-100 border-2 border-yellow-300' : ''}">
                        <div class="flex items-center gap-2">
                            ${index === 0 ? '🏅' : ''}
                            <span>#${index + 1}</span>
                        </div>
                        <div>${formatTime(score.time)}</div>
                    </div>
                `).join('')}
                ${rank > 5 ? `
                    <div class="mt-2 text-gray-600">
                        Your score: #${rank} - Keep practicing!
                    </div>
                ` : ''}
            `;
        } else {
            leaderboardDiv.innerHTML = '';
        }
    }

    showSetupModal() {
        this.setupModal.classList.remove('hidden');
        this.updateModeButtons();
        this.updateSizeButtons();
        this.updateDemoGrid();
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new NumberGridGame();
});