import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { db } from './db';
import { createStorageProvider, StorageProvider } from './storage';

const app = express();
const PORT = process.env.PORT || 8084;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8085';

// Initialize storage provider
let storage: StorageProvider;

// File upload configuration
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
const MAX_STORAGE_PER_CLASS = 500 * 1024 * 1024; // 500MB

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.txt', '.jpg', '.jpeg', '.png', '.gif', '.mp4', '.zip'
];

const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.sh', '.msi', '.cmd', '.com', '.scr'];

// Multer configuration for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return cb(new Error('File type not allowed for security reasons'));
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`File type ${ext} is not allowed`));
    }

    cb(null, true);
  },
});

app.use(cors());
app.use(express.json());

// Extract user from headers
const extractUser = (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.headers['x-user-id'] as string;
  const email = req.headers['x-user-email'] as string;
  const role = req.headers['x-user-role'] as string;

  if (userId && email && role) {
    (req as any).user = { userId, email, role };
  }
  next();
};

app.use(extractUser);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'resource' });
});

// Upload resource
app.post('/resources/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } });
    }

    const { classId, name, type, assignmentId } = req.body;

    if (!classId || !name || !type) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'classId, name, and type are required' },
      });
    }

    // If type is 'assignment', assignmentId should be provided
    if (type === 'assignment' && !assignmentId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'assignmentId is required for assignment type resources' },
      });
    }

    // Validate type
    const validTypes = ['reading', 'notes', 'assignment', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'type must be one of: reading, notes, assignment, other' },
      });
    }

    // Check storage quota
    const quotaResult = await db.query(
      'SELECT COALESCE(SUM(file_size), 0) as total FROM resources WHERE class_id = $1',
      [classId]
    );
    const currentUsage = parseInt(quotaResult.rows[0].total);

    if (currentUsage + req.file.size > MAX_STORAGE_PER_CLASS) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: 'Upload would exceed storage limit for this class',
          details: {
            currentUsage,
            maxStorage: MAX_STORAGE_PER_CLASS,
            requestedSize: req.file.size,
          },
        },
      });
    }

    // Generate storage path
    const ext = path.extname(req.file.originalname);
    const storagePath = `classes/${classId}/${uuidv4()}${ext}`;

    // Upload to storage
    await storage.upload(req.file.buffer, storagePath, req.file.mimetype);

    // Save metadata to database
    const result = await db.query(
      `INSERT INTO resources (class_id, assignment_id, uploaded_by, name, original_filename, type, storage_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [classId, assignmentId || null, user.userId, name, req.file.originalname, type, storagePath, req.file.size, req.file.mimetype]
    );

    // Send notification for assignment resource uploads
    if (type === 'assignment' && assignmentId) {
      // Get uploader name
      const uploaderResult = await db.query('SELECT name FROM users WHERE id = $1', [user.userId]);
      const uploaderName = uploaderResult.rows[0]?.name || 'Unknown';

      // Send notification asynchronously
      axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/assignment-resource-uploaded`, {
        assignmentId,
        classId,
        resourceName: name,
        uploaderName,
      }).catch(err => console.error('Failed to send resource upload notification:', err.message));
    }

    res.status(201).json({
      success: true,
      data: {
        resource: {
          id: result.rows[0].id,
          classId: result.rows[0].class_id,
          assignmentId: result.rows[0].assignment_id,
          name: result.rows[0].name,
          originalFilename: result.rows[0].original_filename,
          type: result.rows[0].type,
          fileSize: result.rows[0].file_size,
          mimeType: result.rows[0].mime_type,
          createdAt: result.rows[0].created_at,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// List resources for a class (excluding assignment-type resources)
app.get('/resources/class/:classId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId } = req.params;

    const result = await db.query(
      `SELECT r.*, u.name as uploader_name
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       WHERE r.class_id = $1 AND r.type != 'assignment'
       ORDER BY r.type, r.created_at DESC`,
      [classId]
    );

    // Calculate storage usage
    const quotaResult = await db.query(
      'SELECT COALESCE(SUM(file_size), 0) as total FROM resources WHERE class_id = $1',
      [classId]
    );

    res.json({
      success: true,
      data: {
        resources: result.rows.map(row => ({
          id: row.id,
          classId: row.class_id,
          name: row.name,
          originalFilename: row.original_filename,
          type: row.type,
          fileSize: row.file_size,
          mimeType: row.mime_type,
          uploaderName: row.uploader_name,
          createdAt: row.created_at,
        })),
        storage: {
          used: parseInt(quotaResult.rows[0].total),
          max: MAX_STORAGE_PER_CLASS,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// List resources for an assignment
app.get('/resources/assignment/:assignmentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId } = req.params;

    const result = await db.query(
      `SELECT r.*, u.name as uploader_name
       FROM resources r
       JOIN users u ON u.id = r.uploaded_by
       WHERE r.assignment_id = $1
       ORDER BY r.created_at DESC`,
      [assignmentId]
    );

    res.json({
      success: true,
      data: {
        resources: result.rows.map(row => ({
          id: row.id,
          classId: row.class_id,
          assignmentId: row.assignment_id,
          name: row.name,
          originalFilename: row.original_filename,
          type: row.type,
          fileSize: row.file_size,
          mimeType: row.mime_type,
          uploaderName: row.uploader_name,
          createdAt: row.created_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Download resource
app.get('/resources/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT storage_path, original_filename, mime_type FROM resources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }

    const { storage_path, original_filename, mime_type } = result.rows[0];

    // Get signed URL or download directly based on storage type
    const storageType = process.env.STORAGE_TYPE || 'LOCAL';

    if (storageType === 'LOCAL') {
      // For local storage, send file directly
      const fileBuffer = await storage.download(storage_path);
      res.setHeader('Content-Disposition', `attachment; filename="${original_filename}"`);
      res.setHeader('Content-Type', mime_type || 'application/octet-stream');
      return res.send(fileBuffer);
    } else {
      // For S3/MinIO, redirect to signed URL
      const signedUrl = await storage.getSignedUrl(storage_path, 3600); // 1 hour expiry
      return res.json({
        success: true,
        data: { downloadUrl: signedUrl },
      });
    }
  } catch (error) {
    next(error);
  }
});

// Delete resource
app.delete('/resources/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }

    const { id } = req.params;

    // Get resource info
    const result = await db.query(
      'SELECT storage_path, uploaded_by FROM resources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      });
    }

    const { storage_path, uploaded_by } = result.rows[0];

    // Check authorization (uploader or admin)
    if (uploaded_by !== user.userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Not authorized to delete this resource' },
      });
    }

    // Delete from storage
    await storage.delete(storage_path);

    // Delete from database
    await db.query('DELETE FROM resources WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Resource deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);

  if (err.message.includes('File type not allowed') || err.message.includes('is not allowed')) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FILE_TYPE', message: err.message },
    });
  }

  if (err.message === 'File too large') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

// Start server
const start = async () => {
  try {
    // Initialize storage
    storage = createStorageProvider();

    // Test database connection
    await db.query('SELECT NOW()');
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Resource service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start resource service:', error);
    process.exit(1);
  }
};

start();

export { app };
