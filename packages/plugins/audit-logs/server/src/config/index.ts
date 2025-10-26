export default {
  default: {
    auditLog: {
      enabled: true,
      excludeContentTypes: [],
    },
  },
  validator: (config: any) => {
    if (typeof config.auditLog?.enabled !== 'boolean') {
      throw new Error('auditLog.enabled must be a boolean');
    }
    if (!Array.isArray(config.auditLog?.excludeContentTypes)) {
      throw new Error('auditLog.excludeContentTypes must be an array');
    }
  },
};