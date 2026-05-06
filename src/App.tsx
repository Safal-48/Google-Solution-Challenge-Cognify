import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import NotesGenerator from './pages/NotesGenerator'
import QuizGenerator from './pages/QuizGenerator'
import AIChatbot from './pages/AIChatbot'
import ProgressTracker from './pages/ProgressTracker'
import TeacherMode from './pages/TeacherMode'
import Recommendations from './pages/Recommendations'
import DashboardLayout from './components/DashboardLayout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notes" element={<NotesGenerator />} />
            <Route path="/quiz" element={<QuizGenerator />} />
            <Route path="/chat" element={<AIChatbot />} />
            <Route path="/progress" element={<ProgressTracker />} />
            <Route path="/teacher" element={<TeacherMode />} />
            <Route path="/recommendations" element={<Recommendations />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
