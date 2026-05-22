import 'dotenv/config';
import { db } from '../db/client';

async function seed() {
  console.log('🌱 Seeding database...');

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Wipe existing data in dependency order (children before parents)
    await client.query('DELETE FROM activity_events');
    await client.query('DELETE FROM notification_preferences');
    await client.query('DELETE FROM team_members');
    await client.query('DELETE FROM teams');
    await client.query('DELETE FROM users');

    // ── Users ────────────────────────────────────────────────────
    const usersResult = await client.query(`
      INSERT INTO users (email, username, avatar_url) VALUES
        ('alice@devpulse.dev',   'alice',   'https://api.dicebear.com/7.x/avataaars/svg?seed=alice'),
        ('bob@devpulse.dev',     'bob',     'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'),
        ('charlie@devpulse.dev', 'charlie', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie'),
        ('diana@devpulse.dev',   'diana',   'https://api.dicebear.com/7.x/avataaars/svg?seed=diana')
      RETURNING id, username
    `);

    const users = usersResult.rows as { id: string; username: string }[];
    const [alice, bob, charlie, diana] = users;
    console.log(`  ✓ Created ${users.length} users`);

    // ── Teams ─────────────────────────────────────────────────────
    const teamsResult = await client.query(`
      INSERT INTO teams (name, slug, description) VALUES
        ('Platform Engineering', 'platform-eng', 'Core infra and developer tooling'),
        ('Product Frontend',     'product-fe',   'User-facing React applications')
      RETURNING id, slug
    `);

    const teams = teamsResult.rows as { id: string; slug: string }[];
    const [platformTeam, feTeam] = teams;
    console.log(`  ✓ Created ${teams.length} teams`);

    // ── Team members ──────────────────────────────────────────────
    await client.query(`
      INSERT INTO team_members (team_id, user_id, role) VALUES
        ($1, $2, 'owner'),
        ($1, $3, 'admin'),
        ($1, $4, 'member'),
        ($5, $2, 'member'),
        ($5, $6, 'owner')
    `, [platformTeam.id, alice.id, bob.id, charlie.id, feTeam.id, diana.id]);
    console.log('  ✓ Created team memberships');

    // ── Activity events (90 days of realistic data) ───────────────
    const eventTypes = [
      'push', 'pull_request_opened', 'pull_request_merged',
      'pull_request_review', 'issue_opened', 'issue_closed',
    ];

    const eventInserts: string[] = [];
    const eventValues: unknown[] = [];
    let paramIndex = 1;

    // Generate ~5 events per day for 90 days — enough to make charts interesting
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      // Fewer events on weekends (realistic dev activity pattern)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const eventCount = isWeekend
        ? Math.floor(Math.random() * 2)
        : Math.floor(Math.random() * 6) + 2;

      for (let i = 0; i < eventCount; i++) {
        const user = users[Math.floor(Math.random() * users.length)];
        const team = teams[Math.floor(Math.random() * teams.length)];
        const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const occurred = new Date(date);
        occurred.setHours(Math.floor(Math.random() * 10) + 8); // 8am–6pm

        eventInserts.push(
          `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
        );
        eventValues.push(
          team.id, user.id, type, `Sample ${type} event`,
          occurred.toISOString(),
          JSON.stringify({ branch: 'main', generated: true })
        );
      }
    }

    await client.query(
      `INSERT INTO activity_events (team_id, user_id, event_type, title, occurred_at, metadata)
       VALUES ${eventInserts.join(', ')}`,
      eventValues
    );
    console.log(`  ✓ Created ~${eventInserts.length} activity events`);

    // ── Notification prefs (one per user) ─────────────────────────
    for (const user of users) {
      await client.query(`
        INSERT INTO notification_preferences (user_id, digest_frequency, email_on_mention)
        VALUES ($1, 'daily', true)
      `, [user.id]);
    }
    console.log('  ✓ Created notification preferences');

    await client.query('COMMIT');
    console.log('\n✅ Seed complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed, rolled back:', err);
    throw err;
  } finally {
    client.release();
    await db.end();
  }
}

seed().catch(() => process.exit(1));