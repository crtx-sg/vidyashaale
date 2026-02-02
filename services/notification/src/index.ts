import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import Bull from 'bull';
import nodemailer from 'nodemailer';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 8085;

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis connection for Bull
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Email queue
const emailQueue = new Bull('email', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 60000, // 1 minute
    },
  },
});

// Class reminder queue
const reminderQueue = new Bull('reminders', REDIS_URL);

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@vidyashaale.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'notification' });
});

// Send notification for class created
app.post('/notifications/class-created', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, className, startTime } = req.body;

    // Get enrolled students with notification preferences
    const enrolledStudents = await db.query(
      `SELECT u.id, u.name, u.email, u.notification_preferences
       FROM users u
       JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = $1 AND u.notification_preferences->>'class_updates' = 'true'`,
      [classId]
    );

    // Queue emails for each student
    for (const student of enrolledStudents.rows) {
      await emailQueue.add({
        type: 'class_created',
        to: student.email,
        data: {
          studentName: student.name,
          className,
          startTime,
          classUrl: `${FRONTEND_URL}/classes/${classId}`,
        },
      });
    }

    res.json({
      success: true,
      message: `Queued ${enrolledStudents.rows.length} notification emails`,
    });
  } catch (error) {
    next(error);
  }
});

// Send notification for class updated
app.post('/notifications/class-updated', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, className, startTime, changes } = req.body;

    const enrolledStudents = await db.query(
      `SELECT u.id, u.name, u.email, u.notification_preferences
       FROM users u
       JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = $1 AND u.notification_preferences->>'class_updates' = 'true'`,
      [classId]
    );

    for (const student of enrolledStudents.rows) {
      await emailQueue.add({
        type: 'class_updated',
        to: student.email,
        data: {
          studentName: student.name,
          className,
          startTime,
          changes,
          classUrl: `${FRONTEND_URL}/classes/${classId}`,
        },
      });
    }

    res.json({
      success: true,
      message: `Queued ${enrolledStudents.rows.length} notification emails`,
    });
  } catch (error) {
    next(error);
  }
});

// Send notification for class cancelled
app.post('/notifications/class-cancelled', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { classId, className, startTime, studentIds } = req.body;

    const students = await db.query(
      `SELECT id, name, email FROM users WHERE id = ANY($1)`,
      [studentIds]
    );

    for (const student of students.rows) {
      await emailQueue.add({
        type: 'class_cancelled',
        to: student.email,
        data: {
          studentName: student.name,
          className,
          startTime,
        },
      });
    }

    res.json({
      success: true,
      message: `Queued ${students.rows.length} cancellation emails`,
    });
  } catch (error) {
    next(error);
  }
});

// Send notification for assignment created
app.post('/notifications/assignment-created', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, classId, title, dueDate } = req.body;

    // Get class name
    const classResult = await db.query('SELECT name FROM classes WHERE id = $1', [classId]);
    const className = classResult.rows[0]?.name || 'Unknown Class';

    const enrolledStudents = await db.query(
      `SELECT u.id, u.name, u.email, u.notification_preferences
       FROM users u
       JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = $1 AND u.notification_preferences->>'assignment_reminders' = 'true'`,
      [classId]
    );

    for (const student of enrolledStudents.rows) {
      await emailQueue.add({
        type: 'assignment_created',
        to: student.email,
        data: {
          studentName: student.name,
          className,
          assignmentTitle: title,
          dueDate,
          assignmentUrl: `${FRONTEND_URL}/classes/${classId}/assignments/${assignmentId}`,
        },
      });
    }

    res.json({
      success: true,
      message: `Queued ${enrolledStudents.rows.length} notification emails`,
    });
  } catch (error) {
    next(error);
  }
});

// Send notification for assignment resource uploaded
app.post('/notifications/assignment-resource-uploaded', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { assignmentId, classId, resourceName, uploaderName } = req.body;

    // Get class and assignment info
    const classResult = await db.query('SELECT name, educator_id FROM classes WHERE id = $1', [classId]);
    const className = classResult.rows[0]?.name || 'Unknown Class';
    const educatorId = classResult.rows[0]?.educator_id;

    const assignmentResult = await db.query('SELECT title FROM assignments WHERE id = $1', [assignmentId]);
    const assignmentTitle = assignmentResult.rows[0]?.title || 'Unknown Assignment';

    // Get enrolled students
    const enrolledStudents = await db.query(
      `SELECT u.id, u.name, u.email, u.notification_preferences
       FROM users u
       JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = $1 AND u.notification_preferences->>'assignment_reminders' = 'true'`,
      [classId]
    );

    // Get educator info
    const educatorResult = await db.query(
      'SELECT name, email FROM users WHERE id = $1',
      [educatorId]
    );
    const educator = educatorResult.rows[0];

    // Notify students
    for (const student of enrolledStudents.rows) {
      await emailQueue.add({
        type: 'assignment_resource_uploaded',
        to: student.email,
        data: {
          recipientName: student.name,
          className,
          assignmentTitle,
          resourceName,
          uploaderName,
          classUrl: `${FRONTEND_URL}/classes/${classId}`,
        },
      });
    }

    // Notify educator (if file was uploaded by someone else, like admin)
    if (educator && uploaderName !== educator.name) {
      await emailQueue.add({
        type: 'assignment_resource_uploaded',
        to: educator.email,
        data: {
          recipientName: educator.name,
          className,
          assignmentTitle,
          resourceName,
          uploaderName,
          classUrl: `${FRONTEND_URL}/classes/${classId}`,
        },
      });
    }

    res.json({
      success: true,
      message: `Queued ${enrolledStudents.rows.length + (educator ? 1 : 0)} notification emails`,
    });
  } catch (error) {
    next(error);
  }
});

