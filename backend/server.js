import express from 'express';
import cors from 'cors';
import net from 'net';
import dgram from 'dgram';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';
import mqtt from 'mqtt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---- Connection Pool for Persistent Connections ----
const connectionPool = new Map(); // sessionId -> { socket, events, config, lastActivity, sseClients }
const mqttConnectionPool = new Map(); // sessionId -> { client, events, messages, config, lastActivity, subscriptions }

// SSE helper to send event to all connected clients for a session
function broadcastToSSE(sessionId, event) {
  const conn = connectionPool.get(sessionId);
  if (conn && conn.sseClients) {
    conn.sseClients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (e) {
        // Client disconnected, will be cleaned up
      }
    });
  }
}

function cleanupOldConnections() {
  const now = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  // Cleanup TCP connections
  for (const [sessionId, conn] of connectionPool.entries()) {
    if (now - conn.lastActivity > timeout) {
      console.log(`Cleaning up stale TCP connection: ${sessionId}`);
      try { conn.socket.destroy(); } catch {}
      connectionPool.delete(sessionId);
    }
  }

  // Cleanup MQTT connections
  for (const [sessionId, conn] of mqttConnectionPool.entries()) {
    if (now - conn.lastActivity > timeout) {
      console.log(`Cleaning up stale MQTT connection: ${sessionId}`);
      try { conn.client.end(true); } catch {}
      mqttConnectionPool.delete(sessionId);
    }
  }

  // Cleanup TCP Bridge servers
  const bridgeTimeout = 60 * 60 * 1000; // 1 hour timeout for bridges
  for (const [bridgeId, bridge] of bridgeServers.entries()) {
    if (now - bridge.lastActivity > bridgeTimeout) {
      console.log(`Cleaning up stale TCP bridge: ${bridgeId}`);
      try {
        bridge.clients.forEach((client) => {
          try { client.socket.destroy(); } catch {}
          try { client.primaryConnection.destroy(); } catch {}
          client.secondaryConnections.forEach(conn => {
            try { conn.destroy(); } catch {}
          });
        });
        bridge.server.close();
      } catch {}
      bridgeServers.delete(bridgeId);
    }
  }
}

// Cleanup stale connections every minute
setInterval(cleanupOldConnections, 60000);

// ---- /api/tcp: open one TCP connection, send all packets in sequence ----
app.post('/api/tcp', async (req, res) => {
  const { ip, port, data_list = [], data_format = 'hex', receive_response = true, timeout = 2 } = req.body || {};
  if (!ip || !port || !Array.isArray(data_list) || data_list.length === 0) {
    return res.status(400).json({ error: 'ip, port, and non-empty data_list are required' });
  }

  const sock = new net.Socket();
  const results = [];
  const events = [];
  let pendingResolve;
  let timer;
  let currentPacketIndex = -1;
  let connectionError = null;
  let isResponseHandled = false;
  let isConnected = false;
  let responseSent = false;

  function addEvent(type, message, data = null) {
    events.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    });
  }

  function waitData() {
    isResponseHandled = false;
    return new Promise((resolve) => {
      pendingResolve = resolve;
      timer = setTimeout(() => {
        if (pendingResolve && !isResponseHandled) {
          addEvent('timeout', `Timeout waiting for response to packet #${currentPacketIndex + 1}`);
          isResponseHandled = true;
          pendingResolve();
          pendingResolve = undefined;
        }
      }, Number(timeout) * 1000);
    });
  }

  sock.on('data', (chunk) => {
    const hex = chunk.toString('hex');
    const ascii = chunk.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

    addEvent('data', `Received ${chunk.length} bytes`, { hex, ascii, length: chunk.length });

    // Associate response with the current packet being processed
    if (currentPacketIndex >= 0) {
      if (!results[currentPacketIndex].responses) {
        results[currentPacketIndex].responses = [];
      }
      results[currentPacketIndex].responses.push({ hex, ascii, length: chunk.length });
    }

    if (pendingResolve && !isResponseHandled) {
      const r = pendingResolve;
      pendingResolve = undefined;
      isResponseHandled = true;
      clearTimeout(timer);
      r();
    }
  });

  sock.on('error', (err) => {
    connectionError = String(err.message || err);
    addEvent('error', connectionError);
    try { sock.destroy(); } catch {}

    // If error happens before connection or after, send response if not already sent
    if (!responseSent) {
      responseSent = true;
      res.status(500).json({
        error: connectionError,
        events,
        results,
        ok: false
      });
    }
  });

  sock.on('close', (hadError) => {
    addEvent('close', `Connection closed${hadError ? ' with error' : ' normally'}`);
  });

  sock.on('timeout', () => {
    addEvent('timeout', 'Socket timeout');
    try { sock.destroy(); } catch {}
  });

  sock.connect(Number(port), String(ip), async () => {
    isConnected = true;
    addEvent('connect', `Connected to ${ip}:${port}`);

    try {
      for (let i = 0; i < data_list.length; i++) {
        currentPacketIndex = i;
        const pkt = data_list[i];

        let buf;
        try {
          if (data_format === 'ascii') {
            buf = Buffer.from(pkt, 'ascii');
          } else {
            // Remove all whitespace from hex string before parsing
            const cleanHex = pkt.replace(/\s+/g, '');
            buf = Buffer.from(cleanHex, 'hex');
          }
        } catch (parseErr) {
          const error = `Failed to parse packet #${i + 1} as ${data_format}: ${parseErr.message}`;
          addEvent('error', error);
          results.push({
            packetIndex: i,
            sent: pkt,
            error,
            responses: []
          });
          continue;
        }

        const sentHex = buf.toString('hex');
        const sentAscii = buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

        results.push({
          packetIndex: i,
          sent: pkt,
          sentHex,
          sentAscii,
          length: buf.length,
          responses: []
        });

        addEvent('send', `Sent packet #${i + 1} (${buf.length} bytes)`, { hex: sentHex, ascii: sentAscii });

        sock.write(buf);

        if (receive_response) {
          await waitData();
        }
      }

      addEvent('complete', `Finished sending ${data_list.length} packet(s)`);
    } catch (err) {
      addEvent('error', `Error during transmission: ${err.message}`);
    } finally {
      try {
        sock.end();
      } catch {}
    }

    if (!responseSent) {
      responseSent = true;
      res.json({
        ok: !connectionError,
        results,
        events,
        summary: {
          totalPacketsSent: results.filter(r => !r.error).length,
          totalPacketsFailed: results.filter(r => r.error).length,
          totalResponsesReceived: results.reduce((sum, r) => sum + (r.responses?.length || 0), 0)
        }
      });
    }
  });
});

