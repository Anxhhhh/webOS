import { io } from "socket.io-client";
const socket1 = io("http://localhost:5000");
const socket2 = io("http://localhost:5000");

socket1.on("connect", () => {
  socket1.emit("join_workspace", "global-room");
});

socket2.on("connect", () => {
  socket2.emit("join_workspace", "global-room");
});

socket2.onAny((eventName, ...args) => {
  console.log(`Socket 2 received: ${eventName}`);
});

setTimeout(() => {
  console.log("Socket 1 emitting fs_changed...");
  socket1.emit("fs_changed", { workspaceId: "global-room" });
}, 2000);

setTimeout(() => {
  process.exit(0);
}, 4000);
