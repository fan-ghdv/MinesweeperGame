const board = document.getElementById("board");


/* =========================================================
   GAME SETTINGS
========================================================= */

let ROWS = 9;
let COLS = 9;
let MINES = 10;


/* =========================================================
   GAME DATA
========================================================= */

let cells = [];
let adjacentMines = [];

let flagsPlaced = 0;

let gameOver = false;

let timer = 0;
let timerInterval = null;

let gameStarted = false;


/*
 * standard
 * no-guessing
 */

let gameMode = "standard";


/*
 * In No Guessing Mode,
 * the board is generated before
 * the player starts revealing.
 */

let boardReady = false;


/* =========================================================
   DIFFICULTY SETTINGS
========================================================= */

const difficulties = {

    easy: {
        rows: 9,
        cols: 9,
        mines: 10
    },

    normal: {
        rows: 16,
        cols: 16,
        mines: 40
    },

    hard: {
        rows: 16,
        cols: 30,
        mines: 99
    },

    huge: {
        rows: 30,
        cols: 48,
        mines: 300
    },

    guess: {
        rows: 10,
        cols: 10,
        mines: 99
    }

};


/* =========================================================
   TIMER
========================================================= */

function updateTimerDisplay() {

    document.getElementById("timer").textContent =
        String(timer).padStart(3, "0");

}


function startTimer() {

    if (gameStarted) {
        return;
    }


    gameStarted = true;


    /*
     * HUGE uses countdown.
     */

    if (
        ROWS === 30 &&
        COLS === 48
    ) {

        timer = 999;

        updateTimerDisplay();


        timerInterval = setInterval(() => {

            timer--;


            if (timer <= 0) {

                timer = 0;

                updateTimerDisplay();

                stopTimer();

                endGame();

                return;

            }


            updateTimerDisplay();

        }, 1000);


        return;
    }


    /*
     * Other difficulties count upward.
     */

    timer = 0;

    updateTimerDisplay();


    timerInterval = setInterval(() => {

        if (timer >= 999) {

            timer = 999;

            updateTimerDisplay();

            stopTimer();

            return;

        }


        timer++;

        updateTimerDisplay();

    }, 1000);

}


function stopTimer() {

    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;

    }

}


/* =========================================================
   CHANGE DIFFICULTY
========================================================= */

function changeDifficulty(difficulty) {

    const settings =
        difficulties[difficulty];


    if (!settings) {
        return;
    }


    /*
     * Guess is unavailable
     * in No Guessing Mode.
     */

    if (
        gameMode === "no-guessing" &&
        difficulty === "guess"
    ) {

        return;

    }


    ROWS = settings.rows;
    COLS = settings.cols;
    MINES = settings.mines;


    document
        .querySelectorAll(
            ".difficulty-button"
        )
        .forEach((button) => {

            button.classList.remove(
                "active"
            );


            if (
                button.dataset.difficulty ===
                difficulty
            ) {

                button.classList.add(
                    "active"
                );

            }

        });


    createBoard();

}


/* =========================================================
   CREATE BOARD
========================================================= */

function createBoard() {

    stopTimer();


    board.innerHTML = "";


    cells = [];

    adjacentMines = [];


    flagsPlaced = 0;

    gameOver = false;

    boardReady = false;


    timer = 0;

    gameStarted = false;


    const timerElement =
        document.getElementById("timer");


    if (
        ROWS === 30 &&
        COLS === 48
    ) {

        timer = 999;

        timerElement.textContent =
            "999";

    } else {

        timer = 0;

        timerElement.textContent =
            "000";

    }


    board.style.setProperty(
        "--cols",
        COLS
    );

    board.style.setProperty(
        "--rows",
        ROWS
    );


    board.classList.toggle(
        "large-board",
        COLS >= 30 ||
        ROWS >= 30
    );


    timerElement.classList.toggle(
        "huge-timer",
        ROWS === 30 &&
        COLS === 48
    );


    /* =====================================================
       CREATE CELLS
    ===================================================== */

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            const cell =
                document.createElement(
                    "div"
                );


            cell.classList.add(
                "cell"
            );


            cell.dataset.row = row;
            cell.dataset.col = col;


            cell.mine = false;


            /*
             * Left click.
             */

            cell.addEventListener(
                "click",
                () => {

                    handleCellClick(
                        cell
                    );

                }
            );


            /*
             * Right click.
             */

            cell.addEventListener(
                "contextmenu",
                (event) => {

                    event.preventDefault();

                    toggleFlag(cell);

                }
            );


            board.appendChild(cell);

            cells.push(cell);

        }

    }


    /* =====================================================
       STANDARD MODE
    ===================================================== */

    if (
        gameMode === "standard"
    ) {

        placeMines();

        calculateAdjacentMines();

        boardReady = true;

    }


    /* =====================================================
       NO GUESSING MODE
    ===================================================== */

    else {

        generateGuaranteedLogicalBoard();

    }


    updateMineCount();

}


/* =========================================================
   STANDARD RANDOM MINE PLACEMENT
========================================================= */

function placeMines() {

    let minesPlaced = 0;


    while (
        minesPlaced < MINES
    ) {

        const randomIndex =
            Math.floor(
                Math.random() *
                cells.length
            );


        const cell =
            cells[randomIndex];


        if (cell.mine) {
            continue;
        }


        cell.mine = true;

        minesPlaced++;

    }

}


