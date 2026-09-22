import 'package:flutter/material.dart';
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
        return const Icon(Icons.done_all, size: 14, color: Color(0xFF53BDEB));
    }
  }
}
