-- Cast text columns to uuid (fresh DB expected, but explicit USING required)
ALTER TABLE "account" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "userId" TYPE uuid USING "userId"::uuid;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "password" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");