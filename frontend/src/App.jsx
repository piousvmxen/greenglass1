import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import CreateRequest from './pages/CreateRequest'
import Requests from './pages/Requests'
import Messages from './pages/Messages'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import Statistics from './pages/Statistics'
import Notifications from './pages/Notifications'

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1e] transition-colors duration-300">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/verify-email/:token" element={<VerifyEmail />} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/map" element={<PrivateRoute><MapView /></PrivateRoute>} />
                  <Route path="/create-request" element={<PrivateRoute><CreateRequest /></PrivateRoute>} />
                  <Route path="/requests" element={<PrivateRoute><Requests /></PrivateRoute>} />
                  <Route path="/messages" element={<PrivateRoute><Messages /></PrivateRoute>} />
                  <Route path="/admin" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
                  <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/statistics" element={<PrivateRoute><Statistics /></PrivateRoute>} />
                  <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                <Toaster position="top-center" />
              </div>
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App
