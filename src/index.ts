#!/usr/bin/env node

import { execSync } from "node:child_process";
import { exit } from "node:process";
import { createPrompt, generateSplitedRevisions } from "./llm.js";
import { abadanRevision, getTargetFiles, splitRevisions } from "./jj.js";

const description = execSync("jj show -r @- --no-patch -T description").toString().trim();
const isEmpty = !description;

if (!isEmpty) {
  throw new Error("The recent division's description is not empty. Please clear it before running this script.");
}

const diff = execSync("jj show @-").toString().trim();
const targetFiles = getTargetFiles();
if (targetFiles.length === 0) {
  throw new Error("No target files found in the current division. Please ensure you have specified the correct files in your configuration.");
}

const prompt = createPrompt(diff, targetFiles);
const revisions = generateSplitedRevisions(prompt);

splitRevisions(revisions);

abadanRevision();
