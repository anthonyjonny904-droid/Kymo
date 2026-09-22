import React, { useState } from 'react';
import {
  MessageSquare,
  Cpu,
  Code2,
  Terminal,
  Smartphone,
  Maximize2,
  Minimize2,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Bell,
  X,
  Volume2,
  CheckCircle2,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import { WhatsAppChat } from './components/WhatsAppChat';
import { PushInspector } from './components/PushInspector';
import { CodeBundleViewer } from './components/CodeBundleViewer';
import { ApkBuildTerminal } from './components/ApkBuildTerminal';
import { GitHubExportPush } from './components/GitHubExportPush';
import { Message, UserContact, FcmPushLog } from './types/chat';
import { sounds } from './utils/soundEffects';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'fcm' | 'bundle' | 'build' | 'github'>('github');
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [activeChatPeer, setActiveChatPeer] = useState<UserContact>({
    id: 'user_sarah_connor',
    name: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 234-5678',
    email: 'sarah.connor@cyberdyne.io',
    isOnline: true,
    activeChatId: 'chat_kymo_sarah', // Initially in-chat
    lastSeenText: 'online',
    fcmToken: 'fcm_token_pixel8_android_34_sarah_0918',
    about: 'Building Flutter apps with Kymo Chat 🚀',
  });

  const [fcmLogs, setFcmLogs] = useState<FcmPushLog[]>([]);
  const [activePushBanner, setActivePushBanner] = useState<{
    title: string;
    body: string;
    chatId: string;
  } | null>(null);

  // Cloud Function sendPushOnNewMessage logic simulation
  const handleTriggerFCM = (msg: Message, recipient: UserContact) => {
    const isSuppressed = recipient.isOnline && recipient.activeChatId === msg.chatId;

    let payload: any = null;
    let suppressReason: string | undefined = undefined;

    if (isSuppressed) {
      suppressReason = `Recipient is actively looking at chat ${msg.chatId}. Skipping FCM push.`;
    } else {
      // Construct FCM HTTP v1 payload exactly as defined in Cloud Function:
      payload = {
        token: recipient.fcmToken || 'fcm_token_mock_device_token',
        notification: {
          title: msg.senderName || 'New Message',
          body: msg.text || 'Sent an attachment',
        },
        data: {
          chatId: msg.chatId,
          messageId: msg.id,
          senderId: msg.senderId,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_importance_channel',
            sound: 'default',
            priority: 'high',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              alert: {
                title: msg.senderName || 'New Message',
                body: msg.text || 'Sent an attachment',
              },
              badge: 1,
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      // Play alert sound for high-importance notification
      sounds.playNotification();

      // Show interactive Android Heads-Up Banner
      setActivePushBanner({
        title: msg.senderName,
        body: msg.text,
        chatId: msg.chatId,
      });

      setTimeout(() => {
        setActivePushBanner(null);
      }, 5000);
    }

    const newLog: FcmPushLog = {
      id: `fcm_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      chatId: msg.chatId,
      senderName: msg.senderName,
      text: msg.text,
      recipientId: recipient.id,
      recipientToken: recipient.fcmToken,
      isSuppressed,
      suppressReason,
      payload,
      status: isSuppressed ? 'suppressed' : 'sent',
    };

    setFcmLogs((prev) => [newLog, ...prev]);
  };

  const handleManualTestPush = (customText?: string) => {
    const mockMsg: Message = {
      id: `test_${Date.now()}`,
      chatId: 'chat_kymo_sarah',
      senderId: 'ogkymo_user_1',
      receiverId: activeChatPeer.id,
      senderName: 'ogkymo@gmail.com',
      text: customText || 'Simulated test push notification payload from Kymo',
      timestamp: new Date().toLocaleTimeString(),
      status: 'sent',
    };
    handleTriggerFCM(mockMsg, activeChatPeer);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0b0f19] text-gray-100 overflow-hidden font-sans select-none">
      {/* GLOBAL TOP APPLICATION BAR */}
      <header className="h-14 bg-[#111827] border-b border-slate-800 px-4 flex items-center justify-between z-40 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
            K
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">KYMO CHAT</h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-emerald-500/30">
                com.kymo.chat
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Android Flutter APK Bundle • FCM Cloud Trigger Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-[#0d1320] p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'chat'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">WhatsApp UI</span>
          </button>
          <button
            onClick={() => setActiveTab('fcm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'fcm'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span className="hidden md:inline">FCM Trigger</span>
            {fcmLogs.length > 0 && (
              <span className="text-[10px] bg-indigo-500 text-white px-1.5 rounded-full font-mono">
                {fcmLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bundle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'bundle'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Source Bundle</span>
          </button>
          <button
            onClick={() => setActiveTab('build')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'build'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">APK Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'github'
                ? 'bg-purple-600 text-white shadow'
                : 'text-purple-400 hover:text-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>GitHub Push</span>
          </button>
        </div>

        {/* User Identity & View Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[11px] font-semibold text-white">ogkymo@gmail.com</span>
            <span className="text-[10px] text-emerald-400 font-mono">Version 1.0.0+1</span>
          </div>

          {activeTab === 'chat' && (
            <button
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title={isPhoneFrame ? 'Switch to Full-Screen Web Mode' : 'Switch to Phone Mockup Frame'}
            >
              {isPhoneFrame ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEW CONTAINER */}
      <main className="flex-1 overflow-hidden relative">
        {/* ANDROID HEADS-UP PUSH NOTIFICATION BANNER TOAST */}
        {activePushBanner && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#1F2937] text-white p-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow">
              K
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white flex items-center gap-1">
                  <span>{activePushBanner.title}</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1 rounded font-mono">
                    high_importance_channel
                  </span>
                </span>
                <span className="text-[10px] text-slate-400">now</span>
              </div>
              <p className="text-xs text-slate-200 truncate mt-0.5">{activePushBanner.body}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-400">
                <span>FCM Trigger: FLUTTER_NOTIFICATION_CLICK</span>
              </div>
            </div>
            <button
              onClick={() => setActivePushBanner(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: WHATSAPP LIVE CLIENT */}
        {activeTab === 'chat' && (
          <div className="h-full w-full flex items-center justify-center bg-[#070b13] p-0 md:p-3">
            {isPhoneFrame ? (
              /* Pixel 8 Android Phone Mockup Frame */
              <div className="w-full max-w-[440px] h-full max-h-[840px] bg-[#111B21] rounded-[36px] overflow-hidden border-[6px] border-[#2A3942] shadow-2xl flex flex-col relative">
                {/* Phone Notch & Status Bar */}
                <div className="h-7 bg-[#008069] text-white text-[11px] px-5 flex items-center justify-between font-mono z-30">
                  <span>10:14</span>
                  {/* Camera hole */}
                  <div className="w-3.5 h-3.5 bg-black rounded-full mx-auto"></div>
                  <div className="flex items-center gap-1.5">
                    <Signal className="w-3 h-3" />
                    <Wifi className="w-3 h-3" />
                    <Battery className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* WhatsApp Chat UI */}
                <div className="flex-1 overflow-hidden">
                  <WhatsAppChat
                    onTriggerFCM={handleTriggerFCM}
                    activeChatPeer={activeChatPeer}
                    setActiveChatPeer={setActiveChatPeer}
                  />
                </div>

                {/* Android Bottom Navigation Pill Bar */}
                <div className="h-4 bg-[#111B21] flex items-center justify-center pb-1">
                  <div className="w-28 h-1 bg-gray-500/50 rounded-full"></div>
                </div>
              </div>
            ) : (
              /* Full-Width Desktop Mode */
              <div className="h-full w-full">
                <WhatsAppChat
                  onTriggerFCM={handleTriggerFCM}
                  activeChatPeer={activeChatPeer}
                  setActiveChatPeer={setActiveChatPeer}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FCM TRIGGER & CLOUD FUNCTION INSPECTOR */}
        {activeTab === 'fcm' && (
          <PushInspector
            logs={fcmLogs}
            activeChatPeer={activeChatPeer}
            onSimulatePush={handleManualTestPush}
            onClearLogs={() => setFcmLogs([])}
          />
        )}

        {/* TAB 3: FLUTTER ANDROID SOURCE BUNDLE VIEWER */}
        {activeTab === 'bundle' && <CodeBundleViewer />}

        {/* TAB 4: APK RELEASE BUILD TERMINAL */}
        {activeTab === 'build' && <ApkBuildTerminal />}

        {/* TAB 5: GITHUB EXPORT & FORCE PUSH */}
        {activeTab === 'github' && <GitHubExportPush />}
      </main>
    </div>
  );
}
