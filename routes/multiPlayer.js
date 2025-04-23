const { Chess } = require("chess.js");
const express = require('express');
const router = express.Router();

let playerQueue = [];
let gameRooms = {}; // ✅ Correct variable

function setupSocket(io) {
    io.on("connection", (socket) => {
        console.log('Player connected:', socket.id);

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
                        const winnerColor = chess.turn() === 'w' ? 'b' : 'w'; // If it's white's turn but no moves, black won (opposite)

                        const { white, black } = game.players;

                        if (winnerColor === 'w') {
                            io.to(white).emit('gameOver', { result: 'win' });
                            io.to(black).emit('gameOver', { result: 'lose' });
                        } else {
                            io.to(white).emit('gameOver', { result: 'lose' });
                            io.to(black).emit('gameOver', { result: 'win' });
                        }

                        delete gameRooms[roomId]; // Clean up room after game ends
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
    res.render('multiplayer', { title: 'Play Chess Multiplayer' });
});

module.exports = { router, setupSocket };
