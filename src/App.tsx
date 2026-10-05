import { Routes, Route } from "react-router-dom";
import { I18nProvider } from "./lib/i18n";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import UrlScanner from "./pages/UrlScanner";
import TextAnalyzer from "./pages/TextAnalyzer";
import FileScanner from "./pages/FileScanner";
import VulnScanner from "./pages/VulnScanner";
import IpIntel from "./pages/IpIntel";
import Osint from "./pages/Osint";
import Library from "./pages/Library";
import Quiz from "./pages/Quiz";
import History from "./pages/History";
import About from "./pages/About";

export default function App() {
  return (
    <I18nProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/url" element={<UrlScanner />} />
          <Route path="/text" element={<TextAnalyzer />} />
          <Route path="/file" element={<FileScanner />} />
          <Route path="/vuln" element={<VulnScanner />} />
          <Route path="/ip" element={<IpIntel />} />
          <Route path="/osint" element={<Osint />} />
          <Route path="/library" element={<Library />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/history" element={<History />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </I18nProvider>
  );
}
