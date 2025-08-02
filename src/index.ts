#!/usr/bin/env node

import { execSync } from "node:child_process";
import { exit } from "node:process";
import { createPrompt, generateSplitedRevisions } from "./llm.js";
import { abadanRevision, getTargetFiles, splitRevisions } from "./jj.js";

const description = execSync("jj show -r @- --no-patch -T description").toString().trim();
const isEmpty = !description;

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

splitRevisions(revisions);

abadanRevision();
