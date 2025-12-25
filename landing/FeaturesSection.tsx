import { motion } from "framer-motion";
import { Ghost, Trash2, Brain, Heart, Download, Calendar } from "lucide-react";
import { FeatureCard } from "./FeatureCard";

const features = [
  {
    icon: Ghost,
    title: "Mode Ghost",
    description: "Lisez les messages sans être vu. Désactivez les accusés de réception en un clic.",
    gradient: "violet" as const,
  },
  {
    icon: Trash2,
    title: "Anti-Delete",
    description: "Ne perdez plus jamais un message. Sauvegardez automatiquement les messages supprimés.",
    gradient: "cyan" as const,
  },
  {
    icon: Brain,
    title: "Assistant IA",
    description: "Réponses intelligentes générées par IA. Gagnez du temps avec des suggestions contextuelles.",
    gradient: "violet" as const,
  },
  {
    icon: Heart,
    title: "Auto-Like",
    description: "Réagissez automatiquement aux statuts de vos contacts avec l'émoji de votre choix.",
    gradient: "cyan" as const,
  },
  {
    icon: Download,
    title: "Downloader",
    description: "Téléchargez n'importe quel média depuis Instagram, TikTok, YouTube et plus.",
    gradient: "violet" as const,
  },
  {
    icon: Calendar,
    title: "Scheduler",
    description: "Programmez vos messages et statuts. Publiez au moment parfait, automatiquement.",
    gradient: "cyan" as const,
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            Fonctionnalités{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Puissantes
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Découvrez toutes les fonctionnalités qui font de WBOT l'outil ultime pour WhatsApp.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
