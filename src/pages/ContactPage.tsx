import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Contact ServiceHub Support
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Have an inquiry regarding specialist registration, marketplace bookings, or college project architecture? Reach out below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Direct Channels</h3>
            
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>support@servicehub.com</span>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-blue-600" />
              <span>+1 (800) 555-HUB-01</span>
            </div>

            <div className="flex items-center gap-3 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Metropolis Campus Center</span>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-slate-700">
            <p className="font-semibold text-blue-900 mb-1">Academic Project Notice</p>
            <p className="text-[11px] leading-relaxed text-blue-800">
              This application has been developed as an engineering major capstone project showcasing full-stack React, Vite, Node.js Express, and persistent SQLite database engineering.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-xs">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Inquiry Successfully Transmitted!</h3>
              <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you, {name}. Our academic project evaluation team has logged your message.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Morgan"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Booking question, provider application, or feedback"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please write your detailed comments or questions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
