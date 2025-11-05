import { Suspense } from "react";
import StripeWrapper from "./StripeWrapper";
import CheckoutClient from "./CheckoutClient";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <StripeWrapper>
        <CheckoutClient />
      </StripeWrapper>
    </Suspense>
  );
}

function LoadingUI() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>
  );
}
