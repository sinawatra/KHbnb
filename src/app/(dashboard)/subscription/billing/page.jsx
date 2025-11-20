"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const plans = {
  annual: {
    priceId: "price_1SS94z3kW2gspTZHj3jBkH4a",
    name: "Annual",
    price: "$4.00",
    billing: "Billed as one payment of $50 /yearly",
    badge: "save 10%",
  },
  monthly: {
    priceId: "price_1SSJwTDozsimq2UIcpm61UDn",
    name: "Monthly",
    price: "$5.00",
    billing: "Billed as one payment of $5 /monthly",
    badge: null,
  },
};

export default function BillingPage() {
  const router = useRouter();

  // State for the stepper UI
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // State for payment methods
  const [savedMethods, setSavedMethods] = useState([]);
  const [isFetchingMethods, setIsFetchingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState("");

  // State for the final API call
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 2. Fetch the user's saved payment methods on load
  useEffect(() => {
    fetch("/api/stripe/get-payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.paymentMethods) {
          setSavedMethods(data.paymentMethods);
          // Auto-select the first card if it exists
          if (data.paymentMethods.length > 0) {
            setSelectedMethod(data.paymentMethods[0].id);
          }
        }
        setIsFetchingMethods(false);
      })
      .catch(() => {
        setErrorMessage("Could not load payment methods.");
        setIsFetchingMethods(false);
      });
  }, []);

  // 3. Called when user clicks "Select" on a plan
  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setStep(2);
  };

  // 4. Called when user clicks the final "Confirm and Subscribe" button
  const handleSubscribe = async () => {
    if (!selectedPlan || !selectedMethod) {
      setErrorMessage("Please select a plan and a payment method.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: selectedPlan.priceId,
          paymentMethodId: selectedMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Something went wrong.");
      }

      // Success!
      alert("Subscription successful!"); // You can replace this
      router.push("/subscription"); // Redirect to their new "pro" dashboard
    } catch (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  // --- Render Logic ---

  if (isFetchingMethods) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 text-center">
        Loading...
      </div>
    );
  }

  return (
    <section className="w-full max-w-2xl mx-auto py-12 md:py-24 px-4">
      {/* Stepper Navigation */}
      <div className="flex justify-center gap-8 mb-8">
        <span
          className={`font-medium ${
            step === 1 ? "font-semibold text-red-600" : "text-gray-400"
          }`}
        >
          1. Choose billing
        </span>
        <span
          className={`font-medium ${
            step === 2 ? "font-semibold text-red-600" : "text-gray-400"
          }`}
        >
          2. Review and purchase
        </span>
      </div>

      {/* --- STEP 1: CHOOSE PLAN --- */}
      {step === 1 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-10">
            Choose a billing option for your Pro plan
          </h1>
          <div className="space-y-6">
            {/* Annual Plan Card */}
            <Card>
              <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{plans.annual.name}</h2>
                  <p className="text-gray-500">{plans.annual.billing}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold">
                      {plans.annual.price}
                      <span className="text-sm font-normal text-gray-600">
                        {" "}
                        USD /month
                      </span>
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-700"
                    >
                      {plans.annual.badge}
                    </Badge>
                  </div>
                  {/* 5. This button now selects the plan and moves to step 2 */}
                  <Button
                    onClick={() => handlePlanSelect(plans.annual)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Plan Card */}
            <Card>
              <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{plans.monthly.name}</h2>
                  <p className="text-gray-500">{plans.monthly.billing}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">
                    {plans.monthly.price}
                    <span className="text-sm font-normal text-gray-600">
                      {" "}
                      USD /month
                    </span>
                  </span>
                  <Button
                    onClick={() => handlePlanSelect(plans.monthly)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Select
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* --- STEP 2: REVIEW AND PURCHASE --- */}
      {step === 2 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-10">
            Review and purchase
          </h1>
          <div className="space-y-6">
            {/* 1. Show selected plan */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">Selected Plan</h2>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">{selectedPlan.name}</h3>
                    <p className="text-gray-500">{selectedPlan.billing}</p>
                  </div>
                  <span className="text-lg font-bold">
                    {selectedPlan.price}
                    <span className="text-sm font-normal text-gray-600">
                      {" "}
                      /month
                    </span>
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Show payment methods */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                {savedMethods.length > 0 ? (
                  <RadioGroup
                    value={selectedMethod}
                    onValueChange={setSelectedMethod}
                  >
                    <div className="space-y-2">
                      {savedMethods.map((method) => (
                        <div
                          key={method.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Label htmlFor={method.id} className="cursor-pointer">
                            <span className="font-medium capitalize">
                              {method.card.brand}
                            </span>
                            <span> ending in {method.card.last4}</span>
                            <span className="text-gray-500 ml-4">
                              Expires {method.card.exp_month}/
                              {method.card.exp_year}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                ) : (
                  <p className="text-gray-500">
                    You have no saved payment methods.
                  </p>
                )}
                <Button
                  variant="link"
                  className="p-0 mt-2 text-red-600"
                  onClick={() => router.push("/payment")} // Link to your add card page
                >
                  Manage payment methods
                </Button>
              </CardContent>
            </Card>

            {/* 3. Final action buttons */}
            <div className="flex justify-between items-center">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleSubscribe}
                disabled={isLoading || !selectedMethod}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Processing..." : "Confirm and Subscribe"}
              </Button>
            </div>
            {errorMessage && (
              <p className="text-red-500 text-sm mt-4 text-right">
                {errorMessage}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
