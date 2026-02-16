/**
 * Initialize MySQL schema for sync server.
 * Run with: npx tsx scripts/init-mysql.ts
 */

import mysql from 'mysql2/promise';

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3312'),
  user: process.env.MYSQL_USER || 'bible',
  password: process.env.MYSQL_PASSWORD || 'test',
  database: process.env.MYSQL_DATABASE || 'bible',
};

const statements = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_name VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS sync_items (
    user_id INT NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    data JSON NOT NULL,
    updated_at BIGINT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, data_type, item_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_updated (user_id, updated_at)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS sync_cursors (
    user_id INT NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    last_sync_at BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, device_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS user_bibles (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    mapping_id VARCHAR(50) NOT NULL,
    verse_counts JSON,
    uploaded_at BIGINT NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS user_bible_chapters (
    bible_id VARCHAR(100) NOT NULL,
    book_id INT NOT NULL,
    chapter INT NOT NULL,
    data JSON NOT NULL,
    PRIMARY KEY (bible_id, book_id, chapter),
    FOREIGN KEY (bible_id) REFERENCES user_bibles(id) ON DELETE CASCADE
  ) ENGINE=InnoDB`,
];

async function main() {
  console.log('Connecting to MySQL...', { host: config.host, port: config.port, database: config.database });
  const conn = await mysql.createConnection(config);

  for (const stmt of statements) {
    console.log('Executing:', stmt.substring(0, 60) + '...');
    await conn.execute(stmt);
  }

  console.log('Schema created successfully.');
  await conn.end();
}

main().catch(err => {
  console.error('Failed to initialize MySQL:', err);
  process.exit(1);
});
