import app from "./hono";

const port = Number(process.env.PORT || 3000);

export default {
  port,
  fetch: app.fetch,
};

console.log(`[hono] API listening on http://localhost:${port}`);

