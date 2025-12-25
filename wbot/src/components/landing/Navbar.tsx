import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
    >
      <div className="max-w-6xl mx-auto glass-card px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-foreground" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">WBOT</span>
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Fonctionnalités
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Tarifs
          </a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
            FAQ
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Connexion
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="neon" size="sm">
              S'inscrire
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};
