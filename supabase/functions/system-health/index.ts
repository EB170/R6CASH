import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYSTEM-HEALTH] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Health check request received");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate admin user
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      
      if (!userError && userData.user) {
        // Check if user has admin role
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userData.user.id)
          .single();
        
        if (roleData?.role !== 'admin') {
          throw new Error("Admin access required for system health check");
        }
      }
    }

    // Run comprehensive health check
    const { data: healthData, error: healthError } = await supabaseClient.rpc('system_health_check');
    
    if (healthError) {
      throw new Error(`Health check failed: ${healthError.message}`);
    }

    logStep("Health check completed", healthData);

    // Add additional system checks
    const additionalChecks = {
      database_connection: true,
      supabase_functions: true,
      stripe_integration: !!Deno.env.get("STRIPE_SECRET_KEY"),
      timestamp: new Date().toISOString()
    };

    const response = {
      ...healthData,
      additional_checks: additionalChecks,
      version: "1.0.0"
    };

    return new Response(
      JSON.stringify(response), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in system-health", { message: errorMessage });
    
    // Log system error to database if possible
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );
      
      await supabaseClient.rpc('log_system_error', {
        error_type: 'HEALTH_CHECK_FAILED',
        error_message: errorMessage,
        context_data: { timestamp: new Date().toISOString() },
        severity: 'ERROR'
      });
    } catch (logError) {
      logStep("Failed to log error to database", { error: logError });
    }
    
    return new Response(
      JSON.stringify({ 
        status: 'ERROR',
        error: errorMessage,
        timestamp: new Date().toISOString()
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});