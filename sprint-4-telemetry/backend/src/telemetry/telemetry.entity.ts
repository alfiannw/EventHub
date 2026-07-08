export interface NotificationEntity {
  id: string;
  participantId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface AuditLogEntity {
  id: string;
  timestamp: Date;
  actorId: string;
  role: string;
  action: string;
  details: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export interface ClusterPerformanceMetricEntity {
  id: string;
  nodeId: string;
  activeWebsocketConnections: number;
  redisCacheHitRate: number;
  dbPoolActiveConnections: number;
  queueLatencyMs: number;
  recordedAt: Date;
}
