import re
from typing import List, Dict, Any
from apps.shopping_assistant.llm.base import BaseLLMClient


class MockLLMClient(BaseLLMClient):
    """
    High-speed deterministic intent parser and local tool router.
    Extracts intents using regex and keyword heuristics, calls the ToolRegistry,
    and formats conversational prose without third-party network overhead.
    """

    def generate_chat_turn(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        last_message = messages[-1]['content'].strip().lower() if messages else ''

        # 1. Price History Comparison Intent
        # e.g., "compare price for keyboard", "price history for wireless mouse", "is this cheaper"
        if any(kw in last_message for kw in ['history', 'cheaper', 'last month', 'price trend', 'price comparison', 'was it']):
            # Extract potential product slug/name
            match = re.search(r'(?:for|of|on)\s+([a-zA-Z0-9\s\-]+)', last_message)
            slug_or_query = match.group(1).strip() if match else 'wireless-mouse'
            # Convert spaces to hyphens for slug lookup fallback
            slug = slug_or_query.lower().replace(' ', '-')
            return {
                'text': f"I'm checking the verified 30-day price history for {slug_or_query}...",
                'tool_calls': [
                    {
                        'name': 'compare_price_history',
                        'args': {'product_slug_or_id': slug}
                    }
                ],
                'finish_reason': 'tool_calls'
            }

        # 2. Discount / Bargain Intent
        # e.g., "show me discounts under 1000", "best deals", "discounts on electronics", "20% off"
        if any(kw in last_message for kw in ['discount', 'deal', 'sale', 'off', 'bargain', 'save', 'cheap']):
            max_price = None
            price_match = re.search(r'(?:under|below|less than|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)', last_message)
            if price_match:
                max_price = float(price_match.group(1))

            min_disc = None
            disc_match = re.search(r'(\d+)%\s*(?:off|discount)?', last_message)
            if disc_match:
                min_disc = float(disc_match.group(1))

            cat_slug = None
            if 'electronic' in last_message or 'audio' in last_message or 'tech' in last_message:
                cat_slug = 'electronics-audio'
            elif 'fashion' in last_message or 'cloth' in last_message or 'wear' in last_message:
                cat_slug = 'fashion-apparel'
            elif 'home' in last_message or 'living' in last_message:
                cat_slug = 'home-living'
            elif 'fitness' in last_message or 'sport' in last_message:
                cat_slug = 'fitness-outdoors'

            return {
                'text': "I found genuine discounted items from verified merchants:",
                'tool_calls': [
                    {
                        'name': 'find_discounted_products',
                        'args': {
                            'max_price': max_price,
                            'min_discount_percent': min_disc,
                            'category_slug': cat_slug,
                            'limit': 5
                        }
                    }
                ],
                'finish_reason': 'tool_calls'
            }

        # 3. High Rating / Best Reviews Intent
        # e.g., "top rated", "best reviews", "rated above 4", "highest rating"
        if any(kw in last_message for kw in ['rating', 'rated', 'star', 'reviews', 'top rated', 'feedback', 'best quality']):
            min_rating = 4.0
            rating_match = re.search(r'(?:above|over|at least)?\s*(\d(?:\.\d)?)\s*(?:star|stars)?', last_message)
            if rating_match:
                try:
                    val = float(rating_match.group(1))
                    if 1.0 <= val <= 5.0:
                        min_rating = val
                except ValueError:
                    pass

            return {
                'text': f"Here are the top-rated products ranked by verified customer confidence:",
                'tool_calls': [
                    {
                        'name': 'find_top_rated_products',
                        'args': {'min_rating': min_rating, 'min_reviews': 1, 'limit': 5}
                    }
                ],
                'finish_reason': 'tool_calls'
            }

        # 4. Affordable / Quality Recommendation Intent
        # e.g., "find a laptop under 50000", "recommend a keyboard", "best value"
        budget = 50000.0
        budget_match = re.search(r'(?:under|below|budget|within|max)\s*(?:₹|rs\.?|inr)?\s*(\d+)', last_message)
        if budget_match:
            budget = float(budget_match.group(1))

        # Extract clean keyword query
        stop_words = {
            'find', 'show', 'a', 'an', 'the', 'under', 'below', 'good', 'best', 'for', 'me',
            'please', 'recommend', 'affordable', 'cheap', 'budget', 'options', 'option',
            'products', 'product', 'item', 'items', 'with', 'within', 'give', 'any', 'some'
        }
        clean_words = [w for w in re.findall(r'[a-zA-Z]+', last_message) if w not in stop_words]
        search_query = " ".join(clean_words) if clean_words else ""

        return {
            'text': f"Here are the highest-quality affordable options within your budget:",
            'tool_calls': [
                {
                    'name': 'recommend_affordable_products',
                    'args': {
                        'budget_max': budget,
                        'query': search_query,
                        'prioritize': 'balanced',
                        'limit': 4
                    }
                }
            ],
            'finish_reason': 'tool_calls'
        }
