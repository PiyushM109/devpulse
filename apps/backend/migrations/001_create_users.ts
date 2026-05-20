import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate'

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createExtension('pgcrypto', { ifNotExists: true });

    pgm.createTable('users', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        email: {
            type: 'varchar(255)',
            notNull: true,
            unique: true,
        },
        username: {
            type: 'varchar(100)',
            notNull: true,
            unique: true,
        },
        password_hash: {
            type: 'varchar(255)',
            notNull: false,
        },
        github_id: {
            type: 'varchar(100)',
            notNull: false,
            unique: true
        },
        avatar_url: {
            type: 'varchar(500)',
            notNull: false,
        },
        is_active: {
            type: 'boolean',
            notNull: true,
            default: true
        },
        created_at: {
            type: 'timestampz',
            notNull: true,
            default: pgm.func('now()'),
        },
        updates_at: {
            type: 'timestampz',
            notNull: true,
            default: pgm.func('now()'),
        },
    });

    pgm.createIndex('users', 'github_id', {
        unique: true,
        where: 'github_id IS NOT NULL',
    });

    pgm.sql("CREATE INDEX users_email_lower_idx ON users (lower(email));");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
    pgm.dropTable('users');
}