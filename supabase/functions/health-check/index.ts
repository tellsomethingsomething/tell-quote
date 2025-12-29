import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latency?: number };
    auth: { status: string };
    storage: { status: string };
    stripe: { status: string };
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const checks: HealthStatus["checks"] = {
    database: { status: "unknown" },
    auth: { status: "unknown" },
    storage: { status: "unknown" },
    stripe: { status: "unknown" },
  };

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check database connectivity
    const dbStart = Date.now();
    try {
      const { error } = await supabase.from("organizations").select("id").limit(1);
      if (error) throw error;
      checks.database = { status: "healthy", latency: Date.now() - dbStart };
    } catch (e) {
      checks.database = { status: "unhealthy" };
    }

    // Check auth service
    try {
      const { data, error } = await supabase.auth.getSession();
      checks.auth = { status: error ? "unhealthy" : "healthy" };
    } catch {
      checks.auth = { status: "unhealthy" };
    }

    // Check storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      checks.storage = { status: error ? "unhealthy" : "healthy" };
    } catch {
      checks.storage = { status: "unhealthy" };
    }

    // Check Stripe connectivity
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      try {
        const response = await fetch("https://api.stripe.com/v1/balance", {
          headers: { Authorization: `Bearer ${stripeKey}` },
        });
        checks.stripe = { status: response.ok ? "healthy" : "degraded" };
      } catch {
        checks.stripe = { status: "unhealthy" };
      }
    } else {
      checks.stripe = { status: "not_configured" };
    }

    // Determine overall status
    const allHealthy = Object.values(checks).every(
      (c) => c.status === "healthy" || c.status === "not_configured"
    );
    const anyUnhealthy = Object.values(checks).some((c) => c.status === "unhealthy");

    const overallStatus: HealthStatus["status"] = allHealthy
      ? "healthy"
      : anyUnhealthy
      ? "unhealthy"
      : "degraded";

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: Deno.env.get("FUNCTION_VERSION") || "1.0.0",
      checks,
    };

    return new Response(JSON.stringify(healthStatus), {
      status: overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
        checks,
      }),
      {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
