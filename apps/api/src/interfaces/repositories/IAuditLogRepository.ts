import type { AuditLog, AuditAction } from '@repo/database';

export interface CreateAuditLogDto {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogRepository {
  create(dto: CreateAuditLogDto): Promise<AuditLog>;
}
