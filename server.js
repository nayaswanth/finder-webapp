import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Lightweight request log
app.use((req, _res, next) => { console.log(`${req.method} ${req.url}`); next(); });

// Serve static assets from Vite build output
app.use(express.static(path.join(__dirname, 'dist'), {
  index: false,
  maxAge: '1d'
}));

// Simple health check
app.get('/health', (_req, res) => {
  res.json({ status: 'Frontend server is running', timestamp: new Date().toISOString() });
});

// SPA fallback: always return index.html for non-file routes
app.get('*', (_req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Serving from: ${path.join(__dirname, 'dist')}`);
});
