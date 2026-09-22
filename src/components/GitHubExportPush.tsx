import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Github,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  Archive,
  ArrowRight,
  FileCode
} from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { KYMO_BUNDLE_FILES } from '../data/bundleFiles';

const AAB_WORKFLOW_YML = `name: Build Debug APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-debug-apk:
    name: Build Debug APK (com.kymo.chat)
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Java Development Kit (JDK 17)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Set up Flutter SDK
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.3'
          channel: 'stable'
          cache: true

      - name: Install Dependencies
        run: flutter pub get

      - name: Build Debug APK
        run: flutter build apk --debug

      - name: Upload Debug APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: kymo-chat-debug-apk
          path: build/app/outputs/flutter-apk/app-debug.apk
          retention-days: 30
`;

export const GitHubExportPush: React.FC = () => {
  const [repoName, setRepoName] = useState<string>('anthonyjonny904-droid/Kymo');
  const [githubToken, setGithubToken] = useState<string>('');
  const [isPushing, setIsPushing] = useState<boolean>(false);
  const [pushStatus, setPushStatus] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
    output?: string;
  } | null>(null);
  const [copiedWorkflow, setCopiedWorkflow] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [gitInfo, setGitInfo] = useState<{
    lastCommit?: string;
    remote?: string;
    status?: string;
  } | null>(null);

  const fetchGitStatus = async () => {
    try {
      const res = await fetch('/api/git-status');
      if (res.ok) {
        const data = await res.json();
        setGitInfo(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchGitStatus();
  }, []);

  const handlePush = async () => {
    setIsPushing(true);
    setPushStatus(null);

    try {
      const res = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: repoName,
          token: githubToken,
          force: true,
        }),
      });

      const data = await res.json();
      setPushStatus(data);

      if (data.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
        fetchGitStatus();
      }
    } catch (err: any) {
      setPushStatus({
        success: false,
        message: err.message || 'Network error occurred while contacting push endpoint',
      });
    } finally {
      setIsPushing(false);
    }
  };

  const handleDownloadFullZip = async () => {
    const zip = new JSZip();
    zip.file('.github/workflows/build-aab.yml', AAB_WORKFLOW_YML);
    KYMO_BUNDLE_FILES.forEach((f) => {
      zip.file(f.path, f.content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anthonyjonny9-Kymo-complete-source.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const cliPushCommand = githubToken
    ? `git remote set-url origin https://${githubToken}@github.com/${repoName}.git && git push -u origin main --force`
    : `git remote set-url origin https://<YOUR_GITHUB_PAT>@github.com/${repoName}.git && git push -u origin main --force`;

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-gray-200 overflow-y-auto font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header Title Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                <Github className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  GitHub Export &amp; Force Push
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
                    Overwrite: true
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target: <strong className="text-white font-mono">{repoName}</strong> (branch:{' '}
                  <span className="text-emerald-400 font-mono">main</span>)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadFullZip}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <Archive className="w-4 h-4 text-emerald-400" />
              <span>Download Repo ZIP</span>
            </button>
            <a
              href={`https://github.com/${repoName}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <span>Open Repo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Local Git State Banner */}
        <div className="bg-[#141d2e] border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Local Git Head:</span>
              <span className="font-mono text-emerald-300 font-semibold">
                {gitInfo?.lastCommit || '6084ed3 - Initial commit with all Flutter files'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Origin Remote:</span>
            <span className="font-mono text-slate-200">https://github.com/{repoName}.git</span>
          </div>
        </div>

        {/* Main Grid: Push Form & Workflow Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Push Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 shadow-md space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                1-Click Push to GitHub
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GitHub Repository
                  </label>
                  <input
                    type="text"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    className="w-full bg-[#080d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="owner/repo"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>GitHub Personal Access Token (PAT)</span>
                    </label>
                    <a
                      href="https://github.com/settings/tokens/new?scopes=repo&description=Kymo+Chat+Push"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <span>Generate Token (repo scope)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#080d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Token is only used to authenticate the force push to <code>anthonyjonny9/Kymo</code>.
                  </p>
                </div>

                {/* Push Status Alert */}
                {pushStatus && (
                  <div
                    className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                      pushStatus.success
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/40 border-red-500/50 text-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {pushStatus.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Push Succeeded!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span>Push Error</span>
                        </>
                      )}
                    </div>
                    <p className="opacity-90">{pushStatus.message || pushStatus.error}</p>
                    {pushStatus.output && (
                      <pre className="bg-[#050810] p-2 rounded text-[10px] font-mono overflow-x-auto text-slate-300 mt-1">
                        {pushStatus.output}
                      </pre>
                    )}
                  </div>
                )}

                <button
                  onClick={handlePush}
                  disabled={isPushing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {isPushing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Pushing &amp; Overwriting remote repository...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Export &amp; Push to GitHub ({repoName})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* CLI Direct Commands Card */}
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                Terminal One-Liner (Push via CLI)
              </span>

              <div className="bg-[#080d16] p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Run directly in terminal:</span>
                  <button
                    onClick={() => copyToClipboard(cliPushCommand, 'clipush')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedCmd === 'clipush' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd === 'clipush' ? 'Copied' : 'Copy Command'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-emerald-300 whitespace-pre-wrap break-all select-all">
                  {cliPushCommand}
                </pre>
              </div>
            </div>
          </div>

          {/* Right: GitHub Actions AAB Workflow Viewer (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-md flex flex-col h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  GitHub Actions Debug APK Workflow
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(AAB_WORKFLOW_YML);
                    setCopiedWorkflow(true);
                    setTimeout(() => setCopiedWorkflow(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  {copiedWorkflow ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedWorkflow ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 bg-[#0c121e] p-2.5 rounded-lg border border-slate-800">
                File: <code className="text-purple-300 font-mono">.github/workflows/build-aab.yml</code>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Builds debug APK automatically with Flutter 3.24 &amp; JDK 17 (no signing, no secrets).
                </p>
              </div>

              <div className="flex-1 bg-[#080d16] border border-slate-800 rounded-xl p-3 overflow-x-auto overflow-y-auto max-h-[420px] font-mono text-[11px] text-slate-300 leading-relaxed select-text">
                <pre>{AAB_WORKFLOW_YML}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
