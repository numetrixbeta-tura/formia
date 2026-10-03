import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { labelFor, SECTIONS } from '../config/sections';
import type { FormValues } from '../types';
import './admin.css';

type Application = {
  id: string;
  request_number: string;
  created_at: string;
  submitted_at: string | null;
  status: string;
  applicant_name: string;
  document_number: string | null;
  email: string | null;
  phone: string | null;
  form_values: FormValues;
  pdf_path: string;
  identity_front_path?: string | null;
  identity_back_path?: string | null;
  identity_pdf_path?: string | null;
  files?: Record<string, string | null>;
};

const STATUSES = [
  'TODAS',
  'NUEVA',
  'EN REVISIÓN',
  'ENVIADA AL BANCO',
  'FINALIZADA',
  'RECHAZADA',
  'INCOMPLETA',
];

async function api<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Error de administración.');
  }

  return data as T;
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Usuario o contraseña incorrectos.');
      }

      onLogin(data.token);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible iniciar sesión.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login admin-login--premium">
      <div className="admin-login__backdrop" aria-hidden="true" />

      <div className="admin-login__brand-lockup">
        <img
          src="/formia-icon-512.png"
          alt=""
          className="admin-login__brand-icon"
        />
        <div>
          <div className="admin-login__brand-name">FORMIA</div>
          <div className="admin-login__brand-subtitle">
            SOLICITUDES DE CRÉDITO DE VEHÍCULO
          </div>
        </div>
      </div>

      <div className="admin-login__layout">
        <div className="admin-login__features" aria-hidden="true">
          <div className="admin-login__feature">
            <span className="admin-login__feature-icon">✓</span>
            <div>
              <strong>Gestión segura</strong>
              <span>Consulta y administra solicitudes de crédito.</span>
            </div>
          </div>
          <div className="admin-login__feature">
            <span className="admin-login__feature-icon">▥</span>
            <div>
              <strong>Información en tiempo real</strong>
              <span>Seguimiento del estado de cada solicitud.</span>
            </div>
          </div>
          <div className="admin-login__feature">
            <span className="admin-login__feature-icon">◆</span>
            <div>
              <strong>Control total</strong>
              <span>Descarga, revisa y envía al banco.</span>
            </div>
          </div>
        </div>

        <div className="admin-login__card admin-login__card--premium">
          <div className="admin-login__card-kicker">FORMIA</div>
          <h1>Panel administrativo</h1>
          <p>Acceso privado para gestionar solicitudes de crédito.</p>

          <form onSubmit={submit}>
            <label className="admin-login__field">
              <span className="admin-login__label">
                <span className="admin-login__label-icon">♙</span>
                Usuario
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus
                placeholder="Ingresa tu usuario"
              />
            </label>

            <label className="admin-login__field">
              <span className="admin-login__label">
                <span className="admin-login__label-icon">▣</span>
                Contraseña
              </span>
              <span className="admin-login__password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  className="admin-login__password-toggle"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? '◉' : '◌'}
                </button>
              </span>
            </label>

            {error && <div className="admin-error">{error}</div>}

            <button
              className="admin-primary admin-login__submit"
              disabled={loading}
            >
              <span>{loading ? 'Ingresando…' : 'Ingresar'}</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="admin-login__secure-note">
            <span>●</span> Acceso protegido para administración de solicitudes
          </div>
        </div>
      </div>

      <div className="admin-login__footer">© 2026 FORMIA. Todos los derechos reservados.</div>
    </div>
  );
}

function getAllFieldIds() {
  const ids: string[] = [];

  for (const section of SECTIONS) {
    section.rows.forEach((r) => ids.push(...r.fieldIds));

    section.subgroups?.forEach((sg) =>
      sg.rows.forEach((r) => ids.push(...r.fieldIds)),
    );

    section.radioGroups?.forEach((g) => ids.push(g.id));
  }

  return ids;
}

const FIELD_IDS = getAllFieldIds();

/**
 * Convierte los valores internos que usa el formulario
 * en textos amigables para el administrador.
 */
