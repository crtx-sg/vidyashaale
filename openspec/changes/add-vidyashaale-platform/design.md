# Technical Design: Vidyashaale Platform

## Context
Vidyashaale is a new online education platform requiring a scalable, maintainable architecture. The system must support multiple user roles, real-time class scheduling, Google Meet integration, and configurable file storage—all while maintaining simplicity for end users.

### Stakeholders
- **Educators**: Need to create and manage classes efficiently
- **Students**: Need simple access to classes and materials
- **Administrators**: Need system oversight and user management
- **Operations**: Need easy deployment and monitoring

## Goals / Non-Goals

### Goals
- Simple, intuitive user experience requiring no training
- Fast page loads (dashboard < 2s, other pages < 3s)
- 99% availability during school hours
- Scalable microservices architecture
- Easy local development with Docker
- Configurable storage for different deployment scenarios

### Non-Goals
- Real-time chat or messaging (use Google Meet's built-in chat)
- Video recording/playback (out of scope for v1.0)
- Complex grading rubrics (simple pass/fail or score only)
- Multi-tenancy (single organization deployment)
- Custom video conferencing (rely on Google Meet)

## Decisions

### D1: Microservices Architecture
**Decision**: Use microservices with dedicated services for each domain.

**Services**:
| Service | Port | Responsibility |
|---------|------|----------------|
| Frontend | 3000 | ReactJS SPA |
| API Gateway | 8080 | Routing, auth validation, rate limiting |
| Auth Service | 8081 | User registration, login, JWT management |
| Class Service | 8082 | Class CRUD, scheduling, enrollments |
| Meeting Service | 8083 | Google Meet API integration |
| Resource Service | 8084 | File upload/download, storage abstraction |
| Notification Service | 8085 | Email sending, reminder scheduling |

**Rationale**: Separation of concerns, independent scaling, easier testing, team parallelization.

**Alternatives Considered**:
- Monolith: Simpler initially but harder to scale and maintain long-term
- Serverless: Higher complexity, vendor lock-in, cold start issues

### D2: API Gateway Pattern
**Decision**: Single API Gateway as entry point for all client requests.

**Responsibilities**:
- Route requests to appropriate microservice
- Validate JWT tokens
- Rate limiting (100 requests/minute per user)
- Request/response logging
- CORS handling

**Rationale**: Simplifies frontend, centralizes cross-cutting concerns, easier security management.

### D3: JWT-Based Authentication
**Decision**: Use JWT tokens for stateless authentication.

**Token Configuration**:
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Stored in httpOnly cookies (access) and secure storage (refresh)
- Token contains: userId, email, role, expiry

**Rationale**: Stateless (no session storage needed), works well with microservices, industry standard.

### D4: PostgreSQL Database
**Decision**: Single PostgreSQL instance with logical separation by service.

**Schema Design**:
```
users          - id, name, email, password_hash, role, created_at, updated_at
classes        - id, educator_id, name, topic, start_time, duration, recurrence, meeting_link
enrollments    - id, class_id, student_id, enrolled_at
resources      - id, class_id, name, type, storage_path, size, uploaded_at
assignments    - id, class_id, title, description, due_date, created_at
submissions    - id, assignment_id, student_id, storage_path, submitted_at
notifications  - id, user_id, type, content, sent_at, read_at
```

**Rationale**: Relational data with clear relationships, ACID compliance, mature ecosystem.

**Alternatives Considered**:
- MongoDB: Less suitable for relational education data
- Separate DB per service: Overkill for initial scale, adds complexity

### D5: Configurable File Storage
**Decision**: Abstract storage layer with three backend options.

**Storage Interface**:
```typescript
interface StorageProvider {
  upload(file: Buffer, path: string): Promise<string>;
  download(path: string): Promise<Buffer>;
  delete(path: string): Promise<void>;
  getSignedUrl(path: string, expiry: number): Promise<string>;
}
```

**Implementations**:
- `LocalStorageProvider`: File system storage for development
- `S3StorageProvider`: AWS S3 for production
- `MinioStorageProvider`: S3-compatible for self-hosted

**Configuration**:
```env
STORAGE_TYPE=LOCAL|S3|MINIO
STORAGE_LOCAL_PATH=/data/uploads
STORAGE_ENDPOINT=http://minio:9000
STORAGE_BUCKET=vidyashaale
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...
```

**Rationale**: Flexibility for different deployment scenarios, easy local testing, production-ready options.

### D6: Google Meet Integration
**Decision**: Use Google Calendar API to create Meet-enabled events.

**Flow**:
1. Educator creates class with date/time
2. Class Service calls Meeting Service
3. Meeting Service creates Google Calendar event with Meet enabled
4. Meet link stored with class record
5. Link displayed on class card for one-click join

**Error Handling**:
- Retry 3 times with exponential backoff
- If all retries fail, allow educator to manually enter meeting link
- Log failures for monitoring

**Rationale**: Official Google API, reliable Meet link generation, calendar integration for attendees.

### D7: Notification System
**Decision**: Event-driven notification service with email delivery.

**Triggers**:
- Class created → Email to enrolled students
- Class updated → Email to enrolled students
- Class reminder → 15 minutes before start
- Assignment created → Email to enrolled students
- Assignment due soon → 24 hours before deadline

**Implementation**:
- Bull queue for job processing
- Nodemailer for SMTP delivery
- User preferences for opt-out

**Rationale**: Asynchronous processing, reliable delivery, user control.

## Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'educator', 'student')),
    email_verified BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{"class_reminders": true, "assignment_reminders": true}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    educator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    topic TEXT,
    start_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    recurrence VARCHAR(50), -- NULL, 'daily', 'weekly', 'custom'
    recurrence_end_date DATE,
    meeting_link VARCHAR(500),
    meeting_link_manual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- Resources table
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reading', 'notes', 'assignment', 'other'
    storage_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id, student_id)
);

