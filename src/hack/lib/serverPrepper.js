/** @param {NS} ns */

import {
  batchOntoBotnet,
  getBotnetInfo,
  SPLIT_BEHAVIOUR,
  isScriptOnBotnet,
} from "hack/lib/botnetManager.js";
import { toDollars } from "hack/lib/helpers.js";

const PREP_UNIQIFIER = "prep";

const SCRIPT_NAME_AGENT = "/hack/agents/agent007.js";

export function prepServer(ns, server) {
  let isPrepped = true;

  if (ns.getServerSecurityLevel(server) != ns.getServerMinSecurityLevel(server)) {
    ns.print(`\n##### Server Prepper - Weaken - ${server}`);
    weakenServerToMinimum(ns, server);
    isPrepped = false;
    ns.print("##########################################\n");
  } else if (ns.getServerMaxMoney(server) != ns.getServerMoneyAvailable(server)) {
    ns.print(`\n##### Server Prepper - Grow - ${server}`);
    growServerToMaximum(ns, server);
    isPrepped = false;
    ns.print("##########################################\n");
  }

  return isPrepped;
}

export function weakenServerToMinimum(ns, server) {
  const weakenSecurityLevelAmount = 0.05;

  let currentSec = ns.getServerSecurityLevel(server);
  let minSec = ns.getServerMinSecurityLevel(server);

  let botnetInfo = getBotnetInfo(ns);
  let totalBotnetThreads = Math.round(botnetInfo.maxRam / ns.getScriptRam(SCRIPT_NAME_AGENT));
  let neededThreads = Math.ceil((currentSec - minSec) / weakenSecurityLevelAmount);

  ns.print(`Current Security: ${currentSec}`);
  ns.print(`Minimum Security: ${minSec}`);
  ns.print(`Botnet Threads: ${totalBotnetThreads}`);
  ns.print(`Threads Left: ${neededThreads}`);

  let scriptArgs = [server, "weaken", 0, PREP_UNIQIFIER];

  if (isScriptOnBotnet(ns, SCRIPT_NAME_AGENT, scriptArgs)) {
    ns.print("Already weakening server");
    return true;
  }

  let batchSettings = {
    target: server,
    script: SCRIPT_NAME_AGENT,
    timeBuffer: 0,
    i: 0,
    calls: {
      weaken: {
        threadCount: neededThreads,
        splitBehaviour: SPLIT_BEHAVIOUR.MOST,
        securityIncrease: neededThreads * weakenSecurityLevelAmount * -1,
        time: ns.getWeakenTime(server),
        args: scriptArgs,
      },
    },
  };

  return batchOntoBotnet(ns, batchSettings);
}

export async function growServerToMaximum(ns, server) {
  const growSecurityLevelAmount = 0.004;
  const weakenSecurityLevelAmount = 0.05;

  let maxMoney = ns.getServerMaxMoney(server);
  let currentMoney = ns.getServerMoneyAvailable(server);

  let totalBotnetThreads = Math.floor(
    getBotnetInfo(ns).maxRam / ns.getScriptRam(SCRIPT_NAME_AGENT)
  );
  let neededThreads = Math.ceil(
    ns.growthAnalyze(server, maxMoney / Math.max(currentMoney, totalBotnetThreads / 25)) * 1.05 + 1
  );
  let weakenNeededThreads = Math.ceil(
    (neededThreads * growSecurityLevelAmount) / weakenSecurityLevelAmount
  );

  // Reduce threads until job fits on botnet
  while (totalBotnetThreads * 0.9 < neededThreads + weakenNeededThreads) {
    neededThreads -= 1;
    weakenNeededThreads = Math.ceil(
      (neededThreads * growSecurityLevelAmount) / weakenSecurityLevelAmount
    );
  }

  ns.print(`Maximum Cash: ${toDollars(maxMoney)}`);
  ns.print(`Current Cash: ${toDollars(currentMoney)}`);
  ns.print(`Botnet Threads: ${totalBotnetThreads}`);
  ns.print(`Threads Left: ${neededThreads + weakenNeededThreads}`);

  let growScriptArgs = [server, "grow", 0, PREP_UNIQIFIER];
  let weakenScriptArgs = [server, "weaken", 0, PREP_UNIQIFIER];

  if (
    isScriptOnBotnet(ns, SCRIPT_NAME_AGENT, growScriptArgs) ||
    isScriptOnBotnet(ns, SCRIPT_NAME_AGENT, weakenScriptArgs)
  ) {
    ns.print("Already growing server");
    return true;
  }

  let batchSettings = {
    target: server,
    script: SCRIPT_NAME_AGENT,
    timeBuffer: 0,
    i: 0,
    calls: {
      grow: {
        threadCount: neededThreads,
        splitBehaviour: SPLIT_BEHAVIOUR.LEAST,
        securityIncrease: neededThreads * growSecurityLevelAmount,
        time: ns.getGrowTime(server),
        args: growScriptArgs,
      },
      weaken: {
        threadCount: weakenNeededThreads,
        splitBehaviour: SPLIT_BEHAVIOUR.MOST,
        securityIncrease: weakenNeededThreads * weakenSecurityLevelAmount * -1,
        time: ns.getWeakenTime(server),
        args: weakenScriptArgs,
      },
    },
  };

  await batchOntoBotnet(ns, batchSettings);
}
