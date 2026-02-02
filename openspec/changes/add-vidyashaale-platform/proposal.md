# Change: Add Vidyashaale Online Education Platform

## Why
There is a need for a purpose-built online education platform that is simpler and more focused than general meeting tools like Google Meet or Microsoft Teams. Vidyashaale addresses this by providing educators and students with an integrated solution for scheduling classes, joining video meetings, and sharing learning materials—all with a minimal, user-friendly interface.

## What Changes

### New Capabilities
- **User Authentication**: Registration, login, password reset, role-based access (Administrator, Educator, Student)
- **Dashboard**: Unified view of scheduled classes with day/week/month calendar views
- **Class Management**: Create, edit, delete classes with support for recurring schedules
- **Meeting Integration**: Automatic Google Meet link generation for each class
- **Resource Management**: Upload, organize, and download class materials with configurable storage (Local/S3/MinIO)
- **Assignment Management**: Create assignments with due dates, student submission, and tracking
- **Notifications**: Email reminders for upcoming classes and system notifications

### Architecture
- Microservices architecture with 7 core services
- API Gateway for unified entry point
- Docker containerization for all services
- PostgreSQL database with defined schema
- Configurable file storage backend

## Impact

### Affected Specs (New)
- `specs/user-auth/spec.md`
- `specs/dashboard/spec.md`
- `specs/class-management/spec.md`
- `specs/meeting-integration/spec.md`
- `specs/resource-management/spec.md`
- `specs/assignment-management/spec.md`
- `specs/notifications/spec.md`

### Affected Code
- `frontend/` - ReactJS application
- `services/auth/` - Authentication service
- `services/class/` - Class management service
- `services/meeting/` - Google Meet integration service
- `services/resource/` - Resource/file management service
- `services/notification/` - Notification service
- `services/gateway/` - API Gateway
- `database/` - PostgreSQL schema and migrations
- `docker/` - Docker configuration files

## Identified Gaps and Recommendations

The following gaps were identified during spec review. These are documented for future consideration:

### High Priority (Recommended for v1.0)
1. **Enrollment Flow**: The spec describes students attending classes but doesn't define how students discover and enroll in classes. *Recommendation*: Add class discovery and enrollment request/approval workflow.
2. **Timezone Handling**: Critical for scheduling—no mention of how times are displayed or stored for users in different timezones. *Recommendation*: Store all times in UTC, display in user's local timezone.
3. **Google Meet API Error Handling**: No fallback defined if the Meet API fails during class creation. *Recommendation*: Allow manual meeting link entry as fallback.

### Medium Priority (Recommended for v1.1)
4. **Search Functionality**: No way to search through classes or resources. *Recommendation*: Add search bar to dashboard and resource views.
5. **User Profile Management**: Users cannot edit their profile or change password while logged in. *Recommendation*: Add profile settings page.
6. **Class Capacity Limits**: No maximum number of students per class defined. *Recommendation*: Add optional capacity setting during class creation.
7. **Grading System**: Assignments exist but no mechanism to grade or provide feedback. *Recommendation*: Add simple grading with score and comments.

### Lower Priority (Future Versions)
8. **Accessibility (a11y)**: No accessibility requirements specified. *Recommendation*: Add WCAG 2.1 AA compliance requirement.
9. **Audit Logging**: No security audit trail mentioned. *Recommendation*: Log authentication events and data modifications.
10. **Class Categories/Subjects**: No organizational structure for grouping classes. *Recommendation*: Add optional subject/category tagging.
11. **Pagination**: Large lists may cause performance issues. *Recommendation*: Add pagination for class and resource lists.
12. **Offline Support**: No caching or offline strategy. *Recommendation*: Add service worker for basic offline dashboard view.

## Simplicity Principles Applied
Per the requirements for simple, usable implementation:
- Minimal buttons per screen—one primary action focus
- Clean UI with clear labels and ample white space
- No training required—intuitive navigation
- Mobile-first responsive design
- Single-click class joining
