import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// Layout & UI
import Navbar from './components/Navbar';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import BookAppointment from './pages/client/BookAppointment';
import ClientAppointments from './pages/client/ClientAppointments';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServices from './pages/admin/AdminServices';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div className="dashboard-loading"><div className="spinner"></div></div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
        <div className="app-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Client Routes */}
              <Route 
                path="/client/dashboard" 
                element={
                  <ProtectedRoute role="client">
                    <ClientDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/client/book" 
                element={
                  <ProtectedRoute role="client">
                    <BookAppointment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/client/appointments" 
                element={
                  <ProtectedRoute role="client">
                    <ClientAppointments /> 
                  </ProtectedRoute>
                } 
              />

              {/* Admin Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/appointments" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/services" 
                element={
                  <ProtectedRoute role="admin">
                    <AdminServices />
                  </ProtectedRoute>
                } 
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
