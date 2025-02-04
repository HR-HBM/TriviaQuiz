import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
  ssl: isProduction
    ? {
        rejectUnauthorized: false, // Ensure proper SSL verification
        ca: process.env.CA_CERTIFICATE, // Use the environment variable for CA certificate
      }
    : false, // Disable SSL for local development
});

export { pool };
