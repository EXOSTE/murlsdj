import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

const Feed = lazy(() => import("./pages/Feed"));
const Contribute = lazy(() => import("./pages/Contribute"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Admin = lazy(() => import("./pages/Admin"));
const About = lazy(() => import("./pages/About"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-creme flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-bleu border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/populaire" element={<Feed popular />} />
            <Route path="/contribuer" element={<Contribute />} />
            <Route path="/galerie" element={<Gallery />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/histoire" element={<About />} />
            <Route path="/mentions-legales" element={<MentionsLegales />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
