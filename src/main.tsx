import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminGate from './admin/AdminGate.tsx'
import TemplateEditor from './admin/TemplateEditor.tsx'

// Ruteo mínimo: la ruta /admin/template-editor no aparece en ningún enlace
// del flujo normal del formulario, y queda además protegida por AdminGate.
const isAdminRoute = window.location.pathname.startsWith('/admin/template-editor')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminRoute ? (
      <AdminGate>
        <TemplateEditor />
      </AdminGate>
    ) : (
      <App />
    )}
  </StrictMode>,
)
