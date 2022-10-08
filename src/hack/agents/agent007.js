/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let command = ns.args[1];
  let sleepTiming = ns.args[2];
  let uniqifier = ns.args[3] ?? 0;

  if (ns.args.length < 4) {
    ns.print("Missing arguments. Killing");
    return;
  }

  await ns.sleep(sleepTiming);

  writeLog(ns, `Init [${uniqifier}] ${command} ${target}`, {
    secLv: ns.getServerSecurityLevel(target),
  });

  let outputValue = 0;

  if (command == "hack") {
    outputValue = await ns.hack(target);
    ns.toast(`[${uniqifier}] Hacked \$${toDollars(outputValue)}`, "success", 500);
  } else if (command == "grow") {
    await ns.grow(target);
    outputValue = ns.getServerMoneyAvailable(target);
  } else if (command == "weaken") {
    await ns.weaken(target);
    outputValue = ns.getServerSecurityLevel(target);
  } else {
    ns.toast(`Command ${command} is invalid! Killing...`, "error");
    return;
  }
  if (outputValue > 100) {
    outputValue = toDollars(outputValue);
  }
  writeLog(ns, `Finished [${uniqifier}] ${command} ${target}`, { output: outputValue });
}

function toDollars(num) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "B" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item ? (num / item.value).toFixed(1).replace(rx, "$1") + item.symbol : "0";
}

/**
 * Message format
 * {
 * 		timestamp: timestamp,
 * 		script: script,
 * 		log: log,
 * 		dimensions: []
 * }
 *
 */
function writeLog(ns, log, dimensions) {
  let data = {
    timestamp: Date.now(),
    script: ns.getScriptName(),
    log: log,
    dimensions: dimensions,
  };
  ns.writePort(5, JSON.stringify(data));
  // pass
}
