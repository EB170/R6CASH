import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-WITHDRAWAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Withdrawal request received");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.id) {
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const body = await req.json();
    const { amount, payment_method, payment_details } = body;
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new Error("Valid amount is required");
    }
    
    if (amount < 20) {
      throw new Error("Minimum withdrawal amount is $20.00");
    }
    
    if (!payment_method || !payment_details) {
      throw new Error("Payment method and details are required");
    }
    
    logStep("Withdrawal request validated", { amount, payment_method });

    // Use the secure RPC function to create withdrawal request
    const { data: withdrawalResult, error: withdrawalError } = await supabaseClient.rpc(
      'create_withdrawal_request',
      {
        amount_param: amount,
        payment_method_param: payment_method,
        payment_details_param: payment_details
      }
    );

    if (withdrawalError) {
      logStep("Database error", { error: withdrawalError });
      throw new Error(`Failed to create withdrawal request: ${withdrawalError.message}`);
    }

    if (withdrawalResult?.error) {
      throw new Error(withdrawalResult.error);
    }

    logStep("Withdrawal request created", { 
      userId: user.id, 
      amount: amount,
      withdrawalId: withdrawalResult.withdrawal_id
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        withdrawal_id: withdrawalResult.withdrawal_id,
        message: "Withdrawal request submitted successfully"
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-withdrawal", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});