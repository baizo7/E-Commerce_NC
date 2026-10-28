import os
import json
import logging
import requests
from typing import List, Dict, Any
from apps.shopping_assistant.llm.base import BaseLLMClient
from apps.shopping_assistant.llm.mock_client import MockLLMClient

logger = logging.getLogger(__name__)


class GeminiLLMClient(BaseLLMClient):
    """
    Google Gemini LLM client supporting structured tool/function calling.
    Falls back gracefully to MockLLMClient if GEMINI_API_KEY is not configured.
    """

    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY', os.environ.get('GOOGLE_API_KEY', ''))
        self.model_name = os.environ.get('GEMINI_MODEL', 'gemini-1.5-flash')
        self.fallback_client = MockLLMClient()

    def generate_chat_turn(
        self,
        messages: List[Dict[str, str]],
        tools: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if not self.api_key or self.api_key.startswith('mock_') or self.api_key == '':
            logger.info("No Gemini API key detected. Using local deterministic assistant engine.")
            return self.fallback_client.generate_chat_turn(messages, tools)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"

        # Format Gemini contents payload
        contents = []
        for m in messages:
            role = 'user' if m.get('role') in ['user', 'customer'] else 'model'
            contents.append({
                'role': role,
                'parts': [{'text': m.get('content', '')}]
            })

        # Format Gemini function declarations
        gemini_tools = []
        if tools:
            func_decls = []
            for t in tools:
                func_decls.append({
                    'name': t['name'],
                    'description': t['description'],
                    'parameters': t.get('parameters', {})
                })
            gemini_tools.append({'functionDeclarations': func_decls})

        payload = {
            'systemInstruction': {'parts': [{'text': self.SYSTEM_PROMPT}]},
            'contents': contents,
            'tools': gemini_tools,
            'generationConfig': {
                'temperature': 0.2,
                'maxOutputTokens': 800
            }
        }

        try:
            res = requests.post(url, json=payload, timeout=8)
            if res.status_code == 200:
                data = res.json()
                candidate = data.get('candidates', [{}])[0]
                content_obj = candidate.get('content', {})
                parts = content_obj.get('parts', [])

                tool_calls = []
                response_text = ""
                for part in parts:
                    if 'text' in part:
                        response_text += part['text']
                    if 'functionCall' in part:
                        fn = part['functionCall']
                        tool_calls.append({
                            'name': fn.get('name'),
                            'args': fn.get('args', {})
                        })

                return {
                    'text': response_text,
                    'tool_calls': tool_calls,
                    'finish_reason': 'tool_calls' if tool_calls else 'stop'
                }
            else:
                logger.warning(f"Gemini API returned status {res.status_code}: {res.text}. Falling back to deterministic engine.")
                return self.fallback_client.generate_chat_turn(messages, tools)
        except Exception as e:
            logger.warning(f"Gemini connection error: {e}. Falling back to deterministic engine.")
            return self.fallback_client.generate_chat_turn(messages, tools)
