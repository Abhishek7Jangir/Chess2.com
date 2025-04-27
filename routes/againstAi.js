const { Chess } = require('chess.js'); // Chess logic
const express = require('express');    // Routing
const { spawn } = require('child_process'); // Run Stockfish
const path = require('path');          // Handle file paths

const router = express.Router();

// ✅ This will be called from app.js to handle all socket connections
function setupAgainstAi(io) {
    io.on('connection', (socket) => {
        console.log('User connected to AI mode:', socket.id);

        let chess;       // One chess game per connection
        let stockfish;   // Stockfish engine instance

        // ✅ Game starts when frontend sends difficulty
        socket.on('startGame', (difficulty) => {
            chess = new Chess(); // Start new game

            // Set Stockfish path (adjust this if needed)
            const stockfishPath = path.join(__dirname, '../engines/stockfish.exe');
            stockfish = spawn(stockfishPath);
            stockfish.stdout.setEncoding('utf8');

            // Set AI difficulty
            if (difficulty === 'easy') {
                stockfish.stdin.write('setoption name Skill Level value 1\n');
                socket.difficultyDepth = 6;
            } else if (difficulty === 'medium') {
                stockfish.stdin.write('setoption name Skill Level value 10\n');
                socket.difficultyDepth = 12;
            } else {
                stockfish.stdin.write('setoption name Skill Level value 20\n');
                socket.difficultyDepth = 18;
            }

            // ✅ Listen to Stockfish's thinking output
            stockfish.stdout.on('data', (data) => {
                const lines = data.split('\n');
                lines.forEach(line => {
                    if (line.startsWith('bestmove')) {
                        const bestMove = line.split(' ')[1]; // e.g. e2e4
                        if (bestMove && bestMove !== '(none)') {
                            const from = bestMove.substring(0, 2);
                            const to = bestMove.substring(2, 4);
                            chess.move({ from, to, promotion: 'q' });

                            socket.emit('move', { from, to });
                            socket.emit('boardState', chess.fen());

                            if (chess.isGameOver()) {
                                socket.emit('gameOver', { result: 'lose' });
                            }
                        }
                    }
                });
            });

            // Send initial board and role
            socket.emit('boardState', chess.fen());
            socket.emit('playerRole', 'w'); // Always white for user
        });

        // ✅ Handle move from frontend
        socket.on('move', (move) => {
            if (!chess || !stockfish) return;
            if (chess.turn() !== 'w') return;
        
            try {
                const result = chess.move(move);
        
                if (result) {
                    socket.emit('move', move);
                    socket.emit('boardState', chess.fen());
        
                    if (chess.isGameOver()) {
                        socket.emit('gameOver', { result: 'win' });
                        return;
                    }
        
                    stockfish.stdin.write(`position fen ${chess.fen()}\n`);
                    stockfish.stdin.write(`go depth ${socket.difficultyDepth}\n`);
                } else {
                    socket.emit('invalidMove', move);
                }
            } catch (error) {
                console.error('Invalid move error:', error.message);
                socket.emit('invalidMove', move);
            }
        });
        

        // ✅ On disconnect, kill Stockfish to save memory
        socket.on('disconnect', () => {
            if (stockfish) stockfish.kill();
        });
    });
}

// ✅ Route to render againstAi.ejs
router.get('/', (req, res) => {
    res.render('againstAi', { title: 'Play Against AI' });
});

// ✅ Export route and setup function
module.exports = {
    router,
    setupAgainstAi
};
