import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { NotificationEntity, AuditLogEntity, ClusterPerformanceMetricEntity } from './telemetry.entity';

@Injectable()
export class TelemetryService {
  private notifications: NotificationEntity[] = [];
  private auditLogs: AuditLogEntity[] = [];
  private metrics: ClusterPerformanceMetricEntity[] = [];

  constructor() {
    this.seedInitialTelemetryData();
  }

  private seedInitialTelemetryData() {
    // 1. Seed default DevOps metrics
    this.metrics.push({
      id: 'metric-1',
      nodeId: 'node-aws-ecs-01',
      activeWebsocketConnections: 1048,
      redisCacheHitRate: 94.20,
      dbPoolActiveConnections: 14,
      queueLatencyMs: 12,
      recordedAt: new Date()
    });

    // 2. Seed initial audit trails
    this.auditLogs.push(
      {
        id: 'log-101',
        timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        actorId: 'System',
        role: 'System Engine',
        action: 'DATABASE_INITIALIZATION',
        details: 'EventHub database storage initialized with default configurations, point rules, and door prize thresholds.',
        severity: 'SUCCESS',
        ipAddress: '127.0.0.1'
      },
      {
        id: 'log-102',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        actorId: 'super_admin_01',
        role: 'SUPER_ADMIN',
        action: 'SAAS_METRICS_PULSE',
        details: 'Cluster telemetry checked and performance indexes validated as healthy.',
        severity: 'INFO',
        ipAddress: '192.168.1.50'
      }
    );

    // 3. Seed initial participant notifications
    this.notifications.push(
      {
        id: 'notif-101',
        participantId: 'p-1',
        title: 'Points Ledger Updated',
        message: 'You have been awarded +5 points for submitting your feedback.',
        isRead: false,
        createdAt: new Date(Date.now() - 1200000)
      },
      {
        id: 'notif-102',
        participantId: 'p-1',
        title: 'Best Photo Spot Award!',
        message: 'Congratulations, you received +25 points for the Best Photo Spot Award.',
        isRead: true,
        createdAt: new Date(Date.now() - 600000)
      }
    );
  }

  // --- NOTIFICATION ENGINE ---
  async createNotification(participantId: string, title: string, message: string): Promise<NotificationEntity> {
    const notif: NotificationEntity = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      participantId,
      title,
      message,
      isRead: false,
      createdAt: new Date()
    };
    this.notifications.unshift(notif);
    this.logAuditEvent('System', 'SYSTEM', 'NOTIFICATION_SENT', `Notification dispatched to participant ${participantId}: "${title}"`, 'SUCCESS');
    return notif;
  }

  async getNotificationsByParticipant(participantId: string): Promise<NotificationEntity[]> {
    return this.notifications
      .filter(n => n.participantId === participantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationRead(notificationId: string): Promise<NotificationEntity> {
    const notif = this.notifications.find(n => n.id === notificationId);
    if (!notif) {
      throw new NotFoundException(`Notification with ID ${notificationId} not found.`);
    }
    notif.isRead = true;
    return notif;
  }

  async markAllReadByParticipant(participantId: string): Promise<void> {
    this.notifications
      .filter(n => n.participantId === participantId)
      .forEach(n => n.isRead = true);
  }

  // --- SECURITY AUDIT LEDGER ---
  async logAuditEvent(
    actorId: string,
    role: string,
    action: string,
    details: string,
    severity: AuditLogEntity['severity'],
    metadata?: Record<string, any>,
    ipAddress?: string
  ): Promise<AuditLogEntity> {
    const log: AuditLogEntity = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date(),
      actorId,
      role,
      action,
      details,
      severity,
      metadata,
      ipAddress: ipAddress || '127.0.0.1'
    };
    this.auditLogs.unshift(log);
    return log;
  }

  async getAuditLogs(
    severity?: string,
    search?: string,
    limit: number = 100
  ): Promise<AuditLogEntity[]> {
    let filtered = [...this.auditLogs];

    if (severity && severity !== 'ALL') {
      filtered = filtered.filter(l => l.severity === severity);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        l =>
          l.actorId.toLowerCase().includes(q) ||
          l.role.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }

    return filtered.slice(0, limit);
  }

  // --- CLUSTER SAAS PERFORMANCE MONITORING ---
  async getLatestMetrics(): Promise<ClusterPerformanceMetricEntity> {
    if (this.metrics.length === 0) {
      throw new NotFoundException('No telemetry metrics logged yet.');
    }
    return this.metrics[this.metrics.length - 1];
  }

  async recordNewMetrics(
    activeConnections: number,
    redisHitRate: number,
    dbPoolActive: number,
    queueLatMs: number
  ): Promise<ClusterPerformanceMetricEntity> {
    const newMetric: ClusterPerformanceMetricEntity = {
      id: `metric-${Date.now()}`,
      nodeId: 'node-aws-ecs-01',
      activeWebsocketConnections: activeConnections,
      redisCacheHitRate: redisHitRate,
      dbPoolActiveConnections: dbPoolActive,
      queueLatencyMs: queueLatMs,
      recordedAt: new Date()
    };
    this.metrics.push(newMetric);

    // Keep memory clean, slice to latest 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    return newMetric;
  }

  async triggerTelemetryPulse(): Promise<ClusterPerformanceMetricEntity> {
    // Generate organic pseudo-fluctuations around standard baseline parameters
    const activeConn = Math.floor(1000 + Math.random() * 120);
    const redisHit = parseFloat((92.0 + Math.random() * 5).toFixed(2));
    const dbPool = Math.floor(10 + Math.random() * 8);
    const queueLat = Math.floor(8 + Math.random() * 10);

    const updated = await this.recordNewMetrics(activeConn, redisHit, dbPool, queueLat);
    await this.logAuditEvent(
      'System-Telemetry',
      'SYSTEM',
      'TELEMETRY_PULSE',
      `Orchestrated dynamic telemetry check. Active connections: ${activeConn}, Redis cache hit rate: ${redisHit}%.`,
      'INFO'
    );
    return updated;
  }
}
