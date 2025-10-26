export default ({ strapi }: { strapi: any }) => ({
    async find(ctx: any) {
        try {
            const { query } = ctx.request;

            // Parse filters
            const filters: any = {};
            if (query.contentType) {
                filters.contentType = query.contentType;
            }
            if (query.userId) {
                filters.userId = query.userId;
            }
            if (query.action) {
                filters.action = query.action;
            }
            if (query.dateFrom || query.dateTo) {
                filters.timestamp = {};
                if (query.dateFrom) {
                    filters.timestamp.$gte = new Date(query.dateFrom);
                }
                if (query.dateTo) {
                    filters.timestamp.$lte = new Date(query.dateTo);
                }
            }

            // Parse pagination
            const pagination = {
                start: parseInt(query.start) || 0,
                limit: Math.min(parseInt(query.limit) || 25, 100), // Max 100 items per page
            };

            // Parse sorting
            const sort = query.sort ?
                query.sort.split(',').map((field: string) => {
                    const [key, order] = field.split(':');
                    return { [key]: order === 'asc' ? 'asc' : 'desc' };
                }) :
                [{ timestamp: 'desc' }];

            const [results, total] = await strapi
                .plugin('audit-logs')
                .service('audit-log-service')
                .findAuditLogs({ filters, sort, pagination });

            ctx.body = {
                data: results,
                meta: {
                    pagination: {
                        start: pagination.start,
                        limit: pagination.limit,
                        total,
                    },
                },
            };
        } catch (error) {
            strapi.log.error('Error fetching audit logs:', error);
            ctx.throw(500, 'Internal server error');
        }
    },

    async findOne(ctx: any) {
        try {
            const { id } = ctx.params;

            const result = await strapi.db.query('plugin::audit-logs.audit-log').findOne({
                where: { id },
            });

            if (!result) {
                return ctx.notFound('Audit log entry not found');
            }

            ctx.body = { data: result };
        } catch (error) {
            strapi.log.error('Error fetching audit log:', error);
            ctx.throw(500, 'Internal server error');
        }
    },
});