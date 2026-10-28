from rest_framework import serializers
from apps.shopping_assistant.models import ChatSession, ChatMessage


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'content', 'intent', 'suggested_products', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'session_token', 'is_active', 'messages', 'created_at', 'updated_at']


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)
    session_token = serializers.CharField(max_length=120, required=False, allow_blank=True)
    context = serializers.DictField(required=False, default=dict)
