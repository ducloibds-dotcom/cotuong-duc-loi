import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Dùng domain riêng (cotuong.678.vn) nên base = "/"
// Nếu deploy ở dạng username.github.io/ten-repo thì đổi base thành "/ten-repo/"
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-512-maskable.png", "favicon.png", "og-image.jpg"],
      manifest: {
        name: "Cờ Tướng · ĐỨC LỢI",
        short_name: "Cờ Tướng",
        description: "Cờ Tướng 100 cấp độ, bộ đếm thời gian, giải thưởng lũy thừa — ĐỨC LỢI",
        lang: "vi",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#111111",
        theme_color: "#111111",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,woff2}"],
        // Cache font Google Fonts để chơi được cả khi mất mạng sau lần đầu tải
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: "/",
});
