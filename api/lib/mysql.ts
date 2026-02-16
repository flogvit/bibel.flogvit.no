/**
 * MySQL connection pool for sync server.
 */

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3312'),
  user: process.env.MYSQL_USER || 'bible',
  password: process.env.MYSQL_PASSWORD || 'test',
  database: process.env.MYSQL_DATABASE || 'bible',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
