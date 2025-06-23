import React, { useEffect, useState } from 'react';
import axios from 'axios';

function MyInventoryPage() {
  const [cards, setCards] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/inventory/1') // Change to actual user ID in future
      .then(res => setCards(res.data))
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const toggleTradeable = async (cardId) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/card/${cardId}/toggle`);
      setCards(prev =>
        prev.map(card => card.id === cardId ? { ...card, tradeable: res.data.tradeable } : card)
      );
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const openPopup = (frontUrl, backUrl) => {
    const popup = window.open('', 'CardPopup', 'width=600,height=400');
    popup.document.write(`
      <html><head><title>Card</title></head>
      <body style="margin:0; padding:10px; display:flex; gap:20px; justify-content:center; align-items:center;">
        <img src="http://localhost:5000/${frontUrl}" style="width:220px;" />
        <img src="http://localhost:5000/${backUrl}" style="width:220px;" />
      </body></html>
    `);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">My Inventory</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(card => (
          <div
            key={card.id}
            className={`border-4 rounded shadow p-2 cursor-pointer ${card.tradeable ? 'border-green-500' : 'border-gray-300'}`}
          >
            <img
              src={`http://localhost:5000/${card.image_urls[0]}`}
              alt={card.card_name}
              className="w-[220px] h-auto mx-auto"
              onClick={() => openPopup(card.image_urls[0], card.image_urls[1])}
            />
            <div className="mt-2 text-sm text-center">
              <strong>{card.card_name}</strong><br />
              Set: {card.set_name}<br />
              Value: ${card.trade_value}<br />
              <button
                className={`mt-1 px-3 py-1 rounded text-white text-xs ${card.tradeable ? 'bg-green-600' : 'bg-gray-500'}`}
                onClick={() => toggleTradeable(card.id)}
              >
                {card.tradeable ? 'Tradeable ✅' : 'Not Tradeable ❌'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MyInventoryPage;
