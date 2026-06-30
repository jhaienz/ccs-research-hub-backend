import { Inject, Injectable } from '@nestjs/common';
import { eq, desc, count } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider.js';
import type { DrizzleDB } from '../../database/drizzle.provider.js';
import { auditLogs } from '../../database/schema/audit-logs.js';
import { users } from '../../database/schema/users.js';
import { researches } from '../../database/schema/researches.js';

@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async log(
    adminId: string,
    action: 'approve' | 'reject' | 'delete',
    researchId: string,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({ adminId, action, researchId, meta });
    } catch (err) {
      console.error('[AuditService] Failed to write audit log:', err);
    }
  }

  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const [rows, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          meta: auditLogs.meta,
          createdAt: auditLogs.createdAt,
          adminFirstName: users.firstName,
          adminLastName: users.lastName,
          researchId: researches.id,
          researchTitle: researches.title,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.adminId, users.id))
        .leftJoin(researches, eq(auditLogs.researchId, researches.id))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(auditLogs),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        action: row.action,
        meta: row.meta,
        createdAt: row.createdAt,
        admin: row.adminFirstName
          ? { firstName: row.adminFirstName, lastName: row.adminLastName! }
          : null,
        research: row.researchId
          ? { id: row.researchId, title: row.researchTitle! }
          : null,
      })),
      meta: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }
}
