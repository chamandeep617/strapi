// import { Core } from '@strapi/types';

export default ({ strapi }: { strapi: any }) => {
  // Register middleware to intercept document service operations
  const auditLogService = strapi.plugin('audit-logs').service('audit-log-service');

  // Middleware to capture CRUD operations
  const auditMiddleware = async (ctx: any, next: () => Promise<void>) => {
    const { action, uid, params } = ctx;
    
    // Skip if not a content type or if it's the audit log itself
    if (!uid || uid.startsWith('plugin::') || uid === 'plugin::audit-logs.audit-log') {
      return next();
    }

    let previousData: any = null;
    
    // For updates and deletes, fetch the current data first
    if ((action === 'update' || action === 'delete') && params.documentId) {
      try {
        previousData = await strapi.documents(uid).findOne({
          documentId: params.documentId,
        });
      } catch (error) {
        // Continue even if we can't fetch previous data
        strapi.log.warn('Could not fetch previous data for audit log:', error);
      }
    }

    // Execute the original operation
    const result = await next();

    // Create audit log entry after successful operation
    try {
      const user = ctx.state?.user;
      let recordId = params.documentId;
      
      // Try to get record ID from result if not in params
      if (!recordId && result !== undefined && result !== null && typeof result === 'object') {
        recordId = (result as any).documentId || (result as any).id;
      }
      
      if (!recordId) {
        return result;
      }

      const auditEntry: any = {
        contentType: uid,
        recordId: String(recordId),
        action,
        userId: user?.id ? String(user.id) : undefined,
        userEmail: user?.email || undefined,
        timestamp: new Date(),
      };

      if (action === 'create') {
        auditEntry.newData = auditLogService.sanitizeData(result);
      } else if (action === 'update') {
        auditEntry.previousData = auditLogService.sanitizeData(previousData);
        auditEntry.newData = auditLogService.sanitizeData(result);
        auditEntry.changedFields = auditLogService.getChangedFields(previousData, result);
      } else if (action === 'delete') {
        auditEntry.previousData = auditLogService.sanitizeData(previousData);
      }

      await auditLogService.createAuditLog(auditEntry);
    } catch (error) {
      strapi.log.error('Failed to create audit log entry:', error);
      // Don't fail the original operation if audit logging fails
    }

    return result;
  };

  // Register the middleware with the document service
  strapi.documents.use(auditMiddleware);
};