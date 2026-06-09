const DEFAULT_LANES = [
  "居住遷移史",
  "就業就學史",
  "感情家庭史",
  "疾病健康史",
  "社會資源使用歷程",
  "重大財務事件"
];

const SENSITIVITY = ["一般", "內部", "高度敏感", "不可外部分享"];
const CONFIDENCE = ["低", "中", "高"];

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

  if (!process.env.OPENAI_API_KEY) {
    return json(res, 200, {
      mode: "local-fallback",
      message: "OPENAI_API_KEY is not configured; frontend should use local semantic rules.",
      events: [],
      decisions: [],
      warnings: ["尚未設定 AI API key，使用本機語意規則產生草稿。"]
    });
  }

  const clippedText = text.slice(0, 18000);
  const clippedWarning = clippedText.length < text.length ? "輸入過長，已先分析前 18,000 字元。" : "";

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        store: false,
        max_output_tokens: 2600,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "你是台灣社工與財務健康諮詢的個案脈絡整理助手。",
                  "任務是把資料整理成「待社工確認」的生命軸線草稿，不得直接下診斷、責備案主、提供投資或借貸建議。",
                  "請使用繁體中文與台灣常用語，民國年可填數字；不確定就留空字串。",
                  "請特別辨識居住遷移、就業就學、感情家庭、疾病健康、社會資源使用、重大財務事件。",
                  "請把個案決策理解為資源、風險、制度條件、關係壓力與能力限制下的選擇，不要用道德評價。"
                ].join("\n")
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `請把以下資料整理為生命軸線待確認草稿。\n\n${clippedText}`
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

    const data = await response.json();
    if (!response.ok) {
      return json(res, 502, {
        mode: "openai-error",
        message: data.error?.message || "OpenAI analysis failed.",
        events: [],
        decisions: [],
        warnings: [clippedWarning].filter(Boolean)
      });
    }

    const parsed = parseResponseJson(data);
    const warnings = [
      clippedWarning,
      ...(Array.isArray(parsed.warnings) ? parsed.warnings : [])
    ].filter(Boolean);

    return json(res, 200, normalizeAnalysis(parsed, warnings));
  } catch (error) {
    return json(res, 502, {
      mode: "openai-error",
      message: error.message,
      events: [],
      decisions: [],
      warnings: [clippedWarning].filter(Boolean)
    });
  }
};

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
            "age",
            "lane",
            "title",
            "fact",
            "voice",
            "impact",
            "unknowns",
            "sensitivity",
            "confidence"
          ],
          properties: {
            rocYear: { type: "string", description: "民國年數字；不確定留空字串。" },
            age: { type: "string", description: "案主年齡數字；不確定留空字串。" },
            lane: { type: "string", enum: lanes },
            title: { type: "string" },
            fact: { type: "string" },
            voice: { type: "string" },
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

function normalizeAnalysis(parsed, warnings) {
  return {
    mode: "openai",
    events: (Array.isArray(parsed.events) ? parsed.events : []).map((item) => ({
      rocYear: String(item.rocYear || ""),
      age: String(item.age || ""),
      lane: String(item.lane || "重大財務事件"),
      title: String(item.title || "待確認事件"),
      fact: String(item.fact || ""),
      voice: String(item.voice || ""),
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

function parseResponseJson(data) {
  const direct = typeof data.output_text === "string" ? data.output_text : "";
  const nested = direct || (Array.isArray(data.output)
    ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .find((content) => content.type === "output_text" && typeof content.text === "string")?.text
    : "");
  if (!nested) throw new Error("OpenAI response did not include output_text.");
  return JSON.parse(nested);
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
