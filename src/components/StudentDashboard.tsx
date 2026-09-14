import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, FoodItem, CrowdState } from '../types';

interface StudentDashboardProps {
  currentUser: User;
  foods: FoodItem[];
  cart: { [foodId: string]: number };
  onUpdateCart: (foodId: number | string, delta: number) => void;
  crowdState: CrowdState;
  onProceedToCheckout: () => void;
  onLogout: () => void;
  menuDate: string;
  onDateChange: (date: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  foods,
  cart,
  onUpdateCart,
  crowdState,
  onProceedToCheckout,
  onLogout,
  menuDate,
  onDateChange,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [isPlateDrawerOpen, setIsPlateDrawerOpen] = useState<boolean>(false);

  const totalItems = Object.values(cart).reduce<number>((sum, q) => sum + (Number(q) || 0), 0);
  const totalAmount = foods.reduce((sum, f) => {
    const qty = cart[f.id] || 0;
    return sum + f.price * qty;
  }, 0);

  // Auto-pop up items in plate when choosing at least one item
  const prevItemsCount = useRef(totalItems);
  useEffect(() => {
    if (prevItemsCount.current === 0 && totalItems > 0) {
      setIsPlateDrawerOpen(true);
    } else if (totalItems === 0) {
      setIsPlateDrawerOpen(false);
    }
    prevItemsCount.current = totalItems;
  }, [totalItems]);

  const crowdPercent = Math.min(100, Math.round((crowdState.currentCount / crowdState.capacity) * 100));

  const filteredFoods = foods.filter((f) => {
    if (filterCategory === 'veg') {
      return (
        f.name.toLowerCase().includes('veg') ||
        f.name.toLowerCase().includes('paneer') ||
        f.name.toLowerCase().includes('dal') ||
        f.name.toLowerCase().includes('meals') ||
        f.name.toLowerCase().includes('chapati')
      );
    }
    if (filterCategory === 'nonveg') {
      return (
        f.name.toLowerCase().includes('chicken') ||
        f.name.toLowerCase().includes('egg') ||
        f.name.toLowerCase().includes('mutton')
      );
    }
    return true;
  });

  const plateItems = foods
    .filter((f) => (cart[f.id] || 0) > 0)
    .map((f) => ({
      ...f,
      quantity: cart[f.id] || 0,
    }));

  return (
    <section id="student" className="screen active">
      <div className="page-heading">
        <div>
          <p className="eyebrow">STUDENT MESS DASHBOARD</p>
          <h1>
            Hello, <span id="studentName">{currentUser.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#13736d] bg-[#e6f4f1] px-2.5 py-0.5 rounded-full text-xs border border-[#c4e3dc]">
              🏠 {currentUser.block} Mess
            </span>
            {currentUser.roomNo && (
              <span className="text-xs text-[#69768a] bg-[#f0eee9] px-2 py-0.5 rounded-full">
                Room: {currentUser.roomNo}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Live Crowd Monitor */}
      <div className="quick-grid">
        <article className="crowd-widget">
          <div className="widget-top">
            <span className="icon-ball">◉</span>
            <p>{currentUser.block.toUpperCase()} LIVE CROWD MONITOR</p>
          </div>
          <div className="crowd-line">
            <strong id="crowdCount">{crowdState.currentCount}</strong>
            <span>/ <span id="crowdCapacity">{crowdState.capacity}</span> inside {currentUser.block} mess</span>
          </div>
          <div className="progress">
            <i id="crowdBar" style={{ width: `${crowdPercent}%` }} />
          </div>
          <div className="widget-foot">
            <b id="crowdLevel">{crowdState.statusLevel} ({crowdPercent}% full)</b>
            <span id="waitTime">~{crowdState.waitTimeMinutes} min wait</span>
          </div>
        </article>
      </div>

      <div className="toolbar">
        <div>
          <p className="eyebrow">{currentUser.block.toUpperCase()} EXCLUSIVE MENU</p>
          <h2>Tonight’s dishes ({currentUser.block})</h2>
        </div>
        <label className="date-picker">
          Dinner date
          <input
            id="menuDate"
            type="date"
            value={menuDate}
            onChange={(e) => onDateChange(e.target.value)}
          />
        </label>
      </div>

      <div id="menuMeta" className="menu-meta flex items-center justify-end flex-wrap gap-2">
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'all' ? 'bg-[#17253a] text-white' : 'bg-[#eee7d8] text-[#556272]'
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('veg')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'veg' ? 'bg-[#13736d] text-white' : 'bg-[#eee7d8] text-[#556272]'
            }`}
          >
            🥬 Pure Veg
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('nonveg')}
            className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
              filterCategory === 'nonveg' ? 'bg-[#ff7759] text-white' : 'bg-[#eee7d8] text-[#556272]'
            }`}
          >
            🍗 Non-Veg & Egg
          </button>
        </div>
      </div>

      <div id="foodGrid" className="food-grid">
        {filteredFoods.length > 0 ? (
          filteredFoods.map((food) => {
            const qty = cart[food.id] || 0;
            return (
              <div key={food.id} className="food-card">
                <div className="food-icon">{food.icon || '🍛'}</div>
                <h3>{food.name}</h3>
                <div className="food-bottom">
                  <strong>₹{food.price}</strong>
                  <div className="qty-control">
                    <button
                      type="button"
                      onClick={() => onUpdateCart(food.id, -1)}
                      disabled={qty === 0}
                      className={qty === 0 ? 'opacity-40 cursor-not-allowed' : ''}
                      aria-label={`Decrease ${food.name}`}
                    >
                      -
                    </button>
                    <span>{qty}</span>
                    <button
                      type="button"
                      onClick={() => onUpdateCart(food.id, 1)}
                      aria-label={`Increase ${food.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No dishes found matching this category filter.</p>
          </div>
        )}
      </div>

      {/* Floating Plate Bar with Pop-up Drawer when choosing at least one item */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            key="plate-popup-container"
            initial={{ y: 90, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 90, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            className="fixed z-50 bottom-5 left-1/2 -translate-x-1/2 w-[min(580px,calc(100%-28px))]"
            aria-label="Plate items summary"
          >
            {/* Pop-up Drawer showing items in plate */}
            <AnimatePresence>
              {isPlateDrawerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 16, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 16, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mb-2.5 bg-[#17253a] border border-[#2b3d56] rounded-2xl p-4 text-white shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#2b3d56]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🍽️</span>
                      <strong className="text-sm font-bold tracking-wide">
                        Items in Your Plate ({totalItems})
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlateDrawerOpen(false)}
                      className="text-xs text-[#a3b3c2] hover:text-white px-2.5 py-1 rounded bg-[#223348] hover:bg-[#2b3f58] transition"
                      aria-label="Collapse plate items"
                    >
                      Hide ▲
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-[#223348] py-1 my-1">
                    {plateItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{item.icon || '🍲'}</span>
                          <div>
                            <p className="font-bold text-white leading-tight">{item.name}</p>
                            <p className="text-[#a3b3c2] font-mono text-[11px]">₹{item.price} each</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-[#223348] px-2 py-1 rounded-md">
                            <button
                              type="button"
                              onClick={() => onUpdateCart(item.id, -1)}
                              className="w-5 h-5 flex items-center justify-center font-bold text-[#ff7759] hover:bg-[#2e4460] rounded cursor-pointer"
                              aria-label={`Decrease ${item.name}`}
                            >
                              -
                            </button>
                            <span className="font-mono font-bold text-white px-1">
                              {cart[item.id]}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateCart(item.id, 1)}
                              className="w-5 h-5 flex items-center justify-center font-bold text-[#13736d] hover:bg-[#2e4460] rounded cursor-pointer"
                              aria-label={`Increase ${item.name}`}
                            >
                              +
                            </button>
                          </div>
                          <span className="font-mono font-bold text-[#ff7759] w-12 text-right">
                            ₹{item.price * (cart[item.id] || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-[#2b3d56] flex items-center justify-between text-xs text-[#a3b3c2]">
                    <span>Plate subtotal:</span>
                    <strong className="font-mono text-white text-sm">₹{totalAmount}</strong>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Bar: click left to toggle items, click button to review */}
            <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-[#17253a] text-white rounded-2xl shadow-2xl border border-[#2b3d56]">
              <button
                type="button"
                onClick={() => setIsPlateDrawerOpen((prev) => !prev)}
                className="flex items-center gap-3 text-left hover:opacity-90 transition group cursor-pointer"
                aria-label={isPlateDrawerOpen ? 'Collapse items in plate' : 'Expand items in plate'}
              >
                <div className="w-10 h-10 rounded-xl bg-[#223348] group-hover:bg-[#2b3f58] transition flex items-center justify-center text-lg relative">
                  🍽️
                  <span className="absolute -top-1 -right-1 bg-[#ff7759] text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {totalItems}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span id="cartItems" className="text-xs text-[#c5d0d5] font-semibold">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'} in plate
                    </span>
                    <span className="text-[11px] text-[#ff7759] font-bold">
                      {isPlateDrawerOpen ? '▲ Hide' : '▼ View items'}
                    </span>
                  </div>
                  <strong id="cartAmount" className="block font-mono text-xl sm:text-2xl text-white tracking-tight leading-none mt-1">
                    ₹{totalAmount}
                  </strong>
                </div>
              </button>

              <button
                id="goCheckout"
                type="button"
                className="primary"
                onClick={onProceedToCheckout}
              >
                Review meal <b>→</b>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
