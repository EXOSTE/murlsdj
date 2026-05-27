import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Contribute from "./pages/Contribute";
import Gallery from "./pages/Gallery";
import Timeline from "./pages/Timeline";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/contribuer" element={<Contribute />} />
        <Route path="/galerie" element={<Gallery />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
