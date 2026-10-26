import { defineConfig } from "vitest/config";
import path from "path";

// تست‌های یکپارچه با Mongo واقعی. فقط با: npm run test:integration
// فایل‌ها با پسوند .itest.ts هستند تا `npm test` آن‌ها را اجرا نکند.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.itest.ts"],
    // ترتیب مهم است: محافظ اول، تا vitest.setup.ts مقدار MONGODB_URI را عوض نکند.
    setupFiles: ["./src/test/integration/guard.ts", "./vitest.setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
