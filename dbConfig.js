import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';

dotenv.config();

const { Pool } = pkg;

const isProduction = process.env.NODE_ENV === "production";
const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}?sslmode=verify-full`;

// Define paths to the secret file (ca.pem)
const possiblePaths = [
  '/etc/secrets/ca.pem', // Check the /etc/secrets/ directory
  '/ca.pem'              // Check the root directory
];

// Try to read the CA certificate from the possible paths
let caCert = null;
for (const path of possiblePaths) {
  try {
    caCert = fs.readFileSync(path, 'utf8');
    console.log(`CA certificate found at ${path}`); // Log the path where the certificate was found
    break;
  } catch (err) {
    console.error(`Error reading CA certificate from ${path}:`, err);
  }
}

if (!caCert) {
  throw new Error("Unable to find CA certificate.");
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: true, // Enforces SSL certificate verification
    ca: caCert, // Attach the CA certificate
  },
});

export { pool };
