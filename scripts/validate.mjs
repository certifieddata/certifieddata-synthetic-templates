#!/usr/bin/env node
/**
 * Validates every template against schema/template.schema.json.
 *
 * Usage:
 *   node scripts/validate.mjs                    # validate all templates/
 *   node scripts/validate.mjs templates/fraud    # validate a single folder
 *
 * Uses a lightweight in-tree validator (no deps) so this script runs in CI
 * with zero install. If you need Draft 2020-12 deep-validation, swap in Ajv:
 *   npm i ajv ajv-formats
 * and replace validateTemplate with an Ajv-powered call.
 */
import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.resolve("schema/template.schema.json");
const ROOT = process.argv[2] ?? "templates";

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));

function listTemplateFiles(root) {
  const stat = fs.statSync(root);
  if (stat.isFile()) return [root];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const p = path.join(root, e.name);
    if (e.isDirectory()) files.push(...listTemplateFiles(p));
    else if (e.isFile() && e.name === "template.json") files.push(p);
  }
  return files;
}

function validateTemplate(doc, schema) {
  const errors = [];
  for (const req of schema.required ?? []) {
    if (!(req in doc)) errors.push(`missing required field: ${req}`);
  }
  if (doc.id && !new RegExp(schema.properties.id.pattern).test(doc.id)) {
    errors.push(`id "${doc.id}" does not match required pattern`);
  }
  if (doc.domain && !schema.properties.domain.enum.includes(doc.domain)) {
    errors.push(`domain "${doc.domain}" not in allowed enum`);
  }
  if (doc.version && !new RegExp(schema.properties.version.pattern).test(doc.version)) {
    errors.push(`version "${doc.version}" is not semver`);
  }
  if (Array.isArray(doc.columns)) {
    const colSchema = schema.$defs.column;
    const seen = new Set();
    doc.columns.forEach((col, i) => {
      for (const req of colSchema.required ?? []) {
        if (!(req in col)) errors.push(`columns[${i}]: missing ${req}`);
      }
      if (col.name) {
        if (seen.has(col.name)) errors.push(`columns[${i}]: duplicate name "${col.name}"`);
        seen.add(col.name);
      }
      if (col.type && !colSchema.properties.type.enum.includes(col.type)) {
        errors.push(`columns[${i}]: type "${col.type}" not in allowed enum`);
      }
      if (col.pii_class && !colSchema.properties.pii_class.enum.includes(col.pii_class)) {
        errors.push(`columns[${i}]: pii_class "${col.pii_class}" not in allowed enum`);
      }
    });
  }
  return errors;
}

const files = listTemplateFiles(ROOT);
if (files.length === 0) {
  console.error(`No template.json files found under ${ROOT}`);
  process.exit(1);
}

let failed = 0;
for (const f of files) {
  const doc = JSON.parse(fs.readFileSync(f, "utf8"));
  const errors = validateTemplate(doc, schema);
  if (errors.length === 0) {
    console.log(`✅ ${f}`);
  } else {
    failed++;
    console.log(`❌ ${f}`);
    for (const e of errors) console.log(`   - ${e}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} template(s) failed validation.`);
  process.exit(1);
}
console.log(`\n${files.length} template(s) valid.`);
