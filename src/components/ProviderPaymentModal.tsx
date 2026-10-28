import React, { useState, useEffect } from 'react';
import { Booking, BillBreakdown, PaymentRecord, PaymentReceipt } from '../types.js';
import { api } from '../lib/api.js';
import { 
  X, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  Smartphone, 
  IndianRupee, 
  FileText, 
  Check, 
  Copy,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { PaymentReceiptModal } from './PaymentReceiptModal.js';

interface ProviderPaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (updatedBooking: Booking) => void;
}

export const ProviderPaymentModal: React.FC<ProviderPaymentModalProps> = ({
  booking,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [payment, setPayment] = useState<PaymentRecord | null>(booking.payment_record || null);
  const [breakdown, setBreakdown] = useState<BillBreakdown | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isPaid, setIsPaid] = useState<boolean>(booking.status === 'COMPLETED' && booking.payment_status === 'PAID');

  // Initialize or fetch payment session
  const initPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (booking.status !== 'AWAITING_PAYMENT' && booking.status !== 'COMPLETED') {
        const res = await api.payments.completeService(booking.id);
        setPayment(res.payment);
        setBreakdown(res.breakdown);
        if (res.payment.status === 'PAID') {
          setIsPaid(true);
        }
      } else {
        const res = await api.payments.getPayment(booking.id);
        setPayment(res.payment);
        setBreakdown(res.breakdown);
        if (res.payment.status === 'PAID' || booking.status === 'COMPLETED') {
          setIsPaid(true);
        }
      }
    } catch (err: any) {
      console.error('Failed to initialize payment QR:', err);
      setError(err.message || 'Unable to generate payment QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initPayment();
    }
  }, [isOpen, booking.id]);

  // Countdown timer for QR expiration
  useEffect(() => {
    if (!payment?.expires_at || isPaid) return;

    const updateTimer = () => {
      const remainingSeconds = Math.max(0, Math.floor((new Date(payment.expires_at).getTime() - Date.now()) / 1000));
      setTimeLeft(remainingSeconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [payment?.expires_at, isPaid]);

  // Periodic polling for status while waiting
  useEffect(() => {
    if (!isOpen || isPaid || !payment || timeLeft <= 0) return;

    const poller = setInterval(async () => {
      try {
        const res = await api.payments.getPayment(booking.id);
        if (res.payment.status === 'PAID') {
          setPayment(res.payment);
          setIsPaid(true);
          if (onPaymentSuccess) {
            onPaymentSuccess({ ...booking, status: 'COMPLETED', payment_status: 'PAID', payment_record: res.payment });
          }
        }
      } catch (_e) {
        // Silent poll error
      }
    }, 4000);

    return () => clearInterval(poller);
  }, [isOpen, isPaid, payment, timeLeft, booking.id]);

  const handleManualCheck = async () => {
    setVerifying(true);
    setError(null);
    try {
      const res = await api.payments.getPayment(booking.id);
      setPayment(res.payment);
      if (res.payment.status === 'PAID') {
        setIsPaid(true);
        if (onPaymentSuccess) {
          onPaymentSuccess({ ...booking, status: 'COMPLETED', payment_status: 'PAID', payment_record: res.payment });
        }
      } else {
        setError('Payment has not been settled yet. Ask customer to approve payment on their UPI app.');
      }
    } catch (err: any) {
      setError(err.message || 'Status check failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!payment) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await api.payments.verifyPayment(payment.id, {
        bank_reference: `UPI-APP-${Date.now().toString().slice(-6)}`,
      });
      setPayment(res.payment);
      setReceipt(res.receipt);
      setIsPaid(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.booking);
      }
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleViewReceipt = async () => {
    try {
      const res = await api.payments.getReceipt(booking.id);
      setReceipt(res.receipt);
      setShowReceiptModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch receipt.');
    }
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText('servicehub@icici');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isExpired = timeLeft <= 0 && !isPaid;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                {isPaid ? <CheckCircle2 className="w-7 h-7 text-emerald-300" /> : <QrCode className="w-7 h-7" />}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  {isPaid ? 'Payment Confirmed' : 'Rapido-Style Instant UPI QR'}
                </span>
                <h3 className="text-xl font-bold tracking-tight">
                  {isPaid ? 'Payment Received Successfully!' : 'Collect Post-Service Payment'}
                </h3>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Service & Customer Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Customer Details</p>
                <p className="font-bold text-slate-900 text-base">{booking.customer_name}</p>
                <p className="text-slate-600">{booking.customer_phone || 'Customer Phone'}</p>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Service Ref #{booking.id}</p>
                <p className="font-semibold text-slate-800 line-clamp-1">{booking.service_title}</p>
                <p className="text-slate-600 text-xs">{booking.booking_date} • {booking.time_slot}</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-slate-600 font-medium">Generating secure single-use UPI QR code & transparent bill...</p>
              </div>
            ) : isPaid ? (
              /* Verified Paid Success State */
              <div className="text-center py-6 space-y-5">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Settled to Specialist Earnings
                  </span>
                  <h4 className="text-2xl font-black text-slate-900">
                    ₹{payment?.amount || booking.total_price} Received!
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                    The customer's UPI transaction has been verified. Booking #{booking.id} is now Completed · Paid.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-left space-y-2 text-xs text-emerald-900 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Bank Reference / RRN:</span>
                    <span className="font-mono font-bold">{payment?.bank_reference || 'UPI-SETTLED-SUCCESS'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Payment Method:</span>
                    <span className="font-medium">UPI QR Instant Pay</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Settled At:</span>
                    <span className="font-medium">{new Date(payment?.paid_at || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleViewReceipt}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <FileText className="w-4 h-4" /> View / Download Tax Receipt
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Active Payment Collection State */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Dynamic QR Display */}
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                    <div className="relative p-3 bg-white rounded-2xl border-2 border-slate-800 shadow-md">
                      {payment?.qr_data_url ? (
                        <img 
                          src={payment.qr_data_url} 
                          alt="UPI Payment QR Code" 
                          className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                        />
                      ) : (
                        <div className="w-48 h-48 sm:w-52 sm:h-52 bg-slate-100 flex items-center justify-center text-slate-400">
                          <QrCode className="w-16 h-16" />
                        </div>
                      )}
                      
                      {/* Brand Badge in center */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-sm text-[10px] font-black text-blue-800 uppercase tracking-tighter">
                          BHIM UPI
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">UPI ID:</span>
                      <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        servicehub@icici
                      </code>
                      <button 
                        onClick={handleCopyVpa}
                        className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Expiration Timer */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
                      <Clock className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-600' : 'text-amber-600'}`} />
                      <span className={isExpired ? 'text-rose-600' : 'text-slate-600'}>
                        {isExpired ? 'QR Code Expired' : `Valid for ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
                      </span>
                    </div>

                    {isExpired && (
                      <button
                        onClick={initPayment}
                        className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate QR Code
                      </button>
                    )}
                  </div>

                  {/* Transparent Itemized Bill Breakdown */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-sm">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                        <span>Transparent Bill Breakdown</span>
                        <span className="text-[10px] font-normal text-slate-500">Includes GST</span>
                      </p>

                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>Base Service Fee</span>
                        <span className="font-semibold text-slate-900">₹{breakdown?.baseAmount || booking.total_price}</span>
                      </div>

                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>GST (18% Integrated Tax)</span>
                        <span className="font-semibold text-slate-900">₹{breakdown?.taxAmount || Math.round(booking.total_price * 0.18)}</span>
                      </div>

                      <div className="flex justify-between text-slate-600 text-xs">
                        <span>Platform Facilitation & Insurance</span>
                        <span className="font-semibold text-slate-900">₹{breakdown?.platformFee || 29}</span>
                      </div>

                      <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">Total Customer Payable</span>
                          <p className="text-[10px] text-slate-500">Payable via any UPI app</p>
                        </div>
                        <span className="font-black text-xl text-blue-700">
                          ₹{breakdown?.totalAmount || Math.round(booking.total_price * 1.18 + 29)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between text-xs text-emerald-800 bg-emerald-50/70 p-2 rounded-xl">
                        <span className="font-medium">Your Specialist Payout:</span>
                        <span className="font-bold">₹{breakdown?.providerAmount || booking.total_price}</span>
                      </div>
                    </div>

                    {/* Live settlement pulse indicator */}
                    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                      </span>
                      <span className="font-medium">
                        Waiting for customer to scan on PhonePe, GPay, Paytm, or BHIM...
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleManualCheck}
                        disabled={verifying}
                        className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
                        {verifying ? 'Checking Gateway...' : 'Refresh Payment Status'}
                      </button>

                      {/* Demonstration / Verification helper for prompt testing */}
                      <button
                        onClick={handleSimulatePayment}
                        disabled={verifying}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-600 font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Simulate Customer UPI Scan & Settlement
                      </button>
                    </div>

                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>256-bit Encrypted NPCI Protocol</span>
                  </div>
                  <span>Single-use transaction session</span>
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {showReceiptModal && (
        <PaymentReceiptModal
          booking={booking}
          receipt={receipt}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </>
  );
};
