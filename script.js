import { WORDS } from "./words.js";

let deets = await fetch('https://faffdle-backend.herokuapp.com/word')
    .then(response => {
        if (response.ok) {
            return response.json()
        } else {
            return Promise.reject('Something\'s not right!')
        }
    })
    .then(result => result)
    .catch(error => {
        console.log(error);
        document.write('<html><body style="display: flex; align-items: center; justify-content: center;"><div><h3 style="text-align: center; margin-top: 1rem; margin-bottom: 1rem;">Something\'s not right! BRB</h3><img style="height: auto; width: 100%; border-radius: 0.5rem;" src="resources/GIFs/underMaintenance.gif" /><p style="text-align: center;">Kindly refresh the page in a bit.</p></div></body></html>');
    });

let rightGuessString = deets.word
let meaning = deets.meaning

var cookies
if (document.cookie.length == 0) {
    document.cookie = "result=''"
    document.cookie = "currentWord=''"
} else {
    cookies = document.cookie
        .split(';')
        .map(cookie => cookie.split('='))
        .reduce((accumulator, [key, value]) => ({ ...accumulator, [key.trim()]: decodeURIComponent(value) }), {});
    if (cookies.result != '') {
        if (cookies.currentWord == rightGuessString) {
            document.getElementById("modal").classList.remove("hidden")
        } else {
            document.cookie = "result=''"
            document.cookie = "currentWord=''"
            document.getElementById("modal").classList.add("hidden")
        }
    }
}

const NUMBER_OF_GUESSES = 6;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
// let rightGuessString = WORDS[Math.floor(Math.random() * WORDS.length)];

var timeLeft
async function getTime() {
    timeLeft = await fetch('https://faffdle-backend.herokuapp.com/countdown').then(response => response.json()).then(result => result)
    document.getElementById("theTimeLeft").innerHTML = timeLeft;
    var timeOutPromise = new Promise(function (resolve, reject) {
        // 1 Second delay
        setTimeout(resolve, 1000, 'Timeout Done');
    });
    Promise.all(
        [timeLeft, timeOutPromise]).then(function (values) {
            //Repeat
            getTime();
        });
}
getTime()

let wordLength = rightGuessString.length;
document.getElementById("theWordToBeGuessed").innerHTML = rightGuessString;
document.getElementById("theMeaning").innerHTML = meaning;
document.getElementById("theGIF").setAttribute('src', 'resources/GIFs/' + rightGuessString + '.gif')

function initBoard() {
    let board = document.getElementById("game-board");
    let availableWidth = board.clientWidth - 40;

    for (let i = 0; i < NUMBER_OF_GUESSES; i++) {
        let row = document.createElement("div")
        row.className = "letter-row"

        for (let j = 0; j < wordLength; j++) {
            let box = document.createElement("div")
            box.className = "letter-box"
            if (availableWidth < 360) {
                box.style.width = availableWidth / wordLength + "px"
                box.style.height = availableWidth / wordLength + "px"
            } else {
                box.style.width = "48px"
                box.style.height = "48px"
            }
            row.appendChild(box)
        }

        board.appendChild(row)
    }
}

function shadeKeyBoard(letter, color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent === letter) {
            let oldColor = elem.style.backgroundColor
            if (oldColor === '#538D4E') {
                return
            }

            if (oldColor === '#C79F00' && color !== '#538D4E') {
                return
            }

            elem.style.backgroundColor = color
            elem.style.color = 'white'
            break
        }
    }
}

function deleteLetter() {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter - 1]
    box.textContent = ""
    box.classList.remove("filled-box")
    currentGuess.pop()
    nextLetter -= 1
}

function checkGuess() {
    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let guessString = ''
    let rightGuess = Array.from(rightGuessString)

    for (const val of currentGuess) {
        guessString += val
    }

    if (guessString.length != wordLength) {
        Toastify({
            text: "Not enough letters",
            duration: 1500,
            gravity: "top",
            position: "center",
            style: {
                background: "#CC142D",
            },
        }).showToast();
        return
    }

    if (!WORDS.includes(guessString)) {
        Toastify({
            text: "Word not in list",
            duration: 1500,
            gravity: "top",
            position: "center",
            style: {
                background: "#CC142D",
            },
        }).showToast();
        return
    }


    for (let i = 0; i < wordLength; i++) {
        let letterColor = ''
        let box = row.children[i]
        let letter = currentGuess[i]

        let letterPosition = rightGuess.indexOf(currentGuess[i])
        // is letter in the correct guess
        if (letterPosition === -1) {
            letterColor = '#787C7E'
        } else {
            // now, letter is definitely in word
            // if letter index and right guess index are the same
            // letter is in the right position 
            if (currentGuess[i] === rightGuess[i]) {
                // shade green 
                letterColor = '#538D4E'
            } else {
                // shade box yellow
                letterColor = '#C79F00'
            }

            rightGuess[letterPosition] = "#"
        }

        let delay = 250 * i
        setTimeout(() => {
            //flip box
            animateCSS(box, 'flipInX')
            //shade box
            box.style.backgroundColor = letterColor
            box.style.color = 'white'
            box.style.border = 'none'
            shadeKeyBoard(letter, letterColor)
        }, delay)
    }

    if (guessString === rightGuessString) {
        document.getElementById("modal").classList.remove("hidden")
        guessesRemaining = 0
        document.cookie = "result=Yes"
        document.cookie = "currentWord=" + rightGuessString
        return
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;

        if (guessesRemaining === 0) {
            document.getElementById("modal").classList.remove("hidden")
            document.cookie = "result=No"
            document.cookie = "currentWord=" + rightGuessString
        }
    }
}

function insertLetter(pressedKey) {
    if (nextLetter === wordLength) {
        return
    }
    pressedKey = pressedKey.toLowerCase()

    let row = document.getElementsByClassName("letter-row")[6 - guessesRemaining]
    let box = row.children[nextLetter]
    animateCSS(box, "pulse")
    box.textContent = pressedKey
    box.classList.add("filled-box")
    currentGuess.push(pressedKey)
    nextLetter += 1
}

const animateCSS = (element, animation, prefix = 'animate__') =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        // const node = document.querySelector(element);
        const node = element
        node.style.setProperty('--animate-duration', '0.3s');

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });

document.addEventListener("keyup", (e) => {

    if (guessesRemaining === 0) {
        return
    }

    let pressedKey = String(e.key)
    if (pressedKey === "Backspace" && nextLetter !== 0) {
        deleteLetter()
        return
    }

    if ((pressedKey === "Enter") || (pressedKey === "→")) {
        checkGuess()
        return
    }

    let found = pressedKey.match(/[a-z]/gi)
    if (!found || found.length > 1) {
        return
    } else {
        insertLetter(pressedKey)
    }
})

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target

    if (!target.classList.contains("keyboard-button")) {
        return
    }
    let key = target.textContent

    if (key === "Del" || key == "⌫") {
        key = "Backspace"
    }

    document.dispatchEvent(new KeyboardEvent("keyup", { 'key': key }))
})

initBoard();