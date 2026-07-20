import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { LogIn } from 'lucide-react';
import logoFoga from '../assets/LOGO_FOGA.png';

const ERRORES = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo no es válido.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos. Probá de nuevo en unos minutos.',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      console.error('Firebase auth error:', err);
      setError(`${ERRORES[err.code] || 'No se pudo iniciar sesión.'} (${err.code || err.message})`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#101215] px-4">
      <form onSubmit={handleSubmit} className="corner-brackets text-steel-line w-full max-w-sm bg-[#1B1E23] border border-white/10 rounded-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <img src={logoFoga} alt="FOGA" style={{ height: 40, filter: 'invert(1)', opacity: 0.95 }} className="mb-3" />
          <h1 className="font-display text-xl font-bold text-white">Flow</h1>
          <p className="text-steel-faint text-xs mt-1">Iniciá sesión para continuar</p>
        </div>

        <label className="text-xs text-steel-muted mb-1 block">Correo</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="nombre@equifrigo.com"
          className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 mb-3 focus:outline-none focus:border-flame placeholder:text-steel-faint"
        />

        <label className="text-xs text-steel-muted mb-1 block">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-[#101215] border border-white/10 rounded-lg text-sm text-white px-3 py-2 mb-4 focus:outline-none focus:border-flame placeholder:text-steel-faint"
        />

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-300 text-xs rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-flame hover:bg-flame-dim disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          <LogIn size={14} /> {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>

        <p className="text-steel-faint text-[11px] text-center mt-4">
          ¿No tenés cuenta? Pedile al administrador que te cree una.
        </p>
      </form>
    </div>
  );
}
