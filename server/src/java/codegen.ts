import type { CodeDesignExercise, CodeMethodExercise, DesignTest, JavaType, Json, MethodTest } from '../types.ts';

/**
 * Generates the Main.java test harness for a code-method or code-design exercise.
 * Each test runs in its own static method; user stdout is redirected to a buffer
 * so the real stdout only ever carries grader lines:
 *   RESULT <i> <ms> <json>     — the serialized return value
 *   THROW  <i> <json-string>   — uncaught exception message
 *   DEBUG  <i> <json-string>   — anything the user printed (capped)
 */

// ---------- Java literal emission ----------

function jstr(s: string): string {
  // JSON string escaping is valid Java string syntax for everything we emit.
  return JSON.stringify(s);
}

function jchar(s: string): string {
  if (s.length !== 1) throw new Error(`char value must be a single character, got ${JSON.stringify(s)}`);
  const c = s;
  if (c === "'") return "'\\''";
  if (c === '\\') return "'\\\\'";
  if (c === '\n') return "'\\n'";
  if (c === '\t') return "'\\t'";
  return `'${c}'`;
}

function jdouble(v: number): string {
  if (!Number.isFinite(v)) throw new Error('double literal must be finite');
  return Number.isInteger(v) ? `${v}.0` : `${v}`;
}

function intArray(v: Json): string {
  const a = v as number[];
  return `new int[]{${a.join(',')}}`;
}

function integerArray(v: Json): string {
  const a = v as (number | null)[];
  return `new Integer[]{${a.map((x) => (x === null ? 'null' : String(x))).join(',')}}`;
}

/** Emit statements building the value, returning the expression/variable to use. */
function emit(type: JavaType, v: Json, varName: string, out: string[]): void {
  const decl = (javaTypeDecl: string, expr: string) => out.push(`${javaTypeDecl} ${varName} = ${expr};`);
  if (v === null && type !== 'int' && type !== 'long' && type !== 'double' && type !== 'boolean' && type !== 'char') {
    decl(javaDecl(type), 'null');
    return;
  }
  switch (type) {
    case 'int': decl('int', String(v)); return;
    case 'long': decl('long', `${v}L`); return;
    case 'double': decl('double', jdouble(v as number)); return;
    case 'boolean': decl('boolean', String(v)); return;
    case 'char': decl('char', jchar(v as string)); return;
    case 'String': decl('String', jstr(v as string)); return;
    case 'int[]': decl('int[]', intArray(v)); return;
    case 'long[]': decl('long[]', `new long[]{${(v as number[]).map((x) => `${x}L`).join(',')}}`); return;
    case 'double[]': decl('double[]', `new double[]{${(v as number[]).map(jdouble).join(',')}}`); return;
    case 'boolean[]': decl('boolean[]', `new boolean[]{${(v as boolean[]).join(',')}}`); return;
    case 'char[]': {
      if (typeof v === 'string') decl('char[]', `${jstr(v)}.toCharArray()`);
      else decl('char[]', `new char[]{${(v as string[]).map(jchar).join(',')}}`);
      return;
    }
    case 'String[]': decl('String[]', `new String[]{${(v as (string | null)[]).map((s) => (s === null ? 'null' : jstr(s))).join(',')}}`); return;
    case 'int[][]': {
      const rows = v as number[][];
      decl('int[][]', `new int[][]{${rows.map((r) => `{${r.join(',')}}`).join(',')}}`);
      return;
    }
    case 'char[][]': {
      const rows = v as (string[] | string)[];
      const rowLit = (r: string[] | string) =>
        typeof r === 'string' ? `${jstr(r)}.toCharArray()` : `{${r.map(jchar).join(',')}}`;
      // Mixed forms need explicit array creation per row when using toCharArray()
      if (rows.some((r) => typeof r === 'string')) {
        decl('char[][]', `new char[][]{${rows.map((r) => (typeof r === 'string' ? `${jstr(r)}.toCharArray()` : `new char[]{${(r as string[]).map(jchar).join(',')}}`)).join(',')}}`);
      } else {
        decl('char[][]', `new char[][]{${rows.map(rowLit).join(',')}}`);
      }
      return;
    }
    case 'String[][]': {
      const rows = v as string[][];
      decl('String[][]', `new String[][]{${rows.map((r) => `{${r.map(jstr).join(',')}}`).join(',')}}`);
      return;
    }
    case 'List<Integer>': {
      const a = v as (number | null)[];
      decl('List<Integer>', `new ArrayList<>(Arrays.asList(new Integer[]{${a.map((x) => (x === null ? 'null' : String(x))).join(',')}}))`);
      return;
    }
    case 'List<String>': {
      const a = v as string[];
      decl('List<String>', `new ArrayList<>(Arrays.asList(new String[]{${a.map(jstr).join(',')}}))`);
      return;
    }
    case 'List<List<Integer>>': {
      out.push(`List<List<Integer>> ${varName} = new ArrayList<>();`);
      for (const row of v as number[][]) {
        out.push(`${varName}.add(new ArrayList<>(Arrays.asList(new Integer[]{${row.join(',')}})));`);
      }
      return;
    }
    case 'List<List<String>>': {
      out.push(`List<List<String>> ${varName} = new ArrayList<>();`);
      for (const row of v as string[][]) {
        out.push(`${varName}.add(new ArrayList<>(Arrays.asList(new String[]{${row.map(jstr).join(',')}})));`);
      }
      return;
    }
    case 'ListNode': {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        const obj = v as { vals: number[]; pos: number };
        decl('ListNode', `H.listWithCycle(${intArray(obj.vals)}, ${obj.pos})`);
      } else {
        decl('ListNode', `H.list(${intArray(v)})`);
      }
      return;
    }
    case 'ListNode[]': {
      const lists = v as number[][];
      decl('ListNode[]', `new ListNode[]{${lists.map((a) => `H.list(${intArray(a)})`).join(',')}}`);
      return;
    }
    case 'TreeNode': decl('TreeNode', `H.tree(${integerArray(v)})`); return;
    default:
      throw new Error(`Unsupported Java type in codegen: ${type}`);
  }
}

