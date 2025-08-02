#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { exit } from "node:process";
import { createPrompt, generateSplitedRevisions } from "./llm.js";
import { getTargetFiles } from "./jj.js";

const description = execSync("jj log -r @- -T description").toString().trim();
const isEmpty = ["@\n│\n~", "○\n│\n~"].includes(description);

if (!isEmpty) {
  console.log("recent division's description is not empty");
  exit(0);
}

const diff = execSync("jj show @-").toString().trim();
const targetFiles = getTargetFiles();
if (targetFiles.length === 0) {
  console.error("No target files found in the current division.");
  exit(1);
}
const prompt = createPrompt(diff, targetFiles);
const revisions = generateSplitedRevisions(prompt);

for (const revision of revisions) {
  console.log(`${revision.commit_message}`);
  for (const file of revision.files) {
    console.log(`- ${file}`);
  }
}

for (const revision of revisions) {
  execSync(
    `jj split ${revision.files.join(" ")} -r @- -m "${revision.commit_message}"`,
    {
      stdio: "ignore",
    },
  );
}

const remainingFiles = getTargetFiles();
if (remainingFiles.length > 0) {
  console.error("Some files were not included in any revision:");
  for (const file of remainingFiles) {
    console.error(`- ${file}`);
  }
  exit(1);
}

execSync("jj abandon @-", {
  stdio: "ignore",
});
