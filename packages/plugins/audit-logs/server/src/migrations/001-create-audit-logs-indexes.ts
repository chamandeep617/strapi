/**
 * Migration to create indexes for the audit_logs table
 * This improves query performance for common filtering operations
 */

export default {
  async up(knex: any) {
    // Create indexes for commonly queried fields
    await knex.schema.alterTable('audit_logs', (table: any) => {
      // Index for content type filtering
      table.index(['content_type'], 'audit_logs_content_type_idx');
      
      // Index for user filtering
      table.index(['user_id'], 'audit_logs_user_id_idx');
      
      // Index for action filtering
      table.index(['action'], 'audit_logs_action_idx');
      
      // Index for timestamp filtering (most common)
      table.index(['timestamp'], 'audit_logs_timestamp_idx');
      
      // Composite index for content type + timestamp (common combination)
      table.index(['content_type', 'timestamp'], 'audit_logs_content_type_timestamp_idx');
      
      // Composite index for user + timestamp
      table.index(['user_id', 'timestamp'], 'audit_logs_user_id_timestamp_idx');
      
      // Index for record lookup
      table.index(['content_type', 'record_id'], 'audit_logs_record_lookup_idx');
    });
  },

  async down(knex: any) {
    // Drop all indexes
    await knex.schema.alterTable('audit_logs', (table: any) => {
      table.dropIndex(['content_type'], 'audit_logs_content_type_idx');
      table.dropIndex(['user_id'], 'audit_logs_user_id_idx');
      table.dropIndex(['action'], 'audit_logs_action_idx');
      table.dropIndex(['timestamp'], 'audit_logs_timestamp_idx');
      table.dropIndex(['content_type', 'timestamp'], 'audit_logs_content_type_timestamp_idx');
      table.dropIndex(['user_id', 'timestamp'], 'audit_logs_user_id_timestamp_idx');
      table.dropIndex(['content_type', 'record_id'], 'audit_logs_record_lookup_idx');
    });
  },
};