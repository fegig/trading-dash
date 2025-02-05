import {  NavLink } from "react-router"

const tabs = [
    {name: 'Trade', path: '/'},
    {name: 'Portfolio', path: '/portfolio'},
    {name: 'Wallet', path: '/wallet'},
    {name: 'Affiliate', path: '/affiliate'},
    {name: 'More', path: '/more'},
]


function Header() {
  return (
    <header className="border-b border-gray-800 px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold text-green-400">BlockTrade</h1>
        <nav className="flex space-x-6">
          {tabs.map((item, i) => (
            <NavLink
              to={`${item.path}`}
              className={({ isActive }) => isActive ? "text-green-400" : "text-gray-400"
              }
              key={i}
             
             
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      <button className="flex items-center space-x-2 bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700">
        <i className="fi fi-rr-user" />
        <span>Account</span>
      </button>
    </div>
  </header>
  )
}

export default Header