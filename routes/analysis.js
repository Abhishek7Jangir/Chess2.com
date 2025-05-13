const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const { spawn } = require('child_process');
const { Chess } = require('chess.js');
const path = require('path');

//setting up body-parser middleware
router.use(bodyParser.urlencoded({extended: true, limit: '5mb' }));
router.use(bodyParser.json({limit: '5mb' }));

const stockfishPath = path.join(__dirname, '../engines/stockfish.exe');
let stockfishProcess;
let stockfish;

// Start Stockfish engine
function startStockfish() {
    if (stockfishProcess) return;
    stockfishProcess = spawn(stockfishPath);
    stockfish = stockfishProcess.stdin;

    stockfishProcess.stderr.on('data', data => {
        console.error(`Stockfish Error: ${data}`);
    });

    stockfishProcess.on('close', code => {
        console.log(`Stockfish exited with code ${code}`);
        stockfishProcess = null;
    });
}

// Send command to Stockfish
function sendCommand(command) {
    if (stockfish) {
        stockfish.write(command + '\n');
    } else {
        console.error("Stockfish not initialized");
    }
}

// Get engine best move from FEN
function getEngineMove(fen, depth = 15) {
    return new Promise((resolve, reject) => {
        if (!stockfishProcess) return reject("Stockfish not running");

        let response = '';
        const timeout = setTimeout(() => {
            stockfishProcess.stdout.removeListener("data", handler);
            reject("Stockfish timed out.");
        }, 5000);

        function handler(data) {
            response += data.toString();
            const match = response.match(/bestmove\s([a-h][1-8][a-h][1-8][qrbn]?)/);
            if (match) {
                clearTimeout(timeout);
                stockfishProcess.stdout.removeListener("data", handler);
                resolve(match[1]);
            }
        }

        stockfishProcess.stdout.on("data", handler);
        sendCommand(`position fen ${fen}`);
        sendCommand(`go depth ${depth}`);
    });
}

router.get('/', (req, res) => {
    res.render('indexAnalysis', { error: null }); // Not uploadPGN
});

router.post('/analyze', async (req, res) => {
    console.log("Received PGN:", req.body.pgn);
    const pgn = req.body.pgn;
    const chess = new Chess();

    try {
        if (!chess.load_pgn(pgn)) {
            throw new Error("Invalid PGN format");
        }

        const history = chess.history({ verbose: true });
        const analysis = [];

        startStockfish();

        chess.reset();
        for (let move of history) {
            const fen = chess.fen();
            chess.move(move);
            const userMove = move.from + move.to + (move.promotion || '');
            const bestMove = await getEngineMove(fen);
            analysis.push({ fen, move: userMove, bestMove });
        }

        res.render('analysis', { analysis });
    } catch (err) {
        console.error("Analysis error:", err);
        res.render('indexAnalysis', { error: err.message });
    }
});


module.exports = router;
