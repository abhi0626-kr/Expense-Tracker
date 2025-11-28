import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId }: SendOTPRequest = await req.json();

    // Save OTP to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check rate limit: max 5 OTPs per day per user
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentOtps, error: countError } = await supabase
      .from("email_verifications")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", oneDayAgo);

    if (countError) {
      console.error("Count error:", countError);
      throw new Error("Failed to check rate limit");
    }

    if (recentOtps && recentOtps.length >= 5) {
      return new Response(
        JSON.stringify({ error: "Maximum OTP requests (5) reached for today. Please try again tomorrow." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Calculate expiry time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: userId,
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt,
        verified: false,
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save OTP");
    }

    // Send OTP email
    const emailResponse = await resend.emails.send({
      from: "Expense Tracker <onboarding@resend.dev>",
      to: [email],
      subject: "Verify Your Email - OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p style="font-size: 16px; color: #666;">
            Thank you for signing up! Please use the following OTP code to verify your email address:
          </p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 14px; color: #999;">
            This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Failed to send email:", emailResponse.error);
      throw new Error(`Email sending failed: ${emailResponse.error.message}`);
    }

    console.log("OTP email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
