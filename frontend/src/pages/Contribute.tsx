import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { uploadMedia, getUploadSignature, registerMedia } from "../lib/api";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function Contribute() {
  const [tab, setTab] = useState<"media" | "testimony">("media");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legende, setLegende] = useState("");
  const [auteur, setAuteur] = useState("");
  const [datePrise, setDatePrise] = useState("");
  const [rgpdOk, setRgpdOk] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideoFile = (f: File) =>
    f.type.startsWith("video/") || /\.(mp4|mov|webm|avi|mkv|m4v|3gp)$/i.test(f.name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === "media" && !file) return;
    if (tab === "testimony" && !legende.trim()) return;
    if (!rgpdOk) return;

    setState("uploading");
    setErrorMsg("");
    setProgress(0);

    // Text testimony — backend only, no file
    if (tab === "testimony") {
      const formData = new FormData();
      formData.append("rgpd_ok", "true");
      if (datePrise) formData.append("date_prise", datePrise);
      if (auteur.trim()) formData.append("auteur", auteur.trim());
      formData.append("legende", legende.trim());
      try {
        await uploadMedia(formData);
        setState("success");
      } catch (err: unknown) {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setErrorMsg(detail ?? "Une erreur est survenue. Réessayez.");
        setState("error");
      }
      return;
    }

    // Photo / vidéo — upload direct Cloudinary (bypasse la limite Vercel)
    try {
      const sig = await getUploadSignature();
      const resourceType = isVideoFile(file!) ? "video" : "image";

      const cdnForm = new FormData();
      cdnForm.append("file", file!);
      cdnForm.append("api_key", sig.api_key);
      cdnForm.append("timestamp", String(sig.timestamp));
      cdnForm.append("signature", sig.signature);
      cdnForm.append("folder", sig.folder);

      const cdnUrl = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/${resourceType}/upload`;

      const cdnResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", cdnUrl);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 90));
        };
        xhr.onload = () => {
          if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
          else reject(new Error("Échec de l'envoi vers Cloudinary"));
        };
        xhr.onerror = () => reject(new Error("Erreur réseau"));
        xhr.send(cdnForm);
      });

      setProgress(95);

      const regForm = new FormData();
      regForm.append("file_url", cdnResult.secure_url);
      regForm.append("public_id", cdnResult.public_id);
      regForm.append("resource_type", resourceType);
      regForm.append("rgpd_ok", "true");
      if (datePrise) regForm.append("date_prise", datePrise);
      if (auteur.trim()) regForm.append("auteur", auteur.trim());
      if (legende.trim()) regForm.append("legende", legende.trim());

      await registerMedia(regForm);
      setProgress(100);
      setState("success");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setErrorMsg(detail ?? "Une erreur est survenue. Réessayez.");
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-creme flex flex-col">
      <div className="h-1 bg-jaune w-full shrink-0" />
      <header className="flex items-center px-4 py-3">
        <Link to="/" className="text-slate-400 hover:text-encre transition-colors text-sm flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
          Retour
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        <div className="w-full max-w-xl">
          <header className="mb-8 text-center">
            <p className="text-bleu text-xs tracking-widest uppercase mb-2">Le Silence des Justes · 30 ans</p>
            <h1 className="font-serif text-2xl sm:text-3xl text-encre">Une infinité d'histoires</h1>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-px w-6 bg-jaune" />
              <span className="text-jaune font-serif text-sm">Partagez votre souvenir</span>
              <div className="h-px w-6 bg-jaune" />
            </div>
          </header>

          <AnimatePresence mode="wait">
            {state === "success" ? (
              <SuccessMessage key="success" onReset={() => {
                setState("idle");
                setFile(null);
                setPreview(null);
                setLegende("");
                setAuteur("");
                setDatePrise("");
                setRgpdOk(false);
                setProgress(0);
              }} />
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 sm:p-8 space-y-5"
              >
                {/* Onglets */}
                <div className="flex gap-1 bg-creme p-1 rounded-xl border border-blue-50/50">
                  <button
                    type="button"
                    onClick={() => { setTab("media"); setErrorMsg(""); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      tab === "media" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
                    }`}
                  >
                    Photo / Vidéo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab("testimony"); setErrorMsg(""); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      tab === "testimony" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
                    }`}
                  >
                    Témoignage
                  </button>
                </div>

                {/* Nom */}
                <div>
                  <label className="block text-xs font-medium text-encre mb-1.5">
                    Nom / Prénom <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={auteur}
                    onChange={(e) => setAuteur(e.target.value)}
                    placeholder="Ex: Famille Cohen, Éducateur Rachid…"
                    maxLength={100}
                    className="w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm text-encre placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-bleu"
                  />
                </div>

                {/* Zone upload */}
                {tab === "media" && (
                  <div>
                    <label className="block text-xs font-medium text-encre mb-1.5">
                      Fichier <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-100 rounded-xl p-4 text-center cursor-pointer hover:border-bleu transition-colors"
                    >
                      {preview ? (
                        file && isVideoFile(file) ? (
                          <video
                            src={preview}
                            className="mx-auto max-h-36 rounded-lg"
                            controls
                            playsInline
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <img src={preview} alt="aperçu" className="mx-auto max-h-36 rounded-lg object-contain" />
                        )
                      ) : (
                        <div className="space-y-1.5 text-slate-400 py-2">
                          <svg className="mx-auto w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0-3 3m3-3 3 3M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
                          </svg>
                          <p className="text-sm">Appuyez pour sélectionner</p>
                          <p className="text-xs">JPG, PNG, WebP, MP4, MOV — max 100 Mo</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                )}

                {/* Légende / Témoignage */}
                <div>
                  <label className="block text-xs font-medium text-encre mb-1.5">
                    {tab === "media" ? "Légende" : "Témoignage"}{" "}
                    {tab === "testimony" && <span className="text-red-500">*</span>}
                  </label>
                  <textarea
                    value={legende}
                    onChange={(e) => setLegende(e.target.value)}
                    placeholder={tab === "media" ? "Décrivez ce souvenir, le lieu, les personnes…" : "Racontez une anecdote, un mot pour l'association…"}
                    rows={3}
                    maxLength={500}
                    required={tab === "testimony"}
                    className="w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm text-encre placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-bleu resize-none"
                  />
                  <p className="text-right text-xs text-slate-400 mt-0.5">{legende.length}/500</p>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-encre mb-1.5">
                    Date <span className="text-slate-400 font-normal">(optionnel — apparaît dans la timeline)</span>
                  </label>
                  <input
                    type="date"
                    value={datePrise}
                    onChange={(e) => setDatePrise(e.target.value)}
                    min="1996-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-blue-100 px-3 py-2.5 text-sm text-encre focus:outline-none focus:ring-2 focus:ring-bleu"
                  />
                </div>

                {/* RGPD */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rgpdOk}
                    onChange={(e) => setRgpdOk(e.target.checked)}
                    className="mt-0.5 accent-bleu shrink-0"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    J'atteste avoir le droit de partager ce contenu et j'accepte qu'il soit publié après validation.{" "}
                    <Link to="/mentions-legales" target="_blank" className="text-bleu hover:underline">Mentions légales & RGPD</Link>
                  </span>
                </label>

                {/* Barre de progression */}
                {state === "uploading" && (
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-blue-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-bleu rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center">{progress < 90 ? "Envoi en cours…" : "Finalisation…"}</p>
                  </div>
                )}

                {state === "error" && (
                  <p className="text-red-500 text-sm text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={(tab === "media" && !file) || (tab === "testimony" && !legende.trim()) || !rgpdOk || state === "uploading"}
                  className="w-full bg-bleu text-white py-3 rounded-xl font-medium tracking-wide hover:bg-encre transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {state === "uploading" ? "Envoi…" : tab === "media" ? "Partager ce souvenir" : "Envoyer mon témoignage"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SuccessMessage({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-blue-100 p-10 text-center space-y-4"
    >
      <div className="w-14 h-14 bg-jaune/10 rounded-full flex items-center justify-center mx-auto border-2 border-jaune">
        <svg className="w-7 h-7 text-jaune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl text-encre">Merci pour votre contribution !</h2>
      <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
        Votre souvenir a bien été reçu. Il sera publié après validation par notre équipe.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onReset}
          className="text-bleu text-sm underline hover:text-encre transition-colors"
        >
          Partager un autre souvenir
        </button>
        <span className="text-slate-300 hidden sm:inline">·</span>
        <Link to="/" className="text-slate-400 text-sm hover:text-encre transition-colors">← Retour au fil</Link>
      </div>
    </motion.div>
  );
}
