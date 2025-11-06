import PaymentManager from "./PaymentManager";
import { Suspense } from "react";

function LoadingUI() {
  return <div className="max-w-xl mx-auto p-8">Loading...</div>;
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingUI />}>
      <PaymentManager />
    </Suspense>
  );
}