// ---- /api/tcp/connect: Open and maintain a persistent TCP connection ----
app.post('/api/tcp/connect', async (req, res) => {
  const { ip, port, keepAlive = true } = req.body || {};
  if (!ip || !port) {
    return res.status(400).json({ error: 'ip and port are required' });
  }

  const sessionId = crypto.randomBytes(16).toString('hex');
  const sock = new net.Socket();
  const events = [];
  const responses = [];
  let connectionError = null;
  let responseSent = false;

  function addEvent(type, message, data = null) {
    events.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    });
  }

  // Listen for incoming data continuously
  sock.on('data', (chunk) => {
    const hex = chunk.toString('hex');
    const ascii = chunk.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

    const dataEvent = {
      timestamp: new Date().toISOString(),
      hex,
      ascii,
      length: chunk.length
    };

    addEvent('data', `Received ${chunk.length} bytes`, { hex, ascii, length: chunk.length });
    responses.push(dataEvent);

    // Broadcast to SSE clients in real-time
    broadcastToSSE(sessionId, {
      type: 'data',
      data: dataEvent
    });
  });

  sock.on('error', (err) => {
    connectionError = String(err.message || err);
    addEvent('error', connectionError);
    try { sock.destroy(); } catch {}
    connectionPool.delete(sessionId);
  });

  sock.on('close', (hadError) => {
    addEvent('close', `Connection closed${hadError ? ' with error' : ' normally'}`);
    connectionPool.delete(sessionId);
  });

  sock.on('timeout', () => {
    addEvent('timeout', 'Socket timeout');
  });

  if (keepAlive) {
    sock.setKeepAlive(true, 60000); // Keep alive with 60s interval
  }

  sock.connect(Number(port), String(ip), () => {
    addEvent('connect', `Connected to ${ip}:${port}`);

    // Store connection in pool
    connectionPool.set(sessionId, {
      socket: sock,
      events,
      responses,
      config: { ip, port },
      lastActivity: Date.now(),
      sseClients: [] // Array of SSE response objects
    });

    if (!responseSent) {
      responseSent = true;
      res.json({
        ok: true,
        sessionId,
        message: `Connection established to ${ip}:${port}`,
        events
      });
    }
  });

  // Handle connection timeout
  setTimeout(() => {
    if (!connectionPool.has(sessionId) && !responseSent) {
      responseSent = true;
      sock.destroy();
      if (!connectionError) {
        res.status(500).json({
          error: 'Connection timeout',
          events
        });
      }
    }
  }, 10000); // 10 second connection timeout
});

