/**
 * Integration tests for the audit logs plugin
 * These tests verify the end-to-end functionality
 */

describe('Audit Logs Integration', () => {
  let strapi: any;
  let request: any;

  beforeAll(async () => {
    // This would be set up with actual Strapi instance in real tests
    // For now, this is a placeholder showing the test structure
  });

  afterAll(async () => {
    // Clean up Strapi instance
  });

  describe('Audit Log Creation', () => {
    it('should create audit log on content creation', async () => {
      // Create a test article
      const article = await strapi.documents('api::article.article').create({
        data: {
          title: 'Test Article',
          content: 'This is a test article',
        },
      });

      // Check that audit log was created
      const auditLogs = await strapi.db.query('plugin::audit-logs.audit-log').findMany({
        where: {
          contentType: 'api::article.article',
          recordId: article.documentId,
          action: 'create',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].newData.title).toBe('Test Article');
      expect(auditLogs[0].previousData).toBeNull();
    });

    it('should create audit log on content update', async () => {
      // Create a test article first
      const article = await strapi.documents('api::article.article').create({
        data: {
          title: 'Original Title',
          content: 'Original content',
        },
      });

      // Update the article
      const updatedArticle = await strapi.documents('api::article.article').update({
        documentId: article.documentId,
        data: {
          title: 'Updated Title',
        },
      });

      // Check that audit log was created for update
      const auditLogs = await strapi.db.query('plugin::audit-logs.audit-log').findMany({
        where: {
          contentType: 'api::article.article',
          recordId: article.documentId,
          action: 'update',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].previousData.title).toBe('Original Title');
      expect(auditLogs[0].newData.title).toBe('Updated Title');
      expect(auditLogs[0].changedFields).toContain('title');
    });

    it('should create audit log on content deletion', async () => {
      // Create a test article first
      const article = await strapi.documents('api::article.article').create({
        data: {
          title: 'To Be Deleted',
          content: 'This will be deleted',
        },
      });

      // Delete the article
      await strapi.documents('api::article.article').delete({
        documentId: article.documentId,
      });

      // Check that audit log was created for deletion
      const auditLogs = await strapi.db.query('plugin::audit-logs.audit-log').findMany({
        where: {
          contentType: 'api::article.article',
          recordId: article.documentId,
          action: 'delete',
        },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].previousData.title).toBe('To Be Deleted');
      expect(auditLogs[0].newData).toBeNull();
    });
  });

  describe('API Endpoints', () => {
    it('should return audit logs via GET /audit-logs', async () => {
      const response = await request
        .get('/api/audit-logs')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('pagination');
    });

    it('should filter audit logs by content type', async () => {
      const response = await request
        .get('/api/audit-logs?contentType=api::article.article')
        .expect(200);

      response.body.data.forEach((log: any) => {
        expect(log.contentType).toBe('api::article.article');
      });
    });

    it('should filter audit logs by action', async () => {
      const response = await request
        .get('/api/audit-logs?action=create')
        .expect(200);

      response.body.data.forEach((log: any) => {
        expect(log.action).toBe('create');
      });
    });

    it('should paginate audit logs correctly', async () => {
      const response = await request
        .get('/api/audit-logs?start=0&limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.meta.pagination.start).toBe(0);
      expect(response.body.meta.pagination.limit).toBe(5);
    });

    it('should sort audit logs by timestamp', async () => {
      const response = await request
        .get('/api/audit-logs?sort=timestamp:desc')
        .expect(200);

      const timestamps = response.body.data.map((log: any) => new Date(log.timestamp));
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i-1].getTime()).toBeGreaterThanOrEqual(timestamps[i].getTime());
      }
    });

    it('should return specific audit log by ID', async () => {
      // First get a list to find an ID
      const listResponse = await request
        .get('/api/audit-logs?limit=1')
        .expect(200);

      if (listResponse.body.data.length > 0) {
        const logId = listResponse.body.data[0].id;
        
        const response = await request
          .get(`/api/audit-logs/${logId}`)
          .expect(200);

        expect(response.body.data.id).toBe(logId);
      }
    });

    it('should return 404 for non-existent audit log', async () => {
      await request
        .get('/api/audit-logs/999999')
        .expect(404);
    });
  });

  describe('Configuration', () => {
    it('should respect excludeContentTypes configuration', async () => {
      // This test would require setting up configuration
      // and verifying that excluded content types don't generate logs
    });

    it('should respect enabled configuration', async () => {
      // This test would require toggling the enabled flag
      // and verifying that no logs are created when disabled
    });
  });

  describe('Permissions', () => {
    it('should require authentication for audit log access', async () => {
      // Test without authentication
      await request
        .get('/api/audit-logs')
        .expect(401);
    });

    it('should require proper permissions for audit log access', async () => {
      // Test with authenticated user but without permissions
      // This would require setting up user roles and permissions
    });
  });

  describe('Data Sanitization', () => {
    it('should sanitize sensitive data from audit logs', async () => {
      // Create a user with sensitive data
      const user = await strapi.documents('plugin::users-permissions.user').create({
        data: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'secretpassword',
          resetPasswordToken: 'secret-token',
        },
      });

      // Check that audit log doesn't contain sensitive data
      const auditLogs = await strapi.db.query('plugin::audit-logs.audit-log').findMany({
        where: {
          contentType: 'plugin::users-permissions.user',
          recordId: user.documentId,
          action: 'create',
        },
      });

      expect(auditLogs[0].newData).not.toHaveProperty('password');
      expect(auditLogs[0].newData).not.toHaveProperty('resetPasswordToken');
      expect(auditLogs[0].newData).toHaveProperty('username');
      expect(auditLogs[0].newData).toHaveProperty('email');
    });
  });
});