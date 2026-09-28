import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public & Auth */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* Lecturer Space */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/rules" element={<RulesTemplates />} />
        <Route path="/reviews/new" element={<NewReview />} />
        <Route path="/reviews/:id/live" element={<LivePipeline />} />
        <Route path="/reviews/:id" element={<Report />} />
        <Route path="/history" element={<History />} />
        <Route path="/archive" element={<History />} />

        {/* Student Space (PRD Section 7.1, 11, 12, 19, 20) */}
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/submit" element={<StudentSubmit />} />
        <Route path="/student/feedback" element={<StudentFeedback />} />
        <Route path="/student/history" element={<StudentHistory />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