function javaDecl(type: JavaType): string {
  return type; // our JavaType strings are valid Java declarations
}

// ---------- Harness generation ----------

const PREAMBLE = `import java.util.*;

public class Main {
    static String cap(String s) {
        if (s.length() > 4000) return s.substring(0, 4000) + "\\n...[truncated]";
        return s;
    }
`;

function testWrapper(i: number, body: string[]): string {
  return `
    static void test${i}(java.io.PrintStream OUT) {
        java.io.ByteArrayOutputStream buf = new java.io.ByteArrayOutputStream();
        System.setOut(new java.io.PrintStream(buf, true));
        try {
${body.map((l) => '            ' + l).join('\n')}
        } catch (Throwable t) {
            System.setOut(OUT);
            String msg = t.getClass().getSimpleName() + (t.getMessage() == null ? "" : ": " + t.getMessage());
            OUT.println("THROW ${i} " + Ser.ser(msg));
        } finally {
            System.setOut(OUT);
            String dbg = buf.toString();
            if (!dbg.isEmpty()) OUT.println("DEBUG ${i} " + Ser.ser(cap(dbg)));
        }
    }
`;
}

function mainMethod(count: number): string {
  const calls = Array.from({ length: count }, (_, i) => `        test${i}(OUT);`).join('\n');
  return `
    public static void main(String[] args) {
        java.io.PrintStream OUT = System.out;
${calls}
        OUT.println("ALLDONE");
    }
}
`;
}

export function generateMethodHarness(ex: Pick<CodeMethodExercise, 'method' | 'tests'>): string {
  const { method, tests } = ex;
  const parts: string[] = [PREAMBLE];
  tests.forEach((t, i) => {
    const body: string[] = [];
    t.args.forEach((arg, ai) => emit(method.params[ai].type, arg, `arg${ai}`, body));
    body.push('Solution sol = new Solution();');
    body.push('long t0 = System.nanoTime();');
    const call = `sol.${method.name}(${t.args.map((_, ai) => `arg${ai}`).join(', ')})`;
    if (method.returns === 'void') {
      body.push(`${call};`);
      const check = t.checkParam ?? 0;
      body.push('long ms = (System.nanoTime() - t0) / 1000000;');
      body.push('System.setOut(OUT);');
      body.push(`OUT.println("RESULT ${i} " + ms + " " + Ser.ser(arg${check}));`);
    } else {
      body.push(`${javaDecl(method.returns)} result = ${call};`);
      body.push('long ms = (System.nanoTime() - t0) / 1000000;');
      body.push('System.setOut(OUT);');
      body.push(`OUT.println("RESULT ${i} " + ms + " " + Ser.ser(result));`);
    }
    parts.push(testWrapper(i, body));
  });
  parts.push(mainMethod(tests.length));
  return parts.join('');
}

