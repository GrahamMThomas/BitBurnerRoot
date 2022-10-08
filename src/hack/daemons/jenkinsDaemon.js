/** @param {NS} ns */

import { toDollars } from "hack/lib/helpers.js";
import { getServersByHackDesireability } from "hack/lib/money-detector.js";
import {
  getBotnetInfo,
  batchOntoBotnet,
  SPLIT_BEHAVIOUR,
  isScriptOnBotnet,
} from "hack/lib/botnetManager.js";
import { prepServer } from "hack/lib/serverPrepper.js";

const CORE_COUNT = 1;

const MAX_PERCENT_MONEY_TO_STEAL = 80;

const WEAKEN_SECURITY_LEVEL_AMOUNT = -0.05;
const GROW_SECURITY_LEVEL_AMOUNT = 0.004;
const HACK_SECURITY_LEVEL_AMOUNT = 0.002;

const TIME_GAP = 100; // ms
const TIME_BETWEEN_BATCHES = 4 * TIME_GAP;

const SCRIPT_NAME = "agent007.js";

export async function main(ns) {
  ns.disableLog("ALL");
  // ns.enableLog("sleep")
  // ns.enableLog("exec")

  let i = 0;
  while (true) {
    ns.resizeTail(1200, 1000);
    ns.clearLog();
    ns.print("\n\n######### Jenkins Daemon Start");

    // Select Target
    let motherlode = await selectTarget(ns);

    let weakenTime = ns.getWeakenTime(motherlode);
    let hackTime = ns.getHackTime(motherlode);
    let maxServerCash = ns.getServerMaxMoney(motherlode);
    let percentMoneyPerHack = ns.hackAnalyze(motherlode);

    let batchCount = Math.floor((hackTime - TIME_BETWEEN_BATCHES) / TIME_BETWEEN_BATCHES);
    let batchHackCount = getHackThreadCount(ns, motherlode, batchCount);

    // Calculate Money

    let percentMoneyPerBatch = percentMoneyPerHack * 100 * batchHackCount;
    let cashPerBatch = percentMoneyPerHack * batchHackCount * maxServerCash;

    ns.print(`Max Server Cash: \$${toDollars(maxServerCash)}`);
    ns.print(`Percentage of max money per batch: ${percentMoneyPerBatch.toFixed(2)}%`);
    ns.print(`Cash per batch: \$${toDollars(cashPerBatch)}`);
    ns.print(`\nChance to Hack: ${(ns.hackAnalyzeChance(motherlode) * 100).toFixed(2)}%`);

    // Calculate Thread Counts
    let { batchGrowCount, batchWeaken1Count, batchWeaken2Count } = getOtherThreadCounts(
      ns,
      motherlode,
      batchHackCount
    );

    let batchSettings = {
      target: motherlode,
      script: SCRIPT_NAME,
      timeGap: TIME_GAP,
      timeBuffer: 0,
      i: i,
      calls: {
        hack: {
          threadCount: batchHackCount,
          splitBehaviour: SPLIT_BEHAVIOUR.NONE,
          securityIncrease: batchHackCount * HACK_SECURITY_LEVEL_AMOUNT,
          time: hackTime,
        },
        weaken1: {
          threadCount: batchWeaken1Count,
          splitBehaviour: SPLIT_BEHAVIOUR.NONE,
          securityIncrease: batchWeaken1Count * WEAKEN_SECURITY_LEVEL_AMOUNT,
          time: weakenTime,
        },
        grow: {
          threadCount: batchGrowCount,
          splitBehaviour: SPLIT_BEHAVIOUR.NONE,
          securityIncrease: batchGrowCount * GROW_SECURITY_LEVEL_AMOUNT,
          time: ns.getGrowTime(motherlode),
        },
        weaken2: {
          threadCount: batchWeaken2Count,
          splitBehaviour: SPLIT_BEHAVIOUR.NONE,
          securityIncrease: batchWeaken2Count * WEAKEN_SECURITY_LEVEL_AMOUNT,
          time: weakenTime,
        },
      },
    };
    ns.print("\n\nBatch Settings:");
    ns.print(JSON.stringify(batchSettings, null, 2));

    for (let i = 1; i <= batchCount * 0.8; i += 1) {
      batchSettings.i = i;
      if (i % Math.ceil(batchCount / 20) == 0 || i == batchCount) {
        ns.print(`Iteration #${i} MaxBatchCount: ${batchCount}`);
      }

      hydrateBatchSettingsWithScriptArgs(ns, batchSettings);

      await batchOntoBotnet(ns, batchSettings);
      await ns.sleep(TIME_BETWEEN_BATCHES);
    }

    ns.print(`\n\nMoney in ${Math.round((weakenTime - hackTime) / 1000)} seconds`);

    let sleepTime = weakenTime + TIME_BETWEEN_BATCHES * 5;
    ns.exec("removeLock.js", "home", 1, motherlode, sleepTime);
    await ns.sleep(sleepTime);
  }
}

