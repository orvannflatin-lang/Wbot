import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import PrefixesPage from "./pages/dashboard/PrefixesPage";
import ReactionsPage from "./pages/dashboard/ReactionsPage";
import PrivacyPage from "./pages/dashboard/PrivacyPage";
import ContactsPage from "./pages/dashboard/ContactsPage";
import SchedulerPage from "./pages/dashboard/SchedulerPage";
import ArchivesPage from "./pages/dashboard/ArchivesPage";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="prefixes" element={<PrefixesPage />} />
            <Route path="reactions" element={<ReactionsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="contacts" element={<ContactsPage />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="archives" element={<ArchivesPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
