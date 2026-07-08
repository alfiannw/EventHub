import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, Key, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col items-center justify-center font-mono p-4">
      {/* Container Card */}
      <div className="w-full max-w-md bg-white border-[2px] border-[#141414] p-8 shadow-[6px_6px_0px_0px_#141414] relative">
        
        {/* Header Branding */}
        <div className="text-center space-y-3 mb-8">
          <div className="h-12 w-12 bg-[#141414] text-[#00FF00] border-[1.5px] border-black flex items-center justify-center mx-auto shadow-sm">
            <Shield className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#141414]">EVENTHUB IDENTITY SECURE</h2>
            <p className="text-[10px] text-slate-500 uppercase mt-1">Multi-Tenant RBAC Authentication Portal</p>
          </div>
        </div>

        {/* Error Announcement */}
        {errorMsg && (
          <div className="bg-rose-100 border-[1.5px] border-black text-rose-900 p-3 mb-6 text-xs font-bold flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="uppercase text-[10px] leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              OPERATOR EMAIL ADDRESS
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eventhub.com"
                className="w-full bg-white border-[1.5px] border-[#141414] px-3.5 py-2.5 focus:bg-slate-50 focus:outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                SECURITY PASSWORD
              </label>
              <a href="#" className="text-[9px] text-[#00FF00] bg-black px-1 py-0.5 font-bold uppercase hover:bg-neutral-800">
                FORGOT?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border-[1.5px] border-[#141414] px-3.5 py-2.5 focus:bg-slate-50 focus:outline-none font-semibold text-slate-900 transition-all placeholder:text-slate-400 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-900 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#141414] hover:bg-neutral-800 text-white hover:text-[#00FF00] font-bold py-3 px-4 border-[1.5px] border-[#141414] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#00FF00]" />
                  <span>DECRYPTING VAULT KEY...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>AUTHORIZE ACCESS & SESSION</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Local Sandboxed Default Accounts Information */}
        <div className="mt-8 border-t-[1px] border-slate-200 pt-5 text-[9px] text-slate-400 leading-normal uppercase">
          <span className="font-bold text-slate-600 block mb-1">LOCAL AUDIT SANDBOX ACCREDITED PROFILE KEYWORDS:</span>
          <div className="grid grid-cols-2 gap-2 font-bold">
            <div className="bg-slate-50 p-1.5 border border-slate-200">
              <span className="text-slate-500">ADMINISTRATOR:</span>
              <span className="text-slate-800 block">admin@eventhub.com / admin123</span>
            </div>
            <div className="bg-slate-50 p-1.5 border border-slate-200">
              <span className="text-slate-500">EVENT MANAGER:</span>
              <span className="text-slate-800 block">manager@eventhub.com / manager123</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
