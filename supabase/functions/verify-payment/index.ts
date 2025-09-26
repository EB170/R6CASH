import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logWithTime = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [VERIFY-PAYMENT] ${message}`, data ? JSON.stringify(data) : '');
  };

  try {
    logWithTime("=== STARTING PAYMENT VERIFICATION ===");

    // Environment check
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !serviceRoleKey || !stripeKey) {
      throw new Error("Missing environment variables");
    }

    logWithTime("Environment variables OK");

    // Parse request
    const requestText = await req.text();
    logWithTime("Raw request body", { body: requestText, length: requestText.length });

    let requestData;
    try {
      requestData = JSON.parse(requestText);
    } catch (e) {
      logWithTime("JSON parse failed", { error: e.message });
      throw new Error("Invalid JSON in request");
    }

    const { session_id, amount } = requestData;
    logWithTime("Parsed request data", { session_id, amount, type_amount: typeof amount });

    if (!session_id) {
      throw new Error("session_id is required");
    }

    // Initialize clients
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    logWithTime("Clients initialized");

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    logWithTime("Extracting user from token", { tokenLength: token.length });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      logWithTime("User authentication failed", { error: userError });
      throw new Error("Authentication failed");
    }

    const userId = userData.user.id;
    logWithTime("User authenticated", { userId });

    // Retrieve Stripe session
    logWithTime("Retrieving Stripe session", { session_id });
    
    let stripeSession;
    try {
      stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      logWithTime("Stripe session retrieved", {
        payment_status: stripeSession.payment_status,
        amount_total: stripeSession.amount_total,
        customer: stripeSession.customer,
        metadata: stripeSession.metadata
      });
    } catch (stripeError) {
      logWithTime("Stripe session retrieval failed", { error: stripeError.message });
      throw new Error(`Stripe error: ${stripeError.message}`);
    }

    // Verify payment status
    if (stripeSession.payment_status !== "paid") {
      logWithTime("Payment not completed", { status: stripeSession.payment_status });
      throw new Error(`Payment status: ${stripeSession.payment_status}`);
    }

    // Verify user match
    if (stripeSession.metadata?.user_id !== userId) {
      logWithTime("User ID mismatch", {
        session_user: stripeSession.metadata?.user_id,
        current_user: userId
      });
      throw new Error("User verification failed");
    }

    // Calculate amounts
    const stripeAmountDollars = (stripeSession.amount_total || 0) / 100;
    const stripeFee = Math.round((stripeAmountDollars * 0.029 + 0.30) * 100) / 100;
    const netAmount = Math.round((stripeAmountDollars - stripeFee) * 100) / 100;

    logWithTime("Amount calculations", {
      stripe_total: stripeAmountDollars,
      stripe_fee: stripeFee,
      net_amount: netAmount
    });

    // CRITICAL: Use service role to bypass RLS
    logWithTime("Fetching current profile with service role");
    
    const { data: currentProfile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      logWithTime("Profile fetch error", { error: profileError });
      
      // If profile doesn't exist, create it
      logWithTime("Creating new profile");
      await supabase
        .from("profiles")
        .insert({
          id: userId,
          user_id: userId,
          balance: 0,
          display_name: "New User",
          username: "newuser"
        });
      
      // Retry fetch
      const { data: newProfile, error: retryError } = await supabase
        .from("profiles")
        .select("balance")
        .eq("user_id", userId)
        .single();
      
      if (retryError) {
        logWithTime("Profile creation failed", { error: retryError });
        throw new Error("Cannot access or create profile");
      }
      
      currentProfile = newProfile;
    }

    const currentBalance = currentProfile?.balance || 0;
    const newBalance = Math.round((currentBalance + netAmount) * 100) / 100;

    logWithTime("Balance calculation", {
      current_balance: currentBalance,
      net_amount: netAmount,
      new_balance: newBalance
    });

    // Update balance with service role (bypasses RLS)
    logWithTime("Updating balance");
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", userId);

    if (updateError) {
      logWithTime("Balance update failed", { error: updateError });
      throw new Error(`Balance update failed: ${updateError.message}`);
    }

    logWithTime("Balance updated successfully");

    // Create transaction record
    logWithTime("Creating transaction record");
    
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        id: crypto.randomUUID(),
        user_id: userId,
        type: "deposit",
        amount: netAmount,
        balance_before: currentBalance,
        balance_after: newBalance,
        description: `Stripe Deposit - Session: ${session_id.substring(0, 20)}...`,
        stripe_fee: stripeFee,
        created_at: new Date().toISOString()
      });

    if (txError) {
      logWithTime("Transaction creation failed", { error: txError });
      // Don't fail the whole process for transaction logging
    } else {
      logWithTime("Transaction recorded successfully");
    }

    logWithTime("=== PAYMENT VERIFICATION SUCCESS ===", {
      user_id: userId,
      amount_credited: netAmount,
      new_balance: newBalance
    });

    return new Response(JSON.stringify({
      success: true,
      amount_credited: netAmount,
      stripe_fee: stripeFee,
      new_balance: newBalance,
      message: "Payment verified and credited successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logWithTime("=== PAYMENT VERIFICATION FAILED ===", { error: errorMessage });

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  }
});