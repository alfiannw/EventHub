import React, { useState } from 'react';
import { Shield, Users, Lock, Mail, User, ArrowRight, Sparkles, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';

interface UnifiedLoginPortalProps {
  onLoginSuccess: (user: any) => void;
  eventConfig: any;
}

export default function UnifiedLoginPortal({ onLoginSuccess, eventConfig }: UnifiedLoginPortalProps) {
  const [activeTab, setActiveTab] = useState<'PARTICIPANT' | 'ORGANIZER'>('PARTICIPANT');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [registerRole, setRegisterRole] = useState<'EVENT_MANAGER' | 'EVENT_STAFF'>('EVENT_MANAGER');

  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');

  // Status States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Authentication failed');
      }

      const userData = await res.json();
      setSuccess(`Success! Welcome back, ${userData.name}.`);
      
      setTimeout(() => {
        onLoginSuccess(userData);
      }, 800);

    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (activeTab === 'ORGANIZER') {
      if (!name || !email || !password) {
        setError('Name, email, and password are required.');
        return;
      }
      setIsLoading(true);
      try {
        const endpoint = registerRole === 'EVENT_STAFF' ? '/api/auth/register-staff' : '/api/auth/register-manager';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Registration failed');
        }

        const userData = await res.json();
        const roleLabel = userData.role === 'EVENT_STAFF' ? 'Event Staff' : 'Event Manager';
        setSuccess(`${roleLabel} account registered successfully! You are now logged in.`);
        
        setTimeout(() => {
          onLoginSuccess(userData);
        }, 1000);

      } catch (err: any) {
        setError(err.message || 'Registration failed. Make sure your email is whitelisted by Superadmin.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Participant register (RSVP path)
      if (!name || !email || !password) {
        setError('Name, email, and password are required.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch('/api/participants/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            phone,
            company: company || 'Independent',
            position: position || 'Professional',
            rsvpStatus: 'YES'
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Registration failed');
        }

        const participantData = await res.json();
        setSuccess('Account registered and RSVP submitted successfully! Loading your portal...');

        const loginUserObj = {
          id: participantData.id,
          email: participantData.email,
          name: participantData.name,
          role: 'PARTICIPANT',
          participantDetails: participantData,
          isOrganizer: false
        };

        setTimeout(() => {
          onLoginSuccess(loginUserObj);
        }, 1200);

      } catch (err: any) {
        setError(err.message || 'RSVP registration failed.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Brand logo card */}
      <div className="w-full max-w-md text-center mb-6">
        <div className="inline-flex h-14 w-14 bg-[#C5F237] text-[#141414] border-2.5 border-[#141414] rounded-2xl items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_#141414] mb-4">
          EH
        </div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#141414]">
          EventHub Portal
        </h1>
        <p className="text-xs text-slate-600 mt-1 font-semibold max-w-xs mx-auto">
          {eventConfig?.name || 'Live Event Check-In, RSVPs, & Gamification Engine'}
        </p>
      </div>

      {/* Main interactive form card */}
      <div className="w-full max-w-md bg-white border-3 border-[#141414] rounded-3xl p-6 sm:p-8 shadow-[8px_8px_0px_0px_#141414] relative overflow-hidden">
        
        {/* Decorative corner flash */}
        <div className="absolute top-0 right-0 bg-[#C5F237] text-[#141414] border-b-2.5 border-l-2.5 border-[#141414] py-1 px-3.5 font-mono text-[9px] uppercase font-bold tracking-widest">
          SECURE
        </div>

        {/* Tab Selection */}
        <div className="flex border-2 border-[#141414] rounded-2xl overflow-hidden mb-6 bg-[#DFDEDA]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PARTICIPANT');
              setAuthMode('LOGIN');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-3 px-4 font-mono text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'PARTICIPANT'
                ? 'bg-black text-white'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Attendee</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('ORGANIZER');
              setAuthMode('LOGIN');
              setError('');
              setSuccess('');
            }}
            className={`flex-1 py-3 px-4 font-mono text-xs font-black uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'ORGANIZER'
                ? 'bg-black text-white'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Organizer</span>
          </button>
        </div>

        {/* Info label about selected role pathway */}
        <div className="mb-4 bg-slate-50 border-1.5 border-dashed border-slate-300 p-3 rounded-xl text-[11px] text-slate-600 font-medium">
          {activeTab === 'PARTICIPANT' ? (
            <span><strong>Attendee Pathway:</strong> RSVP, check your table/seat, view your badges, request songs, and connect with other attendees.</span>
          ) : (
            <span><strong>Organizer Pathway:</strong> Exclusively for Event Managers, Event Staff & Superadmins. Whitelists apply. Access live analytics, lucky draws, and settings.</span>
          )}
        </div>

        {/* Messaging blocks */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 text-red-700 p-3.5 rounded-xl text-xs mb-5 flex items-start gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-3.5 rounded-xl text-xs mb-5 flex items-start gap-2 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{success}</span>
          </div>
        )}

        {/* FORMS */}
        {authMode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tech-input w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tech-input w-full pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#141414] hover:bg-[#C5F237] hover:text-[#141414] text-white py-3.5 px-4 border-2.5 border-[#141414] rounded-2xl font-mono text-xs uppercase font-black tracking-wider transition-all shadow-[3px_3px_0px_0px_#141414] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              <span>{isLoading ? 'Processing Access...' : 'Authenticate Access'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Link to sign up */}
            <div className="text-center pt-4 border-t border-slate-100 mt-6">
              <span className="text-slate-500 text-xs font-semibold">
                {activeTab === 'PARTICIPANT' ? "New Attendee?" : "Have a whitelisted organizer email?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('REGISTER');
                  setError('');
                  setSuccess('');
                }}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase ml-1.5 tracking-wider hover:underline font-mono"
              >
                {activeTab === 'PARTICIPANT' ? "Sign Up / RSVP" : "Create Account"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {activeTab === 'ORGANIZER' && (
              <div>
                <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                  Register As
                </label>
                <div className="flex border-1.5 border-[#141414] rounded-xl overflow-hidden bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('EVENT_MANAGER')}
                    className={`flex-1 py-1.5 px-3 font-mono text-[10px] font-bold uppercase transition-all rounded-lg cursor-pointer ${
                      registerRole === 'EVENT_MANAGER' ? 'bg-black text-[#FFE600]' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Event Manager
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegisterRole('EVENT_STAFF')}
                    className={`flex-1 py-1.5 px-3 font-mono text-[10px] font-bold uppercase transition-all rounded-lg cursor-pointer ${
                      registerRole === 'EVENT_STAFF' ? 'bg-black text-[#C5F237]' : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Event Staff
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="tech-input w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="tech-input w-full pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                Choose Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="tech-input w-full pl-10"
                />
              </div>
            </div>

            {/* Participant-only profile details */}
            {activeTab === 'PARTICIPANT' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="tech-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                      Position
                    </label>
                    <input
                      type="text"
                      placeholder="Engineer"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="tech-input w-full text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase font-black text-slate-500 mb-1.5 tracking-wider">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+62 812-3456-7890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="tech-input w-full pl-10 text-xs"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#141414] hover:bg-[#C5F237] hover:text-[#141414] text-white py-3.5 px-4 border-2.5 border-[#141414] rounded-2xl font-mono text-xs uppercase font-black tracking-wider transition-all shadow-[3px_3px_0px_0px_#141414] hover:shadow-[1px_1px_0px_0px_#141414] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              <span>{isLoading ? 'Creating Account...' : activeTab === 'PARTICIPANT' ? 'Register & Submit RSVP' : 'Register Organizer Account'}</span>
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Link back to login */}
            <div className="text-center pt-4 border-t border-slate-100 mt-6">
              <span className="text-slate-500 text-xs font-semibold">
                Already registered?
              </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('LOGIN');
                  setError('');
                  setSuccess('');
                }}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase ml-1.5 tracking-wider hover:underline font-mono"
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Safety system message */}
      <p className="text-[10px] text-slate-500 font-mono mt-8 text-center max-w-xs leading-relaxed">
        EventHub Security Gate v2.6. All logs, actions, and connections are securely whitelisted and monitored by Superadmin personnel.
      </p>
    </div>
  );
}
