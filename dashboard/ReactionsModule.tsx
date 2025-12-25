import { useState, useRef, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Heart, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

export const ReactionsModule = () => {
  const [autoLikeEnabled, setAutoLikeEnabled] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState("❤️");
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEmojiSelect = (emoji: { native: string }) => {
    setSelectedEmoji(emoji.native);
    setShowPicker(false);
  };

  return (
    <div className="glass-card p-6">
      <h2 className="font-display text-xl font-semibold text-foreground mb-6">
        Module Réactions
      </h2>

      <div className="space-y-6">
        {/* Auto-Like Toggle */}
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Label htmlFor="autoLike" className="text-foreground font-medium cursor-pointer">
                Auto-Like Statuts
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Réagir automatiquement aux statuts de vos contacts
              </p>
            </div>
          </div>
          <Switch
            id="autoLike"
            checked={autoLikeEnabled}
            onCheckedChange={setAutoLikeEnabled}
          />
        </div>

        {/* Emoji Picker */}
        <div className="p-4 bg-secondary/30 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <Smile className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-foreground font-medium">Émoji de réaction</p>
              <p className="text-xs text-muted-foreground">
                Choisissez l'émoji utilisé pour les réactions automatiques
              </p>
            </div>
          </div>

          <div className="relative" ref={pickerRef}>
            <Button
              variant="glass"
              size="lg"
              onClick={() => setShowPicker(!showPicker)}
              className="text-3xl px-6"
            >
              {selectedEmoji}
            </Button>

            {showPicker && (
              <div className="absolute top-full left-0 mt-2 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="dark"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Émoji actuel : <span className="text-lg">{selectedEmoji}</span>
          </p>
        </div>

        {/* Stats */}
        {autoLikeEnabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-primary/10 rounded-xl text-center">
              <p className="font-display text-2xl font-bold text-primary">128</p>
              <p className="text-xs text-muted-foreground">Réactions aujourd'hui</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-xl text-center">
              <p className="font-display text-2xl font-bold text-accent">47</p>
              <p className="text-xs text-muted-foreground">Statuts vus</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
