import express from 'express';
import cors from 'cors';
import net from 'net';
import dgram from 'dgram';
import { GoogleAuth } from 'google-auth-library';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ---- Connection Pool for Persistent Connections ----
const connectionPool = new Map(); // sessionId -> { socket, events, config, lastActivity, sseClients }

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
  for (const [sessionId, conn] of connectionPool.entries()) {
    if (now - conn.lastActivity > timeout) {
      console.log(`Cleaning up stale connection: ${sessionId}`);
      try { conn.socket.destroy(); } catch {}
      connectionPool.delete(sessionId);
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
          buf = data_format === 'ascii' ? Buffer.from(pkt, 'ascii') : Buffer.from(pkt, 'hex');
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
      buf = data_format === 'ascii' ? Buffer.from(data, 'ascii') : Buffer.from(data, 'hex');
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
        buf = data_format === 'ascii' ? Buffer.from(pkt, 'ascii') : Buffer.from(pkt, 'hex');
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

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log('API server on :' + PORT));
