import uuid
from django.db import models
from django.conf import settings


class ChatSession(models.Model):
    """
    Stateful conversational chat session for guest or authenticated shoppers.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='assistant_sessions'
    )
    session_token = models.CharField(max_length=120, unique=True, db_index=True)
    context_metadata = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        owner = self.user.email if self.user else f"Guest ({self.session_token[:8]})"
        return f"ChatSession {self.id} [{owner}]"


class ChatMessage(models.Model):
    """
    Message history turn within an assistant session.
    Stores conversational prose alongside validated structured commerce payloads.
    """
    SENDER_CHOICES = (
        ('USER', 'User'),
        ('ASSISTANT', 'Assistant'),
        ('TOOL', 'Tool Execution'),
    )

    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=20, choices=SENDER_CHOICES)
    content = models.TextField()
    intent = models.CharField(max_length=60, blank=True)
    tool_calls = models.JSONField(default=list, blank=True)
    tool_results = models.JSONField(default=list, blank=True)
    suggested_products = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.sender}] {self.content[:40]}"
