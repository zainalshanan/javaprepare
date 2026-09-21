import type { JdkStatus } from '../types';

export function DoctorPage({ status, onRetry }: { status: JdkStatus; onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
      <div className="font-display text-2xl font-bold tracking-tight">
        java<span className="text-amber">prepare</span>
      </div>
      <h1 className="mt-6 font-display text-xl font-semibold">One thing to set up first</h1>
      <p className="mt-2 text-dim">
        This course grades your code by compiling and running it with a real Java compiler on your machine.
      </p>
      <div className="mt-4 rounded-lg border border-fail/40 bg-fail/10 px-4 py-3 text-sm text-paper">
        {status.problem ?? 'JDK not found.'}
      </div>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-paper/90">
        <p className="font-medium text-paper">Install a JDK (version 17 or newer):</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium">macOS:</span>{' '}
            <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">brew install openjdk@21</code>{' '}
            (then follow brew's PATH instructions), or download from{' '}
            <a className="text-sky underline" href="https://adoptium.net" target="_blank" rel="noreferrer">adoptium.net</a>
          </li>
          <li>
            <span className="font-medium">Windows:</span> download the Temurin 21 installer from{' '}
            <a className="text-sky underline" href="https://adoptium.net" target="_blank" rel="noreferrer">adoptium.net</a>{' '}
            and tick “Add to PATH” during install
          </li>
          <li>
            <span className="font-medium">Linux:</span>{' '}
            <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">sudo apt install openjdk-21-jdk</code>
          </li>
        </ul>
        <p>
          Verify with <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">javac -version</code> in a new
          terminal, then restart the app (<code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs">npm start</code>).
        </p>
      </div>
      <button
        onClick={onRetry}
        className="mt-8 w-fit rounded-md bg-amber px-4 py-2 text-sm font-semibold text-on-amber hover:bg-amber-deep"
      >
        Check again
      </button>
    </div>
  );
}
