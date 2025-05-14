# ♟️ ChessMaster Web Application – README

---

## 🔹 Project Overview

**ChessMaster** is a full-stack web-based chess application that offers users a complete chess-playing experience. The platform supports multiple play modes including **human vs AI** and **multiplayer games**, along with **user account management**, **game analysis using PGN**, and a **personalized profile system**. The project emphasizes **simplicity, functionality, and future scalability**.

---

## 🔹 Release 1 Summary

### ✅ What Have We Done?

#### 🔐 User Authentication
- Signup and Login pages with session-based management.
- Email verification and basic password hashing.

#### ♟️ Play Against AI
- Player vs. AI chessboard using **Chess.js** and **Stockfish engine**.
- Evaluation bar and board rendering for a real-time experience.

#### 🧑‍🤝‍🧑 Multiplayer Game
- Real-time two-player chess via **WebSockets using Socket.IO**.
- Matchmaking system and rating updates after each game.

#### 👤 Profile Page
- Display of user information and uploaded profile photo.

#### ℹ️ About Page
- Static informative page about the application’s mission and features.

#### 📱 Responsive UI
- Sidebar navigation and color themes consistent across devices.

---

## 🔹 Release 2 Summary (Final)

### ✅ What Has Been Added?

#### 📊 Game Analysis Feature
- PGN upload page with move-by-move analysis using Stockfish.
- Graphical display of move quality (best move vs. played move).

#### 📜 Logging System
- Per-user activity logs (login, logout, game start) in JSON format.
- Professional log viewer page styled in EJS.

#### 🎓 Chess Tutorials Page
- Dedicated section for learning resources and chess basics.

#### 🏆 Leaderboard
- Rankings based on total wins with dynamic display of top users.

#### 📩 Contact Us Page
- Static form with message functionality (can be extended for backend).

#### 🔐 Security & Robustness Enhancements
- Session handling improvements.
- Error handling in PGN analysis and multiplayer stability fixes.

---

## 🔹 Future Scope

- 🧩 **Interactive Puzzle Mode**: Add a timed puzzle-solving feature to sharpen tactics.
- 📱 **Mobile Version**: Develop an Android/iOS app version of ChessMaster.
- 📖 **Opening Explorer**: Allow players to explore popular openings using PGN trees.
- 💡 **Advanced Analysis with Hints**: Show suggestions during training games with the AI.
- 🧑‍🤝‍🧑 **Community Forum**: Introduce a community space for players to post strategies, games, and challenges.

---

## 🔹 References

1. [**Chess.js GitHub Repository**](https://github.com/jhlywa/chess.js) – JavaScript chess library used for move validation and PGN handling.  
2. [**Express.js Documentation**](https://expressjs.com/) – Backend web framework used for building the server and middleware integration.  
3. [**Stockfish Chess Engine**](https://stockfishchess.org/) – Open-source chess engine used for game analysis and AI move generation.  
4. [**Node.js Official Website**](https://nodejs.org/) – Server-side JavaScript runtime used to build backend services.  
5. [**EJS Templating**](https://ejs.co/) – Templating engine used for rendering dynamic HTML pages.  
6. [**Socket.IO Documentation**](https://socket.io/) – Real-time bidirectional communication library used in multiplayer games.  
7. [**MDN Web Docs**](https://developer.mozilla.org/) – Reference for HTML, CSS, and JavaScript language features.  
8. [**MySQL Documentation**](https://dev.mysql.com/doc/) – Used for storing user data, match records, and other backend logic.  
