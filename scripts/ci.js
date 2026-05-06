import { spawnSync } from "node:child_process";

const commands = [
  [process.execPath, ["--test"]],
  [process.execPath, ["scripts/safety-gate.js"]]
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
