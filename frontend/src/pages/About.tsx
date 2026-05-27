import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MILESTONES = [
  { year: "1996", title: "Fondation", desc: "Création du Silence des Justes par un groupe d'éducateurs et de familles engagées à Paris." },
  { year: "2000", title: "Premiers locaux", desc: "Ouverture du premier centre d'accueil dédié à l'accompagnement des personnes vulnérables." },
  { year: "2005", title: "Expansion", desc: "Extension des services et création de nouvelles antennes pour mieux couvrir le territoire francilien." },
  { year: "2010", title: "10 ans d'engagement", desc: "Célébration d'une décennie de partage, avec plus de 200 familles accompagnées chaque année." },
  { year: "2016", title: "20 ans", desc: "Anniversaire marqué par un grand rassemblement communautaire et le lancement de nouveaux projets inclusifs." },
  { year: "2020", title: "Résilience", desc: "Maintien de l'activité et adaptation des services malgré les défis de la période pandémique." },
  { year: "2026", title: "30 ans — aujourd'hui", desc: "Trois décennies de souvenirs, de sourires et d'histoires partagées. Ce mur numérique en est le témoignage vivant.", highlight: true },
];

export default function About() {
  return (
    <div className="min-h-screen bg-creme text-encre relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute w-[600px] h-[600px] bg-bleu/5 rounded-full filter blur-3xl -top-40 -left-40 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-jaune/5 rounded-full filter blur-3xl -bottom-40 -right-40 pointer-events-none" />

      {/* Top accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-bleu via-jaune to-bleu w-full" />

      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-jaune rounded-full" />
          <Link to="/" className="font-serif text-encre text-xl hover:text-bleu transition-colors">
            Mur LSDJ
          </Link>
        </div>
        <nav className="flex gap-6 text-sm text-slate-400">
          <Link to="/timeline" className="hover:text-bleu transition-colors">Timeline</Link>
          <Link to="/galerie" className="hover:text-bleu transition-colors">Galerie</Link>
        </nav>
      </header>

      {/* Hero section */}
      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-4 mb-20"
        >
          <p className="text-bleu text-xs tracking-[0.25em] uppercase font-semibold">Notre histoire</p>
          <h1 className="font-serif text-5xl md:text-6xl text-encre leading-tight">
            Le Silence des Justes
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-0.5 w-8 bg-jaune" />
            <p className="font-serif text-bleu text-lg">30 ans d'engagement</p>
            <div className="h-0.5 w-8 bg-jaune" />
          </div>
          <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
            Depuis 1996, le Silence des Justes accompagne des familles, des professionnels et des personnes
            en situation de vulnérabilité, construisant jour après jour une communauté fondée sur le respect,
            la dignité et le partage.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-3 gap-4 mb-20"
        >
          {[
            { value: "30", label: "Années d'histoire" },
            { value: "200+", label: "Familles accompagnées / an" },
            { value: "∞", label: "Souvenirs partagés" },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white/70 backdrop-blur-sm border border-blue-100 rounded-2xl p-6 text-center shadow-sm">
              <p className="font-serif text-4xl text-bleu font-bold">{value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-1">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Timeline */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 space-y-2"
          >
            <p className="text-bleu text-xs tracking-widest uppercase font-semibold">30 ans en quelques étapes</p>
            <h2 className="font-serif text-3xl text-encre">Une histoire collective</h2>
            <div className="h-0.5 w-12 bg-jaune mx-auto" />
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-blue-100 -translate-x-1/2" />

            <div className="space-y-10">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`flex items-start gap-6 md:gap-0 ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}
                >
                  {/* Content card */}
                  <div className={`flex-1 md:px-12 pl-14 md:pl-0 ${i % 2 === 0 ? "md:text-right" : "md:text-left"}`}>
                    <div className={`inline-block bg-white/80 border ${m.highlight ? "border-jaune/40 shadow-lg shadow-jaune/5" : "border-blue-100"} rounded-2xl p-6 shadow-sm max-w-sm ${i % 2 === 0 ? "md:ml-auto" : ""}`}>
                      <p className={`text-xs uppercase tracking-widest font-bold font-sans mb-1 ${m.highlight ? "text-jaune" : "text-bleu"}`}>{m.year}</p>
                      <h3 className="font-serif text-xl text-encre mb-2">{m.title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{m.desc}</p>
                    </div>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-[28px] md:relative md:left-auto md:flex-none md:flex md:items-start md:justify-center md:w-14 md:pt-6 -translate-x-1/2 md:translate-x-0 mt-6 md:mt-0">
                    <div className={`w-4 h-4 rounded-full border-2 ${m.highlight ? "bg-jaune border-jaune" : "bg-white border-bleu"} shadow-sm`} />
                  </div>

                  {/* Spacer for alternate side */}
                  <div className="hidden md:block flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-bleu/5 border border-bleu/10 rounded-3xl p-10 md:p-14 text-center space-y-6 mb-16"
        >
          <p className="text-bleu text-xs tracking-widest uppercase font-semibold">Notre mission</p>
          <blockquote className="font-serif text-2xl md:text-3xl text-encre leading-relaxed max-w-2xl mx-auto">
            « Accompagner, partager, se souvenir — ensemble, pour que chaque histoire soit racontée. »
          </blockquote>
          <div className="h-0.5 w-12 bg-jaune mx-auto" />
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Le Mur LSDJ est le reflet de trois décennies de liens humains, de joie partagée et de solidarité.
            Chaque photo, chaque vidéo, chaque témoignage est un fragment de notre mémoire collective.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/galerie"
              className="inline-flex items-center gap-2 bg-bleu text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-encre transition-all duration-300 shadow-lg shadow-bleu/15"
            >
              Explorer la galerie
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              to="/timeline"
              className="inline-flex items-center gap-2 border border-bleu/30 text-bleu px-6 py-3 rounded-xl font-medium text-sm hover:bg-bleu hover:text-white transition-all duration-300"
            >
              Voir la timeline
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-blue-100/55 relative z-10">
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <div className="h-px w-8 bg-jaune" />
          <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-bleu/80">Le Silence des Justes · 1996 – 2026</span>
          <div className="h-px w-8 bg-jaune" />
        </div>
      </footer>
    </div>
  );
}
