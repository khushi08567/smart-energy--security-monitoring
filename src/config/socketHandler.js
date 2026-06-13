const setupSocket = (io) => {
  // Track connected clients count
  let connectedClients = 0;

  io.on("connection", (socket) => {
    connectedClients++;
    console.log(`Client connected: ${socket.id} (total: ${connectedClients})`);

    // Send current connection count to all
    io.emit("clients-count", { count: connectedClients });

    // ── Room channel subscriptions ──────────────────────────
    socket.on("join-room", (roomId) => {
      socket.join(`room-${roomId}`);
      console.log(`Client ${socket.id} joined room-${roomId}`);
      socket.emit("joined", {
        message: `Subscribed to room-${roomId} live data`,
        room_id: roomId,
      });
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(`room-${roomId}`);
      console.log(`Client ${socket.id} left room-${roomId}`);
      socket.emit("left", { message: `Unsubscribed from room-${roomId}` });
    });

    // ── Subscribe to all security alerts ───────────────────
    socket.on("subscribe-alerts", () => {
      socket.join("alerts-channel");
      console.log(`Client ${socket.id} subscribed to security alerts`);
      socket.emit("subscribed-alerts", {
        message: "Now receiving all security alerts in real time",
      });
    });

    // ── Subscribe to energy alerts only ────────────────────
    socket.on("subscribe-energy", () => {
      socket.join("energy-channel");
      console.log(`Client ${socket.id} subscribed to energy alerts`);
      socket.emit("subscribed-energy", {
        message: "Now receiving energy alerts in real time",
      });
    });

    socket.on("disconnect", () => {
      connectedClients--;
      console.log(`Client disconnected: ${socket.id} (total: ${connectedClients})`);
      io.emit("clients-count", { count: connectedClients });
    });
  });

  // Helper methods attached to io for use in controllers
  io.emitSecurityAlert = (event) => {
    // Emit to all clients
    io.emit("security-alert", event);
    // Emit to alerts channel subscribers
    io.to("alerts-channel").emit("security-alert-detail", event);
    // Emit to specific room
    io.to(`room-${event.room_id}`).emit("room-security-alert", event);
  };

  io.emitEnergyAlert = (data) => {
    io.emit("energy-alert", data);
    io.to("energy-channel").emit("energy-alert-detail", data);
    io.to(`room-${data.room_id}`).emit("room-energy-alert", data);
  };
};

module.exports = setupSocket;