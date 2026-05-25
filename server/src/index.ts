import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initDatabase } from './db';
import fsRouter from './routes/fs';
import windowsRouter from './routes/windows';
import { initSockets } from './socket';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/v1/fs', fsRouter);
app.use('/api/v1/windows', windowsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Start Server
async function start() {
  try {
    await initDatabase();
    
    initSockets(httpServer);
    
    httpServer.listen(PORT, () => {
      console.log(`WebOS backend running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
// trigger reload
