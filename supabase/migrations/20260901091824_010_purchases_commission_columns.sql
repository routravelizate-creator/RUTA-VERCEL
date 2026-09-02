/*
# Add commission tracking columns to purchases

## Purpose
Track the commission split for each purchase:
- platform_commission: 20% of the purchase price (goes to the platform)
- author_earnings: 80% of the purchase price (goes to the route author)

These are set by the stripe-webhook edge function when a payment is confirmed.
*/

ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS platform_commission numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS author_earnings numeric DEFAULT 0;
