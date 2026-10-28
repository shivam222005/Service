import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { AIAnalysisResponse, ServiceListing, ProviderProfile } from '../types.js';
import { 
  Sparkles, 
  X, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Star, 
  Wrench, 
  RefreshCw,
  Search,
  ExternalLink,
  MapPin
} from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, meta?: any) => void;
  onOpenBooking: (service: ServiceListing) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  data?: AIAnalysisResponse;
  timestamp: string;
}

const EXAMPLE_QUESTIONS = [
  'My AC is not cooling and blowing warm air',
  'Water is leaking under the kitchen sink pipe',
  'MCB tripped and switchboard is sparking',
  'Modular kitchen cabinet hinge is loose and sagging',
  'Inverter battery backup dropped from 4 hours to 30 mins',
  'Solar submersible pump throwing E-04 error code in farm',
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenBooking,
}) => {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Pune');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk?: string) => {
    const promptText = (textToAsk || query).trim();
    if (!promptText) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.ai.askAssistant({
        query: promptText,
        city: city.trim() || undefined,
      });

      if (res.success && res.data) {
        const aiMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: res.data.diagnostic,
          data: res.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Received incomplete response from diagnostic engine.');
      }
    } catch (err: any) {
      setError(err.message || 'Diagnostic assistant encountered an error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service: ServiceListing) => {
    onClose();
    onOpenBooking(service);
  };

  const handleExploreCategory = (slug: string) => {
    onClose();
    onNavigate('browse', { category: slug });
  };

  const handleViewProvider = (providerId: number) => {
    onClose();
    onNavigate('provider-detail', { id: providerId });
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">Critical Priority</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High Priority</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Standard Service</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Low Urgency</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">ServiceHub AI Diagnostic Assistant</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/20 text-white">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-blue-100">
                Natural language problem diagnosis, safety warnings & direct verified provider matching
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat / Content Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50">
          {/* Welcome Card if no messages yet */}
          {messages.length === 0 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                  <Wrench className="w-4 h-4" />
                  <span>How can ServiceHub help you today?</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Describe what went wrong in plain English or your preferred language — whether your air conditioner stopped cooling, water is leaking under your floor tiles, an MCB breaker trips repeatedly, or your agricultural pump needs diagnostics.
                </p>
                <div className="text-[11px] text-slate-400 font-medium">
                  We diagnose root causes, provide immediate safety tips, and directly retrieve verified technicians available in your city.
                </div>
              </div>

              {/* Example Question Chips */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Suggested Diagnostic Queries
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAsk(q)}
                      className="text-left text-xs bg-white hover:bg-blue-50/80 hover:border-blue-300 border border-slate-200 text-slate-700 hover:text-blue-700 p-3 rounded-xl transition-all cursor-pointer shadow-2xs group flex items-start justify-between gap-2"
                    >
                      <span className="leading-snug">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages Sequence */}
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {msg.sender === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] bg-blue-600 text-white p-3.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm shadow-xs space-y-1">
                    <p className="font-medium leading-relaxed">{msg.text}</p>
                    <p className="text-[10px] text-blue-200 text-right font-mono">{msg.timestamp}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Message Card */}
                  <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
                    {/* Header: Urgency & Category */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-slate-800">
                          Diagnostic Assessment
                        </span>
                      </div>
                      {msg.data && getUrgencyBadge(msg.data.urgencyLevel)}
                    </div>

                    {/* Diagnostic Explanation */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Probable Cause & Technical Analysis
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                        {msg.text}
                      </p>
                    </div>

                    {/* Safety Alert (if any) */}
                    {msg.data?.safetyWarning && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Immediate Safety Precaution: </strong>
                          <span>{msg.data.safetyWarning}</span>
                        </div>
                      </div>
                    )}

                    {/* Recommended Action */}
                    {msg.data?.recommendedAction && (
                      <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Recommended Action: </strong>
                          <span>{msg.data.recommendedAction}</span>
                        </div>
                      </div>
                    )}

                    {/* Matched Services from Real Catalog */}
                    {msg.data?.matchingServices && msg.data.matchingServices.length > 0 && (
                      <div className="space-y-2.5 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800">
                            Verified Matching Services ({msg.data.matchingServices.length})
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleExploreCategory(msg.data!.recommendedCategorySlug)}
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                          >
                            <span>View all in {msg.data.recommendedCategory}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.data.matchingServices.map((serv) => (
                            <div
                              key={serv.id}
                              className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between gap-2 shadow-2xs"
                            >
                              <div className="space-y-1">
                                <h5 className="font-bold text-xs text-slate-900 line-clamp-1">{serv.title}</h5>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="truncate">{serv.provider_business || serv.provider_name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] font-semibold">
                                  <span className="text-blue-700 font-bold">₹{serv.price}</span>
                                  <span className="text-slate-400 font-normal">/ {serv.pricing_unit}</span>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-amber-600 flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    {serv.rating_avg || 5.0}
                                  </span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleBookService(serv)}
                                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs text-center"
                              >
                                Book Now (₹{serv.price})
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Verified Specialists */}
                    {msg.data?.matchingProviders && msg.data.matchingProviders.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-slate-700">
                          Recommended Specialists in Your Area
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {msg.data.matchingProviders.map((pro) => (
                            <div
                              key={pro.user_id}
                              onClick={() => handleViewProvider(pro.user_id)}
                              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 cursor-pointer transition-all flex items-center gap-2.5 shadow-2xs"
                            >
                              <img
                                src={pro.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                                alt={pro.business_name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                              />
                              <div className="min-w-0 flex-1 text-[11px]">
                                <p className="font-bold text-slate-900 truncate">{pro.business_name}</p>
                                <p className="text-slate-500 truncate">{pro.city || pro.district}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs text-slate-600">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Analyzing technical parameters with Gemini AI diagnostic model...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Diagnostic Request Failed</p>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  className="font-bold underline text-red-900 hover:text-red-950 mt-1 cursor-pointer block"
                >
                  Click to retry diagnostic query
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Input Dock */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Describe your issue (e.g. 'AC cooling not working', 'water pipe burst')..."
                disabled={loading}
                className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send Query"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-28 sm:w-36 hidden sm:flex items-center gap-1 px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
                className="w-full bg-transparent focus:outline-none text-slate-800 font-medium"
              />
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Powered by Gemini AI · Trained on technical diagnostics</span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('browse');
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              Manual Directory Search →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
