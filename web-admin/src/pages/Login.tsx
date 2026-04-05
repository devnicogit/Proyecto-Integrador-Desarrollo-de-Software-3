import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, User, ShieldAlert, Loader2, KeyRound } from 'lucide-react';

const KEYCLOAK_BASE = 'http://localhost:8080/realms/ecoroute/protocol/openid-connect';
const CLIENT_ID = 'mobile-app';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle OAuth2 callback: exchange code for token
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setIsExchanging(true);
      const redirectUri = window.location.origin + '/login';
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        code: code,
        redirect_uri: redirectUri,
      });

      fetch(`${KEYCLOAK_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Token exchange failed');
          return res.json();
        })
        .then((data) => {
          login(data.access_token);
          navigate('/');
        })
        .catch(() => {
          setError('Error al autenticar con Keycloak. Intente de nuevo.');
          setIsExchanging(false);
          // Clean URL params
          window.history.replaceState({}, document.title, '/login');
        });
    }
  }, [searchParams, login, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (username === 'admin' && password === 'admin123') {
        const mockToken = "mock_ADMIN";
        login(mockToken);
        navigate('/');
      } else {
        setError('Credenciales invalidas. Prueba con admin / admin123');
      }
    } catch (err) {
      setError('Error al intentar iniciar sesion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeycloakLogin = () => {
    const redirectUri = encodeURIComponent(window.location.origin + '/login');
    const keycloakUrl = `${KEYCLOAK_BASE}/auth?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;
    window.location.href = keycloakUrl;
  };

  if (isExchanging) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f1f5f9',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <Loader2 className="animate-spin" size={48} color="#2563eb" />
        <p style={{ color: '#64748b' }}>Autenticando con Keycloak...</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#f1f5f9'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: '50%',
            color: '#2563eb',
            marginBottom: '1rem'
          }}>
            <Truck size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>EcoRoute Admin</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>Ingresa tus credenciales para acceder</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: admin"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Contrasena</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #e2e8f0',
                  outline: 'none',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#2563eb',
              color: '#fff',
              borderRadius: '0.5rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              marginTop: '0.5rem',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Iniciar Sesion'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '1.5rem 0',
          gap: '0.75rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Keycloak Login Button */}
        <button
          onClick={handleKeycloakLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#f8fafc',
            color: '#475569',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            border: '1px solid #e2e8f0',
            transition: 'background-color 0.2s'
          }}
        >
          <KeyRound size={18} />
          Iniciar con Keycloak
        </button>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          &copy; 2026 TransLogistica Express S.A.C.
        </div>
      </div>
    </div>
  );
};

// Internal icon import for this component
const Truck: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 17h4V5H2v12h3m10 0h2l4-4v-5h-9v9m1 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4m10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4" />
  </svg>
);

export default Login;
