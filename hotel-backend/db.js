const { Pool } = require('pg');

const pool = new Pool({
  user: "tvishaakandala",
  host: "/tmp",
  database: "tvishaakandala",
  password: "",
  port: 8888,
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

module.exports = pool;
