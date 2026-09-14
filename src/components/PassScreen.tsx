import React, { useState } from 'react';
import { Order } from '../types';
import { QRCodeDisplay } from './QRCodeDisplay';
import { MessStore } from '../services/store';

interface PassScreenProps {
  order: Order | null;
  onBackToDashboard: () => void;
  onOpenVendorSlip: (order: Order) => void;
  showToast: (msg: string) => void;
}

export const PassScreen: React.FC<PassScreenProps> = ({
  order,
  onBackToDashboard,
  onOpenVendorSlip,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!order) {
    return (
      <section id="pass" className="screen narrow-screen active">
        <div className="empty-state">
          <h3>No active meal pass found</h3>
          <p>Please select items from today's menu to generate a dinner token.</p>
          <button className="primary mt-4" onClick={onBackToDashboard}>
            Go to Menu <b>→</b>
          </button>
        </div>
      </section>
    );
  }

  // Retrieve freshest order from store if available
  const currentOrder = MessStore.getOrderById(order.order_id) || order;

  const handleCopyToken = () => {
    navigator.clipboard?.writeText(currentOrder.token);
    setCopied(true);
    showToast(`Copied ${currentOrder.token} to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUsed = currentOrder.status === 'verified' || currentOrder.status === 'used';
  const isCompleted = currentOrder.is_completed || currentOrder.completion_status === 'completed';

  return (
    <section id="pass" className="screen narrow-screen active">
      <div className="success-head">
        <div className="success-mark">✓</div>
        <p className="eyebrow">PAYMENT CONFIRMED</p>
        <h1>Your meal code is ready</h1>
        <p>Show this QR at the dinner counter or scanner.</p>
      </div>

      <article className="meal-pass">
        <div className={`pass-band ${isUsed ? 'bg-[#506077]' : ''}`}>
          <span>NIGHT MESS • {currentOrder.block || 'CAMPUS'} MESS</span>
          <span className={isUsed ? 'text-amber-300' : 'pass-active'}>
            {isUsed ? '● VERIFIED & ENTERED' : '● ACTIVE'}
          </span>
        </div>

        <div className="pass-body">
          <div>
            <strong id="passToken" className="token-text">
              {currentOrder.token}
            </strong>
            <p id="passDate">
              {currentOrder.dinner_date || 'Tonight'} • 10:30 PM – 12:30 AM
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyToken}
                className="text-xs font-mono font-bold bg-[#f1f4f0] text-[#13736d] px-2.5 py-1 rounded hover:bg-[#e0ece6] transition"
              >
                {copied ? '✓ Copied Code' : '📋 Copy Code'}
              </button>
              <button
                type="button"
                onClick={() => onOpenVendorSlip(currentOrder)}
                className="text-xs font-bold text-[#13736d] underline hover:text-[#0b4d49]"
              >
                View Food Slip
              </button>
            </div>
          </div>

          <div id="qrCode">
            {/* The QR encodes the token/verification string, readable by scanner */}
            <QRCodeDisplay value={currentOrder.token} size={120} />
          </div>
        </div>

        {/* Order Completion Status Banner */}
        <div className="mx-5 mb-3 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs bg-[#fbf9f5] border-[#ebd8bc]">
          <span className="font-semibold text-[#506077]">Order Status:</span>
          {isCompleted ? (
            <span className="font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>✅</span> Completed • Ready for Pickup
            </span>
          ) : currentOrder.completion_status === 'preparing' ? (
            <span className="font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>🍳</span> Kitchen is Preparing Your Meal
            </span>
          ) : (
            <span className="font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>⏳</span> Order Placed • In Queue
            </span>
          )}
        </div>

        <div className="pass-bottom">
          <span id="passStudent">
            {currentOrder.student_name} • {currentOrder.student_id}
          </span>
          <span>{isUsed ? 'Cleared' : ''}</span>
        </div>
      </article>

      {/* Item Summary preview */}
      <div className="mt-4 p-3 bg-white/70 border border-[#e9dfce] rounded-xl text-xs flex justify-between items-center">
        <div className="text-[#506077]">
          <span className="font-bold text-[#17253a]">Reserved Items: </span>
          {currentOrder.items.map((it) => `${it.name} × ${it.quantity}`).join(', ')}
        </div>
        <span className="font-mono font-bold text-sm text-[#17253a]">₹{currentOrder.total_amount}</span>
      </div>

      <div className="flex flex-col gap-2.5 mt-5">
        <button
          type="button"
          className="secondary wide !mt-0 flex items-center justify-center gap-2"
          onClick={() => onOpenVendorSlip(currentOrder)}
        >
          <span>🍽️</span> Open Vendor Counter Serving Slip
        </button>

        <button className="secondary wide !mt-0" onClick={onBackToDashboard}>
          Back to dashboard
        </button>
      </div>
    </section>
  );
};
