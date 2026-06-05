const boardEl = document.querySelector("#board");
const timerEl = document.querySelector("#timer");
const mistakesEl = document.querySelector("#mistakes");
const hintsEl = document.querySelector("#hints");
const statusEl = document.querySelector("#status");
const lessonText = document.querySelector("#lessonText");
const newGameButton = document.querySelector("#newGameButton");
const checkButton = document.querySelector("#checkButton");
const hintButton = document.querySelector("#hintButton");
const difficultyButtons = document.querySelectorAll(".difficulty");
const numberButtons = document.querySelectorAll(".number-pad button");

const difficultySettings = {
  easy: { label: "Kolay", clues: 42, hints: 3 },
  medium: { label: "Orta", clues: 34, hints: 3 },
  hard: { label: "Zor", clues: 28, hints: 2 }
};

let currentLevel = "easy";
let puzzle = [];
let solution = [];
let selectedIndex = -1;
let mistakes = 0;
let hints = 3;
let startTime = Date.now();
let timerId = 0;

function createEmptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function isSafe(grid, row, col, value) {
  for (let i = 0; i < 9; i += 1) {
    if (grid[row][i] === value || grid[i][col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      if (grid[r][c] === value) {
        return false;
      }
    }
  }

  return true;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (grid[row][col] !== 0) {
        continue;
      }

      for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (!isSafe(grid, row, col, value)) {
          continue;
        }

        grid[row][col] = value;

        if (fillGrid(grid)) {
          return true;
        }

        grid[row][col] = 0;
      }

      return false;
    }
  }

  return true;
}

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function countSolutions(grid, limit = 2) {
  let count = 0;

  function solve() {
    if (count >= limit) {
      return;
    }

    let bestRow = -1;
    let bestCol = -1;
    let bestOptions = null;

    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (grid[row][col] !== 0) {
          continue;
        }

        const options = [];
        for (let value = 1; value <= 9; value += 1) {
          if (isSafe(grid, row, col, value)) {
            options.push(value);
          }
        }

        if (bestOptions === null || options.length < bestOptions.length) {
          bestOptions = options;
          bestRow = row;
          bestCol = col;
        }
      }
    }

    if (bestOptions === null) {
      count += 1;
      return;
    }

    for (const value of bestOptions) {
      grid[bestRow][bestCol] = value;
      solve();
      grid[bestRow][bestCol] = 0;
    }
  }

  solve();
  return count;
}

function createPuzzle(clues) {
  const fullGrid = createEmptyGrid();
  fillGrid(fullGrid);

  const puzzleGrid = cloneGrid(fullGrid);
  const cells = shuffle(Array.from({ length: 81 }, (_, index) => index));
  let visible = 81;

  for (const index of cells) {
    if (visible <= clues) {
      break;
    }

    const row = Math.floor(index / 9);
    const col = index % 9;
    const backup = puzzleGrid[row][col];
    puzzleGrid[row][col] = 0;

    const copy = cloneGrid(puzzleGrid);
    if (countSolutions(copy, 2) !== 1) {
      puzzleGrid[row][col] = backup;
    } else {
      visible -= 1;
    }
  }

  return {
    puzzleGrid,
    solutionGrid: fullGrid
  };
}

function flatten(grid) {
  return grid.flat();
}

function startNewGame(level = currentLevel) {
  currentLevel = level;
  const settings = difficultySettings[currentLevel];
  const generated = createPuzzle(settings.clues);

  puzzle = flatten(generated.puzzleGrid).map((value) => ({
    value,
    fixed: value !== 0,
    wrong: false
  }));
  solution = flatten(generated.solutionGrid);
  selectedIndex = -1;
  mistakes = 0;
  hints = settings.hints;
  startTime = Date.now();

  clearInterval(timerId);
  timerId = setInterval(updateTimer, 1000);
  updateTimer();
  renderBoard();
  updateStats();
  updateDifficultyButtons();
  setStatus(`${settings.label} seviye başladı. Boş bir hücre seç ve rakam gir.`, "warning");
  lessonText.textContent = "İpucu: Seçtiğin hücrenin satır, sütun ve 3x3 kutusundaki sayıları incele.";
}

function renderBoard() {
  boardEl.innerHTML = "";

  puzzle.forEach((cell, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cell";
    button.textContent = cell.value === 0 ? "" : cell.value;
    button.setAttribute("aria-label", `Sudoku hücresi ${index + 1}`);
    button.dataset.index = index;

    if (cell.fixed) {
      button.classList.add("given");
    }

    if (cell.wrong) {
      button.classList.add("wrong");
    }

    button.addEventListener("click", () => selectCell(index));
    boardEl.appendChild(button);
  });

  refreshSelection();
}

function selectCell(index) {
  selectedIndex = index;
  refreshSelection();
  updateLessonForSelection();
}

function refreshSelection() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.classList.remove("selected", "related", "same");
  });

  if (selectedIndex < 0) {
    return;
  }

  const selectedValue = puzzle[selectedIndex].value;
  const selectedRow = Math.floor(selectedIndex / 9);
  const selectedCol = selectedIndex % 9;
  const selectedBoxRow = Math.floor(selectedRow / 3);
  const selectedBoxCol = Math.floor(selectedCol / 3);

  cells.forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const col = index % 9;
    const sameRow = row === selectedRow;
    const sameCol = col === selectedCol;
    const sameBox = Math.floor(row / 3) === selectedBoxRow && Math.floor(col / 3) === selectedBoxCol;

    if (index === selectedIndex) {
      cell.classList.add("selected");
    } else if (sameRow || sameCol || sameBox) {
      cell.classList.add("related");
    }

    if (selectedValue !== 0 && puzzle[index].value === selectedValue) {
      cell.classList.add("same");
    }
  });
}

