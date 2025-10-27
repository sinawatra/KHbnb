"use client";
import { useState } from "react";

// This component is designed to be easily replaced with Stripe Elements
// Just swap the input fields with <CardElement /> when ready

export default function PaymentForm({ onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    country: "",
  });

  const [errors, setErrors] = useState({});

  // Format card number with spaces (1234 5678 9012 3456)
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  // Format expiry date (MM/YY)
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  // Basic validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.cardholderName.trim()) {
      newErrors.cardholderName = "Name is required";
    }

    const cardNum = formData.cardNumber.replace(/\s/g, "");
    if (!cardNum) {
      newErrors.cardNumber = "Card number is required";
    } else if (cardNum.length < 13 || cardNum.length > 19) {
      newErrors.cardNumber = "Invalid card number";
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required";
    } else if (formData.expiryDate.length !== 5) {
      newErrors.expiryDate = "Invalid expiry date";
    }

    if (!formData.cvv) {
      newErrors.cvv = "Security code is required";
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = "Invalid security code";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field, value) => {
    let formattedValue = value;

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (field === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (field === "cvv") {
      formattedValue = value.replace(/[^0-9]/gi, "").slice(0, 4);
    }

    setFormData((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Cards Icons */}
      <div className="flex gap-2">
        <img src="/icons/amex.svg" alt="Amex" className="h-6" onError={(e) => e.target.style.display = 'none'} />
        <img src="/icons/apple-pay.svg" alt="Apple Pay" className="h-6" onError={(e) => e.target.style.display = 'none'} />
        <img src="/icons/google-pay.svg" alt="Google Pay" className="h-6" onError={(e) => e.target.style.display = 'none'} />
        <img src="/icons/mastercard.svg" alt="Mastercard" className="h-6" onError={(e) => e.target.style.display = 'none'} />
        <img src="/icons/paypal.svg" alt="PayPal" className="h-6" onError={(e) => e.target.style.display = 'none'} />
        <img src="/icons/visa.svg" alt="Visa" className="h-6" onError={(e) => e.target.style.display = 'none'} />
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Cardholder's name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={formData.cardholderName}
          onChange={(e) => handleChange("cardholderName", e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.cardholderName ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="John Doe"
        />
        {errors.cardholderName && (
          <p className="text-red-600 text-sm mt-1">{errors.cardholderName}</p>
        )}
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Card number <span className="text-red-600">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.cardNumber}
            onChange={(e) => handleChange("cardNumber", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.cardNumber ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="1234 5678 9012 3456"
            maxLength={19}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              width="24"
              height="16"
              viewBox="0 0 24 16"
              fill="none"
              className="text-gray-400"
            >
              <rect
                x="1"
                y="1"
                width="22"
                height="14"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        {errors.cardNumber && (
          <p className="text-red-600 text-sm mt-1">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry Date and CVV */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Expiration date <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.expiryDate}
            onChange={(e) => handleChange("expiryDate", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.expiryDate ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="MM/YY"
            maxLength={5}
          />
          {errors.expiryDate && (
            <p className="text-red-600 text-sm mt-1">{errors.expiryDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Security code <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={formData.cvv}
            onChange={(e) => handleChange("cvv", e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.cvv ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="CVV"
            maxLength={4}
          />
          {errors.cvv && (
            <p className="text-red-600 text-sm mt-1">{errors.cvv}</p>
          )}
        </div>
      </div>

      {/* Country/Region */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Country/region <span className="text-red-600">*</span>
        </label>
        <select
          value={formData.country}
          onChange={(e) => handleChange("country", e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.country ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select country</option>
          <option value="US">United States</option>
          <option value="KH">Cambodia</option>
          <option value="GB">United Kingdom</option>
          <option value="CA">Canada</option>
          <option value="AU">Australia</option>
          <option value="JP">Japan</option>
          <option value="SG">Singapore</option>
          <option value="TH">Thailand</option>
          <option value="VN">Vietnam</option>
        </select>
        {errors.country && (
          <p className="text-red-600 text-sm mt-1">{errors.country}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-red-600 text-white font-semibold py-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Processing..." : "Complete purchase"}
      </button>
    </form>
  );
}

// When ready to use real Stripe Elements, replace this component with:
/*
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function PaymentForm({ onSubmit, isLoading }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (!error) {
      onSubmit(paymentMethod);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement options={{
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': { color: '#aab7c4' },
          },
        },
      }} />
      <button type="submit" disabled={!stripe || isLoading}>
        Complete purchase
      </button>
    </form>
  );
}
*/