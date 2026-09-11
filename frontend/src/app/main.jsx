import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { I18nProvider } from '../shared/context/I18nContext.jsx'
import { ErrorProvider } from '../shared/context/ErrorContext.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <ErrorProvider>
        <App />
      </ErrorProvider>
    </I18nProvider>
  </React.StrictMode>,
)
