import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminApp from './admin/AdminApp';
import AdminGate from './admin/AdminGate';
import TemplateEditor from './admin/TemplateEditor';
import './index.css';

const isAdmin = window.location.pathname === '/admin';
const isTemplateEditor = window.location.pathname === '/admin/editor';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{isTemplateEditor ? <AdminGate><TemplateEditor /></AdminGate> : isAdmin ? <AdminApp /> : <App />}</React.StrictMode>,
);
