CREATE TABLE "rsvps" (
	"id" serial PRIMARY KEY,
	"name" text NOT NULL,
	"side" text NOT NULL,
	"response" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
