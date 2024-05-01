const rotateButton = document.querySelector('#rotate-button');
const shipsContainer = document.querySelector('.ships-container');
const startButton = document.querySelector('#start-button');
const displayInfo = document.querySelector('#info');
const displayTurn = document.querySelector('#turn-display');

//Changing ship orientation
let rotationAngle = 0;
function rotateShips() {
    let shipTypes = Array.from(shipsContainer.children);
    if (rotationAngle == 0) {
        rotationAngle = 90;
    } else {
        rotationAngle = 0;
    }
    shipTypes.forEach(shipOption => shipOption.style.transform = `rotate(${rotationAngle}deg)`);
}
rotateButton.addEventListener('click', rotateShips);


//Creating boards
const gridWidth = 10;
const boardsContainer = document.querySelector('#boards-container');
function createBoard(color, user) {
    let boardContainer = document.createElement('div');
    boardContainer.classList.add('board');
    boardContainer.style.backgroundColor = color;
    boardContainer.id = user;

    for (let i = 0; i < gridWidth**2; i++) {
        let shipCell = document.createElement('div');
        shipCell.classList.add('shipCell');
        shipCell.id = i;
        boardContainer.append(shipCell);
    }
    boardsContainer.append(boardContainer);
}
createBoard('#f0e9e9', 'player');
createBoard('#f0e9e9', 'computer');


//Ship class
class Ship {
    constructor(name, length) {
        this.name = name;
        this.length = length;
    }
}

//Creating 5 ships
const destroyer = new Ship('destroyer', 2);
const submarine = new Ship('submarine', 3);
const cruiser = new Ship('cruiser', 3);
const battleship = new Ship('battleship', 4);
const carrier = new Ship('carrier', 5);

const ships = [destroyer, submarine, cruiser, battleship, carrier];
let notDropped;


//Randomly places ships on computer's board
function placeShip(user, ship, startId) {
    let allBoardCells = document.querySelectorAll(`#${user} div`);
    let randomBoolean = Math.random() < 0.5;

    let isHorizontal;
    if (user == 'player') {
        isHorizontal = rotationAngle === 0;
    } else {
        isHorizontal = randomBoolean;
    }

    let randomStartIndex = Math.floor(Math.random() * gridWidth ** 2);

    let startIndex;
    if (startId) {
        startIndex = startId;
    } else {
        startIndex = randomStartIndex;
    }

    let validStart;
    if (isHorizontal) {
        if (startIndex <= gridWidth ** 2 - ship.length) {
            validStart = startIndex;
        } else {
            validStart = gridWidth ** 2 - ship.length;
        }
    } else {
        if (startIndex <= gridWidth ** 2 - 1 - gridWidth * ship.length + gridWidth) {
            validStart = startIndex;
        } else {
            validStart = startIndex - gridWidth * ship.length + gridWidth;
        }
    }

    let shipCells = [];

    for (let i = 0; i < ship.length; i++) {
        if (isHorizontal) {
            shipCells.push(allBoardCells[Number(validStart) + i]);
        } else {
            shipCells.push(allBoardCells[Number(validStart) + (gridWidth * i)]);
        }
    }

    let valid = true;
    if (isHorizontal) {
        for (let index = 0; index < shipCells.length; index++) {
            if (shipCells[0].id % gridWidth == gridWidth - (shipCells.length - (index + 1))) {
                valid = false;
                break;
            }
        }
    } else {
        for (let index = 0; index < shipCells.length; index++) {
            if (shipCells[0].id >= (gridWidth**2 - gridWidth) + (gridWidth * index + 1)) {
                valid = false;
                break;
            }
        }
    }    
    
    let notTaken = true;
    for (const shipBlock of shipCells) {
        if (shipBlock.classList.contains('taken')) {
            notTaken = false;
            break;
        }
    }

    if (valid && notTaken) {
        shipCells.forEach(shipBlock => {
            shipBlock.classList.add(ship.name);
            shipBlock.classList.add('taken');
        })
    } else {
        if (user == 'computer') {
            placeShip(user, ship);
        }
        if (user == 'player') {
            notDropped = true;
        }
    }
}
ships.forEach(ship => placeShip('computer', ship));


//Drag player ships
let draggedShip;
const shipTypes = Array.from(shipsContainer.children);
shipTypes.forEach(shipType => shipType.addEventListener('dragstart', beginDrag))

const allPlayerCells = document.querySelectorAll('#player div');
allPlayerCells.forEach(playerCell => {
    playerCell.addEventListener('dragover', dragOver);
    playerCell.addEventListener('drop', drop);
})

function beginDrag(event) {
    notDropped = false;
    draggedShip = event.target;
}

function dragOver(event) {
    event.preventDefault();
}

function drop(event) {
    const startId = event.target.id;
    const ship = ships[draggedShip.id];
    placeShip('player', ship, startId);
    if (!notDropped) {
        draggedShip.remove();
    }
}


let isGameOver = false;
let playerGo;

//Start game
function startGame() {
    if (playerGo == undefined) {
        if (shipsContainer.children.length != 0) {
            displayInfo.textContent = 'Place all your ships first and then Start Game'
        } else {
            let allBoardCells = document.querySelectorAll('#computer div');
            allBoardCells.forEach(block => block.addEventListener('click', playerTurn));
            playerGo = true;
            displayTurn.textContent = "It's your turn";
            displayInfo.textContent = 'Pick a cell';
        }
    }
}
startButton.addEventListener('click', startGame);

let playerHits = [];
let computerHits = [];
let shipsSunkByPlayer = [];
let shipsSunkByComputer = [];
let playerHitsCount = 0;
let playerMissesCount = 0;
let computerHitsCount = 0;
let computerMissesCount = 0;

