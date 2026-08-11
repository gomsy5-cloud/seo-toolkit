import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import KeywordDensity from './pages/KeywordDensity'
import SitemapGenerator from './pages/SitemapGenerator'
import Analyzer from './pages/Analyzer'
import BrokenLinks from './pages/BrokenLinks'
import ContentGenerator from './pages/ContentGenerator'
import ReportGenerator from './pages/ReportGenerator'
import LinkBuilding from './pages/LinkBuilding'

export default function App() {
  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyzer" element={<Analyzer />} />
          <Route path="/content" element={<ContentGenerator />} />
          <Route path="/keywords" element={<KeywordDensity />} />
          <Route path="/links" element={<BrokenLinks />} />
          <Route path="/sitemap" element={<SitemapGenerator />} />
          <Route path="/reports" element={<ReportGenerator />} />
          <Route path="/link-building" element={<LinkBuilding />} />
        </Routes>
      </main>
    </div>
  )
}
