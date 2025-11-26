"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, CheckCircle2, Circle, CreditCard } from "lucide-react";
import StripePaymentElementWrapper from "@/components/StripePaymentElementWrapper";
import StripePaymentForm from "@/components/StripePaymentForm";

const plans = {
  annual: {
    priceId: "price_1SWDo53kW2gspTZHPxa68CMg",
    name: "Annual",
    price: "$50",
    perMonth: "$4",
    billing: "Billed annually",
    badge: "save 10%",
  },
  monthly: {
    priceId: "price_1SS94z3kW2gspTZHj3jBkH4a",
    name: "Monthly",
    price: "$5",
    perMonth: "$5",
    billing: "Billed monthly",
    badge: null,
  },
};

export default function BillingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [isFetchingMethods, setIsFetchingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddCard, setShowAddCard] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoadingSetupIntent, setIsLoadingSetupIntent] = useState(false);

  useEffect(() => {
    fetch("/api/stripe/get-payment-methods")
      .then((res) => res.json())
      .then((data) => {
        if (data.paymentMethods) {
          setSavedMethods(data.paymentMethods);
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

  const togglePlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleAddCardClick = async () => {
    setIsLoadingSetupIntent(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/stripe/add-payment-methods", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to initialize payment.");
      }

      setClientSecret(data.clientSecret);
      setShowAddCard(true);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoadingSetupIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentMethodId) => {
    const res = await fetch("/api/stripe/get-payment-methods");
    const data = await res.json();

    if (data.paymentMethods) {
      setSavedMethods(data.paymentMethods);
      setSelectedMethod(paymentMethodId);
    }

    setShowAddCard(false);
    setClientSecret(null);
  };

  const handleCancelAddCard = () => {
    setShowAddCard(false);
    setClientSecret(null);
  };

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

      if (
        res.status === 400 &&
        data.error?.message === "You already have an active subscription."
      ) {
        alert(
          "Good news! You were already subscribed. Syncing your account..."
        );
        router.refresh();
        router.push("/subscription");
        return;
      }

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Something went wrong.");
      }

      alert("Subscription successful!");
      router.refresh();
      router.push("/subscription");
    } catch (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  if (isFetchingMethods) {
    return (
      <div className="w-full max-w-2xl mx-auto py-12 text-center flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        <p>Loading payment details...</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-2xl mx-auto py-12 md:py-24 px-4">
      <div className="flex justify-center items-center gap-4 mb-12">
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step >= 1 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            1
          </div>
          <span
            className={
              step >= 1 ? "font-semibold text-gray-900" : "text-gray-500"
            }
          >
            Billing
          </span>
        </div>
        <div
          className={`w-12 h-0.5 ${step >= 2 ? "bg-red-600" : "bg-gray-200"}`}
        />
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
              step === 2 ? "bg-red-600 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            2
          </div>
          <span
            className={
              step === 2 ? "font-semibold text-gray-900" : "text-gray-500"
            }
          >
            Review
          </span>
        </div>
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <>
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900">
              Choose your billing cycle
            </h1>
            <p className="text-gray-500 mt-2">Save money by billing annually</p>
          </div>

          <div className="space-y-4">
            {/* Annual Plan */}
            <div
              onClick={() => togglePlan(plans.annual)}
              className={`relative group cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                selectedPlan?.name === "Annual"
                  ? "border-red-600 bg-red-50/30 shadow-sm"
                  : "border-gray-200 bg-white hover:border-red-200 hover:shadow-md"
              }`}
            >
              <div className="absolute -top-3 right-6">
                <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  BEST VALUE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedPlan?.name === "Annual" ? (
                    <CheckCircle2 className="h-6 w-6 text-red-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300 group-hover:text-red-300" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        Annual
                      </h2>
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded">
                        SAVE 10%
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {plans.annual.billing}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-xs line-through mb-1">
                    $5.00/mo
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {plans.annual.perMonth}
                  </span>
                  <span className="text-gray-500 text-sm font-medium">
                    {" "}
                    /mo
                  </span>
                  <p className="text-gray-600 text-xs mt-1">
                    {plans.annual.price} per year
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly Plan */}
            <div
              onClick={() => togglePlan(plans.monthly)}
              className={`relative group cursor-pointer rounded-xl border-2 p-6 transition-all duration-200 ${
                selectedPlan?.name === "Monthly"
                  ? "border-red-600 bg-red-50/30 shadow-sm"
                  : "border-gray-200 bg-white hover:border-red-200 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {selectedPlan?.name === "Monthly" ? (
                    <CheckCircle2 className="h-6 w-6 text-red-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300 group-hover:text-red-300" />
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Monthly</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      {plans.monthly.billing}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">
                    {plans.monthly.perMonth}
                  </span>
                  <span className="text-gray-500 text-sm font-medium">
                    {" "}
                    /mo
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedPlan}
              className="bg-red-600 hover:bg-red-700 text-lg px-8 py-6"
            >
              Continue to Review
            </Button>
          </div>
        </>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <>
          <h1 className="text-3xl font-bold text-center mb-10">
            Review and purchase
          </h1>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-2">Selected Plan</h2>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">{selectedPlan.name}</h3>
                    <p className="text-gray-500">
                      {selectedPlan.perMonth}/mo • {selectedPlan.billing}
                    </p>
                    <p className="text-gray-900 font-semibold mt-1">
                      {selectedPlan.price} due today
                    </p>
                  </div>
                  <div className="text-right">
                    <Button
                      variant="link"
                      className="h-auto p-0 text-red-600"
                      onClick={() => setStep(1)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

                {savedMethods.length > 0 && !showAddCard ? (
                  <>
                    <RadioGroup
                      value={selectedMethod}
                      onValueChange={setSelectedMethod}
                    >
                      <div className="space-y-2">
                        {savedMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`flex items-center space-x-2 border p-3 rounded-md transition-colors cursor-pointer ${
                              selectedMethod === method.id
                                ? "border-red-500 bg-red-50"
                                : "border-gray-200"
                            }`}
                            onClick={() => setSelectedMethod(method.id)}
                          >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label
                              htmlFor={method.id}
                              className="cursor-pointer flex-1"
                            >
                              <span className="font-medium capitalize">
                                {method.card.brand}
                              </span>
                              <span> ending in {method.card.last4}</span>
                              <span className="text-gray-500 ml-4 text-sm">
                                Expires {method.card.exp_month}/
                                {method.card.exp_year}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                    <Button
                      variant="link"
                      className="p-0 mt-4 text-red-600 flex items-center gap-1"
                      onClick={handleAddCardClick}
                      disabled={isLoadingSetupIntent}
                    >
                      {isLoadingSetupIntent ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add another card
                    </Button>
                  </>
                ) : showAddCard && clientSecret ? (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <CreditCard className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold">Add New Card</h3>
                    </div>
                    <StripePaymentElementWrapper clientSecret={clientSecret}>
                      <StripePaymentForm
                        onSuccess={handlePaymentSuccess}
                        onCancel={handleCancelAddCard}
                      />
                    </StripePaymentElementWrapper>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">
                      You have no saved payment methods.
                    </p>
                    <Button
                      onClick={handleAddCardClick}
                      variant="outline"
                      className="w-full"
                      disabled={isLoadingSetupIntent}
                    >
                      {isLoadingSetupIntent ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add Payment Method
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {!showAddCard && (
              <>
                <div className="flex justify-between items-center">
                  <Button variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleSubscribe}
                    disabled={isLoading || !selectedMethod}
                    className="bg-red-600 hover:bg-red-700 min-w-[150px]"
                  >
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    {isLoading ? "Processing..." : "Confirm & Subscribe"}
                  </Button>
                </div>
                {errorMessage && (
                  <p className="text-red-500 text-sm mt-4 text-right">
                    {errorMessage}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
}
