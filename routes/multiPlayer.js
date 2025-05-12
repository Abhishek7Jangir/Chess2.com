const { Chess } = require("chess.js");
const express = require('express');
const router = express.Router();

const connection = require('../config/db');

let playerQueue = [];
let gameRooms = {}; // ✅ Correct variable

function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log('Player connected:', socket.id);

        socket.on('registerUser', ({ userId }) => {
            socket.userId = userId;
            console.log('Socket registered with userId:', userId);
        });

        function calculateRatingChange(rating, isWin) {
            let change = 0;

            if (rating <= 1000) {
                change = 20;
            } else if (rating <= 1500) {
                change = 15;
            } else {
                change = 10;
            }

            return isWin ? change : -change; // Positive for win, negative for loss
        }

        if (playerQueue.length > 0) {
            let waitingPlayer = playerQueue.shift();
            let roomId = Math.random().toString(36).substring(2, 9);

            gameRooms[roomId] = { // ✅ Use gameRooms
                chess: new Chess(), // ✅ Fresh board per game
                players: {
                    white: waitingPlayer.id,
                    black: socket.id
                }
            };

            waitingPlayer.join(roomId);
            socket.join(roomId);

            io.to(waitingPlayer.id).emit("playerRole", { role: 'w', roomId });
            io.to(socket.id).emit("playerRole", { role: 'b', roomId });

            io.to(roomId).emit('startGame', roomId);
        } else {
            playerQueue.push(socket);
            socket.emit("waiting", "Waiting for an opponent...");
        }

        socket.on('disconnect', () => {
            playerQueue = playerQueue.filter(player => player.id !== socket.id);

            for (const roomId in gameRooms) {
                const game = gameRooms[roomId];
                const { players, chess } = game;

                const disconnectedId = socket.id;
                const opponentId = players.white === disconnectedId ? players.black : players.white;

                if (players.white === disconnectedId || players.black === disconnectedId) {
                    const whiteUserId = io.sockets.sockets.get(players.white)?.userId;
                    const blackUserId = io.sockets.sockets.get(players.black)?.userId;

                    if (!whiteUserId || !blackUserId) break;

                    const disconnectedUserId = players.white === disconnectedId ? whiteUserId : blackUserId;
                    const opponentUserId = players.white === disconnectedId ? blackUserId : whiteUserId;

                    connection.query(
                        'SELECT id, rating FROM users WHERE id IN (?, ?)',
                        [whiteUserId, blackUserId],
                        (err, results) => {
                            if (err) return console.error('Rating fetch error on disconnect:', err);
                            if (results.length !== 2) return;

                            const disconnectedPlayer = results.find(r => r.id === disconnectedUserId);
                            const opponentPlayer = results.find(r => r.id === opponentUserId);

                            const winChange = calculateRatingChange(opponentPlayer.rating, true);
                            const loseChange = calculateRatingChange(disconnectedPlayer.rating, false);

                            const queries = [
                                ['UPDATE users SET total_played = total_played + 1 WHERE id = ?', [opponentUserId]],
                                ['UPDATE users SET total_played = total_played + 1 WHERE id = ?', [disconnectedUserId]],
                                ['UPDATE users SET won = won + 1, rating = rating + ? WHERE id = ?', [winChange, opponentUserId]],
                                ['UPDATE users SET lost = lost + 1, rating = rating + ? WHERE id = ?', [loseChange, disconnectedUserId]]
                            ];

                            queries.forEach(([q, params]) => {
                                connection.query(q, params, (err) => {
                                    if (err) console.error('Stat update error on disconnect:', err);
                                });
                            });

                            io.to(opponentId).emit('gameOver', { result: 'win', reason: 'opponentDisconnected' });
                            io.to(disconnectedId).emit('gameOver', { result: 'lose', reason: 'disconnected' });

                            delete gameRooms[roomId];
                        }
                    );

                    break;
                }
            }


        });

        socket.on('move', ({ move, roomId }) => {
            const game = gameRooms[roomId];
            if (!game) return;

            const { chess } = game;

            try {
                if (chess.turn() === 'w' && socket.id !== game.players.white) return;
                if (chess.turn() === 'b' && socket.id !== game.players.black) return;

                const result = chess.move(move);
                if (result) {
                    io.to(roomId).emit('move', move);
                    //handling gameover
                    if (chess.isGameOver()) {
                        const winnerColor = chess.turn() === 'w' ? 'b' : 'w'; // last player who moved
                        const { white, black } = game.players;
                        const whiteUserId = io.sockets.sockets.get(white)?.userId;
                        const blackUserId = io.sockets.sockets.get(black)?.userId;

                        if (!whiteUserId || !blackUserId) return;

                        let winnerUserId = null;
                        let loserUserId = null;
                        let isDraw = false;

                        if (chess.isDraw()) {
                            isDraw = true;
                        } else {
                            winnerUserId = winnerColor === 'w' ? whiteUserId : blackUserId;
                            loserUserId = winnerColor === 'w' ? blackUserId : whiteUserId;
                        }

                        connection.query(
                            'SELECT id, rating FROM users WHERE id IN (?, ?)',
                            [whiteUserId, blackUserId],
                            (err, results) => {
                                if (err) return console.error('Rating fetch error:', err);
                                if (results.length !== 2) return;

                                const whitePlayer = results.find(r => r.id === whiteUserId);
                                const blackPlayer = results.find(r => r.id === blackUserId);

                                const queries = [];

                                // Always update total_played
                                queries.push(['UPDATE users SET total_played = total_played + 1 WHERE id = ?', [whiteUserId]]);
                                queries.push(['UPDATE users SET total_played = total_played + 1 WHERE id = ?', [blackUserId]]);

                                if (isDraw) {
                                    // Draw: update drawn count
                                    queries.push(['UPDATE users SET drawn = drawn + 1 WHERE id = ?', [whiteUserId]]);
                                    queries.push(['UPDATE users SET drawn = drawn + 1 WHERE id = ?', [blackUserId]]);
                                } else {
                                    const winner = results.find(r => r.id === winnerUserId);
                                    const loser = results.find(r => r.id === loserUserId);

                                    const winnerRatingChange = calculateRatingChange(winner.rating, true);
                                    const loserRatingChange = calculateRatingChange(loser.rating, false);

                                    queries.push(['UPDATE users SET won = won + 1, rating = rating + ? WHERE id = ?', [winnerRatingChange, winnerUserId]]);
                                    queries.push(['UPDATE users SET lost = lost + 1, rating = rating + ? WHERE id = ?', [loserRatingChange, loserUserId]]);
                                }

                                // Execute all queries
                                queries.forEach(([q, params]) => {
                                    connection.query(q, params, (err) => {
                                        if (err) console.error('Error updating stats:', err);
                                    });
                                });

                                if (isDraw) {
                                    io.to(roomId).emit('gameOver', { result: 'draw' });
                                } else {
                                    const winnerSocketId = winnerUserId === whiteUserId ? white : black;
                                    const loserSocketId = loserUserId === whiteUserId ? white : black;
                                    io.to(winnerSocketId).emit('gameOver', { result: 'win' });
                                    io.to(loserSocketId).emit('gameOver', { result: 'lose' });
                                }

                                delete gameRooms[roomId];
                            }
                        );
                    }


                    //handled gameover
                    io.to(roomId).emit('boardState', chess.fen());
                } else {
                    socket.emit('invalidMove', move);
                }
            } catch (err) {
                console.error('Move error:', err);
            }
        });
    });
}

router.get('/', (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.redirect('/home');
    }
    res.render('multiplayer', {
        title: 'Play Chess Multiplayer',
        userId: req.session.userId
    });
});

module.exports = { router, setupSocket };