"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

const AUTH_PARTS = ['🔧', '⚙️', '🔌', '💡', '🔋', '🖨', '📡', '🔩', '🛠'];

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [glowIdx, setGlowIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session?.user) {
        router.push('/discovery');
      }
    });

    // Animate glowing grid item on right side
    const interval = setInterval(() => {
      setGlowIdx(Math.floor(Math.random() * 9));
    }, 800);

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  const switchMode= (signUp: boolean) => {
    setIsSignUp(signUp);
    setErrorMsg('');
    setInfoMsg('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || loading) return;

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try{
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }

        if (data.user && data.user.identities?.length === 0) {
          setErrorMsg('An account with this email already exists. Try signing in instead.');
          return;
        }

        if (data.session){
          router.push('/discovery');
        } else{
          setInfoMsg('Account created! Check your email for a confirmation link, then sign in.');
        }
      } else{
        const {error}= await supabase.auth.signInWithPassword({email, password});
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        router.push('/discovery');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
    

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const { error }= await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {redirectTo: `${window.location.origin}/discovery`}
    });
    if (error) setErrorMsg(error.message);
  };

   const messageBlock = (errorMsg || infoMsg) && (
    <div
      role="alert"
      className={`text-xs rounded-lg px-4 py-3 border ${
        errorMsg
          ? 'border-[#e06b35]/40 bg-[#e06b35]/10 text-[#e06b35]'
          : 'border-[#5dbf87]/40 bg-[#5dbf87]/10 text-[#5dbf87]'
      }`}
    >
      {errorMsg || infoMsg}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-60px)] grid grid-cols-1 md:grid-cols-2 bg-[#0d0d0d] text-[#f0ede6] font-grotesk">
      
      {/* ── LEFT SIDE: AUTH FORM ── */}
      <div className="bg-[#161616] border-r border-[#2a2a2a] flex flex-col justify-center p-8 sm:p-16">
        <div className="mb-10">
          <div className="font-mono text-2xl font-bold text-[#e8c547] tracking-wider mb-0.5">BOB</div>
          <div className="font-mono text-[10px] text-[#888888] tracking-[2px]">BUILD OUT OF BROKEN</div>
        </div>

        {!isSignUp ? (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Welcome back</h2>
            <p className="text-xs sm:text-sm text-[#888888] mb-8">Sign in to access your parts inventory and community recipes.</p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maker@workshop.com"
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-4 py-3 rounded-lg outline-none focus:border-[#e8c547] transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-4 py-3 rounded-lg outline-none focus:border-[#e8c547] transition-colors"
                />
              </div>

              {messageBlock}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all text-sm mt-2 shadow-[0_0_15px_rgba(232,197,71,0.2)] disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <hr className="flex-1 border-t border-[#2a2a2a]" />
              <span className="text-xs font-mono text-[#888888]">or</span>
              <hr className="flex-1 border-t border-[#2a2a2a]" />
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full py-3 bg-[#0d0d0d] border border-[#3a3a3a] hover:border-[#e8c547] text-[#f0ede6] hover:text-[#e8c547] rounded-lg transition-all flex items-center justify-center gap-3 text-sm"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-xs text-[#888888] mt-6">
              No account?{' '}
              <button onClick={() => switchMode(true)} className="text-[#e8c547] underline hover:text-[#c4a332]">
                Create one free
              </button>
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Join the makers</h2>
            <p className="text-xs sm:text-sm text-[#888888] mb-8">Create your free account and start turning scrap into projects.</p>

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1.5">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="maker_handle"
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-4 py-3 rounded-lg outline-none focus:border-[#e8c547] transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maker@workshop.com"
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-4 py-3 rounded-lg outline-none focus:border-[#e8c547] transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-4 py-3 rounded-lg outline-none focus:border-[#e8c547] transition-colors"
                />
              </div>

              {messageBlock}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all text-sm mt-2 shadow-[0_0_15px_rgba(232,197,71,0.2)] disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-xs text-[#888888] mt-6">
              Already have one?{' '}
              <button onClick={() => switchMode(false)} className="text-[#e8c547] underline hover:text-[#c4a332]">
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>

      {/* ── RIGHT SIDE: ANIMATED PARTS GRID ── */}
      <div className="hidden md:flex flex-col items-center justify-center p-12 bg-[#0d0d0d] relative overflow-hidden">
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
          {AUTH_PARTS.map((emoji, idx) => (
            <div
              key={idx}
              className={`aspect-square rounded-xl bg-[#161616] border flex items-center justify-center text-2xl transition-all duration-300 ${
                glowIdx === idx
                  ? 'border-[#e8c547] bg-[#e8c547]/10 shadow-[0_0_20px_rgba(232,197,71,0.2)] scale-105'
                  : 'border-[#2a2a2a]'
              }`}
            >
              {emoji}
            </div>
          ))}
        </div>
        <div className="mt-8 text-center font-mono text-xs tracking-[2px] text-[#888888] uppercase">
          YOUR PARTS · YOUR PROJECTS · YOUR BUILD
        </div>
      </div>

    </div>
  );
}