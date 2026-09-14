import React, { useState } from 'react';
import { User, FoodItem } from '../types';

interface CheckoutScreenProps {
  currentUser: User;
  cart: { [foodId: string]: number };
  foods: FoodItem[];
  dinnerDate: string;
  onBackToMenu: () => void;
  onConfirmPayment: () => void;
}

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  currentUser,
  cart,
  foods,
  dinnerDate,
  onBackToMenu,
  onConfirmPayment,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const cartEntries = Object.entries(cart).filter(([_, qty]) => (qty as number) > 0);
  const selectedItems = cartEntries.map(([foodId, qty]) => {
    const food = foods.find((f) => String(f.id) === String(foodId)) || {
      id: foodId,
      name: 'Special Item',
      price: 0,
      available: true,
    };
    const quantityNum = Number(qty);
    return {
      food,
      quantity: quantityNum,
      subtotal: food.price * quantityNum,
    };
  });

  const subtotal = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirmPayment();
    }, 700);
  };

  return (
    <section id="checkout" className="screen narrow-screen active">
      <button className="back-link" onClick={onBackToMenu} type="button">
        ← Back to menu
      </button>

      <p className="eyebrow">SECURE CHECKOUT</p>
      <h1>Review your meal</h1>

      <div id="orderSummary" className="order-summary">
        <div className="pb-3 border-b border-[#eee5d6] mb-3 flex justify-between flex-wrap gap-1 text-xs text-[#69768a]">
          <span>STUDENT: <strong className="text-[#17253a]">{currentUser.name}</strong> ({currentUser.id} • {currentUser.block})</span>
          <span>DATE: <strong>{dinnerDate}</strong> (10:30 PM – 12:30 AM)</span>
        </div>

        {selectedItems.map(({ food, quantity, subtotal: itemSub }) => (
          <div key={food.id} className="summary-row">
            <span>
              {food.name}{' '}
              <span className="text-[#69768a] text-xs font-semibold">× {quantity}</span>
            </span>
            <span className="font-mono font-medium">₹{itemSub}</span>
          </div>
        ))}

        <div className="summary-row text-xs text-[#69768a] pt-2">
          <span>Mess Service & Token Processing</span>
          <span className="text-[#13736d] font-bold">FREE</span>
        </div>

        <div className="summary-total summary-row">
          <span>Total Payable</span>
          <span className="font-mono text-xl text-[#17253a]">₹{subtotal}</span>
        </div>
      </div>

      <div className="payment-card">
        <div>
          <span className="pay-icon">⌁</span>
          <div>
            <strong>Demo payment</strong>
            <p>Instant UPI / College Card simulation. No real charges.</p>
          </div>
        </div>

        <button
          id="payButton"
          className="primary"
          onClick={handlePay}
          disabled={isProcessing || subtotal === 0}
        >
          {isProcessing ? (
            <span>Authorizing...</span>
          ) : (
            <>
              Pay <span id="payAmount">₹{subtotal}</span> <b>→</b>
            </>
          )}
        </button>
      </div>

      <p className="security-note">
        🔒 The backend calculates the final price and generates the secure one-time QR pass only after verified payment confirmation. Single entry is strictly enforced.
      </p>
    </section>
  );
};
