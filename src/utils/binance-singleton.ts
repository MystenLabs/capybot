import { binance } from "ccxt";

class BinanceSingleton {
  instance: any = null;
  binanceExchange = new binance({ enableRateLimit: true });

  constructor() {
    if (!this.instance) {
      this.instance = this;
    }
    return this.instance;
  }
}

const singleton: BinanceSingleton = new BinanceSingleton();
Object.freeze(singleton);
export default singleton;
