import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import path, { dirname } from 'path';

const { Pool } = pkg;

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: isProduction
    ? { rejectUnauthorized: false , // Use SSL only in production
    ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
    }
    : false, // Disable SSL for local development
});

export { pool };
