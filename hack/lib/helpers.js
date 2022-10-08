/** @param {NS} ns */
export function toDollars(num) {
    const lookup = [
      { value: 1, symbol: "" },
      { value: 1e3, symbol: "k" },
      { value: 1e6, symbol: "M" },
      { value: 1e9, symbol: "B" },
      { value: 1e12, symbol: "T" },
      { value: 1e15, symbol: "P" },
      { value: 1e18, symbol: "E" }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function(item) {
      return num >= item.value;
    });
    return item ? (num / item.value).toFixed(1).replace(rx, "$1") + item.symbol : "0";
  }
  
  export function nmap(ns){
    ns.disableLog("disableLog")
    ns.disableLog("scan")
  
    let fullServerList = []
    let visited = []
  
    let servers = ns.scan()
    let i = 0
    while(servers.length != 0 && i < 1000){
      let scanningServer = servers.pop()
      fullServerList.push(ns.getServer(scanningServer))
  
      let newScannedServers = ns.scan(scanningServer)
      newScannedServers = newScannedServers.filter(x => !visited.includes(x))
      newScannedServers = newScannedServers.filter(x => !["darkweb", "home"].includes(x))
      newScannedServers = newScannedServers.filter(x => !x.includes("jenkins"))
  
      visited.push(scanningServer)
      servers = servers.concat(newScannedServers)
      i += 1
    }
  
    fullServerList.sort((a,b)=> a.requiredHackingSkill - b.requiredHackingSkill)
  
    return fullServerList
  }