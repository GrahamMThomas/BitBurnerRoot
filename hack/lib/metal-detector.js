/** @param {NS} ns */

import { toDollars, nmap } from "hack/lib/helpers";

export async function main(ns) {
  ns.print(getServersByHackDesireability(ns));
}
export function getServersByHackDesireability(ns) {
  ns.clearLog();

  let namp = nmap(ns);
  let servers = namp.map((x) => x.hostname);
  return servers.sort((a, b) => getWeight(ns, b) - getWeight(ns, a));
}

function getServerValue(ns, serverName) {
  let server = ns.getServer(serverName);
  printServer(ns, server);
}

function printServer(ns, server) {
  ns.print(`\n\nServer Name: ${server.hostname}`);
  ns.print(`Max Money: \$${toDollars(server.moneyMax)}`);
  ns.print(`Minimum Security: ${server.minDifficulty}`);
  ns.print(`Server Growth: ${server.serverGrowth}`);
  ns.print(`\nHacking Level: ${server.requiredHackingSkill}`);
  ns.print(`\nWeaken Time: ${ns.getWeakenTime(server.hostname)}`);
}

// Returns a weight that can be used to sort servers by hack desirability
function getWeight(ns, server) {
  if (!server) return 0;

  // Don't ask, endgame stuff
  if (server.startsWith("hacknet-node")) return 0;

  let player = ns.getPlayer();
  let so = ns.getServer(server);

  so.hackDifficulty = so.minDifficulty;

  if (so.requiredHackingSkill > player.skills.hacking) return 0;

  // Default pre-Formulas.exe weight. minDifficulty directly affects times, so it substitutes for min security times
  let weight = so.moneyMax / so.minDifficulty;

  // If we have formulas, we can refine the weight calculation
  if (ns.fileExists("Formulas.exe")) {
    // We use weakenTime instead of minDifficulty since we got access to it,
    // and we add hackChance to the mix (pre-formulas.exe hack chance formula is based on current security, which is useless)
    weight =
      (so.moneyMax / ns.formulas.hacking.weakenTime(so, player)) *
      ns.formulas.hacking.hackChance(so, player);
  }
  // If we do not have formulas, we can't properly factor in hackchance, so we lower the hacking level tolerance by half
  else if (so.requiredHackingSkill > player.skills.hacking / 2) return 0;

  return weight;
}
