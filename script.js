const menu = document.getElementById('menu');
const game = document.getElementById('game');
const board = document.getElementById('board');
const moveSound = document.getElementById('moveSound');
const winSound = document.getElementById('winSound');
const defeatSound = document.getElementById('defeatSound');
const scoreX = document.getElementById('scoreX');
const scoreO = document.getElementById('scoreO');
const scoreDraw = document.getElementById('scoreDraw');
const gameModeTitle = document.getElementById('gameModeTitle');
const backBtn = document.getElementById('backBtn');
const btnComputer = document.getElementById('btnComputer');
const btnLocal = document.getElementById('btnLocal');
const resetBtn = document.getElementById('resetBtn');

let currentPlayer = 'X';
let cells = [];
let vsComputer = false;
let gameActive = false;

btnComputer.addEventListener('click', () => startGame('computer'));
btnLocal.addEventListener('click', () => startGame('local'));
resetBtn.addEventListener('click', resetGame);
backBtn.addEventListener('click', backToMenu);

function startGame(mode) {
  vsComputer = mode === 'computer';
  gameModeTitle.textContent = vsComputer ? 'Computer Game' : 'Local Game';
  menu.classList.remove('show');
  game.classList.add('show');
  resetGame();
  gameActive = true;
}

function backToMenu() {
  const line = board.querySelector('.line');
  if (line) line.remove();

  game.classList.remove('show');
  menu.classList.add('show');
  gameActive = false;
}

function resetGame() {
  const line = board.querySelector('.line');
  if (line) line.remove();

  board.innerHTML = '';
  cells = Array(9).fill('');
  currentPlayer = 'X';

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.addEventListener('click', () => makeMove(i, cell));
    board.appendChild(cell);
  }

  gameActive = true; // Make sure to enable moves on reset
}

function makeMove(index, cell) {
  if (!gameActive) return;
  if (cells[index] !== '') return;

  cells[index] = currentPlayer;
  cell.textContent = currentPlayer;
  cell.classList.add(currentPlayer === 'X' ? 'x' : 'o');

  // Play click sound
  moveSound.currentTime = 0;
  moveSound.play();

  const winner = checkWinner(currentPlayer);
  if (winner) {
    drawLine(winner);
    updateScore(currentPlayer);

    setTimeout(() => {
      if (vsComputer && currentPlayer === 'O') {
        // Computer won => defeat sound for player
        defeatSound.currentTime = 0;
        defeatSound.play();
        alert(`Computer (O) wins!`);
      } else {
        // Player won
        winSound.currentTime = 0;
        winSound.play();
        alert(`${currentPlayer} wins!`);
      }
      resetGame();
    }, 600);

    gameActive = false;
    return;
  }

  if (cells.every(c => c !== '')) {
    updateScore('Draw');
    gameActive = false; // disable moves during alert/reset
    setTimeout(() => {
      alert("It's a draw!");
      resetGame();
    }, 400);
    return;
  }

  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';

  if (vsComputer && currentPlayer === 'O') {
    setTimeout(makeComputerMove, 400);
  }
}

function makeComputerMove() {
  if (!gameActive) return;
  let bestMove = minimax(cells, 'O').index;
  if (bestMove === undefined) {
    return;
  }
  const cell = board.children[bestMove];
  makeMove(bestMove, cell);
}

function checkWinner(player) {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  return wins.find(p => p.every(i => cells[i] === player)) || null;
}

function drawLine(indices) {
  const [a, , c] = indices;
  const rectA = board.children[a].getBoundingClientRect();
  const rectC = board.children[c].getBoundingClientRect();
  const boardRect = board.getBoundingClientRect();

  const x1 = rectA.left + rectA.width / 2 - boardRect.left;
  const y1 = rectA.top + rectA.height / 2 - boardRect.top;
  const x2 = rectC.left + rectC.width / 2 - boardRect.left;
  const y2 = rectC.top + rectC.height / 2 - boardRect.top;

  const length = Math.hypot(x2 - x1, y2 - y1);
  const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

  const oldLine = board.querySelector('.line');
  if (oldLine) oldLine.remove();

  const line = document.createElement('div');
  line.className = 'line';
  line.style.left = `${x1}px`;
  line.style.top = `${y1}px`;
  line.style.width = `${length}px`;
  line.style.transform = `rotate(${angle}deg)`;

  board.appendChild(line);
}

function updateScore(winner) {
  if (winner === 'X') scoreX.textContent = +scoreX.textContent + 1;
  else if (winner === 'O') scoreO.textContent = +scoreO.textContent + 1;
  else scoreDraw.textContent = +scoreDraw.textContent + 1;
}

function minimax(newBoard, player) {
  const availSpots = newBoard
    .map((v, i) => (v === '' ? i : null))
    .filter((i) => i !== null);

  if (checkWin(newBoard, 'X')) {
    return { score: -10 };
  } else if (checkWin(newBoard, 'O')) {
    return { score: 10 };
  } else if (availSpots.length === 0) {
    return { score: 0 };
  }

  const moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === 'O') {
      let result = minimax(newBoard, 'X');
      move.score = result.score;
    } else {
      let result = minimax(newBoard, 'O');
      move.score = result.score;
    }

    newBoard[availSpots[i]] = '';
    moves.push(move);
  }

  let bestMove;
  if (player === 'O') {
    let bestScore = -Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = Infinity;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

function checkWin(boardState, player) {
  const wins = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  return wins.some(pattern => pattern.every(i => boardState[i] === player));
}
