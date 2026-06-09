const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Client joins a room channel to get only that room's data
    socket.on("join-room", (roomId) => {
      socket.join(`room-${roomId}`);
      console.log(`Client ${socket.id} joined room-${roomId}`);
      socket.emit("joined", { message: `Joined room-${roomId} channel` });
    });

    // Client leaves a room channel
    socket.on("leave-room", (roomId) => {
      socket.leave(`room-${roomId}`);
      console.log(`Client ${socket.id} left room-${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = setupSocket;