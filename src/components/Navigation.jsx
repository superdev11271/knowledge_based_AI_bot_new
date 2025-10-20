import { Link, useLocation } from 'react-router-dom'
import { MessageCircle, FolderOpen, Bot } from 'lucide-react'

function Navigation() {
  const location = useLocation()

  const navItems = [
    {
      path: '/',
      name: 'Chat Interface',
      icon: MessageCircle,
      description: 'Talk to your AI assistant'
    },
    {
      path: '/documents',
      name: 'Document Management',
      icon: FolderOpen,
      description: 'Manage knowledge base'
    }
  ]

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">RAG Assistant</h1>
              <p className="text-xs text-gray-500">Custom GPT Pipeline</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
