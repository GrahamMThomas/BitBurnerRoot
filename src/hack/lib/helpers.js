/** @param {NS} ns */
export function toDollars(num) {
  let posNum = Math.abs(num);
  let isNegative = false;
  if (num < 0) {
    isNegative = true;
  } else if (num == 0) {
    return "0";
  }
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
      return posNum >= item.value;
    });
  return item
    ? (isNegative ? "-" : "") + (posNum / item.value).toFixed(2).replace(rx, "$1") + item.symbol
    : num.toFixed(3);
}

export function nmap(ns) {
  ns.disableLog("disableLog");
  ns.disableLog("scan");

  let fullServerList = [];
  let visited = [];

  let servers = ns.scan();
  let i = 0;
  while (servers.length != 0 && i < 1000) {
    let scanningServer = servers.pop();
    fullServerList.push(ns.getServer(scanningServer));

    let newScannedServers = ns.scan(scanningServer);
    newScannedServers = newScannedServers.filter((x) => !visited.includes(x));
    newScannedServers = newScannedServers.filter((x) => !["darkweb", "home"].includes(x));
    newScannedServers = newScannedServers.filter((x) => !x.includes("jenkins"));

    visited.push(scanningServer);
    servers = servers.concat(newScannedServers);
    i += 1;
  }

  fullServerList.sort((a, b) => a.requiredHackingSkill - b.requiredHackingSkill);

  return fullServerList;
}
