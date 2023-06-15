import { BTCtoUSDC, BTCtoUSDT } from "./ticker-price";

let BTCtoUSDTprice: string;
let BTCtoUSDCprice: string;

const getBTCtoUSDTprice = async () => {
  BTCtoUSDTprice = await BTCtoUSDT();
};

const getBTCtoUSDCprice = async () => {
  BTCtoUSDCprice = await BTCtoUSDC();
};

getBTCtoUSDTprice().then((res) => {
  console.log(BTCtoUSDTprice);
});

getBTCtoUSDCprice().then((res) => {
  console.log(BTCtoUSDCprice);
});
