import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import orders from "../api/orders.js";
import products from "../api/products.js";

const originalDatabaseEnvironment = {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
};

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: "",
    setHeader(name, value) { this.headers[name] = value; return this; },
    status(value) { this.statusCode = value; return this; },
    end(value) { this.body = value; },
  };
}

function withoutDatabaseCredentials() {
  delete process.env.DB_HOST;
  delete process.env.DB_USER;
  delete process.env.DB_PASSWORD;
  delete process.env.DB_NAME;
}

afterEach(() => {
  for (const [name, value] of Object.entries(originalDatabaseEnvironment)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

test("the product endpoint rejects methods other than GET", async () => {
  const response = createResponse();
  await products({ method: "POST" }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "GET");
});

test("the catalog reports missing TiDB configuration instead of returning demo data", async () => {
  withoutDatabaseCredentials();
  const response = createResponse();
  await products({ method: "GET" }, response);
  assert.equal(response.statusCode, 503);
  assert.match(JSON.parse(response.body).error, /TiDB Cloud/);
});

test("the order endpoint validates its payload before accessing TiDB", async () => {
  withoutDatabaseCredentials();
  const response = createResponse();
  await orders({ method: "POST", body: { customer: {}, items: [] }, headers: {} }, response);
  assert.equal(response.statusCode, 400);
  assert.match(JSON.parse(response.body).error, /nombre/);
});

test("the order endpoint rejects duplicate product IDs", async () => {
  withoutDatabaseCredentials();
  const response = createResponse();
  await orders({
    method: "POST",
    headers: {},
    body: {
      customer: { name: "Ana Pérez", email: "ana@example.com", phone: "", address: "Calle 123" },
      items: [{ id: 1, quantity: 1 }, { id: 1, quantity: 2 }],
    },
  }, response);
  assert.equal(response.statusCode, 400);
  assert.match(JSON.parse(response.body).error, /duplicados/);
});

test("the order endpoint reports missing TiDB configuration", async () => {
  withoutDatabaseCredentials();
  const response = createResponse();
  await orders({
    method: "POST",
    headers: {},
    body: {
      customer: { name: "Ana Pérez", email: "ana@example.com", phone: "", address: "Calle 123" },
      items: [{ id: 1, quantity: 2 }],
    },
  }, response);
  assert.equal(response.statusCode, 503);
  assert.match(JSON.parse(response.body).error, /TiDB Cloud/);
});
