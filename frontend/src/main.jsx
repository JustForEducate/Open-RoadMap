import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { I18nProvider } from './context/I18nContext'
import { ErrorProvider } from './context/ErrorContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <ErrorProvider>
        <App />
      </ErrorProvider>
    </I18nProvider>
  </React.StrictMode>,
)
