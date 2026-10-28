import React from 'react';
import { Bot, User, Sparkles } from 'lucide-react';
import { AssistantProductCard, PriceAnalysis } from '../../services/assistantService';
import { ProductRecommendationCard } from './ProductRecommendationCard';
import { PriceTrendBadge } from './PriceTrendBadge';

export interface ChatMessageData {
  id: string | number;
  sender: 'USER' | 'ASSISTANT' | 'TOOL';
  content: string;
  intent?: string;
  suggested_products?: AssistantProductCard[];
  price_analysis?: PriceAnalysis | null;
  follow_up_suggestions?: string[];
  created_at?: string;
}

interface ChatMessageItemProps {
  message: ChatMessageData;
  onSelectPrompt?: (prompt: string) => void;
  onProductClick?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onSelectPrompt,
  onProductClick
}) => {
  const isUser = message.sender === 'USER';

  // Format assistant text with simple markdown-like bolding and newlines
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-2" />;
      }

      // Check for bullet points
      const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
      const cleanLine = isBullet ? line.trim().substring(2) : line;

      // Handle bold text **something**
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const parsedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <div key={lineIdx} className="flex items-start gap-1.5 my-0.5 text-xs">
            <span className="text-[#ffcd05] font-black mt-0.5">•</span>
            <span className="flex-1">{parsedParts}</span>
          </div>
        );
      }

      return (
        <p key={lineIdx} className="text-xs leading-relaxed my-1">
          {parsedParts}
        </p>
      );
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 my-3">
        <div className="max-w-[85%] bg-[#0a0500] text-white px-4 py-2.5 rounded-2xl rounded-br-xs shadow-xs text-xs font-medium">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
          <User className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex items-start gap-2.5 my-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0a0500] to-slate-800 text-[#ffcd05] flex items-center justify-center shrink-0 shadow-xs border border-amber-300/40">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex-1 max-w-[90%] space-y-2">
        <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-3.5 shadow-xs text-slate-800">
          {/* Header indicator if intent is detected */}
          {message.intent && message.intent !== 'UNKNOWN' && (
            <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
              <Sparkles className="w-3 h-3 text-[#ffcd05] fill-[#ffcd05]" />
              <span>{message.intent.replace(/_/g, ' ')}</span>
            </div>
          )}

          {/* Formatted Content */}
          <div className="text-slate-800">{renderFormattedText(message.content)}</div>

          {/* Price Analysis Card if available */}
          {message.price_analysis && (
            <PriceTrendBadge analysis={message.price_analysis} />
          )}

          {/* Suggested Products Carousel / Grid */}
          {message.suggested_products && message.suggested_products.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-700">
                  Live Catalog Recommendations ({message.suggested_products.length})
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Verified stock & prices
                </span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
                {message.suggested_products.map((product) => (
                  <ProductRecommendationCard
                    key={product.id}
                    product={product}
                    onProductClick={onProductClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Follow up suggestions */}
        {message.follow_up_suggestions && message.follow_up_suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {message.follow_up_suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectPrompt && onSelectPrompt(suggestion)}
                className="text-[11px] bg-white hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors shadow-2xs font-medium text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
