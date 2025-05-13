const { Chess } = require('chess.js'); // Chess logic
const express = require('express');    // Routing
const { spawn } = require('child_process'); // Run Stockfish
const path = require('path');          // Handle file paths
const connection = require('../config/db'); // Import the MySQL connection

const router = express.Router();

//  This will be called from app.js to handle all socket connections
function setupAgainstAi(io) {
    io.on('connection', (socket) => {
        console.log('User connected to AI mode:', socket.id);

        socket.on('registerUser', ({ userId }) => {
            socket.userId = userId;
            console.log('Socket registered with userId:', userId);
        });


        let chess;       // One chess game per connection
        let stockfish;   // Stockfish engine instance

        function calculateRatingChange(difficulty, isWin) {
            let change = 0;

            if (difficulty === 'hard') {
                change = 20;
            } else if (difficulty === 'medium') {
                change = 15;
            } else if (difficulty === 'easy') {
                change = 10;
            }

            return isWin ? change : -change; // Positive for win, negative for loss
        }

        // ✅ Game starts when frontend sends difficulty
        socket.on('startGame', (difficulty) => {
            chess = new Chess(); // Start new game
            socket.difficulty = difficulty; // Save for rating calculation


            // Set Stockfish path (adjust this if needed)
            const stockfishPath = path.join(__dirname, '../engines/stockfish.exe');
            stockfish = spawn(stockfishPath);
            stockfish.stdout.setEncoding('utf8');

            // Set AI difficulty
            if (difficulty === 'easy') {
                stockfish.stdin.write('setoption name Skill Level value 1\n');
                socket.difficultyDepth = 1;
            } else if (difficulty === 'medium') {
                stockfish.stdin.write('setoption name Skill Level value 10\n');
                socket.difficultyDepth = 6;
            } else {
                stockfish.stdin.write('setoption name Skill Level value 20\n');
                socket.difficultyDepth = 20;
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

                                // Update rating for loss
                                const ratingChange = calculateRatingChange(socket.difficulty, false);

                                connection.query(
                                    'UPDATE users SET rating = GREATEST(0, rating + ?) WHERE id = ?',
                                    [ratingChange, socket.userId],
                                    (err) => {
                                        if (err) console.error('Error updating rating after lose:', err);
                                        else console.log('Rating updated after lose');
                                    }
                                );

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

                        // Update rating for win
                        const ratingChange = calculateRatingChange(socket.difficulty, true);

                        connection.query(
                            'UPDATE users SET rating = rating + ? WHERE id = ?',
                            [ratingChange, socket.userId],
                            (err) => {
                                if (err) console.error('Error updating rating after win:', err);
                                else console.log('Rating updated after win');
                            }
                        );

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
    if (!req.session || !req.session.userId) {
        return res.redirect('/home');
    }

    res.render('againstAi', {
        title: 'Play Against AI',
        userId: req.session.userId  // ✅ Add this line
    });
});


// ✅ Export route and setup function
module.exports = {
    router,
    setupAgainstAi
};