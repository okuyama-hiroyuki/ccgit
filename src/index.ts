#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { exit } from "node:process";
import { createPrompt } from "./prompt.js";

const getTargetFiles = (): string[] => {
  const sumamry = execSync("jj show --no-patch -r @- -T 'diff.summary()'");
  const lines = sumamry.toString().trim().split("\n");

  const targetFiles: Set<string> = new Set();
  for (const line of lines) {
    const type = line[0] as "M" | "A" | "D" | "R" | "C";
    const file = line.slice(2).trim();

    switch (type) {
      case "M": // Modified
      case "A": // Added
      case "D": // Deleted
      case "C": // Copied
        targetFiles.add(file);
        break;
      case "R": // Renamed
        const [oldName, newName] = line.slice(1, -1).split(" -> ").map(s => s.trim());
        targetFiles.add(oldName!);
        targetFiles.add(newName!);
        break;
      default:
        console.error(`Unknown file type: ${type}`);
        console.error(`Line: ${line}`);
        return type satisfies never;
    }
  }

  return [...targetFiles];
}

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

const result = spawnSync("claude", ["-p"], {
  input: prompt,
});

if (result.error) {
  console.error("Error executing claude:", result.error);
  exit(1);
}
const rawString = result.stdout.toString().trim();

const match = rawString.match(/```json([\s\S]*?)```/);
if (!match) {
  console.error("No JSON block found in the response.");
  console.log("prompt:", prompt);
  console.log("rawString:", rawString);
  exit(1);
}

type Revision = {
  commit_message: string;
  files: string[];
};

type Output = {
  revisions_descriptions: string[];
  files: Record<string, number>;
};

const targetString = match[1]!.trim();
const typed_output: Output = JSON.parse(targetString);

const revisions: Revision[] = [];
for (const [
  index,
  description,
] of typed_output.revisions_descriptions.entries()) {
  const files = Object.entries(typed_output.files)
    .filter(([, value]) => value === index)
    .map(([key]) => key);

  // if (files.length === 0) {
  //   console.error(`No files found for revision ${index + 1}`);
  //   exit(1);
  // }

  revisions.push({
    commit_message: description,
    files,
  });
}

for (const revision of revisions) {
  console.log(`${revision.commit_message}`);
  for (const file of revision.files) {
    console.log(`- ${file}`);
  }
}

for (const revision of revisions) {
  execSync(
    `jj split ${revision.files.map(e => `root-file:${e}`).join(" ")} -r @- -m "${revision.commit_message}"`,
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
