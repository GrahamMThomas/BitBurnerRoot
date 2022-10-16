import { NS } from "/../NetscriptDefinitions";

function toString(command: commandCall): string {
  return `[${command.exeTime.toFixed(3)}] ${command.isStart ? "Start" : "End"} ${command.name} ${
    command.isDanger ? "" : ""
  }`;
}

interface commandCall {
  name: string;
  isStart: boolean;
  exeTime: number;
  isDanger: boolean;
}

export async function main(ns: NS): Promise<void> {
  const hackTime = 20.261;

  const gapTimes = Array.from({ length: 16 }, (x, i) => (i + 4) * 0.025);

  const timeGaps = gapTimes;
  const batchGaps = gapTimes;
  const growGaps = gapTimes.map((x) => x / 5);

  for (const timeGap of timeGaps) {
    for (const batchGap of batchGaps) {
      for (const growGap of growGaps) {
        ns.clearLog();
        const hasFailed = testGaps(ns, hackTime, timeGap, batchGap, growGap);
        if (!hasFailed) {
          ns.print(timeGap);
          ns.print(batchGap);
          ns.print(growGap);
          break;
        }
      }
    }
  }
}

function testGaps(ns: NS, hackTime: number, timeGap: number, batchGap: number, growGap: number): boolean {
  const growTimeRatio = 3.2;
  const weakenTimeRatio = 4;

  const growTime = hackTime * growTimeRatio;
  const weakenTime = hackTime * weakenTimeRatio;

  let commandList: commandCall[] = [];

  let currentTime = 0;
  for (let i = 0; i < 100; i += 1) {
    const hackStart = {
      name: "hack",
      isStart: true,
      exeTime: weakenTime - hackTime - timeGap + currentTime,
      isDanger: false,
    } as commandCall;
    const hackEnd = {
      name: "hack",
      isStart: false,
      exeTime: weakenTime - timeGap + currentTime,
      isDanger: true,
    } as commandCall;
    const weaken1Start = {
      name: "weaken1",
      isStart: true,
      exeTime: currentTime,
      isDanger: false,
    } as commandCall;
    const weaken1End = {
      name: "weaken1",
      isStart: false,
      exeTime: weakenTime + currentTime,
      isDanger: false,
    } as commandCall;
    const growStart = {
      name: "grow",
      isStart: true,
      exeTime: currentTime + weakenTime - growTime + timeGap + growGap,
      isDanger: false,
    } as commandCall;
    const growEnd = {
      name: "grow",
      isStart: false,
      exeTime: weakenTime + currentTime + timeGap + growGap,
      isDanger: true,
    } as commandCall;
    const weaken2Start = {
      name: "weaken2",
      isStart: true,
      exeTime: currentTime + timeGap * 2 + growGap,
      isDanger: false,
    } as commandCall;
    const weaken2End = {
      name: "weaken2",
      isStart: false,
      exeTime: weakenTime + currentTime + timeGap * 2 + growGap,
      isDanger: false,
    } as commandCall;

    commandList = commandList.concat(
      hackStart,
      hackEnd,
      weaken1Start,
      weaken1End,
      growStart,
      growEnd,
      weaken2Start,
      weaken2End
    );

    currentTime += timeGap * 4 + batchGap + growGap;
  }

  commandList.sort((a, b) => a.exeTime - b.exeTime);

  let hasFailed = false;
  let isDanger = false;
  let lastCommand = { isDanger: false, exeTime: -1 } as commandCall;
  for (const command of commandList) {
    if (command.isStart && isDanger) {
      ns.print(toString(command) + " X");
      hasFailed = true;
      break;
    } else if (command.exeTime - lastCommand.exeTime < 0.1 && (lastCommand.isDanger || command.isDanger)) {
      ns.print(toString(command) + " ~");
      hasFailed = true;
      break;
    } else {
      ns.print(toString(command));
    }

    if (!command.isStart) {
      isDanger = command.isDanger;
    }
    lastCommand = command;
  }

  return hasFailed;
}
