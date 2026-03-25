import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

interface ParseRequest {
  text: string;
  accountNames: string[];
  expenseCategories: string[];
  incomeCategories: string[];
  today?: string;
}

interface ParsedDraft {
  type?: "income" | "expense";
  amount?: string;
  category?: string;
  accountName?: string;
  description?: string;
  date?: string;
}

const fallbackFromText = (payload: ParseRequest): ParsedDraft => {
  const text = payload.text || "";
  const lower = text.toLowerCase();

  const amountMatch = lower.match(/(?:₹|rs\.?|inr\s*)?\s*(\d+(?:[\.,]\d{1,2})?)/i);
  const amountNumber = amountMatch?.[1] ? Number.parseFloat(amountMatch[1].replace(",", "")) : NaN;

  const type = ["salary", "income", "earned", "received", "credit", "bonus"].some((word) => lower.includes(word))
    ? "income"
    : "expense";

  const categories = type === "expense" ? payload.expenseCategories : payload.incomeCategories;
  const category = categories.find((categoryName) => lower.includes(categoryName.toLowerCase()));
  const accountName = payload.accountNames.find((name) => lower.includes(name.toLowerCase()));

  const today = new Date();
  let date = payload.today || today.toISOString().split("T")[0];
  if (lower.includes("yesterday")) {
    const d = new Date(today);
    d.setDate(today.getDate() - 1);
    date = d.toISOString().split("T")[0];
  }

  return {
    type,
    amount: !Number.isNaN(amountNumber) && amountNumber > 0 ? amountNumber.toFixed(2) : undefined,
    category: category || categories[0],
    accountName,
    description: text,
    date,
  };
};

const buildPrompt = (payload: ParseRequest) => {
  return `You are an expert transaction parser for a personal finance app.

Convert the user sentence into strict JSON only.

Rules:
- Output ONLY a JSON object, no markdown.
- Allowed keys: type, amount, category, accountName, description, date.
- type must be either "income" or "expense" if present.
- amount must be numeric string with 2 decimals (example "250.00").
- category must be chosen from provided categories if possible.
- accountName must exactly match one of provided account names if possible.
- date must be YYYY-MM-DD if recognized; today is ${payload.today ?? new Date().toISOString().split("T")[0]}.
- If a field is unknown, omit it.

Context:
- Account names: ${JSON.stringify(payload.accountNames)}
- Expense categories: ${JSON.stringify(payload.expenseCategories)}
- Income categories: ${JSON.stringify(payload.incomeCategories)}

User text:
${payload.text}`;
};

const stripCodeFence = (value: string) => {
  return value.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
};

const safeParseJsonObject = (raw: string) => {
  const cleaned = stripCodeFence(raw).trim();
  if (!cleaned) {
    throw new Error("Empty JSON response");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("No JSON object found in model response");
    }

    const sliced = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(sliced);
    } catch {
      const quotedKeys = sliced.replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, "$1\"$2\"$3");
      const normalizedQuotes = quotedKeys.replace(/'/g, '"');
      return JSON.parse(normalizedQuotes);
    }
  }
};

const parseRequestBody = async (req: Request): Promise<ParseRequest> => {
  const raw = await req.text();
  if (!raw?.trim()) {
    throw new Error("Missing request body");
  }

  try {
    return JSON.parse(raw) as ParseRequest;
  } catch {
    const fixed = raw.replace(/^'+|'+$/g, "").trim();
    return JSON.parse(fixed) as ParseRequest;
  }
};

const normalizeParsed = (draft: any): ParsedDraft => {
  if (!draft || typeof draft !== "object") return {};

  const output: ParsedDraft = {};

  if (draft.type === "income" || draft.type === "expense") {
    output.type = draft.type;
  }

  if (draft.amount !== undefined && draft.amount !== null) {
    const amountNumber = Number.parseFloat(String(draft.amount).replace(",", ""));
    if (!Number.isNaN(amountNumber) && amountNumber > 0) {
      output.amount = amountNumber.toFixed(2);
    }
  }

  if (typeof draft.category === "string" && draft.category.trim()) {
    output.category = draft.category.trim();
  }

  if (typeof draft.accountName === "string" && draft.accountName.trim()) {
    output.accountName = draft.accountName.trim();
  }

  if (typeof draft.description === "string" && draft.description.trim()) {
    output.description = draft.description.trim();
  }

  if (typeof draft.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
    output.date = draft.date;
  }

  return output;
};

const parseWithOpenAI = async (prompt: string) => {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "Extract personal finance transaction details and return only JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error: ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  return safeParseJsonObject(content);
};

const parseWithGemini = async (prompt: string) => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash-latest";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini error: ${errText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return safeParseJsonObject(text);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await parseRequestBody(req);

    if (!payload?.text?.trim()) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    const prompt = buildPrompt(payload);

    let parsed: any | null = null;
    let provider = "openai";
    const providerErrors: string[] = [];

    try {
      parsed = await parseWithOpenAI(prompt);
      provider = "openai";
    } catch (openAiError: any) {
      providerErrors.push(`openai: ${openAiError?.message || String(openAiError)}`);
      try {
        parsed = await parseWithGemini(prompt);
        provider = "gemini";
      } catch (geminiError: any) {
        providerErrors.push(`gemini: ${geminiError?.message || String(geminiError)}`);
      }
    }

    const normalized = parsed ? normalizeParsed(parsed) : fallbackFromText(payload);

    return new Response(JSON.stringify({ data: normalized, provider: parsed ? provider : "fallback", providerErrors }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("parse-transaction error:", error);
    return new Response(JSON.stringify({ data: {}, provider: "fallback", error: error.message || "Parse failed" }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
