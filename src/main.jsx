import React from 'react';
import ReactDOM from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import App from './App';
import { ThemeProvider } from './lib/theme';
import { LangProvider } from './lib/i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <LangProvider>
        {/* reducedMotion="user" makes every framer animation honour the OS
            "reduce motion" setting without each component guarding for it. */}
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </LangProvider>
    </ThemeProvider>
  </React.StrictMode>
);
