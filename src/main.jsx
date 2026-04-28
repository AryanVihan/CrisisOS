import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
import GuestView from './pages/GuestView.jsx'
import StaffView from './pages/StaffView.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/guest" element={<GuestView />} />
        <Route path="/staff" element={<StaffView />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
