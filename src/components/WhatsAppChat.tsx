import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MoreVertical,
  Phone,
  Video,
  Smile,
  Paperclip,
  Mic,
  Send,
  Camera,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  Image as ImageIcon,
  FileText,
  User,
  MapPin,
  BarChart2,
  X,
  Radio,
  PhoneOff,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Bell,
  BellOff
} from 'lucide-react';
import { Message, UserContact, ChatThread, MessageStatus } from '../types/chat';
import { sounds } from '../utils/soundEffects';

interface WhatsAppChatProps {
  onTriggerFCM: (msg: Message, recipient: UserContact) => void;
  activeChatPeer: UserContact;
  setActiveChatPeer: React.Dispatch<React.SetStateAction<UserContact>>;
}

const INITIAL_CONTACTS: UserContact[] = [
  {
    id: 'user_sarah_connor',
    name: 'Sarah Connor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 234-5678',
    email: 'sarah.connor@cyberdyne.io',
    isOnline: true,
    activeChatId: 'chat_kymo_sarah',
    lastSeenText: 'online',
    fcmToken: 'fcm_token_pixel8_android_34_sarah_0918',
    about: 'Building Flutter apps with Kymo Chat 🚀',
  },
  {
    id: 'user_alex_rivera',
    name: 'Alex Rivera (Tech Lead)',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (555) 890-1234',
    email: 'alex.rivera@kymo.chat',
    isOnline: false,
    activeChatId: null,
    lastSeenText: 'last seen today at 11:42 AM',
    fcmToken: 'fcm_token_galaxy_s24_alex_4821',
    about: 'Cloud Functions & FCM trigger architect ⚡',
  },
  {
    id: 'user_kymo_support',
    name: 'Kymo Bot & Support',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    phone: '+1 (800) 596-6242',
    email: 'support@kymo.chat',
    isOnline: true,
    activeChatId: null,
    lastSeenText: 'online 24/7',
    fcmToken: 'fcm_token_cloud_support_service_8833',
    about: 'Official Kymo Chat Release Support Bot',
  },
  {
    id: 'user_elena_rostova',
    name: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+44 7700 900123',
    email: 'elena@london-tech.uk',
    isOnline: false,
    activeChatId: null,
    lastSeenText: 'last seen yesterday at 9:15 PM',
    fcmToken: 'fcm_token_oneplus_12_elena_7712',
    about: 'Flutter 3.24 release testing in London ☕',
  },
];

