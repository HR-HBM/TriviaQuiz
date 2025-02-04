import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?sslmode=require`;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Set to true if you can verify the cert chain properly
  },
});

export { pool };
