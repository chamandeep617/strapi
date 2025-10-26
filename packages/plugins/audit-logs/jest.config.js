const baseConfig = require('../../../jest.config.js');

module.exports = {
  ...baseConfig,
  displayName: 'Audit Logs Plugin',
  testMatch: ['<rootDir>/packages/plugins/audit-logs/**/__tests__/**/*.test.js'],
};