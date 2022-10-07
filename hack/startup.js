/** @param {NS} ns */
import { getBotnetInfo } from "hack/lib/botnetManager.js";

export async function main(ns) {
  ns.exec("hack/daemons/shareDaemon.js", "home", 1);
  ns.exec("hack/daemons/beaverDaemon.js", "home", 1);
  ns.exec("hack/daemons/ahegaoDaemon.js", "home", 1);
  ns.exec("hack/daemons/timberDaemon.js", "home", 1);

  let botnetInfo = getBotnetInfo(ns);

  for (let i = 1; i <= Math.min(Math.ceil(botnetInfo.maxRam / 1000000), 10); i += 1) {
    ns.print("Spawning Jenkins");
    ns.exec("hack/daemons/jenkinsDaemon.js", "home", 1, i);
    await ns.sleep(500);
  }
}
