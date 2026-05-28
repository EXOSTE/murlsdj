import { Link } from "react-router-dom";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-creme">
      <div className="h-1 bg-jaune w-full" />
      <header className="flex items-center px-4 py-3">
        <Link to="/" className="text-slate-400 hover:text-encre transition-colors text-sm flex items-center gap-1">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z"/></svg>
          Retour
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center space-y-2">
          <p className="text-bleu text-xs tracking-widest uppercase">Le Silence des Justes · 30 ans</p>
          <h1 className="font-serif text-3xl text-encre">Mentions légales</h1>
          <p className="text-slate-400 text-sm">& Politique de confidentialité</p>
        </div>

        <section className="bg-white rounded-2xl border border-blue-100 p-6 space-y-3">
          <h2 className="font-semibold text-encre text-base">Éditeur du site</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Le site <strong>Mur LSDJ</strong> est édité par l'association <strong>Le Silence des Justes</strong>,
            à l'occasion de son 30e anniversaire.
          </p>
          <p className="text-slate-600 text-sm leading-relaxed">
            Pour tout contact : <a href="mailto:contact@lesdj.fr" className="text-bleu hover:underline">contact@lesdj.fr</a>
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-blue-100 p-6 space-y-3">
          <h2 className="font-semibold text-encre text-base">Hébergement</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Ce site est hébergé par <strong>Vercel Inc.</strong>, 340 Pine Street Suite 701, San Francisco, CA 94104, USA.
            Les fichiers médias (photos, vidéos) sont stockés sur <strong>Cloudinary</strong>.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-blue-100 p-6 space-y-4">
          <h2 className="font-semibold text-encre text-base">Données personnelles (RGPD)</h2>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-encre">Données collectées</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Lors du dépôt d'un souvenir (photo, vidéo ou témoignage), les informations suivantes peuvent être collectées :
            </p>
            <ul className="list-disc list-inside text-slate-600 text-sm space-y-1 pl-2">
              <li>Nom ou prénom (facultatif)</li>
              <li>Fichier média (photo ou vidéo)</li>
              <li>Date de prise de vue (facultatif)</li>
              <li>Légende / témoignage textuel</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-encre">Finalité du traitement</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les données collectées sont utilisées exclusivement pour afficher les souvenirs sur le site Mur LSDJ,
              dans le cadre de la commémoration des 30 ans du Silence des Justes. Aucune donnée n'est transmise
              à des tiers à des fins commerciales.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-encre">Durée de conservation</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Les données sont conservées pour la durée du projet commémoratif. Vous pouvez demander
              la suppression de vos données à tout moment.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-encre">Vos droits</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi Informatique et Libertés,
              vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition
              au traitement de vos données. Pour exercer ces droits, contactez-nous à{" "}
              <a href="mailto:contact@lesdj.fr" className="text-bleu hover:underline">contact@lesdj.fr</a>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-encre">Réclamation</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              En cas de désaccord sur le traitement de vos données, vous pouvez introduire une réclamation
              auprès de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des Libertés) :
              {" "}<a href="https://www.cnil.fr" target="_blank" rel="noreferrer" className="text-bleu hover:underline">www.cnil.fr</a>.
            </p>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-blue-100 p-6 space-y-3">
          <h2 className="font-semibold text-encre text-base">Cookies et traceurs</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Ce site n'utilise pas de cookies de traçage ou publicitaires. Le stockage local (<em>localStorage</em>)
            est utilisé uniquement pour mémoriser vos interactions (likes, reposts) de façon anonyme,
            sans collecte d'identifiant personnel.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-blue-100 p-6 space-y-3">
          <h2 className="font-semibold text-encre text-base">Propriété intellectuelle</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Les photos et vidéos déposées par les contributeurs restent la propriété de leurs auteurs.
            En déposant un souvenir, vous accordez à l'association Le Silence des Justes une licence
            non exclusive d'affichage sur ce site, à titre gratuit et pour la durée du projet.
          </p>
        </section>

        <p className="text-center text-slate-400 text-xs pb-6">
          Dernière mise à jour : mai 2026
        </p>
      </main>
    </div>
  );
}
