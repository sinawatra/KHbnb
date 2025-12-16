"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Create the context without TypeScript generics
const CurrencyContext = createContext(undefined);

export function CurrencyProvider({ children }) {
    const [currency, setCurrency] = useState("USD");
    const exchangeRate = 4000;

    useEffect(() => {
        // Remove "as Currency" casting
        const saved = localStorage.getItem("khbnb_currency");
        if (saved) setCurrency(saved);
    }, []);

    const handleSetCurrency = (c) => {
        setCurrency(c);
        localStorage.setItem("khbnb_currency", c);
    };

    const convertPrice = (amountInUSD) => {
        if (currency === "USD") {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
            }).format(amountInUSD);
        } else {
            return new Intl.NumberFormat("km-KH", {
                style: "currency",
                currency: "KHR",
                minimumFractionDigits: 0,
            }).format(amountInUSD * exchangeRate);
        }
    };

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                setCurrency: handleSetCurrency,
                convertPrice,
                exchangeRate,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
}

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context)
        throw new Error("useCurrency must be used within a CurrencyProvider");
    return context;
};