// ---- /api/tcp/send: Send packet on existing connection ----
app.post('/api/tcp/send', async (req, res) => {
  const { sessionId, data, data_format = 'hex', receive_response = true, timeout = 2 } = req.body || {};

  if (!sessionId || !data) {
    return res.status(400).json({ error: 'sessionId and data are required' });
  }

  const conn = connectionPool.get(sessionId);
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found. It may have timed out or been closed.' });
  }

  conn.lastActivity = Date.now();

  function addEvent(type, message, data = null) {
    conn.events.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    });
  }

  try {
    // Parse and send data
    let buf;
    try {
      if (data_format === 'ascii') {
        buf = Buffer.from(data, 'ascii');
      } else {
        // Remove all whitespace from hex string before parsing
        const cleanHex = data.replace(/\s+/g, '');
        buf = Buffer.from(cleanHex, 'hex');
      }
    } catch (parseErr) {
      return res.status(400).json({ error: `Failed to parse data as ${data_format}: ${parseErr.message}` });
    }

    const sentHex = buf.toString('hex');
    const sentAscii = buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

    // Track responses before sending
    const responsesBefore = conn.responses.length;

    addEvent('send', `Sent ${buf.length} bytes`, { hex: sentHex, ascii: sentAscii });
    conn.socket.write(buf);

    let newResponses = [];

    if (receive_response) {
      // Wait for response
      await new Promise((resolve) => {
        const startTime = Date.now();
        const checkInterval = setInterval(() => {
          if (conn.responses.length > responsesBefore) {
            clearInterval(checkInterval);
            newResponses = conn.responses.slice(responsesBefore);
            resolve();
          } else if (Date.now() - startTime > timeout * 1000) {
            clearInterval(checkInterval);
            addEvent('timeout', `No response received within ${timeout}s`);
            resolve();
          }
        }, 50);
      });
    }

    res.json({
      ok: true,
      sent: {
        hex: sentHex,
        ascii: sentAscii,
        length: buf.length
      },
      responses: newResponses,
      events: conn.events.slice(-10), // Last 10 events
      totalResponses: conn.responses.length
    });

  } catch (err) {
    addEvent('error', `Send error: ${err.message}`);
    res.status(500).json({ error: String(err.message || err), events: conn.events.slice(-10) });
  }
});

// ---- /api/tcp/stream: SSE endpoint for real-time TCP data ----
app.get('/api/tcp/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = connectionPool.get(sessionId);

  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Add this client to the SSE clients list
  conn.sseClients.push(res);
  conn.lastActivity = Date.now();

  // Remove client when connection closes
  req.on('close', () => {
    const index = conn.sseClients.indexOf(res);
    if (index > -1) {
      conn.sseClients.splice(index, 1);
    }
  });

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 15000); // Every 15 seconds

  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// ---- /api/tcp/status: Check connection status and get recent data ----
app.get('/api/tcp/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = connectionPool.get(sessionId);

  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  conn.lastActivity = Date.now();

  res.json({
    ok: true,
    sessionId,
    connected: !conn.socket.destroyed,
    config: conn.config,
    events: conn.events.slice(-20), // Last 20 events
    responses: conn.responses.slice(-10), // Last 10 responses
    totalResponses: conn.responses.length,
    lastActivity: conn.lastActivity
  });
});

// ---- /api/tcp/disconnect: Close persistent connection ----
app.post('/api/tcp/disconnect', (req, res) => {
  const { sessionId } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const conn = connectionPool.get(sessionId);
  if (!conn) {
    return res.status(404).json({ error: 'Connection not found' });
  }

  try {
    conn.socket.end();
    setTimeout(() => {
      if (!conn.socket.destroyed) {
        conn.socket.destroy();
      }
    }, 1000);
  } catch (err) {
    conn.socket.destroy();
  }

  connectionPool.delete(sessionId);

  res.json({
    ok: true,
    message: 'Connection closed',
    events: conn.events,
    totalResponses: conn.responses.length
  });
});

// ---- /api/udp: Send UDP datagrams ----
app.post('/api/udp', async (req, res) => {
  const { ip, port, data_list = [], data_format = 'hex', receive_response = true, timeout = 2 } = req.body || {};

  if (!ip || !port || !Array.isArray(data_list) || data_list.length === 0) {
    return res.status(400).json({ error: 'ip, port, and non-empty data_list are required' });
  }

  const results = [];
  const events = [];
  let responseReceived = false;

  function addEvent(type, message, data = null) {
    events.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    });
  }

  try {
    const socket = dgram.createSocket('udp4');

    // Set up response listener if needed
    if (receive_response) {
      socket.on('message', (msg, rinfo) => {
        const hex = msg.toString('hex');
        const ascii = msg.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

        addEvent('data', `Received ${msg.length} bytes from ${rinfo.address}:${rinfo.port}`, {
          hex,
          ascii,
          length: msg.length,
          from: `${rinfo.address}:${rinfo.port}`
        });

        // Add to the last sent packet's responses
        if (results.length > 0) {
          const lastResult = results[results.length - 1];
          if (!lastResult.responses) {
            lastResult.responses = [];
          }
          lastResult.responses.push({ hex, ascii, length: msg.length, from: `${rinfo.address}:${rinfo.port}` });
        }

        responseReceived = true;
      });

      socket.on('error', (err) => {
        addEvent('error', `Socket error: ${err.message}`);
      });
    }

    // Send all packets
    for (let i = 0; i < data_list.length; i++) {
      const pkt = data_list[i];
      responseReceived = false;

      let buf;
      try {
        if (data_format === 'ascii') {
          buf = Buffer.from(pkt, 'ascii');
        } else {
          // Remove all whitespace from hex string before parsing
          const cleanHex = pkt.replace(/\s+/g, '');
          buf = Buffer.from(cleanHex, 'hex');
        }
      } catch (parseErr) {
        const error = `Failed to parse packet #${i + 1} as ${data_format}: ${parseErr.message}`;
        addEvent('error', error);
        results.push({
          packetIndex: i,
          sent: pkt,
          error,
          responses: []
        });
        continue;
      }

      const sentHex = buf.toString('hex');
      const sentAscii = buf.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

      // Send UDP packet
      await new Promise((resolve, reject) => {
        socket.send(buf, 0, buf.length, Number(port), String(ip), (err) => {
          if (err) {
            addEvent('error', `Failed to send packet #${i + 1}: ${err.message}`);
            results.push({
              packetIndex: i,
              sent: pkt,
              error: err.message,
              responses: []
            });
            reject(err);
          } else {
            addEvent('send', `Sent packet #${i + 1} (${buf.length} bytes) to ${ip}:${port}`, { hex: sentHex, ascii: sentAscii });

            results.push({
              packetIndex: i,
              sent: pkt,
              sentHex,
              sentAscii,
              length: buf.length,
              responses: []
            });

            resolve();
          }
        });
      });

      // Wait for response if enabled
      if (receive_response) {
        await new Promise((resolve) => {
          const startTime = Date.now();
          const checkInterval = setInterval(() => {
            if (responseReceived || Date.now() - startTime > timeout * 1000) {
              clearInterval(checkInterval);
              if (!responseReceived) {
                addEvent('timeout', `No response received for packet #${i + 1} within ${timeout}s`);
              }
              resolve();
            }
          }, 50);
        });
      }
    }

    // Close socket
    socket.close();

    addEvent('complete', `Finished sending ${data_list.length} packet(s)`);

    res.json({
      ok: true,
      results,
      events,
      summary: {
        totalPacketsSent: results.filter(r => !r.error).length,
        totalPacketsFailed: results.filter(r => r.error).length,
        totalResponsesReceived: results.reduce((sum, r) => sum + (r.responses?.length || 0), 0)
      }
    });

  } catch (e) {
    addEvent('error', `UDP error: ${e.message}`);
    res.status(500).json({
      error: String(e.message || e),
      events,
      results,
      ok: false
    });
  }
});