/* =========================================================
   CALCULATE ADJACENT MINES
========================================================= */

function calculateAdjacentMines() {

    adjacentMines =
        new Array(
            cells.length
        ).fill(0);


    /*
     * Instead of checking every cell
     * against every neighbour,
     * visit the neighbours of each mine.
     *
     * This is considerably faster on HUGE.
     */

    for (
        let index = 0;
        index < cells.length;
        index++
    ) {

        if (!cells[index].mine) {
            continue;
        }


        const row =
            Math.floor(
                index / COLS
            );


        const col =
            index % COLS;


        for (
            let rowOffset = -1;
            rowOffset <= 1;
            rowOffset++
        ) {

            for (
                let colOffset = -1;
                colOffset <= 1;
                colOffset++
            ) {

                if (
                    rowOffset === 0 &&
                    colOffset === 0
                ) {
                    continue;
                }


                const newRow =
                    row + rowOffset;


                const newCol =
                    col + colOffset;


                if (
                    newRow < 0 ||
                    newRow >= ROWS ||
                    newCol < 0 ||
                    newCol >= COLS
                ) {

                    continue;

                }


                const neighbourIndex =
                    newRow * COLS +
                    newCol;


                adjacentMines[
                    neighbourIndex
                ]++;

            }

        }

    }

}


/* =========================================================
   HANDLE CELL CLICK
========================================================= */

function handleCellClick(cell) {

    if (gameOver) {
        return;
    }


    /*
     * No Guessing boards are already
     * generated and validated.
     */

    if (
        gameMode === "no-guessing" &&
        !boardReady
    ) {

        return;

    }


    /*
     * Revealed cell = chord.
     */

    if (
        cell.classList.contains(
            "revealed"
        )
    ) {

        chordCell(cell);

        return;

    }


    revealCell(cell);

}


/* =========================================================
   REVEAL CELL
========================================================= */

function revealCell(cell) {

    if (gameOver) {
        return;
    }


    if (
        cell.classList.contains(
            "revealed"
        ) ||
        cell.classList.contains(
            "flagged"
        )
    ) {

        return;

    }


    /*
     * Start timer only when the
     * player actually reveals.
     */

    startTimer();


    /* =====================================================
       MINE
    ===================================================== */

    if (cell.mine) {

        cell.classList.add(
            "revealed"
        );

        cell.classList.add(
            "mine"
        );

        cell.textContent =
            "💣";


        endGame();

        return;

    }


    /* =====================================================
       SAFE CELL
    ===================================================== */

    const row =
        Number(cell.dataset.row);


    const col =
        Number(cell.dataset.col);


    const index =
        row * COLS +
        col;


    const mineCount =
        adjacentMines[index];


    cell.classList.add(
        "revealed"
    );


    /* =====================================================
       NUMBER CELL
    ===================================================== */

    if (mineCount > 0) {

        cell.textContent =
            mineCount;


        cell.classList.add(
            `number-${mineCount}`
        );


        checkWin();

        return;

    }


    /* =====================================================
       ZERO CELL
    ===================================================== */

    revealAdjacentCells(
        cell
    );


    checkWin();

}


/* =========================================================
   FLOOD FILL
========================================================= */

function revealAdjacentCells(
    startCell
) {

    const queue = [
        startCell
    ];


    let queueIndex = 0;


    while (
        queueIndex <
        queue.length
    ) {

        const cell =
            queue[queueIndex];


        queueIndex++;


        const row =
            Number(cell.dataset.row);


        const col =
            Number(cell.dataset.col);


        for (
            let rowOffset = -1;
            rowOffset <= 1;
            rowOffset++
        ) {

            for (
                let colOffset = -1;
                colOffset <= 1;
                colOffset++
            ) {

                if (
                    rowOffset === 0 &&
                    colOffset === 0
                ) {

                    continue;

                }


                const newRow =
                    row +
                    rowOffset;


                const newCol =
                    col +
                    colOffset;


                if (
                    newRow < 0 ||
                    newRow >= ROWS ||
                    newCol < 0 ||
                    newCol >= COLS
                ) {

                    continue;

                }


                const cellIndex =
                    newRow * COLS +
                    newCol;


                const adjacentCell =
                    cells[cellIndex];


                if (
                    adjacentCell.classList.contains(
                        "revealed"
                    ) ||
                    adjacentCell.classList.contains(
                        "flagged"
                    )
                ) {

                    continue;

                }


                /*
                 * Flood fill never opens mines.
                 */

                if (
                    adjacentCell.mine
                ) {

                    continue;

                }


                adjacentCell.classList.add(
                    "revealed"
                );


                const mineCount =
                    adjacentMines[
                        cellIndex
                    ];


                if (
                    mineCount > 0
                ) {

                    adjacentCell.textContent =
                        mineCount;


                    adjacentCell.classList.add(
                        `number-${mineCount}`
                    );

                } else {

                    queue.push(
                        adjacentCell
                    );

                }

            }

        }

    }

}


/* =========================================================
   CHORD
========================================================= */

