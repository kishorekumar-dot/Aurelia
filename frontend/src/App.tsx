import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RulesTemplates from './pages/RulesTemplates';
import NewReview from './pages/NewReview';
import LivePipeline from './pages/LivePipeline';
import Report from './pages/Report';
import History from './pages/History';
import StudentDashboard from './pages/StudentDashboard';
import StudentSubmit from './pages/StudentSubmit';
import StudentFeedback from './pages/StudentFeedback';
import StudentHistory from './pages/StudentHistory';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Lecturer Space — requires authentication + LECTURER role */}
        <Route path="/dashboard" element={
          <ProtectedRoute requiredRole="LECTURER">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/rules" element={
          <ProtectedRoute requiredRole="LECTURER">
            <RulesTemplates />
          </ProtectedRoute>
        } />
        <Route path="/reviews/new" element={
          <ProtectedRoute requiredRole="LECTURER">
            <NewReview />
          </ProtectedRoute>
        } />
        <Route path="/reviews/:id/live" element={
          <ProtectedRoute requiredRole="LECTURER">
            <LivePipeline />
          </ProtectedRoute>
        } />
        <Route path="/reviews/:id" element={
          <ProtectedRoute requiredRole="LECTURER">
            <Report />
          </ProtectedRoute>
        } />
        <Route path="/reports/:id" element={
          <ProtectedRoute requiredRole="LECTURER">
            <Report />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute requiredRole="LECTURER">
            <History />
          </ProtectedRoute>
        } />
        <Route path="/archive" element={
          <ProtectedRoute requiredRole="LECTURER">
            <History />
          </ProtectedRoute>
        } />

        {/* Student Space — requires authentication + STUDENT role */}
        <Route path="/student" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/submit" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentSubmit />
          </ProtectedRoute>
        } />
        <Route path="/student/feedback" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentFeedback />
          </ProtectedRoute>
        } />
        <Route path="/student/history" element={
          <ProtectedRoute requiredRole="STUDENT">
            <StudentHistory />
          </ProtectedRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
