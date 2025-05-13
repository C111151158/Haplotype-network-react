import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/Haplotype-network-react/", // ✅ 確保這跟 GitHub Repo 名一致

  plugins: [react()],

  worker: {
    format: "es",
    plugins: () => [react()], // ✅ 改成 function 回傳陣列
  },

  server: {
    proxy: {
      '/api': {
        target: ' http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
