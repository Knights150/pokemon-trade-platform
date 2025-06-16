import React from 'react';

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">PokéTrade</h1>

      <div className="flex gap-4">
        <a href="/home" className="hover:text-yellow-400">Home</a>
        <a href="/list" className="hover:text-yellow-400">List a Card</a>
        <a href="/inventory" className="hover:text-yellow-400">My Inventory</a>
      </div>
    </nav>
  );
}

export default Navbar;
