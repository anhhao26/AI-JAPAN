import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { ReviewQuestion } from '../types';
import LoadingSpinner from './LoadingSpinner';
import textbookContent from '../data/textbookContent';

type View = 'setup' | 'quiz' | 'results';

const ReviewGenerator: React.FC = () => {
  const [view, setView] = useState<View>('setup');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Bạn là một giáo viên tiếng Nhật chuyên tạo bài tập. Dựa vào nội dung giáo trình được cung cấp dưới đây, hãy tạo ra một bài tập ôn tập gồm ${numQuestions} câu hỏi trắc nghiệm.
        **QUAN TRỌNG:** Các câu hỏi phải được xây dựng trực tiếp từ nội dung trong sách, để người dùng không cần phải mở sách ra xem lại. Câu hỏi phải tự nó chứa đủ thông tin để trả lời.

        **Các loại câu hỏi cần tạo:**
        1.  **Điền vào chỗ trống:** Trích một câu từ giáo trình và đục một lỗ (ví dụ: \`[____]\`), yêu cầu người dùng chọn từ/cụm từ đúng để điền vào.
        2.  **Câu hỏi đọc hiểu:** Dựa vào các đoạn hội thoại hoặc thông tin (lịch trình, thời gian biểu), đặt câu hỏi về nội dung đó. Ví dụ: "Dựa vào lịch trình, thư viện さくら図書館 đóng cửa vào thứ mấy?"
        3.  **Câu hỏi từ vựng:** Hỏi ý nghĩa của một từ tiếng Nhật có trong bài bằng tiếng Việt, hoặc ngược lại. Ví dụ: "Từ '図書館' (toshokan) có nghĩa là gì?"
        4.  **Hoàn thành hội thoại:** Trích một phần hội thoại và hỏi xem câu trả lời/câu hỏi tiếp theo hợp lý là gì.

        Mỗi câu hỏi phải có 4 lựa chọn và chỉ một đáp án đúng. Cung cấp một lời giải thích ngắn gọn cho đáp án đúng, có thể trích dẫn lại câu hoặc quy tắc từ giáo trình.
        
        NỘI DUNG GIÁO TRÌNH:
        ---
        ${textbookContent}
        ---
        Hãy trả về kết quả dưới dạng một mảng JSON tuân thủ schema đã cho.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Câu hỏi bằng tiếng Việt hoặc yêu cầu dịch.' },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Mảng chứa 4 lựa chọn trả lời.' },
                correctAnswer: { type: Type.STRING, description: 'Đáp án đúng, phải là một trong các options.' },
                explanation: { type: Type.STRING, description: 'Giải thích ngắn gọn cho đáp án đúng.' },
              },
              required: ["question", "options", "correctAnswer", "explanation"],
            }
          }
        },
      });

      const generatedQuestions = JSON.parse(response.text) as ReviewQuestion[];
      setQuestions(generatedQuestions);
      setUserAnswers({});
      setView('quiz');

    } catch (e) {
      console.error(e);
      const error = e as Error;
      setError('Không thể tạo bài tập. Vui lòng thử lại. Lỗi: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = () => {
    setView('results');
  };

  const handleReset = () => {
    setView('setup');
    setQuestions([]);
    setUserAnswers({});
    setError(null);
  };
  
  const calculateScore = () => {
    return questions.reduce((score, question, index) => {
      return userAnswers[index] === question.correctAnswer ? score + 1 : score;
    }, 0);
  };

  const renderSetup = () => (
    <div className="text-center w-full">
      <h2 className="text-2xl font-bold text-white mb-2">Tạo bài ôn tập</h2>
      <p className="text-gray-400 mb-6">
        Tạo câu hỏi trắc nghiệm dựa trên nội dung giáo trình để kiểm tra kiến thức của bạn.
      </p>
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
        <label htmlFor="numQuestions" className="font-medium text-gray-300">Số lượng câu hỏi:</label>
        <input
          type="number"
          id="numQuestions"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Math.max(5, Math.min(20, parseInt(e.target.value, 10) || 5)))}
          min="5"
          max="20"
          className="w-full p-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-800 text-white text-center"
        />
        <button
          onClick={handleGenerateQuiz}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
        >
          {isLoading ? <LoadingSpinner /> : <i className="fas fa-play"></i>}
          <span>{isLoading ? 'Đang tạo...' : 'Bắt đầu ôn tập'}</span>
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
  
  const renderQuiz = () => (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Bài tập ôn tập</h2>
      <div className="space-y-6">
        {questions.map((q, index) => (
          <div key={index} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="font-semibold mb-3 text-gray-200">{index + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, optIndex) => (
                <label key={optIndex} className="flex items-center gap-3 p-3 rounded-md hover:bg-slate-700/50 cursor-pointer transition-colors duration-200">
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    checked={userAnswers[index] === option}
                    onChange={() => handleAnswerChange(index, option)}
                    className="form-radio h-5 w-5 text-cyan-500 bg-slate-600 border-slate-500 focus:ring-cyan-500"
                  />
                  <span className="text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
       <div className="mt-8 text-center">
        <button
          onClick={handleSubmitQuiz}
          disabled={Object.keys(userAnswers).length !== questions.length}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105"
        >
          <i className="fas fa-check-circle mr-2"></i>Nộp bài
        </button>
      </div>
    </div>
  );
  
  const renderResults = () => {
    const score = calculateScore();
    return (
      <div className="w-full">
        <div className="text-center mb-8 p-6 bg-slate-800/50 rounded-lg border border-slate-700">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">Hoàn thành!</h2>
          <p className="text-xl text-gray-300">
            Bạn đã trả lời đúng <span className="font-bold text-cyan-400">{score}</span> / <span className="font-bold text-white">{questions.length}</span> câu!
          </p>
        </div>
        
        <div className="space-y-6">
          {questions.map((q, index) => {
            const userAnswer = userAnswers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            return (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'} bg-slate-800/50`}>
                <p className="font-semibold mb-3 text-gray-200">{index + 1}. {q.question}</p>
                <div className="space-y-2 mb-3">
                  {q.options.map((option) => {
                    const isSelected = userAnswer === option;
                    const isTheCorrectAnswer = option === q.correctAnswer;
                    
                    let optionClass = "text-gray-400";
                    if(isTheCorrectAnswer) optionClass = "text-green-400 font-semibold";
                    if(isSelected && !isCorrect) optionClass = "text-red-400 line-through";

                    return (
                       <div key={option} className="flex items-center gap-3">
                         {isTheCorrectAnswer && <i className="fas fa-check text-green-500"></i>}
                         {isSelected && !isCorrect && <i className="fas fa-times text-red-500"></i>}
                         {!isTheCorrectAnswer && !isSelected && <div className="w-4"></div>}
                        <span className={optionClass}>{option}</span>
                       </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                   <p className="text-sm text-cyan-300"><span className="font-semibold">Giải thích:</span> {q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleReset}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105"
          >
            <i className="fas fa-redo mr-2"></i>Làm lại
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className="flex-1 flex justify-center items-start overflow-y-auto">
      {view === 'setup' && renderSetup()}
      {isLoading && view === 'setup' && <div className="text-center w-full"><LoadingSpinner/> <p className="mt-2 text-gray-400">AI đang tạo câu hỏi cho bạn...</p></div>}
      {view === 'quiz' && !isLoading && renderQuiz()}
      {view === 'results' && !isLoading && renderResults()}
    </div>
  );
};

export default ReviewGenerator;