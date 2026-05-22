import { MigrationBuilder } from "node-pg-migrate";

export const shorthands: undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createType('digest_frequency', ['daily', 'weekly', 'never']);

  pgm.createTable('notification_preferences', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    user_id: {
      type: 'uuid',
      notNull: true,
      unique: true, 
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    digest_frequency: {
      type: 'digest_frequency',
      notNull: true,
      default: 'daily',
    },
    email_on_mention: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    slack_on_deployment: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    slack_webhook_url: {
      type: 'varchar(500)',
      notNull: false,
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('notification_preferences');
  pgm.dropType('digest_frequency');
}