import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BillingPage() {
  return (
    <section className="w-full max-w-2xl mx-auto py-12 md:py-24 px-4">
      {/* Stepper Navigation */}
      <div className="flex justify-center gap-8 mb-8">
        <span className="font-semibold text-red-600">1. Choose billing</span>
        <span className="font-medium text-gray-400">
          2. Review and purchase
        </span>
      </div>

      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-10">
        Choose a billing option for your Pro plan
      </h1>

      {/* Options */}
      <div className="space-y-6">
        {/* Annual Plan Card */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
            {/* Left Side: Plan Details */}
            <div>
              <h2 className="text-2xl font-bold">Annual</h2>
              <p className="text-gray-500">
                Billed as one payment of $50 /yearly
              </p>
            </div>

            {/* Right Side: Price and Button */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-lg font-bold">
                  $4.00
                  <span className="text-sm font-normal text-gray-600">
                    USD /month
                  </span>
                </span>
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700"
                >
                  save 10%
                </Badge>
              </div>
              <Button className="bg-red-600 hover:bg-red-700">Select</Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Plan Card */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 gap-4">
            {/* Left Side: Plan Details */}
            <div>
              <h2 className="text-2xl font-bold">Monthly</h2>
              <p className="text-gray-500">
                Billed as one payment of $5 /yearly
              </p>
            </div>

            {/* Right Side: Price and Button */}
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold">
                $5.00
                <span className="text-sm font-normal text-gray-600">
                  USD /month
                </span>
              </span>
              <Button className="bg-red-600 hover:bg-red-700">Select</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
