import { createServer } from "node:http";
import { loadEnv } from "./lib/server/environment.js";
import { requestHandler } from "./lib/http/request-handler.js";

await loadEnv(".env.local");
export default requestHandler;

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 4000);
  createServer(requestHandler).listen(port, () => {
    console.log(`Think Bible running at http://localhost:${port}/`);
  });
}
