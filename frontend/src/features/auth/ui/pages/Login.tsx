import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogin } from '../../hooks/useLogin';
import { ShieldAlert, UserCog, UserCheck, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

const PRESETS = [
  { role: 'ADMIN', email: 'admin@test.com', password: 'password123', icon: UserCog, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', hover: 'hover:bg-red-100' },
  { role: 'MODERATOR', email: 'mod@test.com', password: 'password123', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', hover: 'hover:bg-emerald-100' },
  { role: 'MEMBER', email: 'member@test.com', password: 'password123', icon: UserIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', hover: 'hover:bg-blue-100' },
];

export default function Login() {
  const { login, loadingRole, error } = useLogin();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password }, 'MANUAL');
  };

  const handlePresetLogin = async (preset: typeof PRESETS[0]) => {
    login({ email: preset.email, password: preset.password }, preset.role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-sm p-8 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-sm text-gray-500">Sign in to NirmanXpert to continue.</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleManualLogin} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all rounded-md px-3 py-2 text-gray-900 text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all rounded-md px-3 py-2 pr-10 text-gray-900 text-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loadingRole !== null}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-2 rounded-md transition-colors flex items-center justify-center disabled:opacity-50"
          >
            {loadingRole === 'MANUAL' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 text-xs uppercase tracking-wider">Demo Accounts</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.role}
                type="button"
                onClick={() => handlePresetLogin(preset)}
                disabled={loadingRole !== null}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-md border text-sm font-medium transition-all group disabled:opacity-50",
                  preset.bg, preset.border, preset.hover
                )}
              >
                <div className={clsx("p-1.5 rounded-md bg-white shadow-sm", preset.color)}>
                  {loadingRole === preset.role ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className={clsx(preset.color)}>{preset.role}</span>
                </div>
              </button>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-500 mt-2">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
