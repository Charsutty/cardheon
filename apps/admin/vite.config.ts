import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: { allow: ["../.."] },
    // Avoid exhausting low inotify limits in monorepo/dev-container environments.
    watch: { usePolling: true, interval: 500 },
  },
});
