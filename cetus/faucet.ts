import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

import {
  Connection,
  Ed25519Keypair,
  JsonRpcProvider,
  RawSigner,
  TransactionBlock,
} from "@mysten/sui.js";

const phrase = process.env.ADMIN_PHRASE;
const keypair = Ed25519Keypair.deriveKeypair(phrase!);

const connOptions = new Connection({
  fullnode: "https://rpc.testnet.sui.io:443",
});
console.log("Connecting to ", "https://rpc.testnet.sui.io:443");

let provider = new JsonRpcProvider(connOptions);
const signer = new RawSigner(keypair, provider);

const tx = new TransactionBlock();
tx.setGasBudget(1500000000);

//Package - USDCSupply
//0x0588cff9a50e0eaf4cd50d337c1a36570bc1517793fd3303e1513e8ad4d2aa96 - 0xd117614756fb900988e5f540b9a4a5b5345845be6ff8a09d9e96a5cae5092bb3
//0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc - 0xdf6cb5a605e6f91120ac2fe925b897ca44a393b53ad33d52634263774adc9db3

tx.moveCall({
  target: `0x26b3bc67befc214058ca78ea9a2690298d731a2d4309485ec3d40198063c4abc::usdc::faucet`,
  arguments: [
    tx.object(
      "0xdf6cb5a605e6f91120ac2fe925b897ca44a393b53ad33d52634263774adc9db3"
    ),
  ],
});

signer
  .signAndExecuteTransactionBlock({
    transactionBlock: tx,
    requestType: "WaitForLocalExecution",
    options: {
      showObjectChanges: true,
      showEffects: true,
    },
  })
  .then(function (res) {
    console.log("executed! result = ", res);
  });
