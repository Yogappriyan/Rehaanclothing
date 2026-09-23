import React, { useState } from 'react';
import { MapPin, Phone, Mail, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { submitContactMessage } from '../firebase/db';
import type { BusinessSettings } from '../types';

interface ContactProps {
  settings: BusinessSettings;
}

export const Contact: React.FC<ContactProps> = ({ settings }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    try {
      await submitContactMessage({
        name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
      });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err) {
      console.error(err);
      alert('Could not submit message. Please contact us directly via WhatsApp.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-24 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs uppercase tracking-widest text-[#9A8568] font-semibold">
          Get in Touch
        </span>
        <h1 className="font-editorial text-4xl sm:text-5xl text-[#292522] font-normal">
          Contact Rehaan Clothing
        </h1>
        <p className="text-sm text-[#766F68] max-w-md mx-auto leading-relaxed">
          Have a question about fabric, custom sizing, order dispatch, or styling recommendations? We'd
          love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Contact Information & Channels */}
        <div className="lg:col-span-5 space-y-8 bg-white p-6 sm:p-8 rounded-md border border-[#E9DFD0] shadow-2xs">
          <div>
            <h3 className="font-editorial text-2xl text-[#292522] mb-2">Boutique Information</h3>
            <p className="text-xs text-[#766F68] leading-relaxed">
              Reach our boutique team in Trichy directly through any of the channels below.
            </p>
          </div>

          <div className="space-y-5 text-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-[#292522] block font-semibold">Studio & Boutique:</strong>
                <p className="text-[#766F68] mt-0.5 leading-relaxed">
                  Plot No. 46, 2nd Cross,<br />
                  Sathanur,<br />
                  Trichy – 620102, Tamil Nadu, India
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-[#292522] block font-semibold">Phone Inquiries:</strong>
                <a
                  href="tel:+919790478436"
                  className="text-[#766F68] hover:text-[#9A8568] block mt-0.5 font-medium"
                >
                  +91 9790478436
                </a>
                <span className="text-[11px] text-[#766F68]">Mon – Sat: 10:00 AM – 8:00 PM IST</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#E9DFD0]/40 flex items-center justify-center text-[#9A8568] shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-[#292522] block font-semibold">Email:</strong>
                <a
                  href="mailto:houseofrehaan@gmail.com"
                  className="text-[#766F68] hover:text-[#9A8568] block mt-0.5"
                >
                  houseofrehaan@gmail.com
                </a>
                <a
                  href="mailto:animeflicks2310@gmail.com"
                  className="text-[#766F68] hover:text-[#9A8568] block"
                >
                  
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Action */}
          <div className="pt-4 border-t border-[#E9DFD0]">
            <a
              href={`https://wa.me/919790478436?text=${encodeURIComponent(
                'Hello Rehaan Clothing, I have an inquiry regarding your collection.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold uppercase tracking-wider rounded-xs flex items-center justify-center gap-2.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with Us on WhatsApp</span>
            </a>
          </div>

          {/* Map Link */}
          <div className="pt-2 text-center">
            <a
              href="https://maps.google.com/?q=Seerathoppu+Trichy+Tamil+Nadu+India"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#9A8568] hover:underline font-medium"
            >
              Open Trichy Boutique on Google Maps →
            </a>
          </div>
        </div>

        {/* Contact Message Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-md border border-[#E9DFD0] shadow-2xs">
          <h3 className="font-editorial text-2xl text-[#292522] mb-2">Send an Inquiry</h3>
          <p className="text-xs text-[#766F68] mb-6">
            We will review your inquiry and respond within 24 hours.
          </p>

          {sent ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-md text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
              <h4 className="font-editorial text-xl text-emerald-900">Message Received</h4>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                Thank you for reaching out to Rehaan Clothing. Our team has received your message and will
                get in touch shortly.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-2 px-5 py-2 bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider rounded-xs"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#292522] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ananya"
                    className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#292522] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#292522] mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#292522] mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Product inquiry, sizing, custom order"
                    className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#292522] mb-1">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you are looking for..."
                  className="w-full text-xs p-3 border border-[#E9DFD0] rounded-xs focus:border-[#9A8568] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 bg-[#292522] hover:bg-[#9A8568] text-white text-xs font-semibold uppercase tracking-widest rounded-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
