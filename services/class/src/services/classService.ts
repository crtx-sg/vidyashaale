import axios from 'axios';
import { db } from '../db';
import { AppError } from '../middleware/errorHandler';

const MEETING_SERVICE_URL = process.env.MEETING_SERVICE_URL || 'http://localhost:8083';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8085';

interface CreateClassInput {
  name: string;
  topic?: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
  recurrence?: 'daily' | 'weekly' | 'custom' | null;
  recurrencePattern?: { days?: string[] };
  recurrenceEndDate?: Date;
  meetingLink?: string;
  meetingPassword?: string;
}

interface ClassRecord {
  id: string;
  educatorId: string;
  name: string;
  topic?: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
  recurrence?: string;
  recurrencePattern?: Record<string, unknown>;
  recurrenceEndDate?: Date;
  meetingLink?: string;
  meetingPassword?: string;
  meetingLinkManual: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createClass = async (
  educatorId: string,
  input: CreateClassInput
): Promise<ClassRecord> => {
  const { name, topic, description, startTime, durationMinutes, recurrence, recurrencePattern, recurrenceEndDate, meetingLink: inputMeetingLink, meetingPassword } = input;

  // Validate start time is in the future
  if (new Date(startTime) < new Date()) {
    throw new AppError('Class cannot be scheduled in the past', 400, 'INVALID_START_TIME');
  }

  // Use provided meeting link or try to create Google Meet link
  let meetingLink: string | undefined = inputMeetingLink;
  let meetingLinkManual = Boolean(inputMeetingLink);

  if (!meetingLink) {
    try {
      const meetingResponse = await axios.post(`${MEETING_SERVICE_URL}/meetings/create`, {
        title: name,
        startTime,
        durationMinutes,
      });
      meetingLink = meetingResponse.data.data?.meetingLink;
    } catch (error) {
      console.error('Failed to create meeting link:', error);
      // Meeting link will need to be added manually
      meetingLinkManual = true;
    }
  }

  // Create the class
  const result = await db.query(
    `INSERT INTO classes (educator_id, name, topic, description, start_time, duration_minutes, recurrence, recurrence_pattern, recurrence_end_date, meeting_link, meeting_password, meeting_link_manual)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      educatorId,
      name,
      topic,
      description,
      startTime,
      durationMinutes,
      recurrence,
      recurrencePattern ? JSON.stringify(recurrencePattern) : null,
      recurrenceEndDate,
      meetingLink,
      meetingPassword,
      meetingLinkManual,
    ]
  );

  const classRecord = mapClassRecord(result.rows[0]);

  // Create recurring instances if needed
  if (recurrence && recurrenceEndDate) {
    await createRecurringInstances(classRecord, recurrence, recurrencePattern, recurrenceEndDate);
  }

  // Send notification to enrolled students (async, don't wait)
  notifyClassCreated(classRecord).catch(console.error);

  return classRecord;
};

const createRecurringInstances = async (
  parentClass: ClassRecord,
  recurrence: string,
  pattern: { days?: string[] } | undefined,
  endDate: Date
) => {
  const instances: Date[] = [];
  const startDate = new Date(parentClass.startTime);
  let currentDate = new Date(startDate);

  // Move to next occurrence
  if (recurrence === 'daily') {
    currentDate.setDate(currentDate.getDate() + 1);
  } else if (recurrence === 'weekly') {
    currentDate.setDate(currentDate.getDate() + 7);
  }

  while (currentDate <= endDate) {
    if (recurrence === 'daily') {
      instances.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (recurrence === 'weekly') {
      instances.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (recurrence === 'custom' && pattern?.days) {
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      if (pattern.days.includes(dayName)) {
        instances.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Create instances
  for (const instanceDate of instances) {
    let meetingLink: string | undefined;
    try {
      const meetingResponse = await axios.post(`${MEETING_SERVICE_URL}/meetings/create`, {
        title: parentClass.name,
        startTime: instanceDate,
        durationMinutes: parentClass.durationMinutes,
      });
      meetingLink = meetingResponse.data.data?.meetingLink;
    } catch {
      // Continue without meeting link
    }

    await db.query(
      `INSERT INTO classes (educator_id, name, topic, description, start_time, duration_minutes, parent_class_id, meeting_link, meeting_link_manual)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        parentClass.educatorId,
        parentClass.name,
        parentClass.topic,
        parentClass.description,
        instanceDate,
        parentClass.durationMinutes,
        parentClass.id,
        meetingLink,
        !meetingLink,
      ]
    );
  }
};

