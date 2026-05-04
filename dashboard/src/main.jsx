import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right"
      toastOptions={{
        style: {
          background: '#1e1e2e',
          color: '#e2e8f0',
          border: '1px solid #4f46e5',
        }
      }}
    />
  </StrictMode>
)