import uuid
import logging
from typing import Dict, Any, Optional
from apps.shopping_assistant.models import ChatSession, ChatMessage
from apps.shopping_assistant.llm.gemini_client import GeminiLLMClient
from apps.shopping_assistant.llm.tool_registry import ToolRegistry

logger = logging.getLogger(__name__)


class AssistantOrchestrator:
    """
    Coordinates chat conversations by resolving user queries against
    the marketplace catalog and generating contextual product recommendations.
    """

    def __init__(self):
        self.llm = GeminiLLMClient()

    def process_message(
        self,
        message_text: str,
        session_token: Optional[str] = None,
        user = None,
        context_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        # 1. Resolve or create ChatSession
        if not session_token:
            session_token = f"sess_{uuid.uuid4().hex[:16]}"

        session, _ = ChatSession.objects.get_or_create(
            session_token=session_token,
            defaults={
                'user': user if user and user.is_authenticated else None,
                'context_metadata': context_metadata or {}
            }
        )

        if user and user.is_authenticated and not session.user:
            session.user = user
            session.save(update_fields=['user'])

        # 2. Record User Message
        user_msg = ChatMessage.objects.create(
            session=session,
            sender='USER',
            content=message_text
        )

        # 3. Compile conversation history for LLM
        recent_messages = session.messages.order_by('created_at')[:10]
        history = [
            {'role': 'user' if m.sender == 'USER' else 'assistant', 'content': m.content}
            for m in recent_messages
        ]

        # 4. Invoke LLM with Tool Declarations
        tools = ToolRegistry.get_tool_declarations()
        llm_turn = self.llm.generate_chat_turn(history, tools)

        tool_calls = llm_turn.get('tool_calls', [])
        assistant_text = llm_turn.get('text', '')
        intent = 'GENERAL_QUERY'
        suggested_products = []
        price_analysis = None
        executed_results = []

        # 5. Execute Structured Tools (The Retrieval Step in RAG)
        if tool_calls:
            for tc in tool_calls:
                name = tc.get('name')
                args = tc.get('args', {})
                res = ToolRegistry.execute(name, args)
                executed_results.append({'tool': name, 'result': res})

                if name == 'find_discounted_products':
                    intent = 'DISCOUNT_FINDER'
                    suggested_products.extend(res.get('products', []))
                    if not assistant_text or assistant_text.strip().endswith('...'):
                        count = len(res.get('products', []))
                        assistant_text = f"Here are {count} items currently on sale:"

                elif name == 'compare_price_history':
                    intent = 'PRICE_HISTORY'
                    price_analysis = res.get('price_analysis', {})
                    if price_analysis and 'error' not in price_analysis:
                        p_title = price_analysis.get('title', 'Product')
                        cur_p = price_analysis.get('current_price')
                        avg_p = price_analysis.get('thirty_day_avg_price')
                        trend = price_analysis.get('trend')
                        disc = price_analysis.get('history_disclosure')

                        if trend == 'CHEAPER':
                            assistant_text = f"Good news! **{p_title}** is currently ₹{cur_p:,.2f}, which is lower than its 30-day average of ₹{avg_p:,.2f}. {disc}"
                        elif trend == 'MORE_EXPENSIVE':
                            assistant_text = f"**{p_title}** is currently ₹{cur_p:,.2f}, slightly above its 30-day average of ₹{avg_p:,.2f}. {disc}"
                        else:
                            assistant_text = f"**{p_title}** is currently ₹{cur_p:,.2f}, holding steady near its recent average of ₹{avg_p:,.2f}. {disc}"
                    else:
                        assistant_text = price_analysis.get('error', "Could not find price history for that product.")

                elif name == 'find_top_rated_products':
                    intent = 'TOP_RATED'
                    suggested_products.extend(res.get('products', []))
                    if not assistant_text or assistant_text.strip().endswith('...'):
                        count = len(res.get('products', []))
                        assistant_text = f"Here are {count} top-rated products with great customer reviews:"

                elif name == 'recommend_affordable_products':
                    intent = 'AFFORDABLE_RECOMMENDATION'
                    suggested_products.extend(res.get('products', []))
                    if not assistant_text or assistant_text.strip().endswith('...'):
                        count = len(res.get('products', []))
                        assistant_text = f"Here are {count} top picks within your budget:"

        # Default fallback text if nothing matched
        if not assistant_text:
            assistant_text = "Hi! What are you looking to shop for today? I can help find discounts, compare prices, or recommend products."

        # 6. Persist Assistant Response Turn
        ChatMessage.objects.create(
            session=session,
            sender='ASSISTANT',
            content=assistant_text,
            intent=intent,
            tool_calls=tool_calls,
            tool_results=executed_results,
            suggested_products=suggested_products
        )

        # 7. Follow-up quick prompts
        follow_ups = [
            "Show me top discounts under ₹2,000",
            "Find products rated above 4.5 stars",
            "Show budget electronics deals"
        ]

        return {
            'session_token': session.session_token,
            'message': assistant_text,
            'intent': intent,
            'suggested_products': suggested_products,
            'price_analysis': price_analysis,
            'follow_up_suggestions': follow_ups
        }
