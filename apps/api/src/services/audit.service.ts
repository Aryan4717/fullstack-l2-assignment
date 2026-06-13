import type { Request } from 'express';
import { AuditAction } from '@repo/database';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import type { CreateAuditLogDto } from '../interfaces/repositories/IAuditLogRepository';
import { Sentry } from '../lib/sentry.client';

export type AuditEntry = Omit<CreateAuditLogDto, 'ipAddress' | 'userAgent'> & {
  req?: Request;
};

class AuditService {
  private readonly repo = new AuditLogRepository();

  log(entry: AuditEntry): void {
    const { req, ...rest } = entry;
    const dto: CreateAuditLogDto = {
      ...rest,
      ipAddress: req ? (req.ip ?? req.socket?.remoteAddress) : undefined,
      userAgent: req ? (req.headers['user-agent'] ?? undefined) : undefined,
    };

    this.repo.create(dto).catch((err) => {
      Sentry.captureException(err, { tags: { feature: 'audit-log' } });
    });
  }
}

let instance: AuditService | null = null;

export function getAuditService(): AuditService {
  instance ??= new AuditService();
  return instance;
}

export { AuditAction };
