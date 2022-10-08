/** @param {NS} ns */

export const SPLIT_BEHAVIOUR = {
	NONE: "NONE",
	LEAST: "LEAST",
	MOST: "MOST"
}

export function batchOntoBotnet(ns, batchSettings) {
	let ramCost = ns.getScriptRam(batchSettings.script)

	let execCalls = []
	let botnetInfo = getBotnetInfo(ns)
	execCalls = []
	let serverAllocations = {}
	let allBatchesSucceeded = true

	for (let callKey in batchSettings.calls) {
		let batchEntry = batchSettings.calls[callKey]
		let threadsNeeded = batchEntry.threadCount
		let batchSuccess = false

		// ns.print(`\n${callKey}: ${batchEntry.splitBehaviour} ${(threadsNeeded*ramCost).toFixed(2)} Threads`)
		// Sort by lowest available ram so the batch takes up the smallest space possible
		for (let serverObj of botnetInfo.serverObjs.sort((a, b) => a.availableRam - b.availableRam)) {
			let serverPreAllocated = serverAllocations[serverObj.server] ?? 0
			let serverRamLeft = serverObj.availableRam - serverPreAllocated
			ns.scp(batchSettings.script, serverObj.server, "home")

			// ns.print(`${serverObj.server} (${serverRamLeft}) (${serverPreAllocated})`)
			// Server has space for whole job
			if (serverRamLeft >= (ramCost * threadsNeeded) && batchEntry.splitBehaviour == SPLIT_BEHAVIOUR.NONE) {
				execCalls.push(() => ns.exec(batchSettings.script, serverObj.server, threadsNeeded, ...batchEntry.args))
				serverAllocations[serverObj.server] = (serverAllocations[serverObj.server] ?? 0) + (ramCost * threadsNeeded)
				batchSuccess = true
				// ns.print("Fit great send it.")
				break
			}
			// Fill in nooks and crannies
			else if (serverRamLeft >= ramCost && batchEntry.splitBehaviour == SPLIT_BEHAVIOUR.MOST) {
				let threadsCapable = Math.min(Math.floor(serverRamLeft / ramCost), threadsNeeded)
				// ns.print(`Used ${threadsCapable} of ${threadsNeeded}`)
				threadsNeeded -= threadsCapable

				execCalls.push(() => ns.exec(batchSettings.script, serverObj.server, threadsCapable, ...batchEntry.args))
				serverAllocations[serverObj.server] = (serverAllocations[serverObj.server] ?? 0) + (ramCost * threadsCapable)
				if (threadsNeeded <= 0) {
					batchSuccess = true
					break
				}
			}
			else {
				// ns.print("Couldn't fit.")
			}
		}

		// Split up as little as possible
		if (batchEntry.splitBehaviour == SPLIT_BEHAVIOUR.LEAST) {
			for (let serverObj of botnetInfo.serverObjs.sort((a, b) => b.availableRam - a.availableRam)) {
				ns.scp(batchSettings.script, serverObj.server, "home")
				let serverRamLeft = serverObj.availableRam - (serverAllocations[serverObj.server] ?? 0)
				let threadsCapable = Math.min(Math.floor(serverRamLeft / ramCost), threadsNeeded)
				threadsNeeded -= threadsCapable

				execCalls.push(() => ns.exec(batchSettings.script, serverObj.server, threadsCapable, ...batchEntry.args))
				serverAllocations[serverObj.server] = (serverAllocations[serverObj.server] ?? 0) + ramCost * threadsCapable
				if (threadsNeeded <= 0) {
					batchSuccess = true
					break
				}
			}
		}

		allBatchesSucceeded = allBatchesSucceeded && batchSuccess
	}

	if (!allBatchesSucceeded) {
		ns.print("Couldn't Schedule Batch")
		return false
	}



	for (let execCall of execCalls) {
		execCall()
	}
	return true
}

export function getBotnetInfo(ns) {
	ns.disableLog("getServerMaxRam")
	ns.disableLog("getServerUsedRam")

	let botnetInfo = {
		availableRam: 0,
		maxRam: 0,
		servers: [],
		serverObjs: []
	}

	let allRootedServers = ns.scan()

	// Excluded marked for upgrade servers
	allRootedServers = allRootedServers.filter(server => !ns.peek(1).split(',').includes(server))
	allRootedServers.push('home')

	botnetInfo.servers = allRootedServers.filter(server => server.includes("jenkins"))

	for (let jenkinsServer of botnetInfo.servers) {
		let maxRam = ns.getServerMaxRam(jenkinsServer)
		let availableRam = maxRam - ns.getServerUsedRam(jenkinsServer)
		botnetInfo.serverObjs.push({
			server: jenkinsServer,
			maxRam: maxRam,
			availableRam: availableRam
		})

		botnetInfo.maxRam += maxRam
		botnetInfo.availableRam += availableRam
	}


	if (botnetInfo.maxRam < 65535)
	{
		let maxRam = ns.getServerMaxRam("home")
		let availableRam = maxRam - ns.getServerUsedRam("home")
		botnetInfo.servers.push("home")
		botnetInfo.serverObjs.push({
			server: "home",
			maxRam: maxRam,
			availableRam: availableRam
		})

		botnetInfo.maxRam += maxRam
		botnetInfo.availableRam += availableRam
	}

	return botnetInfo
}

export function isScriptOnBotnet(ns, script, scriptArgs){
	let servers = getBotnetInfo(ns).servers

	for (let server of servers){
		if(ns.isRunning(script, server, ...scriptArgs)){
			return true
		}
	}

	return false
}