import { LinearBackoff, WebsocketBuilder } from "websocket-ts";

// The base endpoint is: wss://ws-api.binance.com:443/ws-api/v3
// If you experience issues with the standard 443 port, alternative port 9443 is also available.
const ws = new WebsocketBuilder("wss://stream.binance.com:9443/ws/bnbbtc@1000")
  .onOpen((i, ev) => {
    console.log("opened");
  })
  .onClose((i, ev) => {
    console.log("closed");
  })
  .onError((i, ev) => {
    console.log("error");
  })
  .onMessage((i, ev) => {
    console.log("*** onMessage", ev.data);
  })
  .onRetry((i, ev) => {
    console.log("retry");
  })
  .withBackoff(new LinearBackoff(0, 1000, 10000)) // 1000ms = 1s
  .build();

// const wsClient = new WebsocketClient("wss://ws-api.binance.com/ws-api/v3");
