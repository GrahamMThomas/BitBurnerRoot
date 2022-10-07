/** @param {NS} ns */
import { toDollars } from "hack/lib/helpers.js";

export async function main(ns) {
  ns.disableLog("ALL");
  ns.enableLog("deleteServer");
  ns.enableLog("purchaseServer");

  const serverPrefix = "jenkins-";
  while (true) {
    ns.clearLog();
    let monies = ns.getServerMoneyAvailable("home");
    let serversToUpgrade = ns.readPort(1).split(",").slice(1);

    let servers = Array.from({ length: 25 }, (_, i) => "jenkins-" + (i + 1));
    let serversMarkedForUpgrade = servers.filter((x) => serversToUpgrade.includes(x));
    let restOfTheServers = servers
      .filter((x) => !serversToUpgrade.includes(x))
      .sort((a, b) => {
        if (!ns.serverExists(a) || !ns.serverExists(b)) {
          return 0;
        }
        ns.getServerMaxRam(a) - ns.getServerMaxRam(b);
      });

    ns.print("Servers:");
    ns.print(restOfTheServers.join("\n- "));

    ns.print("Marked for Upgrade:");
    ns.print(serversMarkedForUpgrade.join("\n- "));
    for (let serverName of serversMarkedForUpgrade.concat(restOfTheServers)) {
      if (ns.serverExists(serverName)) {
        let currentServerRam = ns.getServerMaxRam(serverName);
        ns.print(`\nServer: ${serverName} (${currentServerRam})`);
        let serverCost = ns.getPurchasedServerCost(currentServerRam * 2);
        if (monies > serverCost) {
          if (ns.deleteServer(serverName)) {
            await ns.sleep(250);
            ns.purchaseServer(serverName, currentServerRam * 2);
            monies -= serverCost;
            ns.print(
              `Upgraded ${serverName} to ${currentServerRam * 2} GBs for ${toDollars(serverCost)}`
            );
          } else {
            ns.print("Delete Unavailable. Marking for upgrade.");
            monies -= serverCost;
            let currentPortContent = ns.readPort(1);
            await ns.writePort(1, `${currentPortContent},${serverName}`);
          }
          continue;
        } else {
          ns.print(`Too Expensive: ${toDollars(serverCost)}`);
        }
      } else {
        ns.print(`\nServer: ${serverName} (0)`);
        let serverCost = ns.getPurchasedServerCost(2);
        if (monies > serverCost) {
          ns.purchaseServer(serverName, 2);
          monies -= serverCost;
          ns.print(`Bought noobie ${serverName} for ${toDollars(serverCost)}`);
        } else {
          ns.print("I'm Broke...");
        }
      }

      await ns.sleep(50);
    }

    await ns.sleep(15000);
  }
}
