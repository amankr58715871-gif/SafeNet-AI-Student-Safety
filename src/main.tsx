import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth'
import { ThemeProvider } from './lib/theme'
import { JourneyProvider } from './lib/journey'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <JourneyProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </JourneyProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
