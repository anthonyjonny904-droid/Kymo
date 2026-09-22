import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/notification_service.dart';
import 'screens/whatsapp_chat_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();

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