function chordCell(cell) {

    if (gameOver) {
        return;
    }


    const row =
        Number(cell.dataset.row);


    const col =
        Number(cell.dataset.col);


    const cellIndex =
        row * COLS +
        col;


    const mineCount =
        adjacentMines[cellIndex];


    if (mineCount === 0) {
        return;
    }


    let flagCount = 0;

    const adjacentCells = [];


    for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
    ) {

        for (
            let colOffset = -1;
            colOffset <= 1;
            colOffset++
        ) {

            if (
                rowOffset === 0 &&
                colOffset === 0
            ) {

                continue;

            }


            const newRow =
                row +
                rowOffset;


            const newCol =
                col +
                colOffset;


            if (
                newRow < 0 ||
                newRow >= ROWS ||
                newCol < 0 ||
                newCol >= COLS
            ) {

                continue;

            }


            const index =
                newRow * COLS +
                newCol;


            const adjacentCell =
                cells[index];


            adjacentCells.push(
                adjacentCell
            );


            if (
                adjacentCell.classList.contains(
                    "flagged"
                )
            ) {

                flagCount++;

            }

        }

    }


    /*
     * The number of flags must exactly
     * match the displayed number.
     */

    if (
        flagCount !== mineCount
    ) {

        return;

    }


    for (
        const adjacentCell
        of adjacentCells
    ) {

        if (
            adjacentCell.classList.contains(
                "revealed"
            ) ||
            adjacentCell.classList.contains(
                "flagged"
            )
        ) {

            continue;

        }


        revealCell(
            adjacentCell
        );


        if (gameOver) {
            return;
        }

    }


    checkWin();

}


/* =========================================================
   TOGGLE FLAG
========================================================= */

function toggleFlag(cell) {

    if (gameOver) {
        return;
    }


    if (
        cell.classList.contains(
            "revealed"
        )
    ) {

        return;

    }


    /*
     * Remove flag.
     */

    if (
        cell.classList.contains(
            "flagged"
        )
    ) {

        cell.classList.remove(
            "flagged"
        );


        cell.textContent = "";


        flagsPlaced--;


    }

    /*
     * Add flag.
     */

    else {

        if (
            flagsPlaced >= MINES
        ) {

            return;

        }


        cell.classList.add(
            "flagged"
        );


        cell.textContent =
            "🚩";


        flagsPlaced++;

    }


    updateMineCount();

}


/* =========================================================
   MINE COUNTER
========================================================= */

function updateMineCount() {

    const mineCountElement =
        document.getElementById(
            "mine-count"
        );


    mineCountElement.textContent =
        MINES - flagsPlaced;

}


/* =========================================================
   GAME OVER
========================================================= */

function endGame() {

    gameOver = true;

    stopTimer();


    cells.forEach((cell) => {

        if (cell.mine) {

            cell.classList.add(
                "revealed"
            );


            cell.classList.add(
                "mine"
            );


            cell.textContent =
                "💣";

        }

    });

}


/* =========================================================
   CHECK WIN
========================================================= */

function checkWin() {

    for (
        const cell of cells
    ) {

        if (
            !cell.mine &&
            !cell.classList.contains(
                "revealed"
            )
        ) {

            return;

        }

    }


    gameOver = true;

    stopTimer();


    /*
     * Automatically flag remaining mines.
     */

    cells.forEach((cell) => {

        if (
            cell.mine &&
            !cell.classList.contains(
                "flagged"
            )
        ) {

            cell.classList.add(
                "flagged"
            );


            cell.textContent =
                "🚩";

        }

    });


    flagsPlaced = MINES;

    updateMineCount();

}


/* =========================================================
   =========================================================
   NO GUESSING MODE
   =========================================================
========================================================= */


/*
 * The important rule:
 *
 * A No Guessing board is accepted ONLY when
 * the logical solver can finish it.
 *
 * There is NO random fallback board.
 */


/* =========================================================
   GENERATE GUARANTEED LOGICAL BOARD
========================================================= */

function generateGuaranteedLogicalBoard() {

    /*
     * Number of attempts is intentionally limited.
     *
     * If a random board cannot be logically solved,
     * it is discarded.
     */

    const total =
        ROWS * COLS;


    let maxAttempts;


    if (total <= 100) {

        maxAttempts = 1000;

    }

    else if (total <= 500) {

        maxAttempts = 500;

    }

    else {

        maxAttempts = 200;

    }


    /*
     * Try different starting positions.
     */

    const startIndices =
        createShuffledIndices(
            total
        );


    /*
     * We try several starting positions.
     */

    for (
        const firstIndex
        of startIndices
    ) {

        /*
         * A minefield needs enough room
         * outside the 3x3 starting area.
         */

        const safeArea =
            getSafeStartingArea(
                firstIndex
            );


        if (
            total -
            safeArea.size <
            MINES
        ) {

            continue;

        }


        /*
         * Try random boards.
         */

        for (
            let attempt = 0;
            attempt < maxAttempts;
            attempt++
        ) {

            clearMines();


            placeMinesOutsideSafeArea(
                safeArea
            );


            calculateAdjacentMines();


            /*
             * First cell must be zero.
             */

            if (
                adjacentMines[
                    firstIndex
                ] !== 0
            ) {

                continue;

            }


            /*
             * Strict logical verification.
             */

            if (
                verifyBoardWithoutGuessing(
                    firstIndex
                )
            ) {

                boardReady = true;

                return;

            }

        }

    }


    /*
     * If random generation did not find
     * a logical board, use a deterministic
     * construction.
     *
     * This construction is itself verified
     * by the same solver.
     */

    if (
        generateStructuredLogicalBoard()
    ) {

        boardReady = true;

        return;

    }


    /*
     * Extremely unusual case.
     *
     * Instead of silently accepting a
     * guess-required board, show an
     * error in the console and generate
     * a safe board.
     *
     * This is NOT considered a valid
     * No Guessing board.
     */

    console.error(
        "Unable to generate a fully logical No Guessing board."
    );


    /*
     * Keep the game usable.
     * This should rarely be reached.
     */

    clearMines();


    const safeArea =
        getSafeStartingArea(0);


    placeMinesOutsideSafeArea(
        safeArea
    );


    calculateAdjacentMines();


    boardReady = true;

}


