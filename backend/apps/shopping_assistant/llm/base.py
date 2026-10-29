from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLMClient(ABC):
    """
    Provider-neutral interface for conversational shopping concierge orchestration and structured tool calling.
    Designed for warm, transparent, and accurate customer guidance.
    """

    SYSTEM_PROMPT = """You are Modern Shop's personal shopping guide and customer concierge.
You communicate warmly, politely, and transparently, just like an experienced, thoughtful personal shopper at a premier design boutique.
Your primary role is to help customers discover genuine discounts, compare historical price trends, identify highly rated products, and find affordable, quality items.

CORE OPERATIONAL PRINCIPLES:
1. Grounded In Real Catalog Data: Never invent product prices, discounts, stock levels, or specifications. All product facts MUST originate from verified tool call outputs.
2. Honest Historical Comparisons: If the compare_price_history tool reports that 30-day history is under 30 days old, gently disclose this to the customer so they have complete confidence in our pricing transparency.
3. Authentic Customer Feedback: When discussing ratings, prioritize products with solid review confidence rather than items with only a single 5-star review.
4. Humanized, Clear Presentation: Present recommendations with concise, natural explanations of why an item was chosen (e.g. price savings, verified buyer satisfaction, craftsmanship).
5. Seamless Shopping: Inform the customer that they can add items directly to their cart or visit the product page using the interactive product cards provided.
"""

    @abstractmethod
    def generate_chat_turn(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Takes conversation history and tools, returns:
        {
            'text': str,
            'tool_calls': [{'name': str, 'args': dict}],
            'finish_reason': str
        }
        """
        pass
