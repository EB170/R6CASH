import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[LOG-SYSTEM-ERROR] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Error logging request received");

    // Create Supabase client with service role key for logging
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body safely
    let body;
    try {
      const requestText = await req.text();
      if (!requestText.trim()) {
        throw new Error("Empty request body");
      }
      body = JSON.parse(requestText);
      logStep("Parsed request body", { hasBody: !!body });
    } catch (error) {
      logStep("JSON parsing failed", { error: error.message });
      throw new Error(`Invalid JSON in request body: ${error.message}`);
    }
    
    const { 
      error_id,
      error_type, 
      error_message,
      error_stack,
      component_stack,
      user_id,
      timestamp,
      url,
      user_agent,
      additional_context
    } = body;

    if (!error_type || !error_message) {
      throw new Error("error_type and error_message are required");
    }

    // Use the log_system_error function
    const { data, error } = await supabaseClient.rpc('log_system_error', {
      error_type,
      error_message,
      context_data: {
        error_id,
        error_stack,
        component_stack,
        timestamp,
        url,
        user_agent,
        additional_context
      },
      severity: 'ERROR'
    });

    if (error) {
      throw new Error(`Failed to log error: ${error.message}`);
    }

    logStep("Error logged successfully", { error_id, error_type });

    // Also log critical errors to console for immediate visibility
    if (error_type.includes('CRITICAL') || error_type.includes('SECURITY')) {
      console.error(`🚨 CRITICAL ERROR LOGGED: ${error_type}`, {
        message: error_message,
        user_id,
        timestamp,
        url
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        error_id,
        logged_at: new Date().toISOString()
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in log-system-error", { message: errorMessage });
    
    // Fallback logging to console if database logging fails
    console.error('Failed to log system error:', {
      originalError: body,
      loggingError: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        success: false,
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