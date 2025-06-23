import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MyInventoryPage() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/inventory/1')
      .then(res => setCards(res.data))
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const toggleTradeable = async (cardId, currentStatus) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/card/${cardId}/tradeable`, {
        tradeable: !currentStatus,
      });

      setCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, tradeable: res.data.tradeable } : card
        )
      );
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const openPopup = (frontUrl, backUrl) => {
    const popup = window.open('', 'CardPopup', 'width=600,height=400,resizable=yes');
    popup.document.write(`
      <html><head><title>Card View</title></head>
      <body style="margin:0; padding:10px; display:flex; gap:20px; justify-content:center; align-items:center;">
        <img src="http://localhost:5000/${frontUrl}" style="width:220px;" />
        <img src="http://localhost:5000/${backUrl}" style="width:220px;" />
      </body></html>
    `);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Your Inventory</h1>

      <div className="w-full max-w-none px-4">
        {cards.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">No cards in your inventory yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto justify-items-center">
            {cards.map(card => (
              <div
                key={card.id}
                onClick={() => openPopup(card.image_urls[0], card.image_urls[1])}
                className={`flex flex-col justify-between max-w-[300px] border-4 rounded-lg shadow-md p-4 text-center transition-transform hover:scale-105 hover:shadow-lg cursor-pointer ${
                  card.tradeable ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                <img
                  src={`http://localhost:5000/${card.image_urls[0]}`}
                  alt={card.card_name}
                  className="w-[220px] h-[308px] object-cover mx-auto"
                />
                <div className="mt-3 text-sm">
                  <strong>{card.card_name}</strong><br />
                  {card.set_name}<br />
                  Trade Value: {isNaN(card.trade_value) ? 'N/A' : `$${parseFloat(card.trade_value).toFixed(2)}`}<br />
                  <button
                    className={`mt-2 px-3 py-1 rounded text-white text-xs ${
                      card.tradeable ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-500 hover:bg-gray-600'
                    }`}
                    onClick={e => {
                      e.stopPropagation(); // prevent card click from triggering popup
                      toggleTradeable(card.id, card.tradeable);
                    }}
                  >
                    {card.tradeable ? 'Tradeable ✅' : 'Not Tradeable ❌'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyInventoryPage;
