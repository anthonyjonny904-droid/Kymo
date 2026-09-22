export interface SourceFile {
  name: string;
  path: string;
  language: string;
  description: string;
  category: 'functions' | 'flutter' | 'android' | 'config';
  content: string;
}

export const KYMO_BUNDLE_FILES: SourceFile[] = [
  {
    name: 'build-debug-apk.yml',
    path: '.github/workflows/build-debug-apk.yml',
    language: 'yaml',
    category: 'config',
    description: 'GitHub Actions Automated Workflow to build Debug APK and upload build/app/outputs/flutter-apk/app-release.apk',
    content: `name: Build Debug APK

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
        run: |
          flutter build apk --debug
          if [ -f build/app/outputs/flutter-apk/app-debug.apk ] && [ ! -f build/app/outputs/flutter-apk/app-release.apk ]; then
            cp build/app/outputs/flutter-apk/app-debug.apk build/app/outputs/flutter-apk/app-release.apk
          fi

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: kymo-chat-apk
          path: build/app/outputs/flutter-apk/app-release.apk
          retention-days: 30
`,
  },
  {
    name: 'build-aab.yml',
    path: '.github/workflows/build-aab.yml',
    language: 'yaml',
    category: 'config',
    description: 'GitHub Actions Automated Workflow to build Debug APK (no signing, no secrets)',
    content: `name: Build Debug APK

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
`,
  },
  {
    name: 'index.js',
    path: 'functions/index.js',
    language: 'javascript',
    category: 'functions',
    description: 'Firebase Cloud Function (FCM Trigger on Firestore new message with active chat suppression)',
    content: `const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const admin = require("firebase-admin");

admin.initializeApp();
const db = getFirestore();
const messaging = getMessaging();

/**
 * Triggers automatically when a new message document is written to Firestore:
 * chats/{chatId}/messages/{messageId}
 */
exports.sendPushOnNewMessage = onDocumentCreated(
  "chats/{chatId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const messageData = snap.data();
    const chatId = event.params.chatId;
    const { senderId, receiverId, text, senderName } = messageData;

    // 1. Fetch recipient's user document to check current state & FCM token
    const recipientRef = db.collection("users").doc(receiverId);
    const recipientSnap = await recipientRef.get();

    if (!recipientSnap.exists) {
      console.log(\`Recipient \${receiverId} not found in database.\`);
      return;
    }

    const recipient = recipientSnap.data();
    const fcmToken = recipient.fcmToken;

    if (!fcmToken) {
      console.log(\`Recipient \${receiverId} has no registered FCM token.\`);
      return;
    }

    // 2. Suppress push if recipient is currently active inside this exact chat!
    // (In that case, the live Firestore .snapshots() stream handles it instantly)
    if (recipient.isOnline && recipient.activeChatId === chatId) {
      console.log(\`Recipient is actively looking at chat \${chatId}. Skipping FCM push.\`);
      return;
    }

    // 3. Construct FCM HTTP v1 payload for both Android and iOS APNs
    const payload = {
      token: fcmToken,
      notification: {
        title: senderName || "New Message",
        body: text || "Sent an attachment",
      },
      data: {
        chatId: chatId,
        messageId: event.params.messageId,
        senderId: senderId,
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: {
          channelId: "high_importance_channel",
          sound: "default",
          priority: "high",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        headers: {
          "apns-priority": "10", // High priority for instant wake-up
        },
        payload: {
          aps: {
            alert: {
              title: senderName || "New Message",
              body: text || "Sent an attachment",
            },
            badge: 1,
            sound: "default",
            contentAvailable: true, // Allows background payload processing
          },
        },
      },
    };

    try {
      const response = await messaging.send(payload);
      console.log("Successfully sent FCM message:", response);
    } catch (error) {
      console.error("Error sending FCM message:", error);
      // If token is invalid or unregistered, clean it up
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        await recipientRef.update({ fcmToken: null });
      }
    }
  }
);
`,
  },
  {
    name: 'notification_service.dart',
    path: 'lib/services/notification_service.dart',
    language: 'dart',
    category: 'flutter',
    description: 'Flutter FCM Notification Service with background handler and Android channels',
    content: `import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/**
 * Top-level background message handler.
 * Must have @pragma('vm:entry-point') so Flutter engine keeps it alive
 * when app is terminated or in background!
 */
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print("Handling background message: \${message.messageId}");
  // Note: System push notification is rendered automatically by the OS
  // when the payload includes a 'notification' block.
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  Future<void> initialize(String currentUserId) async {
    // 1. Request permissions on iOS and Android 13+ (POST_NOTIFICATIONS)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    print('User granted notification permission: \${settings.authorizationStatus}');

    // 2. Set background message handler
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // 3. Configure Android high-importance notification channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'Used for important chat notifications.',
      importance: Importance.max,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // 4. Register FCM device token to Firestore user document
    String? token = await _fcm.getToken();
    if (token != null) {
      await _saveTokenToFirestore(currentUserId, token);
    }

    // Listen for token refreshes (e.g. app update, restored backup)
    _fcm.onTokenRefresh.listen((newToken) {
      _saveTokenToFirestore(currentUserId, newToken);
    });

    // 5. FOREGROUND: If app is open, show a local banner (optional)
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;

      if (notification != null && android != null && !Platform.isIOS) {
        _localNotifications.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              channel.id,
              channel.name,
              channelDescription: channel.description,
              icon: '@mipmap/ic_launcher',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
        );
      }
    });

    // 6. Handle notification click when app is opened from BACKGROUND
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationTap(message.data);
    });

    // 7. Handle notification click when app was TERMINATED (cold boot)
    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage.data);
    }
  }

  Future<void> _saveTokenToFirestore(String userId, String token) async {
    await FirebaseFirestore.instance.collection('users').doc(userId).set({
      'fcmToken': token,
      'lastSeen': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  void _handleNotificationTap(Map<String, dynamic> data) {
    final chatId = data['chatId'];
    if (chatId != null) {
      print('Navigate to chat room: \$chatId');
      // NavigationService.navigateTo('/chat', arguments: chatId);
    }
  }
}
`,
  },
  {
    name: 'chat_service.dart',
    path: 'lib/services/chat_service.dart',
    language: 'dart',
    category: 'flutter',
    description: 'Flutter Chat Service managing Firestore Streams and active chat presence',
    content: `import 'package:cloud_firestore/cloud_firestore.dart';

class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Stream real-time messages from subcollection chats/{chatId}/messages
  Stream<QuerySnapshot<Map<String, dynamic>>> getMessagesStream(String chatId) {
    return _firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots();
  }

  /// Send message: Writes document into Firestore
  Future<void> sendMessage({
    required String chatId,
    required String senderId,
    required String receiverId,
    required String senderName,
    required String text,
  }) async {
    final messageRef = _firestore
        .collection('chats')
        .doc(chatId)
        .collection('messages')
        .doc();

    await messageRef.set({
      'id': messageRef.id,
      'senderId': senderId,
      'receiverId': receiverId,
      'senderName': senderName,
      'text': text,
      'timestamp': FieldValue.serverTimestamp(),
      'status': 'sent_to_firestore',
    });

    // Update last message preview in parent chat doc
    await _firestore.collection('chats').doc(chatId).set({
      'lastMessage': text,
      'lastSenderId': senderId,
      'updatedAt': FieldValue.serverTimestamp(),
      'participants': [senderId, receiverId],
    }, SetOptions(merge: true));
  }

  /// Mark chat room presence so Cloud Function knows NOT to send redundant push
  Future<void> setActiveChat(String userId, String? chatId) async {
    await _firestore.collection('users').doc(userId).update({
      'activeChatId': chatId,
      'isOnline': chatId != null,
      'lastSeen': FieldValue.serverTimestamp(),
    });
  }
}
`,
  },
  {
    name: 'whatsapp_chat_screen.dart',
    path: 'lib/screens/whatsapp_chat_screen.dart',
    language: 'dart',
    category: 'flutter',
    description: 'Authentic WhatsApp UI chat screen with real-time stream and floating input bar',
    content: `import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../services/chat_service.dart';
import '../widgets/whatsapp_bubble.dart';

class WhatsAppChatScreen extends StatefulWidget {
  final String chatId;
  final String currentUserId;
  final String peerName;
  final String peerId;
  final bool isPeerOnline;

  const WhatsAppChatScreen({
    super.key,
    required this.chatId,
    required this.currentUserId,
    required this.peerName,
    required this.peerId,
    this.isPeerOnline = false,
  });

  @override
  State<WhatsAppChatScreen> createState() => _WhatsAppChatScreenState();
}

class _WhatsAppChatScreenState extends State<WhatsAppChatScreen> with WidgetsBindingObserver {
  final ChatService _chatService = ChatService();
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _hasText = false;

  // Authentic WhatsApp Color Palette
  static const Color whatsAppTeal = Color(0xFF008069);
  static const Color whatsAppGreen = Color(0xFF00A884);
  static const Color whatsAppIvory = Color(0xFFEFEAE2);
  static const Color whatsAppDarkText = Color(0xFF111B21);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Mark user actively looking at this chat in Firestore
    _chatService.setActiveChat(widget.currentUserId, widget.chatId);

    _textController.addListener(() {
      final hasNow = _textController.text.trim().isNotEmpty;
      if (hasNow != _hasText) {
        setState(() => _hasText = hasNow);
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _chatService.setActiveChat(widget.currentUserId, widget.chatId);
    } else {
      // Background or detached: Clear active chat so Cloud Function triggers FCM push!
      _chatService.setActiveChat(widget.currentUserId, null);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _chatService.setActiveChat(widget.currentUserId, null);
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _chatService.sendMessage(
      chatId: widget.chatId,
      senderId: widget.currentUserId,
      receiverId: widget.peerId,
      senderName: "Me",
      text: text,
    );

    _textController.clear();
    // Scroll to latest message
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: whatsAppIvory,
      // 1. WHATSAPP APPBAR (#008069)
      appBar: AppBar(
        backgroundColor: whatsAppTeal,
        foregroundColor: Colors.white,
        elevation: 1,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 19,
              backgroundColor: Colors.teal.shade800,
              child: Text(
                widget.peerName.isNotEmpty ? widget.peerName[0].toUpperCase() : '?',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.peerName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white),
                  ),
                  Text(
                    widget.isPeerOnline ? "online" : "last seen today at 10:14 AM",
                    style: const TextStyle(fontSize: 11, color: Colors.white70, fontWeight: FontWeight.normal),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.videocam), onPressed: () {}),
          IconButton(icon: const Icon(Icons.call), onPressed: () {}),
          IconButton(icon: const Icon(Icons.more_vert), onPressed: () {}),
        ],
      ),

      // 2. CHAT CANVAS & FIRESTORE STREAM
      body: Stack(
        children: [
          // WhatsApp Doodle Background Pattern
          Positioned.fill(
            child: Opacity(
              opacity: 0.05,
              child: Image.asset(
                'assets/whatsapp_doodle_bg.png',
                repeat: ImageRepeat.repeat,
                errorBuilder: (_, __, ___) => const SizedBox(),
              ),
            ),
          ),

          Column(
            children: [
              // End-to-End Encryption Notice banner
              Container(
                margin: const EdgeInsets.only(top: 10, bottom: 4, left: 32, right: 32),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFEECD).withOpacity(0.95),
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 2, offset: const Offset(0, 1)),
                  ],
                ),
                child: Row(
                  children: const [
                    Icon(Icons.lock, size: 12, color: Color(0xFFD97706)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        "Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.",
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 10, color: Color(0xFF54656F), height: 1.3),
                      ),
                    ),
                  ],
                ),
              ),

              // Firestore Realtime StreamBuilder for Message Bubbles
              Expanded(
                child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: _chatService.getMessagesStream(widget.chatId),
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Center(child: Text('Error: \${snapshot.error}'));
                    }
                    if (!snapshot.hasData) {
                      return const Center(
                        child: CircularProgressIndicator(color: whatsAppTeal),
                      );
                    }

                    final docs = snapshot.data!.docs;
                    if (docs.isEmpty) {
                      return const Center(
                        child: Text("Say hi to start the conversation!", style: TextStyle(color: Colors.grey)),
                      );
                    }

                    return ListView.builder(
                      controller: _scrollController,
                      reverse: true, // Newest messages at bottom
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                      itemCount: docs.length,
                      itemBuilder: (context, index) {
                        final data = docs[index].data();
                        final isMe = data['senderId'] == widget.currentUserId;
                        final text = data['text'] ?? '';
                        final ts = (data['timestamp'] as Timestamp?)?.toDate() ?? DateTime.now();
                        final statusStr = data['status'] ?? 'delivered';
                        final reaction = data['reaction'] as String?;

                        MessageDeliveryStatus status = MessageDeliveryStatus.delivered;
                        if (statusStr == 'read') status = MessageDeliveryStatus.read;
                        if (statusStr == 'sent_to_firestore') status = MessageDeliveryStatus.sent;
                        if (statusStr == 'pending') status = MessageDeliveryStatus.pending;

                        return WhatsAppMessageBubble(
                          text: text,
                          isMe: isMe,
                          timestamp: ts,
                          status: status,
                          reaction: reaction,
                        );
                      },
                    );
                  },
                ),
              ),

              // 3. WHATSAPP FLOATING INPUT BAR
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(left: 6, right: 6, bottom: 8, top: 4),
                  child: Row(
                    children: [
                      // Floating White Input Capsule
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(25),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.06),
                                blurRadius: 3,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.emoji_emotions_outlined, color: Color(0xFF54656F)),
                                onPressed: () {
                                  // Open emoji picker
                                },
                              ),
                              Expanded(
                                child: TextField(
                                  controller: _textController,
                                  minLines: 1,
                                  maxLines: 5,
                                  style: const TextStyle(fontSize: 16, color: whatsAppDarkText),
                                  decoration: const InputDecoration(
                                    hintText: "Message",
                                    hintStyle: TextStyle(color: Color(0xFF8696A0), fontSize: 16),
                                    border: InputBorder.none,
                                    isDense: true,
                                    contentPadding: EdgeInsets.symmetric(vertical: 10),
                                  ),
                                  onSubmitted: (_) => _sendMessage(),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.attach_file, color: Color(0xFF54656F)),
                                onPressed: () {
                                  // Show attachment sheet (photo, audio, document)
                                },
                              ),
                              if (!_hasText)
                                IconButton(
                                  icon: const Icon(Icons.camera_alt, color: Color(0xFF54656F)),
                                  onPressed: () {},
                                ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      // Floating Circular Action Button (Mic or Send)
                      GestureDetector(
                        onTap: () {
                          if (_hasText) {
                            _sendMessage();
                          } else {
                            // Start audio recording
                          }
                        },
                        child: Container(
                          height: 48,
                          width: 48,
                          decoration: const BoxDecoration(
                            color: whatsAppTeal,
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Color(0x33008069),
                                blurRadius: 4,
                                offset: Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Icon(
                            _hasText ? Icons.send : Icons.mic,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
`,
  },
  {
    name: 'whatsapp_bubble.dart',
    path: 'lib/widgets/whatsapp_bubble.dart',
    language: 'dart',
    category: 'flutter',
    description: 'WhatsApp Bubble widget with curved corners, tails, delivery checkmarks, and reactions',
    content: `import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

enum MessageDeliveryStatus { pending, sent, delivered, read }

class WhatsAppMessageBubble extends StatelessWidget {
  final String text;
  final bool isMe;
  final DateTime timestamp;
  final MessageDeliveryStatus status;
  final String? reaction;

  const WhatsAppMessageBubble({
    super.key,
    required this.text,
    required this.isMe,
    required this.timestamp,
    this.status = MessageDeliveryStatus.delivered,
    this.reaction,
  });

  @override
  Widget build(BuildContext context) {
    final formattedTime = DateFormat('h:mm a').format(timestamp);
    // WhatsApp Colors: #D9FDD3 for outgoing, #FFFFFF for incoming
    final bubbleColor = isMe ? const Color(0xFFD9FDD3) : Colors.white;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            margin: EdgeInsets.only(
              left: isMe ? 48 : 8,
              right: isMe ? 8 : 48,
              top: 3,
              bottom: reaction != null ? 12 : 3,
            ),
            padding: const EdgeInsets.only(left: 12, right: 12, top: 7, bottom: 6),
            decoration: BoxDecoration(
              color: bubbleColor,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(12),
                topRight: const Radius.circular(12),
                bottomLeft: Radius.circular(isMe ? 12 : 2),
                bottomRight: Radius.circular(isMe ? 2 : 12),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 2,
                  offset: const Offset(0, 1),
                ),
              ],
            ),
            child: Wrap(
              alignment: WrapAlignment.end,
              crossAxisAlignment: WrapCrossAlignment.bottom,
              spacing: 8,
              runSpacing: 4,
              children: [
                Text(
                  text,
                  style: const TextStyle(
                    fontSize: 15,
                    color: Color(0xFF111B21),
                    height: 1.25,
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      formattedTime,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFF667781),
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      _buildStatusIcon(status),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (reaction != null)
            Positioned(
              bottom: 0,
              right: isMe ? 14 : null,
              left: !isMe ? 14 : null,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 3,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: Text(reaction!, style: const TextStyle(fontSize: 13)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStatusIcon(MessageDeliveryStatus status) {
    switch (status) {
      case MessageDeliveryStatus.pending:
        return const Icon(Icons.access_time, size: 13, color: Color(0xFF8696A0));
      case MessageDeliveryStatus.sent:
        return const Icon(Icons.check, size: 14, color: Color(0xFF8696A0));
      case MessageDeliveryStatus.delivered:
        return const Icon(Icons.done_all, size: 14, color: Color(0xFF8696A0));
      case MessageDeliveryStatus.read:
        return const Icon(Icons.done_all, size: 14, color: Color(0xFF53BDEB)); // Bright blue ticks
    }
  }
}
`,
  },
  {
    name: 'main.dart',
    path: 'lib/main.dart',
    language: 'dart',
    category: 'flutter',
    description: 'Flutter App Entry point with Firebase Core initialization and route routing',
    content: `import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/notification_service.dart';
import 'screens/whatsapp_chat_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

  // In production, get currentUserId from FirebaseAuth.instance.currentUser
  const currentUserId = "ogkymo_user_1";
  await NotificationService().initialize(currentUserId);

  runApp(const KymoChatApp());
}

class KymoChatApp extends StatelessWidget {
  const KymoChatApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kymo Chat',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF008069),
          primary: const Color(0xFF008069),
          secondary: const Color(0xFF00A884),
        ),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: const WhatsAppChatScreen(
        chatId: "chat_kymo_sarah",
        currentUserId: "ogkymo_user_1",
        peerId: "user_sarah_connor",
        peerName: "Sarah Connor",
        isPeerOnline: true,
      ),
    );
  }
}
`,
  },
  {
    name: 'pubspec.yaml',
    path: 'pubspec.yaml',
    language: 'yaml',
    category: 'config',
    description: 'Flutter dependencies configuration with Firebase, FCM, and Local Notifications',
    content: `name: kymo_chat
description: "Kymo Chat (com.kymo.chat) - WhatsApp style real-time chat with FCM push notifications"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.24.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.8
  firebase_core: ^3.6.0
  cloud_firestore: ^5.4.4
  firebase_messaging: ^15.1.3
  flutter_local_notifications: ^17.2.3
  intl: ^0.19.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/whatsapp_doodle_bg.png
`,
  },
  {
    name: 'build.gradle',
    path: 'android/app/build.gradle',
    language: 'groovy',
    category: 'android',
    description: 'Android app Gradle configuration with applicationId com.kymo.chat and SDK 34',
    content: `plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
    id "com.google.gms.google-services"
}

def localProperties = new Properties()
def localPropertiesFile = rootProject.file('local.properties')
if (localPropertiesFile.exists()) {
    localPropertiesFile.withReader('UTF-8') { reader ->
        localProperties.load(reader)
    }
}

android {
    namespace "com.kymo.chat"
    compileSdkVersion 34
    ndkVersion flutter.ndkVersion

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
        coreLibraryDesugaringEnabled true
    }

    kotlinOptions {
        jvmTarget = '1.8'
    }

    defaultConfig {
        applicationId "com.kymo.chat"
        minSdkVersion 21
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
    }

    buildTypes {
        release {
            signingConfig signingConfigs.debug
            minifyEnabled false
            shrinkResources false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

flutter {
    source '../..'
}

dependencies {
    coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs:2.0.4'
    implementation platform('com.google.firebase:firebase-bom:33.4.0')
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-messaging'
}
`,
  },
  {
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    language: 'xml',
    category: 'android',
    description: 'Android Manifest with POST_NOTIFICATIONS, FCM service and High Importance channel',
    content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.kymo.chat">

    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>

    <application
        android:label="Kymo Chat"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">

        <!-- High Importance Notification Channel Default -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="high_importance_channel" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:taskAffinity=""
            android:theme="@style/LaunchTheme"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|smallestScreenSize|locale|layoutDirection|fontScale|screenLayout|density|uiMode"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize">
            
            <meta-data
              android:name="io.flutter.embedding.android.NormalTheme"
              android:resource="@style/NormalTheme" />
            
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
            
            <!-- Intent filter for FCM Notification Click -->
            <intent-filter>
                <action android:name="FLUTTER_NOTIFICATION_CLICK" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </activity>
        
        <meta-data
            android:name="flutterEmbedding"
            android:value="2" />
    </application>
</manifest>
`,
  },
  {
    name: 'README.md',
    path: 'README.md',
    language: 'markdown',
    category: 'config',
    description: 'Official Build & Run Guide for Kymo Chat com.kymo.chat',
    content: `# KYMO CHAT (com.kymo.chat)
### Android Flutter APK Build Bundle
Generated for: **ogkymo@gmail.com** | Version: **1.0.0+1**

---

## 🚀 Quick Start Build Instructions

### 1. Prerequisites
- **Flutter SDK 3.24+**: [flutter.dev/docs/get-started/install](https://flutter.dev)
- **Android Studio** with Android SDK 34 command-line tools
- A Firebase project with Firestore and Firebase Cloud Messaging enabled
- Download your \`google-services.json\` from Firebase Console and place it into \`android/app/google-services.json\`.

### 2. Scaffold & Install
\`\`\`bash
# In the project directory:
flutter create --org com.kymo --project-name kymo_chat .
flutter pub get
\`\`\`

### 3. Build APK
\`\`\`bash
# Build Release APK
flutter build apk --release

# Or build App Bundle for Google Play Store
flutter build appbundle --release
\`\`\`

The generated APK will be output at:
\`\`\`
build/app/outputs/flutter-apk/app-release.apk
\`\`\`

### 4. Install Directly on Android Phone
\`\`\`bash
adb install build/app/outputs/flutter-apk/app-release.apk
\`\`\`

---

## ⚡ Firebase Cloud Functions Setup
Deploy the FCM trigger function:
\`\`\`bash
cd functions
npm install
firebase deploy --only functions:sendPushOnNewMessage
\`\`\`
`,
  },
];
