import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (pool) return pool;
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) return null;

  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 3,
    connectTimeout: 10000,
    ssl: { minVersion: "TLSv1.2" },
  });
  return pool;
}

export function sendJson(response, status, body) {
  response.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

export function methodNotAllowed(response, allowed) {
  response.setHeader("Allow", allowed.join(", "));
  sendJson(response, 405, { error: "Método no permitido." });
}

export function isDatabaseUnavailable(error) {
  return ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR"].includes(error?.code);
}
