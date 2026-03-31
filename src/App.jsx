import { useState, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import './index.css';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_MAIN_OPTIONS = [
  { id: 'm1', name: "Hot Dogs & Hamburgers", type: 'main' },
  { id: 'm2', name: "Mexican Chicken and Beef", type: 'main' },
  { id: 'm3', name: "Pork Tenderloin", type: 'main' },
  { id: 'm4', name: "Pizza", type: 'main' },
  { id: 'm5', name: "Mediterranean Chicken", type: 'main' },
  { id: 'm6', name: "Wontons", type: 'main' },
  { id: 'm7', name: "Chicken Nuggets", type: 'main' },
  { id: 'm8', name: "Pasta & Meat", type: 'main' },
  { id: 'm9', name: "Salsa Verde Chicken/Pork", type: 'main' },
  { id: 'm10', name: "BBQ Chicken/Pork", type: 'main' },
];

const DEFAULT_SIDE_OPTIONS = [
  { id: 's1', name: "Mac & Cheese", type: 'side' },
  { id: 's2', name: "Carrot Sticks", type: 'side' },
  { id: 's3', name: "Salad", type: 'side' },
  { id: 's4', name: "Brussels Sprouts & Balsamic", type: 'side' },
  { id: 's5', name: "Mashed Potatoes", type: 'side' },
  { id: 's6', name: "Rice", type: 'side' },
  { id: 's7', name: "Green Beans", type: 'side' },
  { id: 's8', name: "Corn on the Cob", type: 'side' },
  { id: 's9', name: "Potatoes", type: 'side' },
  { id: 's10', name: "Salad", type: 'side' },
  { id: 's11', name: "Croissants", type: 'side' },
  { id: 's12', name: "Fruit", type: 'side' },
];

function App() {
  const [mainOptions, setMainOptions] = useState(DEFAULT_MAIN_OPTIONS);
  const [sideOptions, setSideOptions] = useState(DEFAULT_SIDE_OPTIONS);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState("");

  const [weeksPlan, setWeeksPlan] = useState(() => {
    const saved = localStorage.getItem('mealPlannerWeeksPlan');
    return saved ? JSON.parse(saved) : { Mo: [], Tu: [], We: [], Th: [], Fr: [], Sa: [], Su: [] };
  });
  const [stuffToBuy, setStuffToBuy] = useState(() => {
    const saved = localStorage.getItem('mealPlannerStuffToBuy');
    return saved ? JSON.parse(saved) : [];
  });

  const [newBuyItemText, setNewBuyItemText] = useState("");
  const [showAddBuyItem, setShowAddBuyItem] = useState(false);

  const [editingBuyItemIndex, setEditingBuyItemIndex] = useState(null);
  const [editingBuyItemText, setEditingBuyItemText] = useState("");

  const [activeCustomDay, setActiveCustomDay] = useState(null);
  const [customText, setCustomText] = useState("");
  const [customType, setCustomType] = useState("main");

  const [popover, setPopover] = useState({
    visible: false,
    item: null, // item object
    sourceDay: null, // 'Mo', 'Tu', etc. if clicked from Week's Plan
    x: 0,
    y: 0
  });

  const popoverRef = useRef(null);

  const loadSheetData = async (url) => {
    if (!url) {
      setMainOptions(DEFAULT_MAIN_OPTIONS);
      setSideOptions(DEFAULT_SIDE_OPTIONS);
      return;
    }

    setIsLoadingSheet(true);
    setSheetError("");

    try {
      let sheetId = url;
      const match = url.match(/\/d\/(.*?)\//);
      if (match && match[1]) {
        sheetId = match[1];
      }
      
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

      Papa.parse(exportUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length && results.data.length === 0) {
            setSheetError("Failed to parse CSV. Make sure the sheet is public.");
            setIsLoadingSheet(false);
            return;
          }

          const newMains = [];
          const newSides = [];

          results.data.forEach((row, index) => {
            const name = row['Name'] || row['name'] || row['Title'] || row['title'];
            const typeStr = (row['Type'] || row['type'] || "").toLowerCase();
            
            if (!name) return; // Skip rows without name

            const item = {
              id: `sheet-${index}`,
              name: name.trim(),
              type: typeStr === 'side' ? 'side' : 'main'
            };

            if (item.type === 'side') {
              newSides.push(item);
            } else {
              newMains.push(item);
            }
          });

          if (newMains.length === 0 && newSides.length === 0) {
            setSheetError("Could not find 'Name' or 'Type' columns in the sheet.");
            setMainOptions(DEFAULT_MAIN_OPTIONS);
            setSideOptions(DEFAULT_SIDE_OPTIONS);
            setIsLoadingSheet(false);
            return;
          }

          setMainOptions(newMains);
          setSideOptions(newSides);
          setIsLoadingSheet(false);
        },
        error: (err) => {
          console.error(err);
          setSheetError("Could not fetch the Google Sheet. Make sure it is set to 'Anyone with the link can view'.");
          setMainOptions(DEFAULT_MAIN_OPTIONS);
          setSideOptions(DEFAULT_SIDE_OPTIONS);
          setIsLoadingSheet(false);
        }
      });
    } catch (err) {
      console.error(err);
      setSheetError("An unexpected error occurred.");
      setMainOptions(DEFAULT_MAIN_OPTIONS);
      setSideOptions(DEFAULT_SIDE_OPTIONS);
      setIsLoadingSheet(false);
    }
  };

  useEffect(() => {
    const savedUrl = localStorage.getItem('mealPlannerSheetUrl');
    if (savedUrl) {
      setSheetUrl(savedUrl);
      loadSheetData(savedUrl);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mealPlannerWeeksPlan', JSON.stringify(weeksPlan));
  }, [weeksPlan]);

  useEffect(() => {
    localStorage.setItem('mealPlannerStuffToBuy', JSON.stringify(stuffToBuy));
  }, [stuffToBuy]);

  const handleSaveSettings = () => {
    localStorage.setItem('mealPlannerSheetUrl', sheetUrl);
    loadSheetData(sheetUrl);
  };

  const handleClearSettings = () => {
    setSheetUrl("");
    localStorage.removeItem('mealPlannerSheetUrl');
    setMainOptions(DEFAULT_MAIN_OPTIONS);
    setSideOptions(DEFAULT_SIDE_OPTIONS);
    setSheetError("");
  };

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopover(prev => ({ ...prev, visible: false }));
      }
    }
    if (popover.visible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popover.visible]);

  const handleItemClick = (e, item, sourceDay = null) => {
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    // Position slightly below the clicked item
    setPopover({
      visible: true,
      item,
      sourceDay,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8
    });
  };

  const closePopover = () => {
    setPopover({ ...popover, visible: false });
  };

  const handleDaySelect = (day) => {
    const { item, sourceDay } = popover;

    setWeeksPlan(prev => {
      const newPlan = { ...prev };

      if (sourceDay) {
        // Move item
        if (sourceDay !== day) {
          // Remove from source
          newPlan[sourceDay] = newPlan[sourceDay].filter(i => i.id !== item.id);
          // Add to target
          newPlan[day] = [...newPlan[day], item];
          // Sort target keeping main first, then sides
          newPlan[day].sort((a, b) => (a.type === 'main' ? -1 : 1));
        }
      } else {
        // Add new item from options
        const newItem = { id: Date.now() + Math.random().toString(), name: item.name, type: item.type };
        newPlan[day] = [...newPlan[day], newItem];
        newPlan[day].sort((a, b) => (a.type === 'main' ? -1 : 1));
      }
      return newPlan;
    });
    closePopover();
  };

  const handleRemoveFromPlan = () => {
    const { item, sourceDay } = popover;
    if (sourceDay) {
      setWeeksPlan(prev => {
        const newPlan = { ...prev };
        newPlan[sourceDay] = newPlan[sourceDay].filter(i => i.id !== item.id);
        return newPlan;
      });
    }
    closePopover();
  };

  const handleAddBuyItem = () => {
    if (newBuyItemText.trim() !== '') {
      setStuffToBuy([...stuffToBuy, newBuyItemText.trim()]);
      setNewBuyItemText('');
    }
  };

  const handleRemoveBuyItem = (index) => {
    setStuffToBuy(prev => prev.filter((_, i) => i !== index));
    if (editingBuyItemIndex === index) {
      setEditingBuyItemIndex(null);
      setEditingBuyItemText("");
    }
  };

  const handleStartEditBuyItem = (index, text) => {
    setEditingBuyItemIndex(index);
    setEditingBuyItemText(text);
  };

  const handleSaveEditBuyItem = (index) => {
    if (editingBuyItemText.trim()) {
      setStuffToBuy(prev => {
        const newList = [...prev];
        newList[index] = editingBuyItemText.trim();
        return newList;
      });
      setEditingBuyItemIndex(null);
      setEditingBuyItemText("");
    } else {
      handleRemoveBuyItem(index);
    }
  };

  const handleCancelEditBuyItem = () => {
    setEditingBuyItemIndex(null);
    setEditingBuyItemText("");
  };

  const handleAddCustom = (day) => {
    if (customText.trim()) {
      const newItem = {
        id: Date.now() + Math.random().toString(),
        name: customText.trim(),
        type: customType
      };
      setWeeksPlan(prev => {
        const newPlan = { ...prev, [day]: [...prev[day], newItem] };
        newPlan[day].sort((a, b) => (a.type === 'main' ? -1 : 1));
        return newPlan;
      });
      setCustomText("");
      setActiveCustomDay(null);
    }
  };

  const copyToClipboard = () => {
    let text = "WEEK'S PLAN\n";
    DAYS.forEach((day, index) => {
      text += `${FULL_DAYS[index]}:\n`;
      if (weeksPlan[day].length === 0) text += "  (Empty)\n";
      weeksPlan[day].forEach(item => {
        text += `  - ${item.name} (${item.type})\n`;
      });
    });
    text += "\nSTUFF TO BUY\n";
    if (stuffToBuy.length === 0) text += "  (Empty)\n";
    stuffToBuy.forEach(item => {
      text += `  - ${item}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      alert("Copied to clipboard!");
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert("Failed to copy to clipboard.");
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear the entire meal plan and shopping list?")) {
      setWeeksPlan({ Mo: [], Tu: [], We: [], Th: [], Fr: [], Sa: [], Su: [] });
      setStuffToBuy([]);
    }
  };

  return (
    <div className="app-container">
      <header className="header no-print">
        <h1>Meal Planner</h1>
        <div className="header-buttons">
          <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="btn btn-outline">Settings</button>
          <button onClick={handleClearAll} className="btn btn-outline">Clear All</button>
          <button onClick={copyToClipboard} className="btn">Copy to Clipboard</button>
          <button onClick={handlePrint} className="btn btn-outline">Print</button>
        </div>
      </header>

      {isSettingsOpen && (
        <div className="settings-panel no-print">
          <h2>Google Sheets Integration</h2>
          <p>You can link a Google Sheet to fetch your custom main and side options.</p>
          <p className="help-text" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            <strong>Requirements:</strong> The sheet must be public ("Anyone with the link can view") and have columns labeled "Name" and "Type" (where Type is either "main" or "side").
          </p>
          <div className="inline-form" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Paste Google Sheet URL here..." 
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <button className="btn" onClick={handleSaveSettings}>Save & Fetch</button>
            <button className="btn btn-outline" onClick={handleClearSettings}>Clear</button>
          </div>
          {isLoadingSheet && <p className="loading-text" style={{ color: '#0066cc' }}>Loading sheet data...</p>}
          {sheetError && <p className="error-text" style={{ color: '#cc0000' }}>{sheetError}</p>}
        </div>
      )}

      <div className="grid print-container">
        <div className="column left-column no-print">
          {/* Quadrant 1: Main Options */}
          <section className="quadrant q-main">
            <h2>Main Options</h2>
            <ul className="item-list">
              {mainOptions.map(option => (
                <li key={option.id}>
                  <button
                    className="item-btn main-item"
                    onClick={(e) => handleItemClick(e, option)}
                  >
                    {option.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Quadrant 3: Sides & Such */}
          <section className="quadrant q-sides">
            <h2>Sides & Such</h2>
            <ul className="item-list">
              {sideOptions.map(option => (
                <li key={option.id}>
                  <button
                    className="item-btn side-item"
                    onClick={(e) => handleItemClick(e, option)}
                  >
                    {option.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="column right-column">
          {/* Quadrant 2: Week's Plan */}
          <section className="quadrant q-plan print-full">
            <h2>Week's Plan</h2>
            <div className="days-list">
              {DAYS.map((day, dIdx) => (
                <div key={day} className="day-block">
                  <h3>{FULL_DAYS[dIdx]}</h3>
                  {weeksPlan[day].length === 0 ? (
                    <p className="empty-text">No items</p>
                  ) : (
                    <ul className="plan-items">
                      {weeksPlan[day].map(item => (
                        <li key={item.id}>
                          <button
                            className={`item-btn ${item.type}-item in-plan`}
                            onClick={(e) => handleItemClick(e, item, day)}
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="add-custom-container no-print">
                    {activeCustomDay === day ? (
                      <div className="add-custom-form inline-form">
                        <select
                          value={customType}
                          onChange={(e) => setCustomType(e.target.value)}
                          className="custom-type-select"
                        >
                          <option value="main">Main</option>
                          <option value="side">Side</option>
                        </select>
                        <input
                          type="text"
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          placeholder="Item name..."
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(day); }}
                        />
                        <button onClick={() => handleAddCustom(day)} className="btn-sm">+</button>
                        <button onClick={() => setActiveCustomDay(null)} className="btn-sm btn-outline">×</button>
                      </div>
                    ) : (
                      <button
                        className="add-inline-btn"
                        onClick={() => { setActiveCustomDay(day); setCustomType("main"); setCustomText(""); }}
                      >
                        + Add Item
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quadrant 4: Stuff to Buy */}
          <section className="quadrant q-buy print-full">
            <h2>Stuff to Buy</h2>
            <div className="buy-list-container">
              <ul className="buy-list">
                {stuffToBuy.map((item, idx) => (
                  <li key={idx} className="buy-item">
                    {editingBuyItemIndex === idx ? (
                      <div className="inline-form" style={{ width: '100%' }}>
                        <input
                          type="text"
                          className="buy-item-input"
                          value={editingBuyItemText}
                          onChange={(e) => setEditingBuyItemText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditBuyItem(idx);
                            if (e.key === 'Escape') handleCancelEditBuyItem();
                          }}
                          autoFocus
                        />
                        <button onClick={() => handleSaveEditBuyItem(idx)} className="btn-sm">Save</button>
                      </div>
                    ) : (
                      <>
                        <span
                          className="buy-item-text"
                          onClick={() => handleStartEditBuyItem(idx, item)}
                          title="Click to edit"
                        >
                          {item}
                        </span>
                        <div className="buy-item-actions no-print">
                          <button
                            className="btn-sm btn-outline"
                            onClick={() => handleStartEditBuyItem(idx, item)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className="btn-sm btn-outline"
                            onClick={() => handleRemoveBuyItem(idx)}
                            title="Remove"
                            style={{ color: 'var(--color-accent)' }}
                          >
                            ×
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>

              {!showAddBuyItem ? (
                <button
                  className="btn add-item-btn no-print"
                  onClick={() => setShowAddBuyItem(true)}
                >
                  Add Item
                </button>
              ) : (
                <div className="add-item-form no-print">
                  <input
                    type="text"
                    value={newBuyItemText}
                    onChange={(e) => setNewBuyItemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddBuyItem();
                      if (e.key === 'Escape') setShowAddBuyItem(false);
                    }}
                    placeholder="New item..."
                    autoFocus
                  />
                  <button className="btn" onClick={handleAddBuyItem}>+</button>
                  <button className="btn btn-outline" onClick={() => setShowAddBuyItem(false)}>Cancel</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {popover.visible && (
        <div
          ref={popoverRef}
          className="popover"
          style={{ top: popover.y, left: popover.x }}
        >
          <div className="popover-title">{popover.item.name}</div>
          <div className="popover-btn-group">
            {DAYS.map(day => (
              <button
                key={day}
                className="popover-day-btn"
                onClick={() => handleDaySelect(day)}
              >
                {day}
              </button>
            ))}
          </div>
          {popover.sourceDay && (
            <button
              className="popover-remove-btn"
              onClick={handleRemoveFromPlan}
            >
              Remove from list
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