function humanizeInternalValue(id: string, value: string) {
  if (!value) return value;

  const normalized = value.trim();

  // Tipo de documento
  if (id === 'tipoDocumento') {
    const map: Record<string, string> = {
      tipoDocumento_cc: 'C.C.',
      tipoDocumento_ce: 'C.E.',
      tipoDocumento_pasaporte: 'PASAPORTE',
      cc: 'C.C.',
      ce: 'C.E.',
      pasaporte: 'PASAPORTE',
    };

    return map[normalized] || normalized;
  }

  // Sexo
  if (id === 'sexo') {
    const map: Record<string, string> = {
      sexo_m: 'MASCULINO',
      sexo_f: 'FEMENINO',
      m: 'MASCULINO',
      f: 'FEMENINO',
      masculino: 'MASCULINO',
      femenino: 'FEMENINO',
    };

    return map[normalized] || normalized;
  }

  // Tipo de vivienda
  if (id === 'tipoVivienda') {
    const map: Record<string, string> = {
      tipoVivienda_propia: 'PROPIA',
      tipoVivienda_arrendada: 'ARRENDADA',
      tipoVivienda_familiar: 'FAMILIAR',
      tipoVivienda_otra: 'OTRA',
      propia: 'PROPIA',
      arrendada: 'ARRENDADA',
      familiar: 'FAMILIAR',
      otra: 'OTRA',
    };

    return map[normalized] || normalized;
  }

  // Ocupación
  if (id === 'ocupacion') {
    const map: Record<string, string> = {
      ocupacion_empleado: 'EMPLEADO',
      ocupacion_independiente: 'INDEPENDIENTE',
      ocupacion_pensionado: 'PENSIONADO',
      ocupacion_estudiante: 'ESTUDIANTE',
      ocupacion_desempleado: 'DESEMPLEADO',
      ocupacion_otro: 'OTRO',
      empleado: 'EMPLEADO',
      independiente: 'INDEPENDIENTE',
      pensionado: 'PENSIONADO',
      estudiante: 'ESTUDIANTE',
      desempleado: 'DESEMPLEADO',
      otro: 'OTRO',
    };

    return map[normalized] || normalized;
  }

  // Tipo de contrato
  if (id === 'tipoContrato') {
    const map: Record<string, string> = {
      indefinido: 'INDEFINIDO',
      termino_fijo: 'TERMINO FIJO',
      prestacion_de_servicio: 'PRESTACION DE SERVICIO',
      obra_labor: 'OBRA LABOR',
      aprendizaje: 'APRENDIZAJE',
    };

    return map[normalized] || normalized.toUpperCase();
  }

  return normalized;
}

function formatValue(id: string, value: string) {
  if (id === 'fechaNacimiento') {
    if (!value) return '';

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('es-CO');
  }

  if (id === 'firmaDigital') {
    return 'Firma digital registrada';
  }

  return humanizeInternalValue(id, value);
}

