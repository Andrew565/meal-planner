import { useState, useRef, useEffect } from 'react';
import './index.css';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function App() {
  const [mainOptions, setMainOptions] = useState([
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
  ]);
  const [sideOptions, setSideOptions] = useState([
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
  ]);
  const [weeksPlan, setWeeksPlan] = useState({
    Mo: [], Tu: [], We: [], Th: [], Fr: [], Sa: [], Su: []
  });
  const [stuffToBuy, setStuffToBuy] = useState([]);

  const [newBuyItemText, setNewBuyItemText] = useState("");
  const [showAddBuyItem, setShowAddBuyItem] = useState(false);

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
      setShowAddBuyItem(false);
    }
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

  return (
    <div className="app-container">
      <header className="header no-print">
        <h1>Meal Planner</h1>
        <div className="header-buttons">
          <button onClick={copyToClipboard} className="btn">Copy to Clipboard</button>
          <button onClick={handlePrint} className="btn btn-outline">Print</button>
        </div>
      </header>

      <div className="grid print-container">
        {/* Quadrant 1: Main Options */}
        <section className="quadrant no-print q-main">
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

        {/* Quadrant 3: Sides & Such */}
        <section className="quadrant no-print q-sides">
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

        {/* Quadrant 4: Stuff to Buy */}
        <section className="quadrant q-buy print-full">
          <h2>Stuff to Buy</h2>
          <div className="buy-list-container">
            <ul className="buy-list">
              {stuffToBuy.map((item, idx) => (
                <li key={idx} className="buy-item">{item}</li>
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
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddBuyItem(); }}
                  placeholder="New item..."
                  autoFocus
                />
                <button className="btn" onClick={handleAddBuyItem}>+</button>
              </div>
            )}
          </div>
        </section>
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
