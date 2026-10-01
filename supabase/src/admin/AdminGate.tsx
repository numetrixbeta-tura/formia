import { useState, type ReactNode } from 'react';
import './admin.css';

const SESSION_KEY = 'formia-admin-unlocked';
// Protección básica para evitar que un usuario normal entre por accidente.
// No es un sistema de autenticación real — si se necesita seguridad real,
// esta ruta debe protegerse a nivel de servidor/infraestructura.
const PASSCODE = 'formia-admin-2026';

export default function AdminGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="admin-gate">
      <form className="admin-gate__box" onSubmit={handleSubmit}>
        <h2>Editor de Plantilla — Acceso restringido</h2>
        <p>Esta sección es exclusiva para administración. Introduce el código de acceso.</p>
        {error && <div className="admin-gate__error">Código incorrecto.</div>}
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Código de acceso"
        />
        <button type="submit" className="btn btn--primary" style={{ width: '100%' }}>
          Entrar
        </button>
      </form>
    </div>
  );
}
