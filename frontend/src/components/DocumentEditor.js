// DocumentEditor.js
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "../App.css";

const socket = io("http://localhost:5000");

function DocumentEditor() {
  const [content, setContent] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [username, setUsername] = useState("");
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    socket.on("document", (newContent) => {
      setContent(newContent);
    });

    socket.on("typing", (username) => {
      setTypingUser(username);
    });

    socket.on("stop-typing", () => {
      setTypingUser(null);
    });

    socket.on("user-list", (users) => {
      setActiveUsers(users);
    });

    socket.on("user-message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("document");
      socket.off("typing");
      socket.off("stop-typing");
      socket.off("user-list");
      socket.off("user-message");
    };
  }, []);

  const handleChange = (event) => {
    setContent(event.target.value);
    socket.emit("document", event.target.value);

    if (event.target.value.length > 0 && username) {
      socket.emit("typing", username);

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      setTypingTimeout(
        setTimeout(() => {
          socket.emit("stop-typing", username);
        }, 700)
      );
    } else {
      socket.emit("stop-typing", username);
    }
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleUsernameSubmit = (event) => {
    if (event.key === "Enter" && username.trim() !== "") {
      setIsUsernameSet(true);
      socket.emit("set-username", username);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContent(e.target.result);
        socket.emit("document", e.target.result); // Emit the loaded content to other users
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="main-container">
      <div className="user-list-container">
        <h3>Active Users</h3>
        <ul>
          {activeUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
        {messages.length > 0 && (
          <div className="user-messages">
            {messages.map((message, index) => (
              <div key={index} className="message">
                {message}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="editor-container">
        {!isUsernameSet ? (
          <div className="username-input">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleUsernameSubmit}
            />
          </div>
        ) : (
          <>
            <input
              type="file"
              accept=".txt"
              onChange={handleFileUpload}
              className="file-upload"
            />
            <textarea
              className="editor"
              value={content}
              onChange={handleChange}
              placeholder="Start typing..."
            ></textarea>

            {typingUser && typingUser !== username && (
              <div className="typing-indicator">{typingUser} is editing...</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DocumentEditor;
