import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MessageSquare, Image, Send, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ScheduledItem {
  id: string;
  type: "status" | "message";
  content: string;
  recipient?: string;
  scheduledDate: string;
  scheduledTime: string;
  hasMedia: boolean;
}

const mockScheduled: ScheduledItem[] = [
  {
    id: "1",
    type: "status",
    content: "Nouveau produit disponible ! 🚀",
    scheduledDate: "2024-01-15",
    scheduledTime: "09:00",
    hasMedia: true,
  },
  {
    id: "2",
    type: "message",
    content: "N'oubliez pas notre réunion demain !",
    recipient: "Équipe Marketing",
    scheduledDate: "2024-01-14",
    scheduledTime: "18:00",
    hasMedia: false,
  },
];

export const SchedulerModule = () => {
  const [scheduled, setScheduled] = useState<ScheduledItem[]>(mockScheduled);
  const [content, setContent] = useState("");
  const [recipient, setRecipient] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleAddSchedule = (type: "status" | "message") => {
    if (!content || !date || !time) return;

    const newItem: ScheduledItem = {
      id: Date.now().toString(),
      type,
      content,
      recipient: type === "message" ? recipient : undefined,
      scheduledDate: date,
      scheduledTime: time,
      hasMedia: false,
    };

    setScheduled([...scheduled, newItem]);
    setContent("");
    setRecipient("");
    setDate("");
    setTime("");
  };

  const handleDelete = (id: string) => {
    setScheduled(scheduled.filter((item) => item.id !== id));
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Double Scheduler
          </h2>
          <p className="text-xs text-muted-foreground">
            Programmez vos statuts et messages directs
          </p>
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 mb-6">
          <TabsTrigger
            value="status"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <Image className="w-4 h-4 mr-2" />
            Statuts
          </TabsTrigger>
          <TabsTrigger
            value="messages"
            className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Messages Directs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {/* New Status Form */}
          <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Contenu du statut</Label>
              <Textarea
                placeholder="Écrivez votre statut ici..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-20 bg-secondary/50 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Heure</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="glass" className="flex-1">
                <Image className="w-4 h-4 mr-2" />
                Ajouter média
              </Button>
              <Button
                variant="neon"
                className="flex-1"
                onClick={() => handleAddSchedule("status")}
              >
                <Plus className="w-4 h-4 mr-2" />
                Programmer
              </Button>
            </div>
          </div>

          {/* Scheduled Statuses */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Statuts programmés
            </h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {scheduled
                  .filter((item) => item.type === "status")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{item.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.scheduledDate} à {item.scheduledTime}
                          {item.hasMedia && (
                            <span className="px-2 py-0.5 bg-accent/20 text-accent rounded">
                              Média
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          {/* New Message Form */}
          <div className="p-4 bg-secondary/30 rounded-xl space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Destinataire</Label>
              <Input
                placeholder="Nom ou numéro de téléphone"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Message</Label>
              <Textarea
                placeholder="Écrivez votre message ici..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-20 bg-secondary/50 border-border"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Heure</Label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="glass" className="flex-1">
                <Image className="w-4 h-4 mr-2" />
                Ajouter média
              </Button>
              <Button
                variant="neon"
                className="flex-1"
                onClick={() => handleAddSchedule("message")}
              >
                <Send className="w-4 h-4 mr-2" />
                Programmer
              </Button>
            </div>
          </div>

          {/* Scheduled Messages */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Messages programmés
            </h3>
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {scheduled
                  .filter((item) => item.type === "message")
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-accent mb-1">À : {item.recipient}</p>
                        <p className="text-sm text-foreground truncate">{item.content}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {item.scheduledDate} à {item.scheduledTime}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
