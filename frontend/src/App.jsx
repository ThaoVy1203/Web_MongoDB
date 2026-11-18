import { Navigate, Route, Routes } from "react-router-dom";
import { PortalLayout } from "./components/layout/PortalLayout";
import { HomePage } from "./pages/portal/HomePage";
import { LookupPage } from "./pages/portal/LookupPage";
import { MyDevicesPage } from "./pages/portal/MyDevicesPage";
import { SubmitRequestPage } from "./pages/portal/SubmitRequestPage";
import { TrackTicketPage } from "./pages/portal/TrackTicketPage";
import { AuthPage } from "./pages/portal/AuthPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PortalLayout />}>
        <Route path="/" element={<HomePage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