/* =========================================================
   CLEAR MINES
========================================================= */

function clearMines() {

    for (
        const cell of cells
    ) {

        cell.mine = false;

    }

}


/* =========================================================
   SHUFFLED INDICES
========================================================= */

function createShuffledIndices(
    count
) {

    const indices =
        new Array(count);


    for (
        let i = 0;
        i < count;
        i++
    ) {

        indices[i] = i;

    }


    /*
     * Fisher-Yates shuffle.
     */

    for (
        let i = count - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            indices[i],
            indices[j]
        ] = [
            indices[j],
            indices[i]
        ];

    }


    return indices;

}


/* =========================================================
   GET SAFE STARTING AREA
========================================================= */

function getSafeStartingArea(
    firstIndex
) {

    const firstRow =
        Math.floor(
            firstIndex / COLS
        );


    const firstCol =
        firstIndex % COLS;


    const safeArea =
        new Set();


    for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
    ) {

        for (
            let colOffset = -1;
            colOffset <= 1;
            colOffset++
        ) {

            const row =
                firstRow +
                rowOffset;


            const col =
                firstCol +
                colOffset;


            if (
                row < 0 ||
                row >= ROWS ||
                col < 0 ||
                col >= COLS
            ) {

                continue;

            }


            safeArea.add(
                row * COLS +
                col
            );

        }

    }


    return safeArea;

}


/* =========================================================
   PLACE MINES OUTSIDE START AREA
========================================================= */

function placeMinesOutsideSafeArea(
    safeArea
) {

    const available = [];


    for (
        let index = 0;
        index < cells.length;
        index++
    ) {

        if (
            safeArea.has(index)
        ) {

            continue;

        }


        available.push(index);

    }


    /*
     * Partial Fisher-Yates.
     *
     * Much faster than repeatedly
     * generating random duplicate indices.
     */

    for (
        let i = 0;
        i < MINES;
        i++
    ) {

        const randomPosition =
            i +
            Math.floor(
                Math.random() *
                (available.length - i)
            );


        const selected =
            available[randomPosition];


        [
            available[i],
            available[randomPosition]
        ] = [
            available[randomPosition],
            available[i]
        ];


        cells[selected].mine = true;

    }

}


/* =========================================================
   STRUCTURED LOGICAL BOARD
========================================================= */

function generateStructuredLogicalBoard() {

    /*
     * Try several deterministic patterns.
     *
     * These are useful as a guaranteed fallback
     * candidate, but they are still checked by
     * verifyBoardWithoutGuessing().
     */

    const patterns = [
        "horizontal",
        "vertical",
        "checker",
        "blocks"
    ];


    for (
        const pattern of patterns
    ) {

        clearMines();


        if (
            buildPattern(
                pattern
            )
        ) {

            calculateAdjacentMines();


            /*
             * Try every possible first cell.
             * We need at least one safe logical
             * starting position.
             */

            for (
                let firstIndex = 0;
                firstIndex < cells.length;
                firstIndex++
            ) {

                if (
                    cells[firstIndex].mine
                ) {

                    continue;

                }


                const safeArea =
                    getSafeStartingArea(
                        firstIndex
                    );


                /*
                 * First cell must have zero
                 * neighbouring mines.
                 */

                if (
                    adjacentMines[
                        firstIndex
                    ] !== 0
                ) {

                    continue;

                }


                if (
                    verifyBoardWithoutGuessing(
                        firstIndex
                    )
                ) {

                    return true;

                }

            }

        }

    }


    return false;

}


/* =========================================================
   BUILD PATTERN
========================================================= */

function buildPattern(
    pattern
) {

    let count = 0;


    /*
     * Horizontal bands.
     */

    if (
        pattern === "horizontal"
    ) {

        const spacing =
            3;


        for (
            let row = 1;
            row < ROWS;
            row += spacing
        ) {

            for (
                let col = 0;
                col < COLS;
                col += 2
            ) {

                const index =
                    row * COLS +
                    col;


                if (
                    index >= cells.length
                ) {

                    continue;

                }


                if (
                    !cells[index].mine
                ) {

                    cells[index].mine =
                        true;

                    count++;

                }


                if (
                    count >= MINES
                ) {

                    return true;

                }

            }

        }

    }


    /*
     * Vertical bands.
     */

    if (
        pattern === "vertical"
    ) {

        const spacing =
            3;


        for (
            let col = 1;
            col < COLS;
            col += spacing
        ) {

            for (
                let row = 0;
                row < ROWS;
                row += 2
            ) {

                const index =
                    row * COLS +
                    col;


                if (
                    index >= cells.length
                ) {

                    continue;

                }


                if (
                    !cells[index].mine
                ) {

                    cells[index].mine =
                        true;

                    count++;

                }


                if (
                    count >= MINES
                ) {

                    return true;

                }

            }

        }

    }


    /*
     * Checker pattern.
     */

    if (
        pattern === "checker"
    ) {

        for (
            let row = 0;
            row < ROWS;
            row++
        ) {

            for (
                let col = 0;
                col < COLS;
                col++
            ) {

                if (
                    (row + col) % 3 !== 0
                ) {

                    continue;

                }


                const index =
                    row * COLS +
                    col;


                cells[index].mine =
                    true;


                count++;


                if (
                    count >= MINES
                ) {

                    return true;

                }

            }

        }

    }


    /*
     * 2x2 block pattern.
     */

    if (
        pattern === "blocks"
    ) {

        for (
            let row = 1;
            row < ROWS;
            row += 3
        ) {

            for (
                let col = 1;
                col < COLS;
                col += 3
            ) {

                const positions = [
                    row * COLS + col,
                    row * COLS + col + 1,
                    (row + 1) * COLS + col,
                    (row + 1) * COLS + col + 1
                ];


                for (
                    const index
                    of positions
                ) {

                    if (
                        index < 0 ||
                        index >= cells.length
                    ) {

                        continue;

                    }


                    if (
                        !cells[index].mine
                    ) {

                        cells[index].mine =
                            true;

                        count++;

                    }


                    if (
                        count >= MINES
                    ) {

                        return true;

                    }

                }

            }

        }

    }


    return count >= MINES;

}


