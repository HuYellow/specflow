import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { evaluateTrials } from '../packages/specflow-core/evaluation.ts';

const usage = 'Usage: node scripts/toolchain.mjs agent-eval --input <trials.json> [--output <report.json>]';
try {
  const args = process.argv.slice(2);
  if (args.length === 1 && ['--help', '-h'].includes(args[0])) { process.stdout.write(`${usage}\n`); }
  else {
    let input, output;
    for (let index = 0; index < args.length; index += 2) {
      const option = args[index], value = args[index + 1];
      if (!['--input', '--output'].includes(option) || !value || value.startsWith('--')) throw new Error(usage);
      if (option === '--input') { if (input) throw new Error('Duplicate --input'); input = resolve(value); }
      if (option === '--output') { if (output) throw new Error('Duplicate --output'); output = resolve(value); }
    }
    if (!input) throw new Error(usage);
    if (output && (process.platform === 'win32' ? output.toLowerCase() === input.toLowerCase() : output === input)) throw new Error('Output must not overwrite the input trial records');
    const report = evaluateTrials(JSON.parse(await readFile(input, 'utf8')));
    const serialized = `${JSON.stringify(report, null, 2)}\n`;
    if (output) { await writeFile(output, serialized); process.stdout.write(`Saved ${report.sourceKind} evaluation report: ${output}\n`); }
    else process.stdout.write(serialized);
  }
} catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; }
