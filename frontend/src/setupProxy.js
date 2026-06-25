const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Proxies /api/* requests to the Vercel serverless backend during local dev.
 * Start the backend with: npm run dev --prefix backend  (port 3001)
 */
module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || "http://localhost:3001",
      changeOrigin: true,
    })
  );
};
