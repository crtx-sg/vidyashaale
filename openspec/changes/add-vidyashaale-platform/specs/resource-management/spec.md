# Resource Management

Upload, organization, and download of class learning materials.

## ADDED Requirements

### Requirement: Upload Class Resources
Educators SHALL be able to upload resources for each class including topic descriptions, reading materials (PDF, Word), lecture notes, and other learning materials. Maximum file size SHALL be 50MB per file.

#### Scenario: Upload single file
- **GIVEN** an educator viewing their class resources section
- **WHEN** the educator selects a file and clicks "Upload"
- **THEN** the file is uploaded to the configured storage backend
- **AND** upload progress is displayed
- **AND** the file appears in the resources list upon completion

#### Scenario: File size limit
- **GIVEN** an educator attempting to upload a file
- **WHEN** the file exceeds 50MB
- **THEN** an error is shown "File too large. Maximum size is 50MB."
- **AND** the upload is not started

#### Scenario: Upload multiple files
- **GIVEN** an educator in the resources section
- **WHEN** the educator selects multiple files
- **THEN** all files are uploaded simultaneously (up to 3 concurrent)
- **AND** individual progress is shown for each file
- **AND** all files appear in the list when complete

#### Scenario: Assign resource type
- **GIVEN** an educator uploading a resource
- **WHEN** the upload dialog is shown
- **THEN** the educator can select a type: Reading, Notes, Assignment, or Other
- **AND** the type is saved with the resource for organization

### Requirement: View and Download Resources
Students SHALL be able to view the list of resources for each class and download them. Resources SHALL be organized by type for easy discovery.

#### Scenario: View resource list
- **GIVEN** a student enrolled in a class
- **WHEN** the student opens the Resources tab
- **THEN** all resources for the class are displayed
- **AND** resources are grouped by type (Readings, Notes, Assignments, Other)
- **AND** each resource shows name, file size, and upload date

#### Scenario: Download resource
- **GIVEN** a student viewing a resource
- **WHEN** the student clicks the "Download" button
- **THEN** the file downloads to the user's device
- **AND** the original filename is preserved
- **AND** download works regardless of storage backend

#### Scenario: Preview supported files
- **GIVEN** a user viewing a PDF or image resource
- **WHEN** the user clicks on the resource name
- **THEN** a preview modal opens showing the file content
- **AND** a download button is available in the preview

### Requirement: Resource Deletion
Educators SHALL be able to delete resources they have uploaded. Deletion SHALL require confirmation.

#### Scenario: Delete resource
- **GIVEN** an educator viewing their class resources
- **WHEN** the educator clicks "Delete" on a resource and confirms
- **THEN** the resource is removed from the system
- **AND** the file is deleted from storage
- **AND** the resource list updates immediately

#### Scenario: Delete confirmation
- **GIVEN** an educator attempting to delete a resource
- **WHEN** the delete button is clicked
- **THEN** a confirmation dialog appears "Delete [filename]?"
- **AND** the resource is only deleted if confirmed

### Requirement: Configurable File Storage
The system SHALL support multiple file storage backends configurable via environment variables. Default SHALL be local filesystem for development simplicity.

#### Scenario: Local storage
- **GIVEN** STORAGE_TYPE is set to LOCAL
- **WHEN** files are uploaded
- **THEN** files are stored in the STORAGE_LOCAL_PATH directory
- **AND** files are organized by class ID subdirectories
- **AND** files can be downloaded directly from the filesystem

#### Scenario: AWS S3 storage
- **GIVEN** STORAGE_TYPE is set to S3
- **WHEN** files are uploaded
- **THEN** files are stored in the configured S3 bucket
- **AND** download URLs are pre-signed with 1-hour expiry
- **AND** files are organized by class ID prefixes

#### Scenario: MinIO storage
- **GIVEN** STORAGE_TYPE is set to MINIO
- **WHEN** files are uploaded
- **THEN** files are stored in the MinIO server at STORAGE_ENDPOINT
- **AND** the same S3-compatible API is used
- **AND** pre-signed download URLs work correctly

### Requirement: File Type Validation
The system SHALL validate uploaded files to prevent dangerous file types. Allowed types SHALL include common document and media formats.

#### Scenario: Allowed file types
- **GIVEN** an educator uploading a file
- **WHEN** the file is a PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG, GIF, or MP4
- **THEN** the upload is allowed

#### Scenario: Blocked file types
- **GIVEN** an educator uploading a file
- **WHEN** the file is an executable (.exe, .bat, .sh, .msi)
- **THEN** an error is shown "File type not allowed for security reasons"
- **AND** the upload is rejected

#### Scenario: MIME type verification
- **GIVEN** an educator uploading a file
- **WHEN** the file extension does not match the MIME type
- **THEN** a warning is shown "File type mismatch detected"
- **AND** the upload can proceed with educator confirmation

### Requirement: Storage Quota
Each class SHALL have a maximum total storage of 500MB for resources. Educators SHALL see their storage usage.

#### Scenario: Storage usage display
- **GIVEN** an educator viewing class resources
- **WHEN** the resources section loads
- **THEN** current storage usage is displayed (e.g., "125MB / 500MB used")
- **AND** a visual progress bar shows the percentage

#### Scenario: Quota exceeded
- **GIVEN** a class with 490MB of resources
- **WHEN** an educator attempts to upload a 20MB file
- **THEN** an error is shown "Upload would exceed storage limit"
- **AND** the upload is blocked
- **AND** suggestion to delete old resources is shown
