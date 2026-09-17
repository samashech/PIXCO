import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: "brickbox-content-policy",
      transformIndexHtml() {
        if (command !== "build") return;
        return [
          {
            tag: "meta",
            attrs: {
              "http-equiv": "Content-Security-Policy",
              content:
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; worker-src 'self'",
            },
            injectTo: "head",
          },
        ];
      },
    },
  ],
  base: "./",
}));
