module.exports = {
  // Enable the audit logs plugin
  'audit-logs': {
    enabled: true,
    config: {
      auditLog: {
        // Enable audit logging globally
        enabled: true,
        // Exclude specific content types from logging
        excludeContentTypes: [
          // Example: exclude temporary or cache content types
          // 'api::temporary-data.temporary-data',
          // 'api::cache.cache',
        ],
      },
    },
  },
  
  // Other plugins...
  'users-permissions': {
    enabled: true,
  },
  
  i18n: {
    enabled: true,
  },
};