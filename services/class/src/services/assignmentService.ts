import axios from 'axios';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8085';

interface Assignment {
  id: string;
  classId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  maxFileSize: number;
  allowedFileTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface CreateAssignmentInput {
  classId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  storagePath: string;
  originalFilename: string;
  fileSize: number;
  submittedAt: Date;
  isLate: boolean;
}

export const createAssignment = async (
  educatorId: string,
  input: CreateAssignmentInput
): Promise<Assignment> => {
  const { classId, title, description, dueDate } = input;

  // Verify educator owns the class
  const classResult = await db.query(
    'SELECT educator_id FROM classes WHERE id = $1',
    [classId]
  );

  if (classResult.rows.length === 0) {
    throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  }

  if (classResult.rows[0].educator_id !== educatorId) {
    throw new AppError('Not authorized to create assignment for this class', 403, 'NOT_AUTHORIZED');
  }

  // Validate due date is in future
  if (dueDate && new Date(dueDate) < new Date()) {
    throw new AppError('Due date must be in the future', 400, 'INVALID_DUE_DATE');
  }

  const result = await db.query(
    `INSERT INTO assignments (class_id, title, description, due_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [classId, title, description, dueDate]
  );

  const assignment = mapAssignment(result.rows[0]);

  // Notify enrolled students
  notifyAssignmentCreated(assignment).catch(console.error);

  return assignment;
};

export const getAssignmentsByClass = async (classId: string): Promise<Assignment[]> => {
  const result = await db.query(
    `SELECT * FROM assignments WHERE class_id = $1 ORDER BY due_date ASC NULLS LAST, created_at DESC`,
    [classId]
  );

  return result.rows.map(mapAssignment);
};

export const getAssignmentById = async (assignmentId: string): Promise<Assignment> => {
  const result = await db.query('SELECT * FROM assignments WHERE id = $1', [assignmentId]);

  if (result.rows.length === 0) {
    throw new AppError('Assignment not found', 404, 'ASSIGNMENT_NOT_FOUND');
  }

  return mapAssignment(result.rows[0]);
};

export const updateAssignment = async (
  assignmentId: string,
  educatorId: string,
  updates: Partial<CreateAssignmentInput>
): Promise<Assignment> => {
  const assignment = await getAssignmentById(assignmentId);

  // Verify educator owns the class
  const classResult = await db.query(
    'SELECT educator_id FROM classes WHERE id = $1',
    [assignment.classId]
  );

  if (classResult.rows[0].educator_id !== educatorId) {
    throw new AppError('Not authorized to update this assignment', 403, 'NOT_AUTHORIZED');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.dueDate !== undefined) {
    fields.push(`due_date = $${paramIndex++}`);
    values.push(updates.dueDate);
  }

  if (fields.length === 0) {
    return assignment;
  }

  values.push(assignmentId);
  const result = await db.query(
    `UPDATE assignments SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  return mapAssignment(result.rows[0]);
};

export const deleteAssignment = async (assignmentId: string, educatorId: string): Promise<void> => {
  const assignment = await getAssignmentById(assignmentId);

  // Verify educator owns the class
  const classResult = await db.query(
    'SELECT educator_id FROM classes WHERE id = $1',
    [assignment.classId]
  );

  if (classResult.rows[0].educator_id !== educatorId) {
    throw new AppError('Not authorized to delete this assignment', 403, 'NOT_AUTHORIZED');
  }

  await db.query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
};

// Submission functions
export const createSubmission = async (
  assignmentId: string,
  studentId: string,
  storagePath: string,
  originalFilename: string,
  fileSize: number
): Promise<Submission> => {
  const assignment = await getAssignmentById(assignmentId);

  // Check if late
  const isLate = assignment.dueDate ? new Date() > new Date(assignment.dueDate) : false;

  // Check for existing submission
  const existing = await db.query(
    'SELECT id FROM submissions WHERE assignment_id = $1 AND student_id = $2',
    [assignmentId, studentId]
  );

  if (existing.rows.length > 0) {
    // Update existing submission
    const result = await db.query(
      `UPDATE submissions
       SET storage_path = $1, original_filename = $2, file_size = $3, submitted_at = NOW(), is_late = $4
       WHERE assignment_id = $5 AND student_id = $6
       RETURNING *`,
      [storagePath, originalFilename, fileSize, isLate, assignmentId, studentId]
    );
    return mapSubmission(result.rows[0]);
  }

  const result = await db.query(
    `INSERT INTO submissions (assignment_id, student_id, storage_path, original_filename, file_size, is_late)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [assignmentId, studentId, storagePath, originalFilename, fileSize, isLate]
  );

  return mapSubmission(result.rows[0]);
};

export const getSubmissionsByAssignment = async (assignmentId: string): Promise<Submission[]> => {
  const result = await db.query(
    `SELECT s.*, u.name as student_name, u.email as student_email
     FROM submissions s
     JOIN users u ON u.id = s.student_id
     WHERE s.assignment_id = $1
     ORDER BY s.submitted_at DESC`,
    [assignmentId]
  );

  return result.rows.map(row => ({
    ...mapSubmission(row),
    studentName: row.student_name,
    studentEmail: row.student_email,
  }));
};

export const getStudentSubmission = async (
  assignmentId: string,
  studentId: string
): Promise<Submission | null> => {
  const result = await db.query(
    'SELECT * FROM submissions WHERE assignment_id = $1 AND student_id = $2',
    [assignmentId, studentId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapSubmission(result.rows[0]);
};

// Helper functions
const mapAssignment = (row: Record<string, unknown>): Assignment => ({
  id: row.id as string,
  classId: row.class_id as string,
  title: row.title as string,
  description: row.description as string | undefined,
  dueDate: row.due_date as Date | undefined,
  maxFileSize: row.max_file_size as number,
  allowedFileTypes: row.allowed_file_types as string[],
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

const mapSubmission = (row: Record<string, unknown>): Submission => ({
  id: row.id as string,
  assignmentId: row.assignment_id as string,
  studentId: row.student_id as string,
  storagePath: row.storage_path as string,
  originalFilename: row.original_filename as string,
  fileSize: row.file_size as number,
  submittedAt: row.submitted_at as Date,
  isLate: row.is_late as boolean,
});

const notifyAssignmentCreated = async (assignment: Assignment) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/assignment-created`, {
      assignmentId: assignment.id,
      classId: assignment.classId,
      title: assignment.title,
      dueDate: assignment.dueDate,
    });
  } catch (error) {
    console.error('Failed to send assignment notification:', error);
  }
};
