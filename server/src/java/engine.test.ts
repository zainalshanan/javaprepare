import { describe, expect, it } from 'vitest';
import { compareValues, normalizeOutput, outputsMatch } from './compare.ts';
import { generateMethodHarness, generateDesignHarness, parseHarnessOutput } from './codegen.ts';
import { detectClassName } from './errors.ts';
import { checkJdk, compileAndRun } from './runner.ts';
import { gradeCodeMethod, gradeCodeOutput, gradeCodeDesign } from './grade.ts';
import type { CodeDesignExercise, CodeMethodExercise, CodeOutputExercise } from '../types.ts';

describe('compare', () => {
  it('exact deep equality', () => {
    expect(compareValues([1, [2, 3]], [1, [2, 3]])).toBe(true);
    expect(compareValues([1, 2], [2, 1])).toBe(false);
    expect(compareValues(null, null)).toBe(true);
    expect(compareValues('a', 'a')).toBe(true);
  });
  it('unordered sorts top level only', () => {
    expect(compareValues([[3], [1, 2]], [[1, 2], [3]], 'unordered')).toBe(true);
    expect(compareValues([[1, 2]], [[2, 1]], 'unordered')).toBe(false);
  });
  it('unordered-deep sorts recursively (group anagrams)', () => {
    expect(compareValues([['eat', 'tea'], ['bat']], [['bat'], ['tea', 'eat']], 'unordered-deep')).toBe(true);
  });
  it('set ignores duplicates and order', () => {
    expect(compareValues([1, 2, 3], [3, 2, 1], 'set')).toBe(true);
    expect(compareValues([1, 2], [1, 3], 'set')).toBe(false);
  });
  it('epsilon tolerates float error', () => {
    expect(compareValues(2.0, 2.0000001, 'epsilon')).toBe(true);
    expect(compareValues(2.0, 2.1, 'epsilon')).toBe(false);
  });
  it('normalizes output whitespace', () => {
    expect(outputsMatch('hello\nworld\n', 'hello  \nworld')).toBe(true);
    expect(normalizeOutput('a\r\nb\n\n')).toBe('a\nb');
  });
});

describe('detectClassName', () => {
  it('finds the class with main', () => {
    expect(detectClassName('class Helper {}\npublic class App { public static void main(String[] a) {} }')).toBe('App');
    expect(detectClassName('public class Main { public static void main(String[] args) {} }')).toBe('Main');
  });
});

describe('parseHarnessOutput', () => {
  it('parses RESULT/THROW/DEBUG lines', () => {
    const { outcomes, completed } = parseHarnessOutput(
      'RESULT 0 3 [0,1]\nDEBUG 1 "hi"\nTHROW 1 "NullPointerException"\nALLDONE\n', 2);
    expect(completed).toBe(true);
    expect(outcomes[0]).toMatchObject({ ran: true, value: [0, 1], timeMs: 3 });
    expect(outcomes[1]).toMatchObject({ ran: true, threw: 'NullPointerException', debug: 'hi' });
  });
});

// ---- Integration tests that need a real JDK ----

const jdk = await checkJdk();
const itJava = jdk.ok ? it : it.skip;

describe('runner (real JDK)', () => {
  itJava('compiles and runs hello world', async () => {
    const res = await compileAndRun({
      files: { 'Main.java': 'public class Main { public static void main(String[] a) { System.out.println("hi"); } }' },
      mainClass: 'Main',
    });
    expect(res.phase).toBe('ok');
    expect(res.run!.stdout.trim()).toBe('hi');
  });

  itJava('reports compile errors', async () => {
    const res = await compileAndRun({
      files: { 'Main.java': 'public class Main { int x = }' },
      mainClass: 'Main',
    });
    expect(res.phase).toBe('compile-error');
    expect(res.compile.stderr).toContain('error');
  });

  itJava('kills infinite loops', async () => {
    const res = await compileAndRun({
      files: { 'Main.java': 'public class Main { public static void main(String[] a) { while(true){} } }' },
      mainClass: 'Main',
      runTimeoutMs: 2000,
    });
    expect(res.phase).toBe('run-timeout');
  }, 30_000);
});

const twoSum: CodeMethodExercise = {
  id: 't', title: 'Two Sum', prompt: '', type: 'code-method',
  method: { name: 'twoSum', params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }], returns: 'int[]' },
  starter: '',
  tests: [
    { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
    { args: [[3, 2, 4], 6], expected: [1, 2], hidden: true },
  ],
};

