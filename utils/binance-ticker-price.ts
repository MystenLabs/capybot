import { Spot } from "@binance/connector";

const client = new Spot();

async function getTickerPrice(symbol: string): Promise<string> {
  const tickerPrice = await client.tickerPrice(symbol);
  return tickerPrice.data.price;
}

export async function BTCtoUSDT() {
  const price = await getTickerPrice("BTCUSDT");
  return price;
}

export async function BTCtoUSDC() {
  const price = await getTickerPrice("BTCUSDC");
  return price;
}

