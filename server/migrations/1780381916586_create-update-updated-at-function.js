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
  pgm.createFunction(
    'update_updated_at',
    [],
    {
      returns: 'TRIGGER',
      language: 'plpgsql',
    },
    `
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
    `,
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropFunction('update_updated_at', [], {
    ifExists: true,
    cascade: true,
  });
};
