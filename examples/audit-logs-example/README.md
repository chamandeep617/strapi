# Audit Logs Example

This example demonstrates how to use the Strapi Audit Logs plugin in a real application.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure the Plugin**
   
   Create or update `config/plugins.js`:
   ```javascript
   module.exports = {
     'audit-logs': {
       enabled: true,
       config: {
         auditLog: {
           enabled: true,
           excludeContentTypes: [
             // Exclude high-frequency content types if needed
             // 'api::session.session',
             // 'api::log.log',
           ],
         },
       },
     },
   };
   ```

3. **Set Up Permissions**
   
   After starting Strapi:
   1. Go to Settings > Roles & Permissions
   2. Select "Authenticated" or create a custom role
   3. Under "Plugins" > "Audit Logs", enable "Read audit logs"

## Example Usage

### 1. Basic CRUD Operations

Create some content to generate audit logs:

```javascript
// Create an article
const article = await strapi.documents('api::article.article').create({
  data: {
    title: 'My First Article',
    content: 'This is the content of my first article.',
    publishedAt: null,
  },
});

// Update the article
await strapi.documents('api::article.article').update({
  documentId: article.documentId,
  data: {
    title: 'My Updated Article',
    publishedAt: new Date(),
  },
});

// Delete the article
await strapi.documents('api::article.article').delete({
  documentId: article.documentId,
});
```

### 2. Query Audit Logs

```javascript
// Get all audit logs
const response = await fetch('/api/audit-logs', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
  },
});
const auditLogs = await response.json();

// Filter by content type
const articleLogs = await fetch('/api/audit-logs?contentType=api::article.article', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
  },
});

// Filter by action and date range
const recentUpdates = await fetch('/api/audit-logs?action=update&dateFrom=2023-12-01', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
  },
});
```

### 3. Frontend Integration

Here's an example React component to display audit logs:

```jsx
import React, { useState, useEffect } from 'react';

const AuditLogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    contentType: '',
    action: '',
    userId: '',
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filters]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt')}`,
        },
      });
      
      const data = await response.json();
      setLogs(data.data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create': return 'green';
      case 'update': return 'blue';
      case 'delete': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="audit-log-viewer">
      <h2>Audit Logs</h2>
      
      {/* Filters */}
      <div className="filters">
        <select 
          value={filters.contentType} 
          onChange={(e) => setFilters({...filters, contentType: e.target.value})}
        >
          <option value="">All Content Types</option>
          <option value="api::article.article">Articles</option>
          <option value="api::category.category">Categories</option>
          <option value="plugin::users-permissions.user">Users</option>
        </select>
        
        <select 
          value={filters.action} 
          onChange={(e) => setFilters({...filters, action: e.target.value})}
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="audit-logs-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Content Type</th>
              <th>Action</th>
              <th>User</th>
              <th>Record ID</th>
              <th>Changes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{formatTimestamp(log.timestamp)}</td>
                <td>{log.contentType}</td>
                <td>
                  <span 
                    className="action-badge" 
                    style={{ color: getActionColor(log.action) }}
                  >
                    {log.action}
                  </span>
                </td>
                <td>{log.userEmail || 'System'}</td>
                <td>{log.recordId}</td>
                <td>
                  {log.changedFields ? (
                    <span>{log.changedFields.join(', ')}</span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AuditLogViewer;
```

### 4. Advanced Filtering

```javascript
// Complex filtering example
const complexFilter = {
  contentType: 'api::article.article',
  action: 'update',
  userId: '1',
  dateFrom: '2023-12-01T00:00:00.000Z',
  dateTo: '2023-12-31T23:59:59.999Z',
  start: 0,
  limit: 50,
  sort: 'timestamp:desc,action:asc'
};

const queryString = new URLSearchParams(complexFilter).toString();
const response = await fetch(`/api/audit-logs?${queryString}`);
```

### 5. Export Functionality

```javascript
const exportAuditLogs = async (filters = {}) => {
  try {
    // Fetch all matching logs (be careful with large datasets)
    const response = await fetch(`/api/audit-logs?limit=1000&${new URLSearchParams(filters)}`);
    const data = await response.json();
    
    // Convert to CSV
    const csvContent = [
      // Header
      ['Timestamp', 'Content Type', 'Action', 'User Email', 'Record ID', 'Changed Fields'].join(','),
      // Data rows
      ...data.data.map(log => [
        log.timestamp,
        log.contentType,
        log.action,
        log.userEmail || '',
        log.recordId,
        (log.changedFields || []).join(';')
      ].join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export audit logs:', error);
  }
};
```

## Configuration Examples

### Exclude High-Frequency Content Types

```javascript
// config/plugins.js
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: [
          'api::session.session',      // User sessions
          'api::analytics.analytics',  // Analytics data
          'api::cache.cache',          // Cache entries
          'api::log.log',              // Application logs
        ],
      },
    },
  },
};
```

### Environment-Specific Configuration

```javascript
// config/plugins.js
module.exports = ({ env }) => ({
  'audit-logs': {
    enabled: true,
    config: {
      auditLog: {
        // Disable in development to reduce noise
        enabled: env('NODE_ENV') !== 'development',
        excludeContentTypes: env.array('AUDIT_EXCLUDE_TYPES', []),
      },
    },
  },
});
```

## Monitoring and Alerting

### Database Query for Monitoring

```sql
-- Check audit log volume by day
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as log_count,
  COUNT(DISTINCT content_type) as content_types,
  COUNT(DISTINCT user_id) as unique_users
FROM audit_logs 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Find most active users
SELECT 
  user_email,
  COUNT(*) as action_count,
  COUNT(DISTINCT content_type) as content_types_affected
FROM audit_logs 
WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 DAY)
  AND user_email IS NOT NULL
GROUP BY user_email
ORDER BY action_count DESC
LIMIT 10;

-- Check for suspicious activity (many deletes)
SELECT 
  user_email,
  COUNT(*) as delete_count,
  MIN(timestamp) as first_delete,
  MAX(timestamp) as last_delete
FROM audit_logs 
WHERE action = 'delete'
  AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
  AND user_email IS NOT NULL
GROUP BY user_email
HAVING delete_count > 10
ORDER BY delete_count DESC;
```

## Best Practices

1. **Performance**: Use appropriate filters to limit result sets
2. **Storage**: Consider archiving old audit logs to manage database size
3. **Security**: Ensure proper permissions are set for audit log access
4. **Monitoring**: Set up alerts for unusual activity patterns
5. **Compliance**: Regularly export audit logs for compliance requirements

## Troubleshooting

### Common Issues

1. **No audit logs appearing**
   - Check plugin configuration
   - Verify content type is not excluded
   - Check database for `audit_logs` table

2. **Permission denied errors**
   - Verify user has `plugin::audit-logs.read` permission
   - Check authentication token

3. **Performance issues**
   - Add database indexes (see migration file)
   - Use appropriate filters
   - Implement pagination

### Debug Commands

```javascript
// Check plugin status
console.log(strapi.plugin('audit-logs'));

// Check configuration
console.log(strapi.config.get('plugin.audit-logs'));

// Manual audit log creation (for testing)
await strapi.plugin('audit-logs').service('audit-log-service').createAuditLog({
  contentType: 'api::test.test',
  recordId: '123',
  action: 'create',
  userId: '1',
  userEmail: 'test@example.com',
  newData: { test: 'data' },
  timestamp: new Date(),
});
```