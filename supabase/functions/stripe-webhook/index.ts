import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2025-08-27.basil",
    });

    // Verify webhook signature (you'll need to set STRIPE_WEBHOOK_SECRET)
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    let event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.log("Webhook signature verification failed:", err.message);
        return new Response("Webhook signature verification failed", { status: 400 });
      }
    } else {
      // For development - parse without verification
      event = JSON.parse(body);
    }

    console.log("Webhook received:", event.type);

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing completed checkout:", session.id);
      
      if (session.payment_status === "paid" && session.metadata?.user_id) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const userId = session.metadata.user_id;
        const stripeAmountDollars = (session.amount_total || 0) / 100;
        const stripeFee = Math.round((stripeAmountDollars * 0.029 + 0.30) * 100) / 100;
        const netAmount = Math.round((stripeAmountDollars - stripeFee) * 100) / 100;

        // Get current balance
        const { data: profile } = await supabase
          .from("profiles")
          .select("balance")
          .eq("user_id", userId)
          .single();

        const currentBalance = profile?.balance || 0;
        const newBalance = Math.round((currentBalance + netAmount) * 100) / 100;

        // Update balance
        await supabase
          .from("profiles")
          .update({ balance: newBalance })
          .eq("user_id", userId);

        // Create transaction
        await supabase
          .from("transactions")
          .insert({
            user_id: userId,
            type: "deposit",
            amount: netAmount,
            balance_before: currentBalance,
            balance_after: newBalance,
            description: `Stripe Webhook Deposit - ${session.id}`,
            stripe_fee: stripeFee,
            created_at: new Date().toISOString()
          });

        // Create a payment completion record for polling
        await supabase
          .from("payment_completions")
          .insert({
            session_id: session.id,
            user_id: userId,
            amount_credited: netAmount,
            completed_at: new Date().toISOString()
          });

        console.log("Payment processed successfully for user:", userId);
      }
    }

    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Webhook error", { status: 500 });
  }
});