const INITIAL_MESSAGES: Record<string, Message[]> = {
  chat_kymo_sarah: [
    {
      id: 'm1',
      chatId: 'chat_kymo_sarah',
      senderId: 'user_sarah_connor',
      receiverId: 'ogkymo_user_1',
      senderName: 'Sarah Connor',
      text: 'Hey Kymo! Did you see the new Flutter 3.24 release? The FCM background message handler is super fast now.',
      timestamp: '10:08 AM',
      status: 'read',
      reaction: '🔥',
    },
    {
      id: 'm2',
      chatId: 'chat_kymo_sarah',
      senderId: 'ogkymo_user_1',
      receiverId: 'user_sarah_connor',
      senderName: 'ogkymo@gmail.com',
      text: 'Yes! I just verified the Cloud Function sendPushOnNewMessage. It cleanly skips push when activeChatId matches!',
      timestamp: '10:10 AM',
      status: 'read',
    },
    {
      id: 'm3',
      chatId: 'chat_kymo_sarah',
      senderId: 'user_sarah_connor',
      receiverId: 'ogkymo_user_1',
      senderName: 'Sarah Connor',
      text: 'Here is a quick voice note about the Android high_importance_channel test on device.',
      timestamp: '10:12 AM',
      status: 'read',
      type: 'voice',
      voiceDuration: '0:18',
    },
    {
      id: 'm4',
      chatId: 'chat_kymo_sarah',
      senderId: 'ogkymo_user_1',
      receiverId: 'user_sarah_connor',
      senderName: 'ogkymo@gmail.com',
      text: 'Awesome! Ready to build the release APK for com.kymo.chat.',
      timestamp: '10:14 AM',
      status: 'read',
      reaction: '👍',
    },
  ],
  chat_kymo_alex: [
    {
      id: 'm_a1',
      chatId: 'chat_kymo_alex',
      senderId: 'user_alex_rivera',
      receiverId: 'ogkymo_user_1',
      senderName: 'Alex Rivera',
      text: 'Hi Kymo, make sure recipientRef.update({ fcmToken: null }) is handled if registration token expires.',
      timestamp: 'Yesterday',
      status: 'read',
    },
    {
      id: 'm_a2',
      chatId: 'chat_kymo_alex',
      senderId: 'ogkymo_user_1',
      receiverId: 'user_alex_rivera',
      senderName: 'ogkymo@gmail.com',
      text: 'Already included in the Cloud Function try/catch block!',
      timestamp: 'Yesterday',
      status: 'read',
    },
  ],
  chat_kymo_support: [
    {
      id: 'm_s1',
      chatId: 'chat_kymo_support',
      senderId: 'user_kymo_support',
      receiverId: 'ogkymo_user_1',
      senderName: 'Kymo Bot',
      text: 'Welcome to Kymo Chat (com.kymo.chat) v1.0.0! Your Firestore database and FCM channel are configured.',
      timestamp: '09:00 AM',
      status: 'read',
      reaction: '🎉',
    },
  ],
  chat_kymo_elena: [
    {
      id: 'm_e1',
      chatId: 'chat_kymo_elena',
      senderId: 'user_elena_rostova',
      receiverId: 'ogkymo_user_1',
      senderName: 'Elena Rostova',
      text: 'Looking forward to testing the release APK on Android 14!',
      timestamp: 'Wednesday',
      status: 'read',
    },
  ],
};

