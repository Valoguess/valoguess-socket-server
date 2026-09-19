import { createServer } from "node:http";
import { createSocketServer } from "@/setup/socket.js";
import helmet from "helmet";

const runHelmet = helmet();
const PORT = Number(process.env.PORT ?? 5000);
const httpServer = createServer(((req, res) => {
  runHelmet(req, res, (err) => {
    if (err) {
      res.statusCode = 500;
      res.end(
        "Helmet failed for some unexpected reason. Was it configured correctly?",
      );
      return;
    }
  });
}));


createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Socket Server running `);
  console.log(`   Local: http://localhost:${PORT}`);
});
