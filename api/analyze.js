const DEFAULT_LANES = [
  "居住遷移史",
  "就業與就學史",
  "感情與家庭史",
  "疾病與身心健康史",
  "社會資源使用歷程",
  "重大財務事件"
];

const SENSITIVITY = ["一般", "內部", "高度敏感", "不可外部分享"];
const CONFIDENCE = ["低", "中", "高"];
const GEMINI_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

module.exports = async function handler(req, res) {
  setNoStore(res);

  if (req.method !== "POST") {
    return json(res, 405, { error: "method_not_allowed" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, { error: "invalid_json", message: error.message });
  }

  const text = String(body.text || "").trim();
  const lanes = Array.isArray(body.lanes) && body.lanes.length ? body.lanes : DEFAULT_LANES;

  if (text.length < 6) {
    return json(res, 400, { error: "input_too_short" });
  }

  const clippedText = text.slice(0, 18000);
  const clippedWarning = clippedText.length < text.length ? "輸入過長，已先分析前 18,000 字元。" : "";
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const providers = buildProviderOrder(body.provider || process.env.AI_ANALYSIS_PROVIDER, {
    hasGemini: Boolean(geminiApiKey),
    hasOpenAi: Boolean(openAiApiKey)
  });

  if (!providers.length) {
    return json(res, 200, localFallbackPayload(
      "GEMINI_API_KEY / OPENAI_API_KEY is not configured; frontend should use local semantic rules.",
      [clippedWarning, "尚未設定 AI API key，使用初步規則整理產生草稿。"].filter(Boolean)
    ));
  }

  const providerWarnings = [];
  for (const provider of providers) {
    try {
      const analysis = provider === "gemini"
        ? await runGeminiAnalysis(clippedText, lanes, [clippedWarning], geminiApiKey)
        : await runOpenAiAnalysis(clippedText, lanes, [clippedWarning], openAiApiKey);
      return json(res, 200, analysis);
    } catch (error) {
      providerWarnings.push(`${provider === "gemini" ? "Gemini" : "OpenAI"} 語意整理暫時無法完成：${error.message}`);
    }
  }

  return json(res, 200, localFallbackPayload(
    "AI analysis failed; frontend should use local semantic rules.",
    [clippedWarning, ...providerWarnings, "已改用初步規則整理產生草稿。"].filter(Boolean)
  ));
};

async function runGeminiAnalysis(text, lanes, baseWarnings, apiKey) {
  const model = process.env.GEMINI_SEMANTIC_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const response = await fetch(`${GEMINI_GENERATE_URL}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: [
                analysisInstructions(),
                "",
                "請把以下資料整理為生命軸線待確認草稿，只輸出符合 schema 的 JSON，不要輸出 Markdown。",
                "",
                text
              ].join("\n")
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: analysisSchema(lanes),
        maxOutputTokens: 2600,
        temperature: 0.2
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `Gemini analysis failed with ${response.status}.`);
  }
  const parsed = JSON.parse(stripJsonFences(extractGeminiOutputText(data)));
  return normalizeAnalysis(parsed, collectWarnings(parsed, baseWarnings), "gemini");
}

async function runOpenAiAnalysis(text, lanes, baseWarnings, apiKey) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      store: false,
      max_output_tokens: 2600,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: analysisInstructions()
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `請把以下資料整理為生命軸線待確認草稿。\n\n${text}`
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "case_timeline_analysis",
          strict: true,
          schema: analysisSchema(lanes)
        }
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `OpenAI analysis failed with ${response.status}.`);
  }
  const parsed = parseResponseJson(data);
  return normalizeAnalysis(parsed, collectWarnings(parsed, baseWarnings), "openai");
}

function analysisInstructions() {
  return [
    "你是台灣社工與財務健康諮詢的個案脈絡整理助手。",
    "任務是把資料整理成「待社工確認」的生命軸線草稿，不得直接下診斷、責備案主、提供投資或借貸建議。",
    "請使用繁體中文與台灣常用語，民國年可填數字；不確定就留空字串。",
    "若資料描述一段期間，請填 rocYear、endRocYear；若寫到至今、目前仍持續、仍在進行，ongoing 請填 true 並讓 endRocYear 留空。",
    "請特別辨識居住遷移、就業與就學、感情與家庭、疾病與身心健康、社會資源使用、重大財務事件。",
    "同一句話若包含多個人物、多個年份或多個金額，請盡量拆成多筆事件，不要把案主、案母、案父的不同事件混成同一筆。",
    "請用事件核心分類：婚姻、交往、伴侶/親密關係才放感情與家庭史；親友提供生活費、負債、借貸、代繳、還款等即使涉及家人，主分類仍偏重大財務事件。",
    "例如「個案於115年取得中低收入戶、案母每月提供5000元生活費、案父108年負債500萬」應拆成三筆：個案社會資源使用、案母重大財務支持、案父重大財務事件。",
    "身心科、精神科、就醫、診斷、用藥、門診、住院、復健等主分類優先放疾病與身心健康史，不要誤放重大財務事件。",
    "若事件同時牽涉其他面向，請放在 relatedLanes；若使用者可能想新增自訂分類，請只放在 extraTags，不要替換六大主分類。",
    "每筆事件請保留 sourceText 原文摘錄，並整理 actorText、place、objects，方便社工確認人事時地物後再歸檔。",
    "請把個案決策理解為資源、風險、制度條件、關係壓力與能力限制下的選擇，不要用道德評價。"
  ].join("\n");
}

function analysisSchema(lanes) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["events", "decisions", "warnings"],
    properties: {
      events: {
        type: "array",
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "rocYear",
            "endRocYear",
            "ongoing",
            "age",
            "lane",
            "relatedLanes",
            "extraTags",
            "title",
            "fact",
            "voice",
            "actorText",
            "place",
            "objects",
            "sourceText",
            "impact",
            "unknowns",
            "sensitivity",
            "confidence"
          ],
          properties: {
            rocYear: { type: "string", description: "民國年數字；不確定留空字串。" },
            endRocYear: { type: "string", description: "若事件有結束年份，填民國年數字；單次事件、未知或仍持續時留空字串。" },
            ongoing: { type: "boolean", description: "事件是否仍在持續，例如婚姻、工作、學業、債務協商、照顧安排仍未結束。" },
            age: { type: "string", description: "案主年齡數字；不確定留空字串。" },
            lane: { type: "string", enum: lanes },
            relatedLanes: { type: "array", maxItems: 5, items: { type: "string", enum: lanes }, description: "同一事件的次要關聯面向；不要包含主分類。" },
            extraTags: { type: "string", description: "使用者可能想自訂追蹤的補充標籤，例如親友金錢支援、福利身分、債務壓力；可留空。" },
            title: { type: "string" },
            fact: { type: "string" },
            voice: { type: "string" },
            actorText: { type: "string", description: "原文中辨識到的人物角色，例如案主、案母、案父；不確定留空。" },
            place: { type: "string", description: "地點、窗口或機構，例如租屋處、社福中心、銀行；不確定留空。" },
            objects: { type: "string", description: "金額、文件、資源或債務物件，例如5000元、中低收入戶、債務清冊；不確定留空。" },
            sourceText: { type: "string", description: "支持此事件的短原文摘錄，避免混入其他事件。" },
            impact: { type: "string" },
            unknowns: { type: "string" },
            sensitivity: { type: "string", enum: SENSITIVITY },
            confidence: { type: "string", enum: CONFIDENCE }
          }
        }
      },
      decisions: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["eventId", "question", "options", "fear", "interpretation", "confidence"],
          properties: {
            eventId: { type: "string" },
            question: { type: "string" },
            options: { type: "string" },
            fear: { type: "string" },
            interpretation: { type: "string" },
            confidence: { type: "string", enum: CONFIDENCE }
          }
        }
      },
      warnings: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      }
    }
  };
}

function normalizeAnalysis(parsed, warnings, mode) {
  return {
    mode,
    events: (Array.isArray(parsed.events) ? parsed.events : []).map((item) => ({
      rocYear: String(item.rocYear || ""),
      endRocYear: String(item.endRocYear || ""),
      ongoing: Boolean(item.ongoing),
      age: String(item.age || ""),
      lane: String(item.lane || "重大財務事件"),
      relatedLanes: Array.isArray(item.relatedLanes) ? item.relatedLanes.filter((lane) => DEFAULT_LANES.includes(lane) && lane !== item.lane) : [],
      extraTags: String(item.extraTags || ""),
      title: String(item.title || "待確認事件"),
      fact: String(item.fact || ""),
      voice: String(item.voice || ""),
      actorText: String(item.actorText || ""),
      place: String(item.place || ""),
      objects: String(item.objects || ""),
      sourceText: String(item.sourceText || item.fact || ""),
      impact: String(item.impact || ""),
      unknowns: String(item.unknowns || ""),
      sensitivity: SENSITIVITY.includes(item.sensitivity) ? item.sensitivity : "內部",
      confidence: CONFIDENCE.includes(item.confidence) ? item.confidence : "低"
    })),
    decisions: (Array.isArray(parsed.decisions) ? parsed.decisions : []).map((item) => ({
      eventId: String(item.eventId || ""),
      question: String(item.question || "待確認決策問題"),
      options: String(item.options || ""),
      fear: String(item.fear || ""),
      interpretation: String(item.interpretation || ""),
      confidence: CONFIDENCE.includes(item.confidence) ? item.confidence : "低"
    })),
    warnings
  };
}

function collectWarnings(parsed, baseWarnings) {
  return [
    ...(Array.isArray(baseWarnings) ? baseWarnings : []),
    ...(Array.isArray(parsed.warnings) ? parsed.warnings : [])
  ].filter(Boolean);
}

function buildProviderOrder(preferred, availability) {
  const normalized = String(preferred || "").trim().toLowerCase();
  const available = [];
  if (availability.hasGemini) available.push("gemini");
  if (availability.hasOpenAi) available.push("openai");
  if (!available.length) return [];
  if (normalized === "openai") return ["openai", "gemini"].filter((provider) => available.includes(provider));
  if (normalized === "gemini") return ["gemini", "openai"].filter((provider) => available.includes(provider));
  return available;
}

function localFallbackPayload(message, warnings) {
  return {
    mode: "local-fallback",
    message,
    events: [],
    decisions: [],
    warnings
  };
}

function parseResponseJson(data) {
  const direct = typeof data.output_text === "string" ? data.output_text : "";
  const nested = direct || (Array.isArray(data.output)
    ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .find((content) => content.type === "output_text" && typeof content.text === "string")?.text
    : "");
  if (!nested) throw new Error("OpenAI response did not include output_text.");
  return JSON.parse(nested);
}

function extractGeminiOutputText(payload) {
  const texts = [];
  (payload.candidates || []).forEach((candidate) => {
    (candidate.content?.parts || []).forEach((part) => {
      if (part.text) texts.push(part.text);
    });
  });
  const text = texts.join("\n").trim();
  if (!text) throw new Error("Gemini response did not include text output.");
  return text;
}

function stripJsonFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function setNoStore(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function json(res, status, payload) {
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}
