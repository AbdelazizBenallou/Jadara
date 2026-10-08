-- Let the Organization block/unblock its own published activity from the
-- public published feed without changing its review status.
ALTER TABLE "volunteering_activities" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT TRUE;