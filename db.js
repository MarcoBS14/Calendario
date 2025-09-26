import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

// Railway suele requerir SSL. Si no, pon ssl:false.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("railway") ? { rejectUnauthorized: false } : false
});

export async function query(q, params) {
  const client = await pool.connect();
  try { return await client.query(q, params); }
  finally { client.release(); }
}