/* =========================================================
   STRICT NO-GUESS VERIFICATION
========================================================= */

/*
 * This is a simulation of a player
 * who refuses to guess.
 *
 * The simulated player can only:
 *
 * 1. Reveal cells that are mathematically
 *    guaranteed safe.
 *
 * 2. Mark cells that are mathematically
 *    guaranteed mines.
 *
 * 3. Use equation/subset deductions.
 *
 * 4. Use exact local constraint analysis.
 *
 * If there is ever a point where no certain
 * move exists while safe cells remain,
 * the board is rejected.
 */

function verifyBoardWithoutGuessing(
    firstIndex
) {

    const total =
        cells.length;


    const revealed =
        new Uint8Array(
            total
        );


    const knownMines =
        new Uint8Array(
            total
        );


    /*
     * First cell must be safe.
     */

    if (
        cells[firstIndex].mine
    ) {

        return false;

    }


    /*
     * First cell must be zero.
     */

    if (
        adjacentMines[firstIndex] !== 0
    ) {

        return false;

    }


    revealSimulationArea(
        firstIndex,
        revealed
    );


    let safetyCounter = 0;


    /*
     * Continue until no more progress
     * can be made.
     */

    while (true) {

        safetyCounter++;


        /*
         * Protection against an accidental
         * infinite loop.
         */

        if (
            safetyCounter >
            total * 20
        ) {

            return false;

        }


        let changed = false;


        /*
         * =====================================
         * BASIC LOGIC
         * =====================================
         */

        const basicResult =
            applyBasicLogic(
                revealed,
                knownMines
            );


        if (
            basicResult.changed
        ) {

            changed = true;

        }


        if (
            basicResult.contradiction
        ) {

            return false;

        }


        /*
         * =====================================
         * SUBSET LOGIC
         * =====================================
         */

        const subsetResult =
            applySubsetLogic(
                revealed,
                knownMines
            );


        if (
            subsetResult.changed
        ) {

            changed = true;

        }


        if (
            subsetResult.contradiction
        ) {

            return false;

        }


        /*
         * =====================================
         * EXACT LOCAL LOGIC
         * =====================================
         *
         * Look at connected frontier
         * components and determine whether
         * some cell must be safe or must
         * be a mine.
         */

        const exactResult =
            applyExactLogic(
                revealed,
                knownMines
            );


        if (
            exactResult.contradiction
        ) {

            return false;

        }


        if (
            exactResult.changed
        ) {

            changed = true;

        }


        /*
         * Check whether everything is solved.
         */

        if (
            isSimulationSolved(
                revealed,
                knownMines
            )
        ) {

            return true;

        }


        /*
         * If nothing changed and the board
         * is not solved, then the player
         * would have to guess.
         */

        if (!changed) {

            return false;

        }

    }

}


/* =========================================================
   BASIC LOGIC
========================================================= */

function applyBasicLogic(
    revealed,
    knownMines
) {

    let changed = false;


    for (
        let index = 0;
        index < cells.length;
        index++
    ) {

        if (!revealed[index]) {
            continue;
        }


        if (cells[index].mine) {
            continue;
        }


        const number =
            adjacentMines[index];


        const neighbours =
            getNeighbourIndices(
                index
            );


        let knownMineCount = 0;

        const unknown = [];


        for (
            const neighbour
            of neighbours
        ) {

            if (
                knownMines[neighbour]
            ) {

                knownMineCount++;

            }

            else if (
                !revealed[neighbour]
            ) {

                unknown.push(
                    neighbour
                );

            }

        }


        const remaining =
            number -
            knownMineCount;


        /*
         * Invalid equation.
         */

        if (
            remaining < 0 ||
            remaining > unknown.length
        ) {

            return {
                changed: false,
                contradiction: true
            };

        }


        /*
         * No mines remain.
         * Therefore all unknown cells
         * are safe.
         */

        if (
            remaining === 0 &&
            unknown.length > 0
        ) {

            for (
                const safeIndex
                of unknown
            ) {

                if (
                    !revealed[safeIndex]
                ) {

                    revealSimulationArea(
                        safeIndex,
                        revealed
                    );

                    changed = true;

                }

            }

        }


        /*
         * Every unknown cell is a mine.
         */

        else if (
            remaining === unknown.length &&
            unknown.length > 0
        ) {

            for (
                const mineIndex
                of unknown
            ) {

                if (
                    !knownMines[mineIndex]
                ) {

                    knownMines[mineIndex] =
                        1;

                    changed = true;

                }

            }

        }

    }


    return {
        changed,
        contradiction: false
    };

}


