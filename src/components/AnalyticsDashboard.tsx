import React from 'react';
import AnalyticsSprintPage from '../../sprint-12-analytics/frontend/src/app/analytics/page';
import { Participant, SongRequest, ActivitySubmission, DoorPrizeCategory } from '../types';

interface AnalyticsDashboardProps {
  stats: any;
  participants: Participant[];
  songRequests: SongRequest[];
  activitySubmissions: ActivitySubmission[];
  doorPrizes: DoorPrizeCategory[];
}

export default function AnalyticsDashboard({}: AnalyticsDashboardProps) {
  return <AnalyticsSprintPage />;
}
