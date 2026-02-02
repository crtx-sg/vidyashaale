# User Authentication

User registration, login, password management, and role-based access control.

## ADDED Requirements

### Requirement: User Registration
The system SHALL allow new users to create an account by providing their name, email address, password, and role (student or educator). A confirmation email SHALL be sent upon successful registration.

#### Scenario: Successful registration
- **GIVEN** a user with a valid email not already registered
- **WHEN** the user submits name, email, password, confirm password, and role
- **THEN** a new account is created
- **AND** a confirmation email is sent to the user's email address
- **AND** the user is redirected to the login page with a success message

#### Scenario: Registration with existing email
- **GIVEN** an email address already registered in the system
- **WHEN** a user attempts to register with that email
- **THEN** registration fails with an error message "Email already registered"
- **AND** no duplicate account is created

#### Scenario: Password mismatch
- **GIVEN** a user filling out the registration form
- **WHEN** the password and confirm password fields do not match
- **THEN** registration fails with an error message "Passwords do not match"

### Requirement: User Login
The system SHALL allow registered users to log in using their email and password. Upon successful login, the user SHALL be redirected to their dashboard.

#### Scenario: Successful login
- **GIVEN** a registered user with valid credentials
- **WHEN** the user enters correct email and password
- **THEN** the user is authenticated
- **AND** a JWT access token is generated (1 hour expiry)
- **AND** a refresh token is generated (7 days expiry)
- **AND** the user is redirected to the dashboard

#### Scenario: Invalid credentials
- **GIVEN** a user attempting to log in
- **WHEN** the email or password is incorrect
- **THEN** login fails with a generic error message "Invalid email or password"
- **AND** no token is generated

#### Scenario: Unverified email
- **GIVEN** a registered user who has not verified their email
- **WHEN** the user attempts to log in
- **THEN** login fails with message "Please verify your email before logging in"

### Requirement: Password Reset
The system SHALL allow users to reset their password if forgotten. A secure reset link SHALL be sent to the user's registered email address.

#### Scenario: Request password reset
- **GIVEN** a registered user who forgot their password
- **WHEN** the user enters their email on the password reset page
- **THEN** a password reset email with a secure link is sent
- **AND** the link expires after 1 hour
- **AND** a confirmation message is shown regardless of whether email exists (security)

#### Scenario: Complete password reset
- **GIVEN** a user with a valid password reset link
- **WHEN** the user clicks the link and enters a new password
- **THEN** the password is updated
- **AND** all existing sessions are invalidated
- **AND** the user is redirected to login with success message

#### Scenario: Expired reset link
- **GIVEN** a password reset link older than 1 hour
- **WHEN** a user clicks the expired link
- **THEN** an error message is shown "Reset link has expired"
- **AND** the user is prompted to request a new reset link

### Requirement: Session Management
The system SHALL maintain user sessions using JWT tokens. Access tokens SHALL expire after 1 hour and refresh tokens after 7 days of inactivity. Sessions SHALL expire after 24 hours of inactivity.

#### Scenario: Token refresh
- **GIVEN** a logged-in user with an expired access token
- **WHEN** the user has a valid refresh token
- **THEN** a new access token is generated automatically
- **AND** the user session continues without interruption

#### Scenario: Session expiry
- **GIVEN** a user inactive for more than 24 hours
- **WHEN** the user attempts any authenticated action
- **THEN** the session is invalidated
- **AND** the user is redirected to the login page

### Requirement: Role-Based Access Control
The system SHALL enforce role-based permissions for Administrator, Educator, and Student roles. Each role SHALL have specific capabilities as defined.

#### Scenario: Administrator capabilities
- **GIVEN** a user with the Administrator role
- **WHEN** accessing the system
- **THEN** the user can manage all users, classes, and system settings
- **AND** the user can view all data across the platform

#### Scenario: Educator capabilities
- **GIVEN** a user with the Educator role
- **WHEN** accessing the system
- **THEN** the user can create, edit, and delete their own classes
- **AND** the user can upload resources and create assignments
- **AND** the user can view submissions for their classes
- **AND** the user cannot access other educators' classes or admin functions

#### Scenario: Student capabilities
- **GIVEN** a user with the Student role
- **WHEN** accessing the system
- **THEN** the user can view classes they are enrolled in
- **AND** the user can join class meetings
- **AND** the user can download resources and submit assignments
- **AND** the user cannot create or edit classes

### Requirement: Secure Password Storage
The system SHALL store passwords securely using bcrypt hashing with a minimum cost factor of 10. Plain text passwords SHALL never be stored or logged.

#### Scenario: Password hashing
- **GIVEN** a user registering or changing their password
- **WHEN** the password is saved to the database
- **THEN** only the bcrypt hash is stored
- **AND** the original password cannot be retrieved from the hash

### Requirement: HTTPS Enforcement
The system SHALL enforce HTTPS for all connections. All data transmitted between client and server SHALL be encrypted.

#### Scenario: HTTP redirect
- **GIVEN** a user accessing the system via HTTP
- **WHEN** any page is requested
- **THEN** the request is redirected to HTTPS
- **AND** HSTS headers are set to prevent future HTTP requests
