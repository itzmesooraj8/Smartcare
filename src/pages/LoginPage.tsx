import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeMode } from '@/hooks/useThemeMode';
import {
  Heart,
  Mail,
  Lock,
  ChevronRight,
  Stethoscope,
  User,
  Shield,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';

type Role = 'patient' | 'doctor' | 'admin';

type DemoRole = {
  role: Role;
  label: string;
  icon: typeof User;
  email: string;
  password: string;
  color: string;
  glow: string;
  desc: string;
};

const DEMO_ROLES: DemoRole[] = [
  {
    role: 'patient',
    label: 'Patient',
    icon: User,
    email: import.meta.env.VITE_DEMO_PATIENT_EMAIL ?? 'demo.patient@smartcare.app',
    password: import.meta.env.VITE_DEMO_PATIENT_PASSWORD ?? import.meta.env.VITE_DEMO_PASSWORD ?? 'demo1234',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.3)',
    desc: 'View records and appointments',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    icon: Stethoscope,
    email: import.meta.env.VITE_DEMO_DOCTOR_EMAIL ?? 'demo.doctor@smartcare.app',
    password: import.meta.env.VITE_DEMO_DOCTOR_PASSWORD ?? import.meta.env.VITE_DEMO_PASSWORD ?? 'demo1234',
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.3)',
    desc: 'Consult, prescribe, telehealth',
  },
  {
    role: 'admin',
    label: 'Admin',
    icon: Shield,
    email: import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? 'demo.admin@smartcare.app',
    password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? import.meta.env.VITE_DEMO_PASSWORD ?? 'demo1234',
    color: '#7c3aed',
    glow: 'rgba(124,58,237,0.3)',
    desc: 'Full platform controls',
  },
];

const ROLE_ROUTES: Record<Role, string> = {
  admin: '/admin-dashboard',
  doctor: '/doctor/dashboard',
  patient: '/patient/dashboard',
};

const inferRoleFromEmail = (email: string): Role => {
  const normalized = email.toLowerCase();
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('doctor')) return 'doctor';
  return 'patient';
};

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useThemeMode();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState<Role | null>(null);

  const submitLogin = async (loginEmail: string, loginPassword: string, roleHint?: Role) => {
    setError('');
    try {
      await login(loginEmail, loginPassword, null);
      const role = roleHint || inferRoleFromEmail(loginEmail);
      navigate(ROLE_ROUTES[role] ?? '/dashboard', { replace: true });
    } catch {
      setError('Sign in failed. Check credentials or backend status.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitLogin(email, password);
  };

  const handleDemo = async (demo: DemoRole) => {
    setDemoLoading(demo.role);
    setEmail(demo.email);
    setPassword(demo.password);
    await submitLogin(demo.email, demo.password, demo.role);
    setDemoLoading(null);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--lux-bg)',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        color: 'var(--lux-text)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--lux-aurora-a) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--lux-aurora-b) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '40%',
            width: '30%',
            height: '30%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--lux-aurora-c) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, x: -38 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65 }}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 60px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 80 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg,var(--lux-cyan),var(--lux-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Heart size={18} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--lux-text)', letterSpacing: '-0.5px' }}>Smartcare</span>
        </Link>

        <div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--lux-cyan)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 18,
            }}
          >
            AI-native telehealth platform
          </div>
          <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1, marginBottom: 22 }}>
            Clinical care,
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg,var(--lux-cyan),var(--lux-violet))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              redefined.
            </span>
          </h1>
          <p style={{ fontSize: 17, color: 'var(--lux-muted)', lineHeight: 1.7, maxWidth: 420 }}>
            Zero-knowledge EHR, AI triage, secure WebRTC consults, and immutable audit trails in one platform.
          </p>
        </div>

        <div style={{ marginTop: 56, display: 'flex', gap: 30 }}>
          {[
            ['HIPAA', 'Compliant'],
            ['AES-256', 'Encryption'],
            ['99.9%', 'Uptime'],
          ].map(([value, label]) => (
            <div key={value}>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-1px' }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--lux-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.08 }}
        style={{
          width: 490,
          display: 'flex',
          alignItems: 'center',
          padding: '40px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: '100%',
            padding: 40,
            borderRadius: 28,
            border: '1px solid var(--lux-border)',
            background: 'var(--lux-panel)',
            backdropFilter: 'blur(20px)',
            boxShadow: isDark ? '0 30px 80px rgba(0,0,0,0.5)' : '0 30px 70px rgba(15,23,42,0.12)',
          }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 8 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: 'var(--lux-muted)', marginBottom: 32 }}>Sign in to your Smartcare account</p>

          {Boolean(import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true') && (
            <>
              <div style={{ marginBottom: 28 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--lux-muted)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Zap size={11} color="var(--lux-cyan)" />
                  One-click demo
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {DEMO_ROLES.map((demo) => {
                    const Icon = demo.icon;
                    return (
                      <motion.button
                        key={demo.role}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleDemo(demo)}
                        disabled={!!demoLoading || isLoading}
                        title={demo.desc}
                        style={{
                          padding: '12px 8px',
                          borderRadius: 12,
                          border: `1px solid ${demo.color}30`,
                          background: `${demo.color}12`,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 6,
                          opacity: demoLoading && demoLoading !== demo.role ? 0.5 : 1,
                          boxShadow: demoLoading === demo.role ? `0 0 20px ${demo.glow}` : 'none',
                        }}
                      >
                        {demoLoading === demo.role ? (
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `2px solid ${demo.color}`,
                              borderTopColor: 'transparent',
                              animation: 'spin .7s linear infinite',
                            }}
                          />
                        ) : (
                          <Icon size={16} color={demo.color} />
                        )}
                        <span style={{ fontSize: 12, fontWeight: 700, color: demo.color }}>{demo.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--lux-border)' }} />
                <span style={{ fontSize: 12, color: 'var(--lux-muted)' }}>or sign in with email</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--lux-border)' }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--lux-muted)', display: 'block', marginBottom: 8 }}>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--lux-muted)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@clinic.com"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 42px',
                    borderRadius: 12,
                    border: '1px solid var(--lux-border)',
                    background: 'var(--lux-panel-strong)',
                    color: 'var(--lux-text)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--lux-muted)', display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--lux-muted)' }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="��������"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 42px',
                    borderRadius: 12,
                    border: '1px solid var(--lux-border)',
                    background: 'var(--lux-panel-strong)',
                    color: 'var(--lux-text)',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--lux-muted)',
                    padding: 0,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    fontSize: 13,
                    color: '#f87171',
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={isLoading || !!demoLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                background: isLoading || !!demoLoading ? 'var(--lux-panel-strong)' : 'linear-gradient(135deg,var(--lux-cyan),var(--lux-violet))',
                color: isLoading || !!demoLoading ? 'var(--lux-muted)' : '#fff',
                fontSize: 15,
                fontWeight: 700,
                border: 'none',
                cursor: isLoading || !!demoLoading ? 'not-allowed' : 'pointer',
                boxShadow: isLoading || !!demoLoading ? 'none' : '0 0 30px color-mix(in oklab, var(--lux-cyan) 32%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
              {!isLoading && <ChevronRight size={16} />}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--lux-muted)', marginTop: 24 }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--lux-cyan)', textDecoration: 'none', fontWeight: 700 }}>
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 1100px) {
        .login-layout-left { display: none; }
      }
      `}</style>
    </div>
  );
}