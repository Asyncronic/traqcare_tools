# Deployment Guide - Single Server Setup

This guide explains how to deploy both frontend and backend together on a single personal server.

## Architecture

The backend Express server serves both:
1. **API endpoints** at `/api/*` routes
2. **Static frontend files** from the built React application

This means you only need to run one Node.js process on one port.

## Prerequisites

- **Node.js 18+** installed on your server
- **Git** (to clone/pull the repository)
- **PM2** or similar process manager (recommended for production)
- **Firewall** configured to allow traffic on your chosen port (default: 8787)

## Deployment Steps

### 1. Install Dependencies

```bash
# Install all dependencies for root, backend, and frontend
npm run install:all
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory (optional for FCM):

```bash
cd backend
nano .env
```

Add your Firebase service account path (only needed if using FCM Sender):

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/serviceAccount.json
PORT=8787
```

### 3. Build the Frontend

```bash
# From the root directory
npm run build:all
```

This will:
- Build the React frontend into `frontend/dist/`
- Display a success message

### 4. Start the Server

#### Option A: Direct Start (for testing)

```bash
npm start
```

The server will start on port 8787 (or your configured PORT).

#### Option B: Production with PM2 (recommended)

Install PM2 globally:

```bash
npm install -g pm2
```

Start the application:

```bash
cd backend
pm2 start server.js --name traqcare-tools
```

Configure PM2 to restart on system reboot:

```bash
pm2 startup
pm2 save
```

Useful PM2 commands:

```bash
pm2 status                    # Check status
pm2 logs traqcare-tools       # View logs
pm2 restart traqcare-tools    # Restart app
pm2 stop traqcare-tools       # Stop app
pm2 delete traqcare-tools     # Remove from PM2
```

### 5. Access Your Application

Open your browser and navigate to:

```
http://your-server-ip:8787
```

Or if you've set up a domain:

```
http://yourdomain.com:8787
```

## Reverse Proxy Setup (Optional but Recommended)

For production, it's recommended to use Nginx or Apache as a reverse proxy:

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Support for Server-Sent Events (TCP streaming)
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/traqcare-tools /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Now access your app at:

```
http://yourdomain.com
```

## SSL/HTTPS Setup (Recommended)

Use Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Certbot will automatically configure SSL and set up auto-renewal.

## Updating Your Deployment

When you make changes to the code:

```bash
# Pull latest changes
git pull

# Reinstall dependencies if package.json changed
npm run install:all

# Rebuild frontend
npm run build:all

# Restart the backend
pm2 restart traqcare-tools
```

## Firewall Configuration

### Ubuntu/Debian (UFW)

```bash
# Allow your application port
sudo ufw allow 8787/tcp

# If using Nginx reverse proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### CentOS/RHEL (firewalld)

```bash
sudo firewall-cmd --permanent --add-port=8787/tcp
sudo firewall-cmd --reload
```

## Monitoring

### Check Application Logs

```bash
# PM2 logs
pm2 logs traqcare-tools

# Or if running directly
cd backend
npm start  # logs appear in terminal
```

### Monitor Resource Usage

```bash
pm2 monit
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8787
sudo lsof -i :8787

# Kill the process
sudo kill -9 <PID>
```

### Static Files Not Loading

Make sure the frontend was built:

```bash
ls -la frontend/dist/
```

You should see `index.html` and an `assets/` folder.

### API Calls Failing

Check that CORS is properly configured in [backend/server.js](backend/server.js):

```javascript
app.use(cors());  // Already configured
```

### Connection Pool Timeout Issues

Connections automatically close after 5 minutes of inactivity. This is configured in [backend/server.js](backend/server.js:33). To adjust:

```javascript
const timeout = 10 * 60 * 1000; // Change to 10 minutes
```

## Performance Optimization

### Enable Gzip Compression

Install compression middleware:

```bash
cd backend
npm install compression
```

Add to [server.js](backend/server.js):

```javascript
import compression from 'compression';
app.use(compression());
```

### Set Proper Cache Headers

For production, configure Nginx to cache static assets:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Security Recommendations

1. **Firewall**: Only expose necessary ports
2. **HTTPS**: Always use SSL in production
3. **Environment Variables**: Never commit `.env` or `serviceAccount.json` to git
4. **Rate Limiting**: Consider adding express-rate-limit for API endpoints
5. **Updates**: Keep Node.js and dependencies updated
