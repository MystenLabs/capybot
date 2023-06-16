import { WebsocketStream } from "@binance/connector";
import { Console } from "console";

const logger = new Console({ stdout: process.stdout, stderr: process.stderr });

const callbacks = {
  open: () => logger.debug("Connected with Websocket server"),
  close: () => logger.debug("Disconnected with Websocket server"),
  message: (data: any) => logger.info(data),
};

const websocketStreamClient = new WebsocketStream({
  logger,
  callbacks,
  combinedStreams: true,
});

websocketStreamClient.kline("btcusdt", "1m");

// import { WebsocketStream } from "@binance/connector";

// const { Console } = require("console");

// const logger = new Console({ stdout: process.stdout, stderr: process.stderr });

// const callbacks = {
//   open: () => logger.debug("Connected with Websocket server"),
//   close: () => logger.debug("Disconnected with Websocket server"),
//   message: (data) => logger.info(data),
// };

// const websocketStreamClient = new WebsocketStream({
//   logger,
//   callbacks,
//   combinedStreams: true,
// });

// websocketStreamClient.kline("btcusdt", "1m");
