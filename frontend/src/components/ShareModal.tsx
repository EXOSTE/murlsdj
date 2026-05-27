import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  mediaId: string;
  legende: string | null;
  onClose: () => void;
}

export default function ShareModal({ mediaId, legende, onClose }: ShareModalProps) {
  const url = `${window.location.origin}/?media=${mediaId}`;
  const text = legende ? `${legende} — ${url}` : url;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencieux
    }
  };

  const options = [
    {
      label: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#20b858]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      ),
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      label: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#166fe5]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      label: "Snapchat",
      color: "bg-[#FFFC00] hover:bg-[#f0ed00]",
      textColor: "text-black",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black">
          <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.12.068.255.133.403.133.136 0 .28-.057.416-.116.168-.075.356-.158.551-.158.172 0 .432.06.559.212.14.168.14.37-.003.565-.015.022-.07.103-.171.224-.03.036-.076.087-.127.14-.226.239-.543.575-.543.983 0 .19.062.37.182.535.138.19 1.48 1.975 3.716 2.432.215.045.357.25.317.463-.154.882-.844 1.449-1.757 1.618a.494.494 0 0 0-.386.423c-.044.217-.142.724-.582.724a1.49 1.49 0 0 1-.489-.088 5.71 5.71 0 0 0-1.747-.282c-.254 0-.498.016-.736.051-.538.08-.994.348-1.466.623-.765.45-1.532.9-2.772.9-.059 0-.12-.002-.182-.006-.06.004-.12.006-.181.006-1.239 0-2.006-.45-2.77-.9-.472-.276-.93-.544-1.467-.624a7.413 7.413 0 0 0-.736-.05 5.714 5.714 0 0 0-1.748.28c-.16.057-.327.087-.489.087-.44 0-.538-.507-.582-.724a.494.494 0 0 0-.386-.422c-.912-.17-1.602-.737-1.756-1.619-.04-.213.1-.418.317-.463 2.236-.457 3.578-2.242 3.716-2.432.12-.165.183-.344.183-.535 0-.408-.317-.744-.544-.983-.05-.053-.096-.104-.127-.14-.1-.12-.155-.2-.171-.224-.143-.195-.143-.397-.003-.565.127-.152.387-.212.559-.212.195 0 .383.083.551.158.135.06.28.116.416.116.148 0 .283-.065.403-.133-.008-.165-.018-.33-.03-.51l-.004-.06c-.104-1.628-.23-3.654.3-4.847C7.86 1.07 11.215.793 12.206.793z" />
        </svg>
      ),
      href: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
    },
    {
      label: "SMS",
      color: "bg-slate-700 hover:bg-slate-800",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ),
      href: `sms:?body=${encodeURIComponent(text)}`,
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: legende ?? "Un souvenir — Mur LSDJ" });
      } catch {
        // user cancelled
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-3"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <h3 className="font-serif text-encre text-center text-base mb-4">Partager ce souvenir</h3>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`${opt.color} flex items-center gap-3 px-4 py-3 rounded-xl transition-colors`}
              >
                {opt.icon}
                <span className={`text-sm font-medium ${opt.textColor ?? "text-white"}`}>{opt.label}</span>
              </a>
            ))}

            {/* Instagram — copie du lien */}
            <button
              onClick={handleCopy}
              className="bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center gap-3 px-4 py-3 rounded-xl transition-opacity hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white shrink-0">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span className="text-sm font-medium text-white">{copied ? "Copié !" : "Instagram"}</span>
            </button>

            {/* Autres applications */}
            <button
              onClick={handleNativeShare}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684zm0 9.316a3 3 0 1 0 5.368 2.684 3 3 0 0 0-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium">Autres</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
