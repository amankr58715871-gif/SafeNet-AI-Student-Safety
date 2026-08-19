import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatInput {
  message: string;
  context?: {
    riskLevel?: string;
    journeyActive?: boolean;
    destination?: string;
  };
}

interface Rule {
  keywords: string[];
  response: string;
}

const rules: Rule[] = [
  {
    keywords: ["feel unsafe", "feeling unsafe", "scared", "afraid", "unsafe"],
    response:
      "I understand you're feeling unsafe, and that's important. Here's what I recommend right now:\n\n" +
      "1. Move toward a populated, well-lit public area if you can — a shop, café, or petrol pump.\n" +
      "2. Stay on the phone with someone you trust, or send them your live location.\n" +
      "3. If the situation escalates, activate Emergency Mode to alert your trusted contacts with your location.\n\n" +
      "Would you like to start Emergency Mode or share your location with a trusted contact?",
  },
  {
    keywords: ["travelling alone", "traveling alone", "alone at night", "night"],
    response:
      "Travelling alone at night can feel stressful. Here are some practical tips:\n\n" +
      "1. Share your live location and ETA with a trusted contact before you start.\n" +
      "2. Choose well-lit, populated routes even if they're slightly longer.\n" +
      "3. Keep your phone charged and within reach.\n" +
      "4. Avoid shortcuts through isolated areas.\n" +
      "5. Start a Safe Journey so SafeNet AI can monitor you and send a check-in.\n\n" +
      "Would you like to start a Safe Journey now?",
  },
  {
    keywords: ["missed my route", "lost", "wrong route", "don't know where", "don't know where i am"],
    response:
      "It's okay to feel disoriented. Let's stay calm and figure this out:\n\n" +
      "1. Stop in a safe, visible place — don't keep walking while checking your phone.\n" +
      "2. Open your map app or share your location with a trusted contact so they can guide you.\n" +
      "3. If you're in a Safe Journey, SafeNet AI has detected a route deviation — confirm whether you're safe.\n" +
      "4. Ask someone nearby for directions to a landmark you recognise.\n\n" +
      "Would you like to share your location with a trusted contact?",
  },
  {
    keywords: ["battery is low", "phone battery", "low battery", "battery dying", "charging"],
    response:
      "A low battery is a real safety concern. Here's what to do:\n\n" +
      "1. Enable low-power mode on your phone immediately.\n" +
      "2. Share your live location with a trusted contact NOW while you still have battery.\n" +
      "3. Note your surroundings and any landmarks so you can describe your location if needed.\n" +
      "4. If you're on a Safe Journey, SafeNet AI will keep monitoring — but make sure someone knows your route.\n" +
      "5. If possible, stop at a café or shop to charge briefly.\n\n" +
      "Would you like to share your location with a trusted contact before your battery runs out?",
  },
  {
    keywords: ["need help", "help me", "emergency", "sos"],
    response:
      "I'm here to help. If you feel you're in danger or need urgent assistance:\n\n" +
      "1. Activate Emergency Mode — this will prepare your trusted contacts and location for sharing.\n" +
      "2. If you can, call your emergency contact or local emergency services (112 in India, 911 in the US).\n" +
      "3. Move to a safe, public location and stay visible.\n" +
      "4. Do not hesitate to ask bystanders for help.\n\n" +
      "Would you like to activate Emergency Mode now?",
  },
  {
    keywords: ["what should i do", "advice", "tips", "how do i stay safe"],
    response:
      "Here are some general safety tips for students:\n\n" +
      "1. Always share your travel plans and ETA with someone you trust.\n" +
      "2. Use SafeNet AI's Safe Journey feature to get monitored and receive smart check-ins.\n" +
      "3. Keep your phone charged and your trusted contacts updated.\n" +
      "4. Stick to well-lit, populated routes, especially at night.\n" +
      "5. Trust your instincts — if something feels wrong, move to a safe place and reach out.\n" +
      "6. Know your emergency numbers and keep them accessible.\n\n" +
      "Is there a specific situation you'd like guidance on?",
  },
  {
    keywords: ["hello", "hi", "hey", "start"],
    response:
      "Hi! I'm the SafeNet AI Assistant. I'm here to help you with safety-related situations.\n\n" +
      "You can ask me about:\n" +
      "- Travelling alone at night\n" +
      "- Feeling unsafe\n" +
      "- Getting lost or missing your route\n" +
      "- Low phone battery\n" +
      "- Emergency situations\n\n" +
      "What's on your mind?",
  },
];

const fallbackResponse =
  "I'm here to help with safety-related concerns. You can tell me things like:\n\n" +
  "- \"I feel unsafe\"\n" +
  "- \"I'm travelling alone at night\"\n" +
  "- \"I missed my route\"\n" +
  "- \"My phone battery is low\"\n" +
  "- \"I need help\"\n\n" +
  "What's your situation? I can also help you start Emergency Mode, share your location, or check your journey.";

function findResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const rule of rules) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.response;
    }
  }
  return fallbackResponse;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message } = (await req.json()) as ChatInput;
    const response = findResponse(message);
    return new Response(JSON.stringify({ response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, response: fallbackResponse }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
