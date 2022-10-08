import { NS } from "@ns";

export async function main(ns: NS): Promise<void> {
  ns.print("Hello Remote API!");

  const priceHistory: Array<string> = []
  const ticker = "ECP"

  let lastPrice = 0;
  while (true)
  {
    const currentPrice = ns.stock.getAskPrice(ticker)
    if (lastPrice > currentPrice){
      priceHistory.push('^')
    }
    else if (lastPrice == currentPrice){
      priceHistory.push('-')
    }
    else {
      priceHistory.push('v')
    }

    ns.print(priceHistory.join(''))
    await ns.sleep(6000)
    lastPrice = currentPrice
    // ns.print("New line")
  }
}