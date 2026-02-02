# Class Management

Creation, scheduling, editing, and deletion of online classes.

## ADDED Requirements

### Requirement: Create Online Class
Educators SHALL be able to create a new online class by providing the class name, topic, date, start time, and duration. The class creation form SHALL be simple with clear labels and completable in under 1 minute.

#### Scenario: Create single class
- **GIVEN** an educator user on the dashboard
- **WHEN** the educator clicks "Create Class" and fills in:
  - Class name (required)
  - Topic (optional)
  - Date (required)
  - Start time (required)
  - Duration in minutes (required)
- **THEN** the class is created
- **AND** a Google Meet link is automatically generated
- **AND** the class appears on the educator's dashboard
- **AND** enrolled students can see the class

#### Scenario: Required fields validation
- **GIVEN** an educator creating a class
- **WHEN** required fields are left empty
- **THEN** the form shows validation errors
- **AND** the class is not created until all required fields are filled

#### Scenario: Past date prevention
- **GIVEN** an educator creating a class
- **WHEN** a date/time in the past is selected
- **THEN** an error message is shown "Class cannot be scheduled in the past"
- **AND** the class is not created

### Requirement: Recurring Classes
Educators SHALL be able to create classes that repeat on a schedule (daily, weekly, or on specific days). This SHALL create multiple class instances according to the pattern.

#### Scenario: Create weekly recurring class
- **GIVEN** an educator creating a class
- **WHEN** the educator selects "Weekly" recurrence and an end date
- **THEN** multiple class instances are created for each week until the end date
- **AND** each instance has its own Google Meet link
- **AND** all instances appear on the dashboard

#### Scenario: Create daily recurring class
- **GIVEN** an educator creating a class
- **WHEN** the educator selects "Daily" recurrence and an end date
- **THEN** class instances are created for each day until the end date
- **AND** weekends can optionally be excluded

#### Scenario: Custom recurrence
- **GIVEN** an educator creating a class
- **WHEN** the educator selects specific days (e.g., Monday, Wednesday, Friday)
- **THEN** class instances are created only on the selected days
- **AND** the pattern repeats until the end date

### Requirement: Edit Class
Educators SHALL be able to edit the details of their classes. When a class is edited, enrolled participants SHALL be notified of the changes.

#### Scenario: Edit class details
- **GIVEN** an educator viewing their class
- **WHEN** the educator changes the class name, topic, or description
- **THEN** the changes are saved
- **AND** the updated information is displayed immediately
- **AND** enrolled students receive a notification

#### Scenario: Reschedule class
- **GIVEN** an educator viewing their class
- **WHEN** the educator changes the date or time
- **THEN** the class is rescheduled
- **AND** all enrolled students receive an email notification
- **AND** the Google Meet link remains the same

#### Scenario: Edit recurring class instance
- **GIVEN** an educator viewing one instance of a recurring class
- **WHEN** the educator edits that instance
- **THEN** the user is asked "Edit this class only" or "Edit all future classes"
- **AND** changes are applied according to selection

### Requirement: Delete Class
Educators SHALL be able to delete their classes. Deletion SHALL require confirmation and notify enrolled participants.

#### Scenario: Delete single class
- **GIVEN** an educator viewing their class
- **WHEN** the educator clicks "Delete" and confirms
- **THEN** the class is removed from the system
- **AND** enrolled students receive a cancellation notification
- **AND** the Google Meet event is cancelled

#### Scenario: Delete confirmation
- **GIVEN** an educator attempting to delete a class
- **WHEN** the delete button is clicked
- **THEN** a confirmation dialog appears "Are you sure you want to delete this class?"
- **AND** the class is only deleted if the educator confirms

#### Scenario: Delete recurring class
- **GIVEN** an educator deleting one instance of a recurring class
- **WHEN** the educator confirms deletion
- **THEN** the user is asked "Delete this class only" or "Delete all future classes"
- **AND** appropriate classes are deleted based on selection

### Requirement: Student Enrollment
Students SHALL be able to view available classes and enroll in them. Educators SHALL see who is enrolled in their classes.

#### Scenario: Student enrolls in class
- **GIVEN** a student viewing an available class
- **WHEN** the student clicks "Enroll"
- **THEN** the student is added to the class
- **AND** the class appears on the student's dashboard
- **AND** the educator sees the student in the enrolled list

#### Scenario: Student unenrolls from class
- **GIVEN** a student enrolled in a class
- **WHEN** the student clicks "Unenroll" and confirms
- **THEN** the student is removed from the class
- **AND** the class no longer appears on the student's dashboard

#### Scenario: View enrolled students
- **GIVEN** an educator viewing their class
- **WHEN** the educator opens the class details
- **THEN** a list of enrolled students is displayed
- **AND** the total enrollment count is shown

### Requirement: Class Time Display
All class times SHALL be displayed in the user's local timezone. The system SHALL store times in UTC and convert for display.

#### Scenario: Timezone conversion
- **GIVEN** a class created at 2:00 PM Eastern Time
- **WHEN** a user in Pacific Time views the class
- **THEN** the class time is displayed as 11:00 AM Pacific Time
- **AND** the timezone is indicated next to the time

#### Scenario: Timezone detection
- **GIVEN** a new user logging in
- **WHEN** the user has not set a timezone preference
- **THEN** the system detects the browser's timezone
- **AND** uses it for all time displays