// ---- /api/mqtt/connect: Connect to MQTT broker ----
app.post('/api/mqtt/connect', async (req, res) => {
  const { broker, port = 1883, clientId, username, password, useTLS = false } = req.body || {};

  if (!broker) {
    return res.status(400).json({ error: 'broker is required' });
  }

  const sessionId = crypto.randomBytes(16).toString('hex');
  const events = [];
  const messages = [];
  const subscriptions = new Set();

  function addEvent(type, message, data = null) {
    events.push({
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    });
  }

  try {
    const protocol = useTLS ? 'mqtts' : 'mqtt';
    const brokerUrl = `${protocol}://${broker}:${port}`;

    const options = {
      clientId: clientId || `traqcare_${sessionId.substring(0, 8)}`,
      clean: true,
      connectTimeout: 10000,
      reconnectPeriod: 0 // Disable auto-reconnect
    };

    if (username) {
      options.username = username;
      if (password) {
        options.password = password;
      }
    }

    addEvent('connecting', `Connecting to ${brokerUrl}...`);

    const client = mqtt.connect(brokerUrl, options);

    // Set up event handlers
    client.on('connect', () => {
      addEvent('connect', `Connected to ${brokerUrl}`, { clientId: options.clientId });

      mqttConnectionPool.set(sessionId, {
        client,
        events,
        messages,
        subscriptions,
        config: { broker, port, clientId: options.clientId, useTLS },
        lastActivity: Date.now()
      });

      res.json({
        ok: true,
        sessionId,
        clientId: options.clientId,
        message: `Connected to ${brokerUrl}`,
        events
      });
    });

    client.on('error', (err) => {
      addEvent('error', err.message);

      if (!res.headersSent) {
        res.status(500).json({
          error: err.message,
          events
        });
      }

      try { client.end(true); } catch {}
      mqttConnectionPool.delete(sessionId);
    });

    client.on('message', (topic, payload) => {
      const messageData = {
        timestamp: new Date().toISOString(),
        topic,
        payload: payload.toString(),
        payloadHex: payload.toString('hex'),
        length: payload.length
      };

      messages.push(messageData);
      addEvent('message', `Received message on topic: ${topic}`, messageData);
    });

    client.on('close', () => {
      addEvent('close', 'Connection closed');
      mqttConnectionPool.delete(sessionId);
    });

    // Connection timeout
    setTimeout(() => {
      if (!mqttConnectionPool.has(sessionId) && !res.headersSent) {
        addEvent('timeout', 'Connection timeout');
        res.status(500).json({
          error: 'Connection timeout',
          events
        });
        try { client.end(true); } catch {}
      }
    }, 10000);

  } catch (err) {
    addEvent('error', err.message);
    res.status(500).json({
      error: err.message,
      events
    });
  }
});

