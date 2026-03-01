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
    <section id="pricing" className="py-24 relative z-10">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-serif text-3xl md:text-5xl font-bold text-center text-foreground mb-16"
        >
          Simple{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-gold)" }}>
            Pricing
          </span>
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? "glow-border"
                  : "glass-panel"
              }`}
              style={plan.highlighted ? { background: "var(--glass-bg)" } : undefined}
            >
              {plan.highlighted && (
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4 text-accent-foreground"
                  style={{ background: "var(--gradient-gold)" }}
                >
                  Most Popular
                </span>
              )}
              <h3 className="font-serif text-2xl font-bold text-foreground">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-serif text-4xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">{plan.period}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className="mt-8 block w-full text-center py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-105"
                style={
                  plan.highlighted
                    ? { background: "var(--gradient-primary)", color: "hsl(var(--secondary-foreground))" }
                    : { background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }
                }
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
