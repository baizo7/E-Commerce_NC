import logging
from typing import List, Dict, Any
from apps.shopping_assistant.services.discount_service import DiscountFinderService
from apps.shopping_assistant.services.price_history_service import PriceHistoryService
from apps.shopping_assistant.services.review_confidence_service import ReviewConfidenceService
from apps.shopping_assistant.services.recommendation_service import AffordableRankerService

logger = logging.getLogger(__name__)


class ToolRegistry:
    """
    Registers and executes strictly bounded e-commerce query tools for the shopping assistant.
    Prevents direct arbitrary SQL access by restricting execution to validated business services.
    """

    TOOLS = [
        {
            "name": "find_discounted_products",
            "description": "Find products with verified active discounts and reference price reductions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_slug": {"type": "string", "description": "Optional category filter slug (e.g. 'electronics-audio')"},
                    "max_price": {"type": "number", "description": "Maximum price in INR"},
                    "min_discount_percent": {"type": "number", "description": "Minimum discount percentage (e.g. 20 for 20%)"},
                    "query": {"type": "string", "description": "Search keyword (e.g. 'headphones', 'keyboard')"},
                    "limit": {"type": "integer", "default": 5}
                }
            }
        },
        {
            "name": "compare_price_history",
            "description": "Compare a product's current price against 30-day moving average and same-day last month prices.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_slug_or_id": {"type": "string", "description": "Product slug or numeric ID"},
                    "variant_id": {"type": "integer", "description": "Optional product variant ID"},
                    "days": {"type": "integer", "default": 30}
                },
                "required": ["product_slug_or_id"]
            }
        },
        {
            "name": "find_top_rated_products",
            "description": "Retrieve products ranked by Bayesian review confidence and verified customer ratings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category_slug": {"type": "string", "description": "Optional category filter"},
                    "min_rating": {"type": "number", "default": 4.0},
                    "min_reviews": {"type": "integer", "default": 1},
                    "query": {"type": "string", "description": "Product search keyword"},
                    "limit": {"type": "integer", "default": 5}
                }
            }
        },
        {
            "name": "recommend_affordable_products",
            "description": "Multi-criteria quality and affordability recommendation based on hard budget limits and weighted scoring.",
            "parameters": {
                "type": "object",
                "properties": {
                    "budget_max": {"type": "number", "description": "Strict maximum budget limit in INR"},
                    "query": {"type": "string", "description": "Search query (e.g. 'laptop', 'mouse')"},
                    "category_slug": {"type": "string"},
                    "prioritize": {"type": "string", "enum": ["affordability", "rating", "discount", "balanced"], "default": "balanced"},
                    "limit": {"type": "integer", "default": 4}
                },
                "required": ["budget_max"]
            }
        }
    ]

    @classmethod
    def get_tool_declarations(cls) -> List[Dict[str, Any]]:
        return cls.TOOLS

    @classmethod
    def execute(cls, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a registered tool securely against the authoritative database services.
        """
        logger.info(f"Executing assistant tool: {name} with args: {args}")
        try:
            if name == "find_discounted_products":
                return {
                    'status': 'success',
                    'products': DiscountFinderService.find_discounts(
                        category_slug=args.get('category_slug'),
                        max_price=args.get('max_price'),
                        min_discount_percent=args.get('min_discount_percent'),
                        query=args.get('query'),
                        limit=args.get('limit', 5)
                    )
                }
            elif name == "compare_price_history":
                return {
                    'status': 'success',
                    'price_analysis': PriceHistoryService.analyze_product_price(
                        product_slug_or_id=args.get('product_slug_or_id'),
                        variant_id=args.get('variant_id'),
                        days=args.get('days', 30)
                    )
                }
            elif name == "find_top_rated_products":
                return {
                    'status': 'success',
                    'products': ReviewConfidenceService.find_top_rated(
                        category_slug=args.get('category_slug'),
                        min_rating=args.get('min_rating', 4.0),
                        min_reviews=args.get('min_reviews', 1),
                        query=args.get('query'),
                        limit=args.get('limit', 5)
                    )
                }
            elif name == "recommend_affordable_products":
                return {
                    'status': 'success',
                    'products': AffordableRankerService.recommend(
                        budget_max=float(args.get('budget_max', 100000)),
                        query=args.get('query'),
                        category_slug=args.get('category_slug'),
                        prioritize=args.get('prioritize', 'balanced'),
                        limit=args.get('limit', 4)
                    )
                }
            else:
                return {'status': 'error', 'message': f"Unknown tool: '{name}'"}
        except Exception as e:
            logger.error(f"Error executing assistant tool '{name}': {e}", exc_info=True)
            return {'status': 'error', 'message': str(e)}
