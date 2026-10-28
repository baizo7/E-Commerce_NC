import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedPromptsProps {
  prompts?: string[];
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const DEFAULT_PROMPTS = [
  '🏷️ Best discounts under ₹2,000',
  '⭐ Top-rated products with verified reviews',
  '📉 Has the smartphone price dropped recently?',
  '💻 Best laptops under ₹60,000',
  '🎧 Affordable headphones with good ratings'
];

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({
  prompts,
  onSelectPrompt,
  disabled = false
}) => {
  const displayPrompts = prompts && prompts.length > 0 ? prompts : DEFAULT_PROMPTS;

  return (
    <div className="py-2">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-2 px-1">
        <Sparkles className="w-3.5 h-3.5 text-[#ffcd05] fill-[#ffcd05]" />
        <span>Try asking:</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {displayPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
            className="text-[12px] bg-slate-100 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 text-slate-700 font-medium px-3 py-1.5 rounded-full transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};
