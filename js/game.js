'use strict'

const MINE = '<img src="img/bomb-cute-empty.png" width=30 height=30 />'
const MARKED = '🚩'
const EMPTY = ''
const EXPLODED = '💥'

var gRestartButtonImg = {
    EMPTY: 'img/bomb-cute-empty.png',
    SMILE: 'img/bomb-cute-smile.png',
    TOW_LIVES: 'img/bomb-cute-2-lives.png',
    ONE_LIFE: 'img/bomb-cute-1-life.png',
    ZERO: 'img/bomb-cute-0-life.png',
    WIN: 'img/cute-bomb-glass.png'
}


var gLevel = { //* This is an object by which the board size is set 
    //*(in this case: 4x4 board and how many mines to place)
    SIZE: 4,
    MINES: 2,
    NAME: 'Beginner'
}

const gGame = {
    //* This is an object in which you can keep and update the current game state:
    isOn: false,
    //* isOn: Boolean, when true we let the user play
    shownCount: 0,
    //* shownCount: How many cells are shown
    markedCount: 0,
    //* markedCount: How many cells are marked (with a flag)
    secsPassed: 0,
    //* secsPassed: How many seconds passed 
    livesCount: 3,
    //* The user has 3 LIVES, When a MINE is clicked, there is an indication to the user that he clicked a mine. The LIVES counter decreases. The user can continue playing
    safeClick: 3,
    //*The user has 3 Safe-Clicks Clicking the Safe-Click button will mark a random covered cell (for a few seconds) that is safe to click Present the remaining Safe-Clicks count
    hintCount: 3
    //*The user has 3 hints When a hint is clicked, it changes its look, example:
    //*Now, when a cell (unrevealed) is clicked, the cell and its neighbors are revealed for a second, and the clicked hint disappears
}

var gBoard //*A Matrix containing cell objects: Each cell:

var gCells

var gIsExterminate

var gFirstClick

var gIsHint

function onInit() {//*This is called when page loads
    console.log('onInit')
    renderHighScores()
    gFirstClick = {}
    gCells = []
    gGame.isOn = false
    gIsHint = false
    addDeactivated()
    gBoard = buildBoard()
    renderBoard(gBoard)
    updateExterminator(1)
    updateShield(3)
    resetTimer()
    gGame.secsPassed = stopTimer()
    hideVictory()
    updateRestartButtonImg()
    updateShownCount(0)
    updateMarkedCount(0)
    gGame.livesCount = gLevel.MINES === 2 ? 2 : 3
    updateLivesCount(gGame.livesCount)
    gIsExterminate = false
    gGame.safeClick = 3
    gGame.hintCount = 3
}

function removeDeactivated() {
    document.querySelectorAll(".deactivated").forEach((item) => {
        item.classList.remove('deactivated')
        item.classList.add('nonactive')
    })
}

function addDeactivated() {
    document.querySelectorAll(".nonactive").forEach((item) => {
        item.classList.add('deactivated')
        item.classList.remove('nonactive')
    })
}

function buildBoard() {
    //*Builds the board  
    //*Set the mines 
    //*Call setMinesNegsCount()
    //*Return the created board

    if (!gGame.isOn) {
        const size = gLevel.SIZE
        const board = []

        for (var i = 0; i < size; i++) {
            board.push([])
            for (var j = 0; j < size; j++) {
                var currentCell = createCell()
                currentCell.location.i = i
                currentCell.location.j = j
                board[i][j] = currentCell
                gCells.push(currentCell)
            }
        }

        return board
    } else {
        addMins(gFirstClick.i, gFirstClick.j)
        setMinesNegsCount(gBoard)
        // console.table(gBoard)
    }

}

function createCell() {
    return {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
        isExploded: false,
        location: {}
    }
}

function setMinesNegsCount(board) {
    //*Count mines around each cell and set the cell's minesAroundCount.
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j].minesAroundCount = countNegs(i, j, board)
        }
    }
    renderBoard(gBoard)
}


function renderBoard(board) {
    //* Render the board as a <table> to the page
    // console.log(board)
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            const cellAppearance = getCellAppearance(board[i][j])
            var className = `cell cell-${i}-${j}`
            if (!gGame.isOn) {

                className += ` covered-cell gameon`
            }
            if (!board[i][j].isShown) {
                className += ` covered-cell inshown`
            }
            strHTML += `<td class="${className}"
                onclick="onCellClicked(this, ${i}, ${j})" 
                oncontextmenu="onCellMarked(this,event,${i}, ${j})"
                data-i="${i}" data-j="${j}"
                >${cellAppearance}</td>`
        }
        strHTML += '</tr>'
    }
    const elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}


