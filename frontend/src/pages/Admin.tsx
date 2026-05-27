import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getPendingMedia,
  approveMedia,
  rejectMedia,
  getAllMedia,
  getContributionToken,
  regenerateToken,
  unpublishMedia,
  getPendingComments,
  approveComment,
  rejectComment,
} from "../lib/api";
import type { MediaItem, CommentItem } from "../lib/api";

type Tab = "pending" | "published" | "comments" | "token";

export default function Admin() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [secret, setSecret] = useState<string>(() => {
    const urlSecret = searchParams.get("secret");
    if (urlSecret) {
      sessionStorage.setItem("lsdj_admin_secret", urlSecret);
      return urlSecret;
    }
    return sessionStorage.getItem("lsdj_admin_secret") ?? "";
  });

  const [tab, setTab] = useState<Tab>("pending");
  const [pending, setPending] = useState<MediaItem[]>([]);
  const [published, setPublished] = useState<MediaItem[]>([]);
  const [pendingComments, setPendingComments] = useState<CommentItem[]>([]);
  const [token, setTokenValue] = useState<string | null>(null);
  const [access, setAccess] = useState<"loading" | "ok" | "unauthorized">("loading");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [copied, setCopied] = useState(false);

  const [inputSecret, setInputSecret] = useState("");
  const [loginError, setLoginError] = useState("");

  // Nettoyer le secret de l'URL pour ne pas le laisser visible dans l'historique
  useEffect(() => {
    if (searchParams.has("secret")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("secret");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadPending = useCallback(async () => {
    if (!secret) return;
    const data = await getPendingMedia(secret);
    setPending(data);
  }, [secret]);

  const loadPublished = useCallback(async () => {
    if (!secret) return;
    const data = await getAllMedia(secret, "approved");
    setPublished(data);
  }, [secret]);

  const loadToken = useCallback(async () => {
    if (!secret) return;
    const data = await getContributionToken(secret);
    setTokenValue(data.token);
  }, [secret]);

  const loadPendingComments = useCallback(async () => {
    if (!secret) return;
    const data = await getPendingComments(secret);
    setPendingComments(data);
  }, [secret]);

  useEffect(() => {
    if (!secret) {
      setAccess("unauthorized");
      return;
    }
    setAccess("loading");
    loadPending()
      .then(() => setAccess("ok"))
      .catch((err) => {
        if (err?.response?.status === 403) {
          sessionStorage.removeItem("lsdj_admin_secret");
          setSecret("");
          setAccess("unauthorized");
        } else {
          setAccess("unauthorized");
        }
      });
  }, [secret, loadPending]);

  useEffect(() => {
    if (access !== "ok") return;
    if (tab === "published") loadPublished();
    if (tab === "token") loadToken();
    if (tab === "comments") loadPendingComments();
  }, [tab, access, loadPublished, loadToken, loadPendingComments]);

  const handleApprove = async (id: string) => {
    await approveMedia(id, secret);
    setPending((p) => p.filter((m) => m.id !== id));
  };

  const handleReject = async (id: string) => {
    await rejectMedia(id, secret, rejectReason || undefined);
    setPending((p) => p.filter((m) => m.id !== id));
    setRejectingId(null);
    setRejectReason("");
  };

  const handleApproveComment = async (id: string) => {
    await approveComment(id, secret);
    setPendingComments((p) => p.filter((c) => c.id !== id));
  };

  const handleRejectComment = async (id: string) => {
    await rejectComment(id, secret);
    setPendingComments((p) => p.filter((c) => c.id !== id));
  };

  const handleUnpublish = async (id: string) => {
    await unpublishMedia(id, secret);
    setPublished((p) => p.filter((m) => m.id !== id));
  };

  const handleRegenerate = async () => {
    if (!confirm("Régénérer le token ? L'ancien lien ne fonctionnera plus.")) return;
    const data = await regenerateToken(secret);
    setTokenValue(data.token);
  };

  const copyToken = () => {
    if (!token) return;
    const url = `${window.location.origin}/contribuer?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSecret.trim()) return;
    setLoginError("");
    setAccess("loading");
    try {
      await getPendingMedia(inputSecret.trim());
      sessionStorage.setItem("lsdj_admin_secret", inputSecret.trim());
      setSecret(inputSecret.trim());
      setAccess("ok");
    } catch (err: any) {
      setAccess("unauthorized");
      setLoginError("Code secret administrateur invalide");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("lsdj_admin_secret");
    setSecret("");
    setAccess("unauthorized");
  };

  if (access === "loading") {
    return <LoadingScreen />;
  }

  if (access === "unauthorized") {
    return (
      <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute w-96 h-96 bg-bleu/5 rounded-full filter blur-3xl -top-20 -left-20" />
        <div className="absolute w-96 h-96 bg-jaune/10 rounded-full filter blur-3xl -bottom-20 -right-20" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-jaune" />
        
        <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-blue-100 rounded-2xl p-8 space-y-6 shadow-xl z-10">
          <div className="text-center space-y-2">
            <p className="text-bleu text-xs tracking-widest uppercase font-semibold">Espace Administrateur</p>
            <h1 className="font-serif text-3xl text-encre">Mur LSDJ</h1>
            <p className="text-slate-400 text-sm">Entrez le code secret pour accéder au tableau de bord</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2 font-medium">Code Secret</label>
              <input
                type="password"
                value={inputSecret}
                onChange={(e) => setInputSecret(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-encre placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bleu focus:border-transparent transition-all shadow-sm"
              />
            </div>
            
            {loginError && (
              <p className="text-red-500 text-xs text-center font-medium">{loginError}</p>
            )}
            
            <button
              type="submit"
              className="w-full bg-bleu text-white font-medium py-3 rounded-xl hover:bg-encre transition-colors shadow-lg shadow-bleu/10"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme">
      {/* Bande jaune */}
      <div className="h-1 bg-jaune w-full" />
      <header className="bg-bleu text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-lg">Mur LSDJ — Administration</h1>
          <p className="text-blue-300 text-xs">Le Silence des Justes · 30 ans</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/20 transition-colors"
        >
          Déconnexion
        </button>
      </header>

      {/* Tabs */}
      <div className="border-b border-blue-100 bg-white px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {(["pending", "published", "comments", "token"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-5 text-sm border-b-2 transition-colors ${
                tab === t
                  ? "border-bleu text-bleu font-medium"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "pending" && `En attente (${pending.length})`}
              {t === "published" && "Publiés"}
              {t === "comments" && `Témoignages (${pendingComments.length})`}
              {t === "token" && "Lien contribution"}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Tab: En attente */}
        {tab === "pending" && (
          <div className="space-y-4">
            {pending.length === 0 && (
              <p className="text-slate-400 text-center py-16">Aucune contribution en attente.</p>
            )}
            {pending.map((item) => {
              const isText = item.file_url?.startsWith("text://");
              return (
              <div key={item.id} className="bg-white rounded-xl border border-blue-100 overflow-hidden flex gap-0">
                <div className="w-40 h-36 shrink-0 bg-blue-50 overflow-hidden flex items-center justify-center">
                  {isText ? (
                    <div className="w-full h-full bg-gradient-to-br from-bleu to-encre flex items-center justify-center p-3">
                      <span className="font-serif text-white/80 text-3xl leading-none">"</span>
                    </div>
                  ) : (
                  <img
                    src={item.thumbnail_url ?? item.file_url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isText ? "bg-indigo-50 text-indigo-600" : item.type === "video" ? "bg-blue-50 text-blue-600" : "bg-blue-50 text-slate-500"}`}>
                        {isText ? "témoignage" : item.type}
                      </span>
                      {item.date_prise && (
                        <span className="text-xs text-slate-400">
                          {new Date(item.date_prise).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{item.legende ?? <em className="text-slate-400">Sans légende</em>}</p>
                    {(item.uploaded_by || isText) && (
                      <p className="text-xs text-bleu/60 mt-0.5 font-medium">
                        {isText ? item.file_url.replace("text://", "") : item.uploaded_by}
                      </p>
                    )}
                    <p className="text-xs text-blue-200 mt-1">
                      Reçu {new Date(item.uploaded_at ?? "").toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {rejectingId === item.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Raison du rejet (optionnel)"
                        rows={2}
                        className="w-full text-xs border border-blue-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-stone-300"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(item.id)}
                          className="text-xs bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600"
                        >
                          Confirmer le rejet
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="text-xs text-slate-400 hover:text-slate-600 px-2"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(item.id)}
                        className="text-xs bg-bleu text-white px-4 py-1.5 rounded-lg hover:bg-encre"
                      >
                        Approuver
                      </button>
                      <button
                        onClick={() => setRejectingId(item.id)}
                        className="text-xs border border-blue-100 text-slate-500 px-4 py-1.5 rounded-lg hover:border-stone-400"
                      >
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}

        {/* Tab: Publiés */}
        {tab === "published" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {published.length === 0 && (
              <p className="text-slate-400 text-center py-16 col-span-full">Aucun média publié.</p>
            )}
            {published.map((item) => {
              const isTextPub = item.file_url?.startsWith("text://");
              return (
              <div key={item.id} className="relative group rounded-xl overflow-hidden bg-blue-50 aspect-square">
                {isTextPub ? (
                  <div className="w-full h-full bg-gradient-to-br from-bleu to-encre flex items-center justify-center p-4">
                    <p className="font-serif text-white/90 text-xs text-center line-clamp-4 italic">« {item.legende} »</p>
                  </div>
                ) : (
                <img
                  src={item.thumbnail_url ?? item.file_url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleUnpublish(item.id)}
                    className="text-xs bg-white text-encre px-3 py-1.5 rounded-lg hover:bg-blue-50"
                  >
                    Dépublier
                  </button>
                </div>
                {item.annee && (
                  <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                    {item.annee}
                  </span>
                )}
                {isTextPub && (
                  <span className="absolute top-2 right-2 text-[10px] bg-indigo-600/80 text-white px-1.5 py-0.5 rounded-full">
                    texte
                  </span>
                )}
              </div>
            );
            })}
          </div>
        )}

        {/* Tab: Témoignages en attente */}
        {tab === "comments" && (
          <div className="space-y-4">
            {pendingComments.length === 0 && (
              <p className="text-slate-400 text-center py-16">Aucun témoignage en attente de modération.</p>
            )}
            {pendingComments.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-blue-100 overflow-hidden flex gap-4 p-4 items-center">
                {c.media_thumbnail && (
                  <div className="w-16 h-16 shrink-0 bg-blue-50 rounded-lg overflow-hidden border border-blue-100">
                    <img src={c.media_thumbnail} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-bleu bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 rounded-full">{c.author}</span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Reçu le {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-sans italic">"{c.content}"</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveComment(c.id)}
                    className="text-xs bg-bleu text-white px-3 py-1.5 rounded-lg hover:bg-encre transition-colors font-semibold"
                  >
                    Approuver
                  </button>
                  <button
                    onClick={() => handleRejectComment(c.id)}
                    className="text-xs border border-red-100 text-red-500 bg-red-50/20 px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition-colors font-semibold"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Token */}
        {tab === "token" && (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl border border-blue-100 p-6 space-y-5">
              <div>
                <h2 className="font-medium text-encre mb-1">Lien de contribution</h2>
                <p className="text-slate-400 text-sm">
                  Partagez ce lien à la communauté pour qu'elle puisse uploader des photos et vidéos.
                </p>
              </div>

              {token ? (
                <>
                  <div className="bg-creme/60 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-slate-400 mb-1">URL complète</p>
                    <p className="text-sm font-mono text-slate-600 break-all">
                      {window.location.origin}/contribuer?token={token}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={copyToken}
                      className="flex-1 bg-bleu text-white py-2.5 rounded-xl text-sm font-medium hover:bg-encre transition-colors"
                    >
                      {copied ? "Copié !" : "Copier le lien"}
                    </button>
                    <button
                      onClick={handleRegenerate}
                      className="border border-blue-100 text-slate-500 px-4 rounded-xl text-sm hover:border-bleu"
                    >
                      Régénérer
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 text-sm">Chargement…</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-creme flex items-center justify-center">
      <p className="text-slate-400 text-sm animate-pulse">Vérification…</p>
    </div>
  );
}
