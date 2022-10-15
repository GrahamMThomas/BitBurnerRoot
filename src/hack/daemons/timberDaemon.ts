import { NS } from "@ns";

export async function main(ns: NS) {
  ns.disableLog("ALL");

  while (true) {
    const visitedServers: string[] = [];
    let serverQueue = ["home"];

    while (serverQueue.length > 0) {
      const bastion = serverQueue.pop()!;
      visitedServers.push(bastion);

      const newServers = ns.scan(bastion);
      serverQueue = serverQueue.concat(newServers.filter((x) => !visitedServers.includes(x)));

      const portsNeeded = ns.getServerNumPortsRequired(bastion);

      if (portsNeeded > 0 && ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(bastion);
      }

      if (portsNeeded > 1 && ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(bastion);
      }

      if (portsNeeded > 2 && ns.fileExists("relaySMTP.exe", "home")) {
        ns.relaysmtp(bastion);
      }

      if (portsNeeded > 3 && ns.fileExists("HTTPWorm.exe", "home")) {
        ns.httpworm(bastion);
      }

      if (portsNeeded > 4 && ns.fileExists("SQLInject.exe", "home")) {
        ns.sqlinject(bastion);
      }

      if (ns.getServer(bastion).openPortCount == portsNeeded) {
        ns.nuke(bastion);
      }
      await ns.sleep(100);
    }

    await ns.sleep(60000);
  }
}
