import React from 'react';
import { Order } from '../types';

interface VendorSlipModalProps {
  order: Order;
  onClose: () => void;
}

export const VendorSlipModal: React.FC<VendorSlipModalProps> = ({ order, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="vendor-slip" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-center pb-4 border-b border-dashed border-[#e9dfce]">
          <div className="inline-block p-2.5 bg-[#e6f5e8] rounded-full text-2xl mb-1">🍽️</div>
          <h2 className="text-2xl font-black text-[#13736d] tracking-tight my-1">
            KITCHEN / VENDOR SLIP
          </h2>
          <p className="text-xs font-semibold text-[#69768a]">Night Mess Dining Services</p>
        </div>

        <div className="py-4 space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#69768a]">Student:</span>
            <span className="font-bold text-[#17253a]">{order.student_name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#69768a]">Token / Order ID:</span>
            <span className="font-mono font-bold text-[#ff7759]">{order.token}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-100">
            <span className="text-[#69768a]">Status:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                order.status === 'verified'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {order.status === 'verified' ? '✓ VERIFIED & CONFIRMED' : 'CONFIRMED & PAID'}
            </span>
          </div>
        </div>

        <div className="my-3 p-3.5 bg-[#fffaf0] rounded-xl border border-[#eee5d6]">
          <p className="text-[11px] font-bold text-[#13736d] uppercase tracking-wider mb-2">
            Items to Dispense
          </p>
          <ul className="space-y-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between items-center text-sm">
                <span className="font-semibold text-[#17253a]">
                  • {item.name}
                </span>
                <span className="font-mono font-black text-base bg-white px-2 py-0.5 border border-[#e9dfce] rounded">
                  × {item.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-center pt-2 text-xs text-[#69768a]">
          <span>Paid Total: <strong className="text-[#17253a] font-mono text-sm">₹{order.total_amount}</strong></span>
          <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="primary wide mt-4"
        >
          Close Slip <b>✓</b>
        </button>
      </div>
    </div>
  );
};
