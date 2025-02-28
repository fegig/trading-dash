import { NavLink } from "react-router"
import { useState } from "react"
import Modal from "../components/common/Modal"

const tabs = [
    {name: 'Trade', path: '/'},
    {name: 'Portfolio', path: '/portfolio'},
    {name: 'Wallet', path: '/wallet'},
    {name: 'Affiliate', path: '/affiliate'},
    {name: 'More', path: '/more'},
]

function Header() {
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  return (
    <header className="border-b border-gray-800 px-4 md:px-6 py-3 md:py-4 relative z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl md:text-2xl font-bold text-green-400">BlockTrade</h1>
        </div>

        <nav className="hidden md:flex space-x-6">
          {tabs.map((item, i) => (
            <NavLink
              to={`${item.path}`}
              className={({ isActive }) => isActive ? "text-green-400" : "text-gray-400 hover:text-gray-300"
              }
              key={i}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-3">
          <button 
            className="md:hidden gradient-background !p-2 !rounded-full text-neutral-400 flex items-center space-x-2"
            onClick={() => setIsMenuModalOpen(true)}
          >
           <span className="text-xs">{tabs.find(item => item.path === window.location.pathname)?.name}</span>
           <i className="fi fi-rr-angle-down text-xs"></i>
          </button>
        
            <button 
              className="w-full gradient-background text-xs text-left !p-2 !rounded-full flex items-center space-x-3  text-neutral-400"
              onClick={() => setIsMenuModalOpen(false)}
            >
              <i className="fi fi-rr-user" />
           
            </button>
            <button 
              className="w-full gradient-background text-xs text-left !p-2 !rounded-full flex items-center space-x-3  text-neutral-400"
              onClick={() => setIsMenuModalOpen(false)}
            >
              <i className="fi fi-rr-power" />
              
            </button>
        
        </div>
      </div>

      {/* Mobile Navigation Modal */}
      <Modal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        title="Menu"
      >
        <div className="grid grid-cols-1 gap-2">
          {tabs.map((item, i) => (
            <NavLink
              to={`${item.path}`}
              className={({ isActive }) => 
                `w-full gradient-background text-xs text-left px-4 !py-2 rounded-lg flex items-center justify-between ${
                  isActive 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : 'hover:bg-neutral-800/50 text-neutral-400'
                }`
              }
              key={i}
              onClick={() => setIsMenuModalOpen(false)}
            >
              <span>{item.name}</span>
              <i className={`fi ${item.path === window.location.pathname ? 'fi-rr-check text-green-500' : 'fi-rr-angle-right text-neutral-500 opacity-0 group-hover:opacity-100 smooth'}`} />
            </NavLink>
          ))}
          
         
        </div>
      </Modal>
    </header>
  )
}

export default Header