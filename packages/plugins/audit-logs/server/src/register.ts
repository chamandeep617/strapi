// import { Core } from '@strapi/types';

export default ({ strapi }: { strapi: any }) => {
  // Register permissions
  strapi.admin.services.permission.actionProvider.registerMany([
    {
      section: 'plugins',
      displayName: 'Read audit logs',
      uid: 'read',
      pluginName: 'audit-logs',
    },
  ]);
};