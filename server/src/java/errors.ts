/**
 * Cleans javac stderr for display. User code lives in its own file
 * (Solution.java / their own class for code-output), so line numbers in
 * errors already point at the user's code. Errors in Main.java (the
 * generated harness) almost always mean the method signature was changed.
 */
export function cleanCompileErrors(stderr: string, userFiles: string[]): string {
  const lines = stderr.split('\n');
  const out: string[] = [];
  let harnessError = false;
  let duplicateClass = false;

  for (const line of lines) {
    if (/^Main\.java:/.test(line)) harnessError = true;
    if (/duplicate class/i.test(line)) duplicateClass = true;
  }

  for (const line of lines) {
    // Drop absolute temp paths, keep relative file references.
    const cleaned = line.replace(/^.*[\\/](?=\w+\.java:)/, '');
    if (/^Main\.java:/.test(cleaned)) continue; // harness internals hidden; summarized below
    out.push(cleaned);
  }

  let result = out.join('\n').trim();
  if (duplicateClass) {
    result =
      'Your code defines a class name that clashes with the grader (e.g. `Main`, `Ser`, or `H`). ' +
      'Keep your class named as given in the starter code.\n\n' + result;
  } else if (harnessError && !userFiles.some((f) => result.includes(f))) {
    result =
      "Your code compiled, but the grader couldn't call it — this usually means you changed the " +
      'method name, parameter types, or return type from the starter code. Restore the original signature.\n\n' +
      result;
  }
  return result || stderr.trim();
}

/** Detect the primary class name in a full-program submission (code-output mode). */
export function detectClassName(code: string): string | null {
  const mainPos = code.search(/static\s+void\s+main/);
  let best: string | null = null;
  for (const m of code.matchAll(/(?:public\s+)?(?:final\s+)?class\s+(\w+)/g)) {
    if (best === null) best = m[1];
    // The class containing main is the last one declared before the main method.
    if (mainPos >= 0 && m.index! < mainPos) best = m[1];
    else if (mainPos >= 0 && m.index! > mainPos) break;
  }
  return best;
}

/** Make a java runtime stack trace friendlier: trim harness frames. */
export function cleanRuntimeError(stderr: string): string {
  return stderr
    .split('\n')
    .filter((l) => !l.includes('at Main.') && !l.includes('at Ser.') && !l.includes('at H.'))
    .join('\n')
    .trim();
}
