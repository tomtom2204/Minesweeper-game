'use strict'

const MINE = '🎱'
const MARKED = '🚩'
const EMPTY = ''
const NORMAL = '😊'
const LOSE = '🤯'
const WIN = '😎'
const HINT = '💡'

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
 
    gBoard = buildBoard()
    renderBoard(gBoard)
    
    resetTimer()
    hideGameOver()
    hideVictory()
    updateRestartButtonEmoji(NORMAL)
    updateShownCount(0)
    updateMarkedCount(0)
    gGame.livesCount =  gLevel.MINES === 2 ? 2 : 3 
    updateLivesCount(gGame.livesCount)
    gIsExterminate = false
    gGame.safeClick= 3
    gGame.hintCount= 3
    
}

function buildBoard() { 
    //*Builds the board  
    //*Set the mines 
    //*Call setMinesNegsCount()
    //*Return the created board
    
    if(!gGame.isOn){
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
}else{
    addMins(gFirstClick.i, gFirstClick.j)
    setMinesNegsCount(gBoard)
    console.table(gBoard)
}

}

function createCell() { 
    return {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
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
    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            const cellAppearance = getCellAppearance(board[i][j])
            const className = `cell cell-${i}-${j}`

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
        default:
            return cell.minesAroundCount
    }
}


function onCellClicked(elCell, i, j) {
    
    //* Called when a cell is clicked
    if(!gIsHint){
        if (!gGame.isOn) {
            gFirstClick = {i,j}
             gGame.isOn = true
             startTimer()
             buildBoard()
         }
         revealCellContent(elCell, i, j)//TODO
         if (checkGameOver(gBoard)){ 
             showVictory()
             updateRestartButtonEmoji(WIN)
         }
    } else if(gGame.hintCount){
        revealCellsContent(elCell, i, j)
    }
}



