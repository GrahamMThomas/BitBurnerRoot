import { NS } from "/../NetscriptDefinitions";

export const PRICE_HISTORY_LENGTH = 15;

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

  // Returns number between 0 and 1 as a percent of chance it will go up
  getForecast(): number {
    if (this.ns.stock.has4SDataTIXAPI()) {
      return this.ns.stock.getForecast(this.ticker);
    } else {
      return this.priceHistory.filter((x) => x.bull).length / this.priceHistory.length;
    }
  }

  getVolatility(): number {
    if (this.ns.stock.has4SDataTIXAPI()) {
      return this.ns.stock.getVolatility(this.ticker);
    } else {
      const magnitudeList = this.priceHistory.flatMap((x) =>
        x.magnitude == 0 ? [] : Math.abs(x.magnitude)
      );
      return magnitudeList.reduce((a, b) => a + b, 0) / magnitudeList.length;
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
