import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';

// Audio Utility Functions
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


type ConnectionState = 'idle' | 'connecting' | 'connected' | 'closing' | 'error';
type Transcription = { speaker: 'user' | 'model'; text: string; isFinal: boolean };

const CommunicationPractice: React.FC = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const stopConversation = useCallback(async () => {
    setConnectionState('closing');
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
     if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();
    setConnectionState('idle');
  }, []);

  const startConversation = async () => {
    setConnectionState('connecting');
    setError(null);
    setTranscriptions([]);

    try {
        if (!process.env.API_KEY) {
            throw new Error("API key is not configured.");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = 0;

        sessionPromiseRef.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: async () => {
                    setConnectionState('connected');
                    mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(int16.buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        
                        if (sessionPromiseRef.current) {
                           sessionPromiseRef.current.then((session) => {
                             session.sendRealtimeInput({ media: pcmBlob });
                           });
                        }
                    };
                    source.connect(scriptProcessorRef.current);
                    scriptProcessorRef.current.connect(audioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const handleTranscription = (speaker: 'user' | 'model', text: string, isFinal: boolean) => {
                        if (!text) return;
                        setTranscriptions(prev => {
                            const last = prev[prev.length - 1];
                            if (last && last.speaker === speaker && !last.isFinal) {
                                const newTranscriptions = [...prev];
                                newTranscriptions[newTranscriptions.length - 1] = {
                                    ...last,
                                    text: last.text + text,
                                    isFinal: isFinal,
                                };
                                if (isFinal) {
                                  newTranscriptions[newTranscriptions.length - 1].isFinal = true;
                                }
                                return newTranscriptions;
                            } else {
                                return [...prev, { speaker, text, isFinal }];
                            }
                        });
                    };

                    if (message.serverContent?.inputTranscription) {
                        const { text, isFinal } = message.serverContent.inputTranscription;
                        handleTranscription('user', text, isFinal);
                    }

                    if (message.serverContent?.outputTranscription) {
                        const { text, isFinal } = message.serverContent.outputTranscription;
                        handleTranscription('model', text, isFinal);
                    }

                    // Handle audio playback
                    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (base64Audio && outputAudioContextRef.current) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                        const source = outputAudioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContextRef.current.destination);
                        source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        audioSourcesRef.current.add(source);
                    }
                    
                    if(message.serverContent?.interrupted) {
                        audioSourcesRef.current.forEach(source => source.stop());
                        audioSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
                    stopConversation();
                },
                onclose: () => {
                    stopConversation();
                },
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                systemInstruction: 'Bạn là một người bạn Nhật Bản thân thiện, đang luyện tập giao tiếp với một người học tiếng Nhật. Hãy nói chậm, rõ ràng và sử dụng những câu đơn giản. Chủ động đặt câu hỏi để duy trì cuộc hội thoại.',
                inputAudioTranscription: {},
                outputAudioTranscription: {}
            },
        });
        sessionRef.current = await sessionPromiseRef.current;
    } catch (e) {
        console.error(e);
        const error = e as Error;
        setError(`Không thể bắt đầu cuộc hội thoại: ${error.message}`);
        setConnectionState('error');
    }
  };

  const getButtonContent = () => {
    switch(connectionState) {
        case 'idle':
        case 'error':
            return <><i className="fas fa-microphone text-2xl"></i></>;
        case 'connecting':
            return <><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></>;
        case 'connected':
            return <><i className="fas fa-stop text-2xl"></i></>;
        case 'closing':
             return <><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></>;
    }
  }

  const handleButtonClick = () => {
    if (connectionState === 'connected') {
      stopConversation();
    } else {
      startConversation();
    }
  };


  return (
    <div className="flex flex-col gap-6 flex-1">
      <h2 className="text-2xl font-bold text-white">Luyện giao tiếp</h2>
      <p className="text-gray-400">
        Nói chuyện trực tiếp với AI để cải thiện kỹ năng phản xạ và phát âm của bạn.
      </p>

      <div className="flex-grow bg-slate-800/50 border border-slate-700 rounded-lg p-4 overflow-y-auto space-y-3">
        {transcriptions.length === 0 && connectionState !== 'idle' && (
             <p className="text-gray-500 italic text-center h-full flex items-center justify-center">
                {connectionState === 'connected' ? 'Bắt đầu nói để AI nhận diện...' : 'Đang kết nối...'}
            </p>
        )}
        {transcriptions.map((t, i) => (
             <div key={i} className={`p-2 rounded-md ${t.speaker === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`font-bold capitalize ${t.speaker === 'user' ? 'text-cyan-400' : 'text-purple-400'}`}>{t.speaker === 'user' ? 'Bạn' : 'AI'}: </span>
                <span className={`text-slate-300 ${t.isFinal ? '' : 'opacity-70'}`}>{t.text}</span>
            </div>
        ))}
      </div>
      
      {error && <p className="text-red-500 text-center">{error}</p>}

      <div className="text-center mt-4 flex flex-col items-center justify-center">
        <button 
          onClick={handleButtonClick}
          disabled={connectionState === 'connecting' || connectionState === 'closing'}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
            ${connectionState === 'connected' ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50 animate-pulse' : 'bg-gradient-to-br from-purple-600 to-cyan-500 text-white shadow-lg shadow-purple-500/50'}
          `}
        >
          {getButtonContent()}
        </button>
        {connectionState === 'connected' && (
            <div className="mt-4 flex items-center justify-center gap-2 text-cyan-400">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
                Đã kết nối
            </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationPractice;