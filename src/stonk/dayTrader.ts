import { NS } from "@ns";
import { toDollars } from "/hack/lib/helpers";
import { Stonk, PRICE_HISTORY_LENGTH } from "stonk/stonk";

const POSITION_SIZE = 20000000;
const MAX_SHARES = 10000;

const MINIMUM_PRICE_CHANGE = 0.15;
const MINIMUM_VOLATILITY = 0.008;

export async function main(ns: NS): Promise<void> {
  ns.disableLog("disableLog");
  ns.disableLog("sleep");
  ns.disableLog("exec");
  ns.disableLog("getServerMoneyAvailable");

  const stockTickers = ns.stock.getSymbols();
  const stonks = stockTickers.map((x) => new Stonk(ns, x));

  ns.exec("stonk/callbacks/sellLikeHotcakes.js", "home");

  while (true) {
    const shouldSleepPrice = ns.stock.getPrice("ECP");
    ns.print("\n######################################");
    for (const stonk of stonks) {
      stonk.update();

      const [shares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(stonk.ticker);
      const stockPrice = ns.stock.getPrice(stonk.ticker);
      const stockForecast = stonk.getForecast();
      const stockVolatility = stonk.getVolatility();
      if (shares != 0 || sharesShort != 0) {
        ns.print(`Stock: ${stonk.ticker} - ${toPercent(stockForecast)} - ${toDollars(stockPrice)}`);
        ns.print(
          `Position Long: ${shares}@${toDollars(avgPx)} Short: Long: ${sharesShort}@${toDollars(
            avgPxShort
          )}`
        );
        // ns.print(
        //   stonk.priceHistory
        //     .map((x) => `${x.bull ? "" : "-"}${(x.magnitude * 100).toFixed(2)}%`)
        //     .join("\n")
        // );
      }

      // Wait until full price history to decide anything
      if (stonk.priceHistory.length != PRICE_HISTORY_LENGTH) {
        ns.print(
          `Waiting for full priceHistory... ${stonk.priceHistory.length}/${PRICE_HISTORY_LENGTH}`
        );
        continue;
      }

      const myMoney = ns.getServerMoneyAvailable("home");
      // Buy Logic
      if (
        myMoney > POSITION_SIZE &&
        shares == 0 &&
        sharesShort == 0 &&
        stockForecast >= 0.5 + MINIMUM_PRICE_CHANGE
      ) {
        let shareCount = Math.floor(POSITION_SIZE / stockPrice);
        if (shareCount > POSITION_SIZE * 2) {
          continue;
        }
        shareCount = Math.min(MAX_SHARES, shareCount);
        ns.stock.buyStock(stonk.ticker, shareCount);
        ns.toast(
          `Bought ${shareCount} shares in ${stonk.ticker} @${toDollars(stockPrice)}`,
          "info",
          10000
        );
      }

      if (
        myMoney > POSITION_SIZE &&
        shares == 0 &&
        sharesShort == 0 &&
        stockForecast <= 0.5 - MINIMUM_PRICE_CHANGE
      ) {
        let shareCount = Math.floor(POSITION_SIZE / stockPrice);
        if (shareCount > POSITION_SIZE * 2) {
          continue;
        }
        shareCount = Math.min(MAX_SHARES, shareCount);
        ns.stock.buyShort(stonk.ticker, shareCount);
        ns.toast(
          `Shorted ${shareCount} shares in ${stonk.ticker} @${toDollars(stockPrice)}`,
          "info",
          10000
        );
      }

      // Liquidate if crossing over 50%
      if (shares != 0 && stockForecast < 0.5) {
        const sellPrice = ns.stock.sellStock(stonk.ticker, shares);
        ns.toast(
          `Sold ${stonk.ticker} for ${toDollars(shares * (sellPrice - avgPx) - 200000)}`,
          "success",
          null
        );
      }
      if (sharesShort != 0 && stockForecast > 0.5) {
        const sellPrice = ns.stock.sellShort(stonk.ticker, sharesShort);
        ns.toast(
          `Covered ${stonk.ticker} for ${toDollars(
            sharesShort * (avgPxShort - sellPrice) - 200000
          )}`,
          "success",
          null
        );
      }
    }

    // Mechanism for detecting 4s vs 6s
    while (shouldSleepPrice == ns.stock.getPrice("ECP")) {
      await ns.sleep(1000);
    }
  }
}

function toPercent(percent: number): string {
  return `%${(percent * 100).toFixed(2)}`;
}
