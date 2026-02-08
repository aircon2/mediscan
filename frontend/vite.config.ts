import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const mockPath = path.resolve(__dirname, "../mock.json");

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "serve-root-mock",
      configureServer(server) {
        server.middlewares.use("/mock.json", (_req, res, next) => {
          fs.readFile(mockPath, (err, data) => {
            if (err) {
              next();
              return;
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(data);
          });
        });
      },
    },
  ],
});
