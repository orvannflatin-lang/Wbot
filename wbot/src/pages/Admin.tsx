import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const SERVER_URL = "http://localhost:3000";

const Admin = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${SERVER_URL}/api/admin/users`);
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors du chargement des utilisateurs");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) return;

        try {
            const res = await fetch(`${SERVER_URL}/api/admin/users/${userId}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Failed to delete user");

            toast.success("Utilisateur supprimé");
            fetchUsers(); // Refresh
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la suppression");
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    if (loading) return <div className="p-8 text-center text-foreground">Chargement...</div>;

    const isLimitReached = users.length > 15;

    return (
        <div className="w-full max-w-6xl mx-auto space-y-4 md:space-y-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 md:space-y-6"
            >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
                        <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                        Administration
                    </h1>
                    <div className="text-sm text-muted-foreground">
                        Total : <span className={`font-bold ${isLimitReached ? "text-red-500" : "text-primary"}`}>{users.length}</span> / 15
                    </div>
                </div>

                {isLimitReached && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 sm:p-4 flex items-start gap-3 text-destructive text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>Limite de 15 utilisateurs dépassée ! Supprimez des comptes inactifs.</p>
                    </div>
                )}

                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase">
                                <tr>
                                    <th className="p-3 sm:p-4">Email</th>
                                    <th className="p-3 sm:p-4 hidden sm:table-cell">ID</th>
                                    <th className="p-3 sm:p-4 hidden md:table-cell">Créé le</th>
                                    <th className="p-3 sm:p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-accent/5 transition-colors">
                                        <td className="p-3 sm:p-4">
                                            <div className="text-foreground font-medium text-sm break-all">{user.email}</div>
                                            <div className="text-xs text-muted-foreground sm:hidden mt-1">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4 hidden sm:table-cell text-muted-foreground text-xs font-mono">
                                            <div className="max-w-[150px] truncate">{user.id}</div>
                                        </td>
                                        <td className="p-3 sm:p-4 hidden md:table-cell text-muted-foreground text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 sm:p-4 text-right">
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => handleDelete(user.id)}
                                                className="h-8 w-8 hover:bg-destructive/90"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                Aucun utilisateur trouvé.
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Admin;
