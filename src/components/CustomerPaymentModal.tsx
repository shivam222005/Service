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
  ExternalLink,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { PaymentReceiptModal } from './PaymentReceiptModal.js';

interface CustomerPaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: (updatedBooking: Booking) => void;
}

export const CustomerPaymentModal: React.FC<CustomerPaymentModalProps> = ({
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

  const fetchPaymentDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.payments.getPayment(booking.id);
      setPayment(res.payment);
      setBreakdown(res.breakdown);
      if (res.payment.status === 'PAID' || booking.status === 'COMPLETED') {
        setIsPaid(true);
      }
    } catch (err: any) {
      console.error('Failed to load payment details:', err);
      setError(err.message || 'Payment session not ready yet. Please wait for the specialist to complete the service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPaymentDetails();
    }
  }, [isOpen, booking.id]);

  // Countdown timer
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

  const handleVerifyPayment = async () => {
    if (!payment) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await api.payments.verifyPayment(payment.id, {
        bank_reference: `UPI-CUST-${Date.now().toString().slice(-6)}`,
      });
      setPayment(res.payment);
      setReceipt(res.receipt);
      setIsPaid(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.booking);
      }
    } catch (err: any) {
      setError(err.message || 'Payment verification failed.');
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
      setError(err.message || 'Failed to fetch invoice.');
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
                {isPaid ? <CheckCircle2 className="w-7 h-7 text-emerald-300" /> : <Smartphone className="w-7 h-7" />}
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                  {isPaid ? 'Payment Confirmed' : 'Post-Service Payment'}
                </span>
                <h3 className="text-xl font-bold tracking-tight">
                  {isPaid ? 'Service Paid & Completed' : 'Scan QR or Pay via UPI'}
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

            {/* Specialist & Booking Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Service Specialist</p>
                <p className="font-bold text-slate-900 text-base">{booking.provider_name}</p>
                <p className="text-slate-600 text-xs">{booking.provider_business || 'Certified Professional'}</p>
              </div>
              <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Booking Ref #{booking.id}</p>
                <p className="font-semibold text-slate-800 line-clamp-1">{booking.service_title}</p>
                <p className="text-slate-600 text-xs">{booking.booking_date} • {booking.time_slot}</p>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-slate-600 font-medium">Fetching verified bill and payment QR...</p>
              </div>
            ) : isPaid ? (
              /* Verified Paid Success State */
              <div className="text-center py-6 space-y-5">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> 100% Verified Transaction
                  </span>
                  <h4 className="text-2xl font-black text-slate-900">
                    Payment Successful!
                  </h4>
                  <p className="text-sm text-slate-600 mt-1 max-w-sm mx-auto">
                    ₹{payment?.amount || booking.total_price} has been paid to {booking.provider_name}. Your tax invoice is ready.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-left space-y-2 text-xs text-emerald-900 max-w-md mx-auto">
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Bank Reference ID:</span>
                    <span className="font-mono font-bold">{payment?.bank_reference || 'UPI-SETTLED-SUCCESS'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Payment Status:</span>
                    <span className="font-bold text-emerald-800">PAID · COMPLETED</span>
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
                    <FileText className="w-4 h-4" /> Download Tax Invoice & Receipt
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Active Payment Form */
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Dynamic QR Display */}
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
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
                  </div>

                  {/* Transparent Bill Breakdown & Mobile Pay Link */}
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 text-sm">
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                        <span>Transparent Bill</span>
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
                        <span>Platform Facilitation Fee</span>
                        <span className="font-semibold text-slate-900">₹{breakdown?.platformFee || 29}</span>
                      </div>

                      <div className="border-t border-slate-200 pt-2.5 flex justify-between items-baseline">
                        <span className="font-bold text-slate-900 text-sm">Total Payable</span>
                        <span className="font-black text-2xl text-blue-700">
                          ₹{breakdown?.totalAmount || Math.round(booking.total_price * 1.18 + 29)}
                        </span>
                      </div>
                    </div>

                    {/* One-tap UPI App link for mobile devices (GPay / PhonePe / Paytm / BHIM) */}
                    {payment?.qr_string && (
                      <a
                        href={payment.qr_string}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                      >
                        <Smartphone className="w-4 h-4" />
                        Pay via UPI App (PhonePe / GPay)
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Verify Payment Button */}
                    <button
                      onClick={handleVerifyPayment}
                      disabled={verifying}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle2 className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                      {verifying ? 'Verifying with Bank...' : 'I Have Paid / Verify Settlement'}
                    </button>

                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>NPCI Protected Escrow</span>
                  </div>
                  <span>100% Satisfaction Guarantee</span>
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