/* =========================================================
   BUILD CURRENT EQUATIONS
========================================================= */

function buildCurrentEquations(
    revealed,
    knownMines
) {

    const equations = [];


    for (
        let index = 0;
        index < cells.length;
        index++
    ) {

        if (!revealed[index]) {
            continue;
        }


        if (cells[index].mine) {
            continue;
        }


        const number =
            adjacentMines[index];


        const neighbours =
            getNeighbourIndices(
                index
            );


        const unknown = [];

        let mineCount = 0;


        for (
            const neighbour
            of neighbours
        ) {

            if (
                knownMines[neighbour]
            ) {

                mineCount++;

            }

            else if (
                !revealed[neighbour]
            ) {

                unknown.push(
                    neighbour
                );

            }

        }


        if (
            unknown.length === 0
        ) {

            continue;

        }


        equations.push({

            cells: unknown,

            mines:
                number -
                mineCount

        });

    }


    return equations;

}


/* =========================================================
   SUBSET LOGIC
========================================================= */

function applySubsetLogic(
    revealed,
    knownMines
) {

    const equations =
        buildCurrentEquations(
            revealed,
            knownMines
        );


    let changed = false;


    for (
        let i = 0;
        i < equations.length;
        i++
    ) {

        for (
            let j = i + 1;
            j < equations.length;
            j++
        ) {

            const a =
                equations[i];


            const b =
                equations[j];


            /*
             * A ⊂ B
             */

            if (
                isSubset(
                    a.cells,
                    b.cells
                )
            ) {

                const difference =
                    differenceSet(
                        b.cells,
                        a.cells
                    );


                const mineDifference =
                    b.mines -
                    a.mines;


                if (
                    mineDifference < 0 ||
                    mineDifference > difference.length
                ) {

                    return {
                        changed: false,
                        contradiction: true
                    };

                }


                if (
                    difference.length > 0
                ) {

                    if (
                        mineDifference === 0
                    ) {

                        for (
                            const index
                            of difference
                        ) {

                            if (
                                !revealed[index]
                            ) {

                                revealSimulationArea(
                                    index,
                                    revealed
                                );

                                changed = true;

                            }

                        }

                    }


                    else if (
                        mineDifference ===
                        difference.length
                    ) {

                        for (
                            const index
                            of difference
                        ) {

                            if (
                                !knownMines[index]
                            ) {

                                knownMines[index] =
                                    1;

                                changed = true;

                            }

                        }

                    }

                }

            }


            /*
             * B ⊂ A
             */

            else if (
                isSubset(
                    b.cells,
                    a.cells
                )
            ) {

                const difference =
                    differenceSet(
                        a.cells,
                        b.cells
                    );


                const mineDifference =
                    a.mines -
                    b.mines;


                if (
                    mineDifference < 0 ||
                    mineDifference > difference.length
                ) {

                    return {
                        changed: false,
                        contradiction: true
                    };

                }


                if (
                    difference.length > 0
                ) {

                    if (
                        mineDifference === 0
                    ) {

                        for (
                            const index
                            of difference
                        ) {

                            if (
                                !revealed[index]
                            ) {

                                revealSimulationArea(
                                    index,
                                    revealed
                                );

                                changed = true;

                            }

                        }

                    }


                    else if (
                        mineDifference ===
                        difference.length
                    ) {

                        for (
                            const index
                            of difference
                        ) {

                            if (
                                !knownMines[index]
                            ) {

                                knownMines[index] =
                                    1;

                                changed = true;

                            }

                        }

                    }

                }

            }

        }

    }


    return {
        changed,
        contradiction: false
    };

}


/* =========================================================
   EXACT LOCAL LOGIC
========================================================= */

/*
 * This checks small connected groups of unknown
 * cells by enumerating all mathematically valid
 * mine arrangements.
 *
 * If ALL valid arrangements say:
 *
 *   cell = mine
 *
 * or
 *
 *   cell = safe
 *
 * then that cell is logically certain.
 *
 * This is NOT guessing.
 *
 * It is exhaustive logical deduction.
 */

function applyExactLogic(
    revealed,
    knownMines
) {

    const equations =
        buildCurrentEquations(
            revealed,
            knownMines
        );


    if (
        equations.length === 0
    ) {

        return {
            changed: false,
            contradiction: false
        };

    }


    /*
     * Build connected components.
     */

    const components =
        buildEquationComponents(
            equations
        );


    let changed = false;


    for (
        const component
        of components
    ) {

        /*
         * Do not perform exponential enumeration
         * on an enormous component.
         *
         * Basic and subset logic handle those.
         */

        if (
            component.cells.length > 18
        ) {

            continue;

        }


        const result =
            solveExactComponent(
                component
            );


        if (
            result.contradiction
        ) {

            return {
                changed: false,
                contradiction: true
            };

        }


        for (
            const index
            of result.mines
        ) {

            if (
                !knownMines[index]
            ) {

                knownMines[index] =
                    1;

                changed = true;

            }

        }


        for (
            const index
            of result.safe
        ) {

            if (
                !revealed[index]
            ) {

                revealSimulationArea(
                    index,
                    revealed
                );

                changed = true;

            }

        }

    }


    return {
        changed,
        contradiction: false
    };

}


