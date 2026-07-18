import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import Home from "./routes/home";
import Dashboard from "./routes/dashboard";
import Account from "./routes/account";
import SubmitShipment from "./routes/seller/submit-shipment";
import UpdateShipment from "./routes/partner/update-shipment";
import SellerLogin from "./routes/seller/login";
import SellerForgotPassword from "./routes/seller/forgot-password";
import PartnerLogin from "./routes/partner/login";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<Account />} />
            <Route path="/submit-shipment" element={<SubmitShipment />} />
            <Route path="/update-shipment" element={<UpdateShipment />} />
            <Route path="/seller/login" element={<SellerLogin />} />
            <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
            <Route path="/partner/login" element={<PartnerLogin />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