function getHackThreadCount(ns, server, batchCount) {
  let batchHackCount = 1;

  while (true) {
    let percentMoneyPerHack = ns.hackAnalyze(server);
    let percentMoneyPerBatch = percentMoneyPerHack * 100 * batchHackCount;

    if (percentMoneyPerBatch >= MAX_PERCENT_MONEY_TO_STEAL) {
      ns.toast(`Maxed out ${server}`, "success", 2000);
      break;
    }

    let ramCost = ns.getScriptRam(SCRIPT_NAME);
    let { batchGrowCount, batchWeaken1Count, batchWeaken2Count } = getOtherThreadCounts(
      ns,
      server,
      batchHackCount
    );
    let roundRobinCost =
      batchCount *
      (batchHackCount + batchGrowCount + batchWeaken1Count + batchWeaken2Count) *
      ramCost;

    let maxRamCost =
      Math.max(batchHackCount, batchGrowCount, batchWeaken1Count, batchWeaken2Count) * ramCost;
    if (
      roundRobinCost < getBotnetInfo(ns).maxRam &&
      canRamHandleBatch(ns, maxRamCost, batchCount)
    ) {
      batchHackCount += 1;
    } else {
      break;
    }
  }

  return batchHackCount;
}

function getOtherThreadCounts(ns, server, batchHackCount) {
  let percentMoneyPerHack = ns.hackAnalyze(server);
  // ns.print(percentMoneyPerHack)
  let multiplierNeededToOffsetHack = 1 / (1 - percentMoneyPerHack * batchHackCount);
  // ns.print(multiplierNeededToOffsetHack)
  let growToOffsetHack = ns.growthAnalyze(server, multiplierNeededToOffsetHack) * 1.1;
  // ns.print(growToOffsetHack)

  let batchGrowCount = Math.ceil(growToOffsetHack);
  let batchWeaken1Count = Math.ceil(
    ((batchHackCount * HACK_SECURITY_LEVEL_AMOUNT) / WEAKEN_SECURITY_LEVEL_AMOUNT) * -1
  );
  let batchWeaken2Count = Math.ceil(
    ((batchGrowCount * GROW_SECURITY_LEVEL_AMOUNT) / WEAKEN_SECURITY_LEVEL_AMOUNT) * -1
  );
  return { batchGrowCount, batchWeaken1Count, batchWeaken2Count };
}

function canRamHandleBatch(ns, highestRamAsk, batchCount) {
  let maxRams = getBotnetInfo(ns).serverObjs.map((x) => x.maxRam);
  let totalThreadsAllowed = 0;
  for (let ramAmount of maxRams) {
    totalThreadsAllowed += Math.floor(ramAmount / highestRamAsk);
  }

  return totalThreadsAllowed > batchCount * 0.66;
}

function hydrateBatchSettingsWithScriptArgs(ns, batchSettings) {
  let hackSleepTime =
    batchSettings.timeBuffer +
    batchSettings.calls.weaken1.time -
    batchSettings.timeGap -
    batchSettings.calls.hack.time;
  let weaken1SleepTime = batchSettings.timeBuffer + 0;
  let growSleepTime =
    batchSettings.timeBuffer +
    batchSettings.calls.weaken1.time +
    batchSettings.timeGap -
    batchSettings.calls.grow.time;
  let weaken2SleepTime = batchSettings.timeBuffer + 0 + 2 * batchSettings.timeGap;

  batchSettings.calls.hack.args = [batchSettings.target, "hack", hackSleepTime, batchSettings.i];
  batchSettings.calls.weaken1.args = [
    batchSettings.target,
    "weaken",
    weaken1SleepTime,
    batchSettings.i,
  ];
  batchSettings.calls.grow.args = [batchSettings.target, "grow", growSleepTime, batchSettings.i];
  batchSettings.calls.weaken2.args = [
    batchSettings.target,
    "weaken",
    weaken2SleepTime,
    batchSettings.i,
  ];
}

async function selectTarget(ns) {
  let motherlode = "";
  let servers = getServersByHackDesireability(ns);

  for (let server of servers) {
    if (ns.getServerMaxMoney(server) == 0) {
      continue;
    }
    if (ns.getServerRequiredHackingLevel(server) <= ns.getPlayer().skills.hacking * 0.75) {
      if (!ns.hasRootAccess(server)) {
        ns.toast(`Need Root: ${server}`, "info");
        continue;
      }

      let hackTime = ns.getHackTime(server);
      let batchCount = Math.floor((hackTime - TIME_BETWEEN_BATCHES) / TIME_BETWEEN_BATCHES);

      if (
        prepServer(ns, server) &&
        !isScriptOnBotnet(ns, SCRIPT_NAME, [
          server,
          "weaken",
          0,
          batchCount - Math.round(batchCount * 0.1),
        ])
      ) {
        let otherDaemonLocks = ns.peek(2).split(",");
        ns.print(`Daemon Locks: ${otherDaemonLocks}`);
        if (otherDaemonLocks.includes(server)) {
          continue;
        }

        motherlode = server;
        otherDaemonLocks.push(server);
        ns.clearPort(2);
        await ns.writePort(2, otherDaemonLocks.join(","));

        return motherlode;
      }
    }
  }

  if (motherlode == "") {
    ns.print("No Targets Eligible...");
    await ns.sleep(10000);
    return selectTarget(ns);
  }

  return motherlode;
}

async function removeLock(ns, server) {
  let locks = await ns.readPort(2).split(",");
  locks = locks.filter((x) => x != server);
  await ns.writePort(2, locks.join(","));
}
