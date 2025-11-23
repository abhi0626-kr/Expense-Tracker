import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  account_id: string;
  created_at: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transaction }: { transaction: Transaction } = await req.json();

    // Parse Google Sheets credentials
    const credentialsJson = Deno.env.get("GOOGLE_SHEETS_CREDENTIALS");
    if (!credentialsJson) {
      throw new Error("Google Sheets credentials not configured");
    }

    const credentials = JSON.parse(credentialsJson);
    
    // Get access token using service account
    const jwtHeader = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
    const now = Math.floor(Date.now() / 1000);
    const jwtClaimSet = btoa(JSON.stringify({
      iss: credentials.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    }));

    const signatureInput = `${jwtHeader}.${jwtClaimSet}`;
    
    // Note: For production, you'll need to properly sign this JWT with the private key
    // This is a simplified version. You may need to use a JWT library for proper signing.
    
    // For now, we'll use the Sheets API with the access token
    // In production, implement proper JWT signing with the service account private key
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: signatureInput, // This needs proper JWT signing in production
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token error:", await tokenResponse.text());
      throw new Error("Failed to get access token");
    }

    const { access_token } = await tokenResponse.json();

    // Append row to Google Sheet
    const spreadsheetId = credentials.spreadsheet_id; // You'll need to add this to credentials
    const range = "Transactions!A:H"; // Adjust sheet name and range as needed

    const values = [[
      transaction.id,
      transaction.type,
      transaction.description,
      transaction.amount,
      transaction.category,
      transaction.date,
      transaction.account_id,
      transaction.created_at,
    ]];

    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values }),
      }
    );

    if (!sheetsResponse.ok) {
      console.error("Sheets error:", await sheetsResponse.text());
      throw new Error("Failed to append to Google Sheets");
    }

    console.log("Transaction synced to Google Sheets:", transaction.id);

    return new Response(
      JSON.stringify({ success: true, message: "Synced to Google Sheets" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in sync-to-sheets function:", error);
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
