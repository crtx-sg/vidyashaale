# Assignment Management

Creation of assignments with due dates and student submission handling.

## ADDED Requirements

### Requirement: Create Assignment
Educators SHALL be able to create assignments for their classes with a title, description, and optional due date.

#### Scenario: Create assignment with due date
- **GIVEN** an educator viewing their class
- **WHEN** the educator opens the Assignments tab and clicks "Create Assignment"
- **AND** fills in title, description, and due date
- **THEN** the assignment is created and linked to the class
- **AND** enrolled students receive a notification
- **AND** the assignment appears in the student's assignment list

#### Scenario: Create assignment without due date
- **GIVEN** an educator creating an assignment
- **WHEN** the due date is left empty
- **THEN** the assignment is created with no due date
- **AND** no overdue warnings are ever shown for this assignment

#### Scenario: Due date validation
- **GIVEN** an educator creating an assignment
- **WHEN** a due date in the past is selected
- **THEN** an error is shown "Due date must be in the future"
- **AND** the assignment is not created

### Requirement: View Assignments
Students SHALL be able to view all assignments for their enrolled classes. Assignments SHALL be sortable by due date with clear overdue indicators.

#### Scenario: View class assignments
- **GIVEN** a student viewing a class they are enrolled in
- **WHEN** the student opens the Assignments tab
- **THEN** all assignments for that class are displayed
- **AND** assignments are sorted by due date (soonest first)
- **AND** each shows title, description preview, and due date

#### Scenario: Overdue indicator
- **GIVEN** an assignment with a past due date
- **WHEN** a student has not submitted
- **THEN** the assignment is marked "Overdue" in red
- **AND** it appears at the top of the list

#### Scenario: Submitted indicator
- **GIVEN** an assignment the student has submitted
- **WHEN** viewing the assignment list
- **THEN** the assignment shows "Submitted" in green
- **AND** the submission timestamp is displayed

### Requirement: Student Assignment Submission
Students SHALL be able to upload their completed assignments. Submission status SHALL be clearly visible and confirmable.

#### Scenario: Submit assignment
- **GIVEN** a student viewing an assignment
- **WHEN** the student uploads a file and clicks "Submit"
- **THEN** the file is stored in the configured storage backend
- **AND** the submission is linked to the student and assignment
- **AND** a confirmation message appears "Assignment submitted successfully"
- **AND** the timestamp of submission is recorded

#### Scenario: Resubmit assignment
- **GIVEN** a student who has already submitted an assignment
- **WHEN** the student uploads a new file
- **THEN** a confirmation asks "Replace existing submission?"
- **AND** if confirmed, the new file replaces the old one
- **AND** the submission timestamp updates

#### Scenario: Late submission
- **GIVEN** an assignment past its due date
- **WHEN** a student submits
- **THEN** the submission is accepted
- **AND** it is marked "Late" with a warning
- **AND** the educator sees the late status

### Requirement: Educator Submission Review
Educators SHALL be able to view all submissions for their assignments. The submission list SHALL show student names, submission times, and allow file downloads.

#### Scenario: View submissions list
- **GIVEN** an educator viewing their assignment
- **WHEN** the educator opens the Submissions section
- **THEN** a list of all enrolled students is shown
- **AND** submitted students show file name and timestamp
- **AND** students who haven't submitted show "Not submitted"

#### Scenario: Download submission
- **GIVEN** an educator viewing submissions
- **WHEN** the educator clicks "Download" on a submission
- **THEN** the student's submitted file downloads
- **AND** the filename includes the student name

#### Scenario: Download all submissions
- **GIVEN** an educator viewing an assignment with multiple submissions
- **WHEN** the educator clicks "Download All"
- **THEN** a ZIP file containing all submissions downloads
- **AND** files are named with student names

### Requirement: Assignment Due Date Reminders
Students SHALL receive email reminders 24 hours before an assignment is due if they have not yet submitted. Reminders SHALL be optional in user settings.

#### Scenario: Due date reminder sent
- **GIVEN** a student enrolled in a class with an assignment due in 24 hours
- **WHEN** the student has not submitted
- **THEN** an email reminder is sent
- **AND** the email includes assignment title, class name, and due date

#### Scenario: Reminder not sent if submitted
- **GIVEN** a student who has already submitted
- **WHEN** the 24-hour reminder check runs
- **THEN** no reminder email is sent

#### Scenario: Opt out of reminders
- **GIVEN** a student with assignment reminders disabled in settings
- **WHEN** any reminder would be sent
- **THEN** the reminder is skipped

### Requirement: Edit and Delete Assignment
Educators SHALL be able to edit assignment details or delete assignments. Students SHALL be notified of significant changes.

#### Scenario: Edit assignment
- **GIVEN** an educator viewing their assignment
- **WHEN** the educator edits the title, description, or due date
- **THEN** the changes are saved
- **AND** students see the updated information

#### Scenario: Extend due date
- **GIVEN** an educator editing an assignment
- **WHEN** the due date is extended
- **THEN** all students (including those who submitted) are notified
- **AND** previously "late" submissions are re-evaluated

#### Scenario: Delete assignment
- **GIVEN** an educator viewing their assignment
- **WHEN** the educator clicks "Delete" and confirms
- **THEN** the assignment and all submissions are deleted
- **AND** students receive a notification
- **AND** submitted files are removed from storage