function updateLessonForSelection() {
  if (selectedIndex < 0) {
    return;
  }

  const row = Math.floor(selectedIndex / 9);
  const col = selectedIndex % 9;
  const used = getUsedNumbers(row, col);
  const possible = [];

  for (let value = 1; value <= 9; value += 1) {
    if (!used.has(value)) {
      possible.push(value);
    }
  }

  if (puzzle[selectedIndex].fixed) {
    lessonText.textContent = "Bu hücre başlangıç sayısıdır, değiştirilemez.";
    return;
  }

  lessonText.textContent = `Bu hücre için aday sayılar: ${possible.join(", ") || "yok"}. Aynı satır, sütun ve kutuda görünen rakamları ele.`;
}

function getUsedNumbers(row, col) {
  const used = new Set();

  for (let i = 0; i < 9; i += 1) {
    const rowValue = puzzle[row * 9 + i].value;
    const colValue = puzzle[i * 9 + col].value;
    if (rowValue !== 0) {
      used.add(rowValue);
    }
    if (colValue !== 0) {
      used.add(colValue);
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r += 1) {
    for (let c = boxCol; c < boxCol + 3; c += 1) {
      const value = puzzle[r * 9 + c].value;
      if (value !== 0) {
        used.add(value);
      }
    }
  }

  return used;
}

function setNumber(value) {
  if (selectedIndex < 0) {
    setStatus("Önce boş bir hücre seçmelisin.", "warning");
    return;
  }

  const cell = puzzle[selectedIndex];
  if (cell.fixed) {
    setStatus("Başlangıç sayıları değiştirilemez.", "warning");
    return;
  }

  if (value === 0) {
    cell.value = 0;
    cell.wrong = false;
    renderBoard();
    updateLessonForSelection();
    setStatus("Hücre temizlendi.", "warning");
    return;
  }

  cell.value = value;
  cell.wrong = value !== solution[selectedIndex];

  if (cell.wrong) {
    mistakes += 1;
    setStatus("Bu sayı doğru değil. Satır, sütun ve kutuyu tekrar kontrol et.", "error");
  } else {
    setStatus("Doğru hamle. Böyle devam et.", "success");
  }

  renderBoard();
  updateStats();
  updateLessonForSelection();
  checkWin();
}

function checkBoard() {
  let empty = 0;
  let wrong = 0;

  puzzle.forEach((cell, index) => {
    if (cell.value === 0) {
      empty += 1;
    } else if (cell.value !== solution[index]) {
      wrong += 1;
      cell.wrong = true;
    }
  });

  renderBoard();

  if (wrong > 0) {
    setStatus(`${wrong} hücre hatalı. Kırmızı hücreleri düzelt.`, "error");
  } else if (empty > 0) {
    setStatus(`Hata yok, ama ${empty} hücre boş.`, "warning");
  } else {
    completeGame();
  }
}

function useHint() {
  if (hints <= 0) {
    setStatus("Bu seviyede ipucu hakkın bitti.", "warning");
    return;
  }

  let target = selectedIndex;
  if (target < 0 || puzzle[target].fixed || puzzle[target].value === solution[target]) {
    target = puzzle.findIndex((cell, index) => !cell.fixed && cell.value !== solution[index]);
  }

  if (target < 0) {
    completeGame();
    return;
  }

  puzzle[target].value = solution[target];
  puzzle[target].wrong = false;
  selectedIndex = target;
  hints -= 1;
  renderBoard();
  updateStats();
  updateLessonForSelection();
  setStatus("İpucu kullanıldı. Seçili hücre doğru sayıyla dolduruldu.", "success");
  checkWin();
}

function checkWin() {
  const completed = puzzle.every((cell, index) => cell.value === solution[index]);
  if (completed) {
    completeGame();
  }
}

function completeGame() {
  clearInterval(timerId);
  setStatus("Tebrikler, Sudoku tamamlandı.", "success");
  lessonText.textContent = "Harika iş. Sudoku mantığı satır, sütun ve kutu kontrolünü düzenli yapmaya dayanır.";
}

function updateStats() {
  mistakesEl.textContent = mistakes;
  hintsEl.textContent = hints;
}

function updateTimer() {
  const seconds = Math.floor((Date.now() - startTime) / 1000);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const rest = String(seconds % 60).padStart(2, "0");
  timerEl.textContent = `${minutes}:${rest}`;
}

function updateDifficultyButtons() {
  difficultyButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.level === currentLevel);
  });
}

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`.trim();
}

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => startNewGame(button.dataset.level));
});

numberButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setNumber(Number(button.dataset.number));
  });
});

newGameButton.addEventListener("click", () => startNewGame(currentLevel));
checkButton.addEventListener("click", checkBoard);
hintButton.addEventListener("click", useHint);

window.addEventListener("keydown", (event) => {
  if (/^[1-9]$/.test(event.key)) {
    setNumber(Number(event.key));
  }

  if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
    setNumber(0);
  }
});

startNewGame("easy");
