import api from './api';

export interface AssistantProductCard {
  id: number;
  title: string;
  slug: string;
  category_name?: string;
  vendor_name: string;
  current_price: number;
  compare_at_price?: number | null;
  discount_percent?: number;
  savings_amount?: number;
  inventory_count?: number;
  rating?: number;
  raw_rating?: number;
  review_count?: number;
  bayesian_score?: number;
  verified_buyer_pct?: number;
  recommendation_reason?: string;
  primary_image?: string;
  pdp_url: string;
  applicable_coupon?: {
    code: string;
    discount_type: string;
    value: number;
    coupon_savings: number;
  } | null;
}

export interface PriceAnalysis {
  product_id?: number;
  title: string;
  slug: string;
  variant_id?: number | null;
  variant_title?: string | null;
  current_price: number;
  currency: string;
  has_sufficient_history: boolean;
  tracking_start_date: string;
  records_analyzed: number;
  trend: 'CHEAPER' | 'MORE_EXPENSIVE' | 'STABLE';
  thirty_day_avg_price: number;
  diff_vs_thirty_day_avg: number;
  pct_vs_thirty_day_avg: number;
  last_month_same_day_price: number;
  diff_vs_last_month_same_day: number;
  pct_vs_last_month_same_day: number;
  history_disclosure: string;
  recent_price_points?: Array<{ price: number; date: string; reason: string }>;
  error?: string;
}

export interface AssistantChatResponse {
  session_token: string;
  message: string;
  intent: string;
  suggested_products: AssistantProductCard[];
  price_analysis?: PriceAnalysis | null;
  follow_up_suggestions: string[];
}

export interface ChatHistoryMessage {
  id: number;
  sender: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  intent?: string;
  suggested_products?: AssistantProductCard[];
  created_at: string;
}

export const assistantService = {
  sendMessage: async (
    message: string,
    sessionToken?: string,
    context?: Record<string, any>
  ): Promise<AssistantChatResponse> => {
    const res = await api.post('/v1/assistant/chat/', {
      message,
      session_token: sessionToken,
      context: context || {}
    });
    return res.data;
  },

  getHistory: async (sessionToken: string): Promise<ChatHistoryMessage[]> => {
    const res = await api.get(`/v1/assistant/chat/history/?session_token=${encodeURIComponent(sessionToken)}`);
    return res.data.messages || [];
  },

  clearHistory: async (sessionToken: string): Promise<void> => {
    await api.delete(`/v1/assistant/chat/history/?session_token=${encodeURIComponent(sessionToken)}`);
  }
};
