import { Test } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { DRIZZLE } from '../../database/drizzle.provider';

describe('AuditService', () => {
  let service: AuditService;
  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockResolvedValue(undefined),
    query: { auditLogs: { findMany: jest.fn().mockResolvedValue([]) } },
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockResolvedValue([{ total: 0 }]),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();
    service = module.get(AuditService);
  });

  it('logs an approve action without throwing', async () => {
    mockDb.values.mockResolvedValueOnce(undefined);
    await expect(service.log('admin-id', 'approve', 'research-id')).resolves.not.toThrow();
  });

  it('does not throw when DB insert fails', async () => {
    mockDb.values.mockRejectedValueOnce(new Error('DB down'));
    await expect(service.log('admin-id', 'reject', 'research-id')).resolves.not.toThrow();
  });
});
