import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { errorHandler } from './middleware/errorHandler';
import { db } from './db';

const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'auth' });
});

// Routes
app.use('/auth', authRouter);

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  try {
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start auth service:', error);
    process.exit(1);
  }
};

start();

export { app };
