# TraqCare Tools (TCP Client + FCM Sender)

Modern web UI with two tools:
- **TCP Client**: Send multiple Hex/ASCII packets over the same TCP connection (via backend proxy).
- **FCM Sender**: Send Firebase Cloud Messaging HTTP v1 notifications (service account stays server-side).

## Quick Start

### 1) Backend
```bash
cd backend
npm i
# Ensure Node 18+ so global fetch is available
# Set GOOGLE_APPLICATION_CREDENTIALS pointing to your service account JSON (or load JSON in code)
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
npm i
npm run dev
# Open the URL shown by Vite (usually http://localhost:5173). /api is proxied to http://localhost:8787
```

### Build
```bash
npm run build
npm run preview
```

## Notes
- Browsers cannot open raw TCP sockets. The **backend** opens one TCP connection and sends all packets in sequence.
- Keep your **Firebase service account** server-side. The frontend calls `/api/fcm` on your backend which handles auth.
- Adjust CORS or host both frontend+backend on the same domain in production.
