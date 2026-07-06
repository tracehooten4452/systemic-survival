#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { payloadProblems } = require("./payload-validation");

const root = path.join(__dirname, "..");
const src = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "Systemic Survival v2.dc.html");
const text = fs.readFileSync(src, "utf8");
const problems = payloadProblems(text);

if (problems.length) {
  console.error("payload is NOT build-safe:", problems.join(" · "));
  process.exit(1);
}

console.log("payload validation passed:", path.relative(root, src) || src);
