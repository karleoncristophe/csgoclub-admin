import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from '@/redux/store/store'
import { ThemeProvider } from '@/theme/ThemeContext'
import { Surface } from '@/components/ui/Surface'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <Surface variant="appRoot">
          <App />
        </Surface>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
