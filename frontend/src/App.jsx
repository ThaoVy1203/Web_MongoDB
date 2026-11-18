import { Navigate, Route, Routes } from "react-router-dom";
import { PortalLayout } from "./components/layout/PortalLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { LandingPage } from "./pages/portal/LandingPage";
import { HomePage } from "./pages/portal/HomePage";
import { LookupPage } from "./pages/portal/LookupPage";
import { MyDevicesPage } from "./pages/portal/MyDevicesPage";
import { SubmitRequestPage } from "./pages/portal/SubmitRequestPage";
import { TrackTicketPage } from "./pages/portal/TrackTicketPage";
import { AuthPage } from "./pages/portal/AuthPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminRecordsPage } from "./pages/admin/AdminRecordsPage";
import { AdminTicketsPage } from "./pages/admin/AdminTicketsPage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminCustomerDetailPage } from "./pages/admin/AdminCustomerDetailPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";

export default function App() {
  return (
    <Routes>
      {/* Customer & Public Portal */}
      <Route element={<PortalLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/workspace" element={<Navigate to="/home" replace />} />
        <Route path="/lookup" element={<LookupPage />} />
        <Route path="/tra-cuu" element={<Navigate to="/lookup" replace />} />
        <Route path="/my-devices" element={<MyDevicesPage />} />
        <Route path="/san-pham-cua-toi" element={<Navigate to="/my-devices" replace />} />
        <Route path="/submit-request" element={<SubmitRequestPage />} />
        <Route path="/gui-yeu-cau" element={<Navigate to="/submit-request" replace />} />
        <Route path="/track" element={<TrackTicketPage />} />
        <Route path="/theo-doi" element={<Navigate to="/track" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dang-nhap" element={<Navigate to="/auth" replace />} />
      </Route>

      {/* Admin Operations Suite */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="records" element={<AdminRecordsPage />} />
        <Route path="ho-so-bao-hanh" element={<Navigate to="/admin/records" replace />} />
        <Route path="tickets" element={<AdminTicketsPage />} />
        <Route path="yeu-cau-bao-hanh" element={<Navigate to="/admin/tickets" replace />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
        <Route path="khach-hang" element={<Navigate to="/admin/customers" replace />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="san-pham" element={<Navigate to="/admin/products" replace />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="thong-ke" element={<Navigate to="/admin/analytics" replace />} />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