describe('gradeCodeMethod (real JDK)', () => {
  itJava('passes a correct solution', async () => {
    const r = await gradeCodeMethod(twoSum, `
      import java.util.*;
      class Solution {
        public int[] twoSum(int[] nums, int target) {
          Map<Integer,Integer> seen = new HashMap<>();
          for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i])) return new int[]{seen.get(target - nums[i]), i};
            seen.put(nums[i], i);
          }
          return new int[]{};
        }
      }`);
    expect(r.status).toBe('pass');
    expect(r.passed).toBe(2);
  }, 60_000);

  itJava('fails a wrong solution and hides hidden test details', async () => {
    const r = await gradeCodeMethod(twoSum, `
      class Solution { public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; } }`);
    expect(r.status).toBe('fail');
    expect(r.passed).toBe(1);
    const hidden = r.results!.find((x) => x.hidden)!;
    expect(hidden.pass).toBe(false);
    expect(hidden.expected).toBeUndefined();
    expect(hidden.actual).toBeUndefined();
  }, 60_000);

  itJava('captures user debug prints and runtime exceptions', async () => {
    const r = await gradeCodeMethod(twoSum, `
      class Solution { public int[] twoSum(int[] n, int t) {
        System.out.println("debugging!");
        if (n.length > 3) throw new IllegalStateException("boom");
        return new int[]{1,2};
      } }`);
    expect(r.status).toBe('fail');
    const first = r.results![0];
    expect(first.error).toContain('boom');
    expect(first.debug).toContain('debugging!');
  }, 60_000);

  itJava('friendly error on signature change', async () => {
    const r = await gradeCodeMethod(twoSum, `
      class Solution { public int[] twoSumm(int[] nums, int target) { return null; } }`);
    expect(r.status).toBe('compile-error');
    expect(r.message).toContain('signature');
  }, 60_000);

  itJava('handles ListNode / TreeNode / List<List<Integer>> round-trips', async () => {
    const ex: CodeMethodExercise = {
      id: 'x', title: '', prompt: '', type: 'code-method',
      method: { name: 'echo', params: [{ name: 'l', type: 'ListNode' }, { name: 't', type: 'TreeNode' }, { name: 'g', type: 'List<List<Integer>>' }], returns: 'List<List<Integer>>' },
      starter: '',
      tests: [{ args: [[1, 2, 3], [1, null, 2], [[1, 2], [3]]], expected: [[1, 2], [3]] }],
    };
    const r = await gradeCodeMethod(ex, `
      import java.util.*;
      class Solution { public List<List<Integer>> echo(ListNode l, TreeNode t, List<List<Integer>> g) {
        if (l.val != 1 || l.next.val != 2) throw new RuntimeException("bad list");
        if (t.val != 1 || t.left != null || t.right.val != 2) throw new RuntimeException("bad tree");
        return g;
      } }`);
    expect(r.status).toBe('pass');
  }, 60_000);

  itJava('void method graded via mutated param', async () => {
    const ex: CodeMethodExercise = {
      id: 'r', title: '', prompt: '', type: 'code-method',
      method: { name: 'reverse', params: [{ name: 'a', type: 'int[]' }], returns: 'void' },
      starter: '',
      tests: [{ args: [[1, 2, 3]], expected: [3, 2, 1] }],
    };
    const r = await gradeCodeMethod(ex, `
      class Solution { public void reverse(int[] a) {
        for (int l = 0, rr = a.length - 1; l < rr; l++, rr--) { int t = a[l]; a[l] = a[rr]; a[rr] = t; }
      } }`);
    expect(r.status).toBe('pass');
  }, 60_000);
});

describe('gradeCodeOutput (real JDK)', () => {
  const ex: CodeOutputExercise = {
    id: 'o', title: '', prompt: '', type: 'code-output',
    starter: '', expectedOutput: '0\n1\n2',
  };
  itJava('passes matching stdout', async () => {
    const r = await gradeCodeOutput(ex, 'public class Main { public static void main(String[] a) { for (int i = 0; i < 3; i++) System.out.println(i); } }');
    expect(r.status).toBe('pass');
  }, 60_000);
  itJava('fails wrong stdout with diff info', async () => {
    const r = await gradeCodeOutput(ex, 'public class Main { public static void main(String[] a) { System.out.println("nope"); } }');
    expect(r.status).toBe('fail');
    expect(r.actualOutput).toBe('nope');
    expect(r.expectedOutput).toBe('0\n1\n2');
  }, 60_000);
});

describe('gradeCodeDesign (real JDK)', () => {
  const ex: CodeDesignExercise = {
    id: 'd', title: '', prompt: '', type: 'code-design',
    className: 'MinStack',
    methods: {
      MinStack: { params: [], returns: 'void' },
      push: { params: ['int'], returns: 'void' },
      pop: { params: [], returns: 'void' },
      top: { params: [], returns: 'int' },
      getMin: { params: [], returns: 'int' },
    },
    starter: '',
    tests: [{
      ops: ['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'top', 'getMin'],
      args: [[], [-2], [0], [-3], [], [], [], []],
      expected: [null, null, null, null, -3, null, 0, -2],
    }],
  };
  itJava('grades op-sequence tests', async () => {
    const r = await gradeCodeDesign(ex, `
      import java.util.*;
      class MinStack {
        Deque<int[]> st = new ArrayDeque<>();
        public MinStack() {}
        public void push(int val) { int min = st.isEmpty() ? val : Math.min(val, st.peek()[1]); st.push(new int[]{val, min}); }
        public void pop() { st.pop(); }
        public int top() { return st.peek()[0]; }
        public int getMin() { return st.peek()[1]; }
      }`);
    expect(r.status).toBe('pass');
  }, 60_000);
});
