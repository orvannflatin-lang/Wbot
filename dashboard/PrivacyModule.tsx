import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Ghost, Trash2, MessageCircle, Shield } from "lucide-react";

export const PrivacyModule = () => {
  const [ghostMode, setGhostMode] = useState(false);
  const [antiDeleteMessages, setAntiDeleteMessages] = useState(true);
  const [antiDeleteStatuts, setAntiDeleteStatuts] = useState(true);

  const privacyOptions = [
    {
      id: "ghost",
      icon: Ghost,
      title: "Mode Ghost Global",
      description: "Masquez vos accusés de lecture et votre statut en ligne",
      enabled: ghostMode,
      setEnabled: setGhostMode,
      color: "primary",
    },
    {
      id: "antiDeleteMsg",
      icon: Trash2,
      title: "Anti-Delete Messages",
      description: "Sauvegardez automatiquement les messages supprimés par vos contacts",
      enabled: antiDeleteMessages,
      setEnabled: setAntiDeleteMessages,
      color: "accent",
    },
    {
      id: "antiDeleteStatus",
      icon: MessageCircle,
      title: "Anti-Delete Statuts",
      description: "Conservez les statuts supprimés avant leur expiration",
      enabled: antiDeleteStatuts,
      setEnabled: setAntiDeleteStatuts,
      color: "primary",
    },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Module Confidentialité
          </h2>
          <p className="text-xs text-muted-foreground">
            Contrôlez votre visibilité et protégez vos données
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {privacyOptions.map((option) => (
          <div
            key={option.id}
            className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
              option.enabled
                ? option.color === "primary"
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-accent/10 border border-accent/30"
                : "bg-secondary/30 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  option.enabled
                    ? option.color === "primary"
                      ? "bg-primary/20"
                      : "bg-accent/20"
                    : "bg-secondary/50"
                }`}
              >
                <option.icon
                  className={`w-6 h-6 transition-colors ${
                    option.enabled
                      ? option.color === "primary"
                        ? "text-primary"
                        : "text-accent"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
              <div>
                <Label
                  htmlFor={option.id}
                  className="text-foreground font-medium cursor-pointer"
                >
                  {option.title}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {option.description}
                </p>
              </div>
            </div>
            <Switch
              id={option.id}
              checked={option.enabled}
              onCheckedChange={option.setEnabled}
            />
          </div>
        ))}
      </div>

      {/* Warning */}
      {ghostMode && (
        <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
          <p className="text-sm text-destructive">
            ⚠️ Le Mode Ghost est actif. Vos contacts ne verront pas quand vous lisez leurs messages.
          </p>
        </div>
      )}
    </div>
  );
};
