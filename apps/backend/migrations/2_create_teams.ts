import { MigrationBuilder} from "node-pg-migrate";

export const shorthands:  undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
    pgm.createTable('teams', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        name: {
            type: 'varchar(100)',
            notNull: true
        },
        slug: {
            type: 'varchar(100)',
            notNull: true,
            unique: true,
        },
        description: {
            type: 'text',
            notNull: false,
        },
        avatar_url: {
            type: 'varchar(100)',
            notNull: false,
        },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        }
    });

    pgm.createType('team_role', ['owner', 'admin', 'member']);

    pgm.createTable('team_members', {
        id: {
            type: 'uuid',
            primaryKey: true,
            default: pgm.func('gen_random_uuid()'),
        },
        team_id: {
            type: 'uuid',
            notNull: true,
            references: 'teams(id)',
            onDelete: 'CASCADE',
        },
        user_id: {
            type: 'uuid',
            notNull: true,
            references: 'users(id)',
            onDelete: 'CASCADE',
        },
        role: {
            type: 'team_role',
            notNull: true,
            default: 'member',
        },
        joined_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('now()'),
        },
    });

    pgm.addConstraint('team_members', 'team_members_unique_membership', 'UNIQUE(team_id, user_id)');


    pgm.createIndex('team_members', 'team_id');
    pgm.createIndex('team_members', 'user_id');
}


export async function down(pgm: MigrationBuilder) {
    pgm.dropTable('team_members');
    pgm.dropTable('teams');
    pgm.dropType('team_role')
}