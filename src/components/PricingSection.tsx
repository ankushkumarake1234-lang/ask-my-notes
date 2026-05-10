import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    features: ["1 Subject", "5 uploads per subject", "Chat with AI", "Basic Study Mode", "Email support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹499",
    period: "/month",
    features: ["3 Subjects", "Unlimited uploads", "Chat with AI", "Full Study Mode", "Voice Mode", "Priority support", "Advanced citations"],
    cta: "Go Pro",
    highlighted: true,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-32 relative z-10 bg-background border-t border-border">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="mb-10 flex items-center justify-center gap-4">
          <span className="h-px w-24 bg-border" />
          <span className="small-caps text-accent">
            Membership
          </span>
          <span className="h-px w-24 bg-border" />
        </div>

        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl font-normal text-center text-foreground mb-16 tracking-tight"
        >
          Simple <span className="text-accent italic">Pricing</span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6, ease: "easeOut" }}
              className={`rounded-lg p-10 border transition-all duration-300 ${
                plan.highlighted
                  ? "border-accent shadow-sm relative bg-card"
                  : "border-border bg-transparent hover:bg-card hover:shadow-sm"
              }`}
            >
              {plan.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-wider rounded-full shadow-sm"
                >
                  Most Popular
                </span>
              )}
              <h3 className="font-serif text-3xl font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-2 border-b border-border pb-8">
                <span className="font-sans text-5xl font-medium text-foreground tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground text-base">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-base text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={plan.name === "Pro" ? "/checkout" : "/signup"}
                className={`mt-10 block w-full text-center py-4 rounded-md text-sm font-semibold uppercase tracking-wide transition-all ${
                  plan.highlighted
                    ? "bg-foreground text-background hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                    : "bg-muted border border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
