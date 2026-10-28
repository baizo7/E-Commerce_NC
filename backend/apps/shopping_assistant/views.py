from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.shopping_assistant.models import ChatSession
from apps.shopping_assistant.serializers import ChatRequestSerializer, ChatMessageSerializer
from apps.shopping_assistant.llm.orchestrator import AssistantOrchestrator
from apps.shopping_assistant.services.discount_service import DiscountFinderService
from apps.shopping_assistant.services.price_history_service import PriceHistoryService
from apps.shopping_assistant.services.review_confidence_service import ReviewConfidenceService
from apps.shopping_assistant.services.recommendation_service import AffordableRankerService


class ChatEndpointView(APIView):
    """
    POST /api/v1/assistant/chat/
    Main entrypoint for customer conversational AI shopping assistant turns.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data['message']
        session_token = serializer.validated_data.get('session_token')
        context_data = serializer.validated_data.get('context', {})

        orchestrator = AssistantOrchestrator()
        result = orchestrator.process_message(
            message_text=message,
            session_token=session_token,
            user=request.user if request.user.is_authenticated else None,
            context_metadata=context_data
        )

        return Response(result, status=status.HTTP_200_OK)


class ChatHistoryView(APIView):
    """
    GET /api/v1/assistant/chat/history/?session_token=...
    DELETE /api/v1/assistant/chat/history/?session_token=...
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        session_token = request.query_params.get('session_token')
        if not session_token:
            return Response({'error': 'session_token query parameter required.'}, status=status.HTTP_400_BAD_REQUEST)

        session = ChatSession.objects.filter(session_token=session_token).first()
        if not session:
            return Response({'session_token': session_token, 'messages': []})

        messages = session.messages.order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response({
            'session_token': session_token,
            'messages': serializer.data
        })

    def delete(self, request):
        session_token = request.query_params.get('session_token')
        if not session_token:
            return Response({'error': 'session_token query parameter required.'}, status=status.HTTP_400_BAD_REQUEST)

        session = ChatSession.objects.filter(session_token=session_token).first()
        if session:
            session.messages.all().delete()
        return Response({'message': 'Conversation history cleared.', 'session_token': session_token})


class AssistantDiscountsView(APIView):
    """
    GET /api/v1/assistant/discounts/?category=&max_price=&min_discount=
    Direct query endpoint for verified active product discounts.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cat = request.query_params.get('category')
        max_p = request.query_params.get('max_price')
        min_disc = request.query_params.get('min_discount')
        q = request.query_params.get('query')
        limit = int(request.query_params.get('limit', 8))

        products = DiscountFinderService.find_discounts(
            category_slug=cat,
            max_price=float(max_p) if max_p else None,
            min_discount_percent=float(min_disc) if min_disc else None,
            query=q,
            limit=limit
        )
        return Response({'count': len(products), 'results': products})


class AssistantPriceHistoryView(APIView):
    """
    GET /api/v1/assistant/price-history/?slug=&days=30
    Direct query endpoint for product historical price trends.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        slug = request.query_params.get('slug') or request.query_params.get('product_id')
        if not slug:
            return Response({'error': 'slug or product_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        variant_id = request.query_params.get('variant_id')
        days = int(request.query_params.get('days', 30))

        analysis = PriceHistoryService.analyze_product_price(
            product_slug_or_id=slug,
            variant_id=int(variant_id) if variant_id else None,
            days=days
        )
        return Response(analysis)


class AssistantTopRatedView(APIView):
    """
    GET /api/v1/assistant/top-rated/?category=&min_rating=&min_reviews=
    Direct query endpoint for Bayesian confidence rated products.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cat = request.query_params.get('category')
        min_r = float(request.query_params.get('min_rating', 4.0))
        min_rev = int(request.query_params.get('min_reviews', 1))
        q = request.query_params.get('query')
        limit = int(request.query_params.get('limit', 6))

        products = ReviewConfidenceService.find_top_rated(
            category_slug=cat,
            min_rating=min_r,
            min_reviews=min_rev,
            query=q,
            limit=limit
        )
        return Response({'count': len(products), 'results': products})


class AssistantRecommendView(APIView):
    """
    POST /api/v1/assistant/recommend/
    Direct query endpoint for multi-criteria quality & affordability recommendations.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        budget = request.data.get('budget_max')
        if not budget:
            return Response({'error': 'budget_max field is required.'}, status=status.HTTP_400_BAD_REQUEST)

        query = request.data.get('query')
        cat = request.data.get('category_slug')
        prioritize = request.data.get('prioritize', 'balanced')
        limit = int(request.data.get('limit', 4))

        results = AffordableRankerService.recommend(
            budget_max=float(budget),
            query=query,
            category_slug=cat,
            prioritize=prioritize,
            limit=limit
        )
        return Response({'count': len(results), 'results': results})
