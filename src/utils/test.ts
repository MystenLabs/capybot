import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
} from "@mysten/sui.js";
import { getBalancesForCoinTypes } from "./utils";

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

let provider = new JsonRpcProvider(
  new Connection({
    fullnode: "https://fullnode.mainnet.sui.io",
  })
);
const signer = new RawSigner(keypair, provider);

const amountIn: number = 10000;
const amountOut: number = 10000;
const byAmountIn: boolean = true;
const slippage: number = 5; // Allow for 5% slippage (??)

let coinBalances: Map<string, BigInt>;
const getCoinBalances = async () => {
  console.log(keypair.getPublicKey().toSuiAddress());
  coinBalances = await getBalancesForCoinTypes(
    provider,
    keypair.getPublicKey().toSuiAddress(),
    new Set<string>([
      "0x2::sui::SUI",
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
      "0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN",
      "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
      "0xe4239cd951f6c53d9c41e25270d80d31f925ad1655e5ba5b543843d4a66975ee::SUIP::SUIP",
      "0x1d58e26e85fbf9ee8596872686da75544342487f95b1773be3c9a49ab1061b19::suia_token::SUIA_TOKEN",
      "0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN",

      // coins.SUI,
      // coins.USDC,
      // coins.CETUS,
      // coins.WETH,
      // coins.USDT,
      // coins.SUIP,
      // coins.SUIA,
      // coins.WSOL,
    ])
  );
};

getCoinBalances().then((res) => {
  console.log(coinBalances);
});
