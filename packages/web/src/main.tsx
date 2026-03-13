import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import App from '@/App';
import '@/index.css';

const base = import.meta.env.BASE_URL || '/app/';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={base.replace(/\/$/, '')}>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
