import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

function UploadForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    cardName: '',
    condition: 'Near Mint',
    foil: false,
    language: 'English',
    tradeValue: '',
    expansion: '',
    cardSet: '',
    cardNumber: '',
    rarity: '',
    imageUrl: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicCardData, setDynamicCardData] = useState({});
  const [cardOptions, setCardOptions] = useState([]);
  const [files, setFiles] = useState({ frontImage: null, backImage: null });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const selected = location.state?.selectedCard;
    if (selected) {
      setForm(prev => ({
        ...prev,
        cardName: selected.name,
        cardSet: selected.set,
        expansion: selected.expansion,
        cardNumber: selected.number,
        rarity: selected.rarity || 'Unknown',
        imageUrl: selected.image
      }));
    }
  }, [location.state]);

  useEffect(() => {
    axios.get(`${API_BASE}/sets`, {
      headers: { 'X-Api-Key': API_KEY }
    }).then(res => {
      const grouped = {};
      res.data.data.forEach(set => {
        if (!grouped[set.series]) grouped[set.series] = {};
        grouped[set.series][set.name] = set.id;
      });
      setDynamicCardData(grouped);
    }).catch(err => console.error('Set fetch error:', err));
  }, []);

  useEffect(() => {
    if (!form.cardSet) return setCardOptions([]);
    axios.get(`${API_BASE}/cards?q=set.name:"${form.cardSet}"`, {
      headers: { 'X-Api-Key': API_KEY }
    }).then(res => {
      const cards = res.data.data.map(card => ({
        name: card.name,
        number: card.number,
        rarity: card.rarity || '',
        imageUrl: card.images?.small || ''
      }));
      setCardOptions(cards);
    }).catch(err => console.error('Card fetch error:', err));
  }, [form.cardSet]);

  useEffect(() => {
    if (searchQuery.length < 2) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_BASE}/cards?q=name:"${searchQuery}"`, {
          headers: { 'X-Api-Key': API_KEY }
        });

        if (res.data.data.length > 0) {
          const formatted = res.data.data.map(card => ({
            id: card.id,
            name: card.name,
            set: card.set.name,
            expansion: card.set.series,
            number: card.number,
            rarity: card.rarity,
            image: card.images?.small || '',
          }));

          navigate('/search', {
            state: { results: formatted, query: searchQuery }
          });
        } else {
          setMessage(`No results for "${searchQuery}"`);
        }
      } catch (err) {
        console.error('Search failed:', err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleExpansionChange = (e) => {
    const exp = e.target.value;
    setForm(f => ({
      ...f, expansion: exp, cardSet: '', cardName: '', cardNumber: '', rarity: '', imageUrl: ''
    }));
    setCardOptions([]);
  };

  const handleSetChange = (e) => {
    setForm(f => ({ ...f, cardSet: e.target.value, cardName: '', cardNumber: '', rarity: '', imageUrl: '' }));
  };

  const handleCardNameChange = (e) => {
    const name = e.target.value;
    const found = cardOptions.find(c => c.name === name);
    if (found) {
      setForm(f => ({
        ...f, cardName: name, cardNumber: found.number, rarity: found.rarity, imageUrl: found.imageUrl
      }));
    } else {
      setForm(f => ({ ...f, cardName: name }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selected } = e.target;
    setFiles(f => ({ ...f, [name]: selected[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cardName || !files.frontImage || !files.backImage) {
      return setMessage('Please complete required fields and upload both front and back images.');
    }

    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    formData.append('frontImage', files.frontImage);
    formData.append('backImage', files.backImage);

    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(res.data.message || 'Upload successful!');
    } catch (err) {
      setMessage(err.response?.data?.error || 'Upload failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow space-y-4 text-sm">
      <input
        type="text"
        placeholder="Search Pokémon (e.g., Charizard)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full border px-3 py-2 rounded"
      />

      <select name="expansion" value={form.expansion} onChange={handleExpansionChange} className="w-full border px-3 py-2 rounded">
        <option value="">Select Expansion</option>
        {Object.keys(dynamicCardData).map(series => (
          <option key={series} value={series}>{series}</option>
        ))}
      </select>

      {form.expansion && (
        <select name="cardSet" value={form.cardSet} onChange={handleSetChange} className="w-full border px-3 py-2 rounded">
          <option value="">Select Set</option>
          {Object.keys(dynamicCardData[form.expansion] || {}).map(set => (
            <option key={set} value={set}>{set}</option>
          ))}
        </select>
      )}

      {form.cardSet && (
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
          <img src={form.imageUrl} alt="Card" className="w-16 h-auto rounded border" />
          <div className="text-xs text-gray-700">
            <strong>{form.cardName}</strong><br />
            Set: <em>{form.cardSet}</em><br />
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

      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium">Front</label>
          <input
            type="file"
            name="frontImage"
            accept="image/*"
            onChange={handleFileChange}
            className="border px-2 py-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Back</label>
          <input
            type="file"
            name="backImage"
            accept="image/*"
            onChange={handleFileChange}
            className="border px-2 py-1 rounded"
          />
        </div>
      </div>

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded w-full">
        Upload
      </button>

      {message && <p className="text-center text-green-700 font-medium">{message}</p>}
    </form>
  );
}

export default UploadForm;
