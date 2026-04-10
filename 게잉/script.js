const COLUMNS = 17;
const ROWS = 10;
const GAME_TIME = 120; // 120 seconds

let gridLayout = [];
let score = 0;
let bombCount = 2;
let timeRemaining = GAME_TIME;
let timerInterval = null;

let isDragging = false;
let startCell = null;
let endCell = null;
let selectedCells = [];
let currentHoverCell = null;

const gridElement = document.getElementById('grid');
const selectionBox = document.getElementById('selectionBox');
const gameBoardContainer = document.getElementById('gameBoardContainer');
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const startModal = document.getElementById('startModal');
const gameOverModal = document.getElementById('gameOverModal');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreDisplay = document.getElementById('finalScore');
const headerRestartBtn = document.getElementById('headerRestartBtn');
const bombDisplay = document.getElementById('bombDisplay');

function initGame() {
    gridElement.innerHTML = '';
    gridLayout = [];
    score = 0;
    timeRemaining = GAME_TIME;
    bombCount = 2;
    if(bombDisplay) updateBombDisplay();
    updateScore();
    updateTimerDisplay();

    // Create grid
    for (let row = 0; row < ROWS; row++) {
        let rowArray = [];
        for (let col = 0; col < COLUMNS; col++) {
            const num = Math.floor(Math.random() * 9) + 1;
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = num;
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Add mouse events to cell
            cell.addEventListener('mousedown', (e) => handleMouseDown(e, row, col));
            cell.addEventListener('mouseenter', (e) => handleMouseEnter(e, row, col));

            gridElement.appendChild(cell);
            rowArray.push({ element: cell, num: num, empty: false });
        }
        gridLayout.push(rowArray);
    }
}

function startGame() {
    startModal.classList.add('hidden');
    gameOverModal.classList.add('hidden');
    document.querySelector('#gameOverModal h2').innerHTML = '게임 오버!';
    initGame();
    
    // Start Timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    clearInterval(timerInterval);
    timerInterval = null;
    finalScoreDisplay.textContent = score;
    gameOverModal.classList.remove('hidden');
    isDragging = false;
    hideSelectionBox();
}

function updateScore() {
    scoreDisplay.textContent = score;
}

function updateBombDisplay() {
    bombDisplay.textContent = bombCount;
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Global mouseup to catch releases outside cells
document.addEventListener('mouseup', handleMouseUp);
document.addEventListener('mouseleave', handleMouseUp);

function handleMouseDown(e, row, col) {
    if (timeRemaining <= 0 || startModal.classList.contains('hidden') === false) return;
    if (gridLayout[row][col].empty) return;
    
    isDragging = true;
    startCell = { row, col };
    endCell = { row, col };
    
    updateSelection();
    e.preventDefault(); // Prevent native text/image dragging
}

function handleMouseEnter(e, row, col) {
    currentHoverCell = { row, col };
    if (!isDragging) return;
    endCell = { row, col };
    updateSelection();
}

function handleMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    
    checkSelectionSum();
    
    // Clear selection UI
    hideSelectionBox();
    clearCellHighlighting();
}

function updateSelection() {
    if (!startCell || !endCell) return;

    const minRow = Math.min(startCell.row, endCell.row);
    const maxRow = Math.max(startCell.row, endCell.row);
    const minCol = Math.min(startCell.col, endCell.col);
    const maxCol = Math.max(startCell.col, endCell.col);

    selectedCells = [];
    
    // Clear previous highlights
    clearCellHighlighting();

    // Highlight new cells and collect them
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            if (!gridLayout[r][c].empty) {
                const cellObj = gridLayout[r][c];
                cellObj.element.classList.add('selected');
                selectedCells.push(cellObj);
            }
        }
    }

    drawSelectionBox(minRow, maxRow, minCol, maxCol);
}

function clearCellHighlighting() {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS; c++) {
            gridLayout[r][c].element.classList.remove('selected');
        }
    }
}

function drawSelectionBox(minRow, maxRow, minCol, maxCol) {
    const startEl = gridLayout[minRow][minCol].element;
    const endEl = gridLayout[maxRow][maxCol].element;

    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();
    const boardRect = gridElement.getBoundingClientRect();

    const top = startRect.top - boardRect.top;
    const left = startRect.left - boardRect.left;
    const height = (endRect.bottom - boardRect.top) - top;
    const width = (endRect.right - boardRect.left) - left;

    selectionBox.style.display = 'block';
    
    selectionBox.style.top = `${gridElement.offsetTop + top - 4}px`;
    selectionBox.style.left = `${gridElement.offsetLeft + left - 4}px`;
    selectionBox.style.width = `${width + 8}px`;
    selectionBox.style.height = `${height + 8}px`;
}

function hideSelectionBox() {
    selectionBox.style.display = 'none';
}

function checkSelectionSum() {
    if (selectedCells.length === 0) return;

    let sum = 0;
    for (const cellObj of selectedCells) {
        sum += cellObj.num;
    }

    if (sum === 10) {
        // Success
        score += selectedCells.length * 10;
        updateScore();
        
        for (const cellObj of selectedCells) {
            cellObj.empty = true;
            cellObj.element.classList.add('pop-anim');
            // Wait for animation to finish then mark empty
            setTimeout(() => {
                cellObj.element.classList.add('empty');
                cellObj.element.classList.remove('pop-anim');
            }, 300);
        }
        
        checkAllCleared();
    }
    
    selectedCells = [];
}

function checkAllCleared() {
    let allClear = true;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS; c++) {
            if (!gridLayout[r][c].empty) {
                allClear = false;
                break;
            }
        }
        if(!allClear) break;
    }
    if (allClear) {
        document.querySelector('#gameOverModal h2').innerHTML = '모두 클리어!! 🎉';
        endGame();
    }
}

// Event Listeners for buttons
headerRestartBtn.addEventListener('click', startGame);
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (timeRemaining <= 0 || startModal.classList.contains('hidden') === false) return;
        if (!currentHoverCell || bombCount <= 0) return;
        
        e.preventDefault(); // Prevent scroll length spacebar default
        
        bombCount--;
        if(bombDisplay) updateBombDisplay();

        const { row, col } = currentHoverCell;
        let clearedCount = 0;

        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < ROWS && c >= 0 && c < COLUMNS) {
                    const cellObj = gridLayout[r][c];
                    if (!cellObj.empty) {
                        cellObj.empty = true;
                        cellObj.element.classList.add('pop-anim');
                        setTimeout(() => {
                            if(cellObj.element) {
                                cellObj.element.classList.add('empty');
                                cellObj.element.classList.remove('pop-anim');
                            }
                        }, 300);
                        clearedCount++;
                    }
                }
            }
        }
        
        if (clearedCount > 0) {
            score += clearedCount * 10;
            updateScore();
            checkAllCleared();
        }
    }
});

// Initialize grid for background effect before game starts
initGame();
