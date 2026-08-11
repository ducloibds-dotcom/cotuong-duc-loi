import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dùng domain riêng (cotuong.678.vn) nên base = "/"
// Nếu deploy ở dạng username.github.io/ten-repo thì đổi base thành "/ten-repo/"
export default defineConfig({
  plugins: [react()],
  base: "/",
});
