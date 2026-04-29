# Project Context

## Purpose
Vidyashaale is a simple and user-friendly online education platform that helps students and educators schedule classes, join video meetings, and share learning materials. Unlike general meeting tools, it is purpose-built for education needs.

## Tech Stack
- Frontend: ReactJS
- Backend: Node.js with Express
- Database: PostgreSQL (local Docker container by default; InsForge-hosted Postgres also supported)
- Video Meetings: Google Meet API (optional — service falls back to manual meeting links when not configured)
- File Storage: Configurable — local filesystem (default), AWS S3, or InsForge object storage
- Containers: Docker (Compose `containerized` profile gates app services so default `up` brings up only Postgres + Redis)
- Architecture: Microservices

## Project Conventions

### Code Style
- Use ESLint with Airbnb style guide for JavaScript/TypeScript
- Use Prettier for code formatting
- Component naming: PascalCase for React components
- File naming: kebab-case for files, PascalCase for components
- API naming: RESTful conventions with kebab-case URLs

### Architecture Patterns
- Microservices architecture with separate services for each domain
- API Gateway pattern for routing and security
- Repository pattern for database access
- Event-driven communication between services where appropriate
- Environment-based configuration for all services

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Minimum 80% code coverage for new code

### Git Workflow
- Main branch for production-ready code
- Feature branches: `feature/<change-id>`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Pull requests required for all changes

## Domain Context
- **Educator**: A user who creates and manages classes, uploads resources, reviews assignments
- **Student**: A user who attends classes, downloads resources, submits assignments
- **Administrator**: A user who manages the system, users, and settings
- **Class**: A scheduled online learning session with a Google Meet link
- **Resource**: Learning materials such as notes, readings, or assignments
- **Dashboard**: The main screen showing upcoming classes in day/week/month views

## Important Constraints
- Simple, minimal UI - users should not need training
- Page load times: Dashboard < 2 seconds, other pages < 3 seconds
- 99% availability during school hours (8 AM - 8 PM)
- Mobile-responsive design (320px minimum width)
- HTTPS only, JWT-based authentication
- GDPR/privacy compliance for user data

## External Dependencies
- Google Meet API for video conferencing (optional)
- SMTP service for email notifications (optional in dev — logs to console when SMTP_HOST is unset)
- File storage backend (configurable): local filesystem, AWS S3, or InsForge object storage
- InsForge (optional managed Postgres + object storage; default setup uses a local Postgres container)
