// server.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Collaborative Document Editor Backend");
});

// Store active users and document content
let activeUsers = {};
let documentContent = ""; // Store the current content of the document

io.on("connection", (socket) => {
  console.log("A user connected");

  // Send the current document content to the new user
  socket.emit("document", documentContent);

  // When a user joins, store their username and broadcast to all
  socket.on("set-username", (username) => {
    activeUsers[username] = socket.id; // Store the socket ID associated with the username
    io.emit("user-list", Object.keys(activeUsers)); // Send the active users list to all clients
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    for (let username in activeUsers) {
      if (activeUsers[username] === socket.id) {
        delete activeUsers[username]; // Remove the user from active users list
        io.emit("user-list", Object.keys(activeUsers)); // Send the updated active users list
        break;
      }
    }
  });

  // Handle document content updates
  socket.on("document", (newContent) => {
    documentContent = newContent; // Update the document content on the server
    socket.broadcast.emit("document", newContent);
  });

  // Handle typing event
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username); // Notify others that this user is typing
  });

  // Handle stop-typing event
  socket.on("stop-typing", (username) => {
    socket.broadcast.emit("stop-typing", username); // Notify others that this user stopped typing
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
