import logging
from apps.accounts.models import AuditLog

logger = logging.getLogger(__name__)

class AuditService:
    @staticmethod
    def log(request, action: str, target_model: str, target_id: str, details: dict = None):
        """
        Records an administrative or governance action to the persistent AuditLog.
        """
        try:
            actor = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None
            ip_address = None
            if request:
                x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
                if x_forwarded:
                    ip_address = x_forwarded.split(',')[0].strip()
                else:
                    ip_address = request.META.get('REMOTE_ADDR')
            
            return AuditLog.objects.create(
                actor=actor,
                action=action,
                target_model=target_model,
                target_id=str(target_id),
                details=details or {},
                ip_address=ip_address
            )
        except Exception as exc:
            logger.warning("Failed to record audit log: %s", exc)
            return None
