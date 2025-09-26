import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Predefined price mapping for deposits
const DEPOSIT_PRICES = {
  5: "price_1SACwPBP8Akgd3ZkaiMaBstx",     // $5
  10: "price_1S9rpjBP8Akgd3Zk8PAFhp5P",    // $10
  25: "price_1SACkKBP8Akgd3ZkGgGDObht",    // $25
  50: "price_1SAClHBP8Akgd3ZkyQH9v04O",    // $50
  100: "price_1SAClSBP8Akgd3ZkvXfD5ioS",   // $100
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DEPOSIT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Deposit request received");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body with multiple fallbacks
    let body;
    let amount;
    
    try {
      const rawText = await req.text();
      logStep("Raw request text", { rawText, length: rawText.length });
      
      if (!rawText || rawText.trim() === '') {
        // Try to get from URL params as fallback
        const url = new URL(req.url);
        amount = url.searchParams.get('amount');
        logStep("Using URL param amount", { amount });
        
        if (!amount) {
          throw new Error("No amount provided in body or URL params");
        }
        amount = parseFloat(amount);
      } else {
        body = JSON.parse(rawText);
        amount = body.amount;
        logStep("Parsed from JSON body", { amount });
      }
    } catch (parseError) {
      logStep("JSON parse error", { error: parseError.message });
      // Last resort: try URL params
      const url = new URL(req.url);
      amount = url.searchParams.get('amount');
      if (!amount) {
        throw new Error(`Failed to parse request: ${parseError.message}`);
      }
      amount = parseFloat(amount);
      logStep("Using URL param as fallback", { amount });
    }
    
    if (!amount || typeof amount !== 'number') {
      throw new Error("Valid amount is required");
    }
    
    logStep("Amount received", { amount, type: typeof amount });

    // Find corresponding price ID
    const priceId = DEPOSIT_PRICES[amount as keyof typeof DEPOSIT_PRICES];
    if (!priceId) {
      throw new Error(`Unsupported deposit amount: $${amount}. Supported amounts: $5, $10, $25, $50, $100`);
    }

    logStep("Price ID found", { amount, priceId });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if Stripe customer exists
    const customers = await stripe.customers.list({ 
      email: user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    }

    // Create checkout session with predefined price
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&amount=${amount}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        amount: amount.toString(), // Store in dollars for consistency
        type: 'deposit'
      },
      payment_intent_data: {
        metadata: {
          type: 'deposit',
          user_id: user.id,
          amount: (amount * 100).toString()
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in deposit-payment", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});