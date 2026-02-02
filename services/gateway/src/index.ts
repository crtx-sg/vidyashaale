import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { authMiddleware } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 8080;

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
const CLASS_SERVICE_URL = process.env.CLASS_SERVICE_URL || 'http://localhost:8082';
const MEETING_SERVICE_URL = process.env.MEETING_SERVICE_URL || 'http://localhost:8083';
const RESOURCE_SERVICE_URL = process.env.RESOURCE_SERVICE_URL || 'http://localhost:8084';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8085';

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// NOTE: Do NOT use express.json() here - it consumes the body before proxy can forward it
// Each downstream service handles its own body parsing

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'gateway' });
});

// Proxy configuration
const proxyOptions: Options = {
  changeOrigin: true,
  onError: (err, _req, res) => {
    console.error('Proxy error:', err);
    (res as express.Response).status(502).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Service temporarily unavailable',
      },
    });
  },
};

// Auth routes (public - no authentication required)
app.use(
  '/api/auth',
  createProxyMiddleware({
    ...proxyOptions,
    target: AUTH_SERVICE_URL,
    pathRewrite: { '^/api/auth': '/auth' },
  })
);

// Protected routes - require authentication
app.use('/api/classes', authMiddleware);
app.use(
  '/api/classes',
  createProxyMiddleware({
    ...proxyOptions,
    target: CLASS_SERVICE_URL,
    pathRewrite: { '^/api/classes': '/classes' },
  })
);

app.use('/api/enrollments', authMiddleware);
app.use(
  '/api/enrollments',
  createProxyMiddleware({
    ...proxyOptions,
    target: CLASS_SERVICE_URL,
    pathRewrite: { '^/api/enrollments': '/enrollments' },
  })
);

app.use('/api/assignments', authMiddleware);
app.use(
  '/api/assignments',
  createProxyMiddleware({
    ...proxyOptions,
    target: CLASS_SERVICE_URL,
    pathRewrite: { '^/api/assignments': '/assignments' },
  })
);

app.use('/api/submissions', authMiddleware);
app.use(
  '/api/submissions',
  createProxyMiddleware({
    ...proxyOptions,
    target: CLASS_SERVICE_URL,
    pathRewrite: { '^/api/submissions': '/submissions' },
  })
);

app.use('/api/meetings', authMiddleware);
app.use(
  '/api/meetings',
  createProxyMiddleware({
    ...proxyOptions,
    target: MEETING_SERVICE_URL,
    pathRewrite: { '^/api/meetings': '/meetings' },
  })
);

app.use('/api/resources', authMiddleware);
app.use(
  '/api/resources',
  createProxyMiddleware({
    ...proxyOptions,
    target: RESOURCE_SERVICE_URL,
    pathRewrite: { '^/api/resources': '/resources' },
  })
);

app.use('/api/notifications', authMiddleware);
app.use(
  '/api/notifications',
  createProxyMiddleware({
    ...proxyOptions,
    target: NOTIFICATION_SERVICE_URL,
    pathRewrite: { '^/api/notifications': '/notifications' },
  })
);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export { app };
