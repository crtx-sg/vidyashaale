# Dashboard

Main user interface for viewing and navigating scheduled classes.

## ADDED Requirements

### Requirement: Main Dashboard View
The system SHALL display a clean, simple dashboard showing all scheduled classes relevant to the logged-in user. The dashboard SHALL load within 2 seconds.

#### Scenario: Educator dashboard
- **GIVEN** an educator user logs in
- **WHEN** the dashboard loads
- **THEN** all classes created by the educator are displayed
- **AND** today's classes are shown by default
- **AND** a "Create Class" button is visible

#### Scenario: Student dashboard
- **GIVEN** a student user logs in
- **WHEN** the dashboard loads
- **THEN** all classes the student is enrolled in are displayed
- **AND** today's classes are shown by default
- **AND** no "Create Class" button is visible

#### Scenario: Empty dashboard
- **GIVEN** a user with no scheduled classes
- **WHEN** the dashboard loads
- **THEN** a friendly message is displayed "No classes scheduled"
- **AND** appropriate action is suggested (create class for educators, browse classes for students)

### Requirement: Calendar View Toggle
The system SHALL allow users to switch between day view, week view, and month view using simple toggle buttons. The selected view SHALL persist across sessions.

#### Scenario: Day view
- **GIVEN** a user on the dashboard
- **WHEN** the user clicks the "Day" button
- **THEN** only classes for the current day are displayed
- **AND** classes are sorted chronologically by start time

#### Scenario: Week view
- **GIVEN** a user on the dashboard
- **WHEN** the user clicks the "Week" button
- **THEN** classes for the current week (Monday to Sunday) are displayed
- **AND** classes are grouped by day

#### Scenario: Month view
- **GIVEN** a user on the dashboard
- **WHEN** the user clicks the "Month" button
- **THEN** a calendar grid for the current month is displayed
- **AND** days with classes are visually indicated
- **AND** clicking a day shows that day's classes

#### Scenario: Navigate between periods
- **GIVEN** a user viewing any calendar view
- **WHEN** the user clicks next/previous arrows
- **THEN** the view updates to show the next/previous day, week, or month
- **AND** the user can navigate to any past or future date

### Requirement: Class Summary Cards
The dashboard SHALL display each class as a summary card showing the class name, scheduled time, educator name (for students), and a Join button when the class is about to start or in progress.

#### Scenario: Class card display
- **GIVEN** a class scheduled for the viewed time period
- **WHEN** the dashboard renders
- **THEN** a card is displayed with:
  - Class name
  - Topic (if set)
  - Start time and duration
  - Educator name (for student view)

#### Scenario: Join button visibility
- **GIVEN** a class starting within 15 minutes or currently in progress
- **WHEN** the user views the class card
- **THEN** a prominent "Join" button is displayed
- **AND** the button is highlighted or pulsing to draw attention

#### Scenario: Future class card
- **GIVEN** a class more than 15 minutes in the future
- **WHEN** the user views the class card
- **THEN** the "Join" button is not displayed
- **AND** the scheduled time is clearly shown

### Requirement: Dashboard Performance
The dashboard SHALL load completely within 2 seconds on a standard internet connection (10 Mbps). Initial render SHALL occur within 1 second.

#### Scenario: Fast initial load
- **GIVEN** a user navigating to the dashboard
- **WHEN** the page loads
- **THEN** the page skeleton appears within 500ms
- **AND** class data loads within 2 seconds
- **AND** no loading spinner is shown for more than 2 seconds

#### Scenario: Efficient data fetching
- **GIVEN** a user with many classes
- **WHEN** the dashboard loads
- **THEN** only classes for the visible time period are fetched
- **AND** additional classes are loaded when navigating to other periods

### Requirement: Mobile Dashboard
The dashboard SHALL be fully functional on mobile devices with screen widths of 320px and larger. All features SHALL be accessible via touch.

#### Scenario: Mobile layout
- **GIVEN** a user accessing the dashboard on a mobile device
- **WHEN** the screen width is less than 768px
- **THEN** the layout adapts to single-column view
- **AND** class cards stack vertically
- **AND** all buttons are at least 44px touch targets

#### Scenario: Mobile navigation
- **GIVEN** a user on mobile viewing the dashboard
- **WHEN** switching between day/week/month views
- **THEN** the view toggle is easily accessible
- **AND** swipe gestures navigate between days/weeks
