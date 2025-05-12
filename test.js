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
                const { players } = gameRooms[roomId];
                if (players.white === socket.id || players.black === socket.id) {
                    io.to(roomId).emit('opponentDisconnected');
                    delete gameRooms[roomId];
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
                        const winnerColor = chess.turn() === 'w' ? 'b' : 'w'; // Game is over, so it's next player's turn, but that player can't move.

                        const { white, black } = game.players;
                        const winnerSocketId = winnerColor === 'w' ? white : black;
                        const loserSocketId = winnerColor === 'w' ? black : white;

                        const winnerUserId = io.sockets.sockets.get(winnerSocketId)?.userId;
                        const loserUserId = io.sockets.sockets.get(loserSocketId)?.userId;

                        if (!winnerUserId || !loserUserId) return;

                        // Get ratings from DB
                        connection.query(
                            'SELECT id, rating FROM users WHERE id IN (?, ?)',
                            [winnerUserId, loserUserId],
                            (err, results) => {
                                if (err) return console.error('Rating fetch error:', err);
                                if (results.length !== 2) return;

                                const winner = results.find(r => r.id === winnerUserId);
                                const loser = results.find(r => r.id === loserUserId);

                                const winnerRatingChange = calculateRatingChange(winner.rating, true);
                                const loserRatingChange = calculateRatingChange(loser.rating, false);

                                // Update ratings
                                connection.query(
                                    'UPDATE users SET rating = rating + ? WHERE id = ?',
                                    [winnerRatingChange, winnerUserId],
                                    (err) => {
                                        if (err) console.error('Error updating winner rating:', err);
                                        else console.log('Winner rating updated');
                                    }
                                );

                                connection.query(
                                    'UPDATE users SET rating = rating + ? WHERE id = ?',
                                    [loserRatingChange, loserUserId],
                                    (err) => {
                                        if (err) console.error('Error updating loser rating:', err);
                                        else console.log('Loser rating updated');
                                    }
                                );
                            }
                        );

                        io.to(winnerSocketId).emit('gameOver', { result: 'win' });
                        io.to(loserSocketId).emit('gameOver', { result: 'lose' });

                        delete gameRooms[roomId];
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