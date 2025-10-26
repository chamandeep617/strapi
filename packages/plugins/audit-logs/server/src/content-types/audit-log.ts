export default {
  kind: 'collectionType',
  collectionName: 'audit_logs',
  info: {
    singularName: 'audit-log',
    pluralName: 'audit-logs',
    displayName: 'Audit Log',
    description: 'Audit log entries for content changes',
  },
  options: {
    draftAndPublish: false,
    comment: '',
  },
  pluginOptions: {
    'content-manager': {
      visible: false,
    },
    'content-type-builder': {
      visible: false,
    },
  },
  attributes: {
    contentType: {
      type: 'string',
      required: true,
      configurable: false,
    },
    recordId: {
      type: 'string',
      required: true,
      configurable: false,
    },
    action: {
      type: 'enumeration',
      enum: ['create', 'update', 'delete'],
      required: true,
      configurable: false,
    },
    userId: {
      type: 'string',
      required: false,
      configurable: false,
    },
    userEmail: {
      type: 'string',
      required: false,
      configurable: false,
    },
    changedFields: {
      type: 'json',
      required: false,
      configurable: false,
    },
    previousData: {
      type: 'json',
      required: false,
      configurable: false,
    },
    newData: {
      type: 'json',
      required: false,
      configurable: false,
    },
    timestamp: {
      type: 'datetime',
      required: true,
      configurable: false,
    },
  },
};