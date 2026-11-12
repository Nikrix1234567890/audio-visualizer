# PricingCard

A plan: name, price, what it includes, one button.

- Two cards, Free left, Premium right. Premium is `featured`: an `accent-line` border and an `accent-soft` wash at the top.
- The price is the largest thing in the card (`display-md`), with "per month" beside it. The amount comes from Stripe; "€—" above is a placeholder until a price is set.
- List what the plan gives, most wanted first, five lines at most. Every line starts with a check in `accent`.
- Premium's button is the page's cta. Until Stripe keys are set it is disabled and reads "Not on sale yet".
- Never invent a discount, a countdown or a "most popular" claim.
