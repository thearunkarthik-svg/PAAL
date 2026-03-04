import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CupSoda, Phone, User, CreditCard, ShoppingCart, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrderData {
  name: string;
  phone: string;
  chocolate: number;
  oreo: number;
  mango: number;
  txn: string;
}

const PRICES = {
  chocolate: 120,
  oreo: 140,
  mango: 130,
};

const WHATSAPP_NUMBER = "919003735732";

export default function App() {
  const [formData, setFormData] = useState<OrderData>({
    name: '',
    phone: '',
    chocolate: 0,
    oreo: 0,
    mango: 0,
    txn: '',
  });

  const [total, setTotal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const newTotal = 
      (formData.chocolate * PRICES.chocolate) +
      (formData.oreo * PRICES.oreo) +
      (formData.mango * PRICES.mango);
    setTotal(newTotal);
  }, [formData.chocolate, formData.oreo, formData.mango]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (['chocolate', 'oreo', 'mango'].includes(id)) {
      setFormData(prev => ({ ...prev, [id]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [id]: value }));
    }
    setError(null);
  };

  const validate = () => {
    if (formData.chocolate === 0 && formData.oreo === 0 && formData.mango === 0) {
      return "Please order at least one flavor.";
    }
    if ((formData.chocolate > 0 && formData.chocolate < 2) ||
        (formData.oreo > 0 && formData.oreo < 2) ||
        (formData.mango > 0 && formData.mango < 2)) {
      return "Minimum 2 per flavor if ordering.";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    const orderNumber = "MS" + Date.now();

    try {
      // Save to backend
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber,
          ...formData,
          total,
        }),
      });

      if (!response.ok) throw new Error("Failed to save order");

      setSuccess(true);

      // Prepare WhatsApp message
      const message = 
        `🥤 *Milkshake Order Confirmed!*\n\n` +
        `*Order No:* ${orderNumber}\n\n` +
        `*Name:* ${formData.name}\n` +
        `*Phone:* ${formData.phone}\n\n` +
        `*Items:*\n` +
        (formData.chocolate > 0 ? `• Chocolate: ${formData.chocolate} (₹${formData.chocolate * PRICES.chocolate})\n` : '') +
        (formData.oreo > 0 ? `• Oreo: ${formData.oreo} (₹${formData.oreo * PRICES.oreo})\n` : '') +
        (formData.mango > 0 ? `• Mango: ${formData.mango} (₹${formData.mango * PRICES.mango})\n` : '') +
        `\n*Total:* ₹${total}\n` +
        `*Transaction ID:* ${formData.txn}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedMessage}`;
      
      console.log("Order saved. Redirecting to:", whatsappUrl);

      // Short delay to show success state before redirect
      setTimeout(() => {
        // Use window.open with _blank to escape iframe restrictions
        window.open(whatsappUrl, '_blank');
      }, 1500);

    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    const orderNumber = "MS" + Date.now(); // Note: This is a bit redundant here but for the message construction
    const message = 
      `Base message...`; // This will be recalculated or passed

    // Recalculate message for the button
    const finalMessage = 
      `🥤 *Milkshake Order Confirmed!*\n\n` +
      `*Name:* ${formData.name}\n` +
      `*Phone:* ${formData.phone}\n\n` +
      `*Items:*\n` +
      (formData.chocolate > 0 ? `• Chocolate: ${formData.chocolate} (₹${formData.chocolate * PRICES.chocolate})\n` : '') +
      (formData.oreo > 0 ? `• Oreo: ${formData.oreo} (₹${formData.oreo * PRICES.oreo})\n` : '') +
      (formData.mango > 0 ? `• Mango: ${formData.mango} (₹${formData.mango * PRICES.mango})\n` : '') +
      `\n*Total:* ₹${total}\n` +
      `*Transaction ID:* ${formData.txn}`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(finalMessage)}`;

    return (
      <div className="min-h-screen bg-[#fff8f0] flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-800">Order Saved!</h2>
            <p className="text-gray-600">Your order has been recorded in our system.</p>
          </div>
          
          <div className="pt-4">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full py-4 px-6 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] gap-2"
            >
              <Phone className="w-5 h-5" />
              Confirm on WhatsApp
            </a>
            <p className="mt-4 text-xs text-gray-400 italic">
              Click the button above if you weren't automatically redirected.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f0] flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-[#6b3e26] p-8 text-white text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="grid grid-cols-6 gap-4 p-4">
              {[...Array(12)].map((_, i) => (
                <CupSoda key={i} className="w-6 h-6 rotate-12" />
              ))}
            </div>
          </div>
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <CupSoda className="w-16 h-16 mx-auto mb-4 text-[#f5d5ae]" />
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight">Quick Milkshake</h1>
          <p className="text-[#f5d5ae] mt-2 font-medium">Freshly blended goodness</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="name"
                placeholder="Your Name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b3e26] focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                id="phone"
                placeholder="Phone Number"
                required
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b3e26] focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-1">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> Select Flavors
              </h3>
              <span className="text-[10px] uppercase tracking-wider font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
                Min 2 per flavor
              </span>
            </div>

            <div className="space-y-3">
              {[
                { id: 'chocolate', label: 'Chocolate', price: 120, color: 'bg-amber-900' },
                { id: 'oreo', label: 'Oreo', price: 140, color: 'bg-zinc-800' },
                { id: 'mango', label: 'Mango', price: 130, color: 'bg-orange-400' },
              ].map((flavor) => (
                <div key={flavor.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-[#6b3e26]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${flavor.color}`} />
                    <div>
                      <p className="font-medium text-gray-800">{flavor.label}</p>
                      <p className="text-sm text-gray-500">₹{flavor.price}</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    id={flavor.id}
                    min="0"
                    value={formData[flavor.id as keyof OrderData] as number}
                    onChange={handleInputChange}
                    className="w-16 text-center py-1 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#6b3e26] outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-gray-600 font-medium">Total Amount</span>
              <span className="text-3xl font-bold text-[#6b3e26]">₹{total}</span>
            </div>

            <div className="relative mb-6">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="txn"
                placeholder="UPI Transaction ID"
                required
                value={formData.txn}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6b3e26] focus:border-transparent outline-none transition-all"
              />
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2 mb-4"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${
                isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#6b3e26] hover:bg-[#4a2a19] text-white'
              }`}
            >
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
