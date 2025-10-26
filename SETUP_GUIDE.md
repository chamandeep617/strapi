# Strapi Audit Logs - Setup Guide

## Prerequisites

Make sure you have Node.js and npm installed:
```bash
node --version  # Should be >= 18.0.0
npm --version   # Should be >= 6.0.0
```

## Installation Steps

### 1. Install Dependencies

From the root of the Strapi project:
```bash
npm install
```

### 2. Build the Audit Logs Plugin

Navigate to the plugin directory and build it:
```bash
cd packages/plugins/audit-logs
npm run build
```

If you get any errors about missing dependencies, install them:
```bash
npm install
```

### 3. Build the Main Strapi Package

Go back to the root and build the main Strapi package:
```bash
cd ../../../
npm run build
```

### 4. Test the Plugin

You can run the unit tests to verify everything works:
```bash
cd packages/plugins/audit-logs
npm test
```

## Configuration

### 1. Enable the Plugin

In your Strapi application, create or update `config/plugins.js`:

```javascript
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: [
          // Add content types to exclude from logging
          // 'api::session.session',
          // 'api::cache.cache',
        ],
      },
    },
  },
  // ... other plugins
};
```

### 2. Set Up Permissions

After starting your Strapi application:

1. Go to **Settings** > **Roles & Permissions**
2. Select the role you want to grant access to (e.g., "Authenticated")
3. Under **Plugins** section, find **Audit Logs**
4. Enable the **"Read audit logs"** permission
5. Save the role

## Testing the Implementation

### 1. Start Your Strapi Application

```bash
npm run develop
```

### 2. Create Some Content

Use the Strapi admin panel or API to:
- Create a new content entry
- Update an existing entry
- Delete an entry

### 3. Check Audit Logs

Make API requests to view the audit logs:

```bash
# Get all audit logs (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:1337/api/audit-logs

# Filter by content type
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:1337/api/audit-logs?contentType=api::article.article"

# Filter by action
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     "http://localhost:1337/api/audit-logs?action=create"
```

### 4. Verify Database

Check your database for the `audit_logs` table:

```sql
-- View the audit logs table structure
DESCRIBE audit_logs;

-- View recent audit logs
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;

-- Count logs by action type
SELECT action, COUNT(*) as count 
FROM audit_logs 
GROUP BY action;
```

## API Usage Examples

### Basic Queries

```bash
# Get all audit logs with pagination
GET /api/audit-logs?start=0&limit=25

# Filter by content type
GET /api/audit-logs?contentType=api::article.article

# Filter by user
GET /api/audit-logs?userId=1

# Filter by action type
GET /api/audit-logs?action=update

# Date range filtering
GET /api/audit-logs?dateFrom=2023-12-01&dateTo=2023-12-31

# Complex filtering with sorting
GET /api/audit-logs?contentType=api::article.article&action=update&sort=timestamp:desc&limit=50
```

### Response Format

```json
{
  "data": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "clp123abc",
      "action": "update",
      "userId": "1",
      "userEmail": "admin@example.com",
      "changedFields": ["title", "publishedAt"],
      "previousData": {
        "title": "Old Title",
        "publishedAt": null
      },
      "newData": {
        "title": "New Title",
        "publishedAt": "2023-12-01T10:30:00.000Z"
      },
      "timestamp": "2023-12-01T10:30:15.123Z"
    }
  ],
  "meta": {
    "pagination": {
      "start": 0,
      "limit": 25,
      "total": 150
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Plugin not loading**
   - Check `config/plugins.js` configuration
   - Verify plugin is built: `ls packages/plugins/audit-logs/dist/`
   - Check Strapi logs for errors

2. **No audit logs being created**
   - Verify `auditLog.enabled` is `true`
   - Check if content type is in `excludeContentTypes`
   - Look for errors in Strapi logs

3. **Permission denied accessing audit logs**
   - Check user has `plugin::audit-logs.read` permission
   - Verify JWT token is valid
   - Check role permissions in admin panel

4. **TypeScript errors during build**
   - Run `npm install` in plugin directory
   - Check TypeScript version compatibility
   - Verify all dependencies are installed

### Debug Commands

```bash
# Check if plugin is registered
node -e "console.log(require('./packages/plugins/audit-logs/package.json'))"

# Verify build output
ls -la packages/plugins/audit-logs/dist/

# Check Strapi configuration
# (Add this to your Strapi app temporarily)
console.log(strapi.config.get('plugin.audit-logs'));
```

### Database Indexes

For better performance, create these indexes:

```sql
-- Create indexes for common queries
CREATE INDEX idx_audit_logs_content_type ON audit_logs(content_type);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_content_type_timestamp ON audit_logs(content_type, timestamp);
```

## Performance Considerations

1. **Database Size**: Audit logs can grow quickly. Consider:
   - Regular cleanup of old logs
   - Archiving to separate storage
   - Excluding high-frequency content types

2. **Query Performance**: 
   - Use appropriate filters to limit results
   - Implement pagination for large datasets
   - Monitor database performance

3. **Application Performance**:
   - Audit logging has minimal overhead
   - Failed audit logs don't affect operations
   - Consider async processing for high-volume scenarios

## Next Steps

1. **Monitoring**: Set up monitoring for audit log volume and performance
2. **Alerting**: Create alerts for suspicious activity patterns
3. **Reporting**: Build dashboards for audit log analysis
4. **Compliance**: Export audit logs for compliance requirements
5. **Archival**: Implement data retention policies

## Support

If you encounter issues:

1. Check the Strapi logs for error messages
2. Verify all configuration settings
3. Test with simple CRUD operations
4. Review the API documentation in `packages/plugins/audit-logs/API.md`
5. Check the implementation details in `DESIGN_NOTE.md`

The audit logging system is now ready for production use and provides comprehensive tracking of all content changes in your Strapi application.