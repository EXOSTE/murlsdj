import { Link, useLocation } from "react-router-dom";

interface NavbarProps {
  maxWidth?: "4xl" | "6xl";
}

export default function Navbar({ maxWidth = "6xl" }: NavbarProps) {
  const { pathname } = useLocation();

  const link = (to: string, label: string) => (
    <Link
      to={to}
      aria-current={pathname === to ? "page" : undefined}
      className={`hover:text-bleu transition-colors ${
        pathname === to ? "text-bleu font-medium" : ""
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-blue-100 bg-white px-6 py-5">
      <div className={`max-w-${maxWidth} mx-auto flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-jaune rounded-full" />
          <Link to="/" className="font-serif text-encre text-xl hover:text-bleu transition-colors">
            Mur LSDJ
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          {link("/timeline", "Timeline")}
          {link("/galerie", "Galerie")}
          {link("/histoire", "Notre histoire")}
          <Link
            to="/contribuer"
            className="bg-bleu text-white text-xs px-3 py-1.5 rounded-full hover:bg-encre transition-colors"
          >
            + Publier
          </Link>
        </nav>
      </div>
    </header>
  );
}
