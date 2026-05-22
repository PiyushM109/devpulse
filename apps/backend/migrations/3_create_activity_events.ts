import { MigrationBuilder } from "node-pg-migrate";


export const shorthands : undefined = undefined;

export async function up(pgm:MigrationBuilder) : Promise<void> {
    pgm.createType('event_type',[
        'push',
        'pull_request_opened',
        'pull_request_closed',
        'pull_request_merged',
        'pull_request_review',
        'issue_opened',
        'issue_closed',
        'deployment',
    ]);

    pgm.createType('event_source',['github', 'gitlab', 'manual']);

    pgm.createTable('activity_events',{
        id : {
            type : 'uuid',
            primaryKey : true,
            default : pgm.func('gen_random_uuid()')
        },
        team_id : {
            type : 'uuid',
            notNull : true,
            references : 'teams(id)',
            onDelete : 'CASCADE'
        },
        user_id : {
            type : 'uuid',
            notNull : false,
            references : 'users(id)',
            onDelete : 'SET NULL',
        },
        event_type : {
            type : 'event_type',
            notNull : true
        },
        source : {
            type : 'event_source',
            notNull : true,
            default : 'github',
        },
        external_id :{
            type : 'varchar(255)',
            notNull : false
        },
        title : {
            type : 'varchar(500)',
            notNull : false
        },
        url :{
            type : 'varchar(1000)',
            notNull : false,
        },
        metadata :{
            type : 'jsonb',
            notNull : false,
            default : '{}',
        },
        occurred_at : {
            type :'timestamptz',
            notNull:true,
        },
        created_at : {
            type : 'timestamptz',
            notNull : true,
            default : pgm.func('now()'),
        },
    });

    pgm.createIndex('activity_events', ['team_id','occurred_at']);

    pgm.createIndex('activity_events',['user_id','occurred_at']);

    pgm.createIndex('activity_events',['team_id','event_type']);

    pgm.createConstraint(
        'activity_events',
        'activity_events_unique_external',
        'UNIQUE(source, external_id)'
    );

    pgm.createIndex('activity_events', 'metadata',{method : 'gin'});
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('activity_events');
  pgm.dropType('event_type');
  pgm.dropType('event_source');
}