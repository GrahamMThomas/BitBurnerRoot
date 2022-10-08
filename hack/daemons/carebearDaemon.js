/** @param {NS} ns */
import { getBotnetInfo, batchOntoBotnet, SPLIT_BEHAVIOUR } from "hack/lib/botnetManager.js";

const SCRIPT_NAME = "hack/agents/agentShareTheLove.js";

export async function main(ns) {
  ns.disableLog("ALL");
  ns.enableLog("sleep");
  ns.enableLog("exec");

  while (true) {
    let ramCost = ns.getScriptRam(SCRIPT_NAME);
    let botnetInfo = getBotnetInfo(ns);

    let servers = ns.getPurchasedServers();
    servers.push("home");

    for (let server of servers) {
      ns.scriptKill(SCRIPT_NAME, server);
    }

    let batchSettings = {
      target: null,
      script: SCRIPT_NAME,
      timeBuffer: 0,
      i: 0,
      calls: {
        weaken: {
          threadCount: Math.floor(botnetInfo.maxRam / ramCost) * 0.1,
          splitBehaviour: SPLIT_BEHAVIOUR.LEAST,
          securityIncrease: 0,
          time: 0,
          args: [],
        },
      },
    };

    batchOntoBotnet(ns, batchSettings);
    await ns.sleep(60000);
  }
}
