#!/usr/bin/env node

/**
 * Test script for Strapi Audit Logs Plugin
 * This script tests the core functionality of the audit logging system
 */

const path = require('path');

// Mock Strapi instance for testing
const createMockStrapi = () => {
  const mockDb = {
    query: jest.fn().mockReturnValue({
      create: jest.fn().mockResolvedValue({ id: 1 }),
      findWithCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn().mockResolvedValue(null),
    }),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue({
      enabled: true,
      excludeContentTypes: [],
    }),
  };

  const mockLog = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };

  return {
    db: mockDb,
    config: mockConfig,
    log: mockLog,
    documents: jest.fn().mockReturnValue({
      findOne: jest.fn().mockResolvedValue(null),
    }),
    plugin: jest.fn().mockReturnValue({
      service: jest.fn().mockReturnValue({
        createAuditLog: jest.fn(),
        sanitizeData: jest.fn((data) => data),
        getChangedFields: jest.fn().mockReturnValue(['title']),
      }),
    }),
  };
};

// Test the audit log service
const testAuditLogService = () => {
  console.log('🧪 Testing Audit Log Service...');
  
  try {
    // Import the service
    const auditLogServiceFactory = require('./packages/plugins/audit-logs/server/src/services/audit-log-service.ts');
    const mockStrapi = createMockStrapi();
    const service = auditLogServiceFactory.default({ strapi: mockStrapi });

    // Test data sanitization
    const testData = {
      id: 1,
      email: 'user@example.com',
      password: 'secret123',
      resetPasswordToken: 'token123',
      name: 'John Doe',
    };

    const sanitized = service.sanitizeData(testData);
    
    if (sanitized.password || sanitized.resetPasswordToken) {
      throw new Error('Sensitive data not properly sanitized');
    }
    
    if (!sanitized.email || !sanitized.name) {
      throw new Error('Non-sensitive data was incorrectly removed');
    }

    console.log('✅ Data sanitization test passed');

    // Test change detection
    const previousData = {
      title: 'Old Title',
      content: 'Same Content',
      status: 'draft',
    };

    const newData = {
      title: 'New Title',
      content: 'Same Content',
      status: 'published',
    };

    const changedFields = service.getChangedFields(previousData, newData);
    
    if (!changedFields.includes('title') || !changedFields.includes('status')) {
      throw new Error('Changed fields not properly detected');
    }
    
    if (changedFields.includes('content')) {
      throw new Error('Unchanged field incorrectly marked as changed');
    }

    console.log('✅ Change detection test passed');
    console.log('✅ Audit Log Service tests completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Audit Log Service test failed:', error.message);
    return false;
  }
};

// Test the controller
const testController = () => {
  console.log('🧪 Testing Audit Log Controller...');
  
  try {
    // This would require more complex mocking for a full test
    // For now, just verify the file can be imported
    const controllerFactory = require('./packages/plugins/audit-logs/server/src/controllers/audit-log-controller.ts');
    const mockStrapi = createMockStrapi();
    const controller = controllerFactory.default({ strapi: mockStrapi });

    if (typeof controller.find !== 'function' || typeof controller.findOne !== 'function') {
      throw new Error('Controller methods not properly defined');
    }

    console.log('✅ Controller structure test passed');
    console.log('✅ Audit Log Controller tests completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Audit Log Controller test failed:', error.message);
    return false;
  }
};

// Test plugin structure
const testPluginStructure = () => {
  console.log('🧪 Testing Plugin Structure...');
  
  try {
    const fs = require('fs');
    
    // Check required files exist
    const requiredFiles = [
      'packages/plugins/audit-logs/package.json',
      'packages/plugins/audit-logs/server/src/index.ts',
      'packages/plugins/audit-logs/server/src/bootstrap.ts',
      'packages/plugins/audit-logs/server/src/services/audit-log-service.ts',
      'packages/plugins/audit-logs/server/src/controllers/audit-log-controller.ts',
      'packages/plugins/audit-logs/server/src/content-types/audit-log.ts',
      'packages/plugins/audit-logs/server/src/routes/index.ts',
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }

    console.log('✅ All required files present');

    // Check package.json structure
    const packageJson = JSON.parse(fs.readFileSync('packages/plugins/audit-logs/package.json', 'utf8'));
    
    if (packageJson.name !== '@strapi/audit-logs') {
      throw new Error('Incorrect package name');
    }
    
    if (!packageJson.strapi || packageJson.strapi.kind !== 'plugin') {
      throw new Error('Package not properly configured as Strapi plugin');
    }

    console.log('✅ Package.json structure correct');
    console.log('✅ Plugin structure tests completed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Plugin structure test failed:', error.message);
    return false;
  }
};

// Main test runner
const runTests = () => {
  console.log('🚀 Starting Audit Logs Plugin Tests\n');
  
  const results = [
    testPluginStructure(),
    testAuditLogService(),
    testController(),
  ];
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The audit logs plugin is ready to use.');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm run build');
    console.log('3. Configure the plugin in your Strapi app');
    console.log('4. Set up permissions in the admin panel');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check the errors above.');
    process.exit(1);
  }
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testAuditLogService,
  testController,
  testPluginStructure,
  runTests,
};