function getCellAppearance(cell) {

    if (!cell.isShown && !cell.isMarked) return EMPTY
    switch (true) {
        case cell.isMarked:
            return MARKED
        case cell.isMine:
            return MINE
        case cell.isExploded:
            return EXPLODED
        default:
            return cell.minesAroundCount ? cell.minesAroundCount : ''
    }
}


function onCellClicked(elCell, i, j) {
    elCell.classList.remove('covered-cell')
    //* Called when a cell is clicked
    if (!gIsHint) {
        if (!gGame.isOn) {
            gFirstClick = { i, j }
            gGame.isOn = true
            removeDeactivated()
            startTimer()
            buildBoard()
        }
        revealCellContent(elCell, i, j)//TODO

        if (checkGameOver(gBoard)) {
            updateRestartButtonImg()
            showVictory()
        }
    } else {
        revealCellsContent(elCell, i, j)
    }
    renderBoard(gBoard)
    updateRestartButtonImg()
}

function closeDialog(className) {
    document.querySelector(className).classList.add('hide')
}

function revealCellsContent(elCell, cellI, cellJ) {
    var unRevealed = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (!gBoard[i][j].isShown) {
                unRevealed.push({ i, j })
                gBoard[i][j].isShown = true
                elCell.classList.remove('covered-cell')
            }
        }
    }
    renderBoard(gBoard)
    setTimeout(() => {
        for (var idx = 0; idx < unRevealed.length; idx++) {
            gBoard[unRevealed[idx].i][unRevealed[idx].j].isShown = false
            elCell.classList.add('covered-cell')
        }
        renderBoard(gBoard)
        var hintBtn = document.querySelector(`.hint`)
        hintBtn.classList.remove('red')
        gIsHint = false
    }, 1000)


}

function addMins(iMine, jMine) {
    var minesLocation = []
    for (var i = 0; i < gCells.length; i++) {
        if (gCells[i].location.i === iMine && gCells[i].location.j === jMine) {
            gCells.splice(i, 1)
        }
    }
    for (var i = 0; i < gLevel.MINES; i++) {
        minesLocation.push(drawCell().location)
    }
    for (var idx = 0; idx < minesLocation.length; idx++) {
        var i = minesLocation[idx].i
        var j = minesLocation[idx].j
        gBoard[i][j].isMine = true
    }
    renderBoard(gBoard)
}

function drawCell() {
    var idx = getRandomInt(0, gCells.length - 1)
    return gCells.splice(idx, 1)[0]
}

function revealCellContent(elCell, i, j) {

    if (gBoard[i][j].isMine) {
        boom(gBoard[i][j])
    } else {
        expandShown(gBoard, elCell, i, j)
    }
    document.querySelector(`.cell-${i}-${j}`).innerHTML = getCellAppearance(gBoard[i][j])
}

function boom(cell) {
    gGame.livesCount--
    updateLivesCount(gGame.livesCount)
    if (gGame.livesCount === 0) {
        // sets the game secsPass when game is over
        gGame.secsPassed = stopTimer()
        //change emoji
        updateRestartButtonImg()
        // when clicking a mine, all the mines are revealed
        revealMines(gBoard)
        // pause timer
        pauseTimer()
    }
    showCell(cell)
}

function updateRestartButtonImg() {
    var elRestartButton = document.querySelector(`.restart-button`)
    switch (true) {
        case !gGame.isOn:
            elRestartButton.src = gRestartButtonImg.EMPTY;
            break;
        case checkGameOver(gBoard):
            elRestartButton.src = gRestartButtonImg.WIN;
            break;
        case gGame.isOn && gGame.livesCount === 0:
            elRestartButton.src = gRestartButtonImg.ZERO;
            break;
        case gGame.isOn && gGame.livesCount === 1:
            elRestartButton.src = gRestartButtonImg.ONE_LIFE;
            break;
        case gGame.isOn && gGame.livesCount === 2:
            elRestartButton.src = gRestartButtonImg.TOW_LIVES;
            break;
        case gGame.isOn && gGame.livesCount === 3:
            elRestartButton.src = gRestartButtonImg.SMILE;
            break;
    }
}

function showCell(cell) {
    gBoard[cell.location.i][cell.location.j].isShown = true
    const elCell = document.querySelector(`.cell-${cell.location.i}-${cell.location.j}`)
    elCell.classList.remove('covered-cell')
}

function showVictory() {//*handel modal "victory" 
    const elGameOver = document.querySelector('.victory')
    elGameOver.classList.remove('hide')
    gGame.secsPassed = stopTimer()
    saveHighScore()
}

function hideVictory() {//*handel modal "victory"
    const elGameOver = document.querySelector('.victory')
    elGameOver.classList.add('hide')
}

