import React from 'react';
import { Link } from 'react-router-dom';
import { format, isPast, isFuture, differenceInMinutes } from 'date-fns';
import './ClassCard.css';

interface ClassCardProps {
  id: string;
  name: string;
  topic?: string;
  startTime: string;
  durationMinutes: number;
  educatorName?: string;
  meetingLink?: string;
}

const ClassCard: React.FC<ClassCardProps> = ({
  id,
  name,
  topic,
  startTime,
  durationMinutes,
  educatorName,
  meetingLink,
}) => {
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  const now = new Date();

  const isStartingSoon = isFuture(startDate) && differenceInMinutes(startDate, now) <= 15;
  const isInProgress = isPast(startDate) && isFuture(endDate);
  const isPastClass = isPast(endDate);

  const showJoinButton = (isStartingSoon || isInProgress) && meetingLink;

  return (
    <div className={`class-card ${isPastClass ? 'past' : ''}`}>
      <div className="class-card-header">
        <Link to={`/classes/${id}`} className="class-name">
          {name}
        </Link>
        {isInProgress && <span className="badge live">Live</span>}
        {isStartingSoon && <span className="badge soon">Starting Soon</span>}
      </div>

      {topic && <p className="class-topic">{topic}</p>}

      <div className="class-time">
        <span>{format(startDate, 'MMM d, yyyy')}</span>
        <span>
          {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
        </span>
      </div>

      {educatorName && <p className="educator-name">By {educatorName}</p>}

      <div className="class-card-actions">
        <Link to={`/classes/${id}`} className="btn btn-outline">
          View Details
        </Link>
        {showJoinButton && (
          <a
            href={meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary join-btn"
          >
            Join Class
          </a>
        )}
      </div>
    </div>
  );
};

export default ClassCard;
