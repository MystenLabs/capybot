import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

import { Connection, JsonRpcProvider } from "@mysten/sui.js";

const admin = process.env.ADMIN_ADDRESS!;

const connOptions = new Connection({
  fullnode: "https://rpc.testnet.sui.io:443",
});
console.log("Connecting to ", "https://rpc.testnet.sui.io:443");

let provider = new JsonRpcProvider(connOptions);

const coins: {
  version: string;
  digest: string;
  coinType: string;
  previousTransaction: string;
  coinObjectId: string;
  balance: string;
  lockedUntilEpoch?: number | null | undefined;
}[] = [];

async function getAllCoins() {
  let cursor: string | null = null;

  const { data } = await provider.getAllCoins({
    owner: admin,
  });

  console.log("Fetched data:", data.length);
  data.forEach((c) => {
    coins.push(c);
  });
}

async function getCoins(coinType: string) {
  let cursor: string | null = null;

  const { data } = await provider.getCoins({
    owner: admin,
    coinType,
  });

  console.log("Fetched data:", data.length);
  data.forEach((c) => {
    coins.push(c);
  });
}

// getAllCoins().then((res) => {
//   console.log(coins);
// });

// getCoins(
//   "0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc::usdc::USDC"
// ).then((res) => {
//   console.log(coins);
// });
