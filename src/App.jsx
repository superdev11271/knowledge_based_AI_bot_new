import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import ChatInterface from './pages/ChatInterface'
import DocumentManagement from './pages/DocumentManagement'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/documents" element={<DocumentManagement />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App