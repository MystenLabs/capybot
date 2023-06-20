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

export async function SUItoUSDT() {
  const price = await getTickerPrice("SUIUSDT");
  return price;
}

export async function SUItoTUSD() {
  const price = await getTickerPrice("SUITUSD");
  return price;
}

export async function SUItoBTC() {
  const price = await getTickerPrice("SUIBTC");
  return price;
}

export async function SUItoBNB() {
  const price = await getTickerPrice("SUIBNB");
  return price;
}

export async function SUItoEUR() {
  const price = await getTickerPrice("SUIEUR");
  return price;
}

export async function SUItoTRY() {
  const price = await getTickerPrice("SUITRY");
  return price;
}
