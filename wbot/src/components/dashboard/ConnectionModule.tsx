import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { QrCode, Smartphone, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import io, { Socket } from "socket.io-client";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

export const ConnectionModule = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pairingCode, setPairingCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "starting" | "qr" | "connected" | "reconnecting" | "logged_out">("disconnected");
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    let isSubscribed = true;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !isSubscribed) return;

      const sid = user.id;
      setSessionId(sid);

      // 1. Initial Status Check
      setIsLoading(true);
      try {
        const res = await fetch(`${SERVER_URL}/api/session/status/${sid}`);
        const data = await res.json();
        if (isSubscribed) {
          setConnectionStatus(data.status);
        }
      } catch (e) {
        console.error("Failed to fetch initial status", e);
      } finally {
        if (isSubscribed) setIsLoading(false);
      }

      // 2. Socket setup
      const newSocket = io(SERVER_URL);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to backend SIO");
        newSocket.emit("join-session", sid);

        fetch(`${SERVER_URL}/api/session/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sid })
        }).catch(err => console.error("Start error", err));
      });

      newSocket.on("qr", async ({ qr }) => {
        if (!isSubscribed) return;
        try {
          const url = await QRCode.toDataURL(qr);
          setQrCodeUrl(url);
          setConnectionStatus("qr");
          setIsLoading(false);
        } catch (err) {
          console.error(err);
        }
      });

      newSocket.on("pairing-code", ({ code }) => {
        if (isSubscribed) {
          setPairingCode(code);
          setIsLoading(false);
        }
      });

      newSocket.on("status", (data) => {
        console.log("Status update from SIO:", data);
        if (!isSubscribed) return;
        setConnectionStatus(data.status);

        if (data.status === 'connected') {
          setIsLoading(false);
          setQrCodeUrl("");
        } else if (data.status === 'disconnected' || data.status === 'logged_out') {
          setQrCodeUrl("");
          setPairingCode("");
          setIsLoading(false);
        } else if (data.status === 'starting' || data.status === 'reconnecting') {
          setIsLoading(true);
        }
      });

      return () => {
        newSocket.disconnect();
      };
    };

    init();

    return () => {
      isSubscribed = false;
    };
  }, []);

  const handleReset = async () => {
    setIsLoading(true);
    try {
      await fetch(`${SERVER_URL}/api/session/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
      setIsConnected(false);
      setQrCodeUrl("");
      setPairingCode("");
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePairingCode = () => {
    if (!socket || !phoneNumber) return;
    setIsLoading(true);
    socket.emit('request-pairing-code', { sessionId, phoneNumber });
  };

  if (connectionStatus === "connected") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 space-y-6"
      >
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse mx-auto">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">WBOT est ACTIF 🚀</h2>
            <p className="text-muted-foreground">Votre session WhatsApp est opérationnelle et prête à l'emploi.</p>
          </div>
        </div>

        {/* SESSION_ID Display */}
        <div className="p-6 bg-primary/10 rounded-2xl border-2 border-primary/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              🔑 Votre SESSION_ID pour Render
            </h3>
          </div>
          <div className="p-4 bg-secondary/50 rounded-lg font-mono text-xs break-all text-foreground">
            WBOT-MD_V4_{sessionId}
          </div>
          <Button
            variant="neon"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(`WBOT-MD_V4_${sessionId}`);
              toast({
                title: "✅ Copié !",
                description: "SESSION_ID copié dans le presse-papiers",
              });
            }}
          >
            📋 Copier le SESSION_ID
          </Button>

          <div className="pt-4 border-t border-primary/20 space-y-3 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">📌 Instructions pour Render :</p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Allez sur <span className="text-primary font-mono">render.com</span></li>
              <li>Créez un nouveau <span className="text-primary">Web Service</span></li>
              <li>Connectez le repo GitHub : <span className="text-primary font-mono">orvannflatin-lang/Wbot</span></li>
              <li>Dans <span className="text-primary">Environment Variables</span>, ajoutez :</li>
            </ol>
            <div className="p-3 bg-secondary/30 rounded-lg font-mono text-xs space-y-1">
              <div>PORT=10000</div>
              <div>SESSION_ID=<span className="text-primary">WBOT-MD_V4_{sessionId}</span></div>
              <div>OWNER_ID=<span className="text-primary">{sessionId}</span></div>
            </div>
            <p className="text-xs italic">✨ Votre bot se connectera automatiquement sans rescanner de QR !</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-white/10"
          >
            Rafraîchir
          </Button>
          <Button
            variant="secondary"
            onClick={async () => {
              setIsLoading(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                await fetch(`${SERVER_URL}/api/session/start`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId: user.id })
                });
                toast({
                  title: "Redémarrage lancé",
                  description: "Le bot tente de se reconnecter...",
                });
              } catch (e) {
                console.error(e);
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Smartphone className="w-4 h-4 mr-2" />}
            Réparer / Redémarrer
          </Button>
          <Button variant="destructive" onClick={handleReset}>
            Déconnecter
          </Button>
        </div>
      </motion.div>
    );
  }

  const isShowLoading = isLoading || connectionStatus === "starting" || connectionStatus === "reconnecting";

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-foreground mb-1">
          Lien WhatsApp {connectionStatus === "reconnecting" && "(Reconnexion...)"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {connectionStatus === "starting" ? "Initialisation du moteur WhatsApp..." : "Connectez votre compte pour activer les fonctionnalités"}
        </p>
      </div>

      <Tabs defaultValue="qr" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-secondary/30">
          <TabsTrigger value="qr" className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="pairing" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Code de jumelage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr" className="space-y-6">
          <div className="flex flex-col items-center justify-center p-8 bg-secondary/20 rounded-2xl border-2 border-dashed border-secondary/50">
            {isShowLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  {connectionStatus === "starting" ? "Initialisation..." : connectionStatus === "reconnecting" ? "Reconnexion..." : "Génération du code..."}
                </p>
              </div>
            ) : qrCodeUrl ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                <div className="p-4 bg-white rounded-xl">
                  <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                  <Button variant="neon" size="sm" onClick={() => window.location.reload()}>
                    Actualiser
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                  Cliquez ci-dessous pour générer un nouveau code QR
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Générer le code
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                1
              </span>
              Ouvrez WhatsApp sur votre téléphone
            </h3>
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                2
              </span>
              Menu {">"} Appareils connectés {">"} Connecter un appareil
            </h3>
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                3
              </span>
              Pointez votre téléphone vers cet écran
            </h3>
          </div>

          <div className="pt-4 border-t border-secondary/30">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleReset}>
              Réinitialiser la session
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="pairing" className="space-y-6">
          <div className="p-6 bg-secondary/20 rounded-2xl space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                placeholder="+241 00 00 00 00"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-secondary/30"
              />
            </div>
            <Button
              className="w-full"
              variant="neon"
              onClick={handleGeneratePairingCode}
              disabled={isLoading || !phoneNumber}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                "Recevoir le code"
              )}
            </Button>
          </div>

          {pairingCode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-primary/10 rounded-2xl border border-primary/30 text-center"
            >
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                Votre code de jumelage
              </p>
              <p className="text-4xl font-mono font-bold text-primary tracking-[0.2em]">
                {pairingCode}
              </p>
            </motion.div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                1
              </span>
              Saisissez votre numéro avec l'indicatif
            </h3>
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                2
              </span>
              Entrez le code reçu sur votre téléphone
            </h3>
          </div>

          <div className="pt-4 border-t border-secondary/30">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleReset}>
              Réinitialiser la session
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
