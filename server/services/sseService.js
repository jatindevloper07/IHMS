// Server-Sent Events (SSE) Real-Time Pub/Sub Service
// Allows pushing instant clinical and operational updates to all connected browser clients

class SSEService {
  constructor() {
    this.clients = new Set();
    this.heartbeatInterval = null;
    this.startHeartbeat();
  }

  // Subscribe a new HTTP response stream as an SSE client
  subscribe(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on Nginx/reverse proxies
    res.flushHeaders?.();

    const client = {
      id: `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      ip: req.ip || req.socket.remoteAddress,
      res
    };

    this.clients.add(client);

    // Send initial welcome & connection ack event
    this.sendToClient(client, 'connected', {
      clientId: client.id,
      timestamp: new Date().toISOString(),
      activeClients: this.clients.size,
      message: 'IHMS Real-Time Event Bus connected successfully.'
    });

    req.on('close', () => {
      this.clients.delete(client);
    });

    req.on('error', () => {
      this.clients.delete(client);
    });

    return client;
  }

  // Send an event to a single client
  sendToClient(client, event, data) {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      this.clients.delete(client);
    }
  }

  // Broadcast an event with payload to all active clients
  broadcast(event, data) {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data
    };

    for (const client of this.clients) {
      try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  // Periodic heartbeat to prevent proxies/browsers from closing idle connections
  startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      for (const client of this.clients) {
        try {
          client.res.write(': keepalive\n\n');
        } catch (err) {
          this.clients.delete(client);
        }
      }
    }, 25000);
  }

  // Get current active connection statistics
  getClientCount() {
    return this.clients.size;
  }
}

const sseService = new SSEService();

module.exports = sseService;
