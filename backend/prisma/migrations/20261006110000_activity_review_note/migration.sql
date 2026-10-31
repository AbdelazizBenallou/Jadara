-- Store the Admin's approve/reject reason so the Organization can see
-- why its activity was accepted or rejected.
ALTER TABLE "volunteering_activities" ADD COLUMN "review_note" VARCHAR(1000);
