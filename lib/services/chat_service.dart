import 'package:cloud_firestore/cloud_firestore.dart';

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
