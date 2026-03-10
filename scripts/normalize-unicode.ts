#!/usr/bin/env node
/**
 * Normalize Vietnamese Unicode from NFD (decomposed) to NFC (composed) form.
 *
 * Usage: npx tsx scripts/normalize-unicode.ts [files...]
 * If no files provided, defaults to public/data/*.csv
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function normalizeFile(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const charCount = content.length;

  // Check if any NFD characters exist
  const nfcContent = content.normalize('NFC');

  if (nfcContent === content) {
    console.log(`${filePath}: ${charCount} chars - already NFC normalized`);
    return;
  }

  const nfcCharCount = nfcContent.length;
  console.log(
    `${filePath}: ${charCount} chars -> ${nfcCharCount} chars (saved ${charCount - nfcCharCount} chars)`
  );

  writeFileSync(filePath, nfcContent, 'utf-8');
}

function getDefaultFiles(): string[] {
  const dataDir = join(process.cwd(), 'public', 'data');
  return readdirSync(dataDir)
    .filter((f) => f.endsWith('.csv'))
    .map((f) => join(dataDir, f));
}

function main(): void {
  const files = process.argv.length > 2 ? process.argv.slice(2) : getDefaultFiles();

  if (files.length === 0) {
    console.error('No files found');
    process.exit(1);
  }

  console.log(`Processing ${files.length} file(s)...\n`);

  for (const file of files) {
    normalizeFile(file);
  }

  console.log('\nDone!');
}

main();
