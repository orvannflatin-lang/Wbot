import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Search, Users, Ghost, Phone, Loader2, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string; // This is the JID
  name: string;
  phone: string;
  ghostEnabled: boolean;
}

export const ContactsModule = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('contacts_settings')
        .select('*')
        .eq('session_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;

      const formattedContacts: Contact[] = data.map((c: any) => ({
        id: c.jid,
        name: c.name || c.jid.split('@')[0],
        phone: c.jid.split('@')[0],
        ghostEnabled: c.ghost_mode || false,
      }));

      setContacts(formattedContacts);
    } catch (err: any) {
      console.error("Error fetching contacts:", err);
      toast({
        title: "Erreur",
        description: "Impossible de charger les contacts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGhost = async (jid: string, currentStatus: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newStatus = !currentStatus;

      const { error } = await supabase
        .from('contacts_settings')
        .update({ ghost_mode: newStatus })
        .eq('session_id', user.id)
        .eq('jid', jid);

      if (error) throw error;

      setContacts((prev) =>
        prev.map((contact) =>
          contact.id === jid ? { ...contact, ghostEnabled: newStatus } : contact
        )
      );

      toast({
        title: newStatus ? "Ghost Mode activé" : "Ghost Mode désactivé",
        description: `Paramètre mis à jour pour le contact.`,
      });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Échec de la mise à jour du mode Ghost",
        variant: "destructive",
      });
    }
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const ghostCount = contacts.filter((c) => c.ghostEnabled).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              CRM Contacts
            </h2>
            <p className="text-xs text-muted-foreground">
              {contacts.length} contacts synchronisés
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              setIsSyncing(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const response = await fetch('http://localhost:3000/api/contacts/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId: user.id }),
                });

                if (response.ok) {
                  toast({
                    title: "Synchronisation lancée",
                    description: "Le bot récupère vos contacts. Réactualisez dans un instant.",
                  });
                  setTimeout(fetchContacts, 4000);
                } else {
                  throw new Error();
                }
              } catch (err) {
                toast({
                  title: "Erreur",
                  description: "Impossible de forcer la sync",
                  variant: "destructive"
                });
              } finally {
                setIsSyncing(false);
              }
            }}
            disabled={isSyncing}
            title="Forcer la synchronisation avec WhatsApp"
          >
            <Ghost className={`w-4 h-4 text-primary ${isSyncing ? 'animate-pulse' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchContacts} disabled={isSyncing}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
          {ghostCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-lg">
              <Ghost className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">{ghostCount} en Ghost</span>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Rechercher un contact..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-11"
        />
      </div>

      {/* Contacts List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${contact.ghostEnabled
                ? "bg-primary/10 border border-primary/30"
                : "bg-secondary/30 hover:bg-secondary/50"
                }`}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <span className="text-foreground font-semibold text-sm">
                    {contact.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{contact.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {contact.ghostEnabled && (
                  <Ghost className="w-4 h-4 text-primary" />
                )}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Ghost</span>
                  <Switch
                    checked={contact.ghostEnabled}
                    onCheckedChange={() => toggleGhost(contact.id, contact.ghostEnabled)}
                  />
                </div>
              </div>
            </div>
          ))}

          {filteredContacts.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun contact trouvé</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