//Player's turn
function playerTurn(event) {
    if (!isGameOver) {
        // Check if the cell is not already clicked
        if (!event.target.classList.contains('hit') && !event.target.classList.contains('miss')) {
            // Check if the clicked cell is part of a ship
            if (event.target.classList.contains('taken')) {
                // Handle hit: increment hit count, update UI, and store ship information
                playerHitsCount++;
                document.getElementById('player-hits').textContent = playerHitsCount;
                event.target.classList.add('hit');
                event.target.style.lineHeight = event.target.clientHeight + 'px';
                event.target.textContent = 'X';
                displayInfo.textContent = "Wow! You HIT a ship";
                let classes = Array.from(event.target.classList);
                classes = classes.filter(className => className != 'shipCell');
                classes = classes.filter(className => className != 'hit');
                classes = classes.filter(className => className != 'taken');
                playerHits.push(...classes);
                checkScore('player', playerHits, shipsSunkByPlayer);
            } else {
                // Handle miss: increment miss count, update UI
                playerMissesCount++;
                document.getElementById('player-misses').textContent = playerMissesCount;
                displayInfo.textContent = "You MISSED!";
                event.target.classList.add('miss');
                event.target.style.lineHeight = event.target.clientHeight + 'px';
                event.target.textContent = 'miss';
            }
            // Player's turn is over, simulate computer turn after a delay
            playerGo = false;
            let allBoardCells = document.querySelectorAll('#computer div');
            allBoardCells.forEach(cell => cell.replaceWith(cell.cloneNode(true)));
            setTimeout(computerTurn, 1000);
        } else {
            // Provide feedback that the cell has already been clicked
            displayInfo.textContent = "You've already selected this cell! Pick a different one";
        }
    }
}

// Add integers from 0-99 into an array
let indices = [];
for (let index = 0; index < 100; index++) {
    indices.push(index);
}
let gameEnded = false;

// Computer's Turn
function computerTurn() {
    if (!isGameOver) {
        displayTurn.textContent = "It's the Computer's Turn";
        displayInfo.textContent = "The Computer is Thinking";
        setTimeout(() => {
            let randomIndex = Math.floor(Math.random() * indices.length);
            let randomPick = indices[randomIndex];
            indices.splice(randomIndex, 1);
            let allBoardCells = document.querySelectorAll('#player div');

            if (allBoardCells[randomPick].classList.contains('taken') && !allBoardCells[randomPick].classList.contains('hit')) {
                computerHitsCount++;
                document.getElementById('computer-hits').textContent = computerHitsCount;
                allBoardCells[randomPick].classList.add('hit');
                allBoardCells[randomPick].style.lineHeight = allPlayerCells[randomPick].clientHeight + 'px';
                allBoardCells[randomPick].textContent = 'X';
                displayInfo.textContent = 'The computer hit your ship!';
                let classes = Array.from(allBoardCells[randomPick].classList);
                classes = classes.filter(className => className != 'block');
                classes = classes.filter(className => className != 'hit');
                classes = classes.filter(className => className != 'taken');
                computerHits.push(...classes);
                checkScore('computer', computerHits, shipsSunkByComputer);
            } else {
                computerMissesCount++;
                document.getElementById('computer-misses').textContent = computerMissesCount;
                displayInfo.textContent = 'The Computer MISSED';
                allBoardCells[randomPick].classList.add('miss');
                allBoardCells[randomPick].style.lineHeight = allBoardCells[randomPick].clientHeight + 'px';
                allBoardCells[randomPick].textContent = 'miss';
            }
        }, 1000)
        setTimeout(() => {
            if (!gameEnded) {
                playerGo = true;
                displayTurn.textContent = "It's your turn";
                displayInfo.textContent = 'Pick a cell';
                let allBoardCells = document.querySelectorAll('#computer div');
                allBoardCells.forEach(block => block.addEventListener('click', playerTurn))
            }
        }, 2000)
    }
}



//Check score
function checkScore(user, userHits, shipsSunkByUser) {
    function checkShip(shipName, shipLength) {
        if (userHits.filter(storedShipName => storedShipName == shipName).length === shipLength) {
            if (user == 'player') {
                displayInfo.textContent = `HIT! You SUNK the computer's ${shipName}!`;
                playerHits = userHits.filter(storedShipName => storedShipName != shipName);
            }
            if (user == 'computer') {
                displayInfo.textContent = `The computer SUNK your ${shipName}!`;
                computerHits = userHits.filter(storedShipName => storedShipName != shipName);
            }
            let userBoard;
            if (user == 'computer') {
                userBoard = 'player';
            } else {
                userBoard = 'computer';
            }
            shipsSunkByUser.push(shipName);
            let computerShipCells = document.querySelectorAll(`#${userBoard} .${shipName}`);
            computerShipCells.forEach(cell => {
                cell.classList.add('sunk-ship');
            });
        }

    }
    checkShip('destroyer', 2);
    checkShip('submarine', 3);
    checkShip('cruiser', 3);
    checkShip('battleship', 4);
    checkShip('carrier', 5);

    if (shipsSunkByPlayer.length == 5) {
        displayTurn.textContent = '';
        displayInfo.textContent = "YOU WIN! You sunk ALL of the computer's ships";
        isGameOver = true;
        gameEnded = true;
    }
    if (shipsSunkByComputer.length == 5) {
        displayTurn.textContent = '';
        displayInfo.textContent = "YOU LOSE. The computer sunk ALL of your ships";
        isGameOver = true;
        gameEnded = true;
    }
}


const newGameButton = document.querySelector('#restart-button');
newGameButton.addEventListener('click', restartGame);

function restartGame() {
    location.reload(true);
}
   
