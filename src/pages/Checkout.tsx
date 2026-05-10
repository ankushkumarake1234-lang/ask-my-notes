import React from "react";
import { Elements } from "@stripe/react-stripe-js";
import stripePromise from "@/lib/stripe";
import { PaymentForm } from "@/components/ui/payment-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const CheckoutPage: React.FC = () => {
  // Pro Plan Price ID from environment
  const PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID_PRO || "price_...";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-8 mt-10">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              Upgrade to Pro
            </h1>
            <p className="text-muted-foreground text-lg">
              Unlock unlimited notes and advanced features with our Pro plan.
            </p>
          </div>

          <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
            <div className="bg-primary/5 p-6 text-center border-b">
              <span className="text-5xl font-bold font-heading">$19</span>
              <span className="text-muted-foreground ml-2">/month</span>
              <div className="mt-2 text-sm font-medium text-primary">BEST VALUE</div>
            </div>
            
            <CardContent className="p-6">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited Notes
                </li>
                <li className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced AI Analysis
                </li>
                <li className="flex items-center text-sm">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority Support
                </li>
              </ul>

              <Elements stripe={stripePromise}>
                <PaymentForm priceId={PRO_PRICE_ID} />
              </Elements>
            </CardContent>
          </Card>
          
          <p className="text-center text-sm text-muted-foreground">
            Cancel anytime. Secure checkout by Stripe.
          </p>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
