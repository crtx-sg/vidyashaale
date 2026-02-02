import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { google } from 'googleapis';

const app = express();
const PORT = process.env.PORT || 8083;

app.use(cors());
app.use(express.json());

// Check if Google credentials are properly configured
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

// Helper to check if a value is a real credential (not a placeholder)
const isValidCredential = (value: string | undefined): boolean => {
  if (!value || value.length === 0) return false;
  // Check for common placeholder patterns
  const placeholders = ['your-', 'change-', 'replace-', 'example', 'placeholder', 'xxx', 'TODO'];
  return !placeholders.some(p => value.toLowerCase().includes(p.toLowerCase()));
};

const GOOGLE_CONFIGURED =
  isValidCredential(GOOGLE_CLIENT_ID) &&
  isValidCredential(GOOGLE_CLIENT_SECRET) &&
  isValidCredential(GOOGLE_REFRESH_TOKEN);

// Google OAuth2 client (only initialize if configured)
let calendar: ReturnType<typeof google.calendar> | null = null;

if (GOOGLE_CONFIGURED) {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });
  calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  console.log('Google Calendar API configured');
} else {
  console.log('Google Calendar API not configured - using development mode');
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'meeting' });
});

// Create Google Meet link
app.post('/meetings/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, startTime, durationMinutes } = req.body;

    if (!title || !startTime || !durationMinutes) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'title, startTime, and durationMinutes are required',
        },
      });
    }

    // Check if Google credentials are configured
    if (!GOOGLE_CONFIGURED || !calendar) {
      // Return a placeholder for development
      console.log('[DEV] Creating placeholder meeting link (Google not configured)');
      return res.json({
        success: true,
        data: {
          meetingLink: null,
          eventId: null,
        },
        message: 'Development mode: Google Meet not configured. Add meeting link manually.',
      });
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const event = await calendar.events.insert({
          calendarId: 'primary',
          conferenceDataVersion: 1,
          requestBody: {
            summary: title,
            start: {
              dateTime: startDateTime.toISOString(),
              timeZone: 'UTC',
            },
            end: {
              dateTime: endDateTime.toISOString(),
              timeZone: 'UTC',
            },
            conferenceData: {
              createRequest: {
                requestId: `vidyashaale-${Date.now()}-${attempt}`,
                conferenceSolutionKey: {
                  type: 'hangoutsMeet',
                },
              },
            },
          },
        });

        const meetingLink = event.data.conferenceData?.entryPoints?.find(
          e => e.entryPointType === 'video'
        )?.uri;

        return res.json({
          success: true,
          data: {
            meetingLink,
            eventId: event.data.id,
          },
        });
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt + 1} failed:`, error);

        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAYS[attempt]);
        }
      }
    }

    // All retries failed
    console.error('All retries failed:', lastError);
    return res.status(503).json({
      success: false,
      error: {
        code: 'MEETING_CREATION_FAILED',
        message: 'Failed to create meeting link after multiple attempts',
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete Google Calendar event (when class is deleted)
app.delete('/meetings/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    if (!GOOGLE_CONFIGURED || !calendar) {
      return res.json({
        success: true,
        message: 'Development mode: event deletion skipped',
      });
    }

    await calendar!.events.delete({
      calendarId: 'primary',
      eventId,
    });

    res.json({
      success: true,
      message: 'Meeting event deleted',
    });
  } catch (error) {
    next(error);
  }
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

app.listen(PORT, () => {
  console.log(`Meeting service running on port ${PORT}`);
});

export { app };
