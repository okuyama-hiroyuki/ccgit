#!/usr/bin/env node

import { createPrompt, generateSplitedRevisions } from "./llm.js";
import { abadonRevision, getDescription, getDiff, getPreviousChangeId, getTargetFiles, splitRevisions } from "./jj.js";
import { execSync } from "node:child_process";

const targetChangeId = getPreviousChangeId();

// console.log(`Lock target change ID: ${targetChangeId}`);

const description = getDescription(targetChangeId);
const isEmpty = !description;

if (!isEmpty) {
  throw new Error("The recent division's description is not empty. Please clear it before running this script.");
}

const diff = getDiff(targetChangeId);
const targetFiles = getTargetFiles(targetChangeId);
if (targetFiles.length === 0) {
  throw new Error("No target files found in the current division. Please ensure you have specified the correct files in your configuration.");
}

const prompt = createPrompt(diff, targetFiles);
const revisions = generateSplitedRevisions(prompt);

splitRevisions(targetChangeId, revisions);

abadonRevision(targetChangeId);

let message = "";
for (const revision of revisions) {
  message += `${revision.commit_message}<br>`;
  for (const file of revision.files) {
    message += `- ${file}<br>`;
  }
}

execSync(`notify-send "ccgit" "${message}"`)
