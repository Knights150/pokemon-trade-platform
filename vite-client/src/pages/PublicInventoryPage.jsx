import React, { useEffect, useState } from 'react';
import axios from 'axios';

function PublicInventoryPage() {
  const [cards, setCards] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/cards')
      .then(res => setCards(res.data))
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const openPopup = (frontUrl, backUrl) => {
    const popup = window.open('', '_blank', 'width=600,height=400,resizable=yes');
    popup.document.write(`
      <html><head><title>Card View</title></head>
      <body style="margin:0;padding:10px;display:flex;gap:20px;justify-content:center;align-items:center;">
        <img src="http://localhost:5000/${frontUrl}" style="width:220px;" />
        <img src="http://localhost:5000/${backUrl}" style="width:220px;" />
      </body></html>
    `);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Public Inventory</h1>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
            const isExpanded = expandedId === card.id;
            return (
              <div
                key={card.id}
                className={`flex flex-col justify-between border-2 rounded-lg shadow p-4 transition-transform hover:scale-105
                  ${card.tradeable ? 'border-green-500' : 'border-gray-300'}
                  ${isExpanded ? 'bg-gray-100' : 'bg-white'}
                `}
              >
                <img
                  src={`http://localhost:5000/${card.image_urls[0]}`}
                  alt={card.card_name}
                  className="w-full h-64 object-cover rounded cursor-pointer"
                  onClick={() => openPopup(card.image_urls[0], card.image_urls[1])}
                />
                <button
                  className="mt-3 text-lg font-semibold text-blue-600 hover:underline"
                  onClick={() => setExpandedId(isExpanded ? null : card.id)}
                >
                  {card.card_name}
                </button>
                {isExpanded && (
                  <div className="mt-2 text-sm text-gray-700">
                    <p><strong>Set:</strong> {card.set_name}</p>
                    <p><strong>Value:</strong> {isNaN(card.trade_value) ? 'N/A' : `$${parseFloat(card.trade_value).toFixed(2)}`}</p>
                  </div>
                )}
                <div className="mt-4">
                  <span className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${
                    card.tradeable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                  }`}>
                    {card.tradeable ? 'Available' : 'Not Tradeable'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default PublicInventoryPage;