// Process email queue
emailQueue.process(async job => {
  const { type, to, data } = job.data;

  let subject: string;
  let html: string;

  switch (type) {
    case 'class_created':
      subject = `New Class: ${data.className}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Class Scheduled</h1>
          <p>Hi ${data.studentName},</p>
          <p>A new class has been scheduled:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">${data.className}</h2>
            <p style="margin: 0;">Scheduled: ${new Date(data.startTime).toLocaleString()}</p>
          </div>
          <p><a href="${data.classUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Class</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Vidyashaale - Online Education Platform</p>
        </div>
      `;
      break;

    case 'class_updated':
      subject = `Class Updated: ${data.className}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Class Updated</h1>
          <p>Hi ${data.studentName},</p>
          <p>The class <strong>${data.className}</strong> has been updated.</p>
          <p>New time: ${new Date(data.startTime).toLocaleString()}</p>
          <p><a href="${data.classUrl}" style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Class</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Vidyashaale - Online Education Platform</p>
        </div>
      `;
      break;

    case 'class_cancelled':
      subject = `Class Cancelled: ${data.className}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d32f2f;">Class Cancelled</h1>
          <p>Hi ${data.studentName},</p>
          <p>The class <strong>${data.className}</strong> scheduled for ${new Date(data.startTime).toLocaleString()} has been cancelled.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Vidyashaale - Online Education Platform</p>
        </div>
      `;
      break;

    case 'class_reminder':
      subject = `Reminder: ${data.className} starts in 15 minutes`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #FF9800;">Class Starting Soon!</h1>
          <p>Hi ${data.studentName},</p>
          <p><strong>${data.className}</strong> starts in 15 minutes.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.meetingLink}" style="background: #4CAF50; color: white; padding: 16px 32px; text-decoration: none; border-radius: 4px; font-size: 18px;">Join Meeting</a>
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Vidyashaale - Online Education Platform</p>
        </div>
      `;
      break;

    case 'assignment_created':
      subject = `New Assignment: ${data.assignmentTitle}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Assignment</h1>
          <p>Hi ${data.studentName},</p>
          <p>A new assignment has been posted for <strong>${data.className}</strong>:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin: 0 0 10px 0;">${data.assignmentTitle}</h2>
            ${data.dueDate ? `<p style="margin: 0; color: #d32f2f;">Due: ${new Date(data.dueDate).toLocaleString()}</p>` : ''}
          </div>
          <p><a href="${data.assignmentUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Assignment</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Vidyashaale - Online Education Platform</p>
        </div>
      `;
      break;

    case 'assignment_resource_uploaded':
      subject = `New File Uploaded: ${data.assignmentTitle}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">New Assignment File</h1>
          <p>Hi ${data.recipientName},</p>
          <p>A new file has been uploaded for the assignment <strong>${data.assignmentTitle}</strong> in <strong>${data.className}</strong>:</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>File:</strong> ${data.resourceName}</p>
            <p style="margin: 0;"><strong>Uploaded by:</strong> ${data.uploaderName}</p>
          </div>
          <p><a href="${data.classUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Class</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">Vidyashaale - Online Education Platform</p>
        </div>
      `;
      break;

    default:
      console.log(`Unknown email type: ${type}`);
      return;
  }

  // In development without SMTP, just log
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('Email would be sent:', { to, subject });
    return;
  }

  await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });

  console.log(`Email sent: ${type} to ${to}`);
});

// Class reminder scheduler - runs every minute
const scheduleReminders = async () => {
  try {
    // Find classes starting in 15-16 minutes
    const upcomingClasses = await db.query(
      `SELECT c.id, c.name, c.meeting_link, c.start_time
       FROM classes c
       WHERE c.start_time BETWEEN NOW() + INTERVAL '14 minutes' AND NOW() + INTERVAL '16 minutes'
       AND c.meeting_link IS NOT NULL`
    );

    for (const classRow of upcomingClasses.rows) {
      // Get enrolled students who want reminders
      const students = await db.query(
        `SELECT u.id, u.name, u.email
         FROM users u
         JOIN enrollments e ON e.student_id = u.id
         WHERE e.class_id = $1 AND u.notification_preferences->>'class_reminders' = 'true'`,
        [classRow.id]
      );

      // Get educator
      const educator = await db.query(
        `SELECT u.id, u.name, u.email
         FROM users u
         JOIN classes c ON c.educator_id = u.id
         WHERE c.id = $1 AND u.notification_preferences->>'class_reminders' = 'true'`,
        [classRow.id]
      );

      const recipients = [...students.rows, ...educator.rows];

      for (const recipient of recipients) {
        await emailQueue.add({
          type: 'class_reminder',
          to: recipient.email,
          data: {
            studentName: recipient.name,
            className: classRow.name,
            meetingLink: classRow.meeting_link,
          },
        });
      }

      console.log(`Scheduled ${recipients.length} reminders for class ${classRow.name}`);
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

// Run reminder scheduler every minute
setInterval(scheduleReminders, 60000);

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
  });
});

// Start server
const start = async () => {
  try {
    await db.query('SELECT NOW()');
    console.log('Database connected');

    // Run initial reminder check
    scheduleReminders();

    app.listen(PORT, () => {
      console.log(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start notification service:', error);
    process.exit(1);
  }
};

start();

export { app };
