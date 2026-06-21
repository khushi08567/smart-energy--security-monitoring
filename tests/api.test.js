const test = require("node:test");
const assert = require("node:assert");
const http = require("node:http");
const { app, server } = require("../index");

test("Integration Test Suite - Smart Energy & Security Monitoring System API", async (t) => {
  let activeServer;
  let baseUrl;

  // Before all tests: start the Express server on a random free port
  t.before(() => {
    return new Promise((resolve, reject) => {
      // Set test environment variables to trigger SQLite fallback
      process.env.DB_DIALECT = "sqlite";
      process.env.PORT = 0; // 0 tells the OS to assign a random free port

      activeServer = server.listen(0, "127.0.0.1", () => {
        const address = activeServer.address();
        baseUrl = `http://127.0.0.1:${address.port}`;
        console.log(`Test server running at ${baseUrl}`);
        resolve();
      });

      activeServer.on("error", (err) => {
        reject(err);
      });
    });
  });

  // After all tests: close the server connection
  t.after(() => {
    return new Promise((resolve) => {
      if (activeServer) {
        activeServer.close(() => {
          console.log("Test server stopped.");
          resolve();
        });
      } else {
        resolve();
      }
    });
  });

  // Test Case 1: Health Check Endpoint
  await t.test("GET / should return api health status", async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, "Smart Energy & Security API is running");
    assert.ok(body.endpoints);
  });

  // Test Case 2: Swagger Documentation Endpoint
  await t.test("GET /api/docs should load Swagger UI HTML page", async () => {
    const res = await fetch(`${baseUrl}/api/docs/`);
    assert.strictEqual(res.status, 200);
    
    const htmlText = await res.text();
    assert.match(htmlText, /swagger-ui/i);
  });

  // Test Case 3: Swagger Document JSON Endpoint
  await t.test("GET /api/docs/json should return OpenAPI spec JSON", async () => {
    const res = await fetch(`${baseUrl}/api/docs/json`);
    assert.strictEqual(res.status, 200);
    
    const spec = await res.json();
    assert.strictEqual(spec.openapi, "3.0.0");
    assert.strictEqual(spec.info.title, "Smart Energy & Security Monitoring System API Docs");
  });

  // Test Case 4: Route Not Found (404)
  await t.test("GET /api/invalid-endpoint-name should return 404", async () => {
    const res = await fetch(`${baseUrl}/api/invalid-endpoint-name`);
    assert.strictEqual(res.status, 404);
    
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.message, "Route not found");
  });
});
