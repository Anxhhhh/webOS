const { io } = require("socket.io-client");
const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected with id:", socket.id);
  socket.emit("join_workspace", "global-room");
  console.log("Joined global-room");
});

socket.on("fs_changed", () => {
  console.log("Received fs_changed from server!");
});

socket.on("disconnect", () => {
  console.log("Disconnected");
});
