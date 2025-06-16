import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = 'https://api.pokemontcg.io/v2';
const API_KEY = import.meta.env.VITE_POKEMON_API_KEY;

function UploadForm() {
  const [form, setForm] = useState({
    expansion: '',
    set: '',
    cardName: '',
    condition: 'Near Mint',
    foil: false,
    language: 'English',
    tradeValue: '',
  });

  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [expansions, setExpansions] = useState([]);
  const [setsByExpansion, setSetsByExpansion] = useState({});
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const fetchSets = async () => {
      try {
        const res = await axios.get(`${API_BASE}/sets`, {
          headers: { 'X-Api-Key': API_KEY }
        });

        const grouped = {};
        for (const set of res.data.data) {
          if (!grouped[set.series]) grouped[set.series] = [];
          grouped[set.series].push(set.name);
        }

        setExpansions(Object.keys(grouped));
        setSetsByExpansion(grouped);
      } catch (err) {
        console.error('Failed to fetch sets:', err);
      }
    };

    fetchSets();
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      if (!form.set) return;

      try {
        const res = await axios.get(`${API_BASE}/cards?q=set.name:"${form.set}"`, {
          headers: { 'X-Api-Key': API_KEY }
        });

        const cardNames = res.data.data.map(card => card.name);
        setCards(cardNames);
      } catch (err) {
        console.error('Failed to fetch cards:', err);
      }
    };

    fetchCards();
  }, [form.set]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.cardName || files.length === 0) {
      setMessage('Please fill out all required fields and upload at least one image.');
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, val]) => {
      formData.append(key, val);
    });
    files.forEach((file) => {
      formData.append('images', file);
    });

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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-semibold">List Your Pokémon Card</h2>

      {/* Expansion Dropdown */}
      <select
        name="expansion"
        value={form.expansion}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            expansion: e.target.value,
            set: '',
            cardName: '',
          }))
        }
        className="w-full border px-3 py-2 rounded"
        required
      >
        <option value="">Select Expansion</option>
        {expansions.map((exp) => (
          <option key={exp} value={exp}>{exp}</option>
        ))}
      </select>

      {/* Set Dropdown */}
      {form.expansion && (
        <select
          name="set"
          value={form.set}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              set: e.target.value,
              cardName: '',
            }))
          }
          className="w-full border px-3 py-2 rounded"
          required
        >
          <option value="">Select Set</option>
          {(setsByExpansion[form.expansion] || []).map((setName) => (
            <option key={setName} value={setName}>{setName}</option>
          ))}
        </select>
      )}

      {/* Card Dropdown */}
      {form.set && (
        <select
          name="cardName"
          value={form.cardName}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
          required
        >
          <option value="">Select Card</option>
          {cards.map((card) => (
            <option key={card} value={card}>{card}</option>
          ))}
        </select>
      )}

      {/* Other Fields */}
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
        className="w-full"
      />

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        Upload
      </button>

      {message && <p className="text-gray-700">{message}</p>}
    </form>
  );
}

export default UploadForm;
