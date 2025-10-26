export default [
  {
    method: 'GET',
    path: '/audit-logs',
    handler: 'audit-log-controller.find',
    config: {
      policies: [
        {
          name: 'admin::hasPermissions',
          config: {
            actions: ['plugin::audit-logs.read'],
          },
        },
      ],
    },
  },
  {
    method: 'GET',
    path: '/audit-logs/:id',
    handler: 'audit-log-controller.findOne',
    config: {
      policies: [
        {
          name: 'admin::hasPermissions',
          config: {
            actions: ['plugin::audit-logs.read'],
          },
        },
      ],
    },
  },
];