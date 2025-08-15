# SPA Server Configuration Guide

## 🚀 Quick Start

### For Local Development/Testing:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build your app:**
   ```bash
   npm run build
   ```

3. **Start the Express server:**
   ```bash
   npm run serve
   # or for simple server:
   npm run serve:simple
   ```

4. **Test the routing:**
   - Navigate to http://localhost:3000
   - Go to http://localhost:3000/find-opportunities directly
   - Refresh the page - it should work without 404!

### For Production Deployment:

## 🔧 Express.js Server (Recommended)

**Files created:**
- `server.js` - Full-featured server with history API fallback
- `simple-server.js` - Basic server without extra dependencies

**Features:**
- ✅ Serves static files from `dist/` directory
- ✅ Handles SPA routing fallback
- ✅ API route protection
- ✅ Error handling
- ✅ Gzip compression support

## 🌐 Nginx Configuration

**File:** `nginx.conf`

**Features:**
- ✅ SPA routing with `try_files`
- ✅ Static asset caching
- ✅ Security headers
- ✅ Gzip compression
- ✅ API proxy support

**Usage:**
```bash
# Copy to nginx sites-available
sudo cp nginx.conf /etc/nginx/sites-available/your-site
sudo ln -s /etc/nginx/sites-available/your-site /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🐳 Docker Deployment

**File:** `Dockerfile`

**Build and run:**
```bash
docker build -t finder-webapp .
docker run -p 80:80 finder-webapp
```

## 🔧 Apache Configuration

**File:** `.htaccess`

**Usage:**
- Place in your web root directory alongside `index.html`
- Works with shared hosting providers

## 🎯 Key Solutions Explained

### The Problem:
When users refresh `/find-opportunities` or access it directly, the server looks for a physical file/directory at that path, finds nothing, and returns 404.

### The Solution:
Configure the server to serve `index.html` for any route that doesn't match a physical file, allowing React Router to handle the routing client-side.

### Configuration Patterns:

1. **Express.js:** `app.get('*', ...)` - Catch-all route
2. **Nginx:** `try_files $uri $uri/ /index.html` - Try file, then directory, then fallback
3. **Apache:** `RewriteRule . /index.html [L]` - Rewrite all non-files to index.html

## 🚨 Important Notes:

1. **API Routes:** Make sure to define API routes BEFORE the SPA fallback
2. **Static Assets:** Ensure static files (CSS, JS, images) are served correctly
3. **Base URL:** Make sure your React Router `basename` matches your deployment path
4. **CORS:** Configure CORS if your API is on a different domain/port

## 🔍 Troubleshooting:

1. **Check build output:** Ensure `dist/` contains `index.html`
2. **Test locally:** Use the Express server to verify routing works
3. **Check browser network tab:** Verify the server returns `index.html` for SPA routes
4. **API conflicts:** Ensure API routes don't conflict with SPA routes

## 🎉 Success Criteria:

- ✅ Direct URL access works: `yoursite.com/find-opportunities`
- ✅ Page refresh works on any route
- ✅ Navigation between routes works
- ✅ Static assets load correctly
- ✅ API calls work (if applicable)
