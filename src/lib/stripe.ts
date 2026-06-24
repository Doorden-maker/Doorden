import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
});

export const TRAINING_PRICES = {
  2: 1500, // $15.00 in cents
  3: 3000, // $30.00
  4: 5000, // $50.00
};

export const TRAINING_NAMES = {
  1: "Level 1 — Free",
  2: "Level 2 — Intermediate",
  3: "Level 3 — Advanced",
  4: "Level 4 — Expert",
};