// ---- /api/mqtt/publish: Publish message to MQTT topic ----
app.post('/api/mqtt/publish', async (req, res) => {
  const { sessionId, topic, message, qos = 0, retain = false } = req.body || {};

  if (!sessionId || !topic || message === undefined) {
    return res.status(400).json({ error: 'sessionId, topic, and message are required' });
  }

  const conn = mqttConnectionPool.get(sessionId);
  if (!conn) {
    return res.status(404).json({ error: 'MQTT connection not found. It may have timed out or been closed.' });
  }

  conn.lastActivity = Date.now();

  function addEvent(type, msg, data = null) {
    conn.events.push({
      timestamp: new Date().toISOString(),
      type,
      message: msg,
      ...(data && { data })
    });
  }

  try {
    await new Promise((resolve, reject) => {
      conn.client.publish(topic, message, { qos, retain }, (err) => {
        if (err) {
          addEvent('error', `Failed to publish: ${err.message}`);
          reject(err);
        } else {
          addEvent('publish', `Published to topic: ${topic}`, {
            topic,
            message,
            qos,
            retain,
            length: Buffer.from(message).length
          });
          resolve();
        }
      });
    });

    res.json({
      ok: true,
      topic,
      message,
      qos,
      retain,
      events: conn.events.slice(-10)
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
      events: conn.events.slice(-10)
    });
  }
});

// ---- /api/mqtt/subscribe: Subscribe to MQTT topic ----
app.post('/api/mqtt/subscribe', async (req, res) => {
  const { sessionId, topic, qos = 0 } = req.body || {};

  if (!sessionId || !topic) {
    return res.status(400).json({ error: 'sessionId and topic are required' });
  }

  const conn = mqttConnectionPool.get(sessionId);
  if (!conn) {
    return res.status(404).json({ error: 'MQTT connection not found. It may have timed out or been closed.' });
  }

  conn.lastActivity = Date.now();

  function addEvent(type, msg, data = null) {
    conn.events.push({
      timestamp: new Date().toISOString(),
      type,
      message: msg,
      ...(data && { data })
    });
  }

  try {
    await new Promise((resolve, reject) => {
      conn.client.subscribe(topic, { qos }, (err, granted) => {
        if (err) {
          addEvent('error', `Failed to subscribe: ${err.message}`);
          reject(err);
        } else {
          conn.subscriptions.add(topic);
          addEvent('subscribe', `Subscribed to topic: ${topic}`, { topic, qos, granted });
          resolve(granted);
        }
      });
    });

    res.json({
      ok: true,
      topic,
      qos,
      subscriptions: Array.from(conn.subscriptions),
      events: conn.events.slice(-10)
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
      events: conn.events.slice(-10)
    });
  }
});

// ---- /api/mqtt/unsubscribe: Unsubscribe from MQTT topic ----
app.post('/api/mqtt/unsubscribe', async (req, res) => {
  const { sessionId, topic } = req.body || {};

  if (!sessionId || !topic) {
    return res.status(400).json({ error: 'sessionId and topic are required' });
  }

  const conn = mqttConnectionPool.get(sessionId);
  if (!conn) {
    return res.status(404).json({ error: 'MQTT connection not found. It may have timed out or been closed.' });
  }

  conn.lastActivity = Date.now();

  function addEvent(type, msg, data = null) {
    conn.events.push({
      timestamp: new Date().toISOString(),
      type,
      message: msg,
      ...(data && { data })
    });
  }

  try {
    await new Promise((resolve, reject) => {
      conn.client.unsubscribe(topic, (err) => {
        if (err) {
          addEvent('error', `Failed to unsubscribe: ${err.message}`);
          reject(err);
        } else {
          conn.subscriptions.delete(topic);
          addEvent('unsubscribe', `Unsubscribed from topic: ${topic}`, { topic });
          resolve();
        }
      });
    });

    res.json({
      ok: true,
      topic,
      subscriptions: Array.from(conn.subscriptions),
      events: conn.events.slice(-10)
    });

  } catch (err) {
    res.status(500).json({
      error: err.message,
      events: conn.events.slice(-10)
    });
  }
});

// ---- /api/mqtt/status: Get MQTT connection status and messages ----
app.get('/api/mqtt/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const conn = mqttConnectionPool.get(sessionId);

  if (!conn) {
    return res.status(404).json({ error: 'MQTT connection not found' });
  }

  conn.lastActivity = Date.now();

  res.json({
    ok: true,
    sessionId,
    connected: conn.client.connected,
    config: conn.config,
    subscriptions: Array.from(conn.subscriptions),
    events: conn.events.slice(-20),
    messages: conn.messages.slice(-20),
    totalMessages: conn.messages.length,
    lastActivity: conn.lastActivity
  });
});

// ---- /api/mqtt/disconnect: Disconnect from MQTT broker ----
app.post('/api/mqtt/disconnect', (req, res) => {
  const { sessionId } = req.body || {};

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const conn = mqttConnectionPool.get(sessionId);
  if (!conn) {
    return res.status(404).json({ error: 'MQTT connection not found' });
  }

  function addEvent(type, msg, data = null) {
    conn.events.push({
      timestamp: new Date().toISOString(),
      type,
      message: msg,
      ...(data && { data })
    });
  }

  try {
    addEvent('disconnecting', 'Disconnecting from broker...');
    conn.client.end(false, {}, () => {
      addEvent('disconnect', 'Disconnected from broker');
    });

    mqttConnectionPool.delete(sessionId);

    res.json({
      ok: true,
      message: 'Disconnected from MQTT broker',
      events: conn.events,
      totalMessages: conn.messages.length
    });

  } catch (err) {
    addEvent('error', `Disconnect error: ${err.message}`);
    try { conn.client.end(true); } catch {}
    mqttConnectionPool.delete(sessionId);

    res.status(500).json({
      error: err.message,
      events: conn.events
    });
  }
});

