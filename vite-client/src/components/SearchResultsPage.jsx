import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function SearchResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { results = [], query = '' } = location.state || {};

  const handleCardClick = (card) => {
    navigate('/', { state: { selectedCard: card } });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        ← Back
      </button>

      <h2 className="text-xl font-bold mb-4">
        Search Results for: <span className="text-blue-700">"{query}"</span>
      </h2>

      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {results.map(card => (
            <div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className="border p-3 rounded hover:shadow-md transition text-center cursor-pointer hover:ring-2 hover:ring-blue-400"
            >
              <img src={card.image} alt={card.name} className="w-28 h-40 mx-auto object-contain mb-2" />
              <div className="font-semibold text-sm">{card.name}</div>
              <div className="text-xs text-gray-600">{card.set} ({card.expansion})</div>
              <div className="text-xs text-gray-500">#{card.number} • {card.rarity}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;