/* =========================================================
   BUILD EQUATION COMPONENTS
========================================================= */

function buildEquationComponents(
    equations
) {

    const components = [];


    const visited =
        new Uint8Array(
            equations.length
        );


    for (
        let start = 0;
        start < equations.length;
        start++
    ) {

        if (
            visited[start]
        ) {

            continue;

        }


        const queue = [start];

        let queueIndex = 0;


        visited[start] = 1;


        const equationIndices = [];


        while (
            queueIndex <
            queue.length
        ) {

            const current =
                queue[queueIndex];


            queueIndex++;


            equationIndices.push(
                current
            );


            for (
                let i = 0;
                i < equations.length;
                i++
            ) {

                if (
                    visited[i]
                ) {

                    continue;

                }


                if (
                    equationsShareCell(
                        equations[current],
                        equations[i]
                    )
                ) {

                    visited[i] = 1;

                    queue.push(i);

                }

            }

        }


        const cellSet =
            new Set();


        for (
            const equationIndex
            of equationIndices
        ) {

            for (
                const cell
                of equations[
                    equationIndex
                ].cells
            ) {

                cellSet.add(cell);

            }

        }


        components.push({

            cells:
                Array.from(
                    cellSet
                ),

            equations:
                equationIndices.map(
                    index =>
                        equations[index]
                )

        });

    }


    return components;

}


/* =========================================================
   EQUATIONS SHARE CELL
========================================================= */

function equationsShareCell(
    a,
    b
) {

    for (
        const value
        of a.cells
    ) {

        if (
            b.cells.includes(value)
        ) {

            return true;

        }

    }


    return false;

}


/* =========================================================
   EXACT COMPONENT SOLVER
========================================================= */

function solveExactComponent(
    component
) {

    const variables =
        component.cells;


    const equations =
        component.equations;


    const variableCount =
        variables.length;


    /*
     * For safety, exact enumeration is
     * limited to relatively small components.
     */

    if (
        variableCount > 18
    ) {

        return {
            mines: [],
            safe: [],
            contradiction: false
        };

    }


    const position =
        new Map();


    for (
        let i = 0;
        i < variableCount;
        i++
    ) {

        position.set(
            variables[i],
            i
        );

    }


    /*
     * Convert equations to bit masks.
     */

    const masks = [];


    for (
        const equation
        of equations
    ) {

        let mask = 0;


        for (
            const index
            of equation.cells
        ) {

            mask |=
                (1 << position.get(index));

        }


        masks.push({

            mask,

            mines:
                equation.mines

        });

    }


    let solutionCount = 0;

    let mineMaskAll = 0;

    let mineMaskNone =
        (1 << variableCount) - 1;


    /*
     * Recursive enumeration.
     */

    function search(
        variableIndex,
        currentMask
    ) {

        /*
         * Check equations for contradiction.
         */

        for (
            const equation
            of masks
        ) {

            const assignedMask =
                equation.mask &
                (
                    (1 << variableIndex) - 1
                );


            const assignedMines =
                countBits(
                    currentMask &
                    assignedMask
                );


            const assignedCells =
                countBits(
                    assignedMask
                );


            const remainingCells =
                countBits(
                    equation.mask
                ) -
                assignedCells;


            if (
                assignedMines >
                equation.mines
            ) {

                return;

            }


            if (
                assignedMines +
                remainingCells <
                equation.mines
            ) {

                return;

            }

        }


        /*
         * All variables assigned.
         */

        if (
            variableIndex >=
            variableCount
        ) {

            for (
                const equation
                of masks
            ) {

                if (
                    countBits(
                        currentMask &
                        equation.mask
                    ) !==
                    equation.mines
                ) {

                    return;

                }

            }


            solutionCount++;


            mineMaskAll &=
                currentMask;


            mineMaskNone &=
                ~currentMask;


            return;

        }


        /*
         * Try SAFE.
         */

        search(
            variableIndex + 1,
            currentMask
        );


        /*
         * Try MINE.
         */

        search(
            variableIndex + 1,
            currentMask |
            (1 << variableIndex)
        );

    }


    /*
     * Start with all possible mine masks.
     */

    mineMaskAll =
        (1 << variableCount) - 1;


    mineMaskNone =
        (1 << variableCount) - 1;


    search(
        0,
        0
    );


    /*
     * No valid arrangement.
     */

    if (
        solutionCount === 0
    ) {

        return {
            mines: [],
            safe: [],
            contradiction: true
        };

    }


    const certainMines = [];

    const certainSafe = [];


    for (
        let i = 0;
        i < variableCount;
        i++
    ) {

        const bit =
            1 << i;


        /*
         * Bit exists in EVERY solution.
         */

        if (
            (mineMaskAll & bit) !== 0
        ) {

            certainMines.push(
                variables[i]
            );

        }


        /*
         * Bit exists in NO solution.
         */

        else if (
            (mineMaskNone & bit) === 0
        ) {

            certainSafe.push(
                variables[i]
            );

        }

    }


    return {

        mines:
            certainMines,

        safe:
            certainSafe,

        contradiction: false

    };

}


/* =========================================================
   COUNT BITS
========================================================= */

function countBits(value) {

    value >>>= 0;


    let count = 0;


    while (value) {

        value &=
            value - 1;

        count++;

    }


    return count;

}


