import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Mail, Lock, Sparkles } from 'lucide-react';
import { auth, db, signInWithGoogle } from './firebase';
import { signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
  onSwitchToSignup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSuccess, onSwitchToSignup }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      
      // Store in Firestore for future connections
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        email: user.email,
        displayName: user.displayName || 'Google User',
        createdAt: new Date().toISOString(),
        tier: 'Free',
        tokenBalance: 50
      }, { merge: true });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during Google login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col md:flex-row font-sans text-white relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="ambient-orb cyan w-[600px] h-[600px] top-10 left-[-100px] animate-pulse-glow z-0"></div>
      <div className="ambient-orb fuchsia w-[800px] h-[800px] bottom-[-200px] right-[-200px] animate-pulse-glow z-0" style={{ animationDelay: '2s' }}></div>

      {/* Left Side - Visual/Branding */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-center gap-16 relative z-10 bg-slate-900/40 backdrop-blur-sm border-r border-white/10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 mb-2">
            Story.Menu
          </h1>
          <p className="text-gray-400">{t('signup.auto1', 'The Ultimate Generative Comic Studio')}</p>
        </div>
        
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight" dangerouslySetInnerHTML={{ __html: t('signup.headline', 'Your Imagination, <br/>Unleashed by AI.') }}>
          </h2>
          <p className="text-lg text-gray-400 font-light leading-relaxed">
            {t('signup.subhead', 'Join the community of creators turning everyday ideas into structured, beautiful, shareable comic stories in seconds.')}
          </p>
          
          <div className="flex items-center gap-4 pt-6">
            <div className="flex -space-x-4">
              <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar 1" />
              <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Avatar 2" />
              <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar 3" />
            </div>
            <div className="text-sm">
              <span className="text-amber-400">★★★★★</span>
              <p className="text-gray-400">{t('signup.auto2', 'Trusted by over 300,000 creators')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> {t('signup.backHome', 'Back to Home')}
        </button>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 text-white">{t('login.auto3', 'Welcome back')}</h2>
            <p className="text-gray-400">{t('login.auto4', 'Log in to continue your creative journey.')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('signup.auto6', 'Email Address')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="alex@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('signup.auto7', 'Password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl font-bold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : (
                <>
                  <Sparkles size={20} />
                  {t('login.submitBtn', 'Log In')}
                </>
              )}
            </button>
            
            <div className="my-6 flex items-center before:mt-0.5 before:flex-1 before:border-t before:border-white/10 after:mt-0.5 after:flex-1 after:border-t after:border-white/10">
              <p className="mx-4 mb-0 text-center text-sm font-semibold text-gray-400">
                OR
              </p>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg bg-white text-slate-900 hover:bg-gray-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Log in with Google
            </button>
            
          </form>

          <div className="text-center pt-6">
            <p className="text-gray-400 text-sm">
              {t('login.noAccount', 'Don\'t have an account?')} {' '}
              <button type="button" onClick={onSwitchToSignup} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                {t('login.signUp', 'Sign Up')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
