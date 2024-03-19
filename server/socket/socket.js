const { findMembersById } = require("../controllers/roomController.js");
const { findRoomsById } = require("../controllers/userController.js");
const db = require("../models");
const User = db.users;
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

const initWebSocket = (io) => {
  io.on("connection", (socket) => {
    const cookies = socket.request.headers.cookie;

    if (cookies) {
      const cookieTokenStr = cookies
        .split(";")
        .find((str) => str.startsWith("jwt="));
      if (cookieTokenStr) {
        const token = cookieTokenStr.split("=")[1];
        if (token) {
          jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) throw err;
            const { userId, username } = userData;
            socket.userId = userId;
            socket.username = username;
            console.log(`User: ${socket.username} >> connected.`);
          });
        }
      }
    }

    // Add users to all their (socket) rooms -> Broadcast to room members the updated online list
    socket.on("online", async () => {
      const user = await User.findByPk(socket.userId);
      if (user) {
        console.log(`User: ${socket.username} rooms:`, user.rooms);
        user.rooms.forEach((room) => {
          socket.join(room);
        });

        // Broadcast online user list to each room user is in (exclude default socket room)
        const rooms = Array.from(socket.rooms).splice(1);
        rooms.forEach((room) => {
          const sockets = io.sockets.adapter.rooms.get(room);
          const onlineMembers = Array.from(sockets).map((sockId) => {
            const sockRef = io.sockets.sockets.get(sockId);
            return { uid: sockRef.userId, username: sockRef.username };
          });

          io.to(room).emit("online", {
            roomId: room,
            onlineList: onlineMembers,
          });
        });
      }
    });

    // Broadcast online user list without user to the each room user was in
    socket.on("disconnecting", () => {
      console.log(`${socket.username} disconnected from`, socket.rooms);
      const rooms = Array.from(socket.rooms).splice(1);
      rooms.forEach((room) => {
        const sockets = io.sockets.adapter.rooms.get(room);
        const onlineMembers = [];
        Array.from(sockets).forEach((sockId) => {
          const sockRef = io.sockets.sockets.get(sockId);
          if (sockRef.userId !== socket.userId) {
            onlineMembers.push({
              uid: sockRef.userId,
              username: sockRef.username,
            });
          }
        });
        io.to(room).emit("online", { roomId: room, onlineList: onlineMembers });
      });
    });

    // Event: User joins room >> Send updated online and room member list to room clients
    socket.on("joinRoom", async (data) => {
      console.log("User joined room:", data);
      const roomId = data;
      const onlineMembers = [];
      socket.join(roomId);

      const sockets = io.sockets.adapter.rooms.get(roomId);
      Array.from(sockets).forEach((sockId) => {
        console.log(sockId);
        const sockRef = io.sockets.sockets.get(sockId);
        onlineMembers.push({ uid: sockRef.userId, username: sockRef.username });
      });

      const roomMembers = await findMembersById(roomId);

      io.to(roomId).emit("joinRoom", {
        roomId: roomId,
        roomMembers: roomMembers,
        connected: onlineMembers,
      });
    });

    // Receive message > Store message in db > broadcast received message to roomies
    socket.on("message", (data) => {
      socket.to(data.room).emit("message", data);
    });

    socket.on("leaveRoom", async (data) => {
      console.log("User left room:", data);
      const roomId = data;
      const onlineMembers = [];
      socket.leave(roomId);

      const sockets = io.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        Array.from(sockets).forEach((sockId) => {
          console.log(sockId);
          const sockRef = io.sockets.sockets.get(sockId);
          onlineMembers.push({
            uid: sockRef.userId,
            username: sockRef.username,
          });
        });
      }

      const roomMembers = await findMembersById(roomId);

      io.to(roomId).emit("leftRoom", {
        roomId: roomId,
        roomMembers: roomMembers,
        connected: onlineMembers,
      });
    });

    socket.on("deleteRoom", async (data) => {
      console.log("Owner deleted room:", data);
      const roomId = data;

      socket.leave(roomId);

      const userRooms = await findRoomsById(socket.userId);

      io.to(roomId).emit("deletedRoom", {
        roomId: roomId,
        userRooms: userRooms,
      });
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected.");
    });
  });
};

module.exports = {
  initWebSocket,
};