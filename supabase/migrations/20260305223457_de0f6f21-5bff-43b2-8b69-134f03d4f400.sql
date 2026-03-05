
-- Add unique constraint on instantly_campaign_id for upsert
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_instantly_campaign_id_key UNIQUE (instantly_campaign_id);

-- Add unique constraint on campaign_id + date for metrics upsert
ALTER TABLE public.campaign_metrics ADD CONSTRAINT campaign_metrics_campaign_date_key UNIQUE (campaign_id, date);
