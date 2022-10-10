import { NS } from "@ns";
import { toDollars } from "/hack/lib/helpers";
import { Stonk } from "stonk/stonk";

const POSITION_SIZE = 2000000;

export async function main(ns: NS): Promise<void> {
  ns.disableLog("sleep");

  const stockTickers = ns.stock.getSymbols();
  const stonks = stockTickers.map((x) => new Stonk(ns, x));

  ns.exec("stonk/callbacks/sellLikeHotcakes.js", "home");

  while (true) {
    for (const stonk of stonks) {
      stonk.update();

      const [shares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(stonk.ticker);
      const stockPrice = ns.stock.getPrice(stonk.ticker);
      const stockForecast = stonk.getForecast();
      if (shares != 0 || sharesShort != 0) {
        ns.print(
          `\nStock: ${stonk.ticker} - ${toPercent(stockForecast)} - ${toDollars(stockPrice)}`
        );
        ns.print(
          `Position Long: ${shares}@${toDollars(avgPx)} Short: Long: ${sharesShort}@${toDollars(
            avgPxShort
          )}`
        );
      }

      // Buy Logic
      if (shares == 0 && stockForecast > 0.6) {
        const shareCount = Math.round(POSITION_SIZE / stockPrice); // 1 position is 1m
        ns.stock.buyStock(stonk.ticker, shareCount);
        ns.toast(
          `Bought ${shareCount} shares in ${stonk.ticker} @${toDollars(stockPrice)}`,
          "info",
          10000
        );
      }

      if (sharesShort == 0 && stockForecast < 0.4) {
        const shareCount = Math.round(POSITION_SIZE / stockPrice); // 1 position is 1m
        ns.stock.buyShort(stonk.ticker, shareCount);
        ns.toast(
          `Shorted ${shareCount} shares in ${stonk.ticker} @${toDollars(stockPrice)}`,
          "info",
          10000
        );
      }

      // Liquidate if crossing over 50%
      if (shares != 0 && stockForecast < 0.5) {
        ns.stock.sellStock(stonk.ticker, shares);
        ns.toast(
          `Sold ${shares} shares in ${stonk.ticker} @${toDollars(stockPrice)}`,
          "success",
          10000
        );
      }
      if (sharesShort != 0 && stockForecast > 0.5) {
        ns.stock.sellShort(stonk.ticker, sharesShort);
        ns.toast(
          `Covered ${sharesShort} shares in ${stonk.ticker} @${toDollars(stockPrice)}`,
          "success",
          10000
        );
      }
    }

    // Mechanism for detecting 4s vs 6s
    const shouldSleepPrice = ns.stock.getPrice("ECP");
    while (shouldSleepPrice == ns.stock.getPrice("ECP")) {
      await ns.sleep(1000);
    }
  }
}

function toPercent(percent: number): string {
  return `%${(percent * 100).toFixed(2)}`;
}
