import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/redux/store/store'
import { ThemeProvider } from '@/theme/ThemeContext'
import { AdminPreferencesProvider } from '@/theme/AdminPreferencesContext'
import { ConfirmModalProvider } from '@/components/ui/ConfirmModalContext'
import { Surface } from '@/components/ui/Surface'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <AdminPreferencesProvider>
          <ConfirmModalProvider>
            <Surface variant="appRoot">
              <App />
            </Surface>
          </ConfirmModalProvider>
        </AdminPreferencesProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
