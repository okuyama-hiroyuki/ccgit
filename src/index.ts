#!/usr/bin/env node

import { createPrompt, generateSplitedRevisions } from "./llm.js";
import { abandonRevision, getDescription, getDiff, getPreviousChangeId, getTargetFiles, splitRevisions } from "./jj.js";
import { execSync, spawn } from "node:child_process";
import { exit } from "node:process";

const targetChangeId = getPreviousChangeId();

// console.log(`Lock target change ID: ${targetChangeId}`);

const description = getDescription(targetChangeId);
const isEmpty = !description;

if (!isEmpty) {
  console.error("The recent division's description is not empty. Please clear it before running this script.");
  exit(1);
}

const diff = getDiff(targetChangeId);
const targetFiles = getTargetFiles(targetChangeId);
if (targetFiles.length === 0) {
  console.error("No target files found in the current division. Please ensure you have specified the correct files in your configuration.");
  exit(1);
}

const prompt = createPrompt(diff, targetFiles);
const revisions = generateSplitedRevisions(prompt);

splitRevisions(targetChangeId, revisions);

abandonRevision(targetChangeId);

let message = "";
for (const revision of revisions) {
  message += `${revision.commit_message}\n`;
  for (const file of revision.files) {
    message += `- ${file}\n`;
  }
}

spawn("zenity", ["--notification", "--text", message])
