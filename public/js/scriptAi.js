const socket = io();
let chess;
let boardElement;
let draggedPiece = null;
let sourceSquare = null;

let playerRole = 'w';

document.getElementById('startGame').addEventListener('click', function () {
    const selectedDifficulty = document.getElementById('difficulty').value;
    socket.emit('startGame', selectedDifficulty);

    document.getElementById('chessArea').classList.remove('hidden');
    document.getElementById('startGame').parentElement.style.display = 'none';

    chess = new Chess();

    boardElement = document.querySelector(".chessboard");
    renderBoard();
});

const renderBoard = () => {
    if (!chess) return;

    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");

            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");

                pieceElement.classList.add(
                    "piece",
                    square.color === 'w' ? "white-piece" : "black-piece" // Ensure correct class is applied
                );
                pieceElement.innerText = getPieceUnicode(square);

                pieceElement.draggable = (
                    square.color === playerRole && 
                    chess.turn() === playerRole
                );

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null; // Fixed typo
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    // Dynamically apply the flipped class
    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q" // Always promote to queen
    };
    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        w: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
        b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" }
    };
    return unicodePieces[piece.color][piece.type] || "";
};

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

socket.on("invalidMove", () => {
    console.log("Invalid move! Try again!")
});

socket.on("gameOver", (data) => {
    const isWin = data.result === "win";
    showResultPopup(isWin ? "You win!" : "You lose!", isWin ? "green" : "red");
});

function showResultPopup(message, color) {
    const popup = document.createElement("div");

    popup.style = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: ${color};
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 24px;
        z-index: 9999;
    `;

    popup.innerText = message;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
        location.reload();
    }, 3000);
}