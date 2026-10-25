import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { preloadModels } from './game/world/models';
import { setupPwa } from './pwa';
import SettingsHost from './ui/SettingsHost';
import './styles.css';

setupPwa();

const root = createRoot(document.getElementById('root')!);

// The 3D scene is built synchronously, so the hospital models are loaded first. A model that fails
// to load only means that item falls back to the built-in primitives, so never block the app on it.
preloadModels().finally(() =>
  root.render(
    <StrictMode>
      <App />
      <SettingsHost />
    </StrictMode>,
  ),
);
