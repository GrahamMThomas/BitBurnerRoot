/** @param {NS} ns */
export async function main(ns) {
  if (ns.args.length != 2) {
    ns.print("Needs args yo");
    return;
  }
  const alphabet = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  let cipher = {};
  let previousRow = "A";
  for (let rowKey of alphabet) {
    if (rowKey == "A") {
      cipher[rowKey] = alphabet;
    } else {
      cipher[rowKey] = [...cipher[previousRow].slice(1, alphabet.length), cipher[previousRow][0]];
    }
    previousRow = rowKey;
  }

  ns.print("\n\nCipher:");
  ns.print(JSON.stringify(cipher, null, 2));

  let text = ns.args[0];
  let key = ns.args[1];

  let message = "";
  for (let i = 0; i < text.length; i++) {
    let letterNum = alphabet.indexOf(key[i % key.length]);
    message += cipher[text[i]][letterNum];
  }
  ns.print(message);
}
