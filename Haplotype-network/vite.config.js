import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  worker: {
    format: "es",
    plugins: [react()], // ✅ 確保 Worker 也支援 React
  },
});