export const WhatsAppChat: React.FC<WhatsAppChatProps> = ({
  onTriggerFCM,
  activeChatPeer,
  setActiveChatPeer,
}) => {
  const [contacts, setContacts] = useState<UserContact[]>(INITIAL_CONTACTS);
  const [messages, setMessages] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);
  const [activeTab, setActiveTab] = useState<'chats' | 'status' | 'calls'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; duration: number } | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [mobileViewChat, setMobileViewChat] = useState<boolean>(true); // on small screens

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<any>(null);
  const callIntervalRef = useRef<any>(null);

  // Derive active chat ID from peer
  const getChatId = (peerId: string) => {
    if (peerId === 'user_sarah_connor') return 'chat_kymo_sarah';
    if (peerId === 'user_alex_rivera') return 'chat_kymo_alex';
    if (peerId === 'user_kymo_support') return 'chat_kymo_support';
    return 'chat_kymo_elena';
  };

  const currentChatId = getChatId(activeChatPeer.id);
  const currentMessages = messages[currentChatId] || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isPeerTyping]);

  // Voice recording timer
  useEffect(() => {
    if (isRecordingVoice) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecordingVoice]);

  // Call duration timer
  useEffect(() => {
    if (activeCall) {
      setCallTimer(0);
      callIntervalRef.current = setInterval(() => {
        setCallTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    }
    return () => {
      if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    };
  }, [activeCall]);

  const handleSendMessage = (textToSend?: string, type: 'text' | 'voice' = 'text', voiceDuration?: string) => {
    const content = textToSend || inputText.trim();
    if (!content && type === 'text') return;

    sounds.playSent();

    const newMsgId = `m_${Date.now()}`;
    const newMsg: Message = {
      id: newMsgId,
      chatId: currentChatId,
      senderId: 'ogkymo_user_1',
      receiverId: activeChatPeer.id,
      senderName: 'ogkymo@gmail.com',
      text: content || (type === 'voice' ? 'Voice note' : ''),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'pending',
      type,
      voiceDuration,
    };

    // 1. Add immediately as pending
    setMessages((prev) => ({
      ...prev,
      [currentChatId]: [...(prev[currentChatId] || []), newMsg],
    }));

    setInputText('');
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);

    // 2. Simulate Firestore network write (sent)
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: (prev[currentChatId] || []).map((m) =>
          m.id === newMsgId ? { ...m, status: 'sent' } : m
        ),
      }));

      // Trigger Cloud Function FCM logic!
      onTriggerFCM(newMsg, activeChatPeer);
    }, 400);

    // 3. Simulate delivered status
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [currentChatId]: (prev[currentChatId] || []).map((m) =>
          m.id === newMsgId ? { ...m, status: 'delivered' } : m
        ),
      }));
    }, 1200);

    // 4. If recipient is online and active in chat, mark read
    if (activeChatPeer.isOnline && activeChatPeer.activeChatId === currentChatId) {
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [currentChatId]: (prev[currentChatId] || []).map((m) =>
            m.id === newMsgId ? { ...m, status: 'read' } : m
          ),
        }));
      }, 2200);
    }
  };

  const handleSimulatePeerReply = () => {
    setIsPeerTyping(true);
    setTimeout(() => {
      setIsPeerTyping(false);
      sounds.playReceived();

      const replyTexts = [
        "Received the payload! Running on Android 14 high_importance_channel smoothly.",
        "That's awesome! The Firestore stream snapshot updated in less than 20ms.",
        "Check the APK release build terminal, looks like all Gradle dependencies passed.",
        "Got it! Thanks for keeping activeChatId in sync with Firestore presence.",
      ];
      const randomText = replyTexts[Math.floor(Math.random() * replyTexts.length)];

      const peerMsg: Message = {
        id: `peer_${Date.now()}`,
        chatId: currentChatId,
        senderId: activeChatPeer.id,
        receiverId: 'ogkymo_user_1',
        senderName: activeChatPeer.name,
        text: randomText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };

      setMessages((prev) => ({
        ...prev,
        [currentChatId]: [...(prev[currentChatId] || []), peerMsg],
      }));
    }, 2000);
  };

  const handleTogglePeerActiveChat = () => {
    const isCurrentlyActive = activeChatPeer.activeChatId === currentChatId;
    const updatedPeer: UserContact = {
      ...activeChatPeer,
      activeChatId: isCurrentlyActive ? null : currentChatId,
      isOnline: isCurrentlyActive ? false : true,
      lastSeenText: isCurrentlyActive ? 'last seen just now' : 'online',
    };

    setActiveChatPeer(updatedPeer);
    setContacts((prev) => prev.map((c) => (c.id === updatedPeer.id ? updatedPeer : c)));
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages((prev) => ({
      ...prev,
      [currentChatId]: (prev[currentChatId] || []).map((m) =>
        m.id === msgId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m
      ),
    }));
    setActiveReactionMsgId(null);
  };

  const handleFinishVoiceRecord = () => {
    setIsRecordingVoice(false);
    const secs = recordingSeconds || 3;
    const durationStr = `0:${secs < 10 ? '0' : ''}${secs}`;
    handleSendMessage('Voice note', 'voice', durationStr);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-[#111B21] text-gray-100 overflow-hidden select-none font-sans">
      {/* LEFT PANEL: CONTACTS & CHATS LIST */}
      <div
        className={`w-full md:w-[380px] lg:w-[420px] flex-shrink-0 flex flex-col border-r border-[#222E35] bg-[#111B21] ${
          mobileViewChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header Bar */}
        <div className="h-16 bg-[#202C33] px-4 flex items-center justify-between border-b border-[#222E35]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white shadow">
                K
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#202C33] rounded-full"></span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#E9EDEF] flex items-center gap-1.5">
                Kymo Chat
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-1.5 py-0.5 rounded">
                  v1.0.0
                </span>
              </h2>
              <p className="text-[11px] text-[#8696A0]">ogkymo@gmail.com</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[#AEBAC1]">
            <button
              onClick={() => setActiveTab('chats')}
              title="Chats"
              className={`p-2 rounded-full hover:bg-[#374248] transition ${
                activeTab === 'chats' ? 'text-emerald-400' : ''
              }`}
            >
              <Radio className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveTab('status')}
              title="Status"
              className={`p-2 rounded-full hover:bg-[#374248] transition ${
                activeTab === 'status' ? 'text-emerald-400' : ''
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              title="Menu"
              className="p-2 rounded-full hover:bg-[#374248] transition"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (WhatsApp Android Tabs) */}
        <div className="bg-[#202C33] flex border-b border-[#222E35] text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'chats'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#8696A0] hover:text-[#D1D7DB]'
            }`}
          >
            Chats ({contacts.length})
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'status'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#8696A0] hover:text-[#D1D7DB]'
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'calls'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#8696A0] hover:text-[#D1D7DB]'
            }`}
          >
            Calls
          </button>
        </div>

        {/* Search Field */}
        <div className="p-2.5 bg-[#111B21]">
          <div className="flex items-center gap-2 bg-[#202C33] px-3 py-1.5 rounded-lg text-sm text-[#D1D7DB]">
            <Search className="w-4 h-4 text-[#8696A0]" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm placeholder-[#8696A0]"
            />
          </div>
        </div>

        {/* Contacts / Chats Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#222E35]/40">
          {activeTab === 'chats' &&
            filteredContacts.map((contact) => {
              const cid = getChatId(contact.id);
              const threadMsgs = messages[cid] || [];
              const lastMsg = threadMsgs[threadMsgs.length - 1];
              const isSelected = activeChatPeer.id === contact.id;

              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setActiveChatPeer(contact);
                    setMobileViewChat(true);
                  }}
                  className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition ${
                    isSelected ? 'bg-[#2A3942]' : 'hover:bg-[#202C33]/70'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={contact.avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#374248]"
                    />
                    {contact.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111B21] rounded-full"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-[#E9EDEF] truncate">
                        {contact.name}
                      </h4>
                      <span className="text-[11px] text-[#8696A0]">
                        {lastMsg ? lastMsg.timestamp : '10:00 AM'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#8696A0]">
                      <p className="truncate flex items-center gap-1">
                        {lastMsg && lastMsg.senderId === 'ogkymo_user_1' && (
                          <CheckCheck className="w-3.5 h-3.5 text-sky-400 inline flex-shrink-0" />
                        )}
                        <span className="truncate">
                          {lastMsg ? lastMsg.text : contact.about}
                        </span>
                      </p>
                      {contact.activeChatId && (
                        <span
                          title="Recipient currently in this chat (Cloud Function skips push)"
                          className="flex-shrink-0 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono"
                        >
                          In-Chat
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          {activeTab === 'status' && (
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-500 p-0.5">
                    <div className="w-full h-full bg-emerald-700 rounded-full flex items-center justify-center font-bold text-white text-sm">
                      K
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#E9EDEF]">My Status</h4>
                  <p className="text-xs text-[#8696A0]">Kymo Chat v1.0.0 active</p>
                </div>
              </div>

              <div className="border-t border-[#222E35] pt-3">
                <span className="text-xs font-semibold text-[#8696A0] uppercase">Recent Updates</span>
                <div className="mt-2.5 p-3 rounded-lg bg-[#202C33] border border-[#222E35] text-xs space-y-1">
                  <p className="font-semibold text-emerald-400">📱 Flutter 3.24 Engine Configured</p>
                  <p className="text-[#8696A0]">
                    FCM background handler pragma('vm:entry-point') validated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calls' && (
            <div className="p-4 space-y-3">
              <div className="text-xs text-[#8696A0] font-semibold uppercase">Recent Calls</div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#202C33]">
                <div className="flex items-center gap-3">
                  <img
                    src={activeChatPeer.avatar}
                    className="w-10 h-10 rounded-full object-cover"
                    alt=""
                  />
                  <div>
                    <h5 className="text-sm text-[#E9EDEF] font-medium">{activeChatPeer.name}</h5>
                    <p className="text-xs text-emerald-400">Incoming call, 10:14 AM</p>
                  </div>
                </div>
                <Phone className="w-4 h-4 text-emerald-400 cursor-pointer" />
              </div>
            </div>
          )}
        </div>

        {/* Presence & Push State Quick Bar */}
        <div className="p-3 bg-[#182229] border-t border-[#222E35] text-[11px] text-[#8696A0] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                activeChatPeer.activeChatId === currentChatId
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`}
            ></span>
            <span>
              {activeChatPeer.name.split(' ')[0]}:{' '}
              {activeChatPeer.activeChatId === currentChatId ? 'Active in Chat' : 'Backgrounded'}
            </span>
          </div>
          <button
            onClick={handleTogglePeerActiveChat}
            className="text-[10px] bg-[#2A3942] hover:bg-[#374248] text-white px-2 py-1 rounded transition"
          >
            Switch State
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: WHATSAPP CHAT CANVAS */}
      <div
        className={`flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden ${
          !mobileViewChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* WHATSAPP APPBAR (#008069 authentic teal) */}
        <div className="h-16 bg-[#008069] text-white px-3 flex items-center justify-between shadow z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileViewChat(false)}
              className="md:hidden p-1.5 hover:bg-black/10 rounded-full text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <img
                src={activeChatPeer.avatar}
                alt={activeChatPeer.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
              {activeChatPeer.isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#008069] rounded-full"></span>
              )}
            </div>
            <div className="leading-tight ml-1">
              <h3 className="text-base font-semibold text-white truncate flex items-center gap-1.5">
                {activeChatPeer.name}
              </h3>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                {isPeerTyping ? (
                  <span className="font-semibold text-emerald-200 animate-pulse">typing...</span>
                ) : (
                  activeChatPeer.lastSeenText
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Peer presence indicator badge */}
            <button
              onClick={handleTogglePeerActiveChat}
              title="Click to toggle peer between Active In Chat and App Backgrounded"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                activeChatPeer.activeChatId === currentChatId
                  ? 'bg-emerald-800/80 text-emerald-100 border border-emerald-400/40'
                  : 'bg-amber-900/60 text-amber-200 border border-amber-400/40'
              }`}
            >
              {activeChatPeer.activeChatId === currentChatId ? (
                <>
                  <BellOff className="w-3.5 h-3.5 text-emerald-300" />
                  <span>In Chat (Push Muted)</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                  <span>Background (FCM Alert)</span>
                </>
              )}
            </button>

            <button
              onClick={() => setActiveCall({ type: 'video', duration: 0 })}
              className="p-2 hover:bg-black/10 rounded-full transition"
              title="Video Call"
            >
              <Video className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveCall({ type: 'voice', duration: 0 })}
              className="p-2 hover:bg-black/10 rounded-full transition"
              title="Voice Call"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 hover:bg-black/10 rounded-full transition"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dropdown Options Menu */}
        {showOptionsMenu && (
          <div className="absolute top-16 right-3 bg-white text-[#111B21] shadow-2xl rounded-lg py-2 w-52 z-30 border border-gray-200 text-sm font-medium">
            <button
              onClick={() => {
                handleSimulatePeerReply();
                setShowOptionsMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
            >
              <span>Simulate Peer Reply</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </button>
            <button
              onClick={() => {
                handleTogglePeerActiveChat();
                setShowOptionsMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Toggle In-Chat Presence
            </button>
            <button
              onClick={() => {
                setMessages((prev) => ({ ...prev, [currentChatId]: [] }));
                setShowOptionsMenu(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
            >
              Clear Messages
            </button>
          </div>
        )}

        {/* CHAT MESSAGES CANVAS (WhatsApp Doodle Wallpaper #EFEAE2) */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 relative"
          style={{
            backgroundImage: `radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), radial-gradient(rgba(0,0,0,0.06) 1px, #EFEAE2 1px)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 10px 10px',
          }}
        >
          {/* WhatsApp End-to-End Encryption Notice Banner */}
          <div className="max-w-md mx-auto my-2 px-3 py-1.5 rounded-lg bg-[#FFEECD] text-[#54656F] shadow-sm border border-amber-200/60 text-center flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-[11px] leading-snug">
              Messages and calls are end-to-end encrypted with Firestore security rules. No one outside of this chat can read or listen to them.
            </p>
          </div>

          {/* Date Separator Pill */}
          <div className="flex justify-center my-2">
            <span className="bg-white/90 shadow-sm border border-gray-200 text-[#54656F] text-[11px] font-semibold uppercase px-3 py-0.5 rounded-full">
              Today
            </span>
          </div>

          {/* Messages List */}
          {currentMessages.map((msg) => {
            const isMe = msg.senderId === 'ogkymo_user_1';

            return (
              <div
                key={msg.id}
                className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'} my-1 relative`}
              >
                {/* Bubble Container */}
                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] px-3.5 pt-2 pb-1.5 shadow-sm text-sm ${
                    isMe
                      ? 'bg-[#D9FDD3] text-[#111B21] rounded-2xl rounded-tr-none'
                      : 'bg-white text-[#111B21] rounded-2xl rounded-tl-none'
                  }`}
                  style={{
                    boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)',
                  }}
                >
                  {/* Sender Name if Group/Peer */}
                  {!isMe && (
                    <p className="text-[12px] font-bold text-emerald-700 mb-0.5">
                      {msg.senderName}
                    </p>
                  )}

                  {/* VOICE NOTE TYPE */}
                  {msg.type === 'voice' ? (
                    <div className="flex items-center gap-3 py-1 min-w-[220px]">
                      <button
                        onClick={() => {
                          if (playingVoiceId === msg.id) {
                            setPlayingVoiceId(null);
                          } else {
                            setPlayingVoiceId(msg.id);
                            setTimeout(() => setPlayingVoiceId(null), 4000);
                          }
                        }}
                        className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow hover:bg-emerald-700 transition flex-shrink-0"
                      >
                        {playingVoiceId === msg.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>

                      {/* Equalizer Waveform Bars */}
                      <div className="flex-1 flex items-center gap-0.5 h-6">
                        {[16, 24, 12, 28, 18, 22, 10, 26, 14, 20, 30, 16, 22, 14, 26].map(
                          (h, idx) => (
                            <span
                              key={idx}
                              className={`w-1 rounded-full transition-all ${
                                playingVoiceId === msg.id && idx % 3 === 0
                                  ? 'bg-emerald-600 animate-pulse'
                                  : 'bg-gray-400'
                              }`}
                              style={{ height: `${h}px` }}
                            ></span>
                          )
                        )}
                      </div>

                      <span className="text-[11px] text-[#667781] font-mono">
                        {msg.voiceDuration || '0:14'}
                      </span>
                    </div>
                  ) : (
                    /* REGULAR TEXT */
                    <p className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}

                  {/* Bubble Footer: Timestamp & Delivery Checkmarks */}
                  <div className="flex items-center justify-end gap-1 mt-0.5 float-right ml-3">
                    <span className="text-[11px] text-[#667781]">{msg.timestamp}</span>
                    {isMe && (
                      <span className="inline-flex">
                        {msg.status === 'pending' && (
                          <Clock className="w-3 h-3 text-[#8696A0]" />
                        )}
                        {msg.status === 'sent' && (
                          <Check className="w-3.5 h-3.5 text-[#8696A0]" />
                        )}
                        {msg.status === 'delivered' && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#8696A0]" />
                        )}
                        {msg.status === 'read' && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53BDEB]" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Emoji Reaction Pill */}
                  {msg.reaction && (
                    <div
                      className={`absolute -bottom-2.5 ${
                        isMe ? 'right-2' : 'left-2'
                      } bg-white shadow border border-gray-200 rounded-full px-1.5 py-0.5 text-xs flex items-center gap-0.5 cursor-pointer hover:scale-110 transition`}
                      onClick={() => handleAddReaction(msg.id, msg.reaction!)}
                    >
                      <span>{msg.reaction}</span>
                    </div>
                  )}

                  {/* Reaction Button on Hover */}
                  <div
                    className={`absolute top-0 ${
                      isMe ? '-left-10' : '-right-10'
                    } hidden group-hover:flex items-center bg-white shadow rounded-full p-1 border border-gray-200 z-10 cursor-pointer`}
                    onClick={() =>
                      setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                    }
                  >
                    <Smile className="w-4 h-4 text-gray-500 hover:text-emerald-600" />
                  </div>

                  {/* Reaction Popup Bar */}
                  {activeReactionMsgId === msg.id && (
                    <div
                      className={`absolute -top-10 ${
                        isMe ? 'right-0' : 'left-0'
                      } bg-white shadow-xl rounded-full px-2 py-1 flex items-center gap-1.5 border border-gray-200 z-20 animate-in fade-in`}
                    >
                      {['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className="hover:scale-125 transition text-base p-1"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isPeerTyping && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl rounded-tl-none shadow-sm w-28 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ATTACHMENT MENU POPUP */}
        {showAttachmentMenu && (
          <div className="absolute bottom-20 left-4 sm:left-6 bg-white shadow-2xl rounded-2xl p-4 grid grid-cols-3 gap-4 z-30 border border-gray-200 animate-in slide-in-from-bottom-3">
            <button
              onClick={() => {
                handleSendMessage('Sent document: kymo_chat_spec.pdf');
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center gap-1 text-xs text-gray-700 hover:opacity-80"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow">
                <FileText className="w-6 h-6" />
              </div>
              <span>Document</span>
            </button>
            <button
              onClick={() => {
                handleSendMessage('Shared photo screenshot');
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center gap-1 text-xs text-gray-700 hover:opacity-80"
            >
              <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center shadow">
                <ImageIcon className="w-6 h-6" />
              </div>
              <span>Gallery</span>
            </button>
            <button
              onClick={() => {
                handleSendMessage('Sent contact: Alex Rivera');
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center gap-1 text-xs text-gray-700 hover:opacity-80"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow">
                <User className="w-6 h-6" />
              </div>
              <span>Contact</span>
            </button>
            <button
              onClick={() => {
                handleSendMessage('Location: Google AI Studio Workspace');
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center gap-1 text-xs text-gray-700 hover:opacity-80"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center shadow">
                <MapPin className="w-6 h-6" />
              </div>
              <span>Location</span>
            </button>
            <button
              onClick={() => {
                handleSendMessage('Poll: Ready to build release APK? [Yes/No]');
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center gap-1 text-xs text-gray-700 hover:opacity-80"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow">
                <BarChart2 className="w-6 h-6" />
              </div>
              <span>Poll</span>
            </button>
          </div>
        )}

        {/* EMOJI PICKER POPUP */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 sm:left-6 bg-white shadow-2xl rounded-xl p-3 border border-gray-200 z-30 w-72">
            <div className="text-xs font-semibold text-gray-500 mb-2">Emojis</div>
            <div className="grid grid-cols-6 gap-2 text-xl">
              {[
                '😀', '😂', '😍', '🔥', '👍', '🙏',
                '🎉', '🚀', '❤️', '😎', '🥳', '💯',
                '🤝', '✨', '⚡', '💻', '📱', '🔒',
              ].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                  }}
                  className="hover:scale-125 transition p-1 text-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FLOATING WHATSAPP INPUT BAR (as in the Flutter WhatsAppChatScreen) */}
        <div className="p-2 sm:p-3 bg-transparent">
          <div className="flex items-center gap-2">
            {/* White Rounded Input Capsule */}
            <div className="flex-1 bg-white rounded-full flex items-center px-2 py-1 shadow-md border border-gray-200/80">
              {isRecordingVoice ? (
                /* Voice Recording Mode */
                <div className="flex-1 flex items-center justify-between px-3 py-1.5 text-sm text-red-600">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                    <span className="font-semibold">
                      Recording 0:{recordingSeconds < 10 ? '0' : ''}
                      {recordingSeconds}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsRecordingVoice(false)}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                /* Regular Text Input Mode */
                <>
                  <button
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAttachmentMenu(false);
                    }}
                    className="p-2 text-[#54656F] hover:text-emerald-700 transition"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Message"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-[#111B21] text-[15px] px-2 placeholder-[#8696A0]"
                  />
                  <button
                    onClick={() => {
                      setShowAttachmentMenu(!showAttachmentMenu);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 text-[#54656F] hover:text-emerald-700 transition"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  {!inputText && (
                    <button
                      onClick={() => handleSendMessage('Sent photo with Camera')}
                      className="p-2 text-[#54656F] hover:text-emerald-700 transition"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Circular Floating Action Button (#008069) */}
            <button
              onClick={() => {
                if (isRecordingVoice) {
                  handleFinishVoiceRecord();
                } else if (inputText.trim()) {
                  handleSendMessage();
                } else {
                  setIsRecordingVoice(true);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition active:scale-95 flex-shrink-0 ${
                isRecordingVoice
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#008069] hover:bg-[#00705c]'
              }`}
              title={
                isRecordingVoice
                  ? 'Send Voice Note'
                  : inputText.trim()
                  ? 'Send Message'
                  : 'Hold or Click to Record'
              }
            >
              {isRecordingVoice ? (
                <Check className="w-5 h-5" />
              ) : inputText.trim() ? (
                <Send className="w-5 h-5 ml-0.5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Simulation Testing Tray */}
          <div className="mt-2 flex items-center justify-between text-xs px-2 text-[#667781]">
            <div className="flex items-center gap-1.5">
              <span>Quick tests:</span>
              <button
                onClick={handleSimulatePeerReply}
                disabled={isPeerTyping}
                className="bg-white/80 hover:bg-white text-emerald-800 border border-emerald-300/60 px-2 py-0.5 rounded shadow-xs transition"
              >
                Peer Reply
              </button>
              <button
                onClick={() => handleSendMessage('🚀 Ready to build APK for com.kymo.chat')}
                className="hidden sm:inline-block bg-white/80 hover:bg-white text-gray-700 border border-gray-300/80 px-2 py-0.5 rounded shadow-xs transition"
              >
                Send Build Msg
              </button>
            </div>
            <span className="hidden sm:inline text-[11px] text-gray-500 font-mono">
              chats/{currentChatId}/messages
            </span>
          </div>
        </div>

        {/* CALL OVERLAY MODAL */}
        {activeCall && (
          <div className="absolute inset-0 bg-[#111B21]/95 z-50 flex flex-col items-center justify-between p-8 text-white animate-in fade-in">
            <div className="text-center mt-8">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Kymo Chat {activeCall.type === 'video' ? 'Video' : 'Voice'} Call
              </span>
              <h3 className="text-2xl font-bold mt-2">{activeChatPeer.name}</h3>
              <p className="text-sm text-gray-400 mt-1">
                {callTimer === 0 ? 'Calling...' : `00:${callTimer < 10 ? '0' : ''}${callTimer}`}
              </p>
            </div>

            <div className="relative">
              <img
                src={activeChatPeer.avatar}
                alt=""
                className="w-32 h-32 rounded-full object-cover border-4 border-emerald-500 shadow-2xl"
              />
              <span className="absolute inset-0 rounded-full border-4 border-emerald-400/40 animate-ping"></span>
            </div>

            <div className="flex items-center gap-6 mb-8">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg ${
                  isMuted ? 'bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <button
                onClick={() => setActiveCall(null)}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-2xl transition hover:scale-105"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