function saveHighScore() {
    var currentWinner = JSON.parse(localStorage.getItem(`best-score-${gLevel.NAME}`))
    if (!currentWinner || currentWinner.score > gGame.secsPassed) {
        var gamer = prompt(`Congrats! You got the best score for ${gLevel.NAME} level! What is your name, winner?`)
        const user = { name: gamer, score: gGame.secsPassed };
        localStorage.setItem(`best-score-${gLevel.NAME}`, JSON.stringify(user));
        renderHighScores()
    }
}

function renderHighScores() {
    var beginnerWinner = JSON.parse(localStorage.getItem(`best-score-Beginner`))
    document.querySelector(".level-beginner .name").innerText = beginnerWinner ? beginnerWinner.name : "-"
    document.querySelector(".level-beginner .score").innerText = beginnerWinner ? `${beginnerWinner.score} seconds` : "-"

    var mediumWinner = JSON.parse(localStorage.getItem(`best-score-Medium`))
    document.querySelector(".level-medium .name").innerText = mediumWinner ? mediumWinner.name : "-"
    document.querySelector(".level-medium .score").innerText = mediumWinner ? `${mediumWinner.score} seconds` : "-"

    var expertWinner = JSON.parse(localStorage.getItem(`best-score-Expert`))
    document.querySelector(".level-expert .name").innerText = expertWinner ? expertWinner.name : "-"
    document.querySelector(".level-expert .score").innerText = expertWinner ? `${expertWinner.score} seconds` : "-"
}

function revealMines(board) {
    // * when clicking a mine, all the mines are revealed
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j].isShown = board[i][j].isMine
            if (board[i][j].isMine) {
                const elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.innerHTML = getCellAppearance(gBoard[i][j])
                elCell.classList.add('bombed-cell')
                elCell.classList.remove('covered-cell')
            }
        }
    }
}

function onCellMarked(elCell, event, i, j) {
    //* Called when a cell is right- 
    //*clicked See how you can hide the context menu on right click
    event.preventDefault()
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked
    var isMarked = gBoard[i][j].isMarked
    isMarked ? gGame.markedCount++ : gGame.markedCount--
    updateMarkedCount(gGame.markedCount)
    renderBoard(gBoard)
    var victory = checkGameOver(gBoard)
    if (victory) {
        updateRestartButtonImg()
        showVictory()
    }
}

function renderCell(location, value) {
    // Select the elCell and set the value
    const elCell = document.querySelector(`.cell-${location.i}-${location.j}`)
    elCell.innerHTML = value
}

function checkGameOver(board) {
    //* Game ends when all mines are marked, and all the other cells are shown
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            if (board[i][j].isMine && !board[i][j].isMarked) return false
            if (!board[i][j].isMine && !board[i][j].isShown) return false
        }
    }
    return true
}

function expandShown(board, elCell, i, j) {
    //* When user clicks a cell with no mines around, 
    //*we need to open not only that cell, but also its neighbors.
    //* BONUS: if you have the time later, try to work more like the 
    //*real algorithm (see description at the Bonuses section below)
    if (!board[i][j].isShown) {
        board[i][j].isShown = true
        elCell.classList.remove('covered-cell')
        gGame.shownCount++
        updateShownCount(gGame.shownCount)
    }
    if (!countNegs(i, j, board)) {
        for (var idxI = i - 1; idxI <= i + 1; idxI++) {
            if (idxI < 0 || idxI >= board.length) continue
            for (var idxJ = j - 1; idxJ <= j + 1; idxJ++) {
                if (idxI === i && idxJ === j) continue
                if (idxJ < 0 || idxJ >= board[idxI].length) continue
                var elNegCell = document.querySelector(`.cell-${idxI}-${idxJ}`)
                if (!board[idxI][idxJ].isShown) expandShown(board, elNegCell, idxI, idxJ)
            }
        }
    } else return
}

function countNegs(cellI, cellJ, board) {
    var negsCount = 0
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (i === cellI && j === cellJ) continue
            if (j < 0 || j >= board[i].length) continue
            if (board[i][j].isMine) negsCount++
        }
    }
    return negsCount
}


function onLevelSelected(level) {

    switch (level) {
        case 'Beginner':
            gLevel.SIZE = 4
            gLevel.MINES = 2
            gLevel.NAME = 'Beginner'
            break
        case 'Medium':
            gLevel.SIZE = 8
            gLevel.MINES = 14
            gLevel.NAME = 'Medium'
            break
        case 'Expert':
            gLevel.SIZE = 12
            gLevel.MINES = 32
            gLevel.NAME = 'Expert'
            break
    }
    document.querySelector(`button.active`).classList.remove('active')
    document.querySelector(`button.${level}`).classList.add('active')
    renderBoardContainer(level)
    onInit()
}