// ---- /api/http-request: Proxy HTTP requests to external APIs ----
app.post('/api/http-request', async (req, res) => {
  try {
    const {
      method = 'GET',
      url,
      headers = {},
      body = null,
      timeout = 10000
    } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const requestStartTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method: method.toUpperCase(),
        headers: headers,
        signal: controller.signal
      };

      // Add body for methods that support it
      if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      const requestDuration = Date.now() - requestStartTime;
      const responseText = await response.text();

      // Try to parse as JSON, otherwise return as text
      let responseData;
      let contentType = 'text';
      try {
        responseData = JSON.parse(responseText);
        contentType = 'json';
      } catch {
        responseData = responseText;
      }

      res.json({
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        contentType,
        duration: requestDuration,
        url: response.url
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        return res.status(408).json({
          error: `Request timeout after ${timeout}ms`,
          duration: Date.now() - requestStartTime
        });
      }

      return res.status(500).json({
        error: String(fetchError.message || fetchError),
        duration: Date.now() - requestStartTime
      });
    }

  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ---- /api/fcm: send HTTP v1 message using Service Account (server-side secrets) ----
app.post('/api/fcm', async (req, res) => {
  try {
    const { projectId, token, notification, apns, data, serviceAccount } = req.body || {};
    if (!projectId || !token) return res.status(400).json({ error: 'projectId and token are required' });

    // Use provided service account or fall back to environment variable
    const authOptions = {
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    };

    if (serviceAccount) {
      // Use service account from request body
      authOptions.credentials = serviceAccount;
    }
    // else GoogleAuth will use GOOGLE_APPLICATION_CREDENTIALS environment variable

    const auth = new GoogleAuth(authOptions);
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const message = {
      message: {
        token,
        notification: notification || undefined,
        data: data || undefined,
        apns: apns ? {
          payload: {
            aps: {
              sound: apns.sound || 'default',
              badge: Number(apns.badge) || 0,
              'mutable-content': apns.mutableContent ? 1 : 0,
              'content-available': apns.contentAvailable ? 1 : 0,
            }
          }
        } : undefined,
      }
    };

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken.token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    const text = await resp.text();
    res.status(resp.status).type('application/json').send(text);
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

// ---- TCP Bridge Server ----
const bridgeServers = new Map(); // bridgeId -> { server, port, config, clients, logs, lastActivity }

// Start TCP Bridge Server
app.post('/api/tcp-bridge/start', async (req, res) => {
  const { listenPort, primaryServer, secondaryServers = [] } = req.body || {};

  if (!listenPort || !primaryServer?.ip || !primaryServer?.port) {
    return res.status(400).json({ error: 'listenPort, primaryServer.ip, and primaryServer.port are required' });
  }

  // ---- Loop Protection: Prevent bridge from connecting to itself ----
  const isLocalhost = (ip) => {
    return ip === 'localhost' ||
           ip === '127.0.0.1' ||
           ip === '::1' ||
           ip === '0.0.0.0' ||
           ip === '::';
  };

  // Check if primary server would create a loop
  if (isLocalhost(primaryServer.ip) && Number(primaryServer.port) === Number(listenPort)) {
    return res.status(400).json({
      error: `Loop detected: Primary server cannot be ${primaryServer.ip}:${primaryServer.port} when bridge listens on port ${listenPort}. The bridge would connect to itself causing an infinite loop.`
    });
  }

  // Check if any secondary server would create a loop
  for (let i = 0; i < secondaryServers.length; i++) {
    const server = secondaryServers[i];
    if (server.ip && server.port) {
      if (isLocalhost(server.ip) && Number(server.port) === Number(listenPort)) {
        return res.status(400).json({
          error: `Loop detected: Secondary server ${i + 1} cannot be ${server.ip}:${server.port} when bridge listens on port ${listenPort}. The bridge would connect to itself causing an infinite loop.`
        });
      }
    }
  }

  // Check for duplicate servers (same IP:Port in primary and secondary, or between secondaries)
  const allServers = [
    { ...primaryServer, type: 'primary' },
    ...secondaryServers.map((s, idx) => ({ ...s, type: `secondary-${idx + 1}` }))
  ];

  const serverMap = new Map();
  for (const server of allServers) {
    if (server.ip && server.port) {
      const key = `${server.ip}:${server.port}`;
      if (serverMap.has(key)) {
        return res.status(400).json({
          error: `Duplicate server detected: ${server.type} and ${serverMap.get(key)} both point to ${key}. Each server must have a unique IP:Port combination.`
        });
      }
      serverMap.set(key, server.type);
    }
  }

  const bridgeId = crypto.randomBytes(16).toString('hex');
  const logs = [];
  const clients = new Map(); // clientId -> { socket, remoteAddress, remotePort, primaryConnection, secondaryConnections }

  function addLog(type, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      ...(data && { data })
    };
    logs.push(logEntry);

    // Keep only last 1000 logs to prevent memory issues
    if (logs.length > 1000) {
      logs.shift();
    }
  }

  try {
    const server = net.createServer((clientSocket) => {
      const clientId = crypto.randomBytes(8).toString('hex');
      const clientInfo = `${clientSocket.remoteAddress}:${clientSocket.remotePort}`;

      addLog('client_connected', `Client connected: ${clientInfo}`, { clientId, clientInfo });

      // Connect to primary server
      const primaryConn = new net.Socket();
      primaryConn.connect(primaryServer.port, primaryServer.ip, () => {
        addLog('primary_connected', `Connected to primary server ${primaryServer.ip}:${primaryServer.port}`, { clientId });
      });

      // Connect to secondary servers
      const secondaryConns = secondaryServers.map((server, idx) => {
        const conn = new net.Socket();
        const serverInfo = `${server.ip}:${server.port}`;

        conn.connect(server.port, server.ip, () => {
          addLog('secondary_connected', `[Secondary ${idx + 1}] Connected to ${serverInfo}`, {
            clientId,
            serverIndex: idx,
            serverInfo
          });
        });

        // Log data received from secondary servers
        conn.on('data', (data) => {
          const hex = data.toString('hex');
          const ascii = data.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

          addLog('secondary_data', `[Secondary ${idx + 1} ➜ Bridge] Received ${data.length} bytes from ${serverInfo} (NOT forwarded to client)`, {
            clientId,
            direction: 'secondary_to_bridge',
            serverIndex: idx,
            serverInfo,
            hex,
            ascii,
            length: data.length,
            forwardedToClient: false
          });
        });

        conn.on('error', (err) => {
          addLog('secondary_error', `[Secondary ${idx + 1}] Error from ${serverInfo}: ${err.message}`, {
            clientId,
            serverIndex: idx,
            serverInfo
          });
        });

        conn.on('close', () => {
          addLog('secondary_closed', `[Secondary ${idx + 1}] Connection closed to ${serverInfo}`, {
            clientId,
            serverIndex: idx,
            serverInfo
          });
        });

        return conn;
      });

      // Store client connection info
      clients.set(clientId, {
        socket: clientSocket,
        remoteAddress: clientSocket.remoteAddress,
        remotePort: clientSocket.remotePort,
        primaryConnection: primaryConn,
        secondaryConnections: secondaryConns,
        connectedAt: new Date().toISOString()
      });

      // Forward data from client to all servers
      clientSocket.on('data', (data) => {
        const hex = data.toString('hex');
        const ascii = data.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

        // Build list of destinations
        const destinations = [`Primary (${primaryServer.ip}:${primaryServer.port})`];

        // Send to primary server
        let primarySuccess = false;
        try {
          primaryConn.write(data);
          primarySuccess = true;
        } catch (err) {
          addLog('forward_primary_error', `[Bridge ✖ Primary] Failed to forward: ${err.message}`, {
            clientId,
            direction: 'bridge_to_primary',
            error: err.message
          });
        }

        // Send to secondary servers
        const secondarySuccesses = [];
        secondaryConns.forEach((conn, idx) => {
          try {
            conn.write(data);
            const serverInfo = `${secondaryServers[idx].ip}:${secondaryServers[idx].port}`;
            destinations.push(`Secondary ${idx + 1} (${serverInfo})`);
            secondarySuccesses.push(idx);
          } catch (err) {
            addLog('forward_secondary_error', `[Bridge ✖ Secondary ${idx + 1}] Failed: ${err.message}`, {
              clientId,
              direction: 'bridge_to_secondary',
              serverIndex: idx,
              error: err.message
            });
          }
        });

        // Create merged log entry showing all destinations
        if (primarySuccess || secondarySuccesses.length > 0) {
          const destCount = (primarySuccess ? 1 : 0) + secondarySuccesses.length;
          const destText = destinations.join(', ');
          addLog('client_forward_all', `[Client ➜ Bridge ➜ ${destCount} Server${destCount > 1 ? 's' : ''}] Received ${data.length} bytes from ${clientInfo} and forwarded to: ${destText}`, {
            clientId,
            clientInfo,
            direction: 'client_to_servers',
            destinations,
            primarySuccess,
            secondaryCount: secondarySuccesses.length,
            hex,
            ascii,
            length: data.length
          });
        }
      });

      // Forward data from primary server back to client
      primaryConn.on('data', (data) => {
        const hex = data.toString('hex');
        const ascii = data.toString('ascii').replace(/[^\x20-\x7E]/g, '.');

        try {
          clientSocket.write(data);
          // Merged log: Primary -> Bridge -> Client
          addLog('primary_response', `[Primary ➜ Bridge ➜ Client] Received ${data.length} bytes from ${primaryServer.ip}:${primaryServer.port} and forwarded to ${clientInfo}`, {
            clientId,
            clientInfo,
            direction: 'primary_to_client',
            serverInfo: `${primaryServer.ip}:${primaryServer.port}`,
            hex,
            ascii,
            length: data.length
          });
        } catch (err) {
          addLog('forward_client_error', `[Bridge ✖ Client] Failed to forward: ${err.message}`, {
            clientId,
            clientInfo,
            direction: 'bridge_to_client',
            error: err.message
          });
        }
      });

      // Handle client disconnect
      clientSocket.on('close', () => {
        addLog('client_disconnected', `Client disconnected: ${clientInfo}`, { clientId });

        try { primaryConn.end(); } catch {}
        secondaryConns.forEach(conn => {
          try { conn.end(); } catch {}
        });

        clients.delete(clientId);
      });

      clientSocket.on('error', (err) => {
        addLog('client_error', `Client error: ${err.message}`, { clientId, clientInfo });
      });

      // Handle primary server errors
      primaryConn.on('error', (err) => {
        addLog('primary_error', `Primary server error: ${err.message}`, { clientId });
        try { clientSocket.end(); } catch {}
      });

      primaryConn.on('close', () => {
        addLog('primary_closed', `Primary server connection closed`, { clientId });
        try { clientSocket.end(); } catch {}
      });
    });

    server.listen(listenPort, () => {
      addLog('bridge_started', `TCP Bridge listening on port ${listenPort}`);

      bridgeServers.set(bridgeId, {
        server,
        port: listenPort,
        config: {
          listenPort,
          primaryServer,
          secondaryServers
        },
        clients,
        logs,
        lastActivity: Date.now(),
        startedAt: new Date().toISOString()
      });

      res.json({
        ok: true,
        bridgeId,
        message: `TCP Bridge started on port ${listenPort}`,
        config: {
          listenPort,
          primaryServer,
          secondaryServers
        }
      });
    });

    server.on('error', (err) => {
      addLog('bridge_error', `Bridge server error: ${err.message}`);
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    addLog('bridge_start_error', `Failed to start bridge: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// Get TCP Bridge Status
app.get('/api/tcp-bridge/status/:bridgeId', (req, res) => {
  const { bridgeId } = req.params;
  const bridge = bridgeServers.get(bridgeId);

  if (!bridge) {
    return res.status(404).json({ error: 'Bridge not found' });
  }

  bridge.lastActivity = Date.now();

  const clientsInfo = Array.from(bridge.clients.entries()).map(([id, client]) => ({
    clientId: id,
    remoteAddress: client.remoteAddress,
    remotePort: client.remotePort,
    connectedAt: client.connectedAt
  }));

  res.json({
    ok: true,
    bridgeId,
    running: bridge.server.listening,
    config: bridge.config,
    clients: clientsInfo,
    totalClients: clientsInfo.length,
    logs: bridge.logs.slice(-100), // Last 100 logs
    totalLogs: bridge.logs.length,
    startedAt: bridge.startedAt
  });
});

// Get TCP Bridge Logs
app.get('/api/tcp-bridge/logs/:bridgeId', (req, res) => {
  const { bridgeId } = req.params;
  const bridge = bridgeServers.get(bridgeId);

  if (!bridge) {
    return res.status(404).json({ error: 'Bridge not found' });
  }

  bridge.lastActivity = Date.now();

  res.json({
    ok: true,
    bridgeId,
    logs: bridge.logs,
    totalLogs: bridge.logs.length
  });
});

// Clear TCP Bridge Logs
app.post('/api/tcp-bridge/clear-logs', (req, res) => {
  const { bridgeId } = req.body || {};

  if (!bridgeId) {
    return res.status(400).json({ error: 'bridgeId is required' });
  }

  const bridge = bridgeServers.get(bridgeId);
  if (!bridge) {
    return res.status(404).json({ error: 'Bridge not found' });
  }

  bridge.logs.length = 0;
  bridge.lastActivity = Date.now();

  res.json({
    ok: true,
    message: 'Logs cleared'
  });
});

// Stop TCP Bridge Server
app.post('/api/tcp-bridge/stop', (req, res) => {
  const { bridgeId } = req.body || {};

  if (!bridgeId) {
    return res.status(400).json({ error: 'bridgeId is required' });
  }

  const bridge = bridgeServers.get(bridgeId);
  if (!bridge) {
    return res.status(404).json({ error: 'Bridge not found' });
  }

  try {
    // Close all client connections
    bridge.clients.forEach((client) => {
      try { client.socket.end(); } catch {}
      try { client.primaryConnection.end(); } catch {}
      client.secondaryConnections.forEach(conn => {
        try { conn.end(); } catch {}
      });
    });

    // Close the bridge server
    bridge.server.close(() => {
      bridge.logs.push({
        timestamp: new Date().toISOString(),
        type: 'bridge_stopped',
        message: `TCP Bridge stopped`
      });
    });

    bridgeServers.delete(bridgeId);

    res.json({
      ok: true,
      message: 'TCP Bridge stopped',
      logs: bridge.logs
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Serve static frontend files in production ----
const frontendDistPath = path.join(__dirname, '../frontend/dist');

// Serve static files from frontend/dist
app.use(express.static(frontendDistPath));

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log('API server on :' + PORT));
