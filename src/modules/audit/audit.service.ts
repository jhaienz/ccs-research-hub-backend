import { Inject, Injectable } from '@nestjs/common';
import { desc, count } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.provider.js';
import type { DrizzleDB } from '../../database/drizzle.provider.js';
import { auditLogs } from '../../database/schema/audit-logs.js';

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

    const [data, [{ total }]] = await Promise.all([
      this.db.query.auditLogs.findMany({
        with: {
          admin: { columns: { id: true, firstName: true, lastName: true, email: true } },
          research: { columns: { id: true, title: true } },
        },
        limit,
        offset,
        orderBy: (a, { desc }) => [desc(a.createdAt)],
      }),
      this.db.select({ total: count() }).from(auditLogs),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
