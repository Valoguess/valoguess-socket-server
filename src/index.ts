import helmet from "helmet";
import { createServer } from "node:http";
import { createSocketServer } from "@/setup/socket";

const runHelmet = helmet();
const PORT = Number(process.env.PORT ?? 5000);
const httpServer = createServer((req, res) => {
  runHelmet(req, res, (err) => {
    if (err) {
      res.statusCode = 500;
      res.end(
        "Helmet failed for some unexpected reason. Was it configured correctly?",
      );
      return;
    }
  });
});

createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket Server running `);
  console.log(`   Local: http://localhost:${PORT}`);
});
