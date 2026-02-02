// =============================================================================
// VIDYASHAALE SHARED TYPES
// =============================================================================

// -----------------------------------------------------------------------------
// User Types
// -----------------------------------------------------------------------------

export type UserRole = 'admin' | 'educator' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  notificationPreferences: NotificationPreferences;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferences {
  classReminders: boolean;
  assignmentReminders: boolean;
  classUpdates: boolean;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// -----------------------------------------------------------------------------
// Class Types
// -----------------------------------------------------------------------------

export type RecurrenceType = 'daily' | 'weekly' | 'custom' | null;

export interface Class {
  id: string;
  educatorId: string;
  name: string;
  topic?: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
  recurrence: RecurrenceType;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
  parentClassId?: string;
  meetingLink?: string;
  meetingLinkManual: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurrencePattern {
  days?: string[]; // ['monday', 'wednesday', 'friday']
}

export interface CreateClassInput {
  name: string;
  topic?: string;
  description?: string;
  startTime: Date;
  durationMinutes: number;
  recurrence?: RecurrenceType;
  recurrencePattern?: RecurrencePattern;
  recurrenceEndDate?: Date;
}

export interface UpdateClassInput {
  name?: string;
  topic?: string;
  description?: string;
  startTime?: Date;
  durationMinutes?: number;
  meetingLink?: string;
}

// -----------------------------------------------------------------------------
// Enrollment Types
// -----------------------------------------------------------------------------

export interface Enrollment {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: Date;
}

// -----------------------------------------------------------------------------
// Resource Types
// -----------------------------------------------------------------------------

export type ResourceType = 'reading' | 'notes' | 'assignment' | 'other';

export interface Resource {
  id: string;
  classId: string;
  uploadedBy: string;
  name: string;
  originalFilename: string;
  type: ResourceType;
  storagePath: string;
  fileSize: number;
  mimeType?: string;
  createdAt: Date;
}

export interface CreateResourceInput {
  classId: string;
  name: string;
  type: ResourceType;
}

// -----------------------------------------------------------------------------
// Assignment Types
// -----------------------------------------------------------------------------

export interface Assignment {
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

export interface CreateAssignmentInput {
  classId: string;
  title: string;
  description?: string;
  dueDate?: Date;
}

// -----------------------------------------------------------------------------
// Submission Types
// -----------------------------------------------------------------------------

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  storagePath: string;
  originalFilename: string;
  fileSize: number;
  submittedAt: Date;
  isLate: boolean;
}

// -----------------------------------------------------------------------------
// API Response Types
// -----------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// -----------------------------------------------------------------------------
// Calendar View Types
// -----------------------------------------------------------------------------

export type CalendarView = 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
}

// -----------------------------------------------------------------------------
// Notification Types
// -----------------------------------------------------------------------------

export type NotificationType =
  | 'class_reminder'
  | 'class_created'
  | 'class_updated'
  | 'class_cancelled'
  | 'assignment_created'
  | 'assignment_due_reminder';

export interface NotificationPayload {
  type: NotificationType;
  userId: string;
  data: Record<string, unknown>;
}

// -----------------------------------------------------------------------------
// Storage Types
// -----------------------------------------------------------------------------

export type StorageType = 'LOCAL' | 'S3' | 'MINIO';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_STORAGE_PER_CLASS = 500 * 1024 * 1024; // 500MB

export const ALLOWED_FILE_TYPES = [
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'mp4',
  'zip',
];

export const BLOCKED_FILE_TYPES = ['exe', 'bat', 'sh', 'msi', 'cmd', 'com', 'scr'];
