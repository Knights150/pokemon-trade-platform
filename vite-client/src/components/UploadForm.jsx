import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

function UploadForm() {
  const [form, setForm] = useState({
    cardName: '',
    condition: 'Near Mint',
    foil: false,
    language: 'English',
    tradeValue: '',
    expansion: '',
    set: '',
    cardNumber: '',
    rarity: '',
    imageUrl: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [dynamicCardData, setDynamicCardData] = useState({});
  const [cardOptions, setCardOptions] = useState([]);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sets`, {
          headers: { 'X-Api-Key': API_KEY }
        });
        const grouped = {};
        for (const set of res.data.data) {
          if (!grouped[set.series]) grouped[set.series] = {};
          grouped[set.series][set.name] = set.id;
        }
        setDynamicCardData(grouped);
      } catch (error) {
        console.error('Error fetching sets:', error);
      }
    };
    fetchSets();
  }, []);

  useEffect(() => {
    if (!form.set) {
      setCardOptions([]);
      return;
    }
    const fetchCards = async () => {
      try {
        const res = await axios.get(`${API_BASE}/cards?q=set.name:"${form.set}"`, {
          headers: { 'X-Api-Key': API_KEY }
        });
        const cards = res.data.data.map(card => ({
          name: card.name,
          number: card.number,
          rarity: card.rarity || '',
          imageUrl: card.images?.small || ''
        }));
        setCardOptions(cards);
      } catch (err) {
        console.error('Failed to fetch cards:', err);
      }
    };
    fetchCards();
  }, [form.set]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const fetchCards = async () => {
      try {
        const res = await axios.get(`${API_BASE}/cards?q=name:"${searchQuery}"`, {
          headers: { 'X-Api-Key': API_KEY }
        });
        const formatted = res.data.data.map(card => ({
          id: card.id,
          name: card.name,
          set: card.set.name,
          expansion: card.set.series,
          number: card.number,
          rarity: card.rarity,
          image: card.images?.small || '',
        }));
        setSearchResults(formatted);
      } catch (err) {
        console.error('Search failed:', err);
      }
    };

    const timeout = setTimeout(fetchCards, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSelectCard = (card) => {
    setForm(prev => ({
      ...prev,
      cardName: card.name,
      set: card.set,
      expansion: card.expansion,
      cardNumber: card.number,
      rarity: card.rarity || 'Unknown',
      imageUrl: card.image
    }));
    setSearchQuery(card.name);
    setSearchResults([]);
  };

  const handleExpansionChange = (e) => {
    const exp = e.target.value;
    setForm(prev => ({
      ...prev,
      expansion: exp,
      set: '',
      cardName: '',
      cardNumber: '',
      rarity: '',
      imageUrl: ''
    }));
    setCardOptions([]);
  };

  const handleSetChange = (e) => {
    setForm(prev => ({
      ...prev,
      set: e.target.value,
      cardName: '',
      cardNumber: '',
      rarity: '',
      imageUrl: ''
    }));
  };

  const handleCardNameChange = (e) => {
    const name = e.target.value;
    const selectedCard = cardOptions.find(c => c.name === name);
    if (selectedCard) {
      setForm(prev => ({
        ...prev,
        cardName: name,
        cardNumber: selectedCard.number,
        rarity: selectedCard.rarity,
        imageUrl: selectedCard.imageUrl
      }));
    } else {
      setForm(prev => ({ ...prev, cardName: name }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => setFiles([...e.target.files]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cardName || files.length === 0) {
      setMessage('Please fill out all required fields and upload at least one image.');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    files.forEach(file => formData.append('images', file));

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message || 'Upload successful!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow space-y-4 text-sm">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search Pokémon (e.g., Charizard)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        />

        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-white border rounded shadow p-3 max-h-[28rem] overflow-y-auto">
            {searchResults.map((card) => (
              <div
                key={card.id}
                onClick={() => handleSelectCard(card)}
                className="cursor-pointer hover:bg-gray-100 p-2 rounded border flex flex-col items-center w-full max-w-[160px] mx-auto"
              >
                <img src={card.image} alt={card.name} className="w-20 h-28 object-contain mb-1" />
                <div className="text-xs font-medium text-center truncate">{card.name}</div>
                <div className="text-[10px] text-gray-600 text-center truncate">
                  {card.set} ({card.expansion})
                </div>
                <div className="text-[10px] text-gray-500 text-center truncate">
                  #{card.number} • {card.rarity}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <select name="expansion" value={form.expansion} onChange={handleExpansionChange} className="w-full border px-3 py-2 rounded">
        <option value="">Select Expansion</option>
        {Object.keys(dynamicCardData).map(series => (
          <option key={series} value={series}>{series}</option>
        ))}
      </select>

      {form.expansion && (
        <select name="set" value={form.set} onChange={handleSetChange} className="w-full border px-3 py-2 rounded">
          <option value="">Select Set</option>
          {Object.keys(dynamicCardData[form.expansion] || {}).map(set => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>
      )}

      {form.set && (
        <select name="cardName" value={form.cardName} onChange={handleCardNameChange} className="w-full border px-3 py-2 rounded">
          <option value="">Select Card</option>
          {cardOptions.map(card => (
            <option key={card.name} value={card.name}>
              {card.name} • #{card.number} • {card.rarity}
            </option>
          ))}
        </select>
      )}

      {form.imageUrl && (
        <div className="flex items-center gap-4">
          <img src={form.imageUrl} alt="Selected card" className="w-16 h-auto rounded shadow border" />
          <div className="text-xs text-gray-700">
            <strong>{form.cardName}</strong><br />
            Set: <em>{form.set}</em><br />
            Expansion: <em>{form.expansion}</em><br />
            Rarity: {form.rarity} | Card #: {form.cardNumber}
          </div>
        </div>
      )}

      <select name="condition" value={form.condition} onChange={handleChange} className="w-full border px-3 py-2 rounded">
        <option>Near Mint</option>
        <option>Lightly Played</option>
        <option>Moderately Played</option>
        <option>Heavily Played</option>
        <option>Damaged</option>
      </select>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="foil" checked={form.foil} onChange={handleChange} />
        Foil/Holo?
      </label>

      <select name="language" value={form.language} onChange={handleChange} className="w-full border px-3 py-2 rounded">
        <option>English</option>
        <option>Japanese</option>
        <option>Spanish</option>
        <option>German</option>
        <option>French</option>
      </select>

      <input
        type="text"
        name="tradeValue"
        placeholder="Estimated Trade Value (USD)"
        value={form.tradeValue}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />

      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="w-full border px-2 py-1 rounded bg-gray-50"
      />

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full">
        Upload
      </button>

      {message && <p className="text-center text-green-700 font-medium">{message}</p>}
    </form>
  );
}

export default UploadForm;
