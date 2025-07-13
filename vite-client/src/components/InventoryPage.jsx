import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Grid,
  Tooltip,
  IconButton,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Button,
  TextField,
  Autocomplete,
  Chip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { useUser } from "../UserContext";
import { useLocation } from "react-router-dom";
import TradeOfferModal from './TradeOfferModal';

const priceOptions = [
  { label: "$10 - $25", min: 10, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50 - $75", min: 50, max: 75 },
  { label: "$75 - $100", min: 75, max: 100 },
  { label: "$100 - $200", min: 100, max: 200 },
  { label: "$200 - $300", min: 200, max: 300 },
  { label: "$300+", min: 300, max: Infinity },
];

const conditionOptions = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Damaged",
];

const InventoryPage = () => {
  const { user } = useUser();
  const location = useLocation();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedSets, setSelectedSets] = useState([]);
  const [uniqueSetOptions, setUniqueSetOptions] = useState([]);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [sortOption, setSortOption] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [tradeCart, setTradeCart] = useState([]);
  const [totalTradeValue, setTotalTradeValue] = useState(0);

  const addToTradeCart = (card) => {
    if (tradeCart.some((c) => c.id === card.id)) return;
    const newCart = [...tradeCart, card];
    setTradeCart(newCart);
    const value = parseFloat(card.trade_value || 0);
    setTotalTradeValue(prev => prev + value);
  };

  const removeFromTradeCart = (cardId) => {
    const newCart = tradeCart.filter(c => c.id !== cardId);
    const removedCard = tradeCart.find(c => c.id === cardId);
    setTradeCart(newCart);
    if (removedCard) {
      setTotalTradeValue(prev => prev - parseFloat(removedCard.trade_value || 0));
    }
  };

  const toggleFilter = (value, list, setList) => {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const targetUserId = location.pathname === "/my-inventory"
      ? user.id.toString()
      : location.pathname.split("/")[2];
    setIsOwner(location.pathname === "/my-inventory");

    const fetchInventory = async () => {
      try {
        const res = await axios.get(`/api/inventory/${targetUserId}?viewerId=${user.id}`);
        const cardsDataRaw = res.data.cards || [];
        const cardsData = cardsDataRaw.map(card => ({
          ...card,
          trade_value: parseFloat(card.trade_value),
          market_value: card.market_value !== null ? parseFloat(card.market_value) : null
        }));
        setCards(cardsData);
        const sets = new Set();
        cardsData.forEach(card => {
          if (card.set_name) sets.add(card.set_name);
          if (card.card_set) sets.add(card.card_set);
        });
        setUniqueSetOptions([...sets]);
      } catch (err) {
        console.error("Error fetching inventory:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, [location.pathname, user?.id]);

  const toggleTradeable = async (cardId, currentTradeable) => {
    try {
      await axios.patch(`/api/inventory/toggle-tradeable/${cardId}`, {
        tradeable: !currentTradeable
      });
      setCards((prev) =>
        prev.map((card) =>
          card.id === cardId ? { ...card, tradeable: !currentTradeable } : card
        )
      );
    } catch (err) {
      console.error("Error toggling tradeable:", err);
    }
  };

  const priceInRanges = (price, selectedRanges) => {
    if (isNaN(price)) return false;
    return selectedRanges.some((label) => {
      const range = priceOptions.find((r) => r.label === label);
      return range && price >= range.min && price <= range.max;
    });
  };

  const highlightMatch = (text, query) => {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1 || query === "") return text;
    return (
      <>
        {text.slice(0, index)}
        <span style={{ backgroundColor: "yellow" }}>
          {text.slice(index, index + query.length)}
        </span>
        {text.slice(index + query.length)}
      </>
    );
  };

  const resetFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedSets([]);
    setSelectedConditions([]);
    setSearchQuery("");
  };

  const filteredCards = cards.filter((card) => {
    const market = parseFloat(card.market_value || 0);
    if (
      selectedPriceRanges.length > 0 &&
      !priceInRanges(market, selectedPriceRanges)
    )
      return false;
    if (
      selectedSets.length > 0 &&
      !selectedSets.includes(card.card_set) &&
      !selectedSets.includes(card.set_name)
    )
      return false;
    if (
      selectedConditions.length > 0 &&
      !selectedConditions.includes(card.condition)
    )
      return false;
    const query = searchQuery.trim().toLowerCase();
    if (
      query !== "" &&
      !card.card_name.toLowerCase().includes(query) &&
      !(card.card_set && card.card_set.toLowerCase().includes(query)) &&
      !(card.set_name && card.set_name.toLowerCase().includes(query))
    )
      return false;
    return true;
  });

  const sortedCards = [...filteredCards].sort((a, b) => {
    const priceA = parseFloat(a.market_value || 0);
    const priceB = parseFloat(b.market_value || 0);
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    switch (sortOption) {
      case "price-low": return priceA - priceB;
      case "price-high": return priceB - priceA;
      case "oldest": return dateA - dateB;
      case "recent":
      default: return dateB - dateA;
    }
  });

  const autoCompleteOptions = Array.from(
    new Set(cards.map((card) => card.card_name))
  );

  return (
    <Box sx={{ display: "flex", p: 2 }}>
      <Box sx={{ width: 260, pr: 4, flexShrink: 0 }}>
        <Typography variant="h6" gutterBottom>Filters</Typography>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Price</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {priceOptions.map(({ label }, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={selectedPriceRanges.includes(label)}
                    onChange={() =>
                      toggleFilter(label, selectedPriceRanges, setSelectedPriceRanges)
                    }
                  />
                }
                label={label}
              />
            ))}
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Set</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {uniqueSetOptions.map((set, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={selectedSets.includes(set)}
                    onChange={() =>
                      toggleFilter(set, selectedSets, setSelectedSets)
                    }
                  />
                }
                label={set}
              />
            ))}
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Condition</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {conditionOptions.map((condition, idx) => (
              <FormControlLabel
                key={idx}
                control={
                  <Checkbox
                    checked={selectedConditions.includes(condition)}
                    onChange={() =>
                      toggleFilter(condition, selectedConditions, setSelectedConditions)
                    }
                  />
                }
                label={condition}
              />
            ))}
          </AccordionDetails>
        </Accordion>
        <Button fullWidth variant="outlined" onClick={resetFilters} sx={{ mt: 2 }}>
          Reset Filters
        </Button>
      </Box>

      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4">{isOwner ? "My Inventory" : "User's Inventory"}</Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortOption}
              label="Sort By"
              onChange={(e) => setSortOption(e.target.value)}
            >
              <MenuItem value="recent">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
              <MenuItem value="price-low">Price: Low to High</MenuItem>
              <MenuItem value="price-high">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Autocomplete
          freeSolo
          options={autoCompleteOptions}
          inputValue={searchQuery}
          onInputChange={(e, val) => setSearchQuery(val)}
          renderInput={(params) => (
            <TextField {...params} label="Search cards..." fullWidth size="small" />
          )}
          sx={{ mb: 2 }}
        />

        {loading ? (
          <CircularProgress />
        ) : sortedCards.length === 0 ? (
          <Typography>No cards found in this inventory.</Typography>
        ) : (
          <Grid container spacing={2}>
            {sortedCards.map((card) => {
              const market = parseFloat(card.market_value || 0);
              const trade = parseFloat(card.trade_value || 0);
              return (
                <Grid item xs={12} sm={6} md={4} key={card.id}>
                  <Card
                    onClick={() => window.location.href = `/card/${card.id}`}
                    sx={{ width: 280, cursor: "pointer" }}
                  >
                    <CardMedia
                      component="img"
                      image={
                        Array.isArray(card.image_urls) && card.image_urls[0]
                          ? `http://localhost:5000/${card.image_urls[0].replace(/\\/g, "/")}`
                          : "/default-card.png"
                      }
                      alt={card.card_name}
                      sx={{ objectFit: "contain", height: 260, backgroundColor: "#f5f5f5" }}
                    />
                    <CardContent>
                      <Typography fontWeight="bold">
                        {highlightMatch(card.card_name, searchQuery)}
                      </Typography>
                      <Typography variant="body2">
                        Set: {card.set_name || card.card_set} | #{card.card_number}
                      </Typography>
                      <Typography variant="body2">
                        Condition: {card.condition || "Unknown"}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        Market Value: ${!isNaN(market) ? market.toFixed(2) : "N/A"}
                      </Typography>
                      <Typography variant="h6" sx={{ color: "#f25c5c", fontWeight: "bold" }}>
                        ${!isNaN(trade) ? trade.toFixed(2) : "N/A"} for Trade
                      </Typography>

                      <Box display="flex" flexDirection="column" gap={1} mt={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Chip
                            label={card.tradeable ? "Tradeable" : "Not Tradeable"}
                            color={card.tradeable ? "success" : "default"}
                            size="small"
                          />
                          {isOwner && (
                            <Tooltip title="Toggle Tradeable">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTradeable(card.id, card.tradeable);
                                }}
                              >
                                <SwapHorizIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToTradeCart(card);
                            }}
                          >
                            Add to Trade
                          </Button>
                        
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {!isOwner && tradeCart.length > 0 && (
        <Box
          sx={{
            position: "fixed",
            right: 20,
            top: 100,
            width: 300,
            bgcolor: "#fff",
            p: 2,
            boxShadow: 3,
            zIndex: 10,
          }}
        >
          <Typography variant="h6">Trade Cart</Typography>
          {tradeCart.map((card) => (
            <Box key={card.id} sx={{ mb: 1 }}>
              <Typography fontWeight="bold">{card.card_name}</Typography>
              <Typography variant="body2">Set: {card.set_name}</Typography>
              <Typography variant="body2">Value: ${card.trade_value?.toFixed(2)}</Typography>
              <Button
                size="small"
                color="error"
                onClick={() => removeFromTradeCart(card.id)}
              >
                Remove
              </Button>
            </Box>
          ))}
          <Typography fontWeight="bold">Total: ${totalTradeValue.toFixed(2)}</Typography>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => setShowModal(true)}
          >
            Offer a Trade
          </Button>
        </Box>
      )}

      <TradeOfferModal
        open={showModal}
        onClose={() => setShowModal(false)}
        tradeCart={tradeCart}
        totalValue={totalTradeValue}
        onSubmit={(data) => {
          console.log("Sending trade offer:", data);
        }}
      />
    </Box>
  );
};

export default InventoryPage;