function revealCellsContent(elCell, cellI, cellJ){
    var unRevealed = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if(!gBoard[i][j].isShown){ 
                unRevealed.push({i,j})
                gBoard[i][j].isShown = true
            }
        }
    }
    renderBoard(gBoard)
    setTimeout(() => {
        for(var idx = 0; idx< unRevealed.length; idx++){
            gBoard[unRevealed[idx].i][unRevealed[idx].j].isShown = false
        }
        renderBoard(gBoard)
        var hintBtn = document.querySelector(`.hint`)
        hintBtn.classList.remove('red')
        gGame.hintCount--
        hintBtn.innerText = !gGame.hintCount ? 'No hints for you!' : HINT.repeat(gGame.hintCount)
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
    // Todo add and remove class from elCell

    if (gBoard[i][j].isMine) {
        boom(gBoard[i][j]) //TODO
    } else {
        expandShown(gBoard, elCell, i, j)
    }

    document.querySelector(`.cell-${i}-${j}`).innerHTML = getCellAppearance(gBoard[i][j])

}


function boom(cell) {//TODO
    //TODO check hits
    gGame.livesCount--
    updateLivesCount(gGame.livesCount) 
    if (gGame.livesCount === 0 ) {
        // show modal "game over"
        showGameOver()
        //change emoji
        updateRestartButtonEmoji(LOSE)
        // when clicking a mine, all the mines are revealed
        revealMines(gBoard)
        // pause timer
        pauseTimer()
    }

    showCell(cell)
}

function updateRestartButtonEmoji(emoji) {
    var elRestartButton = document.querySelector(`.restart`)
    elRestartButton.innerText = emoji
}

function showCell(cell) {
    gBoard[cell.location.i][cell.location.j].isShown = true
}


function showGameOver() {//*handel modal "game over"    
    const elGameOver = document.querySelector('.game_over')
    elGameOver.classList.remove('hide')
}

function hideGameOver() {//*handel modal "game over"
    const elGameOver = document.querySelector('.game_over')
    elGameOver.classList.add('hide')
    gGame.secsPassed = stopTimer()
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
    if(!currentWinner || currentWinner.score > gGame.secsPassed ){
        var gamer = prompt(`Congrats! You got the best score for ${gLevel.NAME} level! What is your name, winner?`)
        const user = { name: gamer, score: gGame.secsPassed };
        localStorage.setItem(`best-score-${gLevel.NAME}` , JSON.stringify(user));
        renderHighScores() 
    } 
}

function renderHighScores() {
    var beginnerWinner = JSON.parse(localStorage.getItem(`best-score-Beginner`))
    document.querySelector(".level-beginner .name").innerText = beginnerWinner ? beginnerWinner.name : "-" 
    document.querySelector(".level-beginner .score").innerText = beginnerWinner ? `${beginnerWinner.score} seconds` : "-" 

    var mediumWinner = JSON.parse(localStorage.getItem(`best-score-Medium`))
    document.querySelector(".level-medium .name").innerText = mediumWinner ? mediumWinner.name : "-" 
    document.querySelector(".level-medium .score").innerText = mediumWinner ?  `${mediumWinner.score} seconds` : "-" 

    var expertWinner = JSON.parse(localStorage.getItem(`best-score-Expert`))
    document.querySelector(".level-expert .name").innerText = expertWinner ? expertWinner.name : "-" 
    document.querySelector(".level-expert .score").innerText = expertWinner ? `${expertWinner.score} seconds` : "-" 
}


function revealMines(board) {
    // * when clicking a mine, all the mines are revealed
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j].isShown = board[i][j].isMine
           
            if(board[i][j].isMine){
                const elCell = document.querySelector(`.cell-${i}-${j}`)
                elCell.innerHTML = getCellAppearance(gBoard[i][j])
                elCell.classList.add('bombed-cell')
            }
        }
    }
    //TODO add / remove classes    
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

    //Todo add and remove class

    if (checkGameOver(gBoard)) {
        updateRestartButtonEmoji(WIN)
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
            gLevel.NAME =  'Beginner'
            break
        case 'Medium':
            gLevel.SIZE = 8
            gLevel.MINES = 14
            gLevel.NAME =  'Medium'
            break
        case 'Expert':
            gLevel.SIZE = 12
            gLevel.MINES = 32
            gLevel.NAME =  'Expert'
            break
    }
    onInit()
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
    const elLivesCount = document.querySelector('.lives-count')
    elLivesCount.innerText = livesCount
}

function exterminateMines(){
    if(gIsExterminate){ 
        console.log("You cannot use the exterminator Power twice in one game")
        return
    }
    gIsExterminate = true

    var initialMineCount = 0
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            if (gBoard[i][j].isMine){ 
                initialMineCount++
            }
        }
    }
    var mineCount = gLevel.MINES === 2 ? 1 : 3 
  
    while(initialMineCount && mineCount){
        var i = getRandomInt(0, gLevel.SIZE-1)
        var j = getRandomInt(0, gLevel.SIZE-1)
        if(gBoard[i][j].isMine){
            gBoard[i][j].isMine = false
            initialMineCount--
            mineCount--
        }
    }
    setMinesNegsCount(gBoard)
}

function safeClick(){
    if(!gGame.safeClick) return
    gGame.safeClick--
    updateSafeClick(gGame.safeClick)

    var i = 0
    var j = 0
    var isSafe = true

    while(isSafe){
         i = getRandomInt(0, gLevel.SIZE-1)
         j = getRandomInt(0, gLevel.SIZE-1)
        if(!gBoard[i][j].isMine && !gBoard[i][j].isShown) isSafe = false
    }
 
    const elSafeCell = document.querySelector(`.cell-${i}-${j}`)
    elSafeCell.classList.add('highlighted')
    setTimeout(() => {
        elSafeCell.classList.remove('highlighted')
    }, 3000)
}

function updateSafeClick(safeClick) {
    const elSafeClick = document.querySelector('.safe-click')
    elSafeClick.innerText = safeClick
}

function onHintClicked(btnElm){
    btnElm.classList.add('red')
    gIsHint = true

}