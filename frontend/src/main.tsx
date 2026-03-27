import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import vkBridge from '@vkontakte/vk-bridge'
import './index.css'
import App from './App.tsx'

export const vkInitPromise = vkBridge.send('VKWebAppInit').catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
