// import { Core } from '@strapi/types';
// import { differenceWith, isEqual, pick } from 'lodash';

interface AuditLogEntry {
  contentType: string;
  recordId: string;
  action: 'create' | 'update' | 'delete';
  userId?: string;
  userEmail?: string;
  changedFields?: string[];
  previousData?: any;
  newData?: any;
  timestamp: Date;
}

export default ({ strapi }: { strapi: any }) => ({
  async createAuditLog(entry: AuditLogEntry) {
    const config = strapi.config.get('plugin.audit-logs.auditLog', {
      enabled: true,
      excludeContentTypes: [],
    });

    // Check if audit logging is enabled
    if (!config.enabled) {
      return;
    }

    // Check if content type is excluded
    if (config.excludeContentTypes && config.excludeContentTypes.indexOf(entry.contentType) !== -1) {
      return;
    }

    try {
      await strapi.db.query('plugin::audit-logs.audit-log').create({
        data: {
          ...entry,
          timestamp: entry.timestamp || new Date(),
        },
      });
    } catch (error) {
      strapi.log.error('Failed to create audit log entry:', error);
    }
  },

  async findAuditLogs(params: any = {}) {
    const { filters = {}, sort = [{ timestamp: 'desc' }], pagination = {} } = params;

    return strapi.db.query('plugin::audit-logs.audit-log').findWithCount({
      where: filters,
      orderBy: sort,
      offset: pagination.start || 0,
      limit: pagination.limit || 25,
    });
  },

  getChangedFields(previousData: any, newData: any): string[] {
    if (!previousData || !newData) {
      return [];
    }

    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(previousData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      if (JSON.stringify(previousData[key]) !== JSON.stringify(newData[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  },

  sanitizeData(data: any): any {
    if (!data) return data;
    
    // Remove sensitive fields that shouldn't be logged
    const sensitiveFields = ['password', 'resetPasswordToken', 'confirmationToken'];
    const sanitized: any = {};
    
    for (const key in data) {
      if (data.hasOwnProperty(key) && sensitiveFields.indexOf(key) === -1) {
        sanitized[key] = data[key];
      }
    }
    
    return sanitized;
  },
});