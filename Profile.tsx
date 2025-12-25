import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Calendar, BarChart3, MessageSquare, Trash, Eye, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Profile = () => {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }
                setUser(user);

                // Fetch stats from user_stats table
                const { data: statsData } = await supabase
                    .from('user_stats')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                setStats(statsData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-foreground">Chargement...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-muted-foreground">Veuillez vous connecter</div>;
    }

    const fullName = user.user_metadata?.full_name || "Utilisateur";
    const email = user.email;
    const createdAt = new Date(user.created_at).toLocaleDateString('fr-FR');

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-8"
            >
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <span className="text-2xl font-bold text-foreground">
                            {fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground">{fullName}</h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4" />
                            {email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4" />
                            Membre depuis le {createdAt}
                        </p>
                    </div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <h2 className="text-xl font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Statistiques d'utilisation
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Messages traités</p>
                                <p className="text-2xl font-bold text-foreground">{stats?.messages_processed || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
                                <Trash className="w-5 h-5 text-destructive" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Messages supprimés capturés</p>
                                <p className="text-2xl font-bold text-foreground">{stats?.deleted_messages_captured || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Statuts sauvegardés</p>
                                <p className="text-2xl font-bold text-foreground">{stats?.statuses_saved || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Réponses IA envoyées</p>
                                <p className="text-2xl font-bold text-foreground">{stats?.ai_replies_sent || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
