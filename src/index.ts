#!/usr/bin/env node

import { createPrompt, generateSplitedRevisions } from "./llm.js";
import { abandonRevision, getDescription, getDiff, getPreviousChangeId, getTargetFiles, splitRevisions } from "./jj.js";
import { spawn, spawnSync } from "node:child_process";
import { exit } from "node:process";
import { fileURLToPath } from 'url';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// Check for version flag
if (process.argv.includes('-v') || process.argv.includes('--version')) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const packagePath = join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  console.log(`ccgit version ${packageJson.version}`);
  exit(0);
}

if (!process.env.IS_WORKER) {
  const __filename = fileURLToPath(import.meta.url);

  const args = [__filename];

  const child = spawn(process.execPath, args, {
    detached: true,
    env: { ...process.env, IS_WORKER: 'true' },
  });

  child.unref();

  exit(0);
}

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

spawnSync("zenity", ["--notification", "--text", message])
