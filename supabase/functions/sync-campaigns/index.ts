import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { workspace_id } = await req.json();
    if (!workspace_id) throw new Error("workspace_id required");

    // Get API key for this workspace
    const { data: conn } = await supabase
      .from("api_connections")
      .select("api_key")
      .eq("workspace_id", workspace_id)
      .single();

    if (!conn?.api_key) throw new Error("No API key configured");

    const apiKey = conn.api_key;

    const instantlyHeaders = {
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const fetchInstantlyJson = async (urls: string[]): Promise<any> => {
      let lastError = "Unknown Instantly API error";

      for (const url of urls) {
        const res = await fetch(url, { headers: instantlyHeaders });
        if (res.ok) {
          return await res.json();
        }

        const errText = await res.text();
        lastError = `${res.status} - ${errText}`;
      }

      throw new Error(`Instantly API error: ${lastError}`);
    };

    // Fetch campaigns from Instantly.ai (supports both new and legacy auth/url styles)
    const campaignsData = await fetchInstantlyJson([
      "https://api.instantly.ai/api/v2/campaigns?limit=100",
      "https://api.instantly.ai/api/v1/campaign/list?limit=100&skip=0",
      `https://api.instantly.ai/api/v1/campaign/list?api_key=${encodeURIComponent(apiKey)}&limit=100&skip=0`,
    ]);

    const campaigns = Array.isArray(campaignsData)
      ? campaignsData
      : Array.isArray(campaignsData?.items)
        ? campaignsData.items
        : Array.isArray(campaignsData?.data)
          ? campaignsData.data
          : [];

    for (const campaign of campaigns) {
      const campaignId = campaign.id ?? campaign.campaign_id ?? campaign._id;
      if (!campaignId) continue;

      // Fetch campaign summary/analytics (fallback across auth styles)
      let summary = { total_sent: 0, total_opened: 0, total_replied: 0, total_bounced: 0 };
      try {
        const summaryData = await fetchInstantlyJson([
          `https://api.instantly.ai/api/v1/analytics/campaign/summary?campaign_id=${encodeURIComponent(campaignId)}`,
          `https://api.instantly.ai/api/v1/analytics/campaign/summary?api_key=${encodeURIComponent(apiKey)}&campaign_id=${encodeURIComponent(campaignId)}`,
        ]);

        summary = summaryData ?? summary;
      } catch {
        // Keep defaults if campaign summary endpoint fails for a specific campaign
      }

      const emailsSent = summary.total_sent ?? 0;
      const opens = summary.total_opened ?? 0;
      const replies = summary.total_replied ?? 0;
      const bounced = summary.total_bounced ?? 0;
      const bounceRate = emailsSent > 0 ? Number(((bounced / emailsSent) * 100).toFixed(2)) : 0;

      // Upsert campaign
      await supabase
        .from("campaigns")
        .upsert(
          {
            workspace_id,
            instantly_campaign_id: campaignId,
            name: campaign.name || "Untitled Campaign",
            status: campaign.status === 1 ? "active" : campaign.status === 0 ? "paused" : "completed",
            emails_sent: emailsSent,
            opens,
            replies,
            positive_replies: 0, // Instantly doesn't directly expose this
            bounce_rate: bounceRate,
            meetings_booked: 0,
          },
          { onConflict: "instantly_campaign_id" },
        );

      // Get the campaign record for metrics
      const { data: dbCampaign } = await supabase
        .from("campaigns")
        .select("id")
        .eq("instantly_campaign_id", campaignId)
        .eq("workspace_id", workspace_id)
        .single();

      if (dbCampaign) {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("campaign_metrics").upsert(
          {
            campaign_id: dbCampaign.id,
            date: today,
            emails_sent: emailsSent,
            opens,
            replies,
            positive_replies: 0,
            bounces: bounced,
            meetings_booked: 0,
          },
          { onConflict: "campaign_id,date" },
        );
      }
    }

    // Update last synced
    await supabase
      .from("api_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("workspace_id", workspace_id);

    return new Response(
      JSON.stringify({ success: true, campaigns_synced: campaigns.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
