import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  MessageCircle,
  Settings,
  Users,
  Calendar,
  Archive,
  Shield,
  Heart,
  LogOut,
  Smartphone,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const menuItems = [
  { icon: Smartphone, label: "Connexion", path: "/dashboard" },
  { icon: User, label: "Mon Profil", path: "/profile" },
  { icon: Settings, label: "Préfixes", path: "/dashboard/prefixes" },
  { icon: Heart, label: "Réactions", path: "/dashboard/reactions" },
  { icon: Shield, label: "Confidentialité", path: "/dashboard/privacy" },
  { icon: Users, label: "Contacts CRM", path: "/dashboard/contacts" },
  { icon: Calendar, label: "Scheduler", path: "/dashboard/scheduler" },
  { icon: Archive, label: "Archives", path: "/dashboard/archives" },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DashboardSidebar = ({ isOpen = false, onClose }: SidebarProps) => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  const fullName = user?.user_metadata?.full_name || "Utilisateur";
  const email = user?.email || "email@example.com";
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 glass-card rounded-none border-r border-border/30 flex flex-col z-50 transition-transform duration-300",
        !isOpen && "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-border/30">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">WBOT</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-primary" : "group-hover:text-foreground"
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-foreground font-semibold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <Link to="/" onClick={() => { handleLogout(); onClose?.(); }}>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4" />
              Déconnexion
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
};
