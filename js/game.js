'use strict'
   
const MINE = '🎱'
const MARKED = '🚩'
const EMPTY = ''
const SMILEY = '😊'
const EXPLODING = '🤯'

var gLevel = { //* This is an object by which the board size is set 
    //*(in this case: 4x4 board and how many mines to place)
    SIZE: 4,
    MINES: 2
}

const gGame = {
    //* This is an object in which you can keep and update the current game state:
    isOn: false,
    //* isOn: Boolean, when true we let the user play
    shownCount: 0,
    //* shownCount: How many cells are shown
    markedCount: 0,
    //* markedCount: How many cells are marked (with a flag)
    secsPassed: 0 
    //* secsPassed: How many seconds passed 
}

var gBoard //*A Matrix containing cell objects: Each cell:

var gCells

var gMins//?

function onInit() {//*This is called when page loads
    console.log('onInit')
    gCells = []
    gMins = []
    gBoard = buildBoard()
    renderBoard(gBoard)
    gGame.isOn = false
    resetTimer()
    hideGameOver()
    hideVictory()
    updateRestartButtonEmoji(SMILEY)
}

function buildBoard() { //!DONE
    //*Builds the board Set the mines Call setMinesNegsCount() 
    //*Return the created board
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
    console.table(board)
    return board
}

function createCell(){ //!DONE
    return { 
        minesAroundCount: 0, 
        isShown: false, 
        isMine: false, 
        isMarked: false,
        location: { } 
    }
}
function setMinesNegsCount(board) { //!DONE
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
    if (!gGame.isOn) {
        addMins(i, j)
        setMinesNegsCount(gBoard)
        gGame.isOn = true
        startTimer()
    } 
    revealCellContent(elCell, i, j)//TODO
    if(checkGameOver(gBoard)) showVictory()
}

function addMins( i, j) {
    var minesLocation = []
    for(var i=0; i< gCells.length; i++){
        if(gCells[i].location.i === i && gCells[i].location.j === j ){
            gCells.splice(i, 1)
        }
    }
    for(var i = 0; i < gLevel.MINES; i++){
        minesLocation.push(drawCell().location)
    }
    console.log(minesLocation[0].i)
    for(var idx = 0; idx<minesLocation.length; idx++){
        var i = minesLocation[idx].i
        var j = minesLocation[idx].j
        gBoard[i][j].isMine = true  
    }
    renderBoard(gBoard)
}

function drawCell() {
    var idx = getRandomInt(0, gCells.length - 1);
    return gCells.splice(idx, 1)[0];
}

function revealCellContent(elCell, i, j) {  
    // Todo add and remove class from elCell
    gBoard[i][j].isShown = true
    gGame.shownCount++ // TODO
    renderBoard(gBoard)
    if(gBoard[i][j].isMine) boom(gBoard[i][j]) //TODO
    if(!gBoard[i][j].minesAroundCount) expandShown(gBoard, elCell, i, j)
}

function boom(cell){//TODO
    //TODO check hits
    // when clicking a mine, all the mines are revealed
    revealMines(gBoard)
    // stop timer
    pauseTimer()
    // show modal "game over"
    showGameOver()
    //TODO change emoji
    updateRestartButtonEmoji(EXPLODING)
    // paint mine background red 
    paintBoombedMineBackground(cell)
}

function updateRestartButtonEmoji(emoji){
var elRestartButton = document.querySelector(`.restart`)
elRestartButton.innerText = emoji
}

function paintBoombedMineBackground(cell){//*paint mine background red 
    console.log(cell)
    const elCell = document.querySelector(`.cell-${cell.location.i}-${cell.location.j}`)
    elCell.classList.add('bombed-cell')
}


function showGameOver(){//*handel modal "game over"    
    const elGameOver = document.querySelector('.game_over')
    elGameOver.classList.remove('hide')  
}

function hideGameOver(){//*handel modal "game over"
    const elGameOver = document.querySelector('.game_over')
    elGameOver.classList.add('hide')
    gGame.secsPassed = stopTimer()
}


function showVictory(){//*handel modal "victory" 
    const elGameOver = document.querySelector('.victory')
    elGameOver.classList.remove('hide')  
    gGame.secsPassed = stopTimer()
}

function hideVictory(){//*handel modal "victory"
    const elGameOver = document.querySelector('.victory')
    elGameOver.classList.add('hide')
    
}
function revealMines(board){
    // * when clicking a mine, all the mines are revealed
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j].isShown = board[i][j].isMine
        }
    }
    //TODO add / remove classes 
    renderBoard(board)
}

function onCellMarked(elCell,event,i,j) {
    //* Called when a cell is right- 
    //*clicked See how you can hide the context menu on right click
    event.preventDefault()
    
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked
    var isMarked = gBoard[i][j].isMarked
    isMarked ? gGame.markedCount++ : gGame.markedCount--
    //console.log('gGame.markedCount:', gGame.markedCount)
    renderBoard(gBoard)
    
   //Todo add and remove class

   if(checkGameOver(gBoard)) showVictory()

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
            if(board[i][j].isMine && !board[i][j].isMarked) return false
            if(!board[i][j].isMine && !board[i][j].isShown) return false  
        }
    }
    return true


    //     console.log('Game Over')
    //     TODO check hits num
    //     TODO clear timer
    //     TODO change Emoji
    //     gGame.isOn = false



}

function expandShown(board, elCell, i, j) { //!Should be a recursive function
    //* When user clicks a cell with no mines around, 
    //*we need to open not only that cell, but also its neighbors.


    //* NOTE: start with a basic implementation that only opens the 
    //*non-mine 1st degree neighbors

    //* BONUS: if you have the time later, try to work more like the 
    //*real algorithm (see description at the Bonuses section below)
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

function onLevelSelected(level){
    switch(level){
        case 'Beginner':
            gLevel.SIZE = 4
            gLevel.MINES = 2
        break;
        case 'Medium':
            gLevel.SIZE = 8
            gLevel.MINES = 14
        break;
        case 'Expert':
            gLevel.SIZE = 12
            gLevel.MINES = 32
        break;
    }
    onInit()

}

