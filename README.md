# TraqCare Tools

Modern web-based diagnostic toolbox for IoT and fleet management teams with five powerful tools:

- **TCP Client**: Send Hex/ASCII packets to device servers with support for batch and persistent connection modes
- **UDP Client**: Send connectionless UDP datagrams with optional response waiting
- **MQTT Client**: Connect to MQTT brokers, publish messages, and subscribe to topics with QoS support
- **API Tester**: Test HTTP endpoints with custom headers, request bodies, and multiple HTTP methods
- **FCM Sender**: Send Firebase Cloud Messaging (HTTP v1) push notifications for testing iOS and Android devices

## Features

### TCP Client
- **Batch Mode**: Send multiple packets sequentially over a single connection
- **Persistent Connection Mode**: Maintain long-lived connections for interactive testing
- **Real-time Streaming**: Server-Sent Events (SSE) for instant delivery of unsolicited server messages
- **Dual Format Support**: Send and receive packets in Hex or ASCII format
- **Real-time Logging**: Monitor connection events, sent packets, and received responses
- **Response Waiting**: Optionally wait for server responses with configurable timeouts
- **Connection Pool**: Manage multiple persistent connections simultaneously
- **Auto-cleanup**: Automatic session expiration after 5 minutes of inactivity
- **State Persistence**: Automatically save and restore connection settings

### UDP Client
- **Connectionless Protocol**: Send UDP datagrams without establishing a connection
- **Dual Format Support**: Send packets in Hex or ASCII format
- **Optional Response Waiting**: Configure timeout for receiving UDP responses
- **Source Tracking**: Display source IP and port of received packets
- **Real-time Logging**: Monitor sent datagrams and received responses
- **State Persistence**: Automatically save and restore UDP settings