function renderBoardContainer(level) {
    var boardContainerPaddingTop
    var boardWrapperWidth
    var boardWrapperHeight

    switch (level) {
        case 'Beginner':
            boardContainerPaddingTop = 50
            boardWrapperWidth = 455
            boardWrapperHeight = 300
            break
        case 'Medium':
            boardContainerPaddingTop = 70
            boardWrapperWidth = 760
            boardWrapperHeight = 500
            break
        case 'Expert':
            boardContainerPaddingTop = 90
            boardWrapperWidth = 850
            boardWrapperHeight = 725
            break
    }

    const elBoardContainer = document.querySelector('.board-container')
    elBoardContainer.style.paddingTop = `${boardContainerPaddingTop}px`
    const elBoardWrapper = document.querySelector('.board-wrapper')
    elBoardWrapper.style.width = `${boardWrapperWidth}px`
    elBoardWrapper.style.height = `${boardWrapperHeight}px`
    elBoardWrapper.style.backgroundSize = `${boardWrapperWidth}px ${boardWrapperHeight}px`

}


function updateShownCount(shownCount) {
    const elShownCount = document.querySelector('.shown-count')
    elShownCount.innerText = shownCount
}

function updateMarkedCount(markedCount) {
    const elMarkedCount = document.querySelector('.marked-count')
    elMarkedCount.innerText = markedCount
}

function updateLivesCount(livesCount) {
    const elLives = document.querySelector('.lives')
    var strHTML = ''
    var numOfLives = gLevel.NAME === 'Beginner' ? 2 : 3
    for (var i = 0; i < numOfLives; i++) {
        if (i >= livesCount) {
            strHTML += '<img  src="img/heart0.png" width="35" alt="">  '
        } else
            strHTML += '<img  src="img/heart_full.png" width="35" alt="">'
    }
    elLives.innerHTML = strHTML
}

function exterminateMines() {
    if (gIsExterminate) {
        console.log("You cannot use the exterminator Power twice in one game")
        return
    }
    gIsExterminate = true
    var initialMineCount = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine) {
                initialMineCount++
            }
        }
    }

    var mineCount = gLevel.MINES === 2 ? 1 : 3

    while (initialMineCount && mineCount) {
        var i = getRandomInt(0, gLevel.SIZE - 1)
        var j = getRandomInt(0, gLevel.SIZE - 1)
        if (gBoard[i][j].isMine) {
            gBoard[i][j].isMine = false
            gBoard[i][j].isExploded = true
            gBoard[i][j].isShown = true
            initialMineCount--
            mineCount--
        }
    }
    setMinesNegsCount(gBoard)
    updateExterminator(0)
}

function updateExterminator(num) {
    document.querySelector('.exterminator-counter').innerText = num;
}

function updateShield(num) {
    if (num === 0) document.querySelector('.shield').classList.add('deactivated')
    document.querySelector('.shield-counter').innerText = num;
}

function safeClick() {
    if (!gGame.safeClick) return
    gGame.safeClick--
    updateShield(gGame.safeClick)

    var i = 0
    var j = 0
    var isSafe = true

    while (isSafe) {
        i = getRandomInt(0, gLevel.SIZE - 1)
        j = getRandomInt(0, gLevel.SIZE - 1)
        if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) isSafe = false
    }

    const elSafeCell = document.querySelector(`.cell-${i}-${j}`)
    elSafeCell.classList.add('highlighted')
    setTimeout(() => {
        elSafeCell.classList.remove('highlighted')
    }, 3000)
}

function onHintClicked(btnElm) {
    if (gIsHint || !gGame.hintCount) return
    btnElm.classList.add('red')
    gGame.hintCount--
    updateHintCount(gGame.hintCount)
    gIsHint = true
}

function updateHintCount(num) {
    if (num === 0) document.querySelector('.light-bulb').classList.add('deactivated')
    document.querySelector('.hint-counter').innerText = num;
}

function showSettingsModal() {
    const elSettingsModal = document.querySelector('.settings-modal-dialog')
    elSettingsModal.classList.remove('hide')
}

function hideSettingsModal() {
    const elSettingsModal = document.querySelector('.settings-modal-dialog')
    elSettingsModal.classList.add('hide')
}

function showScoreBoardModal() {
    const elScoreBoardModal = document.querySelector('.score-board-modal-dialog')
    elScoreBoardModal.classList.remove('hide')
}

function hideScoreBoardModal() {
    const elScoreBoardModal = document.querySelector('.score-board-modal-dialog')
    elScoreBoardModal.classList.add('hide')
}

const themeToggleBtn = document.getElementById('theme-toggle');

// Check localStorage for the saved theme
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

// Update the button text based on the current theme
themeToggleBtn.textContent = currentTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

themeToggleBtn.addEventListener('click', () => {
    // Get the current theme from the data-theme attribute
    const theme = document.documentElement.getAttribute('data-theme');

    // Toggle between light and dark modes
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);

    // Update the button text
    themeToggleBtn.textContent = newTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    // Save the new theme in localStorage
    localStorage.setItem('theme', newTheme);
});
