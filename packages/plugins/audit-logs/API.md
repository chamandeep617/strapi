# Audit Logs API Documentation

## Base URL
All API endpoints are prefixed with `/api/audit-logs`

## Authentication
All endpoints require authentication and the `plugin::audit-logs.read` permission.

## Endpoints

### GET /audit-logs

Retrieve a list of audit log entries with optional filtering, pagination, and sorting.

#### Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `contentType` | string | No | Filter by content type UID | `api::article.article` |
| `userId` | string | No | Filter by user ID | `1` |
| `action` | string | No | Filter by action type | `create`, `update`, `delete` |
| `dateFrom` | string | No | Filter logs from this date (ISO string) | `2023-12-01T00:00:00.000Z` |
| `dateTo` | string | No | Filter logs until this date (ISO string) | `2023-12-31T23:59:59.999Z` |
| `start` | number | No | Pagination offset (default: 0) | `0` |
| `limit` | number | No | Number of results per page (default: 25, max: 100) | `50` |
| `sort` | string | No | Sorting fields (comma-separated) | `timestamp:desc,action:asc` |

#### Example Requests

```bash
# Get all audit logs (default pagination)
GET /api/audit-logs

# Filter by content type
GET /api/audit-logs?contentType=api::article.article

# Filter by action and user
GET /api/audit-logs?action=update&userId=1

# Date range filtering
GET /api/audit-logs?dateFrom=2023-12-01&dateTo=2023-12-31

# Pagination and sorting
GET /api/audit-logs?start=50&limit=25&sort=timestamp:desc

# Complex filtering
GET /api/audit-logs?contentType=api::article.article&action=update&userId=1&limit=100&sort=timestamp:desc
```

#### Response Format

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
        "id": "clp123abc",
        "title": "Original Title",
        "content": "Article content...",
        "publishedAt": null
      },
      "newData": {
        "id": "clp123abc",
        "title": "Updated Title",
        "content": "Article content...",
        "publishedAt": "2023-12-01T10:30:00.000Z"
      },
      "timestamp": "2023-12-01T10:30:15.123Z",
      "createdAt": "2023-12-01T10:30:15.123Z",
      "updatedAt": "2023-12-01T10:30:15.123Z"
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

#### Response Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

### GET /audit-logs/:id

Retrieve a specific audit log entry by ID.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Audit log entry ID |

#### Example Request

```bash
GET /api/audit-logs/123
```

#### Response Format

```json
{
  "data": {
    "id": 123,
    "contentType": "api::article.article",
    "recordId": "clp123abc",
    "action": "create",
    "userId": "1",
    "userEmail": "admin@example.com",
    "changedFields": null,
    "previousData": null,
    "newData": {
      "id": "clp123abc",
      "title": "New Article",
      "content": "This is a new article...",
      "publishedAt": null
    },
    "timestamp": "2023-12-01T09:15:30.456Z",
    "createdAt": "2023-12-01T09:15:30.456Z",
    "updatedAt": "2023-12-01T09:15:30.456Z"
  }
}
```

#### Response Codes

- `200 OK` - Success
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Audit log entry not found
- `500 Internal Server Error` - Server error

## Data Fields

### Audit Log Entry Fields

| Field | Type | Description | Present For |
|-------|------|-------------|-------------|
| `id` | number | Unique identifier | All |
| `contentType` | string | Content type UID (e.g., `api::article.article`) | All |
| `recordId` | string | ID of the affected record | All |
| `action` | string | Type of operation (`create`, `update`, `delete`) | All |
| `userId` | string | ID of user who performed the action | All (if authenticated) |
| `userEmail` | string | Email of user who performed the action | All (if authenticated) |
| `changedFields` | array | Names of fields that were modified | Update only |
| `previousData` | object | Data before the change | Update, Delete |
| `newData` | object | Data after the change | Create, Update |
| `timestamp` | string | When the action occurred (ISO string) | All |
| `createdAt` | string | When the audit log was created | All |
| `updatedAt` | string | When the audit log was last updated | All |

### Action Types

- **`create`**: New record was created
  - `newData` contains the created record
  - `previousData` is null
  - `changedFields` is null

- **`update`**: Existing record was modified
  - `previousData` contains the record before changes
  - `newData` contains the record after changes
  - `changedFields` contains array of modified field names

- **`delete`**: Record was deleted
  - `previousData` contains the deleted record
  - `newData` is null
  - `changedFields` is null

## Sorting

The `sort` parameter accepts comma-separated field names with optional direction:

- Format: `field:direction,field2:direction`
- Direction: `asc` (ascending) or `desc` (descending)
- Default direction: `desc`
- Default sort: `timestamp:desc`

### Examples

```bash
# Sort by timestamp (newest first)
?sort=timestamp:desc

# Sort by action, then timestamp
?sort=action:asc,timestamp:desc

# Sort by content type and user
?sort=contentType:asc,userId:asc
```

## Filtering

### Date Filtering

Date parameters accept ISO 8601 formatted strings:

```bash
# Specific date
?dateFrom=2023-12-01T00:00:00.000Z

# Date range
?dateFrom=2023-12-01&dateTo=2023-12-31

# Relative dates (last 7 days)
?dateFrom=2023-11-24T00:00:00.000Z&dateTo=2023-12-01T23:59:59.999Z
```

### Content Type Filtering

Use the full content type UID:

```bash
# API content types
?contentType=api::article.article
?contentType=api::category.category

# Plugin content types
?contentType=plugin::users-permissions.user
```

### Action Filtering

Filter by specific operations:

```bash
?action=create    # Only creation events
?action=update    # Only update events
?action=delete    # Only deletion events
```

## Pagination

- Default page size: 25 items
- Maximum page size: 100 items
- Use `start` and `limit` for pagination

### Examples

```bash
# First page (default)
?start=0&limit=25

# Second page
?start=25&limit=25

# Large page
?start=0&limit=100
```

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "status": 400,
    "name": "BadRequestError",
    "message": "Invalid query parameter: action must be one of create, update, delete",
    "details": {}
  }
}
```

### Common Error Messages

- `Invalid query parameter: action must be one of create, update, delete`
- `Invalid query parameter: limit must be between 1 and 100`
- `Invalid date format for dateFrom parameter`
- `Audit log entry not found`
- `Insufficient permissions to access audit logs`

## Rate Limiting

API endpoints may be subject to rate limiting. Check response headers:

- `X-RateLimit-Limit`: Maximum requests per time window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Best Practices

1. **Use Pagination**: Always use reasonable page sizes to avoid performance issues
2. **Filter Appropriately**: Use specific filters to reduce response size
3. **Cache Results**: Cache audit log data when appropriate for your use case
4. **Handle Errors**: Implement proper error handling for all API calls
5. **Monitor Usage**: Track API usage to ensure compliance with rate limits