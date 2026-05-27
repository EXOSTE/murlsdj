import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { uploadMedia } from "../lib/api";

type UploadState = "idle" | "uploading" | "success" | "error" | "invalid_token";

const compressImage = (file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Image compression failed"));
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function Contribute() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [tab, setTab] = useState<"media" | "testimony">("media");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [legende, setLegende] = useState("");
  const [auteur, setAuteur] = useState("");
  const [datePrise, setDatePrise] = useState("");
  const [rgpdOk, setRgpdOk] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!token) return <InvalidLink />;

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

    const formData = new FormData();
    formData.append("token", token);
    formData.append("rgpd_ok", "true");
    if (datePrise) formData.append("date_prise", datePrise);
    if (auteur.trim()) formData.append("auteur", auteur.trim());

    if (tab === "media" && file) {
      let fileToSend: File | Blob = file;
      if (file.type.startsWith("image/")) {
        try {
          fileToSend = await compressImage(file);
        } catch (err) {
          console.warn("Client-side compression failed, uploading original:", err);
        }
      }
      formData.append("file", fileToSend, file.name);
      if (legende.trim()) formData.append("legende", legende.trim());
    } else {
      // Written testimony
      formData.append("legende", legende.trim());
    }

    try {
      await uploadMedia(formData);
      setState("success");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setState("invalid_token");
      } else {
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setErrorMsg(detail ?? "Une erreur est survenue. Réessayez.");
        setState("error");
      }
    }
  };

  if (state === "invalid_token") return <InvalidLink />;

  return (
    <div className="min-h-screen bg-creme flex flex-col">
      {/* Bande jaune top */}
      <div className="h-1 bg-jaune w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <header className="mb-10 text-center">
            <p className="text-bleu text-xs tracking-widest uppercase mb-2">Le Silence des Justes · 30 ans</p>
            <h1 className="font-serif text-3xl text-encre">Une infinité d'histoires</h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="h-px w-6 bg-jaune" />
              <span className="text-jaune font-serif text-sm">Partagez votre souvenir</span>
              <div className="h-px w-6 bg-jaune" />
            </div>
          </header>

          <AnimatePresence mode="wait">
            {state === "success" ? (
              <SuccessMessage key="success" />
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-sm border border-blue-100 p-8 space-y-6"
              >
                {/* Sélecteur d'onglets */}
                <div className="flex gap-1 bg-creme p-1 rounded-xl border border-blue-50/50">
                  <button
                    type="button"
                    onClick={() => { setTab("media"); setErrorMsg(""); }}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                      tab === "media" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
                    }`}
                  >
                    Photo ou Vidéo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab("testimony"); setErrorMsg(""); }}
                    className={`flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors ${
                      tab === "testimony" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
                    }`}
                  >
                    Témoignage écrit
                  </button>
                </div>

                {/* Nom de l'auteur (commun) */}
                <div>
                  <label className="block text-sm font-medium text-encre mb-2">
                    Votre nom / Prénom <span className="text-slate-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="text"
                    value={auteur}
                    onChange={(e) => setAuteur(e.target.value)}
                    placeholder="Ex: Famille Cohen, Éducateur Rachid..."
                    maxLength={100}
                    className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm text-encre placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-bleu"
                  />
                </div>

                {/* Zone upload (uniquement pour l'onglet média) */}
                {tab === "media" && (
                  <div>
                    <label className="block text-sm font-medium text-encre mb-2">
                      Photo ou vidéo <span className="text-red-500">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-blue-100 rounded-xl p-6 text-center cursor-pointer hover:border-bleu transition-colors"
                    >
                      {preview ? (
                        file?.type.startsWith("video") ? (
                          <video src={preview} className="mx-auto max-h-48 rounded-lg" controls />
                        ) : (
                          <img src={preview} alt="aperçu" className="mx-auto max-h-48 rounded-lg object-cover" />
                        )
                      ) : (
                        <div className="space-y-2 text-slate-400">
                          <svg className="mx-auto w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0-3 3m3-3 3 3M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1" />
                          </svg>
                          <p className="text-sm">Cliquez pour sélectionner un fichier</p>
                          <p className="text-xs">JPG, PNG, WebP, MP4, MOV — max 50 Mo</p>
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

                {/* Texte / Légende */}
                <div>
                  <label className="block text-sm font-medium text-encre mb-2">
                    {tab === "media" ? "Légende" : "Votre Témoignage"} <span className="text-red-500">{tab === "testimony" && "*"}</span>
                  </label>
                  <textarea
                    value={legende}
                    onChange={(e) => setLegende(e.target.value)}
                    placeholder={tab === "media" ? "Décrivez ce souvenir, le lieu, les personnes…" : "Racontez une anecdote, écrivez un mot gentil pour l'association..."}
                    rows={4}
                    maxLength={500}
                    required={tab === "testimony"}
                    className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm text-encre placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-bleu resize-none"
                  />
                  <p className="text-right text-xs text-slate-400 mt-1">{legende.length}/500</p>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-encre mb-2">
                    Date approximative{" "}
                    <span className="text-slate-400 font-normal">(optionnel — apparaîtra dans la timeline)</span>
                  </label>
                  <input
                    type="date"
                    value={datePrise}
                    onChange={(e) => setDatePrise(e.target.value)}
                    min="1994-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm text-encre focus:outline-none focus:ring-2 focus:ring-bleu"
                  />
                </div>

                {/* RGPD */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rgpdOk}
                    onChange={(e) => setRgpdOk(e.target.checked)}
                    className="mt-1 accent-bleu"
                  />
                  <span className="text-xs text-slate-500 leading-relaxed">
                    J'atteste avoir le droit de partager ce contenu et j'accepte qu'il soit publié sur la plateforme "Une infinité d'histoires" du Silence des Justes après validation.
                  </span>
                </label>

                {state === "error" && (
                  <p className="text-red-500 text-sm text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={(tab === "media" && !file) || (tab === "testimony" && !legende.trim()) || !rgpdOk || state === "uploading"}
                  className="w-full bg-bleu text-white py-3 rounded-xl font-medium tracking-wide hover:bg-encre transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {state === "uploading" ? "Envoi en cours…" : tab === "media" ? "Partager ce souvenir" : "Envoyer mon témoignage"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SuccessMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-blue-100 p-12 text-center space-y-4"
    >
      <div className="w-16 h-16 bg-jaune/10 rounded-full flex items-center justify-center mx-auto border-2 border-jaune">
        <svg className="w-8 h-8 text-jaune" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="font-serif text-2xl text-encre">Merci pour votre contribution !</h2>
      <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
        Votre souvenir a bien été reçu. Il sera publié sur la plateforme après validation par notre équipe.
      </p>
    </motion.div>
  );
}

function InvalidLink() {
  return (
    <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-4 text-center">
      <div className="h-1 bg-jaune w-full absolute top-0" />
      <h1 className="font-serif text-2xl text-encre mb-3">Lien invalide</h1>
      <p className="text-slate-500 text-sm max-w-sm">
        Ce lien de contribution n'est pas valide ou a expiré. Contactez l'association pour obtenir un nouveau lien.
      </p>
    </div>
  );
}
