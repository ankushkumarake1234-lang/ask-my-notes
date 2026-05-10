import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "./button";
import { paymentsAPI } from "@/lib/api";
import { toast } from "sonner";

interface PaymentFormProps {
  priceId: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ priceId }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe hasn't loaded yet");
      return;
    }

    setLoading(true);

    try {
      // Create checkout session on the server
      const response = await paymentsAPI.createCheckoutSession(priceId);

      const { sessionId, url } = response;

      if (url) {
        // Redirection to Stripe Checkout
        window.location.href = url;
      } else {
        // Alternative if we use Elements directly (standard redirection)
        const { error } = await stripe.redirectToCheckout({
          sessionId,
        });

        if (error) {
          toast.error(error.message || "Payment failed");
        }
      }
    } catch (error: any) {
      console.error("Payment Error:", error);
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* We are using Stripe Checkout for now as it's more secure/reliable for most cases */}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={loading || !stripe}
        >
          {loading ? "Preparing Checkout..." : "Upgrade to Pro"}
        </Button>
      </form>
      <p className="text-xs text-center text-muted-foreground mt-2">
        Payment secured by Stripe. No card details are stored on our servers.
      </p>
    </div>
  );
};
