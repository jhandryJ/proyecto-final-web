import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/Auth/LoginPage';
import { RegisterPage } from '../pages/Auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/Auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/Auth/ResetPasswordPage';
import { SplashScreen } from '../pages/Splash/SplashScreen';
import { Dashboard } from '../pages/Dashboard';
import { UserDashboard } from '../pages/UserDashboard';
import { TournamentBracketPage } from '../pages/TournamentBracketPage';
import { ProtectedRoute } from '../components/ProtectedRoute';

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                    path="/dashboard/*"
                    element={
                        <ProtectedRoute requireAdmin>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/dashboard/torneos/:id/bracket"
                    element={
                        <ProtectedRoute>
                            <TournamentBracketPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/user-dashboard"
                    element={
                        <ProtectedRoute>
                            <UserDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
