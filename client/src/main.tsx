import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/shared/styles/index.css'
import App from './app/App.tsx'
import { initializePersistence } from '@/infrastructure/db/dexie/persistence.manager'

// Initialize IndexedDB persistence
initializePersistence().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
