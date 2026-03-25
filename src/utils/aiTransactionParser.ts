import { supabase } from "@/integrations/supabase/client";
import { ParsedTransactionDraft } from "@/utils/smartTransactionParser";

interface AIParseInput {
  text: string;
  accountNames: string[];
  expenseCategories: string[];
  incomeCategories: string[];
}

export const parseTransactionWithAI = async (
  payload: AIParseInput
): Promise<ParsedTransactionDraft | null> => {
  try {
    const { data, error } = await supabase.functions.invoke("parse-transaction", {
      body: {
        ...payload,
        today: new Date().toISOString().split("T")[0],
      },
    });

    console.log("AI parse response:", { data, error });

    if (error) {
      console.error("AI parse error:", error);
      throw new Error(error.message || "AI parse failed");
    }

    const parsed = data?.data;
    if (!parsed || typeof parsed !== "object") {
      console.warn("AI parse returned no data");
      return null;
    }

    console.log("AI parsed successfully:", parsed);
    return parsed as ParsedTransactionDraft;
  } catch (err) {
    console.error("AI parser exception:", err);
    throw err;
  }
};
