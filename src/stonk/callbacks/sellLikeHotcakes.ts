import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  while (ns.isRunning("/stonk/dayTrader.js", "home")) {
    await ns.sleep(5000);
  }

  for (const sym of ns.stock.getSymbols()) {
    const [shares, avgPx, sharesShort, avgPxShort] = ns.stock.getPosition(sym);

    // Liquidate if crossing over 50%
    if (shares != 0) {
      ns.stock.sellStock(sym, shares);
    }
    if (sharesShort != 0) {
      ns.stock.sellShort(sym, sharesShort);
    }
  }
}
