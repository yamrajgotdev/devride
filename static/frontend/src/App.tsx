import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/LanguageSelector";
import Index from "./pages/Index.tsx";
import Customer from "./pages/Customer.tsx";
import Driver from "./pages/Driver.tsx";
import DriverLogin from "./pages/DriverLogin.tsx";
import PassengerLogin from "./pages/PassengerLogin.tsx";
import RideSuccess from "./pages/RideSuccess.tsx";
import CancelRide from "./pages/CancelRide.tsx";
import Feedback from "./pages/Feedback.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/customer" element={<Customer />} />
            <Route path="/driver" element={<Driver />} />
            <Route path="/driver-login" element={<DriverLogin />} />
            <Route path="/passenger-login" element={<PassengerLogin />} />
            <Route path="/ride-success" element={<RideSuccess />} />
            <Route path="/cancel-ride" element={<CancelRide />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