export function generateDesignHarness(ex: Pick<CodeDesignExercise, 'className' | 'methods' | 'tests'>): string {
  const { className, methods, tests } = ex;
  const parts: string[] = [PREAMBLE];
  tests.forEach((t, i) => {
    const body: string[] = [];
    body.push('StringBuilder r = new StringBuilder("[");');
    body.push('long t0 = System.nanoTime();');
    let varCounter = 0;
    t.ops.forEach((op, oi) => {
      const sig = methods[op];
      if (!sig) throw new Error(`Unknown op "${op}" for class ${className}`);
      const argVars: string[] = [];
      (t.args[oi] ?? []).forEach((arg, ai) => {
        const vn = `a${varCounter++}`;
        emit(sig.params[ai], arg, vn, body);
        argVars.push(vn);
      });
      const sep = oi === 0 ? '' : 'r.append(",");';
      if (op === className) {
        body.push(`${className} obj = new ${className}(${argVars.join(', ')});`);
        body.push(`${sep} r.append("null");`.trim());
      } else if (sig.returns === 'void') {
        body.push(`obj.${op}(${argVars.join(', ')});`);
        body.push(`${sep} r.append("null");`.trim());
      } else {
        body.push(`${javaDecl(sig.returns)} v${oi} = obj.${op}(${argVars.join(', ')});`);
        body.push(`${sep} r.append(Ser.ser(v${oi}));`.trim());
      }
    });
    body.push('long ms = (System.nanoTime() - t0) / 1000000;');
    body.push('r.append("]");');
    body.push('System.setOut(OUT);');
    body.push(`OUT.println("RESULT ${i} " + ms + " " + r);`);
    parts.push(testWrapper(i, body));
  });
  parts.push(mainMethod(tests.length));
  return parts.join('');
}

// ---------- Harness output parsing ----------

export interface HarnessTestOutcome {
  value?: Json;      // parsed RESULT json
  threw?: string;    // exception message
  debug?: string;    // captured user stdout
  timeMs?: number;
  ran: boolean;
}

export function parseHarnessOutput(stdout: string, testCount: number): { outcomes: HarnessTestOutcome[]; completed: boolean } {
  const outcomes: HarnessTestOutcome[] = Array.from({ length: testCount }, () => ({ ran: false }));
  let completed = false;
  for (const line of stdout.split('\n')) {
    if (line.startsWith('ALLDONE')) { completed = true; continue; }
    const m = line.match(/^(RESULT|THROW|DEBUG) (\d+) (.*)$/s);
    if (!m) continue;
    const idx = parseInt(m[2], 10);
    if (idx >= testCount) continue;
    const o = outcomes[idx];
    if (m[1] === 'RESULT') {
      const rest = m[3];
      const sp = rest.indexOf(' ');
      try {
        o.timeMs = parseInt(rest.slice(0, sp), 10);
        o.value = JSON.parse(rest.slice(sp + 1)) as Json;
        o.ran = true;
      } catch { /* malformed line — leave as not ran */ }
    } else if (m[1] === 'THROW') {
      try { o.threw = JSON.parse(m[3]) as string; } catch { o.threw = m[3]; }
      o.ran = true;
    } else {
      try { o.debug = JSON.parse(m[3]) as string; } catch { o.debug = m[3]; }
    }
  }
  return { outcomes, completed };
}

// ---------- Test case formatting (for display) ----------

export function formatMethodInput(ex: Pick<CodeMethodExercise, 'method'>, t: MethodTest): string {
  return ex.method.params.map((p, i) => `${p.name} = ${JSON.stringify(t.args[i])}`).join(', ');
}

export function formatDesignInput(t: DesignTest): string {
  return `ops = ${JSON.stringify(t.ops)}\nargs = ${JSON.stringify(t.args)}`;
}
