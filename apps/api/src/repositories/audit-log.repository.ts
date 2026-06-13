import { prisma } from '@repo/database';
import type { AuditLog, Prisma } from '@repo/database';
import type { IAuditLogRepository, CreateAuditLogDto } from '../interfaces/repositories/IAuditLogRepository';

export class AuditLogRepository implements IAuditLogRepository {
  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    return prisma.auditLog.create({ data: dto as Prisma.AuditLogUncheckedCreateInput });
  }
}
