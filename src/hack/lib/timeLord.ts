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
  const growTimeRatio = 3.2;
  const weakenTimeRatio = 4;

  const hackTime = 2.1;
  const growTime = hackTime * growTimeRatio;
  const weakenTime = hackTime * weakenTimeRatio;

  const timeGap = 0.1;

  let commandList: commandCall[] = [];

  let currentTime = 0;
  for (let i = 0; i < 30; i += 1) {
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
      name: "weaken",
      isStart: true,
      exeTime: currentTime,
      isDanger: false,
    } as commandCall;
    const weaken1End = {
      name: "weaken",
      isStart: false,
      exeTime: weakenTime + currentTime,
      isDanger: false,
    } as commandCall;
    const growStart = {
      name: "grow",
      isStart: true,
      exeTime: currentTime + weakenTime - growTime + timeGap,
      isDanger: false,
    } as commandCall;
    const growEnd = {
      name: "grow",
      isStart: false,
      exeTime: weakenTime + currentTime + timeGap,
      isDanger: true,
    } as commandCall;
    const weaken2Start = {
      name: "weaken",
      isStart: true,
      exeTime: currentTime + timeGap * 2,
      isDanger: false,
    } as commandCall;
    const weaken2End = {
      name: "weaken",
      isStart: false,
      exeTime: weakenTime + currentTime + timeGap * 2,
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

    currentTime += timeGap * 4;
  }

  commandList.sort((a, b) => a.exeTime - b.exeTime);

  let isDanger = false;
  for (const command of commandList) {
    if (command.isStart && isDanger) {
      ns.print(toString(command) + " X");
    } else {
      ns.print(toString(command));
    }

    if (!command.isStart) {
      isDanger = command.isDanger;
    }
  }
}
