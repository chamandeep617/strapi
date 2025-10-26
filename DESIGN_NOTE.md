# Audit Logging Feature - Design Document

## Overview

This document describes the implementation of an automated audit logging system for Strapi that captures all content changes performed through the Content API. The feature is implemented as a plugin that integrates seamlessly with Strapi's existing architecture.

## Architecture

### Plugin-Based Approach

The audit logging feature is implemented as a Strapi plugin (`@strapi/audit-logs`) for several key reasons:

1. **Modularity**: Keeps the audit functionality separate from core Strapi code
2. **Maintainability**: Easy to enable/disable and configure independently
3. **Extensibility**: Can be extended with additional features without affecting core
4. **Distribution**: Can be easily packaged and distributed

### Core Components

#### 1. Content Type Definition
- **File**: `content-types/audit-log.ts`
- **Purpose**: Defines the database schema for audit log entries
- **Key Fields**:
  - `contentType`: UID of the affected content type
  - `recordId`: ID of the affected record
  - `action`: Type of operation (create/update/delete)
  - `userId`/`userEmail`: User who performed the action
  - `changedFields`: Array of modified field names
  - `previousData`/`newData`: Before/after snapshots
  - `timestamp`: When the action occurred

#### 2. Document Service Middleware
- **File**: `bootstrap.ts`
- **Purpose**: Intercepts all CRUD operations on content types
- **Integration Point**: Strapi's document service middleware system
- **Flow**:
  1. Middleware intercepts document service calls
  2. For updates/deletes, fetches current data before operation
  3. Executes original operation
  4. Creates audit log entry with appropriate data
  5. Handles errors gracefully (audit failures don't break operations)

#### 3. Service Layer
- **File**: `services/audit-log-service.ts`
- **Purpose**: Business logic for audit logging
- **Key Functions**:
  - `createAuditLog()`: Creates audit entries with configuration checks
  - `findAuditLogs()`: Queries audit logs with filtering/pagination
  - `getChangedFields()`: Compares data to identify changes
  - `sanitizeData()`: Removes sensitive fields from logged data

#### 4. REST API Controller
- **File**: `controllers/audit-log-controller.ts`
- **Purpose**: HTTP endpoints for querying audit logs
- **Endpoints**:
  - `GET /audit-logs`: List with filtering, pagination, sorting
  - `GET /audit-logs/:id`: Get specific audit log entry

#### 5. Configuration System
- **File**: `config/index.ts`
- **Purpose**: Plugin configuration with validation
- **Options**:
  - `auditLog.enabled`: Global enable/disable
  - `auditLog.excludeContentTypes`: Content types to skip

## Implementation Details

### Middleware Integration

The audit logging leverages Strapi's document service middleware system, which provides:

- **Consistent Interception**: Captures all operations regardless of entry point (REST API, GraphQL, programmatic)
- **Context Access**: Full access to operation context (user, parameters, etc.)
- **Error Handling**: Graceful failure handling that doesn't impact operations
- **Performance**: Minimal overhead through efficient middleware design

### Data Capture Strategy

#### Create Operations
- Captures the complete new record data
- Records user information if authenticated
- Stores timestamp of creation

#### Update Operations
- Fetches current data before update (for comparison)
- Executes update operation
- Compares before/after data to identify changed fields
- Stores both previous and new data snapshots

#### Delete Operations
- Fetches current data before deletion
- Stores the deleted data for audit trail
- Records user who performed deletion

### Security Considerations

#### Data Sanitization
- Automatically excludes sensitive fields (passwords, tokens)
- Configurable field exclusion for custom sensitive data
- Prevents logging of authentication credentials

#### Access Control
- Role-based permissions for audit log access
- Separate permission (`plugin::audit-logs.read`) for audit data
- No write access to audit logs through API (append-only)

#### Performance Impact
- Asynchronous audit log creation
- Non-blocking error handling
- Minimal data processing overhead
- Efficient database queries with proper indexing

### Configuration Design

#### Global Configuration
```javascript
{
  auditLog: {
    enabled: true,                    // Global on/off switch
    excludeContentTypes: [            // Content types to skip
      'api::temporary.temporary',
      'api::cache.cache'
    ]
  }
}
```

#### Runtime Checks
- Configuration validation on startup
- Runtime checks before each audit log creation
- Graceful handling of configuration changes

### API Design

#### RESTful Endpoints
- Standard REST patterns for consistency
- Comprehensive filtering options
- Pagination with reasonable limits
- Flexible sorting capabilities

#### Query Parameters
- `contentType`: Filter by specific content type
- `userId`: Filter by user who made changes
- `action`: Filter by operation type
- `dateFrom`/`dateTo`: Time range filtering
- `start`/`limit`: Pagination controls
- `sort`: Multi-field sorting

### Database Design

#### Schema Considerations
- JSON fields for flexible data storage
- Proper indexing for query performance
- Enumeration for action types
- Nullable fields for optional data

#### Indexing Strategy
- Primary index on `id`
- Composite indexes on frequently queried fields:
  - `(content_type, timestamp)`
  - `(user_id, timestamp)`
  - `(action, timestamp)`

## Trade-offs and Decisions

### Plugin vs Core Integration
**Decision**: Implement as plugin
**Rationale**: 
- Modularity and maintainability
- Optional feature that not all users need
- Easier testing and development
- Follows Strapi's plugin architecture patterns

### Middleware vs Event System
**Decision**: Use document service middleware
**Rationale**:
- Guaranteed interception of all operations
- Access to both before and after data
- Better error handling capabilities
- More reliable than event-based approaches

### Data Storage Strategy
**Decision**: Store full data snapshots
**Rationale**:
- Complete audit trail for compliance
- Enables data recovery scenarios
- Simplifies querying and reporting
- Storage cost acceptable for audit requirements

### Synchronous vs Asynchronous Logging
**Decision**: Synchronous with error isolation
**Rationale**:
- Ensures audit logs are created for successful operations
- Error isolation prevents audit failures from breaking operations
- Acceptable performance impact for audit requirements
- Simpler error handling and debugging

## Future Enhancements

### Potential Improvements
1. **Batch Processing**: Group multiple audit entries for better performance
2. **Data Retention**: Automatic cleanup of old audit logs
3. **Export Functionality**: CSV/JSON export of audit data
4. **Real-time Notifications**: Webhook/email notifications for specific events
5. **Advanced Filtering**: Full-text search, complex query builders
6. **Audit Log Integrity**: Cryptographic signatures for tamper detection

### Scalability Considerations
1. **Database Partitioning**: Partition audit logs by date for large datasets
2. **Archival Strategy**: Move old logs to cold storage
3. **Read Replicas**: Separate read/write databases for performance
4. **Caching**: Cache frequently accessed audit data

## Testing Strategy

### Unit Tests
- Service layer functionality
- Data sanitization logic
- Configuration validation
- Error handling scenarios

### Integration Tests
- Middleware integration with document service
- API endpoint functionality
- Permission system integration
- Database operations

### Performance Tests
- Audit logging overhead measurement
- Large dataset query performance
- Concurrent operation handling

## Deployment Considerations

### Database Migration
- Automatic table creation on plugin bootstrap
- Index creation for optimal performance
- Backward compatibility with existing installations

### Configuration Management
- Environment-specific configuration
- Runtime configuration updates
- Configuration validation and error reporting

### Monitoring
- Audit log creation success/failure rates
- Performance impact metrics
- Storage usage monitoring
- Query performance tracking