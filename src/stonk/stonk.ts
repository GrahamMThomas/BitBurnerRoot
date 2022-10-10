import { NS } from "/../NetscriptDefinitions";

const PRICE_HISTORY_LENGTH = 30;
const MAGNITUDE_WEIGHT = 5;
const RECENT_UPDOOTS_WEIGHT = 0.008;

interface TickData {
  price: number; // Price at current tick

  // Based on comparison from last price
  bull: boolean; // Is teh change up or down
  magnitude: number; // Percent amount of  change. so 0.05 for 5 percent change
}

export class Stonk {
  ns: NS;
  ticker: string;
  priceHistory: Array<TickData>;
  currentPrice: number;

  constructor(ns: NS, ticker: string) {
    this.ns = ns;
    this.ticker = ticker;
    this.priceHistory = [];
    this.currentPrice = 0;
    this.update();
  }

  update(): void {
    this.currentPrice = this.ns.stock.getAskPrice(this.ticker);
    this.priceHistory.push(this.getNewTickData(this.currentPrice));
    while (this.priceHistory.length > PRICE_HISTORY_LENGTH) {
      this.priceHistory.shift();
    }
  }

  getForecast(): number {
    if (this.ns.stock.has4SDataTIXAPI()) {
      return this.ns.stock.getForecast(this.ticker);
    } else {
      const magnitudeCoef = 0.5 / PRICE_HISTORY_LENGTH;

      let forecast = 0.5;
      let i = 1;
      for (const tickData of this.priceHistory) {
        const changeAmount = magnitudeCoef * tickData.magnitude * MAGNITUDE_WEIGHT;
        const latestWeight = Math.log(i) * RECENT_UPDOOTS_WEIGHT;

        forecast += (changeAmount + latestWeight) * (tickData.bull ? 1 : -1);
        i += 1;
      }
      return forecast;
    }
  }

  private getNewTickData(newPrice: number): TickData {
    const lastTick = this.priceHistory.at(-1);

    const tickData = {} as TickData;
    tickData.price = newPrice;

    if (lastTick == undefined) {
      tickData.bull = false;
      tickData.magnitude = 0;
      return tickData;
    }

    const priceDifference = newPrice - lastTick.price;
    tickData.magnitude = Math.abs(priceDifference / newPrice);
    if (priceDifference > 0) {
      tickData.bull = true;
    } else {
      tickData.bull = false;
    }

    return tickData;
  }
}