export const getClasses = async (
  userId: string,
  role: string,
  startDate?: Date,
  endDate?: Date
): Promise<ClassRecord[]> => {
  let query: string;
  const params: unknown[] = [];

  if (role === 'educator') {
    query = `SELECT * FROM classes WHERE educator_id = $1`;
    params.push(userId);
  } else {
    // Students see enrolled classes
    query = `
      SELECT c.* FROM classes c
      INNER JOIN enrollments e ON e.class_id = c.id
      WHERE e.student_id = $1
    `;
    params.push(userId);
  }

  if (startDate) {
    params.push(startDate);
    query += ` AND start_time >= $${params.length}`;
  }

  if (endDate) {
    params.push(endDate);
    query += ` AND start_time <= $${params.length}`;
  }

  query += ' ORDER BY start_time ASC';

  const result = await db.query(query, params);
  return result.rows.map(mapClassRecord);
};

export const getClassById = async (classId: string): Promise<ClassRecord> => {
  const result = await db.query('SELECT * FROM classes WHERE id = $1', [classId]);

  if (result.rows.length === 0) {
    throw new AppError('Class not found', 404, 'CLASS_NOT_FOUND');
  }

  return mapClassRecord(result.rows[0]);
};

export const updateClass = async (
  classId: string,
  educatorId: string,
  updates: Partial<CreateClassInput> & { meetingLink?: string; meetingPassword?: string }
): Promise<ClassRecord> => {
  const existingClass = await getClassById(classId);

  if (existingClass.educatorId !== educatorId) {
    throw new AppError('Not authorized to update this class', 403, 'NOT_AUTHORIZED');
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.topic !== undefined) {
    fields.push(`topic = $${paramIndex++}`);
    values.push(updates.topic);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updates.description);
  }
  if (updates.startTime !== undefined) {
    fields.push(`start_time = $${paramIndex++}`);
    values.push(updates.startTime);
  }
  if (updates.durationMinutes !== undefined) {
    fields.push(`duration_minutes = $${paramIndex++}`);
    values.push(updates.durationMinutes);
  }
  if (updates.meetingLink !== undefined) {
    fields.push(`meeting_link = $${paramIndex++}`);
    values.push(updates.meetingLink);
    fields.push(`meeting_link_manual = $${paramIndex++}`);
    values.push(true);
  }
  if (updates.meetingPassword !== undefined) {
    fields.push(`meeting_password = $${paramIndex++}`);
    values.push(updates.meetingPassword);
  }

  if (fields.length === 0) {
    return existingClass;
  }

  values.push(classId);
  const result = await db.query(
    `UPDATE classes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  const updatedClass = mapClassRecord(result.rows[0]);

  // Notify students of update
  notifyClassUpdated(updatedClass).catch(console.error);

  return updatedClass;
};

export const deleteClass = async (classId: string, educatorId: string): Promise<void> => {
  const existingClass = await getClassById(classId);

  if (existingClass.educatorId !== educatorId) {
    throw new AppError('Not authorized to delete this class', 403, 'NOT_AUTHORIZED');
  }

  // Get enrolled students before deleting
  const enrollments = await db.query(
    'SELECT student_id FROM enrollments WHERE class_id = $1',
    [classId]
  );

  await db.query('DELETE FROM classes WHERE id = $1', [classId]);

  // Notify students of cancellation
  notifyClassCancelled(existingClass, enrollments.rows.map(r => r.student_id)).catch(console.error);
};

// Helper functions
const mapClassRecord = (row: Record<string, unknown>): ClassRecord => ({
  id: row.id as string,
  educatorId: row.educator_id as string,
  name: row.name as string,
  topic: row.topic as string | undefined,
  description: row.description as string | undefined,
  startTime: row.start_time as Date,
  durationMinutes: row.duration_minutes as number,
  recurrence: row.recurrence as string | undefined,
  recurrencePattern: row.recurrence_pattern as Record<string, unknown> | undefined,
  recurrenceEndDate: row.recurrence_end_date as Date | undefined,
  meetingLink: row.meeting_link as string | undefined,
  meetingPassword: row.meeting_password as string | undefined,
  meetingLinkManual: row.meeting_link_manual as boolean,
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
});

const notifyClassCreated = async (classRecord: ClassRecord) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/class-created`, {
      classId: classRecord.id,
      className: classRecord.name,
      startTime: classRecord.startTime,
    });
  } catch (error) {
    console.error('Failed to send class created notification:', error);
  }
};

const notifyClassUpdated = async (classRecord: ClassRecord) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/class-updated`, {
      classId: classRecord.id,
      className: classRecord.name,
      startTime: classRecord.startTime,
    });
  } catch (error) {
    console.error('Failed to send class updated notification:', error);
  }
};

const notifyClassCancelled = async (classRecord: ClassRecord, studentIds: string[]) => {
  try {
    await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/class-cancelled`, {
      classId: classRecord.id,
      className: classRecord.name,
      startTime: classRecord.startTime,
      studentIds,
    });
  } catch (error) {
    console.error('Failed to send class cancelled notification:', error);
  }
};
