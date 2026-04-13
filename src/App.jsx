import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import BookPage from './pages/BookPage'
import ChapterEditorPage from './pages/ChapterEditorPage'
import StylePage from './pages/StylePage'
import CoverDesignerPage from './pages/CoverDesignerPage'
import InfographicsPage from './pages/InfographicsPage'
import ExportPage from './pages/ExportPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/books/:bookId" element={<BookPage />} />
            <Route path="/books/:bookId/chapters/:chapterId" element={<ChapterEditorPage />} />
            <Route path="/books/:bookId/style" element={<StylePage />} />
            <Route path="/books/:bookId/cover" element={<CoverDesignerPage />} />
            <Route path="/books/:bookId/infographics" element={<InfographicsPage />} />
            <Route path="/books/:bookId/export" element={<ExportPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
