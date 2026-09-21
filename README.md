# javaprepare

An interactive course that takes you from **zero Java** to acing **NeetCode 150** — in three arcs:

1. **Fundamentals** — variables, loops, arrays, strings, recursion, collections… drilled zybooks-style until they're muscle memory.
2. **Patterns** — one reusable code template per NeetCode category (sliding window, binary search, backtracking, DFS/BFS, DP…), each with retype-from-memory drills.
3. **Problems** — real NeetCode questions graded against visible + hidden test cases.

Everything you submit is **compiled and run with a real JDK on your machine** — the same `javac` you'd use in production. No cloud, no accounts, your progress stays in a local file.

### Features

- 5 exercise types: quizzes, fill-in-the-blank code, write-a-program, implement-a-method (LeetCode style), and design-a-class problems
- **Mastery drills**: pass 3 times in a row, retyping from memory each rep, to master an idiom
- **Spaced repetition**: mastered drills (and any NeetCode problem you add) resurface in review sessions on an expanding, local-day schedule
- **Progress dashboard**: drills vs NeetCode problems solved by category, activity heatmap, review forecast and retention, struggle areas and leeches
- Progressive hints; full solutions with explanations unlock after 2 real attempts or all hints. Using them marks the exercise "solved with help"
- Stuck on a quiz or fill-in? "Show answer" appears after 2 misses
- Drafts survive reloads; "Run examples" checks visible tests without counting as an attempt
- Compile errors underlined in the editor; line-by-line output diff; hidden tests keep you honest
- Prev/Next navigation, per-lesson checklists, "Continue where you left off", ⌘/Ctrl+Enter to run, light and dark themes
- Multiple-choice options are reshuffled between attempts, so the answer is never predictably in the same slot

## Requirements

- **Node.js 22.12+** (24 LTS recommended) — [nodejs.org](https://nodejs.org)
- **JDK 17+** (the Java *Development* Kit — a JRE is not enough) — [adoptium.net](https://adoptium.net) or `brew install openjdk@21`

Check both:

```sh
node --version    # v22+
javac -version    # 17+
```

If the JDK is missing, the app boots into a setup page that walks you through installing it.

## Run it

```sh
git clone https://github.com/<you>/javaprepare
cd javaprepare
npm install
npm start          # builds the client, serves everything at http://localhost:4400
```

For development (hot reload):

```sh
npm run dev        # client on :5173 (proxying to the API on :4400)
```

Your progress lives in `data/progress.db` (SQLite, gitignored). Delete it to start fresh.

## Contributing content

All course content is plain JSON + Markdown under [content/](content/):

- `content/curriculum.json` — the course tree (units → lessons → problems)
- `content/units/<unit>/<lesson>.md` — lesson text; a line `@exercise <id>` embeds an exercise
- `content/units/<unit>/<lesson>.json` — the lesson's exercises
- `content/problems/<category>/<slug>.json` — a problem: statement, starter code, tests (visible + hidden), hints, reference solution

Every code exercise must include a reference solution, and:

```sh
npm run validate-content
UNITS=16-trees,17-tries npm run validate-content   # just some units, while editing
```

must pass — it compiles and runs **every reference solution against its own tests**, so broken content can't ship. See any existing problem file for the schema (supported parameter/return types include primitives, arrays, `List<...>`, `ListNode`, `TreeNode`, and op-sequence tests for design problems).

**148 of the NeetCode 150 are authored and validated.** The two skipped (Clone Graph, Copy List with Random Pointer) need bespoke node structures the current harness doesn't build — PRs welcome.

## How grading works

- **Write-a-program** exercises compare your stdout (whitespace-tolerant).
- **Method/design** exercises get a generated Java harness that calls your code with each test's arguments and serializes the results; comparison modes cover exact, order-insensitive, set, and float-epsilon answers. Runs are sandboxed to a temp dir with time and memory limits.
- **Drills** track consecutive passes; mastering one schedules it into the spaced-repetition review queue (SM-2-style intervals).

## Tests

```sh
npm test                    # engine test suite (needs the JDK)
npm run validate-content    # verify all course content
```