-- Indexes for performance
CREATE INDEX idx_classes_educator ON classes(educator_id);
CREATE INDEX idx_classes_start_time ON classes(start_time);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_resources_class ON resources(class_id);
CREATE INDEX idx_assignments_class ON assignments(class_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
```

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google Meet API rate limits | Class creation fails | Implement retry logic, cache tokens, request quota increase |
| Single database bottleneck | Performance degradation | Add read replicas, implement caching layer if needed |
| Email delivery failures | Users miss reminders | Use reliable SMTP provider, implement retry queue, add in-app notifications |
| File storage costs | Budget overrun | Implement file size limits (50MB), storage quotas per user |
| JWT token theft | Security breach | Short expiry, httpOnly cookies, refresh token rotation |

## Migration Plan

### Phase 1: Core Infrastructure
1. Set up Docker Compose configuration
2. Initialize PostgreSQL with schema
3. Deploy API Gateway
4. Deploy Auth Service

### Phase 2: Core Features
5. Deploy Class Service
6. Deploy Meeting Service (with Google API credentials)
7. Deploy Frontend with dashboard

### Phase 3: Content Features
8. Deploy Resource Service with local storage
9. Deploy Notification Service
10. Configure email provider

### Phase 4: Production Readiness
11. Switch to S3/MinIO storage
12. Set up monitoring and logging
13. Configure backup automation
14. Load testing and optimization

### Rollback
- Each service is independently deployable
- Database migrations include down scripts
- Docker images tagged with versions for quick rollback

## Open Questions

1. **Google Workspace Integration**: Should we integrate with Google Classroom for roster sync?
   - *Current decision*: Out of scope for v1.0, can be added later

2. **Multi-language Support**: Should the UI support multiple languages?
   - *Current decision*: English only for v1.0, design for i18n compatibility

3. **Analytics Dashboard**: Should administrators have usage analytics?
   - *Current decision*: Basic metrics only (user counts, class counts), detailed analytics in v1.1
