import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, Save, Download, Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export const PrefixesModule = () => {
  const [viewOncePrefix, setViewOncePrefix] = useState("1");
  const [statusSavePrefix, setStatusSavePrefix] = useState("*");
  const [downloaderPrefix, setDownloaderPrefix] = useState("dl");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If not found, it might be a new user, settings will be created on save
        console.log("No settings found, using defaults");
      } else if (data) {
        setViewOncePrefix(data.view_once_prefix || "1");
        setStatusSavePrefix(data.status_save_prefix || "*");
        setDownloaderPrefix(data.downloader_prefix || "dl");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          view_once_prefix: viewOncePrefix,
          status_save_prefix: statusSavePrefix,
          downloader_prefix: downloaderPrefix,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Préfixes sauvegardés",
        description: "Vos configurations ont été mises à jour avec succès.",
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Échec de la sauvegarde des paramètres",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Configuration des Préfixes
        </h2>
        <Button variant="neon" size="sm" onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Sauvegarder
        </Button>
      </div>

      <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Comment utiliser les préfixes ?</p>
            <p className="text-xs text-muted-foreground">
              Envoyez un message avec le préfixe suivi de votre contenu. Par exemple, envoyez "1" en réponse à une vue unique pour la sauvegarder.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* View Once Prefix */}
        <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="viewOnce" className="text-foreground font-medium">
              Préfixe Vue Unique
            </Label>
            <p className="text-xs text-muted-foreground">
              Répondez avec ce préfixe pour sauvegarder les médias à vue unique
            </p>
            <Input
              id="viewOnce"
              value={viewOncePrefix}
              onChange={(e) => setViewOncePrefix(e.target.value)}
              placeholder="Ex: 1"
              className="max-w-32"
            />
          </div>
        </div>

        {/* Status Save Prefix */}
        <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Save className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="statusSave" className="text-foreground font-medium">
              Préfixe Sauvegarde Statut
            </Label>
            <p className="text-xs text-muted-foreground">
              Répondez avec ce préfixe pour télécharger un statut WhatsApp
            </p>
            <Input
              id="statusSave"
              value={statusSavePrefix}
              onChange={(e) => setStatusSavePrefix(e.target.value)}
              placeholder="Ex: *"
              className="max-w-32"
            />
          </div>
        </div>

        {/* Downloader Prefix */}
        <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="downloader" className="text-foreground font-medium">
              Préfixe Downloader RS
            </Label>
            <p className="text-xs text-muted-foreground">
              Envoyez ce préfixe + lien pour télécharger depuis Instagram, TikTok, YouTube...
            </p>
            <Input
              id="downloader"
              value={downloaderPrefix}
              onChange={(e) => setDownloaderPrefix(e.target.value)}
              placeholder="Ex: dl"
              className="max-w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
