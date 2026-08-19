import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalyzeInput {
  timeOfDay?: string;
  routeDeviationKm?: number;
  missedCheckIn?: boolean;
  unexpectedStop?: boolean;
  journeyDurationMin?: number;
  expectedDurationMin?: number;
  distanceFromRouteKm?: number;
  userStatus?: string;
  isNightTravel?: boolean;
}

interface RiskResult {
  risk_level: "low" | "medium" | "high";
  risk_score: number;
  reasons: string[];
  recommendation: string;
}

function assessRisk(input: AnalyzeInput): RiskResult {
  let score = 0;
  const reasons: string[] = [];
  const recommendationParts: string[] = [];

  // Route deviation
  const deviation = input.routeDeviationKm ?? 0;
  if (deviation > 0.8) {
    score += 30;
    reasons.push("Significant route deviation detected");
    recommendationParts.push("confirm your current location and safety");
  } else if (deviation > 0.3) {
    score += 15;
    reasons.push("Minor route deviation detected");
  }

  // Missed check-in
  if (input.missedCheckIn) {
    score += 25;
    reasons.push("Safety check-in not responded to");
    recommendationParts.push("respond to the pending safety check-in");
  }

  // Unexpected stop
  if (input.unexpectedStop) {
    score += 15;
    reasons.push("Unexpected stop detected during journey");
  }

  // Duration overrun
  if (input.expectedDurationMin && input.journeyDurationMin) {
    const overrun = input.journeyDurationMin - input.expectedDurationMin;
    if (overrun > 10) {
      score += 20;
      reasons.push("Journey taking longer than expected");
    } else if (overrun > 5) {
      score += 10;
      reasons.push("Journey slightly delayed");
    }
  }

  // Night travel
  if (input.isNightTravel) {
    score += 10;
    reasons.push("Travelling during late-night hours");
    recommendationParts.push("stay aware of your surroundings");
  }

  // User-reported status
  if (input.userStatus === "unsafe") {
    score += 40;
    reasons.push("User reported feeling unsafe");
    recommendationParts.push("move toward a populated, well-lit area and contact a trusted person immediately");
  } else if (input.userStatus === "caution") {
    score += 15;
    reasons.push("User indicated caution");
  }

  score = Math.min(100, Math.max(0, score));

  let level: RiskResult["risk_level"] = "low";
  if (score >= 60) level = "high";
  else if (score >= 30) level = "medium";

  let recommendation: string;
  if (level === "high") {
    recommendation =
      "High-risk conditions detected. Please confirm you are safe immediately. " +
      "Move toward a populated, well-lit public location. " +
      "Contact a trusted person or activate Emergency Mode if you feel threatened. " +
      "This is an AI-generated assessment based on available signals.";
  } else if (level === "medium") {
    recommendation =
      "Caution advised. Please " +
      (recommendationParts.join(", ") || "stay alert") +
      ". If you feel uncomfortable, move toward a public area and let a trusted contact know. " +
      "This is an AI-generated assessment based on available signals.";
  } else {
    recommendation =
      "Your journey appears to be progressing normally. Stay aware of your surroundings and confirm your safety when prompted. " +
      "This is an AI-generated assessment based on available signals.";
  }

  if (reasons.length === 0) reasons.push("No abnormal safety signals detected");

  return { risk_level: level, risk_score: score, reasons, recommendation };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const input = (await req.json()) as AnalyzeInput;
    const result = assessRisk(input);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
