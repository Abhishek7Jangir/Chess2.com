# ♟️ ChessMaster — Full-Stack Real-Time Chess Platform

ChessMaster is a full-stack web application for playing chess online — real-time multiplayer with matchmaking and ELO-style ratings, a play-against-AI mode powered by the Stockfish engine, and post-game analysis with move-by-move evaluation.

Built with **Node.js, Express, Socket.IO, MySQL, and Redis**.

## Demo

![]([https://github.com](https://github.com/user-attachments/assets/92334a68-a267-4bed-8989-0d0680094f20))



[[Watch the Demo Video](chessRecordingWeb.mp4)](https://github.com/user-attachments/assets/92334a68-a267-4bed-8989-0d0680094f20)


## 📋 Features

**Real-Time Multiplayer**
- Two-player matchmaking queue with automatic room creation
- Live move sync and server-side move validation using `chess.js` — the server keeps its own authoritative game state, so a client can't send illegal or spoofed moves
- ELO-style rating system: rating changes scale based on current rating tier (bigger swings for newer/lower-rated players)

**Play Against AI**
- Integrates the **Stockfish** chess engine as a subprocess, communicating over the UCI (Universal Chess Interface) protocol
- Three difficulty levels (easy/medium/hard), mapped to Stockfish's skill level and search depth
- Same server-side validation and rating system as multiplayer

**Game Analysis**
- PGN upload with move-by-move evaluation via Stockfish
- Visual comparison of best move vs. played move

**Accounts & Security**
- Signup/login with `bcrypt` password hashing and session-based auth (`express-session`)
- Email OTP verification using Redis (short-lived, expiring keys) and Nodemailer
- Role-separated profile system with photo upload

**Other**
- Per-user activity logs (login, logout, game start)
- Leaderboard ranked by wins
- Chess tutorials page, responsive sidebar UI

## 🛠️ How It Works

**Multiplayer sync**: When two players connect, they're matched from a waiting queue into a game room. Each room holds its own `chess.js` instance as the source of truth. Every move a client sends is validated server-side before being broadcast — this prevents cheating and keeps both players' boards in sync even on unreliable connections.

**AI opponent**: On game start, the server spawns a Stockfish process and speaks UCI to it — sending the current board position (FEN notation) and a search depth, then parsing Stockfish's `bestmove` response back into a move. The process is killed on disconnect to avoid leaking resources.

**OTP verification**: Generated OTPs are stored in Redis with a 5-minute expiry (`EX 300`) rather than the main database — this keeps short-lived verification codes out of persistent storage and lets them expire automatically.

## 📁 File Structure

* **`app.js`**: Main server entry point — sets up Express, sessions, Socket.IO, Redis, and all routes.
* **`routes/multiPlayer.js`**: Matchmaking, real-time move sync, and rating updates for PvP games.
* **`routes/againstAi.js`**: Stockfish subprocess management and AI game logic.
* **`routes/analysis.js`**: PGN upload and move analysis.
* **`config/db.js`**: MySQL connection setup (via environment variables).
* **`views/`**: EJS templates for all pages.
* **`public/`**: Static assets — CSS, client-side JS, chess piece images.
* **`engines/`**: Stockfish binary (not included in repo — see Setup).

## ⚙️ Setup & Installation

**Prerequisites**: Node.js, a running MySQL instance, a running Redis instance, and the Stockfish engine binary for your OS.

1. **Clone the repo and install dependencies:**
    ```bash
    npm install
    ```

2. **Set up the Stockfish engine:**
    Download the Stockfish binary for your OS from [stockfishchess.org](https://stockfishchess.org/download/) and place it in the `engines/` folder. Update the path in `routes/againstAi.js` if your binary has a different filename.

3. **Create a `.env` file** in the project root with:
    ```
    DB_HOST=your_mysql_host
    DB_USER=your_mysql_user
    DB_PASS=your_mysql_password
    DB_NAME=your_database_name
    SESSION_SECRET=your_session_secret
    USER_EMAIL=your_gmail_address
    APP_PASSWORD=your_gmail_app_password
    ```

4. **Set up the MySQL database** with the required tables (`users`, `user_logs`, etc. — see `config/db.js` for connection details).

5. **Start Redis** locally or point to a hosted Redis instance.

6. **Run the app:**
    ```bash
    npm start
    ```
    The server runs on port 3000 by default.

## 🔮 Future Scope

- Interactive puzzle mode (timed tactics training)
- Opening explorer using PGN trees
- Mobile app version
- Community forum for strategy discussion

## References

- [Chess.js](https://github.com/jhlywa/chess.js) — move validation and PGN handling
- [Stockfish](https://stockfishchess.org/) — chess engine for AI and analysis
- [Socket.IO](https://socket.io/) — real-time multiplayer communication
