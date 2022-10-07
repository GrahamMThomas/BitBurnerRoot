/** @param {NS} ns */
export async function main(ns) {
  let server = ns.args[0];
  let sleepTime = ns.args[1];

  await ns.sleep(sleepTime);
  let locks = ns.readPort(2).split(",");
  locks = locks.filter((x) => x != server);
  await ns.writePort(2, locks.join(","));
}
