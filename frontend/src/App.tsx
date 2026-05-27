import { BrowserRouter, Routes, Route } from "react-router-dom";
import Feed from "./pages/Feed";
import Contribute from "./pages/Contribute";
import Gallery from "./pages/Gallery";
import Timeline from "./pages/Timeline";
import Admin from "./pages/Admin";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/contribuer" element={<Contribute />} />
        <Route path="/galerie" element={<Gallery />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/histoire" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
