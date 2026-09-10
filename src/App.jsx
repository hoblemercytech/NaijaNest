import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth, RedirectIfAuthed } from './routes/guards';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import {
  LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, AccountDisabledPage,
} from './pages/auth/AuthPages';
import { LoadingState } from './components/ui/States';

/**
 * Route sections load on demand.
 *
 * A collector recording payments on market-stall data should never download the
 * admin analytics screens — recharts alone is most of the bundle. Splitting by
 * role means each person fetches roughly what they use, and the landing page
 * (the only thing a stranger sees) stays small.
 */
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));

// customer
const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const Contributions = lazy(() => import('./pages/user/Contributions'));
const Withdrawals = lazy(() => import('./pages/user/Withdrawals'));
const Profile = lazy(() => import('./pages/user/Profile'));
const Verification = lazy(() => import('./pages/user/Verification'));

// collector
const CollectorDashboard = lazy(() => import('./pages/collector/CollectorDashboard'));
const Collect = lazy(() => import('./pages/collector/Collect'));
const CollectorCustomers = lazy(() => import('./pages/collector/Customers'));
const CollectorCustomerDetail = lazy(() => import('./pages/collector/CustomerDetail'));
const CollectorCycles = lazy(() => import('./pages/collector/Cycles'));
const CollectorWithdrawals = lazy(() => import('./pages/collector/Withdrawals'));
const CollectorCash = lazy(() => import('./pages/collector/Cash'));
const CollectorProfile = lazy(() => import('./pages/collector/Profile'));

// admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminCustomers = lazy(() => import('./pages/admin/Customers'));
const AdminCustomerDetail = lazy(() => import('./pages/admin/CustomerDetail'));
const AdminCollectors = lazy(() => import('./pages/admin/Collectors'));
const AdminCollectorDetail = lazy(() => import('./pages/admin/CollectorDetail'));
const AdminPlans = lazy(() => import('./pages/admin/Plans'));
const AdminCycles = lazy(() => import('./pages/admin/Cycles'));
const AdminContributions = lazy(() => import('./pages/admin/Contributions'));
const AdminWithdrawals = lazy(() => import('./pages/admin/Withdrawals'));
const AdminCash = lazy(() => import('./pages/admin/Cash'));
const AdminKyc = lazy(() => import('./pages/admin/Kyc'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const AuditLog = lazy(() => import('./pages/admin/AuditLog'));

/**
 * One boundary per role section rather than per route, so moving between
 * screens inside a section does not flash a spinner — the chunk is already in
 * memory after the first visit.
 */
function Section({ children }) {
  return <Suspense fallback={<LoadingState />}>{children}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      {/* public — deliberately not lazy; this is the first paint */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>} />
      <Route path="/signup" element={<RedirectIfAuthed><SignupPage /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/account-disabled" element={<AccountDisabledPage />} />

      {/* customer */}
      <Route element={<RequireAuth roles={['USER']}><Section><AppShell /></Section></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contributions" element={<Contributions />} />
        <Route path="/withdrawals" element={<Withdrawals />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* collector */}
      <Route element={<RequireAuth roles={['COLLECTOR']}><Section><AppShell /></Section></RequireAuth>}>
        <Route path="/collector/dashboard" element={<CollectorDashboard />} />
        <Route path="/collector/collect" element={<Collect />} />
        <Route path="/collector/customers" element={<CollectorCustomers />} />
        <Route path="/collector/customers/:id" element={<CollectorCustomerDetail />} />
        <Route path="/collector/cycles" element={<CollectorCycles />} />
        <Route path="/collector/withdrawals" element={<CollectorWithdrawals />} />
        <Route path="/collector/cash" element={<CollectorCash />} />
        <Route path="/collector/profile" element={<CollectorProfile />} />
        <Route path="/collector/notifications" element={<NotificationsPage />} />
      </Route>

      {/* admin */}
      <Route element={<RequireAuth roles={['ADMIN']}><Section><AppShell /></Section></RequireAuth>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminCustomers />} />
        <Route path="/admin/users/:id" element={<AdminCustomerDetail />} />
        <Route path="/admin/collectors" element={<AdminCollectors />} />
        <Route path="/admin/collectors/:id" element={<AdminCollectorDetail />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/cycles" element={<AdminCycles />} />
        <Route path="/admin/contributions" element={<AdminContributions />} />
        <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
        <Route path="/admin/cash" element={<AdminCash />} />
        <Route path="/admin/verification" element={<AdminKyc />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/audit-logs" element={<AuditLog />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