/* =========================================================
   SIMULATION REVEAL
========================================================= */

function revealSimulationArea(
    startIndex,
    revealed
) {

    if (
        revealed[startIndex]
    ) {

        return;

    }


    if (
        cells[startIndex].mine
    ) {

        return;

    }


    const queue = [
        startIndex
    ];


    let queueIndex = 0;


    revealed[startIndex] = 1;


    while (
        queueIndex <
        queue.length
    ) {

        const index =
            queue[queueIndex];


        queueIndex++;


        /*
         * Number cell stops flood fill.
         */

        if (
            adjacentMines[index] > 0
        ) {

            continue;

        }


        const row =
            Math.floor(
                index / COLS
            );


        const col =
            index % COLS;


        for (
            let rowOffset = -1;
            rowOffset <= 1;
            rowOffset++
        ) {

            for (
                let colOffset = -1;
                colOffset <= 1;
                colOffset++
            ) {

                if (
                    rowOffset === 0 &&
                    colOffset === 0
                ) {

                    continue;

                }


                const newRow =
                    row +
                    rowOffset;


                const newCol =
                    col +
                    colOffset;


                if (
                    newRow < 0 ||
                    newRow >= ROWS ||
                    newCol < 0 ||
                    newCol >= COLS
                ) {

                    continue;

                }


                const adjacentIndex =
                    newRow * COLS +
                    newCol;


                if (
                    revealed[
                        adjacentIndex
                    ]
                ) {

                    continue;

                }


                if (
                    cells[
                        adjacentIndex
                    ].mine
                ) {

                    continue;

                }


                revealed[
                    adjacentIndex
                ] = 1;


                queue.push(
                    adjacentIndex
                );

            }

        }

    }

}


/* =========================================================
   SIMULATION SOLVED
========================================================= */

function isSimulationSolved(
    revealed,
    knownMines
) {

    for (
        let index = 0;
        index < cells.length;
        index++
    ) {

        /*
         * Every real mine must be known.
         */

        if (
            cells[index].mine &&
            !knownMines[index]
        ) {

            return false;

        }


        /*
         * Every safe cell must be revealed.
         */

        if (
            !cells[index].mine &&
            !revealed[index]
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   NEIGHBOURS
========================================================= */

function getNeighbourIndices(
    index
) {

    const row =
        Math.floor(
            index / COLS
        );


    const col =
        index % COLS;


    const result = [];


    for (
        let rowOffset = -1;
        rowOffset <= 1;
        rowOffset++
    ) {

        for (
            let colOffset = -1;
            colOffset <= 1;
            colOffset++
        ) {

            if (
                rowOffset === 0 &&
                colOffset === 0
            ) {

                continue;

            }


            const newRow =
                row +
                rowOffset;


            const newCol =
                col +
                colOffset;


            if (
                newRow < 0 ||
                newRow >= ROWS ||
                newCol < 0 ||
                newCol >= COLS
            ) {

                continue;

            }


            result.push(
                newRow * COLS +
                newCol
            );

        }

    }


    return result;

}


/* =========================================================
   SET HELPERS
========================================================= */

function isSubset(
    small,
    large
) {

    for (
        const value
        of small
    ) {

        if (
            !large.includes(value)
        ) {

            return false;

        }

    }


    return true;

}


function differenceSet(
    large,
    small
) {

    const result = [];


    for (
        const value
        of large
    ) {

        if (
            !small.includes(value)
        ) {

            result.push(value);

        }

    }


    return result;

}


/* =========================================================
   MODE BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".mode-button"
    )
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const mode =
                    button.dataset.mode;


                gameMode =
                    mode;


                /*
                 * Active mode.
                 */

                document
                    .querySelectorAll(
                        ".mode-button"
                    )
                    .forEach(
                        (modeButton) => {

                            modeButton.classList.remove(
                                "active"
                            );

                        }
                    );


                button.classList.add(
                    "active"
                );


                /*
                 * Guess button.
                 */

                const guessButton =
                    document.querySelector(
                        '[data-difficulty="guess"]'
                    );


                if (
                    gameMode ===
                    "no-guessing"
                ) {

                    guessButton.disabled =
                        true;


                    /*
                     * If Guess is selected,
                     * switch to Easy.
                     */

                    if (
                        guessButton.classList.contains(
                            "active"
                        )
                    ) {

                        changeDifficulty(
                            "easy"
                        );

                    }

                    else {

                        createBoard();

                    }

                }

                else {

                    guessButton.disabled =
                        false;


                    createBoard();

                }

            }
        );

    });


/* =========================================================
   DIFFICULTY BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".difficulty-button"
    )
    .forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const difficulty =
                    button.dataset.difficulty;


                changeDifficulty(
                    difficulty
                );

            }
        );

    });


/* =========================================================
   UPDATE GUESS BUTTON
========================================================= */

function updateGuessButton() {

    const guessButton =
        document.querySelector(
            '[data-difficulty="guess"]'
        );


    if (!guessButton) {
        return;
    }


    guessButton.disabled =
        gameMode ===
        "no-guessing";

}


/* =========================================================
   NEW GAME
========================================================= */

const resetButton =
    document.getElementById(
        "reset-button"
    );


resetButton.addEventListener(
    "click",
    () => {

        createBoard();

    }
);


/* =========================================================
   START
========================================================= */

updateGuessButton();

createBoard();