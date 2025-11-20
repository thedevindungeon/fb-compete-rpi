-- Fix Event 31: "One Day Soccer Showcase" should be Soccer, not Football
UPDATE fb_compete.compete_event_details 
SET sport_id = 2  -- Soccer
WHERE event_id = 31;

-- Verify the change
SELECT event_id, sport_id, 
  CASE sport_id
    WHEN 1 THEN 'Baseball'
    WHEN 2 THEN 'Soccer'
    WHEN 3 THEN 'Football'
    WHEN 4 THEN 'Volleyball'
    WHEN 5 THEN 'Basketball'
    WHEN 6 THEN 'Hockey'
    WHEN 7 THEN 'Lacrosse'
    WHEN 8 THEN 'Pickleball'
  END as sport_name
FROM fb_compete.compete_event_details
WHERE event_id = 31;

