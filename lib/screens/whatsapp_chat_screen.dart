import 'package:flutter/material.dart';
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

  static const Color whatsAppTeal = Color(0xFF008069);
  static const Color whatsAppIvory = Color(0xFFEFEAE2);
  static const Color whatsAppDarkText = Color(0xFF111B21);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
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
      body: Stack(
        children: [
          Column(
            children: [
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
              Expanded(
                child: StreamBuilder<QuerySnapshot<Map<String, dynamic>>>(
                  stream: _chatService.getMessagesStream(widget.chatId),
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return Center(child: Text('Error: ${snapshot.error}'));
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
                      reverse: true,
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
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.only(left: 6, right: 6, bottom: 8, top: 4),
                  child: Row(
                    children: [
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
                                onPressed: () {},
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
                                onPressed: () {},
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
                      GestureDetector(
                        onTap: () {
                          if (_hasText) {
                            _sendMessage();
                          }
                        },
                        child: Container(
                          height: 48,
                          width: 48,
                          decoration: const BoxDecoration(
                            color: whatsAppTeal,
                            shape: BoxShape.circle,
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
