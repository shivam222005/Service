import React from 'react';
import { Booking, PaymentReceipt } from '../types.js';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  Download, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  User, 
  IndianRupee 
} from 'lucide-react';

interface PaymentReceiptModalProps {
  booking: Booking;
  receipt: PaymentReceipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  booking,
  receipt,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const basePrice = receipt?.breakdown?.baseAmount || booking.total_price;
  const taxAmount = receipt?.breakdown?.taxAmount || Math.round(basePrice * 0.18);
  const platformFee = receipt?.breakdown?.platformFee || 29;
  const totalAmount = receipt?.breakdown?.totalAmount || Math.round(basePrice + taxAmount + platformFee);
  const receiptId = receipt?.receipt_id || `SHUB-RCP-${booking.id}-${new Date().getFullYear()}`;
  const bankRef = receipt?.bank_reference || booking.payment_record?.bank_reference || `UPI-${booking.id}-SETTLED`;
  const paidDate = receipt?.paid_at 
    ? new Date(receipt.paid_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 print:shadow-none print:border-none print:my-0">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="p-4 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Verified Tax Invoice & Digital Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="p-8 sm:p-10 space-y-8 bg-white text-slate-900" id="receipt-print-area">
          
          {/* Header Brand & Invoice ID */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white font-black flex items-center justify-center text-lg shadow-sm">
                  S
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">ServiceHub India</h1>
                  <p className="text-[11px] text-slate-500 font-medium">Verified Local & Rural Services Marketplace</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">GSTIN: 27AABCS1429B1Z8 • Pune, Maharashtra</p>
            </div>

            <div className="sm:text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> PAID · SETTLED
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-2">INVOICE #{receiptId}</p>
              <p className="text-xs text-slate-500">Date: {paidDate}</p>
            </div>
          </div>

          {/* Customer & Specialist Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Billed To (Customer)</p>
              <p className="font-bold text-slate-900 text-sm">{receipt?.customer_name || booking.customer_name}</p>
              {booking.customer_phone && <p className="text-slate-600 mt-0.5">Phone: {booking.customer_phone}</p>}
              {booking.customer_email && <p className="text-slate-600">Email: {booking.customer_email}</p>}
              <p className="text-slate-600 mt-1 line-clamp-2">Address: {booking.address}{booking.pincode ? ` - ${booking.pincode}` : ''}</p>
            </div>

            <div className="sm:border-l sm:border-slate-200 sm:pl-6">
              <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Service Professional</p>
              <p className="font-bold text-slate-900 text-sm">{receipt?.provider_name || booking.provider_name}</p>
              <p className="font-medium text-slate-700">{receipt?.provider_business || booking.provider_business}</p>
              {booking.provider_phone && <p className="text-slate-600 mt-0.5">Contact: {booking.provider_phone}</p>}
              <p className="text-slate-600 mt-1">Booking Ref: #{booking.id}</p>
            </div>
          </div>

          {/* Service & Tax Line Items */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4 text-center">Service Mode</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {receipt?.service_title || booking.service_title}
                    <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Completed on {booking.booking_date} ({booking.time_slot})
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                    {booking.service_mode}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{basePrice.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-slate-600">
                    Integrated GST @ 18% (Home & Field Services)
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-slate-800">
                    ₹{taxAmount.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className="py-2 px-4 text-slate-600">
                    Platform Facilitation & Escrow Safety Fee
                  </td>
                  <td className="py-2 px-4 text-right font-mono text-slate-800">
                    ₹{platformFee.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-blue-50/60 font-bold border-t-2 border-slate-200">
                <tr>
                  <td colSpan={2} className="py-3.5 px-4 text-sm text-blue-900">
                    Total Amount Paid (INR)
                  </td>
                  <td className="py-3.5 px-4 text-right text-base text-blue-900 font-mono font-black">
                    ₹{totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Gateway Audit Footer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Payment Audit Reference</p>
              <p className="font-mono text-slate-500 text-[11px] mt-0.5">Bank RRN / Ref: {bankRef}</p>
            </div>
            <div className="sm:text-right">
              <p className="font-semibold text-slate-800">Method: UPI QR Instant Pay</p>
              <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 sm:justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated by NPCI UPI
              </p>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Thank you for choosing ServiceHub. This computer-generated invoice is valid under the Indian Information Technology Act, 2000.
          </div>

        </div>

        {/* Action Button (Hidden in Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors"
          >
            Close Receipt
          </button>
          <button
            onClick={handlePrint}
            className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download Tax Invoice
          </button>
        </div>

      </div>
    </div>
  );
};
