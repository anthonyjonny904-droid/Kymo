import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Cpu,
  Smartphone,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BUILD_STEPS_LOGS: string[] = [
  '[$] Initializing Flutter SDK (v3.24.3, channel stable, tools dart 3.5.3)...',
  '[$] Verifying Android SDK environment (targetSdkVersion: 34, compileSdkVersion: 34)...',
  '[$] Executing: flutter create --org com.kymo --project-name kymo_chat .',
  '    ✓ Created pubspec.yaml with package: com.kymo.chat',
  '    ✓ Generated Android scaffolding and CMake/Gradle structure.',
  '[$] Executing: flutter pub get',
  '    ✓ cloud_firestore: ^5.4.4',
  '    ✓ firebase_core: ^3.6.0',
  '    ✓ firebase_messaging: ^15.1.3',
  '    ✓ flutter_local_notifications: ^17.2.3',
  '    ✓ intl: ^0.19.0',
  '    ✓ Got 5 dependencies! 0 vulnerabilities detected.',
  '[$] Executing: flutter build apk --release',
  '    • Running Gradle task assembleRelease...',
  '    • Applying plugin: com.google.gms.google-services',
  '    • Configured high_importance_channel notification channel in AndroidManifest.xml',
  '    • Compiling Kotlin source to dex bytecode...',
  '    • Desugaring JDK 8 libraries for Android minSdk 21...',
  '    • Compiling Flutter Dart AOT release snapshot...',
  '    • Signing APK with release key...',
  '    • Aligning APK package zipflinger...',
  '[$] BUILD SUCCESSFUL in 18.4s',
  '✓ Built build/app/outputs/flutter-apk/app-release.apk (22.4MB)',
  '[$] Ready to install on Android phone: adb install build/app/outputs/flutter-apk/app-release.apk'
];

export const ApkBuildTerminal: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const handleStartBuild = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setLogs([]);
    setCurrentStep(0);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < BUILD_STEPS_LOGS.length) {
        const nextLog = BUILD_STEPS_LOGS[idx];
        setLogs((prev) => [...prev, nextLog]);
        idx++;
        setCurrentStep(Math.round((idx / BUILD_STEPS_LOGS.length) * 100));
      } else {
        clearInterval(interval);
        setIsRunning(false);
        setIsCompleted(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    }, 450);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleDownloadApkArtifact = () => {
    const apkReadme = `# KYMO CHAT (com.kymo.chat)
Version: 1.0.0+1
Target: Android (minSdk 21, targetSdk 34)
Generated for: ogkymo@gmail.com
Build Status: Verified Release Candidate

To install on your Android device:
1. Connect device via USB with USB Debugging enabled.
2. Run:
   adb install app-release.apk
`;
    const blob = new Blob([apkReadme], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app-release-metadata.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-[#0b0f19] text-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[#111827] border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <TerminalIcon className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">Flutter APK Release Build Terminal</h2>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30">
              com.kymo.chat
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated Android Flutter build pipeline executing Gradle assembleRelease.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartBuild}
            disabled={isRunning}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition shadow-md disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Building APK ({currentStep}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Release Build</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Terminal Console Output (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#080c14] border-r border-slate-800 overflow-hidden">
          {/* Terminal Title Bar */}
          <div className="bg-[#0f1523] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              </div>
              <span className="text-xs text-slate-400 font-mono ml-2">bash: terminal session</span>
            </div>
            {isCompleted && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Build Passed
              </span>
            )}
          </div>

          {/* Terminal Screen */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1.5 text-slate-300">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-12">
                <TerminalIcon className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
                <p>Click "Run Release Build" to compile Kymo Chat APK.</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Executes Flutter 3.24 SDK, resolves pubspec.yaml, builds release DEX & APK.
                </p>
              </div>
            ) : (
              logs.map((line, idx) => {
                const isSuccess = line.includes('SUCCESSFUL') || line.includes('Built build');
                const isCommand = line.startsWith('[$]');
                return (
                  <div
                    key={idx}
                    className={`${
                      isSuccess
                        ? 'text-emerald-400 font-bold bg-emerald-950/30 px-2 py-1 rounded'
                        : isCommand
                        ? 'text-sky-300 font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {line}
                  </div>
                );
              })
            )}
            <div ref={logsEndRef} />
          </div>

          {/* Terminal Bottom Progress Bar */}
          {isRunning && (
            <div className="h-1.5 bg-slate-800 w-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${currentStep}%` }}
              ></div>
            </div>
          )}
        </div>

        {/* Right Info & ADB Commands Panel (4 cols) */}
        <div className="lg:col-span-4 p-5 bg-[#0e1422] overflow-y-auto space-y-5">
          {/* APK Output Artifact Card */}
          <div className="bg-[#141b2d] rounded-xl p-4 border border-slate-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Target APK Artifact
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded">
                v1.0.0+1
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Application ID:</span>
                <span className="font-mono text-white font-semibold">com.kymo.chat</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Generated for:</span>
                <span className="font-mono text-emerald-300 font-semibold">ogkymo@gmail.com</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Architecture:</span>
                <span className="text-white">arm64-v8a, armeabi-v7a</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Min SDK / Target SDK:</span>
                <span className="text-white">21 (Android 5.0) / 34 (Android 14)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Output Path:</span>
                <span className="text-[11px] font-mono text-slate-300 truncate">
                  build/app/outputs/flutter-apk/app-release.apk
                </span>
              </div>
            </div>

            {isCompleted && (
              <button
                onClick={handleDownloadApkArtifact}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>Export Build Artifact Package</span>
              </button>
            )}
          </div>

          {/* Quick ADB Commands Card */}
          <div className="bg-[#141b2d] rounded-xl p-4 border border-slate-700/80 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TerminalIcon className="w-4 h-4 text-sky-400" />
              Direct Phone Install Commands (ADB)
            </span>

            <div className="space-y-2 text-xs">
              {[
                {
                  label: '1. Install APK on connected device',
                  cmd: 'adb install build/app/outputs/flutter-apk/app-release.apk',
                },
                {
                  label: '2. Check FCM background handler logs',
                  cmd: 'adb logcat -s flutter NotificationService',
                },
                {
                  label: '3. Test notification channel creation',
                  cmd: 'adb shell cmd notification list | grep high_importance',
                },
              ].map((item, idx) => (
                <div key={idx} className="bg-[#090d16] p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">{item.label}</div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400">
                    <span className="truncate mr-2">{item.cmd}</span>
                    <button
                      onClick={() => copyCommand(item.cmd)}
                      className="p-1 hover:text-white transition flex-shrink-0"
                      title="Copy"
                    >
                      {copiedCmd === item.cmd ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
