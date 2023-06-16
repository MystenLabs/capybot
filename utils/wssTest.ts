// Subscribe to wss://stream.binance.com:9443/ws/bnbbtc@1000 and console.log the data

import { LinearBackoff, WebsocketBuilder } from "websocket-ts";

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

//print the data onMessage

