import React, { useState } from 'react';
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Send,
  Smartphone,
  Cpu,
  RefreshCw,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { FcmPushLog, UserContact } from '../types/chat';
import { sounds } from '../utils/soundEffects';

interface PushInspectorProps {
  logs: FcmPushLog[];
  activeChatPeer: UserContact;
  onSimulatePush: (customText?: string) => void;
  onClearLogs: () => void;
}

export const PushInspector: React.FC<PushInspectorProps> = ({
  logs,
  activeChatPeer,
  onSimulatePush,
  onClearLogs,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customMsg, setCustomMsg] = useState('New push notification from Kymo');
  const [selectedLog, setSelectedLog] = useState<FcmPushLog | null>(null);

  const activeLog = selectedLog || (logs.length > 0 ? logs[0] : null);

  const handleCopyJson = (payload: any, index: number) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0F172A] text-gray-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="bg-[#1E293B] border-b border-slate-700 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Cpu className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-white">FCM Trigger & Cloud Function Inspector</h2>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/30">
              functions/index.js
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Testing Firestore trigger: <code className="text-emerald-400 font-mono">chats/{'{chatId}'}/messages/{'{messageId}'}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSimulatePush(customMsg)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-md"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Dispatch Test Event</span>
          </button>
          <button
            onClick={onClearLogs}
            className="text-xs text-slate-400 hover:text-slate-200 border border-slate-600 px-3 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            Clear Logs
          </button>
        </div>
      </div>

      {/* Main Grid: Architecture Diagram & Real-Time Log Viewer */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Function Logic & Recipient Presence State (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-700/80 p-5 overflow-y-auto space-y-5 bg-[#131E30]">
          {/* Recipient State Card */}
          <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Target Recipient Device State
              </span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                  activeChatPeer.activeChatId
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {activeChatPeer.activeChatId ? 'Active in Chat' : 'In Background'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#0F172A] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">User Document:</span>
                <span className="font-mono text-slate-200 font-semibold">{activeChatPeer.id}</span>
              </div>
              <div className="bg-[#0F172A] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Recipient Name:</span>
                <span className="font-semibold text-white truncate block">{activeChatPeer.name}</span>
              </div>
              <div className="bg-[#0F172A] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">activeChatId (Firestore):</span>
                <span className="font-mono text-emerald-300 truncate block">
                  {activeChatPeer.activeChatId || 'null (suppression OFF)'}
                </span>
              </div>
              <div className="bg-[#0F172A] p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">isOnline (Presence):</span>
                <span className={`font-semibold ${activeChatPeer.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {activeChatPeer.isOnline ? 'true' : 'false'}
                </span>
              </div>
            </div>

            <div className="bg-[#0F172A] p-2 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">Registered FCM Device Token:</span>
              <p className="font-mono text-[11px] text-slate-300 break-all truncate">
                {activeChatPeer.fcmToken || 'No token registered'}
              </p>
            </div>
          </div>

          {/* Logic Execution Flowchart Card */}
          <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              sendPushOnNewMessage Decision Tree
            </h4>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                  1
                </span>
                <div className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">Firestore Write Triggered:</span>
                  <p className="text-slate-400">Snapshot creates new message under chats/{'{chatId}'}/messages</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0F172A] border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px]">
                  2
                </span>
                <div className="text-[11px] text-slate-300">
                  <span className="font-semibold text-white">Check Recipient Document:</span>
                  <p className="text-slate-400">Loads <code className="text-indigo-300 font-mono">users/{activeChatPeer.id}</code></p>
                </div>
              </div>

              {/* Conditional Evaluation */}
              <div
                className={`p-3 rounded-lg border transition-all ${
                  activeChatPeer.activeChatId
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  {activeChatPeer.activeChatId ? (
                    <BellOff className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Bell className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>
                    Condition:{' '}
                    <code className="font-mono text-[11px]">
                      isOnline &amp;&amp; activeChatId === chatId
                    </code>
                  </span>
                </div>
                <p className="mt-1 text-[11px] opacity-90">
                  {activeChatPeer.activeChatId
                    ? 'EVALUATED TRUE: Recipient is currently viewing this chat! Skipping FCM push to avoid duplicate annoying notifications. (Live Firestore stream renders it).'
                    : 'EVALUATED FALSE: Recipient is outside or in background. Dispatching FCM High Priority Push Notification to Android high_importance_channel.'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Custom Message Tester */}
          <div className="bg-[#1E293B] rounded-xl p-4 border border-slate-700 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Custom Trigger Tester
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                placeholder="Enter custom message body..."
                className="flex-1 bg-[#0F172A] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => onSimulatePush(customMsg)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Event Log Stream & Payload Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col bg-[#0F172A] overflow-hidden">
          {/* Top Panel: Event Log List */}
          <div className="h-1/2 border-b border-slate-700 flex flex-col">
            <div className="px-4 py-2.5 bg-[#1E293B]/70 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Live Cloud Function Event Stream ({logs.length})
              </span>
              <span className="text-[11px] text-slate-400">
                Click any event to inspect its FCM payload
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs py-8">
                  <Sparkles className="w-8 h-8 mb-2 opacity-30 text-emerald-400" />
                  <p>No trigger events yet.</p>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Send a message in WhatsApp Chat or click "Dispatch Test Event".
                  </p>
                </div>
              ) : (
                logs.map((log) => {
                  const isSelected = activeLog?.id === log.id;
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-2.5 rounded-lg cursor-pointer transition text-xs flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-950/60 border border-indigo-500/50'
                          : 'hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {log.isSuppressed ? (
                          <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                            <BellOff className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">
                              {log.senderName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {log.timestamp}
                            </span>
                          </div>
                          <p className="text-slate-400 truncate text-[11px]">
                            {log.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {log.isSuppressed ? (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                            SUPPRESSED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">
                            FCM SENT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Panel: Selected Payload & Android Notification Channel Details */}
          <div className="h-1/2 flex flex-col bg-[#0B1120] overflow-hidden">
            <div className="px-4 py-2 bg-[#162032] border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <span>FCM HTTP v1 Payload Details</span>
                {activeLog && (
                  <span className="text-[10px] text-slate-400 font-mono">({activeLog.id})</span>
                )}
              </span>
              {activeLog?.payload && (
                <button
                  onClick={() => handleCopyJson(activeLog.payload, 0)}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  {copiedIndex === 0 ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedIndex === 0 ? 'Copied' : 'Copy JSON'}</span>
                </button>
              )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300">
              {activeLog ? (
                activeLog.isSuppressed ? (
                  <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                      <BellOff className="w-4 h-4" />
                      <span>FCM Push Notification Suppressed</span>
                    </div>
                    <p className="text-slate-300">
                      <strong>Reason:</strong> {activeLog.suppressReason}
                    </p>
                    <div className="bg-[#0F172A] p-3 rounded font-mono text-[11px] text-emerald-400">
                      console.log(`Recipient is actively looking at chat ${activeLog.chatId}. Skipping FCM push.`);
                    </div>
                  </div>
                ) : (
                  <pre className="bg-[#080D1A] p-3 rounded-lg border border-slate-800 overflow-x-auto text-[11px] text-emerald-300 leading-relaxed">
                    {JSON.stringify(activeLog.payload, null, 2)}
                  </pre>
                )
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  Select an event above to view its structured FCM payload
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
