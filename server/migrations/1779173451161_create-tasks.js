/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable('tasks', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: { type: 'varchar(250)', notNull: true },
    description: {
      type: 'text',
    },
    status: {
      type: 'text',
      notNull: true,
      check:
        "status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')",
      default: 'backlog',
    },
    priority: {
      type: 'text',
      notNull: true,
      check: "priority IN ('urgent', 'high', 'medium', 'low', 'no_priority')",
      default: 'no_priority',
    },
    label: {
      type: 'text',
      check: "label IN ('bug', 'feature', 'improvement')",
      default: null,
    },
    assignee: {
      type: 'uuid',
      references: 'users(id)',
      onDelete: 'SET NULL',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('tasks');
};
