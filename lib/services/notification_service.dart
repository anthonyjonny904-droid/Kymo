import 'dart:io';
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
  print("Handling background message: ${message.messageId}");
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
    print('User granted notification permission: ${settings.authorizationStatus}');

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

    // Listen for token refreshes
    _fcm.onTokenRefresh.listen((newToken) {
      _saveTokenToFirestore(currentUserId, newToken);
    });

    // 5. FOREGROUND: If app is open, show local notification banner
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
      print('Navigate to chat room: $chatId');
    }
  }
}
