import { db } from '../db';
import { AppError } from '../middleware/errorHandler';

interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: Date;
}

export const enroll = async (classId: string, studentId: string): Promise<Enrollment> => {
  // Check if class exists
  const classResult = await db.query('SELECT id FROM classes WHERE id = $1', [classId]);
  if (classResult.rows.length === 0) {
    throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  }

  // Check if already enrolled
  const existing = await db.query(
    'SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2',
    [classId, studentId]
  );
  if (existing.rows.length > 0) {
    throw new AppError('Already enrolled in this class', 400, 'ALREADY_ENROLLED');
  }

  const result = await db.query(
    `INSERT INTO enrollments (class_id, student_id)
     VALUES ($1, $2)
     RETURNING id, class_id, student_id, enrolled_at`,
    [classId, studentId]
  );

  return {
    id: result.rows[0].id,
    classId: result.rows[0].class_id,
    studentId: result.rows[0].student_id,
    enrolledAt: result.rows[0].enrolled_at,
  };
};

export const unenroll = async (classId: string, studentId: string): Promise<void> => {
  const result = await db.query(
    'DELETE FROM enrollments WHERE class_id = $1 AND student_id = $2 RETURNING id',
    [classId, studentId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Not enrolled in this class', 404, 'NOT_ENROLLED');
  }
};

export const getEnrollmentsByClass = async (classId: string): Promise<Enrollment[]> => {
  const result = await db.query(
    `SELECT e.id, e.class_id, e.student_id, e.enrolled_at, u.name as student_name, u.email as student_email
     FROM enrollments e
     JOIN users u ON u.id = e.student_id
     WHERE e.class_id = $1
     ORDER BY e.enrolled_at ASC`,
    [classId]
  );

  return result.rows.map(row => ({
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id,
    enrolledAt: row.enrolled_at,
    studentName: row.student_name,
    studentEmail: row.student_email,
  }));
};

export const getEnrollmentsByStudent = async (studentId: string): Promise<Enrollment[]> => {
  const result = await db.query(
    `SELECT e.id, e.class_id, e.student_id, e.enrolled_at
     FROM enrollments e
     WHERE e.student_id = $1
     ORDER BY e.enrolled_at DESC`,
    [studentId]
  );

  return result.rows.map(row => ({
    id: row.id,
    classId: row.class_id,
    studentId: row.student_id,
    enrolledAt: row.enrolled_at,
  }));
};

export const isEnrolled = async (classId: string, studentId: string): Promise<boolean> => {
  const result = await db.query(
    'SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2',
    [classId, studentId]
  );
  return result.rows.length > 0;
};
