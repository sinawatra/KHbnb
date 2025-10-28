"use client";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function CheckoutProgressBar({ currentStep, completedSteps }) {
  const router = useRouter();

  const steps = [
    { id: 1, label: "Confirm and pay", route: "confirm-and-pay" },
    { id: 2, label: "Payment", route: "payment" },
    { id: 3, label: "Review booking", route: "review" },
  ];

  const handleStepClick = (step) => {
    // Only allow clicking on completed steps or current step
    if (completedSteps.includes(step.id) || currentStep === step.id) {
      router.push(`/checkout?step=${step.route}`);
    }
  };

  const isStepCompleted = (stepId) => completedSteps.includes(stepId);
  const isStepCurrent = (stepId) => currentStep === stepId;
  const isStepClickable = (stepId) =>
    isStepCompleted(stepId) || isStepCurrent(stepId);

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-6 mb-6">
      <div className="relative flex items-center justify-between">
        {/* Progress Line Background */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200" />

        {/* Progress Line Filled */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const completed = isStepCompleted(step.id);
          const current = isStepCurrent(step.id);
          const clickable = isStepClickable(step.id);

          return (
            <div
              key={step.id}
              className="relative flex flex-col items-center group"
            >
              {/* Circle */}
              <button
                onClick={() => handleStepClick(step)}
                disabled={!clickable}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 relative z-10
                  ${
                    completed
                      ? "bg-primary text-white"
                      : current
                      ? "bg-white border-2 border-primary"
                      : "bg-white border-2 border-gray-300"
                  }
                  ${
                    clickable
                      ? "cursor-pointer hover:scale-110"
                      : "cursor-not-allowed"
                  }
                `}
              >
                {completed ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <span
                    className={`font-semibold ${
                      current ? "text-primary" : "text-gray-400"
                    }`}
                  >
                    {step.id}
                  </span>
                )}
              </button>

              {/* Label - Show current by default, others on hover */}
              <span
                className={`absolute top-14 text-sm font-medium whitespace-nowrap transition-opacity duration-200
                  ${
                    current
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  }
                  ${
                    completed
                      ? "text-primary"
                      : current
                      ? "text-gray-900"
                      : "text-gray-500"
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