### MQTT Client
- **Broker Connection**: Connect to any MQTT broker (public or private)
- **Publish Messages**: Send messages to topics with QoS 0, 1, or 2
- **Subscribe to Topics**: Subscribe to topics with wildcard support (+, #)
- **Message Retention**: Support for retained messages
- **TLS/SSL Support**: Secure connections to brokers (MQTTS)
- **Authentication**: Username and password authentication
- **Real-time Updates**: Auto-polling for incoming messages
- **Session Management**: Persistent connection with automatic timeout
- **State Persistence**: Automatically save and restore MQTT settings

### API Tester
- **Multiple HTTP Methods**: Support for GET, POST, PUT, PATCH, DELETE
- **Custom Headers**: Add custom HTTP headers (one per line, `Header: Value` format)
- **Request Body**: Send JSON or plain text payloads
- **JSON Formatter**: Built-in JSON validation and formatting
- **Response Display**: View status code, duration, content type, and response body
- **Response Headers**: Inspect all response headers
- **Configurable Timeout**: Set custom request timeouts
- **State Persistence**: Automatically save and restore API test configurations

### FCM Sender
- **HTTP v1 API**: Uses the latest Firebase Cloud Messaging API
- **Flexible Authentication**: Support for both JSON service account and backend-managed credentials
- **Server-side OAuth**: Secure OAuth token generation using Google Auth Library
- **iOS & Android Support**: Full support for APNs-specific fields (sound, badge, mutable-content, content-available)
- **Custom Data**: Send custom key-value pairs with notifications
- **Rich Notifications**: Configure titles, body text, and notification icons
- **State Persistence**: Automatically save and restore FCM configurations

## Architecture

### Monorepo Structure
```
/backend    → Express.js API server (Node.js 18+)
/frontend   → React SPA with Vite + TypeScript + Tailwind CSS
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite 5, Tailwind CSS
- **Backend**: Express.js with ES modules
  - Node.js `net` module for TCP
  - Node.js `dgram` module for UDP
  - `mqtt.js` library for MQTT client
  - Native `fetch` API for HTTP proxying
- **Authentication**: Google Auth Library for FCM OAuth tokens
- **Real-time Communication**: Server-Sent Events (SSE) for live TCP data streaming, polling for MQTT messages
- **Development**: Vite proxy for seamless API integration
- **State Management**: LocalStorage-based persistence across all tools

## Quick Start

### 1) Backend
```bash
cd backend
npm install
# Ensure Node 18+ so global fetch is available
# Set GOOGLE_APPLICATION_CREDENTIALS pointing to your service account JSON
export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/serviceAccount.json
npm start
# Server listens on :8787
```

**OR** use the startup script from the root directory:
```bash
./start-backend.sh
```

**Important**: The backend MUST be running for the frontend to work. If you see "Cannot connect to backend server" errors in the UI, check that the backend is running on port 8787.

### 2) Frontend (Vite + React + Tailwind)
In another terminal:
```bash
cd frontend
npm install
npm run dev
# Open the URL shown by Vite (usually http://localhost:5173)
# /api requests are proxied to http://localhost:8787
```

### Build for Production
```bash
cd frontend
npm run build
npm run preview
```

## API Endpoints

### TCP Client

#### Batch Mode
- `POST /api/tcp` - Send multiple packets over a single connection
  - Opens connection, sends all packets sequentially, then closes
  - Supports configurable response timeouts
  - Request body: `{ ip, port, packets: [], format, timeout, receive_response }`

#### Persistent Connection Mode
- `POST /api/tcp/connect` - Establish persistent connection
  - Returns sessionId for subsequent operations
  - TCP keep-alive enabled (60s intervals)
  - Request body: `{ ip, port }`
  - Response: `{ sessionId, status, timestamp }`

- `POST /api/tcp/send` - Send packet on existing connection
  - Requires sessionId from connect call
  - Connection remains open after sending
  - Request body: `{ sessionId, packet, format, timeout, receive_response }`

- `GET /api/tcp/status/:sessionId` - Check connection status
  - Returns recent events and responses
  - Useful for monitoring unsolicited server data
  - Response: `{ status, events, responses, lastActivity }`

- `GET /api/tcp/stream/:sessionId` - Real-time data stream (SSE)
  - Server-Sent Events endpoint for live data streaming
  - Streams unsolicited server messages in real-time
  - Automatically reconnects on connection loss

- `POST /api/tcp/disconnect` - Close connection gracefully
  - Removes session from connection pool
  - Request body: `{ sessionId }`

### UDP Client
- `POST /api/udp` - Send UDP datagram
  - Connectionless protocol, no session management
  - Optional response waiting with timeout
  - Request body: `{ ip, port, packet, format, timeout, receive_response }`
  - Response: `{ sent, response, sourceIp, sourcePort }`

### MQTT Client
- `POST /api/mqtt/connect` - Connect to MQTT broker
  - Establishes connection and returns sessionId
  - Request body: `{ broker, port, clientId, username, password, useTLS }`
  - Response: `{ sessionId, clientId, message, events }`

- `POST /api/mqtt/publish` - Publish message to topic
  - Requires active sessionId
  - Request body: `{ sessionId, topic, message, qos, retain }`
  - Response: `{ ok, topic, message, qos, retain, events }`

- `POST /api/mqtt/subscribe` - Subscribe to topic
  - Supports wildcards (+ for single level, # for multiple levels)
  - Request body: `{ sessionId, topic, qos }`
  - Response: `{ ok, topic, qos, subscriptions, events }`

- `POST /api/mqtt/unsubscribe` - Unsubscribe from topic
  - Request body: `{ sessionId, topic }`
  - Response: `{ ok, topic, subscriptions, events }`

- `GET /api/mqtt/status/:sessionId` - Get connection status and messages
  - Returns connection state, subscriptions, and received messages
  - Response: `{ connected, subscriptions, events, messages, totalMessages }`

- `POST /api/mqtt/disconnect` - Disconnect from broker
  - Request body: `{ sessionId }`
  - Response: `{ ok, message, events, totalMessages }`

### API Tester
- `POST /api/http-request` - Proxy HTTP request to external API
  - Supports GET, POST, PUT, PATCH, DELETE methods
  - Custom headers and request body
  - Request body: `{ method, url, headers: {}, body, timeout }`
  - Response: `{ status, statusText, headers, data, duration }`

### FCM Sender
- `POST /api/fcm` - Send FCM HTTP v1 notification
  - Server-side OAuth authentication
  - Supports notification, data, and APNs payloads
  - Request body: `{ projectId, serviceAccountJson, token, notification, data, apns }`
  - Response: `{ success, messageId, error }`

## Usage Examples

### TCP Client - Batch Mode
1. Navigate to the "TCP Client" tab
2. Enter server IP address and port
3. Select "Batch" mode
4. Choose packet format (Hex or ASCII)
5. Enter one or more packets (one per line)
6. Set timeout in seconds
7. Enable "Wait for response" if needed
8. Click "Send Packets"
9. View results in the log panel

### TCP Client - Persistent Connection Mode
1. Navigate to the "TCP Client" tab
2. Enter server IP address and port
3. Select "Persistent" mode
4. Click "Connect"
5. Wait for connection confirmation
6. Send packets one at a time using the packet input
7. Monitor incoming data in real-time via SSE stream
8. View unsolicited server messages as they arrive
9. Click "Disconnect" when finished

### UDP Client
1. Navigate to the "UDP Client" tab
2. Enter server IP address and port
3. Choose packet format (Hex or ASCII)
4. Enter your UDP datagram content
5. Set timeout in seconds
6. Enable "Wait for response" if you expect a reply
7. Click "Send Packet"
8. View sent packet and any received responses in the log
9. Note the source IP/port of responses

### MQTT Client
1. Navigate to the "MQTT Client" tab
2. Enter broker host (e.g., broker.hivemq.com)
3. Enter port (1883 for TCP, 8883 for TLS)
4. (Optional) Enter client ID, username, and password
5. Enable "Use TLS" for secure connections
6. Click "Connect"
7. **To Publish:**
   - Enter topic name
   - Select QoS level (0, 1, or 2)
   - Enter message payload
   - (Optional) Enable "Retain message"
   - Click "Publish"
8. **To Subscribe:**
   - Enter topic (supports wildcards: test/# or sensor/+/temp)
   - Select QoS level
   - Click "Subscribe"
   - Incoming messages appear automatically in the log
   - Click ✕ on a subscription to unsubscribe
9. Click "Disconnect" when finished

### API Tester
1. Navigate to the "API Tester" tab
2. Select HTTP method (GET, POST, PUT, PATCH, DELETE)
3. Enter the target URL (full URL including protocol)
4. Add custom headers if needed (format: `Header-Name: Value`, one per line)
5. For POST/PUT/PATCH: Enter request body (JSON or plain text)
6. Use "Format JSON" button to validate and format JSON payloads
7. Set timeout in seconds
8. Click "Send Request"
9. View response status, duration, headers, and body

### FCM Sender
1. Navigate to the "FCM Sender" tab
2. Choose authentication mode:
   - **JSON Mode**: Paste your complete Firebase service account JSON
   - **Manual Mode**: Enter Project ID only (backend uses `GOOGLE_APPLICATION_CREDENTIALS`)
3. Enter device FCM token
4. Configure notification title and body
5. Add custom data fields (optional, format: `key=value`, one per line)
6. Configure iOS-specific settings (optional):
   - Badge number
   - Sound file name
   - Mutable content (for notification extensions)
   - Content available (for background updates)
7. Click "Send Notification"
8. Check response status and message ID

## Data Formats

### TCP/UDP Packet Formats
- **Hex**: Continuous hex string without spaces or `0x` prefix
  - Example: `78780D01086471700328358100093F040D0A`
  - Invalid: `78 78 0D 01` (has spaces)
  - Invalid: `0x7878` (has 0x prefix)
- **ASCII**: Plain text strings sent as-is
  - Example: `*HQ,12345,TEST#`
  - Example: `LOGIN:admin:password`
- **Response**: Always returned as hex strings for consistency

### API Tester Formats

#### Custom Headers
One header per line in `Header-Name: Value` format:
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
X-Custom-Header: custom-value
```

#### Request Body
- **JSON**: Valid JSON object or array
  ```json
  {
    "key": "value",
    "nested": {
      "field": 123
    }
  }
  ```
- **Plain Text**: Any string content

### MQTT Topics and Wildcards
MQTT topics are hierarchical and support wildcards:
- **Single-level wildcard (+)**: Matches one level
  - `sensor/+/temperature` matches `sensor/room1/temperature` and `sensor/room2/temperature`
- **Multi-level wildcard (#)**: Matches multiple levels (must be last character)
  - `sensor/#` matches `sensor/temperature`, `sensor/room1/temperature`, `sensor/room1/humidity/current`
- **No wildcards in publish**: Wildcards only work for subscriptions

### MQTT Quality of Service (QoS)
- **QoS 0**: At most once delivery (fire and forget, fastest)
- **QoS 1**: At least once delivery (acknowledgment required, possible duplicates)
- **QoS 2**: Exactly once delivery (slowest, guaranteed delivery without duplicates)

### FCM Custom Data
Custom data fields use a simple `key=value` format (one per line):
```
key1=value1
key2=value2
action=view_details
userId=12345
```

## Production Deployment

### Prerequisites
- Node.js 18 or higher
- Firebase service account JSON file
- Network access to target TCP servers and FCM endpoints

### Deployment Checklist
- [ ] Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- [ ] Configure CORS settings for your domain
- [ ] Build frontend with `npm run build`
- [ ] Host frontend and backend on the same domain (recommended)
- [ ] Consider TLS/SSL termination for TCP connections
- [ ] Set up appropriate firewall rules for TCP client
- [ ] Secure service account credentials (use secret manager)

## Security Notes

- **Firebase Service Account**: Never expose service account JSON to the frontend
- **TCP Connections**: Backend acts as proxy to prevent browser security restrictions
- **CORS**: Configure appropriately for production environment
- **Connection Limits**: TCP sessions auto-expire after 5 minutes of inactivity
- **OAuth Tokens**: Generated server-side with proper scoping

## Troubleshooting

### Backend Connection Errors
- Ensure backend is running on port 8787
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify Node.js version is 18 or higher

### TCP Connection Issues
- Verify target server IP and port are correct
- Check network connectivity to target server
- Review firewall rules on both client and server
- Enable response waiting if server expects acknowledgments
- For persistent connections, check if SSE stream is connected
- Ensure session hasn't expired (5-minute idle timeout)

### UDP Connection Issues
- Verify target server IP and port are correct
- Check that server is listening for UDP packets
- UDP is connectionless, so no connection confirmation is shown
- Enable response waiting only if server replies to UDP packets
- Check firewall rules for UDP traffic (different from TCP)

### MQTT Connection Issues
- Verify broker host and port are correct
- Check if broker requires authentication (username/password)
- Ensure TLS is enabled if connecting to port 8883
- Test with public brokers first (broker.hivemq.com, test.mosquitto.org)
- Check firewall rules for MQTT ports (1883, 8883)
- Verify client ID is unique (or leave blank for auto-generation)
- Sessions expire after 5 minutes of inactivity

### FCM Send Failures
- Verify service account has `firebase.messaging` permissions
- Check device token is valid and not expired
- Ensure project ID matches the service account
- Review FCM API quota limits

## Development Tips

- Use the Vite dev server for hot module replacement during frontend development
- Backend server will automatically reload when files change (if using nodemon)
- Check browser console for detailed error messages
- Use the persistent connection mode to debug protocol handshakes
- Monitor the TCP log panel for timing and response issues
- SSE connections will automatically reconnect if the backend restarts
- All tool settings persist in localStorage - clear browser storage to reset
- Use the API Tester to debug external API integrations before implementing them
- UDP is useful for testing connectionless IoT protocols (like some GPS trackers)
- Hex format is recommended for binary protocols, ASCII for text-based protocols

## Advanced Features

### Real-time TCP Streaming with SSE
In persistent connection mode, the TCP client uses Server-Sent Events to stream data in real-time:
- Unsolicited server messages appear instantly without polling
- Connection status updates are pushed to the UI
- Automatic reconnection on network interruptions
- Event types: `data` (server messages), `event` (connection events), `ping` (keep-alive)

### Connection Pool Management
The backend maintains a pool of persistent TCP connections:
- Each connection has a unique sessionId
- Sessions expire after 5 minutes of inactivity
- Automatic cleanup runs every 60 seconds
- Each session maintains its own event log and response buffer
- Multiple tabs can share the same session (using the same sessionId)

### State Persistence
All five tools automatically save state to localStorage:
- **TCP Client**: IP, port, format, timeout, mode, last packets
- **UDP Client**: IP, port, format, timeout, last packet
- **MQTT Client**: Broker, port, credentials, topics, QoS settings
- **API Tester**: Method, URL, headers, body, timeout
- **FCM Sender**: Project ID, token, notification config, data fields

Settings are automatically restored when you reload the page.

## Contributing

We welcome contributions from the community! TraqCare Tools is open source and we'd love your help making it better.

### How to Contribute

- **Report bugs** - Found an issue? Let us know!
- **Suggest features** - Have an idea? We'd love to hear it!
- **Submit pull requests** - Fix bugs or add features
- **Improve documentation** - Help make our docs better
- **Share feedback** - Tell us how we can improve

Please read our [Contributing Guidelines](CONTRIBUTING.md) for detailed information on:
- Development setup and workflow
- Coding standards and best practices
- How to submit pull requests
- Bug reporting process
- Enhancement suggestions

### Quick Start for Contributors

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/traqcare-tools-site.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes and commit: `git commit -m "Add awesome feature"`
5. Push to your fork: `git push origin feature/your-feature-name`
6. Open a Pull Request

## License

MIT License - Copyright (c) 2025 Huizhou Skywonder Technology Co., Ltd

See [LICENSE](LICENSE) file for full details.

This project is open source and available under the MIT License, which allows you to:
- Use the software for any purpose (commercial or personal)
- Modify and distribute the software
- Sublicense the software
- Use the software privately

The only requirement is that you include the original copyright notice and license in any substantial portions of the software.
