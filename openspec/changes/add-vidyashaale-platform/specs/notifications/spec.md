# Notifications

Email notifications and reminders for classes and assignments.

## ADDED Requirements

### Requirement: Class Reminder Emails
The system SHALL send email reminders to enrolled participants 15 minutes before a class starts. Users SHALL be able to disable reminders in their settings.

#### Scenario: Reminder sent before class
- **GIVEN** a class starting in 15 minutes
- **WHEN** the reminder scheduler runs
- **THEN** an email is sent to all enrolled students
- **AND** an email is sent to the educator
- **AND** the email includes class name, time, and Join link

#### Scenario: Reminder email content
- **GIVEN** a class reminder being sent
- **WHEN** the email is composed
- **THEN** the email includes:
  - Subject: "Reminder: [Class Name] starts in 15 minutes"
  - Class name and topic
  - Start time in recipient's timezone
  - Direct "Join Meeting" button/link
  - Educator name (for students)

#### Scenario: Reminder opt-out
- **GIVEN** a user with class reminders disabled in settings
- **WHEN** a reminder would be sent
- **THEN** no email is sent to that user
- **AND** other enrolled users still receive reminders

### Requirement: Class Creation Notification
When a new class is created, enrolled students SHALL receive an email notification with class details.

#### Scenario: New class notification
- **GIVEN** an educator creates a new class
- **WHEN** students are enrolled (or auto-enrolled)
- **THEN** enrolled students receive an email
- **AND** the email includes class name, date/time, and topic

#### Scenario: Recurring class notification
- **GIVEN** an educator creates a recurring class
- **WHEN** the classes are created
- **THEN** a single summary email is sent listing all dates
- **AND** individual reminders are still sent before each class

### Requirement: Class Update Notification
When a class is edited, enrolled participants SHALL receive an email notification about the changes.

#### Scenario: Class rescheduled notification
- **GIVEN** an educator changes a class date or time
- **WHEN** the change is saved
- **THEN** all enrolled students receive an email
- **AND** the email shows old time and new time
- **AND** the subject indicates "Class Rescheduled"

#### Scenario: Class cancelled notification
- **GIVEN** an educator deletes a class
- **WHEN** the deletion is confirmed
- **THEN** all enrolled students receive an email
- **AND** the email subject is "Class Cancelled: [Class Name]"
- **AND** the email includes the original scheduled date/time

### Requirement: Assignment Notification
When a new assignment is created, enrolled students SHALL receive an email with assignment details and due date.

#### Scenario: New assignment notification
- **GIVEN** an educator creates an assignment
- **WHEN** the assignment is saved
- **THEN** enrolled students receive an email
- **AND** the email includes title, description, and due date
- **AND** a link to view the assignment is included

#### Scenario: Assignment reminder
- **GIVEN** an assignment due in 24 hours
- **WHEN** a student has not submitted
- **THEN** a reminder email is sent
- **AND** the email includes time remaining and submission link

### Requirement: Notification Preferences
Users SHALL be able to configure their notification preferences to enable or disable different notification types.

#### Scenario: View notification settings
- **GIVEN** a user opens their account settings
- **WHEN** the notification preferences section loads
- **THEN** the following toggles are displayed:
  - Class reminders (15 min before)
  - Assignment due date reminders
  - Class updates (reschedule/cancel)
- **AND** current settings are shown

#### Scenario: Update notification preferences
- **GIVEN** a user toggling a notification preference
- **WHEN** the setting is changed
- **THEN** the preference is saved immediately
- **AND** future notifications respect the new setting

#### Scenario: Default preferences
- **GIVEN** a newly registered user
- **WHEN** the account is created
- **THEN** all notification types are enabled by default

### Requirement: Email Delivery Reliability
The system SHALL ensure reliable email delivery using a queue-based system. Failed emails SHALL be retried.

#### Scenario: Email queuing
- **GIVEN** a notification needs to be sent
- **WHEN** the notification is triggered
- **THEN** an email job is added to the queue
- **AND** the job is processed asynchronously
- **AND** the triggering action is not blocked by email sending

#### Scenario: Email retry on failure
- **GIVEN** an email fails to send (SMTP error)
- **WHEN** the delivery fails
- **THEN** the job is retried up to 3 times
- **AND** retries occur with increasing delays (1 min, 5 min, 15 min)

#### Scenario: Email failure logging
- **GIVEN** an email fails after all retries
- **WHEN** the final attempt fails
- **THEN** the failure is logged for administrator review
- **AND** the user is not blocked from using the system

### Requirement: Email Templates
All notification emails SHALL use consistent, professional templates with the Vidyashaale branding.

#### Scenario: Email branding
- **GIVEN** any notification email is sent
- **WHEN** the email is rendered
- **THEN** it includes the Vidyashaale logo
- **AND** uses consistent colors and typography
- **AND** includes footer with unsubscribe/settings link

#### Scenario: Mobile-friendly emails
- **GIVEN** a user reading email on mobile
- **WHEN** the email is displayed
- **THEN** the layout adapts to mobile screens
- **AND** buttons are easily tappable
- **AND** text is readable without zooming
