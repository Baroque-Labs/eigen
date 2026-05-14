import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const domainStatus = pgEnum("domain_status", [
  "pending",
  "verified",
  "failed",
]);

export const campaignStatus = pgEnum("campaign_status", [
  "draft",
  "scheduled",
  "running",
  "paused",
  "done",
]);

export const variantStatus = pgEnum("variant_status", [
  "pending",
  "active",
  "retired",
  "rejected",
]);

export const proposalStatus = pgEnum("proposal_status", [
  "pending",
  "approved",
  "rejected",
]);

export const suppressionReason = pgEnum("suppression_reason", [
  "bounce",
  "complaint",
  "unsub",
  "manual",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  brandVoicePrompt: text("brand_voice_prompt"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    clerkUserId: text("clerk_user_id").notNull(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("owner"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.clerkUserId, t.orgId] }),
    index("memberships_clerk_user_idx").on(t.clerkUserId),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    // Raw backend API key. MVP only — encrypt at rest before going to prod
    // (KMS, AWS Secrets Manager, or an envelope-encrypted column).
    rawKey: text("raw_key"),
    label: text("label"),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("api_keys_key_hash_idx").on(t.keyHash),
    index("api_keys_org_idx").on(t.orgId),
  ],
);

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    hostname: text("hostname").notNull(),
    resendDomainId: text("resend_domain_id"),
    status: domainStatus("status").notNull().default("pending"),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("domains_org_hostname_idx").on(t.orgId, t.hostname),
  ],
);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // Nullable until the customer picks a verified sending domain.
    // Enforced as required at campaign-launch time, not at draft time.
    domainId: uuid("domain_id").references(() => domains.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    fromAddress: text("from_address"),
    fromName: text("from_name"),
    baselineSubject: text("baseline_subject").notNull(),
    baselineBodyMd: text("baseline_body_md").notNull(),
    sendWindowStart: timestamp("send_window_start", { withTimezone: true }),
    sendWindowEnd: timestamp("send_window_end", { withTimezone: true }),
    attributionWindowDays: integer("attribution_window_days")
      .notNull()
      .default(7),
    maxActiveVariants: integer("max_active_variants").notNull().default(6),
    status: campaignStatus("status").notNull().default("draft"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("campaigns_org_idx").on(t.orgId)],
);

export const recipients = pgTable(
  "recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    mergeFields: jsonb("merge_fields").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("recipients_campaign_email_idx").on(t.campaignId, t.email),
  ],
);

export const suppressions = pgTable(
  "suppressions",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    reason: suppressionReason("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.orgId, t.email] }),
  ],
);

export const variants = pgTable(
  "variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    bodyMd: text("body_md").notNull(),
    axis: text("axis"),
    status: variantStatus("status").notNull().default("pending"),
    parentVariantId: uuid("parent_variant_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("variants_campaign_status_idx").on(t.campaignId, t.status),
  ],
);

export const variantProposals = pgTable(
  "variant_proposals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    parentVariantId: uuid("parent_variant_id"),
    subject: text("subject").notNull(),
    bodyMd: text("body_md").notNull(),
    axis: text("axis"),
    status: proposalStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("variant_proposals_campaign_status_idx").on(t.campaignId, t.status),
  ],
);

export const sends = pgTable(
  "sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "restrict" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => recipients.id, { onDelete: "cascade" }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    resendMessageId: text("resend_message_id"),
    attributedSuccess: boolean("attributed_success").notNull().default(false),
    attributedFailure: boolean("attributed_failure").notNull().default(false),
    attributedAt: timestamp("attributed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("sends_campaign_recipient_idx").on(t.campaignId, t.recipientId),
    index("sends_variant_idx").on(t.variantId),
    index("sends_attribution_sweep_idx").on(t.sentAt),
  ],
);

export const conversions = pgTable("conversions", {
  sendId: uuid("send_id")
    .primaryKey()
    .references(() => sends.id, { onDelete: "cascade" }),
  occurredAt: timestamp("occurred_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  ua: text("ua"),
  ip: text("ip"),
});

export const posteriorSnapshots = pgTable(
  "posterior_snapshots",
  {
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    alpha: integer("alpha").notNull(),
    beta: integer("beta").notNull(),
    takenAt: timestamp("taken_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("posterior_snapshots_campaign_taken_idx").on(t.campaignId, t.takenAt),
  ],
);
