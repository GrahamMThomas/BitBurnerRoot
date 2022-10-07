/** @param {NS} ns */
export async function main(ns) {
  ns.clearLog();
  const possibleLocations = ns.infiltration.getPossibleLocations();

  for (let loc of possibleLocations) {
    let infil = ns.infiltration.getInfiltration(loc.name);
    if (infil.difficulty > 2) {
      continue;
    }

    ns.print(`\n\n${infil.location.city}:${infil.location.name}`);
    ns.print(`SoA Rep: ${infil.reward.SoARep.toFixed(0)}`);
    ns.print(`Trade Rep: ${infil.reward.tradeRep.toFixed(0)}`);
    ns.print(`Difficulty: ${infil.difficulty.toFixed(2)}`);
  }
}
