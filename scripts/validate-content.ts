/**
 * Validates all course content:
 *  - structural integrity (ids, references, schema basics)
 *  - every code exercise's reference solution actually passes its own tests
 * Run: npm run validate-content   (from repo root)
 * Limit to some units: UNITS=16-trees,17-tries npm run validate-content
 *   (course-wide structural errors — missing files, bad references — are always reported)
 */
import { loadContent } from '../server/src/content.ts';
import { gradeCodeDesign, gradeCodeMethod, gradeCodeOutput } from '../server/src/java/grade.ts';
import { checkJdk } from '../server/src/java/runner.ts';
import type { Exercise } from '../server/src/types.ts';

const content = loadContent();
const problems: string[] = [...content.errors];

function structural(ex: Exercise) {
  const err = (msg: string) => problems.push(`[${ex.id}] ${msg}`);
  if (!ex.title) err('missing title');
  switch (ex.type) {
    case 'mcq': {
      const answers = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
      if (!ex.options?.length) err('mcq has no options');
      for (const a of answers) if (a < 0 || a >= ex.options.length) err(`answer index ${a} out of range`);
      break;
    }
    case 'fill-blank': {
      const markers = [...ex.code.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
      if (markers.length === 0) err('fill-blank code has no {{n}} markers');
      for (const m of markers) if (!ex.blanks[m]?.length) err(`no accepted answers for blank {{${m}}}`);
      for (const k of Object.keys(ex.blanks)) if (!markers.includes(k)) err(`blanks["${k}"] has no marker in code`);
      break;
    }
    case 'code-output':
      if (ex.expectedOutput === undefined) err('missing expectedOutput');
      break;
    case 'code-method': {
      if (!ex.tests?.length) err('no tests');
      const visible = ex.tests.filter((t) => !t.hidden).length;
      if (visible === 0) err('all tests are hidden — show at least one');
      ex.tests.forEach((t, i) => {
        if (t.args.length !== ex.method.params.length) err(`test ${i}: ${t.args.length} args but method takes ${ex.method.params.length}`);
      });
      // Drills may start from a blank editor; only check a provided starter.
      if (ex.starter && ex.starter.trim() && !ex.starter.includes(ex.method.name)) {
        err('starter does not contain the method name');
      }
      break;
    }
    case 'code-design': {
      if (!ex.tests?.length) err('no tests');
      ex.tests.forEach((t, i) => {
        if (t.ops.length !== t.args.length || t.ops.length !== t.expected.length) {
          err(`test ${i}: ops/args/expected lengths differ`);
        }
        if (t.ops[0] !== ex.className) err(`test ${i}: first op must be constructor "${ex.className}"`);
        for (const op of t.ops) if (!ex.methods[op]) err(`test ${i}: unknown op "${op}"`);
      });
      break;
    }
  }
}

async function checkSolution(ex: Exercise): Promise<string | null> {
  if (!('solution' in ex) || !ex.solution) {
    if (ex.type === 'code-method' || ex.type === 'code-design') return `[${ex.id}] missing reference solution`;
    return null;
  }
  const r =
    ex.type === 'code-method' ? await gradeCodeMethod(ex, ex.solution.code)
    : ex.type === 'code-design' ? await gradeCodeDesign(ex, ex.solution.code)
    : ex.type === 'code-output' ? await gradeCodeOutput(ex, ex.solution.code)
    : null;
  if (!r) return null;
  if (r.status !== 'pass') {
    const detail = r.message ?? r.results?.filter((t) => !t.pass).map((t) => `test ${t.index}: expected ${t.expected}, got ${t.actual ?? t.error}`).join('; ');
    return `[${ex.id}] reference solution FAILED (${r.status}): ${detail ?? ''}`;
  }
  return null;
}

const onlyUnits = process.env.UNITS?.split(',').map((u) => u.trim()).filter(Boolean);
const all = [...content.exercises.values()].filter(
  (ex) => !onlyUnits?.length || onlyUnits.includes(content.exerciseUnit.get(ex.id) ?? ''),
);
for (const ex of all) structural(ex);

const jdk = await checkJdk();
if (!jdk.ok) {
  console.error(`Cannot run solution checks: ${jdk.problem}`);
  process.exit(1);
}

const codeExercises = all.filter((e) => e.type === 'code-method' || e.type === 'code-design' || (e.type === 'code-output' && e.solution));
console.log(`Structural checks done (${all.length} exercises). Running ${codeExercises.length} reference solutions...`);

const CONCURRENCY = 4;
let idx = 0;
let done = 0;
async function worker() {
  while (idx < codeExercises.length) {
    const ex = codeExercises[idx++];
    const p = await checkSolution(ex);
    done++;
    if (p) { problems.push(p); process.stdout.write('x'); }
    else process.stdout.write('.');
    if (done % 50 === 0) process.stdout.write(` ${done}/${codeExercises.length}\n`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log();

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log(`✓ All content valid: ${all.length} exercises, ${codeExercises.length} reference solutions verified.`);
