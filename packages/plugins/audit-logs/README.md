# Strapi Audit Logs Plugin

Automated audit logging for all content changes performed through Strapi's Content API.

## Features

- **Automatic Logging**: Captures all create, update, and delete operations on content types
- **Rich Metadata**: Records user information, timestamps, changed fields, and data diffs
- **Configurable**: Enable/disable logging and exclude specific content types
- **REST API**: Query audit logs with filtering, pagination, and sorting
- **Role-based Access**: Control who can access audit logs through permissions

## Installation

This plugin is included with Strapi by default. To enable it, add it to your `config/plugins.js`:

```javascript
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: [], // Array of content type UIDs to exclude
      },
    },
  },
};
```

## Configuration

### Options

- `auditLog.enabled` (boolean): Enable or disable audit logging globally (default: `true`)
- `auditLog.excludeContentTypes` (array): Content type UIDs to exclude from logging (default: `[]`)

### Example Configuration

```javascript
module.exports = {
  'audit-logs': {
    enabled: true,
    config: {
      auditLog: {
        enabled: true,
        excludeContentTypes: [
          'api::temporary-data.temporary-data',
          'api::cache.cache',
        ],
      },
    },
  },
};
```

## API Endpoints

### GET /audit-logs

Retrieve audit logs with optional filtering, pagination, and sorting.

#### Query Parameters

- `contentType`: Filter by content type UID
- `userId`: Filter by user ID
- `action`: Filter by action type (`create`, `update`, `delete`)
- `dateFrom`: Filter logs from this date (ISO string)
- `dateTo`: Filter logs until this date (ISO string)
- `start`: Pagination offset (default: 0)
- `limit`: Number of results per page (default: 25, max: 100)
- `sort`: Sorting fields (e.g., `timestamp:desc,action:asc`)

#### Example Request

```bash
GET /api/audit-logs?contentType=api::article.article&action=update&limit=50&sort=timestamp:desc
```

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "contentType": "api::article.article",
      "recordId": "123",
      "action": "update",
      "userId": "1",
      "userEmail": "admin@example.com",
      "changedFields": ["title", "content"],
      "previousData": {
        "title": "Old Title",
        "content": "Old content..."
      },
      "newData": {
        "title": "New Title",
        "content": "Updated content..."
      },
      "timestamp": "2023-12-01T10:30:00.000Z"
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

### GET /audit-logs/:id

Retrieve a specific audit log entry by ID.

## Permissions

The plugin registers a `read` permission that controls access to audit logs. Assign this permission to roles that should be able to view audit logs.

## Data Structure

Each audit log entry contains:

- `contentType`: The UID of the content type
- `recordId`: The ID of the affected record
- `action`: The type of operation (`create`, `update`, `delete`)
- `userId`: ID of the user who performed the action (if authenticated)
- `userEmail`: Email of the user who performed the action
- `changedFields`: Array of field names that were modified (for updates)
- `previousData`: The data before the change (for updates and deletes)
- `newData`: The data after the change (for creates and updates)
- `timestamp`: When the action occurred

## Security

- Sensitive fields like passwords and tokens are automatically excluded from logging
- Access to audit logs is controlled through role-based permissions
- All data is sanitized before storage

## Performance Considerations

- Audit logging is designed to have minimal impact on API performance
- Failed audit log creation does not affect the original operation
- Consider database indexing on frequently queried fields like `contentType`, `userId`, and `timestamp`

## Troubleshooting

If audit logs are not being created:

1. Check that the plugin is enabled in your configuration
2. Verify that the content type is not in the `excludeContentTypes` list
3. Check the Strapi logs for any error messages
4. Ensure the database has the `audit_logs` table

## Database Schema

The plugin creates an `audit_logs` table with the following structure:

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY,
  content_type VARCHAR(255) NOT NULL,
  record_id VARCHAR(255) NOT NULL,
  action ENUM('create', 'update', 'delete') NOT NULL,
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  changed_fields JSON,
  previous_data JSON,
  new_data JSON,
  timestamp DATETIME NOT NULL,
  created_at DATETIME,
  updated_at DATETIME
);
```

Recommended indexes:
- `content_type`
- `user_id`
- `timestamp`
- `action`