import auditLogService from '../services/audit-log-service';

describe('Audit Log Service', () => {
  let service: any;
  let mockStrapi: any;

  beforeEach(() => {
    mockStrapi = {
      config: {
        get: jest.fn().mockReturnValue({
          enabled: true,
          excludeContentTypes: [],
        }),
      },
      db: {
        query: jest.fn().mockReturnValue({
          create: jest.fn(),
          findWithCount: jest.fn(),
        }),
      },
      log: {
        error: jest.fn(),
      },
    };

    service = auditLogService({ strapi: mockStrapi });
  });

  describe('getChangedFields', () => {
    it('should identify changed fields correctly', () => {
      const previousData = {
        title: 'Old Title',
        content: 'Old Content',
        status: 'draft',
      };

      const newData = {
        title: 'New Title',
        content: 'Old Content',
        status: 'published',
      };

      const changedFields = service.getChangedFields(previousData, newData);
      
      expect(changedFields).toEqual(['title', 'status']);
    });

    it('should return empty array when no changes', () => {
      const data = {
        title: 'Same Title',
        content: 'Same Content',
      };

      const changedFields = service.getChangedFields(data, data);
      
      expect(changedFields).toEqual([]);
    });

    it('should handle null/undefined data', () => {
      expect(service.getChangedFields(null, {})).toEqual([]);
      expect(service.getChangedFields({}, null)).toEqual([]);
      expect(service.getChangedFields(null, null)).toEqual([]);
    });
  });

  describe('sanitizeData', () => {
    it('should remove sensitive fields', () => {
      const data = {
        id: 1,
        email: 'user@example.com',
        password: 'secret123',
        resetPasswordToken: 'token123',
        confirmationToken: 'confirm123',
        name: 'John Doe',
      };

      const sanitized = service.sanitizeData(data);

      expect(sanitized).toEqual({
        id: 1,
        email: 'user@example.com',
        name: 'John Doe',
      });
    });

    it('should handle null/undefined data', () => {
      expect(service.sanitizeData(null)).toBeNull();
      expect(service.sanitizeData(undefined)).toBeUndefined();
    });
  });

  describe('createAuditLog', () => {
    it('should create audit log when enabled', async () => {
      const entry = {
        contentType: 'api::article.article',
        recordId: '123',
        action: 'create' as const,
        userId: '1',
        userEmail: 'user@example.com',
        timestamp: new Date(),
      };

      await service.createAuditLog(entry);

      expect(mockStrapi.db.query).toHaveBeenCalledWith('plugin::audit-logs.audit-log');
      expect(mockStrapi.db.query().create).toHaveBeenCalledWith({
        data: entry,
      });
    });

    it('should not create audit log when disabled', async () => {
      mockStrapi.config.get.mockReturnValue({
        enabled: false,
        excludeContentTypes: [],
      });

      const entry = {
        contentType: 'api::article.article',
        recordId: '123',
        action: 'create' as const,
        timestamp: new Date(),
      };

      await service.createAuditLog(entry);

      expect(mockStrapi.db.query).not.toHaveBeenCalled();
    });

    it('should not create audit log for excluded content types', async () => {
      mockStrapi.config.get.mockReturnValue({
        enabled: true,
        excludeContentTypes: ['api::article.article'],
      });

      const entry = {
        contentType: 'api::article.article',
        recordId: '123',
        action: 'create' as const,
        timestamp: new Date(),
      };

      await service.createAuditLog(entry);

      expect(mockStrapi.db.query).not.toHaveBeenCalled();
    });
  });
});