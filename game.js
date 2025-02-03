class NumberGridGame {
    constructor() {
        this.gameMode = GAME_MODES[DEFAULT_MODE];
        this.gridSize = DEFAULT_SIZE;
        this.grid = null;
        this.answers = null;
        this.selectedCell = null;
        this.wrongAttempts = 0;
        this.time = 0;
        this.timerInterval = null;
        this.hardMode = localStorage.getItem('hardMode') === 'true';
 
        this.cacheElements();
        this.loadLastGameSettings();
        this.updateModeButtons();
        this.updateSizeButtons();
        this.updateHardModeButton();
        this.bindEventListeners();
        this.updateDemoGrid();
        this.updateLeaderboard();
    }
 
    handleSizeSelection(size) {
        if (size >= 3 && size <= 5) {
            this.gridSize = size;
            this.updateSizeButtons();
            this.updateDemoGrid();
            this.updateLeaderboard();
        }
    }
    
    handleModeSelection(mode) {
        if (GAME_MODES[mode]) {
            this.gameMode = GAME_MODES[mode];
            this.updateModeButtons();
            this.updateDemoGrid();
            this.updateLeaderboard();
        }
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
        this.clearScoresModal = document.getElementById('clearScoresModal');
        this.clearScoresBtn = document.getElementById('clearScoresBtn');
        this.hardModeBtn = document.getElementById('hardModeBtn');
    }
 
    loadLastGameSettings() {
        const lastMode = localStorage.getItem('lastGameMode');
        const lastSize = localStorage.getItem('lastGridSize');
        
        this.gameMode = lastMode && GAME_MODES[lastMode] ? GAME_MODES[lastMode] : GAME_MODES.ONES_TENS;
        this.gridSize = lastSize ? parseInt(lastSize) : 3;
        
        if (this.gridSize < 3 || this.gridSize > 5) this.gridSize = 3;
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
 
        this.hardModeBtn.addEventListener('click', () => {
            this.hardMode = !this.hardMode;
            localStorage.setItem('hardMode', this.hardMode);
            this.updateHardModeButton();
            this.updateLeaderboard();
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
 
    handleCellClick(row, col, cell) {
        // Remove orange border from all cells
        document.querySelectorAll('#gameGrid > div').forEach(cell => {
            cell.style.borderColor = 'rgb(229, 231, 235)';
        });
 
        // If we have a selected cell with input, submit it
        if (this.selectedCell && this.selectedCell.input.value) {
            this.checkAnswer(
                parseInt(this.selectedCell.input.value),
                this.selectedCell.row,
                this.selectedCell.col,
                this.selectedCell.element
            );
            this.selectedCell = null;
        }
 
        // Only proceed with new input if clicking an empty cell
        if (this.grid[row][col] !== null) return;
 
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'w-full h-full text-center text-2xl font-bold bg-transparent focus:outline-none';
        input.style.width = '100%';
        input.style.height = '100%';
        
        cell.innerHTML = '';
        cell.style.borderColor = 'rgb(249, 115, 22)';
        cell.appendChild(input);
        
        this.selectedCell = { row, col, element: cell, input };
        input.focus();
 
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value) {
                this.checkAnswer(parseInt(input.value), row, col, cell);
                this.selectedCell = null;
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
 
        if (this.hardMode) {
            cell.innerHTML = userAnswer;
            if (isCorrect) {
                cell.className = `
                    aspect-square flex items-center justify-center text-2xl font-bold
                    rounded-lg border-2 cursor-pointer
                    bg-green-100 border-green-500 text-green-700
                `;
            } else {
                cell.className = `
                    aspect-square flex items-center justify-center text-2xl font-bold
                    rounded-lg border-2 cursor-pointer
                    bg-red-100 border-red-500 text-red-700
                    animate-[shake_0.5s_ease-in-out]
                `;
            }
 
            setTimeout(() => {
                cell.innerHTML = '';
                cell.className = isCorrect ? 
                    'aspect-square flex items-center justify-center text-2xl font-bold rounded-lg border-2 cursor-pointer bg-green-100 border-green-500' :
                    'aspect-square flex items-center justify-center text-2xl font-bold rounded-lg border-2 cursor-pointer bg-red-100 border-red-500';
            }, 1000);
        } else {
            if (!isCorrect) {
                cell.innerHTML = userAnswer;
                cell.className = `
                    aspect-square flex items-center justify-center text-2xl font-bold
                    rounded-lg border-2 cursor-pointer
                    bg-red-100 border-red-500 text-red-700
                    animate-[shake_0.5s_ease-in-out]
                `;
 
                setTimeout(() => {
                    cell.innerHTML = correctAnswer;
                    cell.className = `
                        aspect-square flex items-center justify-center text-2xl font-bold
                        rounded-lg border-2 cursor-pointer
                        bg-red-100 border-red-500 text-red-700
                        transition-all duration-300
                    `;
                }, 1000);
            } else {
                cell.innerHTML = userAnswer;
                cell.className = `
                    aspect-square flex items-center justify-center text-2xl font-bold
                    rounded-lg border-2 cursor-pointer
                    bg-green-100 border-green-500 text-green-700
                `;
            }
        }
 
        this.grid[row][col] = correctAnswer;
        if (this.isGridComplete()) {
            this.completeGame();
        }
    }
 
    startGame() {
        localStorage.setItem('lastGameMode', Object.keys(GAME_MODES).find(key => 
            GAME_MODES[key].name === this.gameMode.name
        ));
        localStorage.setItem('lastGridSize', this.gridSize.toString());
 
        const { grid, answers } = generateGrid(this.gridSize, this.gameMode, this.hardMode);
        this.grid = grid;
        this.answers = answers;
        this.wrongAttempts = 0;
        this.selectedCell = null;
        this.time = 0;
        this.isEditing = false;
 
        this.mainMenu.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        
        this.gameModeDisplay.textContent = `${this.gameMode.name} Mode${this.hardMode ? ' (Hard)' : ''}`;
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
 
    isGridComplete() {
        return this.grid.every(row => row.every(cell => cell !== null));
    }
 
    updateModeButtons() {
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const mode = btn.dataset.mode;
            if (mode) {
                const isSelected = GAME_MODES[mode].name === this.gameMode.name;
                btn.className = `mode-btn flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
                }`;
            }
        });
    }
 
    updateSizeButtons() {
        document.querySelectorAll('.size-btn').forEach(btn => {
            const isSelected = parseInt(btn.dataset.size) === this.gridSize;
            btn.className = `size-btn flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
            }`;
        });
    }
 
    updateHardModeButton() {
        this.hardModeBtn.textContent = `Hard Mode: ${this.hardMode ? 'On' : 'Off'}`;
        this.hardModeBtn.className = `w-full p-3 rounded-lg border-2 text-lg transition-colors ${
            this.hardMode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'
        }`;
    }
 
    updateDemoGrid() {
        const demoGrid = generateDemoGrid(this.gameMode, this.gridSize);
        this.demoGrid.innerHTML = '';
        this.demoGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, minmax(0, 1fr))`;
        
        demoGrid.forEach((row, i) => {
            row.forEach((value, j) => {
                const cell = document.createElement('div');
                cell.className = 'aspect-square flex items-center justify-center font-bold border rounded';
                cell.style.backgroundColor = getColorForPosition(i, j, this.gridSize);
                cell.textContent = value;
                this.demoGrid.appendChild(cell);
            });
        });
    }

    javascriptCopy// Continuing game.js

   completeGame() {
       clearInterval(this.timerInterval);
       let leaderboardData = null;

       if (this.wrongAttempts === 0) {
           leaderboardData = updateLeaderboard(this.gameMode, this.gridSize, this.hardMode, this.time);
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
       this.updateLeaderboard();
   }

   showClearScoresConfirmation() {
       this.clearScoresModal.classList.remove('hidden');
   }

   hideClearScoresConfirmation() {
       this.clearScoresModal.classList.add('hidden');
   }

   clearCurrentScores() {
       const key = `leaderboard-${this.gameMode.name}-${this.gridSize}-${this.hardMode ? 'hard' : 'normal'}`;
       localStorage.removeItem(key);
       this.updateLeaderboard();
       this.hideClearScoresConfirmation();
   }

   updateLeaderboard() {
       const leaderboard = getLeaderboard(this.gameMode, this.gridSize, this.hardMode);
       document.getElementById('leaderboardTitle').textContent = 
           `Leaderboard - ${this.gridSize}x${this.gridSize} Grid, ${this.gameMode.name}${this.hardMode ? ' (Hard Mode)' : ''}`;
       
       const leaderboardDiv = document.getElementById('leaderboard');
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

   renderGrid() {
       this.gameGrid.innerHTML = '';
       this.gameGrid.style.gridTemplateColumns = `repeat(${this.gridSize}, minmax(0, 1fr))`;
       
       this.grid.forEach((row, i) => {
           row.forEach((value, j) => {
               const cell = document.createElement('div');
               cell.className = `
                   aspect-square flex items-center justify-center text-2xl font-bold
                   rounded-lg border-2 cursor-pointer transition-all duration-200
                   min-w-[3rem] min-h-[3rem] md:min-w-[4rem] md:min-h-[4rem]
                   bg-white
               `;
               
               if (value !== null) {
                   cell.textContent = value;
               }

               cell.addEventListener('click', () => this.handleCellClick(i, j, cell));
               this.gameGrid.appendChild(cell);
           });
       });
   }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
   window.game = new NumberGridGame();
});