function Dashboard({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState('TODAS');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');

    try {
      const q = new URLSearchParams({
        status,
      });

      if (search.trim()) {
        q.set('search', search.trim());
      }

      const data = await api<{ applications: Application[] }>(
        `/api/admin/applications?${q}`,
        token,
      );

      setApplications(data.applications);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible cargar las solicitudes.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  const counts = useMemo(
    () =>
      applications.reduce<Record<string, number>>((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {}),
    [applications],
  );

  const openDetail = async (id: string) => {
    try {
      const data = await api<{ application: Application }>(
        `/api/admin/application?id=${encodeURIComponent(id)}`,
        token,
      );

      setSelected(data.application);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No fue posible abrir la solicitud.',
      );
    }
  };

  const changeStatus = async (id: string, next: string) => {
    await api('/api/admin/applications', token, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        id,
        status: next,
      }),
    });

    await load();

    if (selected?.id === id) {
      setSelected({
        ...selected,
        status: next,
      });
    }
  };

  const download = async (app: Application) => {
    const data = await api<{ url: string }>(
      `/api/admin/download?path=${encodeURIComponent(
        app.pdf_path,
      )}&filename=${encodeURIComponent(`${app.request_number}.pdf`)}`,
      token,
    );

    const a = document.createElement('a');

    a.href = data.url;
    a.target = '_blank';
    a.rel = 'noopener';

    a.click();
  };

  const share = async (app: Application) => {
    const data = await api<{ url: string }>(
      `/api/admin/download?path=${encodeURIComponent(
        app.pdf_path,
      )}&filename=${encodeURIComponent(`${app.request_number}.pdf`)}`,
      token,
    );

    const response = await fetch(data.url);

    if (!response.ok) {
      throw new Error(
        'No fue posible preparar el PDF para compartir.',
      );
    }

    const blob = await response.blob();

    const file = new File(
      [blob],
      `${app.request_number}.pdf`,
      {
        type: 'application/pdf',
      },
    );

    if (
      navigator.share &&
      navigator.canShare?.({
        files: [file],
      })
    ) {
      await navigator.share({
        title: app.request_number,
        text: `Solicitud ${app.request_number} - ${app.applicant_name}`,
        files: [file],
      });

      await changeStatus(
        app.id,
        'ENVIADA AL BANCO',
      );

      return;
    }

    const wa = `https://wa.me/?text=${encodeURIComponent(
      `Solicitud ${app.request_number} - ${app.applicant_name}. El PDF se descargará para adjuntarlo al chat del banco.`,
    )}`;

    const a = document.createElement('a');

    a.href = data.url;
    a.target = '_blank';
    a.rel = 'noopener';

    a.click();

    window.open(
      wa,
      '_blank',
      'noopener,noreferrer',
    );

    await changeStatus(
      app.id,
      'ENVIADA AL BANCO',
    );
  };

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <div className="admin-brand">FORMIA</div>
          <span>Panel administrativo</span>
        </div>

        <button
          className="admin-outline"
          onClick={onLogout}
        >
          Cerrar sesión
        </button>
      </header>

      <main className="admin-main">
        <div className="admin-title-row">
          <div>
            <h1>Solicitudes de crédito</h1>

            <p>
              Gestiona, descarga y envía al banco los
              expedientes recibidos.
            </p>
          </div>

          <button
            className="admin-outline"
            onClick={() => void load()}
          >
            Actualizar
          </button>
        </div>

        <div className="admin-stats">
          <div>
            <strong>{applications.length}</strong>
            <span>Mostradas</span>
          </div>

          <div>
            <strong>{counts['NUEVA'] || 0}</strong>
            <span>Nuevas</span>
          </div>

          <div>
            <strong>{counts['EN REVISIÓN'] || 0}</strong>
            <span>En revisión</span>
          </div>

          <div>
            <strong>
              {counts['ENVIADA AL BANCO'] || 0}
            </strong>
            <span>Enviadas</span>
          </div>
        </div>

        <div className="admin-filters">
          <input
            placeholder="Buscar por nombre, cédula o solicitud…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void load();
              }
            }}
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <button
            className="admin-primary admin-primary--small"
            onClick={() => void load()}
          >
            Buscar
          </button>
        </div>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Solicitud</th>
                <th>Cliente</th>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    Cargando…
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No hay solicitudes.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <strong>
                        {app.request_number}
                      </strong>
                    </td>

                    <td>
                      {app.applicant_name}
                    </td>

                    <td>
                      {app.document_number || '—'}
                    </td>

                    <td>
                      {new Date(
                        app.created_at,
                      ).toLocaleString('es-CO')}
                    </td>

                    <td>
                      <span
                        className={`status status--${app.status
                          .replace(/\s/g, '-')
                          .toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </td>

                    <td className="admin-actions">
                      <button
                        onClick={() =>
                          void openDetail(app.id)
                        }
                      >
                        Ver
                      </button>

                      <button
                        onClick={() =>
                          void download(app)
                        }
                      >
                        Descargar
                      </button>

                      <button
                        onClick={() =>
                          void share(app)
                        }
                      >
                        Enviar al banco
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {selected && (
        <div
          className="admin-overlay"
          onClick={() => setSelected(null)}
        >
          <aside
            className="admin-drawer"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="admin-drawer__head">
              <div>
                <span>
                  {selected.request_number}
                </span>

                <h2>
                  {selected.applicant_name}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
              >
                ×
              </button>
            </div>

            <div className="admin-drawer__actions">
              <button
                className="admin-primary"
                onClick={() =>
                  void download(selected)
                }
              >
                Descargar PDF
              </button>

              <button
                className="admin-secondary"
                onClick={() =>
                  void share(selected)
                }
              >
                Enviar al banco
              </button>
            </div>

            <label className="admin-status">
              Estado

              <select
                value={selected.status}
                onChange={(e) =>
                  void changeStatus(
                    selected.id,
                    e.target.value,
                  )
                }
              >
                {STATUSES.filter(
                  (s) => s !== 'TODAS',
                ).map((s) => (
                  <option key={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <div className="admin-detail-grid">
              <div>
                <span>Documento</span>
                <strong>
                  {selected.document_number ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>Celular</span>
                <strong>
                  {selected.phone || '—'}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {selected.email || '—'}
                </strong>
              </div>

              <div>
                <span>Recibida</span>
                <strong>
                  {new Date(
                    selected.created_at,
                  ).toLocaleString('es-CO')}
                </strong>
              </div>
            </div>

            <h3>
              Información diligenciada
            </h3>

            <div className="admin-fields">
              {FIELD_IDS.filter(
                (id) =>
                  selected.form_values?.[id],
              ).map((id) => (
                <div key={id}>
                  <span>
                    {labelFor(id)}
                  </span>

                  <strong>
                    {formatValue(
                      id,
                      selected.form_values[id],
                    )}
                  </strong>
                </div>
              ))}
            </div>

            <h3>Documentos</h3>

            <div className="admin-files">
              {selected.files?.pdf && (
                <a
                  href={selected.files.pdf}
                  target="_blank"
                  rel="noreferrer"
                >
                  📄 Solicitud completa
                </a>
              )}

              {selected.files?.identityPdf && (
                <a
                  href={
                    selected.files.identityPdf
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  🪪 Cédula PDF original
                </a>
              )}

              {selected.files?.identityFront && (
                <a
                  href={
                    selected.files.identityFront
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  🪪 Cédula frente
                </a>
              )}

              {selected.files?.identityBack && (
                <a
                  href={
                    selected.files.identityBack
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  🪪 Cédula reverso
                </a>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default function AdminApp() {
  const [token, setToken] = useState(
    () =>
      sessionStorage.getItem(
        'formia-admin-token',
      ) || '',
  );

  const login = (next: string) => {
    sessionStorage.setItem(
      'formia-admin-token',
      next,
    );

    setToken(next);
  };

  const logout = () => {
    sessionStorage.removeItem(
      'formia-admin-token',
    );

    setToken('');
  };

  return token ? (
    <Dashboard
      token={token}
      onLogout={logout}
    />
  ) : (
    <Login onLogin={login} />
  );
}