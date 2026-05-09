export type FAQItem = { q: string; a: string };

export const FAQ_ITEMS: FAQItem[] = [
  {
    q: "What if I don't have an email list yet?",
    a: "Eigen is built for senders with at least a few thousand subscribers — that&rsquo;s the volume needed for posteriors to separate quickly. If you&rsquo;re smaller, the math still works, it&rsquo;ll just take longer to converge. Reach out and we can talk through it.",
  },
  {
    q: "How is this different from Mailchimp's A/B testing?",
    a: "Mailchimp picks a winner once, then sends the winner to everyone. Eigen never stops testing — every send is both an experiment and a delivery, and traffic is allocated continuously based on each variant&rsquo;s posterior probability of being best. New variants spawn automatically when winners emerge.",
  },
  {
    q: "What happens after the 10 spots fill?",
    a: "The founding round closes and the next tier prices significantly higher. Founding members keep their 50% lifetime discount regardless.",
  },
  {
    q: "What's Thompson sampling?",
    a: "A bandit algorithm: at each decision, sample one conversion rate from each variant&rsquo;s posterior, pick the variant with the highest sample, send. It naturally explores uncertain variants and exploits confident ones — no manual hyperparameters.",
  },
];
