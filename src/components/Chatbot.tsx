import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: '¡Hola! Soy el asistente virtual de LEGADO 1940. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatRef = useRef<any>(null);

  useEffect(() => {
    try {
      // @ts-ignore
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      chatRef.current = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: "Eres el asistente virtual de LEGADO 1940, una barbería premium en Ciudad de México (Bosques de la Reforma 1813, Piso 0, Pabellón Bosques). Tus servicios incluyen: Corte de Cabello ($350), Corte + Barba ($550), Arreglo de Barba ($250), Estilo Personalizado ($700). Horario: Lunes a Sábado 10:00-20:00, Domingo 10:00-16:00. Teléfono: 55 7878 6470. Responde dudas de los clientes de forma amable, profesional, elegante y concisa. Si te piden agendar, diles que usen el formulario de la página web.",
        }
      });
    } catch (e) {
      console.error("Failed to initialize Gemini API", e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatRef.current) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatRef.current.sendMessage({ message: userMsg.text });
      const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: response.text || 'Lo siento, tuve un problema al procesar tu solicitud.' };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Chatbot error:", error);
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', text: 'Lo siento, hubo un error de conexión. Por favor, intenta de nuevo o llámanos al 55 7878 6470.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-[#D4AF37] text-black shadow-2xl z-40 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle size={28} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-[#111] border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            <div className="bg-zinc-900 dark:bg-black p-4 flex justify-between items-center border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <h3 className="text-white font-serif font-bold tracking-wider">Asistente Virtual</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 h-80 p-4 overflow-y-auto bg-zinc-50 dark:bg-[#0a0a0a] flex flex-col gap-3 custom-scrollbar">
              {messages.map(msg => (
                <div key={msg.id} className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-[#D4AF37] text-black self-end rounded-tr-none' : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 self-start rounded-tl-none'}`}>
                  {msg.text}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 self-start rounded-lg rounded-tl-none p-3 max-w-[85%] flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-[#D4AF37]" /> Escribiendo...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-[#111] border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-full bg-[#D4AF37] text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
