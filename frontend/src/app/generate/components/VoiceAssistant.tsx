
// import React, { useState, useEffect, useRef } from 'react';
// import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// const VoiceAssistant: React.FC<{ topic?: string }> = ({ topic }) => {
//   const [isActive, setIsActive] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const sessionRef = useRef<any>(null);
//   const audioContextRef = useRef<AudioContext | null>(null);
//   const nextStartTimeRef = useRef(0);
//   const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

//   const toggleAssistant = async () => {
//     if (isActive) {
//       cleanup();
//       setIsActive(false);
//       return;
//     }

//     try {
//       setIsConnecting(true);
//       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
//       const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
//       audioContextRef.current = audioCtx;

//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
//       const sessionPromise = ai.live.connect({
//         model: 'gemini-2.5-flash-native-audio-preview-12-2025',
//         config: {
//           responseModalities: [Modality.AUDIO],
//           systemInstruction: `You are an AI learning assistant. Help the user understand the topic: "${topic || 'General Learning'}". Be concise, friendly, and helpful.`,
//           speechConfig: {
//             voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
//           },
//         },
//         callbacks: {
//           onopen: () => {
//             const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
//             const source = inputCtx.createMediaStreamSource(stream);
//             const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
//             scriptProcessor.onaudioprocess = (e) => {
//               const inputData = e.inputBuffer.getChannelData(0);
//               const pcmBlob = createBlob(inputData);
//               sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
//             };
            
//             source.connect(scriptProcessor);
//             scriptProcessor.connect(inputCtx.destination);
//           },
//           onmessage: async (msg: LiveServerMessage) => {
//             const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
//             if (base64Audio) {
//               const audioCtx = audioContextRef.current!;
//               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
//               const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
//               const source = audioCtx.createBufferSource();
//               source.buffer = buffer;
//               source.connect(audioCtx.destination);
//               source.start(nextStartTimeRef.current);
//               nextStartTimeRef.current += buffer.duration;
//               sourcesRef.current.add(source);
//             }
//             if (msg.serverContent?.interrupted) {
//               sourcesRef.current.forEach(s => s.stop());
//               sourcesRef.current.clear();
//               nextStartTimeRef.current = 0;
//             }
//           },
//           onclose: () => setIsActive(false),
//           onerror: (e) => console.error("Live API Error", e)
//         }
//       });

//       sessionRef.current = await sessionPromise;
//       setIsActive(true);
//       setIsConnecting(false);
//     } catch (err) {
//       console.error("Failed to connect to Live API", err);
//       setIsConnecting(false);
//     }
//   };

//   const cleanup = () => {
//     if (sessionRef.current) sessionRef.current.close();
//     sourcesRef.current.forEach(s => s.stop());
//     sourcesRef.current.clear();
//   };

//   useEffect(() => cleanup, []);

//   // Helpers
//   function decode(b64: string) {
//     const bin = atob(b64);
//     const bytes = new Uint8Array(bin.length);
//     for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
//     return bytes;
//   }
//   async function decodeAudioData(data: Uint8Array, ctx: AudioContext, rate: number, chans: number) {
//     const i16 = new Int16Array(data.buffer);
//     const buf = ctx.createBuffer(chans, i16.length / chans, rate);
//     for (let c = 0; c < chans; c++) {
//       const cd = buf.getChannelData(c);
//       for (let i = 0; i < buf.length; i++) cd[i] = i16[i * chans + c] / 32768.0;
//     }
//     return buf;
//   }
//   function createBlob(data: Float32Array): Blob {
//     const i16 = new Int16Array(data.length);
//     for (let i = 0; i < data.length; i++) i16[i] = data[i] * 32768;
//     let bin = '';
//     const bytes = new Uint8Array(i16.buffer);
//     for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
//     return { data: btoa(bin), mimeType: 'audio/pcm;rate=16000' };
//   }

//   return (
//     <div className="fixed bottom-8 right-8 z-50 no-print">
//       <button
//         onClick={toggleAssistant}
//         className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform active:scale-95 ${
//           isActive ? 'bg-red-500 scale-110' : 'bg-indigo-600 hover:bg-indigo-700'
//         }`}
//       >
//         {isConnecting ? (
//           <i className="fas fa-circle-notch fa-spin text-white text-xl"></i>
//         ) : isActive ? (
//           <div className="flex gap-1">
//             <div className="w-1 h-4 bg-white animate-pulse"></div>
//             <div className="w-1 h-6 bg-white animate-pulse delay-75"></div>
//             <div className="w-1 h-4 bg-white animate-pulse delay-150"></div>
//           </div>
//         ) : (
//           <i className="fas fa-microphone text-white text-xl"></i>
//         )}
//       </button>
//       {isActive && (
//         <div className="absolute bottom-20 right-0 bg-white p-4 rounded-2xl shadow-xl w-64 border animate-bounce-in">
//           <p className="text-sm font-medium text-slate-700">Live Tutor: Connected</p>
//           <p className="text-xs text-slate-500 mt-1">"Ask me anything about {topic || 'the topic'}"</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default VoiceAssistant;
