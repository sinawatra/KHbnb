import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, CreditCard } from "lucide-react";

// Feature list for the summary card
const proFeatures = [
  "Everything included in Free",
  "Free Cancellation",
  "Book with no service fee",
];

export default function ReviewPage() {
  return (
    <section className="w-full max-w-4xl mx-auto py-12 md:py-24 px-4">
      {/* Stepper Navigation */}
      <div className="flex justify-center gap-8 mb-8">
        <span className="font-medium text-gray-400">1. Choose billing</span>
        <span className="font-semibold text-red-600">
          2. Review and purchase
        </span>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-10">
        Purchase Annual Plan
      </h1>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Left Column: Payment Details */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Enter your payment details</h2>

          {/* Payment Method Toggle */}
          <Button
            variant="outline"
            className="w-full justify-start py-6 border-black border-2"
          >
            Credit or debit card
          </Button>

          {/* Payment Form */}
          <form className="space-y-4">
            <div>
              <Label htmlFor="cardNumber">
                Card number <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input id="cardNumber" placeholder=" " className="pl-10" />
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expirationDate">
                  Expiration date <span className="text-red-500">*</span>
                </Label>
                <Input id="expirationDate" placeholder="MM/YY" />
              </div>
              <div>
                <Label htmlFor="securityCode">
                  Security code <span className="text-red-500">*</span>
                </Label>
                <Input id="securityCode" placeholder="CVV" />
              </div>
            </div>

            <div>
              <Label htmlFor="country">
                Country/region <span className="text-red-500">*</span>
              </Label>
              <Input id="country" />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 py-6 text-lg"
            >
              Complete purchase
            </Button>
          </form>
        </div>

        {/* Right Column: Order Summary */}
        <Card className="bg-gray-50/50 border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Your order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan</span>
                <span className="font-medium">KHbnb Pro</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing</span>
                <span className="font-medium">Annually</span>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Today's order</span>
                <span className="font-semibold">$50.00 USD</span>
              </div>
              <p className="text-sm text-gray-500">
                Your plan renews on November 20, 2025.
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-3">
                How Pro elevates your booking
              </h3>
              <ul className="space-y-2">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
