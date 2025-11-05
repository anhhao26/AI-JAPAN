import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import LoadingSpinner from './LoadingSpinner';

const CompositionAssistant: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompose = async () => {
    if (!inputText.trim()) {
      setError('Vui lòng nhập chủ đề hoặc câu cần soạn thảo.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-pro',
        contents: `Bạn là một trợ lý viết tiếng Nhật chuyên nghiệp. Người dùng muốn viết về một chủ đề hoặc cần trợ giúp với một câu. Hãy giúp họ soạn thảo, sửa lỗi, hoặc đưa ra các gợi ý diễn đạt tốt hơn bằng tiếng Nhật.
        Yêu cầu của người dùng: "${inputText}"`,
      });
      
      setIsLoading(false); // Start showing stream right away

      for await (const chunk of responseStream) {
        setResult(prev => prev + chunk.text);
      }

    } catch (e) {
      const error = e as Error;
      console.error(error);
      setError('Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 flex-1">
      <h2 className="text-2xl font-bold text-white">Soạn thảo cùng AI</h2>
      <p className="text-gray-400">
        Nhập ý tưởng, chủ đề hoặc một câu tiếng Nhật chưa hoàn chỉnh. AI sẽ giúp bạn hoàn thiện nó.
      </p>
      
      <div className="flex-grow">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ví dụ: 週末の予定について友達にメールを書きたい (Tôi muốn viết mail cho bạn về kế hoạch cuối tuần)"
          className="w-full h-full p-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-800 text-white transition duration-300"
          disabled={isLoading}
        />
      </div>

      <button
        onClick={handleCompose}
        disabled={isLoading}
        className="w-full sm:w-auto self-start bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
      >
        {isLoading ? <LoadingSpinner /> : <i className="fas fa-pen-fancy"></i>}
        <span>{isLoading ? 'Đang xử lý...' : 'Soạn thảo'}</span>
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {(result || isLoading) && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700 min-h-[100px]">
          <h3 className="font-semibold text-lg mb-2 text-white">Gợi ý từ AI:</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{result}{isLoading && '...'}</p>
        </div>
      )}
    </div>
  );
};

export default CompositionAssistant;