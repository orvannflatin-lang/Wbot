import { Archive, Cloud, Trash2, Download, Image, Video, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArchivedItem {
  id: string;
  type: "image" | "video";
  thumbnail: string;
  source: string;
  savedAt: string;
  expiresIn: number; // days
}

const mockArchives: ArchivedItem[] = [
  {
    id: "1",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=200&fit=crop",
    source: "Statut - Alice",
    savedAt: "2024-01-13",
    expiresIn: 3,
  },
  {
    id: "2",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=200&h=200&fit=crop",
    source: "Vue unique - Bob",
    savedAt: "2024-01-12",
    expiresIn: 2,
  },
  {
    id: "3",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=200&h=200&fit=crop",
    source: "Statut - Claire",
    savedAt: "2024-01-11",
    expiresIn: 1,
  },
  {
    id: "4",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200&h=200&fit=crop",
    source: "Instagram - @user",
    savedAt: "2024-01-10",
    expiresIn: 4,
  },
  {
    id: "5",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=200&h=200&fit=crop",
    source: "TikTok - @creator",
    savedAt: "2024-01-09",
    expiresIn: 3,
  },
  {
    id: "6",
    type: "image",
    thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop",
    source: "Statut - David",
    savedAt: "2024-01-08",
    expiresIn: 2,
  },
];

export const ArchivesModule = () => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Archive className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Archives
            </h2>
            <p className="text-xs text-muted-foreground">
              Galerie Cloudinary • {mockArchives.length} fichiers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-lg">
          <Cloud className="w-4 h-4 text-accent" />
          <span className="text-xs text-accent">Cloudinary</span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center gap-3 p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-xl">
        <Clock className="w-5 h-5 text-destructive shrink-0" />
        <p className="text-sm text-destructive">
          Les fichiers sont automatiquement supprimés après <strong>4 jours</strong>. 
          Téléchargez-les pour les conserver.
        </p>
      </div>

      {/* Gallery Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {mockArchives.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden bg-secondary/30 aspect-square"
            >
              {/* Thumbnail */}
              <img
                src={item.thumbnail}
                alt={item.source}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Type Badge */}
              <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-md flex items-center gap-1">
                {item.type === "image" ? (
                  <Image className="w-3 h-3 text-primary" />
                ) : (
                  <Video className="w-3 h-3 text-accent" />
                )}
                <span className="text-xs text-foreground capitalize">{item.type}</span>
              </div>

              {/* Expiry Badge */}
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs ${
                  item.expiresIn <= 1
                    ? "bg-destructive/80 text-destructive-foreground"
                    : "bg-background/80 text-foreground"
                }`}
              >
                {item.expiresIn}j
              </div>

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs text-foreground mb-2 truncate">{item.source}</p>
                  <div className="flex gap-2">
                    <Button variant="glass" size="sm" className="flex-1">
                      <Download className="w-3 h-3 mr-1" />
                      Télécharger
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Storage Info */}
      <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Espace utilisé</span>
          <span className="text-sm text-foreground">127 MB / 500 MB</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            style={{ width: "25.4%" }}
          />
        </div>
      </div>
    </div>
  );
};
