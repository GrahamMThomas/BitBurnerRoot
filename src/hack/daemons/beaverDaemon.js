/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog("ALL");

  let lastTimestamp = Date.now();
  while (true) {
    await ns.sleep(25);
    let rawMessage = ns.readPort(5);

    if (rawMessage == "NULL PORT DATA") {
      continue;
    }
    let message = JSON.parse(rawMessage);
    printLog(ns, message, lastTimestamp);
    lastTimestamp = message.timestamp;
  }
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
export async function writeLog(ns) {
  // pass
}

const col = {
  r: "\x1b[31m",
  g: "\x1b[32m",
  b: "\x1b[34m",
  c: "\x1b[36m",
  m: "\x1b[35m",
  y: "\x1b[33m",
  bk: "\x1b[30m",
  w: "\x1b[37m",
  d: "\x1b[0m", //default color
};

export function printLog(ns, message, lastTimestamp) {
  let stringDimensions = [];

  for (const [key, value] of Object.entries(message.dimensions)) {
    stringDimensions.push(`${key}: ${value}`);
  }

  ns.print(
    `${col.c}[+${(message.timestamp - lastTimestamp).toString().padStart(6)}] ${message.script}: ${
      col.g
    }${message.log.padEnd(40)} | ${col.y}${stringDimensions.join(" ")}`
  );
}
