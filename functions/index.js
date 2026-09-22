const { onDocumentCreated } = require("firebase-functions/v2/firestore");
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
      console.log(`Recipient ${receiverId} not found in database.`);
      return;
    }

    const recipient = recipientSnap.data();
    const fcmToken = recipient.fcmToken;

    if (!fcmToken) {
      console.log(`Recipient ${receiverId} has no registered FCM token.`);
      return;
    }

    // 2. Suppress push if recipient is currently active inside this exact chat!
    if (recipient.isOnline && recipient.activeChatId === chatId) {
      console.log(`Recipient is actively looking at chat ${chatId}. Skipping FCM push.`);
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
          "apns-priority": "10",
        },
        payload: {
          aps: {
            alert: {
              title: senderName || "New Message",
              body: text || "Sent an attachment",
            },
            badge: 1,
            sound: "default",
            contentAvailable: true,
          },
        },
      },
    };

    try {
      const response = await messaging.send(payload);
      console.log("Successfully sent FCM message:", response);
    } catch (error) {
      console.error("Error sending FCM message:", error);
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        await recipientRef.update({ fcmToken: null });
      }
    }
  }
);
