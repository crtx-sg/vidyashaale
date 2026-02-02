import express from 'express';
import cors from 'cors';
import { classRouter } from './routes/classes';
import { enrollmentRouter } from './routes/enrollments';
import { assignmentRouter } from './routes/assignments';
import { submissionRouter } from './routes/submissions';
import { errorHandler } from './middleware/errorHandler';
import { db } from './db';

const app = express();
const PORT = process.env.PORT || 8082;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'class' });
});

// Routes
app.use('/classes', classRouter);
app.use('/enrollments', enrollmentRouter);
app.use('/assignments', assignmentRouter);
app.use('/submissions', submissionRouter);

// Error handler
app.use(errorHandler);

const start = async () => {
  try {
    await db.query('SELECT NOW()');
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Class service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start class service:', error);
    process.exit(1);
  }
};

start();

export { app };
