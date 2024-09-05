'use strict'
var gMinutes = 0
var gSeconds = 0
var gMilliseconds = 0
var gTimerInterval
var gTimerRunning = false

function makeId(length = 6) {
    var txt = ''
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (var i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return txt
}

function getRandomInt(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function startTimer() {
    if (!gTimerRunning) {
        gTimerInterval = setInterval(updateTimer, 10) // Update every 10ms
        gTimerRunning = true
    }
}

function updateTimer() {
    gMilliseconds += 10
    if (gMilliseconds === 1000) {
        gMilliseconds = 0
        gSeconds++
        if (gSeconds === 60) {
            gSeconds = 0
            gMinutes++
        }
    }

    document.getElementById('minutes').textContent = formatTime(gMinutes)
    document.getElementById('seconds').textContent = formatTime(gSeconds)
    document.getElementById('milliseconds').textContent = formatMilliseconds(gMilliseconds)
}

function stopTimer() {
    clearInterval(gTimerInterval)
    gTimerInterval = null
    gTimerRunning = false
    return 60 * gMinutes + gSeconds
}

function resetTimer() {
    document.getElementById('minutes').textContent = formatTime(0)
    document.getElementById('seconds').textContent = formatTime(0)
    document.getElementById('milliseconds').textContent = formatMilliseconds(0)
    gMinutes = 0
    gSeconds = 0
    gMilliseconds = 0
    gTimerRunning = false
}

function pauseTimer(){
    gGame.secsPassed = stopTimer()
}

function formatMilliseconds(time) {
    return time < 100 ? `0${time}`.slice(-3) : time
}

function formatTime(time) {
    return time < 10 ? `0${time}` : time
}

