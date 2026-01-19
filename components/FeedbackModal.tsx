import React, { useState } from 'react';
import { X, Send, MessageSquare, Bug, Lightbulb, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [type, setType] = useState('Vorschlag');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSend = () => {
    const subject = encodeURIComponent(`VKD HUD Feedback: ${type}`);
    const body = encodeURIComponent(message);
    window.location.href = `mailto:veysel.yarba@regiocom.com?subject=${subject}&body=${body}`;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-[#111] rounded-3xl border border-white/10 shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Feedback</h3>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Senden an Veysel Yarba</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Art des Feedbacks</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Fehler', icon: Bug, label: 'Fehler' },
                { id: 'Vorschlag', icon: Lightbulb, label: 'Idee' },
                { id: 'Allgemein', icon: HelpCircle, label: 'Sonstiges' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${type === opt.id ? 'bg-blue-600 text-white border-blue-500' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                >
                  <opt.icon size={18} className="mb-2" />
                  <span className="text-[10px] font-black uppercase">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Nachricht</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beschreiben Sie Ihr Anliegen, gefundene Fehler oder Verbesserungsvorschläge..."
              className="w-full h-32 bg-black border border-white/20 rounded-xl p-4 text-sm font-medium text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="w-full py-4 bg-white text-black hover:bg-blue-500 hover:text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} /> Absenden
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;