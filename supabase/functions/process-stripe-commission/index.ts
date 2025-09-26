import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-COMMISSION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Commission processing request received");

    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate admin user
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

    // Verify user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      throw new Error("Admin access required");
    }

    logStep("Admin user authenticated", { userId: user.id });

    // Parse request body safely
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new Error("Invalid JSON in request body");
    }
    
    const { period = 'daily' } = body; // 'daily', 'weekly', 'monthly'
    
    // Calculate commission period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    }

    logStep("Commission period calculated", { period, startDate, endDate: now });

    // Get pending commissions from platform_revenue
    const { data: pendingCommissions, error: commissionError } = await supabaseClient
      .from('platform_revenue')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', now.toISOString())
      .is('stripe_transfer_id', null); // Only get untransferred commissions

    if (commissionError) throw commissionError;

    if (!pendingCommissions || pendingCommissions.length === 0) {
      logStep("No pending commissions found");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No pending commissions to process",
          amount: 0,
          count: 0
        }), 
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Calculate total commission amount
    const totalCommission = pendingCommissions.reduce((sum, commission) => 
      sum + Number(commission.amount), 0
    );

    logStep("Pending commissions calculated", { 
      count: pendingCommissions.length,
      totalAmount: totalCommission 
    });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Get platform Stripe account info
    const adminStripeAccount = Deno.env.get("ADMIN_STRIPE_ACCOUNT_ID");
    if (!adminStripeAccount) {
      throw new Error("Admin Stripe account ID not configured");
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(totalCommission * 100);

    // Create a transfer to admin account (this would be configured in production)
    // For now, we'll just log the commission and mark as processed
    const transferDescription = `R6Cash commission transfer - ${period} - ${pendingCommissions.length} transactions`;
    
    logStep("Processing commission transfer", {
      amount: totalCommission,
      amountInCents,
      description: transferDescription
    });

    // In a real implementation, you would create a Stripe transfer here:
    // const transfer = await stripe.transfers.create({
    //   amount: amountInCents,
    //   currency: 'usd',
    //   destination: adminStripeAccount,
    //   description: transferDescription,
    // });

    // For now, simulate a successful transfer
    const simulatedTransferId = `tr_simulate_${Date.now()}`;

    // Update platform_revenue records with transfer ID
    const commissionIds = pendingCommissions.map(c => c.id);
    const { error: updateError } = await supabaseClient
      .from('platform_revenue')
      .update({ 
        stripe_transfer_id: simulatedTransferId,
        updated_at: now.toISOString()
      })
      .in('id', commissionIds);

    if (updateError) throw updateError;

    // Log the commission processing for audit
    const { error: auditError } = await supabaseClient
      .from('audit_log')
      .insert({
        user_id: user.id,
        action: 'COMMISSION_PROCESSED',
        table_name: 'platform_revenue',
        record_id: simulatedTransferId,
        new_values: {
          period,
          amount: totalCommission,
          count: pendingCommissions.length,
          transfer_id: simulatedTransferId,
          processed_at: now.toISOString()
        }
      });

    if (auditError) {
      logStep("Audit log error", { error: auditError });
      // Don't fail the entire operation for audit log issues
    }

    logStep("Commission processing completed", { 
      transferId: simulatedTransferId,
      amount: totalCommission,
      count: pendingCommissions.length 
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Commission processed successfully",
        transfer_id: simulatedTransferId,
        amount: totalCommission,
        count: pendingCommissions.length,
        period
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-stripe-commission", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});