# Meeting Integration

Google Meet integration for video conferencing in classes.

## ADDED Requirements

### Requirement: Automatic Meeting Link Generation
When a class is created, the system SHALL automatically create a Google Meet meeting and store the meeting link. Users SHALL NOT need to manually create or enter meeting links.

#### Scenario: Successful meeting creation
- **GIVEN** an educator creates a new class
- **WHEN** the class is saved
- **THEN** the system calls the Google Calendar API
- **AND** a calendar event with Google Meet is created
- **AND** the Meet link is stored with the class record
- **AND** the process completes within 5 seconds

#### Scenario: Meeting link displayed
- **GIVEN** a class with a generated Meet link
- **WHEN** a user views the class details
- **THEN** the Meet link is displayed
- **AND** a "Join" button opens the link in a new tab

### Requirement: Join Class with One Click
Each class SHALL have a clearly visible Join button. Clicking this button SHALL open the Google Meet session in a new browser tab without additional steps.

#### Scenario: Join class meeting
- **GIVEN** a user viewing a class that is starting soon or in progress
- **WHEN** the user clicks the "Join" button
- **THEN** Google Meet opens in a new browser tab
- **AND** the user lands on the Meet waiting room or directly in the meeting
- **AND** no additional authentication is required if user is signed into Google

#### Scenario: Join from dashboard
- **GIVEN** a class card on the dashboard showing "Join" button
- **WHEN** the user clicks "Join"
- **THEN** the same one-click join behavior occurs
- **AND** the user is not redirected away from the dashboard

### Requirement: Meeting API Error Handling
The system SHALL gracefully handle Google Meet API failures. If automatic link generation fails, educators SHALL be able to manually enter a meeting link.

#### Scenario: API retry on failure
- **GIVEN** the Google Meet API returns an error
- **WHEN** creating a class
- **THEN** the system retries up to 3 times with exponential backoff
- **AND** waits 1s, 2s, then 4s between retries

#### Scenario: Manual link fallback
- **GIVEN** all API retry attempts have failed
- **WHEN** the class creation process continues
- **THEN** the class is created without a meeting link
- **AND** the educator sees a message "Meeting link could not be generated. You can add one manually."
- **AND** an "Add Meeting Link" button is displayed

#### Scenario: Add manual meeting link
- **GIVEN** a class without a meeting link
- **WHEN** the educator enters a meeting URL and saves
- **THEN** the link is stored with the class
- **AND** the "Join" button becomes available
- **AND** the link is marked as "manually added"

### Requirement: Meeting Link Validation
Manually entered meeting links SHALL be validated to ensure they are valid URLs and preferably Google Meet links.

#### Scenario: Valid Google Meet link
- **GIVEN** an educator entering a manual meeting link
- **WHEN** the link is a valid Google Meet URL (meet.google.com/...)
- **THEN** the link is accepted and saved

#### Scenario: Other video meeting link
- **GIVEN** an educator entering a non-Google Meet link
- **WHEN** the link is a valid URL (Zoom, Teams, etc.)
- **THEN** a warning is shown "This is not a Google Meet link. Continue anyway?"
- **AND** the link can still be saved if confirmed

#### Scenario: Invalid URL
- **GIVEN** an educator entering an invalid URL
- **WHEN** the link fails URL validation
- **THEN** an error is shown "Please enter a valid URL"
- **AND** the link is not saved

### Requirement: Meeting Exit Information
The class details page SHALL inform users how to exit the meeting using Google Meet's built-in leave button. The Vidyashaale system does not control meeting exit.

#### Scenario: Exit instructions display
- **GIVEN** a user viewing a class they are about to join
- **WHEN** the class details are displayed
- **THEN** a note explains "To leave the meeting, use the red 'Leave call' button in Google Meet"
- **AND** this is shown in a non-intrusive way

### Requirement: Meeting Link Uniqueness
Each class instance SHALL have its own unique Google Meet link. Recurring classes SHALL have separate links for each occurrence.

#### Scenario: Recurring class links
- **GIVEN** an educator creates a weekly recurring class for 4 weeks
- **WHEN** all class instances are created
- **THEN** each of the 4 instances has a unique Google Meet link
- **AND** participants join the correct meeting for each date
