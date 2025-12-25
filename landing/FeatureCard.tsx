import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: "violet" | "cyan";
  delay?: number;
}

export const FeatureCard = ({ icon: Icon, title, description, gradient, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="glass-card-hover p-6 group cursor-pointer"
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
        gradient === "violet" 
          ? "bg-primary/20 group-hover:bg-primary/30 group-hover:shadow-lg group-hover:shadow-primary/30" 
          : "bg-accent/20 group-hover:bg-accent/30 group-hover:shadow-lg group-hover:shadow-accent/30"
      }`}>
        <Icon className={`w-7 h-7 ${gradient === "violet" ? "text-primary" : "text-accent"}`} />
      </div>
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
};
