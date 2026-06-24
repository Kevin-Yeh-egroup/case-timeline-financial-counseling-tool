const CURRENT_STATE_VERSION = "v0.33-workspace-save-record";
const CURRENT_STATE_KEY = "caseTimelineToolState";
const LEGACY_STATE_KEY_PREFIX = "caseTimelineToolState:";
const SAVED_RECORDS_KEY = "caseTimelineSavedRecords";
const MAX_SAVED_RECORDS = 40;
const QUICK_FIXTURE_TEXT = [
  "多人物事件拆分測試資料，僅供工具測試使用。",
  "",
  "個案於115年取得中低收入戶資格。",
  "案母每月提供5000元生活費，協助案主支付房租與孩子用品。",
  "案父108年負債500萬，曾向案主要求共同處理還款。",
  "案主110年至今在餐飲業排班工作，但因照顧孩子常需要請假。",
  "案主112年與伴侶分居，目前仍需確認扶養費與同住安排。"
].join("\n");
const EXAMPLE_PACKAGE_ID = "example-life-context-pack";
const ALL_ACTORS_ID = "all";
const lanes = ["居住遷移史", "就業與就學史", "感情與家庭史", "疾病與身心健康史", "社會資源使用歷程", "重大財務事件"];
const policyLaneName = "台灣制度背景";
const laneAliases = {
  "就業就學史": "就業與就學史",
  "感情家庭史": "感情與家庭史",
  "疾病身心史": "疾病與身心健康史",
  "疾病健康史": "疾病與身心健康史"
};
const sensitivityOptions = ["通過", "需遮罩", "需同意", "不得分享", "需督導確認"];
const actorCueMap = [
  ["案主本人", /案主|個案|本人|服務對象/],
  ["案母", /案母|母親|媽媽|母/],
  ["案父", /案父|父親|爸爸|父/],
  ["子女", /子女|孩子|小孩|兒子|女兒/],
  ["配偶/伴侶", /配偶|伴侶|先生|太太|丈夫|妻子|男友|女友|同居人/],
  ["主要照顧者", /主要照顧者|照顧者/],
  ["同住親屬", /親屬|手足|哥哥|姊姊|姐姐|弟弟|妹妹|阿姨|叔叔|姑姑|舅舅|祖父|祖母|外公|外婆/]
];
const moneyPattern = /(\d+(?:\.\d+)?\s*(?:萬元|萬|元|塊)|生活費|負債|借貸|債務|還款|信用卡|利息|催收|帳戶|補助|中低收入戶|低收入戶|租金補貼)/g;

const historyGuides = [
  {
    name: "居住遷移史",
    focus: "住在哪裡、跟誰住、何時搬、搬遷是否與安全、房租、就學、照顧或工作有關。",
    lookFor: "第一次獨立租屋、寄住、安置、中途之家、戶籍/居住地不一致、租金補貼或社宅資源。",
    decisionMeaning: "搬遷常是風險控制與可用資源的結果，不宜直接解讀為不穩定或不負責。",
    caution: "地址、庇護/安置地點、保護案件資訊不得外部分享。"
  },
  {
    name: "就業與就學史",
    focus: "學歷、職訓、工作型態、收入穩定度、工時、照顧責任與資格門檻如何互相影響。",
    lookFor: "非典型工作、失業、留停、照顧中斷、就學轉換、職訓、薪資與社保紀錄。",
    decisionMeaning: "沒有穩定工作可能反映照顧、健康、交通、文件或制度誘因，不等於沒有動機。",
    caution: "不要把收入推估寫成事實；須標示來源與待確認。"
  },
  {
    name: "感情與家庭史",
    focus: "交往、婚姻、分居離婚、親職、扶養、家庭衝突與支持網絡如何影響金錢決策。",
    lookFor: "孩子出生、前段婚姻、扶養費、照顧分工、伴侶借貸、家暴/高衝突關係。",
    decisionMeaning: "關係義務常會改變支出優先順序；先理解誰在影響決策，再談財務方案。",
    caution: "保護案件、未成年資料與高衝突關係需督導確認。"
  },
  {
    name: "疾病與身心健康史",
    focus: "疾病、就醫、身心狀態、照顧負荷與醫療費用如何影響收入、支出與判斷力。",
    lookFor: "就醫中斷、慢性病、精神健康、成癮、自傷他傷、長照需求、家庭照顧者負荷。",
    decisionMeaning: "付款延遲、資源中斷或回覆困難，可能與症狀、照顧壓力或醫療可近性有關。",
    caution: "醫療與精神健康資料只記錄工作必要範圍，分享前需依機構規範確認。"
  },
  {
    name: "社會資源使用歷程",
    focus: "低收/中低收、急難、兒少教育發展帳戶、租金補貼、法扶、社工與網絡資源的使用與中斷。",
    lookFor: "資格異動、文件卡關、轉介單、資源申請成敗、跨網絡分工、服務中斷原因。",
    decisionMeaning: "反覆求助可能是制度門檻與現金流壓力的訊號，不應只解讀為依賴資源。",
    caution: "避免把未確認的福利身分、補助紀錄或服務紀錄外部揭露。"
  },
  {
    name: "重大財務事件",
    focus: "借貸、卡債、催收、保險、銀行帳戶、地下錢莊、協商與大額支出如何改變行動選項。",
    lookFor: "最低應繳、循環利息、債權人、還款承諾、代辦、親友借貸、重大資金用途。",
    decisionMeaning: "財務事件要連回當時的安全、家庭與制度選項；工具只協助整理，不代替金融或法律建議。",
    caution: "帳號、債權人細節、借據與催收內容需去識別化。"
  }
];

const contextRows = [
  ["卡債/雙卡風暴", "約2005-2006", "理解循環利息、最低應繳、催收恐懼與制度信任。", "https://www.npf.org.tw/2/3558"],
  ["消費者債務清理前置協商", "2008後制度化", "工具只準備資料、問題清單與轉介線索，不代談條件。", "https://www.banking.gov.tw/ch/home.jsp?id=742&parentpath=0%2C674%2C717%2C740&websitelink=artwebsite.jsp"],
  ["社安網/脆弱家庭", "107年起推動", "單一金錢困難常連動貧窮、失業、精神疾病、家庭衝突與社會疏離。", "https://mohw.gov.tw/ss/cp-4531-50117-204.html"],
  ["社會救助與脫貧措施", "現行制度", "記錄資格異動、家庭總收入、工作/職訓收入與自立脫貧誘因。", "https://www.mohw.gov.tw/cp-88-79005-1.html"],
  ["兒童及少年未來教育與發展帳戶", "106年開辦", "遲繳是家庭財務壓力訊號，不直接推論不重視孩子。", "https://dep.mohw.gov.tw/dosaasw/cp-3841-51050-103.html"],
  ["租金補貼與租屋家庭", "111年起擴大", "居住遷移、房租與租約文件會牽動就學、工作、債務與資源申請。", "https://www.moi.gov.tw/News_Content.aspx?n=4&s=260249&sms=9009"],
  ["家庭照顧與長照資源", "現行服務", "疾病與照顧負荷會改變可工作時間、收入穩定度與求助能力。", "https://www.mohw.gov.tw/cp-3210-23630-1.html"],
  ["信扶/家庭脫貧培力", "長期社工財務知能合作", "保留網絡合作、個案研討、財務諮詢與資源連結。", "https://cdj.sfaa.gov.tw/Journal/Content?gno=13248"],
  ["個人資料保護法", "現行法規", "婚姻、家庭、教育、職業、病歷、健康、財務與社會活動等資料均需最小必要。", "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021"],
  ["社會工作師倫理守則", "現行倫理", "自我決定、保密、客觀紀錄、轉介與文化脈絡。", "https://www.mohw.gov.tw/dl-85943-e9f2ffb0-f35e-4965-bf41-e8759f98ed2c.html"],
];

const contextTimelineRows = [
  { id: "P001", rocYear: 94, topic: "卡債/雙卡風暴", period: "約2005-2006", use: "理解循環利息、最低應繳、催收恐懼與制度信任。", source: "https://www.npf.org.tw/2/3558" },
  { id: "P002", rocYear: 97, topic: "消費者債務清理前置協商", period: "2008後制度化", use: "工具只準備資料、問題清單與轉介線索，不代談條件。", source: "https://www.banking.gov.tw/ch/home.jsp?id=742&parentpath=0%2C674%2C717%2C740&websitelink=artwebsite.jsp" },
  { id: "P003", rocYear: 99, topic: "個人資料保護法", period: "現行法規", use: "婚姻、家庭、教育、職業、病歷、健康、財務與社會活動等資料均需最小必要。", source: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021" },
  { id: "P004", rocYear: 106, topic: "兒童及少年未來教育與發展帳戶", period: "106年開辦", use: "遲繳是家庭財務壓力訊號，不直接推論不重視孩子。", source: "https://dep.mohw.gov.tw/dosaasw/cp-3841-51050-103.html" },
  { id: "P005", rocYear: 106, topic: "家庭照顧與長照資源", period: "現行服務", use: "疾病與照顧負荷會改變可工作時間、收入穩定度與求助能力。", source: "https://www.mohw.gov.tw/cp-3210-23630-1.html" },
  { id: "P006", rocYear: 107, topic: "社安網/脆弱家庭", period: "107年起推動", use: "單一金錢困難常連動貧窮、失業、精神疾病、家庭衝突與社會疏離。", source: "https://mohw.gov.tw/ss/cp-4531-50117-204.html" },
  { id: "P007", rocYear: 108, topic: "信扶/家庭脫貧培力", period: "長期社工財務知能合作", use: "保留網絡合作、個案研討、財務諮詢與資源連結。", source: "https://cdj.sfaa.gov.tw/Journal/Content?gno=13248" },
  { id: "P008", rocYear: 111, topic: "租金補貼與租屋家庭", period: "111年起擴大", use: "居住遷移、房租與租約文件會牽動就學、工作、債務與資源申請。", source: "https://www.moi.gov.tw/News_Content.aspx?n=4&s=260249&sms=9009" },
  { id: "P009", rocYear: 114, topic: "社會救助與脫貧措施", period: "現行制度", use: "記錄資格異動、家庭總收入、工作/職訓收入與自立脫貧誘因。", source: "https://www.mohw.gov.tw/cp-88-79005-1.html" },
  { id: "P010", rocYear: 114, topic: "社會工作師倫理守則", period: "現行倫理", use: "自我決定、保密、客觀紀錄、轉介與文化脈絡。", source: "https://www.mohw.gov.tw/dl-85943-e9f2ffb0-f35e-4965-bf41-e8759f98ed2c.html" }
];

const researchRows = [
  ["使用者提供之財務諮詢師培訓素材", "重大財務事件會反覆牽動居住、照顧、工作與資源資格。", "事件表新增六大歷程面向，不只記錄金錢流水帳。"],
  ["使用者提供之脫貧培力/經濟輔導課程素材", "社工、主管與財務諮詢師需要共同語言，並把家庭財務盤點放進網絡合作。", "Excel 匯出增加歷程解讀與研究依據摘要。"],
  ["社安網與脆弱家庭官方資料", "家庭脆弱性需看多重因子，不能只從單一求助議題判斷。", "歷程卡提示使用者同步看居住、工作、家庭、疾病與資源。"],
  ["個資法與倫理界線", "歷程資料含婚姻、家庭、教育、職業、醫療、健康、財務與社會活動。", "分享前檢查保留高敏感、最小必要與外部摘要檢核。"]
];

const workbookSheetNames = ["事件時間軸", "決策／處遇卡", "同住人口", "修改編輯", "六大歷程解讀", "台灣制度背景", "研究依據摘要", "分享前檢查", "非責備語言"];

const languageRows = [
  ["亂花錢", "支出可能承載急迫需求、關係義務或情緒調節，需確認用途與情境。"],
  ["逃避債務", "暫時避開高壓訊息，以保留行動空間；需確認催收、安全與資訊障礙。"],
  ["不配合", "尚未取得回覆，仍需確認障礙或工作關係安全感。"],
  ["說法矛盾", "不同來源記載不一致。"],
  ["依賴補助", "在資源不足時使用可得支持。"],
  ["不會規劃", "長期規劃被短期風險擠壓。"],
  ["衝動", "在時間壓力與資訊不足下快速決策。"],
  ["不重視孩子", "照顧或教育承諾可能被現金流或制度門檻中斷。"],
  ["工作不穩定", "工作型態可能受照顧、健康、交通、資格與非典型勞動市場影響。"],
  ["資源用太多", "資源使用歷程是制度可近性與安全網狀態的線索。"],
];

const safetyItems = [
  ["身分識別", "姓名、身分證、地址、電話、照片、精確生日、學校或工作地點。"],
  ["家庭敏感資訊", "家暴、兒少/老人/身障保護、扶養糾紛、犯罪前科或高衝突關係。"],
  ["健康/醫療", "診斷、病歷、就醫、精神健康、成癮、自傷他傷資訊。"],
  ["財務資料", "帳號、債權人、借款契約、催收訊息、薪資、資產、存款。"],
  ["兒少資料", "未成年人的姓名、學校、出生年月日、保護或福利身份。"],
  ["來源信心", "低信心或待確認內容是否被寫成事實。"],
  ["推論語氣", "是否出現亂花錢、不配合、逃避、失能等責備語。"],
  ["金融越界", "是否含投資、保險、貸款、債務整合推薦或最佳還款策略承諾。"],
  ["法律越界", "是否含法律勝算、法院程序結論或正式法律建議。"],
  ["同意/法定依據", "分享對象、目的、期間、方式是否已告知並取得合適依據。"],
  ["外部版摘要", "外部版是否去識別化並只留下必要摘要。"],
  ["督導確認", "紅線事件是否需要督導、主管或合格專業確認。"],
];

const legacyClarificationMap = new Map([
  ["確認搬遷資料與是否可外部分享。", "搬遷當時的居住安全、租金壓力、同住安排與資料分享界線。"],
  ["補收入區間、工作型態與就服/職訓資源。", "收入區間、工作型態、照顧責任，以及是否曾接觸就服或職訓資源。"],
  ["確認照顧分工與孩子相關固定支出。", "照顧分工、固定支出、扶養責任，以及誰實際影響支出安排。"],
  ["標示醫療資料界線；必要時轉介醫療/心理/長照資源。", "就醫、照顧負荷、醫療費用與工作時間受到哪些影響；必要時確認可連結的專業資源。"],
  ["與社工確認資格、文件與可調整方式。", "資格異動、文件卡關、窗口回覆與是否有其他可調整的資源路徑。"],
  ["補債務清冊；必要時轉官方協商或法扶。", "債務清冊、催收壓力、還款承諾與是否需要轉接官方協商或法扶。"],
  ["社工確認人事時地物與歷程面向後歸檔。", "人、事、時、地、物，以及這筆資料應歸入哪一個主要歷程。"],
  ["社工已確認草稿後加入；下次會談補證據。", "原始依據、案主說法、同住人口關聯與下次會談需要補的證據。"],
  ["補來源與當事人確認", "原始來源、當事人說法，以及哪些內容仍不能寫成事實。"],
  ["納入下一次討論", "事件細節、當時可行選項與需要補充的證據。"]
]);

const clarificationDefaults = {
  "居住遷移史": "搬遷原因、同住安排、居住安全、租金壓力與當時可用資源。",
  "就業與就學史": "工作/就學變化、收入穩定度、照顧責任、交通與制度資格的影響。",
  "感情與家庭史": "交往、婚姻、分居、照顧分工、扶養責任與關係支持或壓力。",
  "疾病與身心健康史": "身心狀態、就醫安排、照顧負荷、醫療費用與工作時間的變化。",
  "社會資源使用歷程": "資格、文件、窗口、等待時間與資源使用中斷的原因。",
  "重大財務事件": "金額、債權人/窗口、還款承諾、催收壓力、親友支援與安全狀態。"
};

const clarificationJudgmentReasons = {
  "居住遷移史": "搬遷是安全、租金、照顧、工作/就學或資源取得下的取捨。",
  "就業與就學史": "工作或就學變動是否受到照顧、健康、交通、收入穩定度或福利資格影響。",
  "感情與家庭史": "關係責任、照顧分工與固定支出如何影響案主當時的選擇。",
  "疾病與身心健康史": "身心狀態、就醫與照顧負荷是否影響收入、回覆與支出優先順序。",
  "社會資源使用歷程": "資源使用或中斷，是否與資格門檻、文件、等待時間或窗口分工有關。",
  "重大財務事件": "財務事件與當時安全、家庭義務、制度選項的關聯；工具不替代金融或法律建議。"
};

const sampleStakeholders = [
  {
    id: "A001",
    label: "案主本人",
    relation: "本人",
    stance: "本人",
    sensitivity: "內部",
    notes: "所有事件預設與案主本人有關；公開版只使用稱謂，不填真名。"
  },
  {
    id: "A002",
    label: "子女",
    relation: "子女",
    stance: "同住中",
    sensitivity: "高度敏感",
    notes: "涉及未成年資料時需最小必要，外部分享前應去識別化。"
  },
  {
    id: "A003",
    label: "主要照顧者",
    relation: "主要照顧者",
    stance: "同住中",
    sensitivity: "內部",
    notes: "可能影響照顧安排、居住選擇與就業可行性。"
  },
  {
    id: "A004",
    label: "同住親屬",
    relation: "父母/親屬",
    stance: "曾同住",
    sensitivity: "內部",
    notes: "曾經提供住處、照顧或生活費協助，需確認同住期間與支持方式。"
  },
  {
    id: "A005",
    label: "配偶/伴侶",
    relation: "配偶/伴侶",
    stance: "待確認",
    sensitivity: "內部",
    notes: "需確認是否同住、照顧分工、收入支援與固定支出分擔。"
  }
];

const sampleEvents = [
  {
    id: "E001",
    rocYear: 85,
    age: 16,
    lane: "居住遷移史",
    title: "照顧安排改變後搬遷",
    fact: "家庭照顧安排改變，案主搬到親屬或安置地；就學與支持網絡重新整理。",
    voice: "那時候先有地方住比較重要。",
    source: "當事人口述 / 社工摘要",
    actorIds: ["A001", "A003"],
    sensitivity: "內部",
    confidence: "低",
    impact: "安全感、就學穩定與後續對制度的信任。",
    unknowns: "搬遷原因、是否涉及保護/安置、當時主要支持者。",
    nextStep: "搬遷當時的居住安全、租金壓力、同住安排與資料分享界線。"
  },
  {
    id: "E002",
    rocYear: 97,
    endRocYear: 103,
    ongoing: false,
    age: 28,
    lane: "就業與就學史",
    title: "工作型態轉為不定時",
    fact: "收入來源改為臨時或不定時工作，薪資、工時與勞保狀態需再確認。",
    voice: "哪邊有工作就去哪邊做。",
    source: "當事人口述",
    actorIds: ["A001"],
    sensitivity: "內部",
    confidence: "中",
    impact: "現金流不穩，可能影響固定支出、租金與還款承諾。",
    unknowns: "工作中斷是否與健康、照顧、交通或資格門檻有關。",
    nextStep: "收入區間、工作型態、照顧責任，以及是否曾接觸就服或職訓資源。"
  },
  {
    id: "E003",
    rocYear: 101,
    endRocYear: "",
    ongoing: true,
    age: 32,
    lane: "感情與家庭史",
    title: "孩子出生與照顧分工改變",
    fact: "家庭照顧與固定支出增加，伴侶、親屬或主要照顧者的支持程度影響金錢決策。",
    voice: "希望孩子未來有一筆可以用的錢。",
    source: "當事人口述 / 轉介單摘要",
    actorIds: ["A001", "A002", "A003"],
    sensitivity: "內部",
    confidence: "中",
    impact: "照顧時間、就業安排與儲蓄承諾互相拉扯。",
    unknowns: "扶養費、照顧分工、親屬支持與前段關係責任。",
    nextStep: "照顧分工、固定支出、扶養責任，以及誰實際影響支出安排。"
  },
  {
    id: "E004",
    rocYear: 105,
    endRocYear: 106,
    ongoing: false,
    age: 36,
    lane: "疾病與身心健康史",
    title: "就醫與照顧負荷增加",
    fact: "家庭成員就醫或身心狀態影響工作時間、交通與支出安排，需只記錄工作必要資訊。",
    voice: "那時候很多事情先顧身體和家裡。",
    source: "當事人口述 / 醫療相關摘要",
    actorIds: ["A001", "A003"],
    sensitivity: "高度敏感",
    confidence: "低",
    impact: "可能造成收入減少、回覆延遲、付款中斷或資源申請困難。",
    unknowns: "是否有正式診斷、長照需求、照顧者支持或醫療費用文件。",
    nextStep: "就醫、照顧負荷、醫療費用與工作時間受到哪些影響；必要時確認可連結的專業資源。"
  },
  {
    id: "E005",
    rocYear: 109,
    endRocYear: 110,
    ongoing: false,
    age: 40,
    lane: "社會資源使用歷程",
    title: "福利身分或兒少帳戶繳存異動",
    fact: "低收/中低收資格、兒少教育發展帳戶或補助資格需重新確認。",
    voice: "不是不想存，是那陣子先處理眼前的錢。",
    source: "轉介單 / 公文摘要",
    actorIds: ["A001", "A002", "A004"],
    sensitivity: "內部",
    confidence: "中",
    impact: "短期現金流可能使長期資產形成承諾中斷。",
    unknowns: "資格異動原因、繳存中斷期間、是否曾詢問承辦窗口。",
    nextStep: "資格異動、文件卡關、窗口回覆與是否有其他可調整的資源路徑。"
  },
  {
    id: "E006",
    rocYear: 110,
    endRocYear: "",
    ongoing: true,
    age: 41,
    lane: "重大財務事件",
    title: "信用卡或借貸付款中斷",
    fact: "付款中斷或只繳最低應繳，需確認循環利息、催收、借貸來源與安全狀態。",
    voice: "先撐過當月房租與孩子費用。",
    source: "當事人口述 / 帳單摘要",
    actorIds: ["A001", "A002", "A005"],
    sensitivity: "高度敏感",
    confidence: "低",
    impact: "可能牽動居住、家庭照顧、正式協商與對銀行/制度信任。",
    unknowns: "債權人、總額、利率、是否有代辦或地下借貸。",
    nextStep: "債務清冊、催收壓力、還款承諾與是否需要轉接官方協商或法扶。"
  }
];

const sampleDecisions = [
  {
    id: "D001",
    eventId: "E006",
    question: "付款中斷後如何處理？",
    options: "繳最低、協商、求助、延後付款、暫停其他支出。",
    actorIds: ["A001", "A002", "A005"],
    fear: "居住、照顧或工作安排中斷。",
    interpretation: "在短期安全與長期債務成本間取捨，需確認當時資訊與可行選項。"
  },
  {
    id: "D002",
    eventId: "E003",
    question: "是否維持兒少教育發展帳戶繳存？",
    options: "續繳、降額、暫停、詢問社工。",
    actorIds: ["A001", "A002", "A004"],
    fear: "孩子未來資產累積中斷，但當月生活費已不足。",
    interpretation: "家庭可能認同長期儲蓄，但短期現金流使承諾中斷。"
  },
  {
    id: "D003",
    eventId: "E002",
    question: "是否接受不定時工作以先補現金流？",
    options: "接短工、找正式職缺、先處理照顧/就醫、連結就服或職訓。",
    actorIds: ["A001", "A003"],
    fear: "正式工作可能讓福利資格、照顧安排或身心狀態更不穩。",
    interpretation: "工作選擇不是單純意願問題，需同步看資格門檻、照顧責任與健康可負荷程度。"
  }
];

const sampleEventKeys = new Set(sampleEvents.map((event) => `${Number(event.rocYear)}|${event.title}`));
const sampleStakeholderLabels = new Set([
  ...sampleStakeholders.filter((item) => item.id !== "A001").map((item) => item.label),
  "社工/承辦窗口",
  "債權人/金融機構"
]);
const sampleDecisionQuestions = new Set(sampleDecisions.map((decision) => decision.question));

let state = loadState();
let savedRecords = loadSavedRecords();

function exampleStakeholders() {
  return structuredClone(sampleStakeholders).map((item) => item.id === "A001" ? item : { ...item, packageId: EXAMPLE_PACKAGE_ID });
}

function exampleEvents() {
  return structuredClone(sampleEvents).map((item) => ({
    ...item,
    packageId: EXAMPLE_PACKAGE_ID,
    source: exampleSource(item.source)
  }));
}

function exampleDecisions() {
  return structuredClone(sampleDecisions).map((item) => ({ ...item, packageId: EXAMPLE_PACKAGE_ID }));
}

function isLegacyExampleEvent(item) {
  return sampleEventKeys.has(`${Number(item?.rocYear)}|${item?.title || ""}`);
}

function isLegacyExampleStakeholder(item) {
  return item?.id !== "A001" && sampleStakeholderLabels.has(item?.label || item?.name || "");
}

function isLegacyExampleDecision(item) {
  return sampleDecisionQuestions.has(item?.question || "");
}

function exampleSource(source) {
  const value = String(source || "測試資料");
  return value.startsWith("範例測試包") ? value : `範例測試包 / ${value}`;
}

function defaultState() {
  return {
    version: CURRENT_STATE_VERSION,
    stakeholders: exampleStakeholders(),
    events: exampleEvents(),
    decisions: exampleDecisions(),
    drafts: [],
    checks: safetyItems.map(([name]) => ({ name, status: "通過" })),
    yearMode: "roc",
    timelinePrimaryActorId: "A001",
    timelineCompareActorIds: [],
    timelineMatchMode: "layered",
    timelineLaneFilter: "all",
    showContextTimeline: true,
    selectedEventId: "",
    inlineEditingEventId: "",
    activeRecordId: "",
    activeRecordTitle: ""
  };
}

function storedStateCandidates() {
  const candidates = [];
  const currentValue = localStorage.getItem(CURRENT_STATE_KEY);
  if (currentValue) {
    candidates.push({ key: CURRENT_STATE_KEY, value: currentValue });
  }
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key.startsWith(LEGACY_STATE_KEY_PREFIX)) {
      candidates.push({ key, value: localStorage.getItem(key) });
    }
  }
  return candidates;
}

function loadState() {
  for (const candidate of storedStateCandidates()) {
    try {
      const saved = JSON.parse(candidate.value || "null");
      if (!saved || !Array.isArray(saved.events) || !Array.isArray(saved.decisions)) {
        continue;
      }
      const base = defaultState();
      const stakeholders = normalizeStakeholders(saved.stakeholders || base.stakeholders);
      const validActorIds = new Set(stakeholders.map((item) => item.id));
      const primaryActorId = saved.timelinePrimaryActorId === ALL_ACTORS_ID
        ? ALL_ACTORS_ID
        : validActorIds.has(saved.timelinePrimaryActorId) ? saved.timelinePrimaryActorId : "A001";
      const compareActorIds = primaryActorId === ALL_ACTORS_ID ? [] : normalizeCompareActorIds(saved.timelineCompareActorIds, primaryActorId, stakeholders);
      const savedLaneFilter = typeof saved.timelineLaneFilter === "string" ? saved.timelineLaneFilter : "all";
      const normalizedLaneFilter = normalizeLane(savedLaneFilter);
      const laneFilter = savedLaneFilter === "all" || lanes.includes(normalizedLaneFilter) ? (savedLaneFilter === "all" ? "all" : normalizedLaneFilter) : "all";
      const normalizedState = {
        ...base,
        ...saved,
        version: CURRENT_STATE_VERSION,
        stakeholders,
        events: saved.events.map((event) => normalizeEventRecord(event, stakeholders)),
        decisions: saved.decisions.map((decision) => ({
          ...decision,
          actorIds: normalizeActorIds(decision.actorIds, stakeholders),
          packageId: decision.packageId || (isLegacyExampleDecision(decision) ? EXAMPLE_PACKAGE_ID : "")
        })),
        drafts: Array.isArray(saved.drafts) ? saved.drafts.map((draft) => normalizeDraftRecord(draft, stakeholders)).filter(Boolean) : [],
        checks: Array.isArray(saved.checks) ? saved.checks : base.checks,
        yearMode: saved.yearMode === "ad" ? "ad" : "roc",
        timelinePrimaryActorId: primaryActorId,
        timelineCompareActorIds: compareActorIds,
        timelineMatchMode: normalizeTimelineMatchMode(saved.timelineMatchMode),
        timelineLaneFilter: laneFilter,
        showContextTimeline: saved.showContextTimeline !== false,
        selectedEventId: typeof saved.selectedEventId === "string" ? saved.selectedEventId : "",
        inlineEditingEventId: typeof saved.inlineEditingEventId === "string" ? saved.inlineEditingEventId : "",
        activeRecordId: typeof saved.activeRecordId === "string" ? saved.activeRecordId : "",
        activeRecordTitle: typeof saved.activeRecordTitle === "string" ? saved.activeRecordTitle : ""
      };
      if (candidate.key !== CURRENT_STATE_KEY) {
        localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(normalizedState));
      }
      return normalizedState;
    } catch (_) {
      if (candidate.key === CURRENT_STATE_KEY) {
        localStorage.removeItem(CURRENT_STATE_KEY);
      }
    }
  }
  return defaultState();
}

function saveState() {
  localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify(state));
}

function loadSavedRecords() {
  try {
    const records = JSON.parse(localStorage.getItem(SAVED_RECORDS_KEY) || "[]");
    if (!Array.isArray(records)) return [];
    return records.map(normalizeSavedRecord).filter(Boolean).slice(0, MAX_SAVED_RECORDS);
  } catch (_) {
    localStorage.removeItem(SAVED_RECORDS_KEY);
    return [];
  }
}

function saveSavedRecords() {
  localStorage.setItem(SAVED_RECORDS_KEY, JSON.stringify(savedRecords.slice(0, MAX_SAVED_RECORDS)));
}

function normalizeSavedRecord(record) {
  if (!record || !record.state || !Array.isArray(record.state.events) || !Array.isArray(record.state.stakeholders)) return null;
  const now = new Date().toISOString();
  const id = String(record.id || `record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
  const title = String(record.title || record.state.activeRecordTitle || "未命名整理").trim() || "未命名整理";
  const updatedAt = record.updatedAt || record.createdAt || now;
  const createdAt = record.createdAt || updatedAt;
  const summary = record.summary || savedRecordSummary(record.state);
  return { id, title, createdAt, updatedAt, summary, state: record.state };
}

function savedRecordSummary(snapshot = state) {
  const events = Array.isArray(snapshot.events) ? snapshot.events : [];
  const drafts = Array.isArray(snapshot.drafts) ? snapshot.drafts : [];
  const stakeholders = Array.isArray(snapshot.stakeholders) ? snapshot.stakeholders : [];
  const years = events.map((event) => Number(event.rocYear)).filter(Boolean).sort((a, b) => a - b);
  const yearText = years.length ? `民國 ${years[0]}-${years[years.length - 1]} 年` : "尚未確認年份";
  const actorText = stakeholders.filter((item) => item.id !== "A001").slice(0, 2).map((item) => item.label).join("、") || "以案主本人為主";
  return `${yearText}｜${events.length} 筆事件｜${drafts.length} 筆修改編輯｜${actorText}`;
}

function suggestedRecordTitle() {
  if (state.activeRecordTitle) return state.activeRecordTitle;
  const primary = state.stakeholders.find((item) => item.id === state.timelinePrimaryActorId)?.label || "案主";
  const years = state.events.map((event) => Number(event.rocYear)).filter(Boolean).sort((a, b) => a - b);
  const yearText = years.length ? `民國${years[0]}-${years[years.length - 1]}年` : `民國${currentRocYear()}年`;
  return `${primary}生命脈絡整理 ${yearText}`;
}

function formatLocalDateTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function savedRecordSearchText(record) {
  const snapshot = record.state || {};
  const pieces = [
    record.title,
    record.summary,
    ...(snapshot.events || []).map((event) => `${event.title || ""} ${event.fact || ""}`),
    ...(snapshot.stakeholders || []).map((item) => `${item.label || ""} ${item.relation || ""}`)
  ];
  return pieces.join(" ").toLowerCase();
}

function currentRecordSnapshot(recordId, title) {
  return JSON.parse(JSON.stringify({
    ...state,
    version: CURRENT_STATE_VERSION,
    activeRecordId: recordId,
    activeRecordTitle: title,
    selectedEventId: "",
    inlineEditingEventId: ""
  }));
}

function saveCurrentRecord() {
  const titleInput = $("#recordTitle");
  const title = String(titleInput?.value || state.activeRecordTitle || suggestedRecordTitle()).trim() || suggestedRecordTitle();
  const recordId = state.activeRecordId || `record-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const previous = savedRecords.find((record) => record.id === recordId);
  state.activeRecordId = recordId;
  state.activeRecordTitle = title;
  const snapshot = currentRecordSnapshot(recordId, title);
  const record = {
    id: recordId,
    title,
    createdAt: previous?.createdAt || now,
    updatedAt: now,
    summary: savedRecordSummary(snapshot),
    state: snapshot
  };
  savedRecords = [record, ...savedRecords.filter((item) => item.id !== recordId)].slice(0, MAX_SAVED_RECORDS);
  saveSavedRecords();
  saveState();
  setRecordStatus(`已儲存「${title}」。`);
  renderSavedRecords();
}

function loadSavedRecord(recordId) {
  const record = savedRecords.find((item) => item.id === recordId);
  if (!record) return;
  localStorage.setItem(CURRENT_STATE_KEY, JSON.stringify({
    ...record.state,
    activeRecordId: record.id,
    activeRecordTitle: record.title
  }));
  state = loadState();
  setRecordStatus(`已載入「${record.title}」。`);
  openWorkbench("timeline");
  render();
  requestAnimationFrame(() => {
    document.querySelector("#workbenchPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function deleteSavedRecord(recordId) {
  const record = savedRecords.find((item) => item.id === recordId);
  if (!record) return;
  if (!window.confirm(`確定要移除「${record.title}」這筆過往紀錄嗎？目前工作區不會被清空。`)) return;
  savedRecords = savedRecords.filter((item) => item.id !== recordId);
  if (state.activeRecordId === recordId) {
    state.activeRecordId = "";
    state.activeRecordTitle = "";
    saveState();
  }
  saveSavedRecords();
  setRecordStatus(`已移除「${record.title}」的過往紀錄。`);
  renderSavedRecords();
}

function setRecordStatus(message) {
  const target = $("#recordSearchStatus");
  if (target) target.textContent = message;
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function normalizeLane(lane) {
  const value = laneAliases[lane] || lane;
  return lanes.includes(value) ? value : "重大財務事件";
}

function currentRocYear() {
  return new Date().getFullYear() - 1911;
}

function numberOrEmpty(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : "";
}

function normalizeEventRecord(event, stakeholders = state?.stakeholders || sampleStakeholders) {
  const start = Number(event.rocYear) || "";
  const end = numberOrEmpty(event.endRocYear);
  const packageId = event.packageId || (isLegacyExampleEvent(event) ? EXAMPLE_PACKAGE_ID : "");
  const lane = normalizeLane(event.lane);
  return {
    ...event,
    rocYear: start,
    endRocYear: end && start && end >= start ? end : "",
    ongoing: Boolean(event.ongoing),
    lane,
    relatedLanes: normalizeRelatedLanes(event.relatedLanes, lane),
    extraTags: event.extraTags || "",
    place: event.place || "",
    objects: event.objects || "",
    actorText: event.actorText || actorNamesFromIds(event.actorIds || [], stakeholders),
    sourceText: event.sourceText || "",
    actorIds: normalizeActorIds(event.actorIds, stakeholders),
    source: packageId === EXAMPLE_PACKAGE_ID ? exampleSource(event.source) : event.source,
    nextStep: normalizeClarificationText(event.nextStep, lane),
    packageId
  };
}

function normalizeDraftRecord(draft, stakeholders = state?.stakeholders || sampleStakeholders) {
  if (!draft) return null;
  if (draft.type === "decision") return normalizeDecisionDraft(draft);
  const text = [draft.sourceText, draft.title, draft.fact, draft.voice].filter(Boolean).join(" ");
  const lane = normalizeLane(draft.lane || detectLane(text));
  const period = extractPeriod(text);
  return {
    type: "event",
    rocYear: draft.rocYear || period.rocYear || "",
    endRocYear: draft.endRocYear || period.endRocYear || "",
    ongoing: Boolean(draft.ongoing || period.ongoing),
    age: draft.age || "",
    lane,
    relatedLanes: normalizeRelatedLanes(draft.relatedLanes, lane),
    extraTags: draft.extraTags || "",
    title: draft.title || titleFromSentence(text, lane),
    fact: draft.fact || draft.what || text || "",
    voice: draft.voice || "",
    impact: draft.impact || guideForLane(lane).decisionMeaning,
    unknowns: draft.unknowns || guideForLane(lane).lookFor,
    sensitivity: draft.sensitivity || defaultSensitivity(lane),
    confidence: draft.confidence || (draft.rocYear || period.rocYear ? "中" : "低"),
    source: draft.source || "AI 匯入草稿",
    nextStep: normalizeClarificationText(draft.nextStep, lane),
    actorText: draft.actorText || detectActorText(text),
    actorIds: normalizeActorIds(draft.actorIds || matchActorIds(draft.actorText || text, stakeholders), stakeholders),
    place: draft.place || extractPlace(text),
    objects: draft.objects || extractObjects(text),
    sourceText: draft.sourceText || text,
    reviewNote: draft.reviewNote || ""
  };
}

function normalizeClarificationText(text, lane = "") {
  const normalizedLane = normalizeLane(lane);
  const raw = String(text || "").trim();
  if (!raw) return clarificationDefaults[normalizedLane] || clarificationDefaults["重大財務事件"];
  if (legacyClarificationMap.has(raw)) return stripClarificationPrefix(legacyClarificationMap.get(raw));
  const stripped = stripClarificationPrefix(raw);
  if (/^(確認|補|標示|與社工確認|納入)/.test(stripped)) {
    return legacyClarificationMap.get(stripped) || stripped
      .replace(/^確認/, "")
      .replace(/^補/, "")
      .replace(/^標示/, "")
      .replace(/^與社工確認/, "")
      .replace(/^納入下一次討論/, "事件細節、當時可行選項與需要補充的證據")
      .trim();
  }
  return stripped;
}

function stripClarificationPrefix(text) {
  return String(text || "")
    .trim()
    .replace(/^(可多了解|可補充了解|可再了解)(：|:|，|,)?\s*/, "")
    .replace(/^(協助判斷)(：|:|，|,)?\s*/, "")
    .trim();
}

function clarificationText(event) {
  return normalizeClarificationText(event?.nextStep, event?.lane);
}

function clarificationJudgmentText(event) {
  const lane = normalizeLane(event?.lane);
  return clarificationJudgmentReasons[lane] || "事件當時有哪些壓力、資源與可行選項，避免只用結果回推案主選擇。";
}

function clarificationPanel(event, mode = "full") {
  const isCompact = mode === "compact";
  return `
    <section class="clarification-panel ${isCompact ? "compact" : ""}" aria-label="建議多確認">
      <div class="clarification-head">
        <strong>建議多確認</strong>
        ${isCompact ? "" : "<span>用來理解事件細節，不是評分或結論。</span>"}
      </div>
      <div class="clarification-body">${esc(clarificationText(event))}</div>
      ${isCompact ? "" : `<dl>
        ${isCompact ? "" : `<dt>協助判斷</dt><dd>${esc(clarificationJudgmentText(event))}</dd>`}
      </dl>`}
    </section>`;
}

function normalizeRelatedLanes(values, primaryLane = "") {
  const list = Array.isArray(values) ? values : String(values || "").split(/[、,，]/);
  return [...new Set(list
    .map((lane) => String(lane || "").trim())
    .filter(Boolean)
    .map((lane) => normalizeLane(lane))
    .filter((lane) => lanes.includes(lane) && lane !== primaryLane))];
}

function eventStartYear(event) {
  return numberOrEmpty(event.rocYear);
}

function eventEndYear(event) {
  const start = eventStartYear(event);
  if (!start) return "";
  if (event.ongoing) return Math.max(start, currentRocYear());
  const end = numberOrEmpty(event.endRocYear);
  return end && end >= start ? end : start;
}

function eventIsActiveInYear(event, year) {
  const start = eventStartYear(event);
  if (!start) return false;
  const end = eventEndYear(event);
  return year >= start && year <= end;
}

function eventPeriodText(event) {
  const start = eventStartYear(event);
  if (!start) return event.ongoing ? "待補開始年（仍在持續）" : "待補時間";
  const end = eventEndYear(event);
  if (event.ongoing && end > start) return `民國 ${start} 年至今`;
  if (end > start) return `民國 ${start}-${end} 年`;
  return `民國 ${start} 年`;
}

function eventHasTimelineYear(event) {
  return Boolean(eventStartYear(event));
}

function rocToAd(year) {
  const rocYear = numberOrEmpty(year);
  return rocYear ? rocYear + 1911 : "";
}

function normalizeStakeholders(items) {
  const list = Array.isArray(items) ? items : [];
  const normalized = list.map((item, index) => ({
    id: item.id || `A${String(index + 1).padStart(3, "0")}`,
    label: item.label || item.name || "未命名同住人口",
    relation: item.relation || "其他同住者",
    stance: item.stance || "待釐清",
    sensitivity: item.sensitivity || "內部",
    notes: item.notes || "",
    packageId: item.packageId || (isLegacyExampleStakeholder(item) ? EXAMPLE_PACKAGE_ID : "")
  }));
  if (!normalized.some((item) => item.id === "A001")) {
    normalized.unshift(structuredClone(sampleStakeholders[0]));
  }
  return normalized;
}

function normalizeActorIds(actorIds, stakeholders = state?.stakeholders || sampleStakeholders) {
  const validIds = new Set(stakeholders.map((item) => item.id));
  const ids = Array.isArray(actorIds) ? actorIds : [];
  const filtered = ids.filter((id) => validIds.has(id));
  return filtered.length ? [...new Set(filtered)] : ["A001"];
}

function actorNamesFromIds(actorIds, stakeholders = state?.stakeholders || sampleStakeholders) {
  const lookup = new Map(stakeholders.map((item) => [item.id, item.label]));
  return normalizeActorIds(actorIds, stakeholders).map((id) => lookup.get(id) || id).join("、");
}

function normalizeCompareActorIds(actorIds, primaryActorId, stakeholders = state?.stakeholders || sampleStakeholders) {
  const validIds = new Set(stakeholders.map((item) => item.id));
  const ids = Array.isArray(actorIds) ? actorIds : [];
  return [...new Set(ids.filter((id) => validIds.has(id) && id !== primaryActorId))];
}

function normalizeTimelineMatchMode(value) {
  return value === "intersection" ? "intersection" : "layered";
}

function stakeholderNames(actorIds) {
  return actorNamesFromIds(actorIds, state.stakeholders);
}

function stakeholderLabel(actorId) {
  return state.stakeholders.find((item) => item.id === actorId)?.label || actorId;
}

function render() {
  saveState();
  renderSummary();
  renderSavedRecords();
  renderStakeholderList();
  renderStakeholderOptions();
  renderTimelineFilters();
  renderTimeline();
  renderTimelineEventList();
  renderEventsTable();
  renderDraftList();
  renderHistoryGuide();
  renderContextIndex();
  renderDecisionCards();
  renderSafetyList();
  renderQuickStartState();
  updateExportProbe();
  saveState();
}

function renderSummary() {
  $("#metricEvents").textContent = state.events.length;
  $("#metricDecisions").textContent = state.decisions.length;
  $("#metricCovered").textContent = `${new Set(state.events.map((e) => normalizeLane(e.lane)).filter((lane) => lanes.includes(lane))).size}/${lanes.length}`;
  $("#metricMoney").textContent = state.events.filter((e) => normalizeLane(e.lane) === "重大財務事件").length;
  $("#metricStakeholders").textContent = state.stakeholders.filter((item) => item.id !== "A001").length;
  $("#metricPending").textContent = state.events.filter((e) => e.confidence === "低").length;
}

function renderSavedRecords() {
  const list = $("#savedRecordList");
  const titleInput = $("#recordTitle");
  if (titleInput && document.activeElement !== titleInput) titleInput.value = state.activeRecordTitle || suggestedRecordTitle();
  if (!list) return;
  const query = String($("#recordSearch")?.value || "").trim().toLowerCase();
  const records = query ? savedRecords.filter((record) => savedRecordSearchText(record).includes(query)) : savedRecords;
  if (!savedRecords.length) {
    list.innerHTML = `
      <div class="empty-record">
        <strong>還沒有過往紀錄</strong>
        <span>這裡只搜尋已存在的紀錄；若這台瀏覽器尚未保存過紀錄，清單會維持空白。</span>
      </div>`;
    return;
  }
  if (!records.length) {
    list.innerHTML = `
      <div class="empty-record">
        <strong>沒有符合的紀錄</strong>
        <span>可以改用人物角色、事件標題或整理名稱搜尋。</span>
      </div>`;
    return;
  }
  list.innerHTML = records.map((record) => {
    const isActive = record.id === state.activeRecordId;
    return `
      <article class="record-card ${isActive ? "active" : ""}" data-record-card="${esc(record.id)}" tabindex="0" role="button" aria-label="打開${esc(record.title)}">
        <div>
          <h3>${esc(record.title)}</h3>
          <p>${esc(record.summary || savedRecordSummary(record.state))}</p>
          <span>${esc(formatLocalDateTime(record.updatedAt))}${isActive ? "｜目前工作區" : ""}</span>
        </div>
        <div class="record-card-actions">
          <button class="primary" type="button" data-load-record="${esc(record.id)}">打開此案</button>
          <button class="ghost danger-action" type="button" data-delete-record="${esc(record.id)}">移除</button>
        </div>
      </article>`;
  }).join("");
}

function renderStakeholderList() {
  const target = $("#stakeholderList");
  if (!target) return;
  target.innerHTML = state.stakeholders.map((item) => `
    <article class="stakeholder-card">
      <div>
        <h3>${esc(item.label)}</h3>
        <p>${esc(item.relation)} / ${esc(item.stance)}</p>
      </div>
      <p class="full">${esc(item.notes || "尚未補充同住或照顧脈絡。")}</p>
      ${item.id === "A001" ? "" : `
        <div class="button-row full">
          <button class="neutral-action" type="button" data-edit-stakeholder="${esc(item.id)}">編輯</button>
          <button class="danger-action" type="button" data-delete-stakeholder="${esc(item.id)}">移除</button>
        </div>`}
    </article>
  `).join("");
}

function renderStakeholderOptions() {
  const html = state.stakeholders.map((item) => `
    <label class="choice-item">
      <input type="checkbox" name="actorIds" value="${esc(item.id)}" ${item.id === "A001" ? "checked" : ""} />
      <span>${esc(item.label)}</span>
    </label>
  `).join("");
  const eventOptions = $("#eventStakeholderOptions");
  const decisionOptions = $("#decisionStakeholderOptions");
  if (eventOptions) eventOptions.innerHTML = html;
  if (decisionOptions) decisionOptions.innerHTML = html;
}

function ensureTimelineFilterState() {
  const validIds = new Set(state.stakeholders.map((item) => item.id));
  if (state.timelinePrimaryActorId !== ALL_ACTORS_ID && !validIds.has(state.timelinePrimaryActorId)) state.timelinePrimaryActorId = "A001";
  if (state.timelinePrimaryActorId === ALL_ACTORS_ID) {
    state.timelineCompareActorIds = [];
  } else {
    state.timelineCompareActorIds = normalizeCompareActorIds(state.timelineCompareActorIds, state.timelinePrimaryActorId);
  }
  state.timelineMatchMode = normalizeTimelineMatchMode(state.timelineMatchMode);
  if (state.timelineLaneFilter !== "all") state.timelineLaneFilter = normalizeLane(state.timelineLaneFilter);
  if (!lanes.includes(state.timelineLaneFilter) && state.timelineLaneFilter !== "all") state.timelineLaneFilter = "all";
}

function selectedTimelineActorIds() {
  ensureTimelineFilterState();
  if (state.timelinePrimaryActorId === ALL_ACTORS_ID) return state.stakeholders.map((item) => item.id);
  return [state.timelinePrimaryActorId, ...state.timelineCompareActorIds];
}

function eventMatchesTimelineFilters(event) {
  if (state.timelineLaneFilter !== "all" && normalizeLane(event.lane) !== state.timelineLaneFilter) return false;
  if (state.timelinePrimaryActorId === ALL_ACTORS_ID) return true;
  const relation = timelineRelationInfo(event);
  if (state.timelineMatchMode === "intersection") return relation.kind === "shared";
  return relation.kind !== "unrelated";
}

function filteredTimelineEvents() {
  return state.events
    .filter(eventMatchesTimelineFilters)
    .sort((a, b) => (eventStartYear(a) || 999) - (eventStartYear(b) || 999) || String(a.id).localeCompare(String(b.id)));
}

function draftTimelineId(index) {
  return `draft-${index}`;
}

function draftTimelinePreviewEvents() {
  return state.drafts
    .map((draft, index) => {
      if (!draft || draft.type !== "event") return null;
      const normalized = normalizeDraftRecord(draft);
      if (!eventHasTimelineYear(normalized)) return null;
      return {
        ...normalized,
        id: draftTimelineId(index),
        previewDraftIndex: index,
        isDraftPreview: true,
        source: "AI 初稿",
        confidence: normalized.confidence || "低",
        nextStep: normalizeClarificationText(normalized.nextStep || "確認人事時地物與分類後，再歸檔到正式時間軸。", normalized.lane)
      };
    })
    .filter(Boolean);
}

function visibleTimelineGraphEvents() {
  const confirmed = filteredTimelineEvents();
  const draftPreview = draftTimelinePreviewEvents().filter(eventMatchesTimelineFilters);
  return [...confirmed, ...draftPreview]
    .sort((a, b) => (eventStartYear(a) || 999) - (eventStartYear(b) || 999) || String(a.id).localeCompare(String(b.id), "zh-Hant"));
}

function timelineRelationInfo(event) {
  ensureTimelineFilterState();
  if (state.timelinePrimaryActorId === ALL_ACTORS_ID) {
    return { kind: "case", className: "axis-case", label: "全案事件", compareIds: [] };
  }
  const actorIds = normalizeActorIds(event.actorIds);
  const hasPrimary = actorIds.includes(state.timelinePrimaryActorId);
  const compareIds = state.timelineCompareActorIds.filter((id) => actorIds.includes(id));
  if (hasPrimary && compareIds.length) {
    return { kind: "shared", className: "axis-shared", label: "共同事件", compareIds };
  }
  if (hasPrimary) {
    return { kind: "primary", className: "axis-primary", label: "主軸人物", compareIds: [] };
  }
  if (compareIds.length) {
    return { kind: "compare", className: "axis-compare", label: "加入人物", compareIds };
  }
  return { kind: "unrelated", className: "axis-unrelated", label: "未選人物", compareIds: [] };
}

function timelineRelationBadge(event) {
  const relation = timelineRelationInfo(event);
  if (relation.kind === "unrelated") return "";
  return `<span class="timeline-relation-tag ${relation.className}">${esc(relation.label)}</span>`;
}

function timelineRelationCounts(events = filteredTimelineEvents()) {
  return events.reduce((counts, event) => {
    const relation = timelineRelationInfo(event);
    if (relation.kind in counts) counts[relation.kind] += 1;
    return counts;
  }, { case: 0, primary: 0, compare: 0, shared: 0 });
}

function assignTimelineTracks(events) {
  const trackEnds = [];
  const items = events.map((event) => {
    const start = eventStartYear(event);
    const end = eventEndYear(event) || start;
    let track = trackEnds.findIndex((lastEnd) => start > lastEnd);
    if (track === -1) {
      track = trackEnds.length;
      trackEnds.push(end);
    } else {
      trackEnds[track] = end;
    }
    return { event, track: track + 1 };
  });
  return { items, trackCount: Math.max(trackEnds.length, 1) };
}

function visibleTimelineDecisionItems(chartEvents) {
  const visibleEventIds = new Set(chartEvents.map((event) => event.id));
  return state.decisions
    .map((decision) => {
      const event = state.events.find((item) => item.id === decision.eventId);
      if (!event || !visibleEventIds.has(event.id) || !eventHasTimelineYear(event)) return null;
      return { decision, event, year: eventStartYear(event) };
    })
    .filter(Boolean)
    .sort((a, b) => a.year - b.year || String(a.decision.id).localeCompare(String(b.decision.id), "zh-Hant"));
}

function renderTimelineFilters() {
  ensureTimelineFilterState();
  const primary = $("#timelinePrimaryActor");
  const mode = $("#timelineMatchMode");
  const laneFilter = $("#timelineLaneFilter");
  const showContext = $("#showContextTimeline");
  if (primary) {
    primary.innerHTML = [
      `<option value="${ALL_ACTORS_ID}">全案總覽（所有事件）</option>`,
      ...state.stakeholders.map((item) => `<option value="${esc(item.id)}">${esc(item.label)}</option>`)
    ].join("");
    primary.value = state.timelinePrimaryActorId;
  }
  if (mode) {
    mode.value = state.timelineMatchMode;
    mode.disabled = state.timelinePrimaryActorId === ALL_ACTORS_ID;
  }
  if (laneFilter) {
    laneFilter.innerHTML = [`<option value="all">全部歷程</option>`, ...lanes.map((lane) => `<option value="${esc(lane)}">${esc(lane)}</option>`)].join("");
    laneFilter.value = state.timelineLaneFilter;
  }
  if (showContext) showContext.checked = state.showContextTimeline !== false;

  const compareOptions = $("#timelineCompareActorOptions");
  if (compareOptions) {
    const candidates = state.timelinePrimaryActorId === ALL_ACTORS_ID ? [] : state.stakeholders.filter((item) => item.id !== state.timelinePrimaryActorId);
    compareOptions.innerHTML = candidates.length ? candidates.map((item) => `
      <label class="choice-item">
        <input type="checkbox" data-compare-actor value="${esc(item.id)}" ${state.timelineCompareActorIds.includes(item.id) ? "checked" : ""} />
        <span>${esc(item.label)}</span>
      </label>
    `).join("") : `<div class="field-note">${state.timelinePrimaryActorId === ALL_ACTORS_ID ? "全案總覽已包含所有事件；若要看特定人物關聯，請先改選主軸人物。" : "尚無可加入的同住人口。"}</div>`;
  }
  const compareSummary = $("#compareActorSummary");
  if (compareSummary) compareSummary.textContent = state.timelinePrimaryActorId === ALL_ACTORS_ID
    ? "全案已包含所有人物"
    : state.timelineCompareActorIds.length ? `已加入人物（${state.timelineCompareActorIds.length}）` : "加入關聯人物";
  const summary = $("#timelineFilterSummary");
  if (summary) {
    const isAllCase = state.timelinePrimaryActorId === ALL_ACTORS_ID;
    const primaryText = state.timelinePrimaryActorId === ALL_ACTORS_ID ? "全案總覽" : stakeholderLabel(state.timelinePrimaryActorId);
    const compareText = state.timelinePrimaryActorId === ALL_ACTORS_ID ? "已包含所有人物" : state.timelineCompareActorIds.length ? state.timelineCompareActorIds.map(stakeholderLabel).join("、") : "尚未加入其他人物";
    const relationText = isAllCase ? "所有事件" : state.timelineMatchMode === "intersection" ? "只看共同事件" : "一起呈現";
    const laneText = state.timelineLaneFilter === "all" ? "全部歷程" : state.timelineLaneFilter;
    const contextText = state.showContextTimeline ? "已顯示制度背景參考" : "未顯示制度背景參考";
    const counts = timelineRelationCounts();
    summary.innerHTML = `
      <span>${isAllCase ? `目前顯示 <strong>${esc(primaryText)}</strong>；${esc(compareText)}。` : `以 <strong>${esc(primaryText)}</strong> 為主軸；加入人物：${esc(compareText)}。`}</span>
      <span>呈現方式：${esc(relationText)}；分類：${esc(laneText)}；${esc(contextText)}。</span>
      <span class="timeline-relation-legend">
        ${isAllCase
          ? `<span class="timeline-relation-tag axis-case">全案事件 ${counts.case}</span>`
          : `<span class="timeline-relation-tag axis-primary">主軸人物 ${counts.primary}</span>
            <span class="timeline-relation-tag axis-compare">加入人物 ${counts.compare}</span>
            <span class="timeline-relation-tag axis-shared">共同事件 ${counts.shared}</span>`}
      </span>`;
  }
}

function renderTimeline() {
  const chart = $("#timelineChart");
  const visibleEvents = filteredTimelineEvents();
  const chartEvents = visibleTimelineGraphEvents().filter(eventHasTimelineYear);
  const policyEvents = state.showContextTimeline ? contextTimelineRows : [];
  const years = [
    ...chartEvents.flatMap((e) => [eventStartYear(e), eventEndYear(e)]),
    ...policyEvents.map((e) => Number(e.rocYear))
  ].filter(Boolean);
  const min = Math.min(...years, 75);
  const max = Math.max(...years, currentRocYear());
  const span = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  chart.style.setProperty("--year-count", span.length);
  const label = (year) => `${state.yearMode === "ad" ? year + 1911 : year}年`;
  const laneRows = state.timelineLaneFilter === "all" ? lanes : [state.timelineLaneFilter];
  const decisionItems = visibleTimelineDecisionItems(chartEvents);
  let html = `<div class="timeline-grid"><div class="timeline-cell timeline-head">分類</div>`;
  html += span.map((year) => `<div class="timeline-cell timeline-head">${label(year)}</div>`).join("");
  for (const lane of laneRows) {
    html += `<div class="timeline-cell lane-label">${lane}</div>`;
    const laneEvents = chartEvents
      .filter((event) => normalizeLane(event.lane) === lane)
      .sort((a, b) => eventStartYear(a) - eventStartYear(b) || String(a.id).localeCompare(String(b.id), "zh-Hant"));
    const { items, trackCount } = assignTimelineTracks(laneEvents);
    html += `<div class="timeline-lane-body" style="--track-count: ${trackCount};">`;
    html += span.map((year, index) => `<div class="timeline-year-bg" style="grid-column: ${index + 1}; grid-row: 1 / ${trackCount + 1};" aria-hidden="true"></div>`).join("");
    html += items.map(({ event, track }) => timelineEventBand(event, min, track)).join("");
    html += `</div>`;
  }
  if (decisionItems.length) {
    const trackCount = Math.max(decisionItems.length, 1);
    html += `<div class="timeline-cell lane-label decision-label">決策／處遇</div>`;
    html += `<div class="timeline-lane-body decision-lane-body" style="--track-count: ${trackCount};">`;
    html += span.map((year, index) => `<div class="timeline-year-bg" style="grid-column: ${index + 1}; grid-row: 1 / ${trackCount + 1};" aria-hidden="true"></div>`).join("");
    html += decisionItems.map((item, index) => decisionMarker(item, min, index + 1)).join("");
    html += `</div>`;
  }
  if (state.showContextTimeline) {
    html += `<div class="timeline-cell lane-label policy-label">${policyLaneName}</div>`;
    for (const year of span) {
      const events = policyEvents.filter((e) => Number(e.rocYear) === year);
      html += `<div class="timeline-cell policy-cell">${events.map(policyPill).join("")}</div>`;
    }
  }
  html += "</div>";
  chart.innerHTML = html;
}

function timelineEventBand(event, minYear, track) {
  const start = eventStartYear(event);
  const end = eventEndYear(event);
  const startColumn = start - minYear + 1;
  const endColumn = end - minYear + 2;
  const style = `grid-column: ${startColumn} / ${endColumn}; grid-row: ${track};`;
  return end > start ? periodBar(event, style) : eventPill(event, style);
}

function decisionMarker(item, minYear, track) {
  const startColumn = item.year - minYear + 1;
  const relation = timelineRelationInfo(item.event);
  const classes = ["decision-marker", laneClass(item.event.lane), relation.className];
  if (state.selectedEventId === item.event.id) classes.push("active");
  const style = `grid-column: ${startColumn}; grid-row: ${track};`;
  return `
    <button type="button" class="${classes.join(" ")}" style="${esc(style)}" data-open-event="${esc(item.event.id)}" title="${esc(`${item.decision.question}：連結 ${item.event.title}`)}">
      <span>決策</span>
      <strong>${esc(item.decision.question)}</strong>
      <small>${esc(eventPeriodText(item.event))}</small>
    </button>`;
}

function eventPill(event, style = "") {
  const relation = timelineRelationInfo(event);
  const classes = ["event-pill", laneClass(event.lane), relation.className];
  if (event.isDraftPreview) classes.push("draft-preview-event");
  if (state.selectedEventId === event.id) classes.push("active");
  return `<button type="button" class="${classes.join(" ")}" ${style ? `style="${esc(style)}"` : ""} ${timelineActionAttributes(event)}>${timelineRelationBadge(event)}${draftPreviewTag(event)}<strong>${esc(event.title)}</strong><small>${esc(eventPeriodText(event))}${event.age ? ` / ${esc(event.age)}歲` : ""}</small><small>${esc(stakeholderNames(event.actorIds))}</small></button>`;
}

function periodBar(event, style = "") {
  const relation = timelineRelationInfo(event);
  const classes = ["period-bar", laneClass(event.lane), relation.className];
  if (event.isDraftPreview) classes.push("draft-preview-event");
  if (state.selectedEventId === event.id) classes.push("active");
  return `<button type="button" class="${classes.join(" ")}" ${style ? `style="${esc(style)}"` : ""} ${timelineActionAttributes(event)} title="${esc(`${event.title}：${eventPeriodText(event)}`)}"><span class="period-caption">${esc(event.ongoing ? "持續至今" : "時間段")}</span>${timelineRelationBadge(event)}${draftPreviewTag(event)}<strong>${esc(event.title)}</strong><small>${esc(eventPeriodText(event))}${event.age ? ` / ${esc(event.age)}歲` : ""}</small><small>${esc(stakeholderNames(event.actorIds))}</small></button>`;
}

function timelineActionAttributes(event) {
  if (event.isDraftPreview) {
    return `data-open-draft="${esc(event.previewDraftIndex)}" data-timeline-event-id="${esc(event.id)}"`;
  }
  return `data-open-event="${esc(event.id)}" data-timeline-event-id="${esc(event.id)}"`;
}

function draftPreviewTag(event) {
  return event.isDraftPreview ? `<span class="timeline-relation-tag draft-preview-tag">AI 初稿</span>` : "";
}

function durationMarker(event) {
  const classes = ["duration-marker", laneClass(event.lane)];
  if (state.selectedEventId === event.id) classes.push("active");
  return `<button type="button" class="${classes.join(" ")}" data-open-event="${esc(event.id)}" title="${esc(`${event.title}：${eventPeriodText(event)}`)}"><span>${esc(durationLabel(event))}</span></button>`;
}

function durationLabel(event) {
  const title = String(event.title || normalizeLane(event.lane)).replace(/\s+/g, "").slice(0, 7);
  return `${title || "延續"}${event.ongoing ? " 至今" : " 延續"}`;
}

function policyPill(event) {
  return `<a class="event-pill policy" href="${esc(event.source)}" target="_blank" rel="noopener noreferrer"><strong>${esc(event.topic)}</strong><small>${esc(event.period)}</small></a>`;
}

function laneClass(lane) {
  const normalized = normalizeLane(lane);
  return ({
    "居住遷移史": "residence",
    "就業與就學史": "work",
    "感情與家庭史": "relationship",
    "疾病與身心健康史": "health",
    "社會資源使用歷程": "resource",
    "重大財務事件": "money"
  })[normalized] || "resource";
}

function actorChips(actorIds) {
  return normalizeActorIds(actorIds).map((id) => `<span class="actor-chip">${esc(stakeholderLabel(id))}</span>`).join(" ");
}

function eventPeopleLine(actorIds, compact = false) {
  return `
    <span class="event-people-line ${compact ? "compact" : ""}">
      <span class="event-people-label">事件人物</span>
      <span class="actor-chip-row">${actorChips(actorIds)}</span>
    </span>`;
}

function renderTimelineEventList() {
  const target = $("#timelineEventList");
  if (!target) return;
  const events = filteredTimelineEvents();
  const draftPreviewCount = draftTimelinePreviewEvents().filter(eventMatchesTimelineFilters).length;
  const counter = $("#timelineEventCount");
  const missingTimeCount = events.filter((event) => !eventHasTimelineYear(event)).length;
  if (counter) {
    const draftText = draftPreviewCount ? `，${draftPreviewCount}筆初稿` : "";
    counter.textContent = missingTimeCount ? `${events.length}筆，${missingTimeCount}筆待補時間${draftText}` : `${events.length}筆${draftText}`;
  }
  const draftNotice = draftPreviewCount ? `
    <div class="timeline-draft-notice">
      <strong>已在圖上顯示 ${draftPreviewCount} 筆 AI 初稿</strong>
      <span>虛線樣式代表尚未歸檔；點圖上的初稿可回到修改編輯區修改或確認。</span>
      <button type="button" class="ghost" data-open-ai-drafts>前往修改編輯</button>
    </div>` : "";
  if (!events.length) {
    target.innerHTML = `${draftNotice}<div class="field-note">目前篩選條件下沒有正式事件。可先用上方快速生成初稿，或調整主軸人物、加入人物、人物呈現或歷程分類。</div>`;
    return;
  }
  target.innerHTML = draftNotice + lanes.map((lane) => {
    const laneEvents = events.filter((event) => normalizeLane(event.lane) === lane);
    if (!laneEvents.length) return "";
    return `
      <section class="timeline-event-group">
        <h3>${esc(lane)}</h3>
        ${laneEvents.map((event) => `
          <div class="timeline-event-item" data-event-card-row="${esc(event.id)}">
            <button type="button" class="timeline-event-card ${timelineRelationInfo(event).className} ${state.selectedEventId === event.id ? "active" : ""}" data-open-event="${esc(event.id)}">
              <span>${esc(eventPeriodText(event))}${event.age ? ` / ${esc(event.age)}歲` : ""}</span>
              <strong>${esc(event.title)}</strong>
              ${timelineRelationBadge(event)}
              ${eventPeopleLine(event.actorIds, true)}
              ${eventHasTimelineYear(event) ? "" : `<span class="missing-time-note">未放入視覺時間軸</span>`}
            </button>
            ${state.selectedEventId === event.id ? eventInlinePanel(event) : ""}
          </div>
        `).join("")}
      </section>`;
  }).join("");
}

function eventInlinePanel(event) {
  if (state.inlineEditingEventId === event.id) return inlineEventForm(event);
  return `
    <article class="event-summary inline-summary">
      <div class="summary-title">
        <span class="badge">${esc(normalizeLane(event.lane))}</span>
        <strong>${esc(event.id)} ${esc(event.title)}</strong>
      </div>
      <dl>
        <dt>期間</dt><dd>${esc(eventPeriodText(event))}${event.age ? ` / ${esc(event.age)}歲` : ""}</dd>
        <dt>事件人物</dt><dd>${actorChips(event.actorIds)}</dd>
        ${event.actorText ? `<dt>辨識人物</dt><dd>${esc(event.actorText)}</dd>` : ""}
        ${event.relatedLanes?.length ? `<dt>相關歷程</dt><dd>${esc(event.relatedLanes.join("、"))}</dd>` : ""}
        ${event.extraTags ? `<dt>補充標籤</dt><dd>${esc(event.extraTags)}</dd>` : ""}
        ${event.place || event.objects ? `<dt>時地物</dt><dd>${esc([event.place, event.objects].filter(Boolean).join(" / "))}</dd>` : ""}
        <dt>摘要</dt><dd>${esc(event.fact || "待補事件摘要")}</dd>
        <dt>影響</dt><dd>${esc(event.impact || "待補脈絡影響")}</dd>
        <dt>待釐清</dt><dd>${esc(event.unknowns || "待補待釐清")}</dd>
      </dl>
      ${clarificationPanel(event)}
      <div class="button-row">
        <button type="button" data-inline-edit-event="${esc(event.id)}">快速編輯</button>
      </div>
    </article>`;
}

function inlineEventForm(event) {
  const laneOptions = lanes.map((lane) => `<option value="${esc(lane)}" ${normalizeLane(event.lane) === lane ? "selected" : ""}>${esc(lane)}</option>`).join("");
  const confidence = ["低", "中", "高"].map((value) => `<option ${value === event.confidence ? "selected" : ""}>${value}</option>`).join("");
  const actors = state.stakeholders.map((item) => `
    <label class="choice-item">
      <input type="checkbox" name="actorIds" value="${esc(item.id)}" ${normalizeActorIds(event.actorIds).includes(item.id) ? "checked" : ""} />
      <span>${esc(item.label)}</span>
    </label>
  `).join("");
  return `
    <form class="inline-event-form" data-inline-event-form="${esc(event.id)}">
      <div class="inline-form-grid">
        <label>開始民國年<input name="rocYear" type="number" min="1" max="150" required value="${esc(event.rocYear || "")}" /></label>
        <label>結束民國年<input name="endRocYear" type="number" min="1" max="150" value="${esc(event.endRocYear || "")}" placeholder="單次事件可留空" /></label>
        <label>案主年齡<input name="age" type="number" min="0" max="120" value="${esc(event.age || "")}" /></label>
        <label>歷程面向<select name="lane">${laneOptions}</select></label>
        <label class="toggle-row inline-toggle"><input name="ongoing" type="checkbox" ${event.ongoing ? "checked" : ""} /><span>仍在持續</span></label>
        <label>信心<select name="confidence">${confidence}</select></label>
        <label class="full">事件標題<input name="title" required value="${esc(event.title || "")}" /></label>
        <label class="full">事件事實<textarea name="fact" rows="3">${esc(event.fact || "")}</textarea></label>
        <label class="full">案主說法<textarea name="voice" rows="2">${esc(event.voice || "")}</textarea></label>
        <label>辨識人物<input name="actorText" value="${esc(event.actorText || "")}" /></label>
        <label>地點/窗口<input name="place" value="${esc(event.place || "")}" /></label>
        <label>金額/文件/資源<input name="objects" value="${esc(event.objects || "")}" /></label>
        <label>補充標籤<input name="extraTags" value="${esc(event.extraTags || "")}" /></label>
        <label class="full">相關歷程面向<input name="relatedLanes" value="${esc((event.relatedLanes || []).join("、"))}" placeholder="可用頓號分隔；六大主分類仍以歷程面向為準" /></label>
        <label class="full">原文摘錄<textarea name="sourceText" rows="2">${esc(event.sourceText || "")}</textarea></label>
        <label class="full">脈絡影響<textarea name="impact" rows="2">${esc(event.impact || "")}</textarea></label>
        <label class="full">待釐清<textarea name="unknowns" rows="2">${esc(event.unknowns || "")}</textarea></label>
        <label class="full">建議多確認<textarea name="nextStep" rows="2">${esc(clarificationText(event))}</textarea><span class="field-note">寫下需要補問、補查或補證的事件細節，避免寫成結論或交辦。</span></label>
      </div>
      <fieldset class="option-group">
        <legend>相關同住人口</legend>
        <div class="choice-grid compact">${actors}</div>
      </fieldset>
      <div class="button-row">
        <button class="primary" type="submit">儲存並留在清單</button>
        <button class="ghost" type="button" data-cancel-inline-edit="${esc(event.id)}">取消</button>
      </div>
    </form>`;
}

function renderEventsTable() {
  $("#eventsTable").innerHTML = state.events.map((e) => `
    <tr>
      <td>${esc(e.id)}</td>
      <td class="event-people-cell">${eventPeopleLine(e.actorIds, true)}</td>
      <td>${esc(eventPeriodText(e))}</td>
      <td>${esc(normalizeLane(e.lane))}</td>
      <td>
        <div class="event-detail">
          <strong>${esc(e.title)}</strong>
          <span>${esc(e.fact)}</span>
          ${e.relatedLanes?.length ? `<span><em>相關歷程</em> ${esc(e.relatedLanes.join("、"))}</span>` : ""}
          ${e.extraTags ? `<span><em>補充標籤</em> ${esc(e.extraTags)}</span>` : ""}
          ${e.place || e.objects ? `<span><em>時地物</em> ${esc([e.place, e.objects].filter(Boolean).join(" / "))}</span>` : ""}
          <span><em>影響</em> ${esc(e.impact || "待補")}</span>
          <span><em>待釐清</em> ${esc(e.unknowns || "待補")}</span>
        </div>
      </td>
      <td>${clarificationPanel(e, "compact")}</td>
      <td class="row-actions">
        <button type="button" class="edit-action" data-edit-event="${esc(e.id)}">編輯</button>
        <button type="button" data-delete-event="${esc(e.id)}">刪除</button>
      </td>
    </tr>
  `).join("");
}

function renderDraftList() {
  const target = $("#draftList");
  if (!target) return;
  if (!state.drafts.length) {
    target.innerHTML = `<div class="field-note">尚無可修改內容。貼上文字、上傳檔案或語音輸入後，按「整理成可修改內容」。</div>`;
    return;
  }
  target.innerHTML = state.drafts.map((draft, index) => draft.type === "decision" ? decisionDraftCard(draft, index) : eventDraftCard(draft, index)).join("");
}

function eventDraftCard(draft, index) {
  const laneOptions = lanes.map((lane) => `<option ${lane === draft.lane ? "selected" : ""}>${esc(lane)}</option>`).join("");
  const confidence = ["低", "中", "高"].map((value) => `<option ${value === draft.confidence ? "selected" : ""}>${value}</option>`).join("");
  const warningItems = draftReviewWarnings(draft);
  const warnings = warningItems.map((warning) => `<li>${esc(warning)}</li>`).join("");
  const nextEventDraftIndex = state.drafts.findIndex((item, candidateIndex) => candidateIndex > index && item.type === "event");
  return `
    <article class="draft-card" data-draft-card="${index}">
      <div class="draft-card-head">
        <h3>修改後歸檔 ${esc(draft.title || "未命名")}</h3>
        <span class="badge ${warnings ? "amber" : ""}">${draftStatusLabel(draft, warningItems)}</span>
      </div>
      ${warnings ? `<ul class="draft-warnings">${warnings}</ul>` : ""}
      ${draftReviewChecklist(draft)}
      <dl class="evidence-grid">
        <dt>原文依據</dt><dd>${esc(draft.sourceText || draft.fact || "待補原文依據")}</dd>
        <dt>辨識人物</dt><dd>${esc(draft.actorText || "待確認")}</dd>
        <dt>金額/文件/資源</dt><dd>${esc(draft.objects || "無明確線索")}</dd>
        <dt>地點/窗口</dt><dd>${esc(draft.place || "無明確線索")}</dd>
      </dl>
      ${draft.rocYear ? "" : `<div class="draft-time-note"><strong>待補時間</strong><span>歸檔後會留在事件清單與 Excel，不會放進視覺時間軸；補上開始民國年後才會進入時間軸。</span></div>`}
      ${draftActorAssist(draft)}
      <details class="draft-details">
        <summary>修改細節</summary>
        <div class="draft-grid">
          <label>開始民國年<input data-draft-field="rocYear" value="${esc(draft.rocYear || "")}" /></label>
          <label>結束民國年<input data-draft-field="endRocYear" value="${esc(draft.endRocYear || "")}" /></label>
          <label>案主年齡<input data-draft-field="age" value="${esc(draft.age || "")}" /></label>
          <label>主歷程面向<select data-draft-field="lane">${laneOptions}</select></label>
          <label class="toggle-row inline-toggle"><input type="checkbox" data-draft-field="ongoing" ${draft.ongoing ? "checked" : ""} /><span>仍在持續</span></label>
          <label>信心<select data-draft-field="confidence">${confidence}</select></label>
          <label>辨識人物<input data-draft-field="actorText" value="${esc(draft.actorText || "")}" placeholder="例如：案主、案母、案父" /></label>
          <label>地點/窗口<input data-draft-field="place" value="${esc(draft.place || "")}" placeholder="例如：租屋處、戶籍地、社福窗口" /></label>
          <label>金額/文件/資源<input data-draft-field="objects" value="${esc(draft.objects || "")}" placeholder="例如：5000元、中低收入戶、債務清冊" /></label>
          <label>補充標籤<input data-draft-field="extraTags" value="${esc(draft.extraTags || "")}" placeholder="先記錄想新增的分類，不影響六大主分類" /></label>
          <label class="full">事件標題<input data-draft-field="title" value="${esc(draft.title || "")}" /></label>
          <label class="full">事件事實<textarea data-draft-field="fact" rows="3">${esc(draft.fact || "")}</textarea></label>
          <label class="full">案主說法<textarea data-draft-field="voice" rows="2">${esc(draft.voice || "")}</textarea></label>
          <label class="full">脈絡影響<textarea data-draft-field="impact" rows="2">${esc(draft.impact || "")}</textarea></label>
          <label class="full">待釐清<textarea data-draft-field="unknowns" rows="2">${esc(draft.unknowns || "")}</textarea></label>
          <label class="full">建議多確認<textarea data-draft-field="nextStep" rows="2">${esc(normalizeClarificationText(draft.nextStep, draft.lane))}</textarea><span class="field-note">歸檔前可先改成社工想補問、補查或補證的事件細節。</span></label>
          <label class="full">原文摘錄<textarea data-draft-field="sourceText" rows="2">${esc(draft.sourceText || "")}</textarea></label>
        </div>
        <fieldset class="option-group">
          <legend>確認相關同住人口</legend>
          <div class="choice-grid compact">${draftActorOptions(draft)}</div>
        </fieldset>
        <fieldset class="option-group">
          <legend>相關歷程面向（選填，可複選）</legend>
          <div class="choice-grid compact">${relatedLaneOptions(draft)}</div>
        </fieldset>
      </details>
      <div class="draft-actions">
        <button type="button" data-split-draft="${index}">拆成兩筆</button>
        ${nextEventDraftIndex > -1 ? `<button type="button" data-merge-next-draft="${index}" data-next-draft="${nextEventDraftIndex}">與下一筆合併</button>` : ""}
        <button type="button" data-confirm-draft="${index}">確認歸檔到時間軸</button>
        <button type="button" data-discard-draft="${index}">不採用</button>
      </div>
    </article>`;
}

function draftStatusLabel(draft, warnings = draftReviewWarnings(draft)) {
  if (warnings.some((item) => /拆成|多個人物|多個年份|多個金額|重複|分類/.test(item))) return "建議先確認";
  const checklist = draftReviewItems(draft);
  return checklist.every((item) => item.done) ? "可歸檔" : "待補資料";
}

function draftReviewChecklist(draft) {
  const items = draftReviewItems(draft);
  return `
    <div class="draft-review-checklist" aria-label="修改內容歸檔前確認">
      ${items.map((item) => `
        <span class="${item.done ? "done" : "todo"}">
          <strong>${esc(item.label)}</strong>
          <em>${esc(item.text)}</em>
        </span>
      `).join("")}
    </div>`;
}

function draftReviewItems(draft) {
  const actors = normalizeActorIds(draft.actorIds);
  const hasFact = Boolean(String(draft.fact || "").trim() || String(draft.title || "").trim());
  const hasTime = Boolean(numberOrEmpty(draft.rocYear));
  const hasContextObject = Boolean(String(draft.place || "").trim() || String(draft.objects || "").trim());
  const lane = normalizeLane(draft.lane);
  return [
    {
      label: "人物",
      done: actors.length > 0,
      text: actors.length ? stakeholderNames(actors) : "待連結人物"
    },
    {
      label: "事件",
      done: hasFact,
      text: hasFact ? "已填事件事實" : "待補事件事實"
    },
    {
      label: "時間",
      done: hasTime,
      text: hasTime ? eventPeriodText(draft) : "待補民國年"
    },
    {
      label: "時地物",
      done: hasContextObject,
      text: hasContextObject ? [draft.place, draft.objects].filter(Boolean).join(" / ") : "可補地點、窗口、金額或文件"
    },
    {
      label: "分類",
      done: lanes.includes(lane),
      text: lane
    }
  ];
}

function draftActorAssist(draft) {
  const labels = unlinkedActorLabels(draft);
  if (!labels.length) return "";
  return `
    <div class="draft-assist">
      <strong>人物待處理</strong>
      ${labels.map((label) => {
        const candidates = stakeholderCandidatesForActorLabel(label);
        const linkButtons = candidates.map((person) => `<button type="button" data-link-draft-actor="${esc(person.id)}">連到「${esc(person.label)}」</button>`).join("");
        return `
          <div class="draft-assist-item">
            <span>${esc(label)} 尚未是同住人口</span>
            <div class="button-row">
              <button type="button" data-add-draft-actor="${esc(label)}">新增「${esc(label)}」並勾選</button>
              ${linkButtons}
            </div>
          </div>`;
      }).join("")}
    </div>`;
}

function unlinkedActorLabels(draft) {
  const labels = String(draft.actorText || "").split(/[、,，]/).map((item) => item.trim()).filter(Boolean);
  return [...new Set(labels)].filter((label) => {
    if (label === "案主本人") return false;
    return !state.stakeholders.some((person) => person.label === label);
  });
}

function stakeholderCandidatesForActorLabel(label) {
  const relation = suggestedRelationForActorLabel(label);
  if (!relation) return [];
  return state.stakeholders.filter((person) => {
    if (person.id === "A001") return false;
    if (/案父|父親|爸爸/.test(label) && /案母|母親|媽媽/.test(person.label)) return false;
    if (/案母|母親|媽媽/.test(label) && /案父|父親|爸爸/.test(person.label)) return false;
    const text = `${person.label} ${person.relation}`;
    return text.includes(relation) || (relation === "父母" && /父母|親屬|同住親屬/.test(text));
  }).slice(0, 2);
}

function suggestedRelationForActorLabel(label) {
  if (/案母|案父|母親|父親|媽媽|爸爸/.test(label)) return "父母";
  if (/子女|孩子|小孩|兒子|女兒/.test(label)) return "子女";
  if (/配偶|伴侶|先生|太太|丈夫|妻子|男友|女友/.test(label)) return "配偶/伴侶";
  if (/照顧者/.test(label)) return "主要照顧者";
  if (/親屬|手足|哥哥|姊姊|姐姐|弟弟|妹妹/.test(label)) return "手足/親屬";
  return "其他同住者";
}

function draftActorOptions(draft) {
  const selected = new Set(normalizeActorIds(draft.actorIds));
  return state.stakeholders.map((item) => `
    <label class="choice-item">
      <input type="checkbox" data-draft-actor value="${esc(item.id)}" ${selected.has(item.id) ? "checked" : ""} />
      <span>${esc(item.label)}</span>
    </label>
  `).join("");
}

function relatedLaneOptions(draft) {
  const selected = new Set(normalizeRelatedLanes(draft.relatedLanes, draft.lane));
  return lanes.filter((lane) => lane !== normalizeLane(draft.lane)).map((lane) => `
    <label class="choice-item">
      <input type="checkbox" data-draft-related-lane value="${esc(lane)}" ${selected.has(lane) ? "checked" : ""} />
      <span>${esc(lane)}</span>
    </label>
  `).join("");
}

function draftReviewWarnings(draft) {
  if (!draft || draft.type !== "event") return [];
  const text = [draft.sourceText, draft.fact, draft.title].filter(Boolean).join(" ");
  const actorCount = countActorCues(text);
  const yearCount = countYearCues(text);
  const amountCount = countAmountCues(text);
  const warnings = [];
  if (!draft.rocYear) warnings.push("尚未確認事件時間；歸檔前請補民國年或確認為待補。");
  if (actorCount > 1 || yearCount > 1 || amountCount > 1) warnings.push("原文可能包含多個人物、年份或金額；請確認是否需要拆成多筆事件。");
  if (/案父|案母|父親|母親/.test(text) && normalizeActorIds(draft.actorIds).length === 1 && normalizeActorIds(draft.actorIds)[0] === "A001") {
    warnings.push("辨識到案父/案母等人物，但尚未連結對應同住人口；請確認是否需新增人物或保留文字註記。");
  }
  const suggestedLane = detectLane(text);
  if (suggestedLane !== normalizeLane(draft.lane)) warnings.push(`系統建議主歷程可能是「${suggestedLane}」；請確認目前分類是否正確。`);
  if (normalizeLane(draft.lane) === "感情與家庭史" && /生活費|負債|借貸|還款|債務|5000|500萬|信用卡|金錢/.test(text)) {
    warnings.push("此事件核心看起來偏金錢流動；若不是婚姻/交往/伴侶關係變化，主分類建議改為重大財務事件。");
  }
  if (normalizeLane(draft.lane) !== "疾病與身心健康史" && /身心科|精神科|就醫|診斷|用藥|服藥|門診|住院|復健/.test(text)) {
    warnings.push("原文含就醫、診斷或身心健康線索；請確認主分類是否應改為疾病與身心健康史。");
  }
  const duplicate = state.events.find((event) => {
    if (Number(event.rocYear) !== Number(draft.rocYear || 0)) return false;
    if (normalizeLane(event.lane) !== normalizeLane(draft.lane)) return false;
    const eventActors = new Set(normalizeActorIds(event.actorIds));
    const draftActors = normalizeActorIds(draft.actorIds);
    return draftActors.some((id) => eventActors.has(id)) && similarText(event.title, draft.title);
  });
  if (duplicate) warnings.push(`可能與已歸檔事件 ${duplicate.id}「${duplicate.title}」重複。`);
  return [...new Set(warnings)];
}

function decisionDraftCard(draft, index) {
  return `
    <article class="draft-card" data-draft-card="${index}">
      <h3>決策草稿 ${esc(draft.question || "未命名")}</h3>
      <div class="draft-grid">
        <label>連結事件 ID<input data-draft-field="eventId" value="${esc(draft.eventId || "")}" /></label>
        <label>信心<input data-draft-field="confidence" value="${esc(draft.confidence || "低")}" /></label>
        <label class="full">討論問題<input data-draft-field="question" value="${esc(draft.question || "")}" /></label>
        <label class="full">當時可行選項<textarea data-draft-field="options" rows="2">${esc(draft.options || "")}</textarea></label>
        <label class="full">最大擔心<textarea data-draft-field="fear" rows="2">${esc(draft.fear || "")}</textarea></label>
        <label class="full">脈絡解讀<textarea data-draft-field="interpretation" rows="3">${esc(draft.interpretation || "")}</textarea></label>
      </div>
      <div class="draft-actions">
        <button type="button" data-confirm-draft="${index}">確認加入決策／處遇卡</button>
        <button type="button" data-discard-draft="${index}">不採用</button>
      </div>
    </article>`;
}

function updateDraftFromField(target) {
  const card = target.closest("[data-draft-card]");
  if (!card) return;
  const index = Number(card.dataset.draftCard);
  if (!Number.isInteger(index) || !state.drafts[index]) return;
  if (target.dataset.draftActor !== undefined) {
    state.drafts[index].actorIds = Array.from(card.querySelectorAll("[data-draft-actor]:checked")).map((input) => input.value);
    saveState();
    return;
  }
  if (target.dataset.draftRelatedLane !== undefined) {
    state.drafts[index].relatedLanes = Array.from(card.querySelectorAll("[data-draft-related-lane]:checked")).map((input) => input.value);
    saveState();
    return;
  }
  const field = target.dataset.draftField;
  if (!field) return;
  state.drafts[index][field] = target.type === "checkbox" ? target.checked : target.value;
  if (field === "lane") state.drafts[index].relatedLanes = normalizeRelatedLanes(state.drafts[index].relatedLanes, target.value);
  saveState();
  if (field === "lane") render();
}

function addDraftActorAsStakeholder(index, label) {
  const draft = state.drafts[index];
  if (!draft || draft.type !== "event") return;
  const existing = state.stakeholders.find((person) => person.label === label);
  const id = existing?.id || nextId("A", state.stakeholders);
  if (!existing) {
    state.stakeholders.push({
      id,
      label,
      relation: suggestedRelationForActorLabel(label),
      stance: "待確認",
      sensitivity: "內部",
      notes: `由草稿「${draft.title || "未命名事件"}」辨識新增；請確認是否同住、曾同住或僅為關係人。`
    });
  }
  linkDraftActor(index, id);
}

function linkDraftActor(index, actorId) {
  const draft = state.drafts[index];
  if (!draft || draft.type !== "event") return;
  draft.actorIds = normalizeActorIds([...(draft.actorIds || []), actorId]);
  render();
}

function splitDraft(index) {
  const draft = state.drafts[index];
  if (!draft || draft.type !== "event") return;
  const pieces = splitIntakeSegments(draft.sourceText || draft.fact || "")
    .filter((item) => item !== draft.sourceText && item !== draft.fact ? item.length >= 4 : true);
  const firstText = pieces[0] || draft.fact || draft.sourceText || "";
  const secondText = pieces.slice(1).join("\n") || "請在此填入從原文拆出的另一筆事件。";
  const firstDraft = normalizeEventDraftFromSplit(draft, firstText, "拆分 1");
  const secondDraft = normalizeEventDraftFromSplit(draft, secondText, "拆分 2");
  state.drafts.splice(index, 1, firstDraft, secondDraft);
  render();
}

function normalizeEventDraftFromSplit(draft, text, suffix) {
  const cleanText = String(text || "").trim();
  if (cleanText && !cleanText.startsWith("請在此")) {
    const lane = detectLane(cleanText);
    const period = extractPeriod(cleanText);
    const actorText = detectActorText(cleanText) || draft.actorText || "";
    return normalizeDraftRecord({
      ...draft,
      rocYear: period.rocYear || "",
      endRocYear: period.endRocYear || "",
      ongoing: Boolean(period.ongoing),
      lane,
      relatedLanes: suggestRelatedLanes(cleanText, lane),
      extraTags: suggestExtraTags(cleanText, lane),
      title: suffix ? `${titleFromSentence(cleanText, lane)}（${suffix}）` : titleFromSentence(cleanText, lane),
      fact: cleanText,
      actorText,
      actorIds: matchActorIds(actorText || cleanText),
      place: extractPlace(cleanText),
      objects: extractObjects(cleanText),
      sourceText: cleanText,
      confidence: period.rocYear ? draft.confidence || "中" : "低"
    });
  }
  return normalizeDraftRecord({
    ...draft,
    rocYear: "",
    endRocYear: "",
    title: suffix ? `${draft.title || "待確認事件"}（${suffix}）` : draft.title || "待確認事件",
    fact: cleanText,
    sourceText: draft.sourceText || draft.fact || "",
    confidence: "低"
  });
}

function mergeDraftWithNext(index, nextIndex) {
  const draft = state.drafts[index];
  const nextDraft = state.drafts[nextIndex];
  if (!draft || !nextDraft || draft.type !== "event" || nextDraft.type !== "event") return;
  const combinedText = uniqueTextList([draft.sourceText, draft.fact, nextDraft.sourceText, nextDraft.fact]).join("\n");
  const lane = normalizeLane(draft.lane || detectLane(combinedText));
  const merged = normalizeDraftRecord({
    ...draft,
    rocYear: draft.rocYear || nextDraft.rocYear || "",
    endRocYear: draft.endRocYear || nextDraft.endRocYear || "",
    ongoing: Boolean(draft.ongoing || nextDraft.ongoing),
    lane,
    relatedLanes: [...normalizeRelatedLanes(draft.relatedLanes, lane), ...normalizeRelatedLanes(nextDraft.relatedLanes, lane), normalizeLane(nextDraft.lane)].filter((item) => item !== lane),
    extraTags: uniqueDelimitedText([draft.extraTags, nextDraft.extraTags]),
    title: `${draft.title || "待確認事件"} / ${nextDraft.title || "待確認事件"}`.slice(0, 52),
    fact: uniqueTextList([draft.fact, nextDraft.fact]).join("\n"),
    actorText: uniqueDelimitedText([draft.actorText, nextDraft.actorText]),
    actorIds: [...normalizeActorIds(draft.actorIds), ...normalizeActorIds(nextDraft.actorIds)],
    place: uniqueDelimitedText([draft.place, nextDraft.place]),
    objects: uniqueDelimitedText([draft.objects, nextDraft.objects]),
    sourceText: combinedText,
    confidence: draft.confidence === "低" || nextDraft.confidence === "低" ? "低" : draft.confidence || nextDraft.confidence || "低"
  });
  state.drafts.splice(nextIndex, 1);
  state.drafts[index] = merged;
  render();
}

function uniqueTextList(values) {
  return [...new Set(values.map((item) => String(item || "").trim()).filter(Boolean))];
}

function uniqueDelimitedText(values) {
  return [...new Set(values.flatMap((value) => String(value || "").split(/[、,，\n]/)).map((item) => item.trim()).filter(Boolean))].join("、");
}

function confirmDraft(index) {
  const draft = state.drafts[index];
  if (!draft) return;
  if (draft.type === "event") {
    const warnings = draftReviewWarnings(draft);
    if (warnings.length && !confirm(`這筆草稿還有 ${warnings.length} 個建議確認項目，仍要先歸檔嗎？\n\n${warnings.slice(0, 3).join("\n")}`)) {
      return;
    }
  }
  if (draft.type === "decision") {
    state.decisions.push({
      id: nextId("D", state.decisions),
      eventId: draft.eventId || "",
      question: draft.question || "待補討論問題",
      actorIds: normalizeActorIds(draft.actorIds),
      options: draft.options || "待補當時可行選項",
      fear: draft.fear || "待補最大擔心",
      interpretation: draft.interpretation || "待補脈絡解讀"
    });
  } else {
    state.events.push(normalizeEventRecord({
      id: nextId("E", state.events),
      rocYear: Number(draft.rocYear || 0),
      endRocYear: draft.ongoing ? "" : numberOrEmpty(draft.endRocYear),
      ongoing: Boolean(draft.ongoing),
      age: Number(draft.age || 0),
      lane: normalizeLane(draft.lane),
      relatedLanes: normalizeRelatedLanes(draft.relatedLanes, draft.lane),
      extraTags: draft.extraTags || "",
      place: draft.place || "",
      objects: draft.objects || "",
      actorText: draft.actorText || "",
      sourceText: draft.sourceText || "",
      title: draft.title || "待補事件標題",
      fact: draft.fact || "待補事件事實",
      voice: draft.voice || "",
      source: draft.source || "AI 匯入草稿",
      actorIds: normalizeActorIds(draft.actorIds),
      sensitivity: draft.sensitivity || "內部",
      confidence: draft.confidence || "低",
      impact: draft.impact || "待補脈絡影響",
      unknowns: draft.unknowns || "待補待釐清",
      nextStep: normalizeClarificationText(draft.nextStep || "社工已確認草稿後加入；下次會談補證據。", draft.lane)
    }));
  }
  state.drafts.splice(index, 1);
  render();
}

function renderHistoryGuide() {
  const target = $("#historyGuide");
  if (!target) return;
  target.innerHTML = historyGuides.map((item) => `
    <article class="guide-card">
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.focus)}</p>
      <dl>
        <dt>看什麼</dt><dd>${esc(item.lookFor)}</dd>
        <dt>怎麼讀</dt><dd>${esc(item.decisionMeaning)}</dd>
        <dt>界線</dt><dd>${esc(item.caution)}</dd>
      </dl>
    </article>
  `).join("");
}

function renderContextIndex() {
  const target = $("#contextIndex");
  if (!target) return;
  target.innerHTML = contextRows.map(([topic, period, use, source]) => `
    <article class="context-row">
      <h3>${esc(topic)}</h3>
      <p><strong>${esc(period)}</strong> ${esc(use)}</p>
      <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">來源</a>
    </article>
  `).join("");
}

function renderDecisionCards() {
  $("#decisionCards").innerHTML = state.decisions.map((d) => `
    <article class="decision-card">
      <h3>${esc(d.id)} ${esc(d.question)}</h3>
      <dl>
        <dt>連結事件</dt><dd>${esc(d.eventId || "未連結")}</dd>
        <dt>相關同住人口</dt><dd>${esc(stakeholderNames(d.actorIds))}</dd>
        <dt>當時可行選項</dt><dd>${esc(d.options)}</dd>
        <dt>最大擔心</dt><dd>${esc(d.fear)}</dd>
        <dt>脈絡解讀</dt><dd>${esc(d.interpretation)}</dd>
      </dl>
    </article>
  `).join("");
}

function renderSafetyList() {
  $("#safetyList").innerHTML = safetyItems.map(([name, description], index) => {
    const current = state.checks[index]?.status || "通過";
    const options = sensitivityOptions.map((option) => `<option ${option === current ? "selected" : ""}>${option}</option>`).join("");
    return `
      <div class="check-item">
        <div><strong>${esc(name)}</strong><span>${esc(description)}</span></div>
        <select data-check-index="${index}">${options}</select>
      </div>`;
  }).join("");
}

function updateExportProbe() {
  const probe = document.querySelector("#exportProbe");
  if (!probe) return;
  const blob = buildXlsx();
  const relationCounts = timelineRelationCounts();
  probe.dataset.eventCount = String(state.events.length);
  probe.dataset.decisionCount = String(state.decisions.length);
  probe.dataset.stakeholderCount = String(state.stakeholders.length);
  probe.dataset.draftCount = String(state.drafts.length);
  probe.dataset.historyCoverage = String(new Set(state.events.map((e) => normalizeLane(e.lane)).filter((lane) => lanes.includes(lane))).size);
  probe.dataset.sheetCount = String(workbookSheetNames.length);
  probe.dataset.historyGuideCount = String(historyGuides.length);
  probe.dataset.researchRows = String(researchRows.length);
  probe.dataset.filteredEventCount = String(filteredTimelineEvents().length);
  probe.dataset.selectedActorCount = String(selectedTimelineActorIds().length);
  probe.dataset.primaryAxisEventCount = String(relationCounts.primary);
  probe.dataset.compareAxisEventCount = String(relationCounts.compare);
  probe.dataset.sharedAxisEventCount = String(relationCounts.shared);
  probe.dataset.caseAxisEventCount = String(relationCounts.case);
  probe.dataset.policyTimelineCount = String(state.showContextTimeline ? contextTimelineRows.length : 0);
  probe.dataset.timelineDecisionCount = String(visibleTimelineDecisionItems(filteredTimelineEvents().filter(eventHasTimelineYear)).length);
  probe.dataset.timelineDraftPreviewCount = String(draftTimelinePreviewEvents().length);
  probe.dataset.timelineSvgSize = String(buildTimelineSvgExport().svg.length);
  probe.dataset.quickAdjustGuideVisible = String(!document.querySelector("#quickAdjustGuide")?.hidden);
  probe.dataset.savedRecordCount = String(savedRecords.length);
  probe.dataset.workbenchOpen = String(!document.querySelector("#workbenchPanel")?.hidden);
  probe.dataset.durationEventCount = String(state.events.filter((event) => eventStartYear(event) && eventEndYear(event) > eventStartYear(event)).length);
  probe.dataset.missingTimeEventCount = String(state.events.filter((event) => !eventHasTimelineYear(event)).length);
  probe.dataset.exampleEventCount = String(state.events.filter(isExampleItem).length);
  probe.dataset.exampleStakeholderCount = String(state.stakeholders.filter(isExampleItem).length);
  probe.dataset.startGuidePresent = String(Boolean(document.querySelector(".start-guide")));
  probe.dataset.timelineLocators = String(document.querySelectorAll("[data-timeline-event-id]").length);
  probe.dataset.xlsxSize = String(blob.size);
  probe.dataset.mimeType = blob.type;
}

function nextId(prefix, items) {
  const max = items.reduce((acc, item) => {
    const n = Number(String(item.id || "").replace(prefix, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function isExampleItem(item) {
  return item?.packageId === EXAMPLE_PACKAGE_ID ||
    String(item?.source || "").startsWith("範例測試包") ||
    isLegacyExampleEvent(item) ||
    isLegacyExampleStakeholder(item) ||
    isLegacyExampleDecision(item);
}

function clearExamplePack() {
  const removedEventIds = new Set(state.events.filter(isExampleItem).map((item) => item.id));
  state.events = state.events.filter((item) => !isExampleItem(item));
  state.decisions = state.decisions.filter((item) => !isExampleItem(item) && !removedEventIds.has(item.eventId));
  state.stakeholders = state.stakeholders.filter((item) => item.id === "A001" || !isExampleItem(item));
  state.events = state.events.map((item) => ({ ...item, actorIds: normalizeActorIds(item.actorIds) }));
  state.decisions = state.decisions.map((item) => ({ ...item, actorIds: normalizeActorIds(item.actorIds) }));
  state.selectedEventId = "";
  state.inlineEditingEventId = "";
  render();
}

function loadExamplePack() {
  clearExamplePackWithoutRender();
  const actorIdMap = new Map([["A001", "A001"]]);
  for (const person of exampleStakeholders().filter((item) => item.id !== "A001")) {
    const nextPerson = { ...person, id: nextId("A", state.stakeholders), packageId: EXAMPLE_PACKAGE_ID };
    actorIdMap.set(person.id, nextPerson.id);
    state.stakeholders.push(nextPerson);
  }
  const eventIdMap = new Map();
  for (const event of exampleEvents()) {
    const nextEvent = normalizeEventRecord({
      ...event,
      id: nextId("E", state.events),
      actorIds: normalizeActorIds((event.actorIds || []).map((id) => actorIdMap.get(id) || id)),
      packageId: EXAMPLE_PACKAGE_ID
    });
    eventIdMap.set(event.id, nextEvent.id);
    state.events.push(nextEvent);
  }
  for (const decision of exampleDecisions()) {
    state.decisions.push({
      ...decision,
      id: nextId("D", state.decisions),
      eventId: eventIdMap.get(decision.eventId) || "",
      actorIds: normalizeActorIds((decision.actorIds || []).map((id) => actorIdMap.get(id) || id)),
      packageId: EXAMPLE_PACKAGE_ID
    });
  }
  state.selectedEventId = state.events.find(isExampleItem)?.id || "";
  state.inlineEditingEventId = "";
  render();
}

function clearExamplePackWithoutRender() {
  const removedEventIds = new Set(state.events.filter(isExampleItem).map((item) => item.id));
  state.events = state.events.filter((item) => !isExampleItem(item));
  state.decisions = state.decisions.filter((item) => !isExampleItem(item) && !removedEventIds.has(item.eventId));
  state.stakeholders = state.stakeholders.filter((item) => item.id === "A001" || !isExampleItem(item));
}

function openWorkbench(tabName = "") {
  const panel = $("#workbenchPanel");
  if (panel) panel.hidden = false;
  if (tabName) switchTab(tabName);
}

function switchTab(tabName) {
  const panel = $("#workbenchPanel");
  if (panel) panel.hidden = false;
  $$(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  $$(".workspace").forEach((panel) => panel.classList.toggle("active", panel.id === `tab-${tabName}`));
  updateExportProbe();
}

function openAiInputForm() {
  switchTab("ai");
  const form = $("#aiInputForm");
  requestAnimationFrame(() => {
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    form?.elements?.intakeText?.focus?.();
  });
}

function openDraftCard(index) {
  switchTab("ai");
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-draft-card="${cssValue(index)}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.add("timeline-focus-flash");
    window.setTimeout(() => card.classList.remove("timeline-focus-flash"), 1300);
  });
}

function setQuickLoading(isLoading) {
  const loader = $("#quickGenerateLoading");
  const button = $("#quickGenerateTimeline");
  if (loader) loader.hidden = !isLoading;
  if (button) {
    button.disabled = isLoading;
    button.textContent = isLoading ? "整理中..." : "生成生命脈絡圖";
  }
}

function setQuickAdjustGuideVisible(isVisible) {
  const guide = $("#quickAdjustGuide");
  if (guide) guide.hidden = !isVisible;
}

function renderQuickStartState() {
  setQuickAdjustGuideVisible(draftTimelinePreviewEvents().length > 0);
}

function setQuickStatus(message) {
  const target = $("#quickGenerateStatus");
  if (target) target.textContent = message;
}

async function quickGenerateTimeline() {
  const text = String($("#quickIntakeText")?.value || "").trim();
  if (text.length < 6) {
    setQuickStatus("請先貼上一段去識別測試資料，再生成生命脈絡圖。");
    return;
  }
  const combined = $("#aiCombinedText");
  if (combined) combined.value = [combined.value, text].map((part) => part.trim()).filter(Boolean).join("\n\n");
  setQuickStatus("正在整理生命脈絡圖，會先顯示可修改的 AI 初稿。");
  setQuickLoading(true);
  try {
    const result = await analyzeIntakeText(text);
    switchTab("timeline");
    const draftCount = draftTimelinePreviewEvents().length;
    setQuickAdjustGuideVisible(draftCount > 0);
    setQuickStatus(result
      ? `已產生 ${result.count} 筆可修改內容；圖上共有 ${draftCount} 筆 AI 初稿可先檢視。`
      : "尚未產生草稿，請確認輸入內容是否足夠。");
    requestAnimationFrame(() => {
      document.querySelector("#timelineChart")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  } finally {
    setQuickLoading(false);
  }
}

function openNewStakeholderForm() {
  exitStakeholderEdit();
  switchTab("stakeholders");
  const form = $("#stakeholderForm");
  requestAnimationFrame(() => {
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    form?.elements?.label?.focus?.();
  });
}

function openNewEventForm() {
  const form = $("#eventForm");
  if (form) form.reset();
  exitEventEdit();
  renderStakeholderOptions();
  switchTab("ai");
  requestAnimationFrame(() => {
    form?.scrollIntoView({ behavior: "smooth", block: "start" });
    form?.elements?.rocYear?.focus?.();
  });
}

function startStakeholderEdit(stakeholderId) {
  const item = state.stakeholders.find((person) => person.id === stakeholderId);
  const form = $("#stakeholderForm");
  if (!item || item.id === "A001" || !form) return;
  switchTab("stakeholders");
  form.elements.stakeholderId.value = item.id;
  form.elements.label.value = item.label || "";
  form.elements.relation.value = item.relation || "其他同住者";
  form.elements.stance.value = item.stance || "待確認";
  if (form.elements.sensitivity) form.elements.sensitivity.value = item.sensitivity || "內部";
  form.elements.notes.value = item.notes || "";
  const title = form.querySelector(".section-head h2");
  if (title) title.textContent = "編輯同住人口";
  const submit = $("#stakeholderSubmitButton");
  if (submit) submit.textContent = "儲存同住人口";
  const cancel = $("#cancelStakeholderEdit");
  if (cancel) cancel.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitStakeholderEdit() {
  const form = $("#stakeholderForm");
  if (!form) return;
  form.reset();
  if (form.elements.stakeholderId) form.elements.stakeholderId.value = "";
  const title = form.querySelector(".section-head h2");
  if (title) title.textContent = "新增同住人口";
  const submit = $("#stakeholderSubmitButton");
  if (submit) submit.textContent = "新增同住人口";
  const cancel = $("#cancelStakeholderEdit");
  if (cancel) cancel.hidden = true;
}

function startEventEdit(eventId) {
  const item = state.events.find((event) => event.id === eventId);
  const form = $("#eventForm");
  if (!item || !form) return;
  switchTab("ai");
  form.elements.eventId.value = item.id;
  form.elements.rocYear.value = item.rocYear || "";
  form.elements.endRocYear.value = item.endRocYear || "";
  form.elements.ongoing.checked = Boolean(item.ongoing);
  form.elements.age.value = item.age || "";
  form.elements.lane.value = normalizeLane(item.lane);
  form.elements.title.value = item.title || "";
  form.elements.fact.value = item.fact || "";
  form.elements.voice.value = item.voice || "";
  if (form.elements.actorText) form.elements.actorText.value = item.actorText || "";
  if (form.elements.place) form.elements.place.value = item.place || "";
  if (form.elements.objects) form.elements.objects.value = item.objects || "";
  if (form.elements.extraTags) form.elements.extraTags.value = item.extraTags || "";
  if (form.elements.relatedLanes) form.elements.relatedLanes.value = (item.relatedLanes || []).join("、");
  if (form.elements.sourceText) form.elements.sourceText.value = item.sourceText || "";
  form.elements.impact.value = item.impact || "";
  form.elements.unknowns.value = item.unknowns || "";
  if (form.elements.nextStep) form.elements.nextStep.value = clarificationText(item);
  if (form.elements.sensitivity) form.elements.sensitivity.value = item.sensitivity || "內部";
  form.elements.confidence.value = item.confidence || "中";
  const selected = new Set(normalizeActorIds(item.actorIds));
  form.querySelectorAll('input[name="actorIds"]').forEach((input) => {
    input.checked = selected.has(input.value);
  });
  const title = form.querySelector(".section-head h2");
  if (title) title.textContent = "編輯事件";
  const submit = $("#eventSubmitButton");
  if (submit) submit.textContent = "儲存事件";
  const cancel = $("#cancelEventEdit");
  if (cancel) cancel.hidden = false;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function exitEventEdit() {
  const form = $("#eventForm");
  if (form?.elements?.eventId) form.elements.eventId.value = "";
  if (form?.elements?.ongoing) form.elements.ongoing.checked = false;
  if (form) {
    ["actorText", "place", "objects", "extraTags", "relatedLanes", "sourceText"].forEach((name) => {
      if (form.elements[name]) form.elements[name].value = "";
    });
  }
  const title = form?.querySelector(".section-head h2");
  if (title) title.textContent = "新增事件";
  const submit = $("#eventSubmitButton");
  if (submit) submit.textContent = "新增到時間軸";
  const cancel = $("#cancelEventEdit");
  if (cancel) cancel.hidden = true;
}

function eventPayloadFromForm(data, formData, existingEvent) {
  const start = Number(data.rocYear);
  const end = data.ongoing ? "" : numberOrEmpty(data.endRocYear);
  return {
    rocYear: start,
    endRocYear: end && end >= start ? end : "",
    ongoing: data.ongoing === "on",
    age: Number(data.age || 0),
    lane: normalizeLane(data.lane),
    relatedLanes: normalizeRelatedLanes(data.relatedLanes, data.lane),
    extraTags: data.extraTags || "",
    place: data.place || "",
    objects: data.objects || "",
    actorText: data.actorText || "",
    sourceText: data.sourceText || "",
    title: data.title,
    fact: data.fact,
    voice: data.voice,
    source: existingEvent?.source || "使用者新增",
    actorIds: normalizeActorIds(formData.getAll("actorIds")),
    sensitivity: data.sensitivity || existingEvent?.sensitivity || defaultSensitivity(data.lane),
    confidence: data.confidence,
    impact: data.impact,
    unknowns: data.unknowns,
    nextStep: normalizeClarificationText(data.nextStep || existingEvent?.nextStep || (data.confidence === "低" ? "補來源與當事人確認" : "納入下一次討論"), data.lane)
  };
}

function saveInlineEvent(form) {
  const eventId = form.dataset.inlineEventForm;
  const existingEvent = state.events.find((item) => item.id === eventId);
  if (!existingEvent) return;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  const payload = eventPayloadFromForm(data, formData, existingEvent);
  state.events = state.events.map((item) => item.id === eventId ? { ...item, ...payload, id: eventId } : item);
  state.selectedEventId = eventId;
  state.inlineEditingEventId = "";
  renderWithoutJump();
}

function renderWithoutJump() {
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const timelineScroll = $(".timeline-scroll")?.scrollLeft || 0;
  const timelineScrollTop = $(".timeline-scroll")?.scrollTop || 0;
  document.documentElement.style.overflowAnchor = "none";
  document.body.style.overflowAnchor = "none";
  render();

  const restore = () => {
    window.scrollTo(scrollX, scrollY);
    const timeline = $(".timeline-scroll");
    if (timeline) {
      timeline.scrollLeft = timelineScroll;
      timeline.scrollTop = timelineScrollTop;
    }
  };

  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(() => {
      restore();
      setTimeout(() => {
        restore();
        document.documentElement.style.overflowAnchor = "";
        document.body.style.overflowAnchor = "";
      }, 0);
    });
  });
}

function cssValue(value) {
  if (window.CSS?.escape) return CSS.escape(String(value));
  return String(value).replace(/["\\]/g, "\\$&");
}

function scrollTimelineToEvent(eventId, shouldFlash = true) {
  const event = state.events.find((item) => item.id === eventId);
  if (!event || !eventHasTimelineYear(event)) return;
  requestAnimationFrame(() => {
    const scroller = $(".timeline-scroll");
    const target = $(`[data-timeline-event-id="${cssValue(eventId)}"]`);
    if (!scroller || !target) return;
    const left = Math.max(0, target.offsetLeft - scroller.clientWidth * 0.36);
    const top = Math.max(0, target.offsetTop - scroller.clientHeight * 0.42);
    scroller.scrollTo({ left, top, behavior: "smooth" });
    if (shouldFlash) {
      target.classList.add("timeline-focus-flash");
      window.setTimeout(() => target.classList.remove("timeline-focus-flash"), 1300);
    }
  });
}

function selectEventFromControl(eventId, sourceElement) {
  state.selectedEventId = eventId;
  state.inlineEditingEventId = "";
  const shouldFocusTimeline = Boolean(sourceElement?.closest?.(".timeline-event-list"));
  renderWithoutJump();
  if (shouldFocusTimeline) window.setTimeout(() => scrollTimelineToEvent(eventId), 80);
}

function bindEvents() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      switchTab(button.dataset.tab);
    });
  });

  $("#yearMode").value = state.yearMode;
  $("#yearMode").addEventListener("change", (event) => {
    state.yearMode = event.target.value;
    render();
  });

  $("#timelinePrimaryActor").addEventListener("change", (event) => {
    state.timelinePrimaryActorId = event.target.value;
    state.timelineCompareActorIds = state.timelinePrimaryActorId === ALL_ACTORS_ID ? [] : normalizeCompareActorIds(state.timelineCompareActorIds, state.timelinePrimaryActorId);
    state.selectedEventId = "";
    state.inlineEditingEventId = "";
    render();
  });

  $("#timelineMatchMode").addEventListener("change", (event) => {
    state.timelineMatchMode = event.target.value;
    state.selectedEventId = "";
    state.inlineEditingEventId = "";
    render();
  });

  $("#timelineLaneFilter").addEventListener("change", (event) => {
    state.timelineLaneFilter = event.target.value === "all" ? "all" : normalizeLane(event.target.value);
    state.selectedEventId = "";
    state.inlineEditingEventId = "";
    render();
  });

  $("#showContextTimeline").addEventListener("change", (event) => {
    state.showContextTimeline = event.target.checked;
    render();
  });

  $("#timelineCompareActorOptions").addEventListener("change", () => {
    state.timelineCompareActorIds = $$('input[data-compare-actor]:checked').map((input) => input.value);
    state.timelineCompareActorIds = normalizeCompareActorIds(state.timelineCompareActorIds, state.timelinePrimaryActorId);
    state.selectedEventId = "";
    state.inlineEditingEventId = "";
    render();
  });

  $("#quickGenerateTimeline")?.addEventListener("click", quickGenerateTimeline);
  $("#quickUseFixture")?.addEventListener("click", () => {
    const input = $("#quickIntakeText");
    if (input) {
      input.value = QUICK_FIXTURE_TEXT;
      input.focus();
    }
    setQuickStatus("已填入測試文字，可直接按「生成生命脈絡圖」。");
  });
  $("#addTimelineEvent")?.addEventListener("click", openNewEventForm);
  $("#addTimelineStakeholder")?.addEventListener("click", openNewStakeholderForm);
  $("#saveRecord")?.addEventListener("click", saveCurrentRecord);
  $("#recordSearch")?.addEventListener("input", renderSavedRecords);
  $("#savedRecordList")?.addEventListener("click", (event) => {
    const loadId = event.target?.closest?.("[data-load-record]")?.dataset?.loadRecord;
    const deleteId = event.target?.closest?.("[data-delete-record]")?.dataset?.deleteRecord;
    const cardId = event.target?.closest?.("button") ? "" : event.target?.closest?.("[data-record-card]")?.dataset?.recordCard;
    if (loadId) loadSavedRecord(loadId);
    if (cardId) loadSavedRecord(cardId);
    if (deleteId) deleteSavedRecord(deleteId);
  });
  $("#savedRecordList")?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (event.target?.closest?.("button, input, textarea, select")) return;
    const cardId = event.target?.closest?.("[data-record-card]")?.dataset?.recordCard;
    if (!cardId) return;
    event.preventDefault();
    loadSavedRecord(cardId);
  });

  $("#stakeholderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const existingId = data.stakeholderId || "";
    const existingStakeholder = state.stakeholders.find((item) => item.id === existingId);
    const payload = {
      label: data.label,
      relation: data.relation,
      stance: data.stance,
      sensitivity: data.sensitivity || existingStakeholder?.sensitivity || "內部",
      notes: data.notes
    };
    if (existingId && existingId !== "A001") {
      state.stakeholders = state.stakeholders.map((item) => item.id === existingId ? { ...item, ...payload, id: existingId } : item);
    } else {
      state.stakeholders.push({
        id: nextId("A", state.stakeholders),
        ...payload
      });
    }
    exitStakeholderEdit();
    render();
  });

  $("#cancelStakeholderEdit").addEventListener("click", exitStakeholderEdit);

  $("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const existingId = data.eventId || "";
    const existingEvent = state.events.find((item) => item.id === existingId);
    const payload = eventPayloadFromForm(data, formData, existingEvent);
    if (existingEvent) {
      state.events = state.events.map((item) => item.id === existingId ? { ...item, ...payload, id: existingId } : item);
      state.selectedEventId = existingId;
      state.inlineEditingEventId = "";
      exitEventEdit();
    } else {
      const next = { id: nextId("E", state.events), ...payload };
      state.events.push(next);
      state.selectedEventId = next.id;
    }
    render();
  });

  $("#cancelEventEdit").addEventListener("click", exitEventEdit);

  document.addEventListener("submit", (event) => {
    const form = event.target?.closest?.("[data-inline-event-form]");
    if (!form) return;
    event.preventDefault();
    saveInlineEvent(form);
  });

  $("#decisionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    state.decisions.push({
      id: nextId("D", state.decisions),
      eventId: data.eventId,
      question: data.question,
      actorIds: normalizeActorIds(formData.getAll("actorIds")),
      options: data.options,
      fear: data.fear,
      interpretation: data.interpretation
    });
    render();
  });

  document.addEventListener("click", (event) => {
    const openDraftControl = event.target?.closest?.("[data-open-draft]");
    if (openDraftControl) {
      event.preventDefault();
      openDraftControl.blur?.();
      openDraftCard(Number(openDraftControl.dataset.openDraft));
      return;
    }
    const openAiDrafts = event.target?.closest?.("[data-open-ai-drafts]");
    if (openAiDrafts) {
      event.preventDefault();
      openDraftCard(0);
      return;
    }
    const openEventControl = event.target?.closest?.("[data-open-event]");
    const openEventId = openEventControl?.dataset?.openEvent;
    if (openEventId) {
      event.preventDefault();
      openEventControl.blur?.();
      selectEventFromControl(openEventId, openEventControl);
      return;
    }
    const inlineEditControl = event.target?.closest?.("[data-inline-edit-event]");
    const inlineEditEventId = inlineEditControl?.dataset?.inlineEditEvent;
    if (inlineEditEventId) {
      event.preventDefault();
      inlineEditControl.blur?.();
      state.selectedEventId = inlineEditEventId;
      state.inlineEditingEventId = inlineEditEventId;
      renderWithoutJump();
      return;
    }
    const cancelInlineControl = event.target?.closest?.("[data-cancel-inline-edit]");
    const cancelInlineEventId = cancelInlineControl?.dataset?.cancelInlineEdit;
    if (cancelInlineEventId) {
      event.preventDefault();
      cancelInlineControl.blur?.();
      state.inlineEditingEventId = "";
      renderWithoutJump();
      return;
    }
    const editEventId = event.target?.closest?.("[data-edit-event]")?.dataset?.editEvent;
    if (editEventId) {
      startEventEdit(editEventId);
      return;
    }
    const editStakeholderId = event.target?.closest?.("[data-edit-stakeholder]")?.dataset?.editStakeholder;
    if (editStakeholderId) {
      startStakeholderEdit(editStakeholderId);
      return;
    }
    const id = event.target?.dataset?.deleteEvent;
    if (id) {
      state.events = state.events.filter((item) => item.id !== id);
      state.decisions = state.decisions.filter((item) => item.eventId !== id);
      if (state.selectedEventId === id) state.selectedEventId = "";
      if (state.inlineEditingEventId === id) state.inlineEditingEventId = "";
      render();
    }
    const stakeholderId = event.target?.dataset?.deleteStakeholder;
    if (stakeholderId) {
      state.stakeholders = state.stakeholders.filter((item) => item.id !== stakeholderId);
      state.events = state.events.map((item) => ({ ...item, actorIds: normalizeActorIds((item.actorIds || []).filter((id) => id !== stakeholderId)) }));
      state.decisions = state.decisions.map((item) => ({ ...item, actorIds: normalizeActorIds((item.actorIds || []).filter((id) => id !== stakeholderId)) }));
      if (state.timelinePrimaryActorId === stakeholderId) state.timelinePrimaryActorId = "A001";
      state.timelineCompareActorIds = normalizeCompareActorIds(state.timelineCompareActorIds.filter((id) => id !== stakeholderId), state.timelinePrimaryActorId);
      state.inlineEditingEventId = "";
      render();
    }
  });

  $("#clearEvents").addEventListener("click", () => {
    if (confirm("清除目前瀏覽器裡的事件與決策／處遇？")) {
      state.events = [];
      state.decisions = [];
      state.selectedEventId = "";
      state.inlineEditingEventId = "";
      exitEventEdit();
      render();
    }
  });

  $("#aiInputForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = String($("#aiCombinedText").value || "").trim();
    await analyzeIntakeText(text);
  });

  $("#fileInput").addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    $("#fileStatus").textContent = `讀取 ${files.length} 個檔案中...`;
    const results = [];
    for (const file of files) results.push(await extractFileText(file));
    const usableText = results.map((item) => item.text).filter(Boolean).join("\n\n");
    $("#aiCombinedText").value = [$("#aiCombinedText").value, usableText].map((part) => part.trim()).filter(Boolean).join("\n\n");
    $("#fileStatus").textContent = results.map((item) => `${item.name}: ${item.note}`).join("；");
  });

  $("#startVoice").addEventListener("click", startVoiceInput);
  $("#stopVoice").addEventListener("click", stopVoiceInput);

  $("#clearDrafts").addEventListener("click", () => {
    state.drafts = [];
    render();
  });

  $("#draftList").addEventListener("input", (event) => updateDraftFromField(event.target));
  $("#draftList").addEventListener("change", (event) => updateDraftFromField(event.target));
  $("#draftList").addEventListener("click", (event) => {
    const control = event.target?.closest?.("button");
    const card = event.target?.closest?.("[data-draft-card]");
    const cardIndex = card ? Number(card.dataset.draftCard) : NaN;
    const confirmIndex = control?.dataset?.confirmDraft;
    const discardIndex = control?.dataset?.discardDraft;
    const splitIndex = control?.dataset?.splitDraft;
    const mergeIndex = control?.dataset?.mergeNextDraft;
    const nextDraftIndex = control?.dataset?.nextDraft;
    const addActorLabel = control?.dataset?.addDraftActor;
    const linkActorId = control?.dataset?.linkDraftActor;
    if (addActorLabel && Number.isInteger(cardIndex)) {
      addDraftActorAsStakeholder(cardIndex, addActorLabel);
      return;
    }
    if (linkActorId && Number.isInteger(cardIndex)) {
      linkDraftActor(cardIndex, linkActorId);
      return;
    }
    if (splitIndex !== undefined) {
      splitDraft(Number(splitIndex));
      return;
    }
    if (mergeIndex !== undefined) {
      mergeDraftWithNext(Number(mergeIndex), Number(nextDraftIndex));
      return;
    }
    if (confirmIndex !== undefined) confirmDraft(Number(confirmIndex));
    if (discardIndex !== undefined) {
      state.drafts.splice(Number(discardIndex), 1);
      render();
    }
  });

  $("#resetSample").addEventListener("click", () => {
    exitEventEdit();
    loadExamplePack();
  });

  $("#clearExamplePack").addEventListener("click", () => {
    exitEventEdit();
    clearExamplePack();
  });

  $("#resetChecks").addEventListener("click", () => {
    state.checks = safetyItems.map(([name]) => ({ name, status: "通過" }));
    render();
  });

  $("#safetyList").addEventListener("change", (event) => {
    const index = Number(event.target.dataset.checkIndex);
    if (Number.isFinite(index)) {
      state.checks[index] = { name: safetyItems[index][0], status: event.target.value };
      render();
    }
  });

  $("#downloadExcel").addEventListener("click", () => {
    const blob = buildXlsx();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-timeline-tool-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $("#downloadTimelineSvg")?.addEventListener("click", () => downloadTimelineSvg());
  $("#downloadTimelinePng")?.addEventListener("click", () => downloadTimelinePng());
}

async function analyzeIntakeText(text) {
  const cleanText = String(text || "").trim();
  if (cleanText.length < 6) {
    setAiStatus("請先輸入或匯入足夠文字。");
    setQuickStatus("請先輸入或匯入足夠文字。");
    return null;
  }
  setAiStatus("整理中；完成後會先放入修改編輯區。");
  setQuickStatus("整理中；完成後會先把初稿顯示在生命脈絡圖上。");
  let analysis = null;
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, locale: "zh-Hant-TW", lanes })
    });
    if (response.ok) analysis = await response.json();
  } catch (_) {
    analysis = null;
  }
  const drafts = normalizeAnalysisDrafts(analysis, cleanText);
  state.drafts = [...drafts, ...state.drafts].slice(0, 20);
  render();
  const mode = analysis?.mode === "gemini"
    ? "Gemini 輔助整理"
    : analysis?.mode === "openai"
      ? "AI 輔助整理"
      : "初步規則整理";
  const status = `${mode}完成：產生 ${drafts.length} 筆可修改內容。請社工逐筆確認後再加入時間軸。`;
  setAiStatus(status);
  setQuickStatus(status);
  return { count: drafts.length, mode, drafts };
}

function hasModelAnalysis(analysis) {
  return ["gemini", "openai"].includes(analysis?.mode);
}

function normalizeAnalysisDrafts(analysis, fallbackText) {
  const eventDrafts = Array.isArray(analysis?.events)
    ? analysis.events.flatMap((item) => expandCompoundEventDraft(normalizeEventDraft(item)))
    : [];
  const apiDrafts = [
    ...eventDrafts,
    ...(Array.isArray(analysis?.decisions) ? analysis.decisions.map((item) => normalizeDecisionDraft(item)) : [])
  ].filter(Boolean);
  if (hasModelAnalysis(analysis) && apiDrafts.length) return apiDrafts;
  return localSemanticDrafts(fallbackText);
}

function expandCompoundEventDraft(draft) {
  if (!draft || draft.type !== "event") return [];
  const source = [draft.sourceText, draft.fact].filter(Boolean).join("\n");
  const pieces = uniqueTextList(splitIntakeSegments(source)).filter((piece) => {
    const normalizedPiece = normalizeComparableText(piece);
    const normalizedWhole = normalizeComparableText(source);
    return normalizedPiece && normalizedPiece !== normalizedWhole;
  });
  const shouldSplit = pieces.length > 1 && (
    countActorCues(source) > 1 ||
    countYearCues(source) > 1 ||
    countAmountCues(source) > 1 ||
    pieces.some((piece) => detectLane(piece) !== normalizeLane(draft.lane))
  );
  if (!shouldSplit) return [draft];
  return pieces.slice(0, 8).map((piece) => normalizeEventDraftFromSplit(draft, piece, ""));
}

function normalizeEventDraft(item) {
  if (!item) return null;
  const text = [item.sourceText, item.title, item.fact, item.voice].join(" ");
  const lane = normalizeLane(item.lane || detectLane(text));
  const period = extractPeriod(text);
  return {
    type: "event",
    rocYear: item.rocYear || period.rocYear || "",
    endRocYear: item.endRocYear || period.endRocYear || "",
    ongoing: Boolean(item.ongoing || period.ongoing),
    age: item.age || "",
    lane,
    relatedLanes: normalizeRelatedLanes(item.relatedLanes, lane),
    extraTags: item.extraTags || "",
    title: item.title || "待確認事件",
    fact: item.fact || "",
    voice: item.voice || "",
    impact: item.impact || guideForLane(lane).decisionMeaning,
    unknowns: item.unknowns || guideForLane(lane).lookFor,
    sensitivity: item.sensitivity || defaultSensitivity(lane),
    confidence: item.confidence || "低",
    source: "AI 匯入草稿",
    nextStep: normalizeClarificationText(item.nextStep || "社工確認人事時地物與歷程面向後歸檔。", lane),
    actorText: item.actorText || detectActorText(text),
    actorIds: matchActorIds(item.actorText || text),
    place: item.place || extractPlace(text),
    objects: item.objects || extractObjects(text),
    sourceText: item.sourceText || item.fact || text
  };
}

function normalizeDecisionDraft(item) {
  if (!item) return null;
  return {
    type: "decision",
    eventId: item.eventId || "",
    question: item.question || "待確認討論問題",
    options: item.options || "待補當時可行選項",
    fear: item.fear || "待補最大擔心",
    interpretation: item.interpretation || "待補脈絡解讀",
    confidence: item.confidence || "低"
  };
}

function localSemanticDrafts(text) {
  const segments = splitIntakeSegments(text);
  const eventLike = segments.filter(isUsefulEventSentence);
  const selected = (eventLike.length ? eventLike : segments).slice(0, 10);
  if (!selected.length) selected.push(String(text).slice(0, 140));
  const eventDrafts = selected.map((sentence) => {
    const lane = detectLane(sentence);
    const guide = guideForLane(lane);
    const period = extractPeriod(sentence);
    const actorText = detectActorText(sentence);
    return {
      type: "event",
      rocYear: period.rocYear,
      endRocYear: period.endRocYear,
      ongoing: period.ongoing,
      age: extractAge(sentence),
      lane,
      relatedLanes: suggestRelatedLanes(sentence, lane),
      extraTags: suggestExtraTags(sentence, lane),
      title: titleFromSentence(sentence, lane),
      fact: sentence,
      voice: extractVoice(sentence),
      impact: guide.decisionMeaning,
      unknowns: guide.lookFor,
      sensitivity: defaultSensitivity(lane),
      confidence: period.rocYear ? "中" : "低",
      source: "初步整理草稿",
      nextStep: normalizeClarificationText("社工確認人事時地物與歷程面向後歸檔。", lane),
      actorText,
      actorIds: matchActorIds(actorText || sentence),
      place: extractPlace(sentence),
      objects: extractObjects(sentence),
      sourceText: sentence
    };
  });
  const decisionDrafts = /選擇|決定|是否|要不要|協商|搬|工作|繳|還款|借|轉介|申請/.test(text)
    ? [{
        type: "decision",
        eventId: "",
        question: "目前資料中需要釐清的關鍵決策是什麼？",
        options: "維持現況、補文件、連結資源、暫緩、轉介專業、調整支出或還款安排。",
        fear: "可能擔心居住、照顧、工作、福利資格或催收風險被影響。",
        interpretation: "此草稿由本機規則產生；請社工依會談資料確認當時資訊、可行選項與壓力來源。",
        confidence: "低"
      }]
    : [];
  return [...eventDrafts, ...decisionDrafts];
}

function isUsefulEventSentence(sentence) {
  const value = String(sentence || "");
  const hasPeriod = Boolean(extractPeriod(value).rocYear || extractRocYear(value));
  if (hasPeriod) return true;
  if (/^(案主說|需要確認|需確認|目前需要釐清|待確認|是否先|如何在)/.test(value)) return false;
  if (extractObjects(value)) return true;
  const hasDomain = /居住|租屋|搬|工作|就學|伴侶|婚|孩子|照顧|就醫|疾病|健康|低收|補助|社工|資源|卡債|借貸|還款|協商|生活費|負債|債務|金錢/.test(value);
  const hasAction = /改變|轉換|中斷|申請|延遲|增加|下降|搬遷|出生|同住|分居|離婚|就醫|借住|轉介|催收|付款|繳存|提供|支付|支援|負擔|代繳|要求|處理|請假/.test(value);
  return hasDomain && hasAction;
}

function detectLane(text) {
  const value = String(text || "");
  const rules = [
    ["社會資源使用歷程", /低收入戶|中低收入戶|低收|中低收|急難|補助|社工|政府|方案|轉介|法扶|網絡|服務|資格|文件|兒少教育發展帳戶|租金補貼|社宅/],
    ["重大財務事件", /生活費|卡債|信用卡|債|負債|借|借款|借貸|貸款|錢莊|欠|利息|協商|還款|帳戶|存款|保險|財務|金錢|代繳|繳款|催收|\d+(?:\.\d+)?\s*(?:萬元|萬|元|塊)/],
    ["疾病與身心健康史", /疾病|生病|就醫|醫院|診所|門診|診斷|用藥|服藥|身心科|精神科|精神|憂鬱|焦慮|健康|長照|照顧者|失能|醫療|住院|復健/],
    ["感情與家庭史", /感情|交往|婚姻|結婚|離婚|分居|再婚|伴侶|先生|太太|配偶|同居|分手|親密關係/],
    ["就業與就學史", /工作|就業|就學|學校|學歷|職訓|薪水|收入|失業|工時|留停/],
    ["居住遷移史", /居住|租屋|搬家|搬|遷|住宿|戶籍|房租|安置|中途之家|住所/]
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] || "重大財務事件";
}

function guideForLane(lane) {
  const normalized = normalizeLane(lane);
  return historyGuides.find((item) => item.name === normalized) || historyGuides[historyGuides.length - 1];
}

function defaultSensitivity(lane) {
  const normalized = normalizeLane(lane);
  if (normalized === "疾病與身心健康史" || normalized === "重大財務事件") return "高度敏感";
  if (normalized === "感情與家庭史" || normalized === "社會資源使用歷程") return "內部";
  return "一般";
}

function extractRocYear(text) {
  const value = String(text || "");
  const roc = value.match(/民國\s*(\d{2,3})\s*年?/);
  if (roc) return Number(roc[1]);
  const ad = value.match(/(19|20)\d{2}\s*年/);
  if (ad) return Number(ad[0].replace(/\D/g, "")) - 1911;
  const shortYear = value.match(/(^|[^\d])(\d{2,3})\s*年/);
  if (shortYear) return Number(shortYear[2]);
  return "";
}

function extractPeriod(text) {
  const value = String(text || "");
  const ongoing = /至今|迄今|目前|現在仍|仍在|持續/.test(value);
  const adRange = value.match(/((?:19|20)\d{2})\s*年?\s*(?:到|至|~|-|－|—)\s*((?:19|20)\d{2})\s*年?/);
  if (adRange) {
    const start = Number(adRange[1]) - 1911;
    const end = Number(adRange[2]) - 1911;
    return { rocYear: start, endRocYear: end >= start ? end : "", ongoing };
  }
  const rocRange = value.match(/(?:民國\s*)?(\d{2,3})\s*年?\s*(?:到|至|~|-|－|—)\s*(?:民國\s*)?(\d{2,3})\s*年?/);
  if (rocRange) {
    const start = Number(rocRange[1]);
    const end = Number(rocRange[2]);
    return { rocYear: start, endRocYear: end >= start ? end : "", ongoing };
  }
  const start = extractRocYear(value);
  return { rocYear: start, endRocYear: "", ongoing };
}

function extractAge(text) {
  const match = String(text || "").match(/(\d{1,3})\s*歲/);
  return match ? Number(match[1]) : "";
}

function extractVoice(text) {
  const match = String(text || "").match(/[「『\"]([^」』\"]{3,80})[」』\"]/);
  return match ? match[1] : "";
}

function splitIntakeSegments(text) {
  const normalized = String(text || "")
    .replace(/\r/g, "\n")
    .replace(/([。！？!?；;])/g, "$1\n")
    .replace(/[，,]\s*(?=(?:個案|案主|案母|案父|母親|父親|子女|孩子|配偶|伴侶|先生|太太|主要照顧者))/g, "\n")
    .replace(/(戶|資格|補助|生活費|負債|債務|借款|借貸|還款|元|萬元|萬)(?=(?:個案|案主|案母|案父|母親|父親|子女|孩子|配偶|伴侶|先生|太太|主要照顧者))/g, "$1\n")
    .replace(/\s+(?=(?:個案|案主|案母|案父|母親|父親|子女|孩子|配偶|伴侶|先生|太太|主要照顧者))/g, "\n");
  return normalized
    .split(/\n+/)
    .flatMap(splitCompoundSegment)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length >= 4);
}

function splitCompoundSegment(segment) {
  const value = String(segment || "").trim();
  if (!value) return [];
  const actorStart = "(?:個案|案主|案母|案父|母親|父親|子女|孩子|配偶|伴侶|先生|太太|主要照顧者)";
  const normalized = value
    .replace(new RegExp(`([。！？!?；;])\\s*(?=${actorStart})`, "g"), "$1\n")
    .replace(new RegExp(`([，,])\\s*(?=${actorStart})`, "g"), "\n")
    .replace(new RegExp(`(戶|資格|補助|生活費|負債|債務|借款|借貸|還款|元|萬元|萬)(?=${actorStart})`, "g"), "$1\n");
  const pieces = normalized.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  return pieces.length ? pieces : [value];
}

function detectActorText(text) {
  const value = String(text || "");
  const labels = actorCueMap
    .filter(([, pattern]) => pattern.test(value))
    .map(([label]) => label);
  return [...new Set(labels)].join("、");
}

function matchActorIds(text, stakeholders = state?.stakeholders || sampleStakeholders) {
  const value = String(text || "");
  const detected = detectActorText(value).split("、").filter(Boolean);
  const ids = [];
  for (const person of stakeholders) {
    const label = String(person.label || "");
    const relation = String(person.relation || "");
    if (value.includes(label) || detected.includes(label) || detected.some((item) => relation.includes(item) || item.includes(relation))) {
      ids.push(person.id);
    }
  }
  if (/案主|個案|本人|服務對象/.test(value) && stakeholders.some((item) => item.id === "A001")) ids.push("A001");
  return [...new Set(ids)].filter(Boolean);
}

function extractPlace(text) {
  const value = String(text || "");
  const patterns = [
    /(?:戶籍地|戶籍|實際居住地|租屋處|住處|安置處所|中途之家|庇護所|學校|醫院|診所|社福中心|社會局|就服站|銀行|法院|調解會|里辦公處|公所|區公所)/g,
    /(?:在|於)([^，。；;、\s]{2,12}(?:家|處|地|中心|醫院|學校|銀行|法院|公所))/g
  ];
  const found = [];
  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) found.push(match[1] || match[0]);
  }
  return [...new Set(found)].slice(0, 5).join("、");
}

function extractObjects(text) {
  const value = String(text || "");
  const found = [];
  for (const match of value.matchAll(moneyPattern)) found.push(match[1] || match[0]);
  const documentPattern = /(?:債務清冊|借據|帳戶|存摺|薪資單|租約|診斷證明|轉介單|公文|補助資格|中低收入戶|低收入戶|租金補貼|兒少教育發展帳戶)/g;
  for (const match of value.matchAll(documentPattern)) found.push(match[0]);
  return [...new Set(found)].slice(0, 8).join("、");
}

function suggestRelatedLanes(text, primaryLane) {
  const value = String(text || "");
  const lane = normalizeLane(primaryLane);
  const related = [];
  const add = (name) => {
    const normalized = normalizeLane(name);
    if (normalized !== lane) related.push(normalized);
  };
  if (/(?:生活費|負債|借|貸款|還款|債務|金錢|帳戶|\d+(?:\.\d+)?\s*(?:萬元|萬|元|塊))/.test(value)) add("重大財務事件");
  if (/(?:低收入戶|中低收入戶|低收|中低收|補助|社工|轉介|法扶|租金補貼|兒少教育發展帳戶|社宅)/.test(value)) add("社會資源使用歷程");
  if (/(?:工作|就業|就學|學校|收入來源|收入減少|收入中斷|收入不穩|職訓|失業|薪水)/.test(value)) add("就業與就學史");
  if (/(?:居住|租屋|搬|戶籍|房租|安置|同住|借住)/.test(value)) add("居住遷移史");
  if (/(?:疾病|就醫|醫院|診所|門診|診斷|用藥|身心科|精神科|健康|精神|長照|照顧者|住院|復健)/.test(value)) add("疾病與身心健康史");
  if (/(?:感情|交往|婚姻|結婚|離婚|分居|伴侶|配偶|先生|太太|同居|分手)/.test(value)) add("感情與家庭史");
  return [...new Set(related)];
}

function suggestExtraTags(text, primaryLane) {
  const value = String(text || "");
  const tags = [];
  const add = (pattern, tag) => {
    if (pattern.test(value)) tags.push(tag);
  };
  add(/生活費|每月.*元|每月.*萬/, "親友金錢支援");
  add(/負債|債務|欠|借貸|信用卡|卡債/, "債務壓力");
  add(/中低收入戶|低收入戶|低收|中低收/, "福利身分");
  add(/租金補貼|房租|租屋/, "居住成本");
  add(/兒少教育發展帳戶|教育帳戶|孩子/, "兒少資產形成");
  add(/社工|轉介|法扶|公所|社福/, "網絡資源");
  add(/工作|就業|失業|薪水|收入來源|收入減少|收入中斷|收入不穩/, "收入穩定度");
  add(/婚姻|離婚|分居|伴侶|配偶|交往/, "親密關係");
  if (normalizeLane(primaryLane) !== "感情與家庭史" && /案父|案母|母親|父親|親屬/.test(value)) tags.push("家庭支持/壓力");
  return [...new Set(tags)].join("、");
}

function countActorCues(text) {
  return detectActorText(text).split("、").filter(Boolean).length;
}

function countYearCues(text) {
  const value = String(text || "");
  const matches = [
    ...value.matchAll(/(?:民國\s*)?\d{2,3}\s*年/g),
    ...value.matchAll(/(?:19|20)\d{2}\s*年/g)
  ];
  return new Set(matches.map((match) => match[0].replace(/\s/g, ""))).size;
}

function countAmountCues(text) {
  return new Set([...String(text || "").matchAll(moneyPattern)].map((match) => match[1] || match[0])).size;
}

function similarText(a, b) {
  const left = normalizeComparableText(a);
  const right = normalizeComparableText(b);
  if (!left || !right) return false;
  if (left.includes(right.slice(0, 12)) || right.includes(left.slice(0, 12))) return true;
  const leftTokens = new Set(left.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z0-9]+/g) || []);
  const rightTokens = new Set(right.match(/[\u4e00-\u9fff]{2,}|[a-zA-Z0-9]+/g) || []);
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap >= 2;
}

function normalizeComparableText(text) {
  return String(text || "").replace(/[^\u4e00-\u9fffa-zA-Z0-9]/g, "").slice(0, 80);
}

function titleFromSentence(sentence, lane) {
  const cleaned = String(sentence || "").replace(/[，。！？、；:：]/g, " ").replace(/\s+/g, " ").trim();
  const title = cleaned.slice(0, 18);
  return title ? `${lane}：${title}` : `${lane}草稿`;
}

function setAiStatus(message) {
  const target = $("#aiStatus");
  if (target) target.textContent = message;
}

async function extractFileText(file) {
  const name = file.name || "未命名檔案";
  const ext = name.toLowerCase().split(".").pop() || "";
  if (["txt", "csv", "md"].includes(ext) || file.type.startsWith("text/")) {
    return { name, text: await file.text(), note: "已讀取文字內容" };
  }
  if (["pdf", "docx", "xlsx"].includes(ext)) {
    try {
      return await extractFileTextViaApi(file);
    } catch (_) {
      // Local static previews do not expose Vercel API routes; fall back to manual summary guidance.
    }
  }
  if (ext === "pdf") {
    const raw = await file.text();
    const extracted = raw.replace(/[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9，。！？；、：\s]/g, " ").replace(/\s+/g, " ").trim();
    if (extracted.length > 80) return { name, text: `檔案：${name}\n${extracted.slice(0, 8000)}`, note: "已做 PDF 粗略文字抽取" };
    return { name, text: `檔案：${name}\nPDF 已上傳，但目前無法可靠抽取文字；掃描影像 PDF 請先 OCR 或貼上摘要。`, note: "PDF 需文字層或 OCR" };
  }
  if (["doc", "docx", "xls", "xlsx"].includes(ext)) {
    return { name, text: `檔案：${name}\nWord/Excel 已選取；DOCX/XLSX 可由系統嘗試抽取，舊版 DOC/XLS 請轉存或貼上摘要文字。`, note: "Word/Excel 需可讀格式" };
  }
  return { name, text: `檔案：${name}\n檔案類型尚未支援自動抽取，請貼上摘要文字。`, note: "類型未支援" };
}

async function extractFileTextViaApi(file) {
  const base64 = await fileToBase64(file);
  const response = await fetch("/api/extract-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      mimeType: file.type,
      base64
    })
  });
  if (!response.ok) throw new Error("file extract api unavailable");
  const result = await response.json();
  return {
    name: result.name || file.name,
    text: `檔案：${result.name || file.name}\n${result.text || ""}`,
    note: result.note || "已抽取檔案文字"
  };
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

let voiceRecognition = null;

function startVoiceInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    setAiStatus("此瀏覽器不支援內建語音辨識；可以先用文字貼上。");
    return;
  }
  voiceRecognition = new Recognition();
  voiceRecognition.lang = "zh-TW";
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
    }
    if (finalText) {
      $("#aiCombinedText").value = [$("#aiCombinedText").value, finalText].map((part) => part.trim()).filter(Boolean).join("\n");
    }
  };
  voiceRecognition.onerror = () => setAiStatus("語音辨識中斷；可改用貼上文字。");
  voiceRecognition.onstart = () => setAiStatus("語音輸入中；請先使用去識別或測試資料，真實個資需依機構規範處理。");
  voiceRecognition.onend = () => setAiStatus("語音輸入已停止。");
  voiceRecognition.start();
}

function stopVoiceInput() {
  if (voiceRecognition) voiceRecognition.stop();
}

function timelineExportEvents() {
  return visibleTimelineGraphEvents().filter(eventHasTimelineYear);
}

function buildTimelineSvgExport() {
  const events = timelineExportEvents();
  const policyEvents = state.showContextTimeline ? contextTimelineRows : [];
  const years = [
    ...events.flatMap((event) => [eventStartYear(event), eventEndYear(event)]),
    ...policyEvents.map((item) => Number(item.rocYear))
  ].filter(Boolean);
  const minYear = Math.min(...years, currentRocYear());
  const maxYear = Math.max(...years, currentRocYear());
  const span = Array.from({ length: maxYear - minYear + 1 }, (_, index) => minYear + index);
  const yearWidth = 92;
  const labelWidth = 154;
  const chartPadding = 22;
  const headerHeight = 58;
  const trackHeight = 58;
  const laneRows = (state.timelineLaneFilter === "all" ? lanes : [state.timelineLaneFilter])
    .map((lane) => {
      const laneEvents = events
        .filter((event) => normalizeLane(event.lane) === lane)
        .sort((a, b) => eventStartYear(a) - eventStartYear(b) || String(a.id).localeCompare(String(b.id), "zh-Hant"));
      const assigned = assignTimelineTracks(laneEvents);
      return {
        lane,
        items: assigned.items,
        trackCount: Math.max(assigned.trackCount, laneEvents.length ? 1 : 1)
      };
    })
    .filter((row) => row.items.length || state.timelineLaneFilter !== "all");
  if (state.showContextTimeline) {
    laneRows.push({
      lane: policyLaneName,
      items: policyEvents.map((item, index) => ({
        event: {
          id: item.id,
          title: item.topic,
          rocYear: Number(item.rocYear),
          endRocYear: "",
          ongoing: false,
          lane: policyLaneName,
          fact: item.use,
          actorIds: ["A001"],
          isPolicyReference: true
        },
        track: index + 1
      })),
      trackCount: Math.max(policyEvents.length, 1)
    });
  }
  const emptyMessage = !laneRows.length || !events.length;
  const contentWidth = span.length * yearWidth;
  const width = Math.max(900, labelWidth + contentWidth + chartPadding * 2);
  const rowHeights = laneRows.map((row) => Math.max(76, 30 + row.trackCount * trackHeight));
  const height = Math.max(360, chartPadding * 2 + headerHeight + rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) + 58);
  const yearLabel = (year) => `${state.yearMode === "ad" ? year + 1911 : year}年`;
  let y = chartPadding + headerHeight;
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="生命脈絡圖">`,
    `<rect width="100%" height="100%" fill="#fffdf8"/>`,
    `<text x="${chartPadding}" y="30" fill="#26312f" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="20" font-weight="700">個案生命脈絡圖</text>`,
    `<text x="${chartPadding}" y="50" fill="#65716d" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="12">實線為正式事件，虛線為 AI 初稿；內容仍需社工確認後歸檔。</text>`,
    `<rect x="${chartPadding}" y="${chartPadding + 40}" width="${labelWidth}" height="${headerHeight - 40}" fill="#eaf2ec" stroke="#d7e0d8"/>`
  ];
  span.forEach((year, index) => {
    const x = chartPadding + labelWidth + index * yearWidth;
    parts.push(`<rect x="${x}" y="${chartPadding + 40}" width="${yearWidth}" height="${headerHeight - 40}" fill="#eaf2ec" stroke="#d7e0d8"/>`);
    parts.push(`<text x="${x + yearWidth / 2}" y="${chartPadding + 54}" text-anchor="middle" fill="#26312f" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="12" font-weight="700">${xmlEsc(yearLabel(year))}</text>`);
  });
  if (emptyMessage) {
    parts.push(`<text x="${chartPadding}" y="${y + 48}" fill="#65716d" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="16">目前沒有可輸出的時間軸事件；請先生成初稿或新增事件。</text>`);
  } else {
    laneRows.forEach((row, rowIndex) => {
      const rowHeight = rowHeights[rowIndex];
      parts.push(`<rect x="${chartPadding}" y="${y}" width="${labelWidth}" height="${rowHeight}" fill="#f6fbf7" stroke="#d7e0d8"/>`);
      parts.push(`<text x="${chartPadding + labelWidth / 2}" y="${y + rowHeight / 2 + 5}" text-anchor="middle" fill="#26312f" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="13" font-weight="700">${xmlEsc(row.lane)}</text>`);
      span.forEach((_, index) => {
        const x = chartPadding + labelWidth + index * yearWidth;
        parts.push(`<rect x="${x}" y="${y}" width="${yearWidth}" height="${rowHeight}" fill="#fffefb" stroke="#d7e0d8"/>`);
      });
      row.items.forEach(({ event, track }) => {
        const style = timelineExportStyle(event);
        const start = eventStartYear(event);
        const end = eventEndYear(event) || start;
        const x = chartPadding + labelWidth + (start - minYear) * yearWidth + 8;
        const eventY = y + 16 + (track - 1) * trackHeight;
        const eventWidth = Math.max(74, (end - start + 1) * yearWidth - 16);
        const dash = event.isDraftPreview ? ` stroke-dasharray="7 5"` : "";
        parts.push(`<rect x="${x}" y="${eventY}" rx="8" ry="8" width="${eventWidth}" height="44" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2"${dash}/>`);
        parts.push(`<rect x="${x}" y="${eventY}" rx="8" ry="8" width="6" height="44" fill="${style.stroke}"/>`);
        if (event.isDraftPreview) parts.push(`<text x="${x + 14}" y="${eventY + 14}" fill="#7c4a03" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="10" font-weight="700">AI 初稿</text>`);
        svgTextLines(event.title, x + 14, eventY + (event.isDraftPreview ? 29 : 20), eventWidth - 24, {
          size: 12,
          weight: 700,
          fill: "#26312f",
          maxLines: 1
        }).forEach((line) => parts.push(line));
        parts.push(`<text x="${x + 14}" y="${eventY + 38}" fill="#65716d" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="10">${xmlEsc(eventPeriodText(event))}</text>`);
      });
      y += rowHeight;
    });
  }
  parts.push(`<text x="${chartPadding}" y="${height - 24}" fill="#65716d" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="11">由個案時間軸整理工具產生；請勿放入可識別真實個案資料。</text>`);
  parts.push("</svg>");
  return { svg: parts.join(""), width, height, eventCount: events.length };
}

function timelineExportStyle(event) {
  if (event.isPolicyReference) return { fill: "#f3f4f1", stroke: "#6b7280" };
  return ({
    residence: { fill: "#ede9fe", stroke: "#7c3aed" },
    work: { fill: "#e0f2fe", stroke: "#0369a1" },
    relationship: { fill: "#e6f0e5", stroke: "#5f8a62" },
    health: { fill: "#ffe4e6", stroke: "#be123c" },
    resource: { fill: "#e2edf5", stroke: "#3f6f96" },
    money: { fill: "#fbefd7", stroke: "#9c6f25" }
  })[laneClass(event.lane)] || { fill: "#dcefe9", stroke: "#2f7d73" };
}

function svgTextLines(text, x, y, width, options = {}) {
  const size = options.size || 12;
  const approxChars = Math.max(6, Math.floor(width / (size * 0.95)));
  const source = String(text || "未命名事件").replace(/\s+/g, "");
  const lines = [];
  for (let index = 0; index < source.length && lines.length < (options.maxLines || 2); index += approxChars) {
    lines.push(source.slice(index, index + approxChars));
  }
  return lines.map((line, index) => `<text x="${x}" y="${y + index * (size + 3)}" fill="${options.fill || "#26312f"}" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="${size}" font-weight="${options.weight || 400}">${xmlEsc(line)}</text>`);
}

function xmlEsc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  })[ch]);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadTimelineSvg() {
  const { svg } = buildTimelineSvgExport();
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `case-timeline-${new Date().toISOString().slice(0, 10)}.svg`);
}

function downloadTimelinePng() {
  const { svg, width, height } = buildTimelineSvgExport();
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  const image = new Image();
  image.onload = () => {
    const scale = Math.min(2, Math.max(1, 1600 / width));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    context.fillStyle = "#fffdf8";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (blob) downloadBlob(blob, `case-timeline-${new Date().toISOString().slice(0, 10)}.png`);
    }, "image/png");
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    alert("圖檔產生失敗，請改下載 SVG。");
  };
  image.src = url;
}

function buildXlsx() {
  const sheets = [
    {
      name: "事件時間軸",
      rows: [
        ["ID", "開始民國年", "結束民國年", "是否持續", "期間顯示", "開始西元年", "結束西元年", "年齡", "主要歷程面向", "相關歷程面向", "補充標籤", "事件標題", "事件事實", "案主說法", "事件人物（同住人口）", "辨識人物", "地點/窗口", "金額/文件/資源", "原文依據", "脈絡影響", "待釐清", "來源", "信心", "建議多確認"],
        ...state.events.map((e) => [e.id, e.rocYear, e.endRocYear || "", e.ongoing ? "是" : "否", eventPeriodText(e), rocToAd(e.rocYear), rocToAd(eventEndYear(e)), e.age, normalizeLane(e.lane), (e.relatedLanes || []).join("、"), e.extraTags || "", e.title, e.fact, e.voice, stakeholderNames(e.actorIds), e.actorText || "", e.place || "", e.objects || "", e.sourceText || "", e.impact || "", e.unknowns || "", e.source, e.confidence, clarificationText(e)])
      ]
    },
    {
      name: "決策／處遇卡",
      rows: [
        ["ID", "連結事件", "討論問題", "相關同住人口", "當時可行選項", "最大擔心", "脈絡解讀"],
        ...state.decisions.map((d) => [d.id, d.eventId, d.question, stakeholderNames(d.actorIds), d.options, d.fear, d.interpretation])
      ]
    },
    {
      name: "同住人口",
      rows: [
        ["ID", "稱謂或角色", "與案主關係", "同住狀態", "居住/照顧脈絡"],
        ...state.stakeholders.map((item) => [item.id, item.label, item.relation, item.stance, item.notes])
      ]
    },
    {
      name: "修改編輯",
      rows: [
        ["類型", "主要歷程/連結事件", "相關歷程面向", "補充標籤", "開始民國年", "結束民國年", "是否持續", "標題/問題", "事實/選項", "案主說法/最大擔心", "辨識人物", "地點/窗口", "金額/文件/資源", "原文依據", "脈絡影響", "待釐清/解讀", "信心"],
        ...state.drafts.map((draft) => draft.type === "event"
          ? ["事件", normalizeLane(draft.lane), (draft.relatedLanes || []).join("、"), draft.extraTags || "", draft.rocYear || "", draft.endRocYear || "", draft.ongoing ? "是" : "否", draft.title, draft.fact, draft.voice, draft.actorText || "", draft.place || "", draft.objects || "", draft.sourceText || "", draft.impact, draft.unknowns, draft.confidence]
          : ["決策", draft.eventId, "", "", "", "", "", draft.question, draft.options, draft.fear, "", "", "", "", "", draft.interpretation, draft.confidence || "低"])
      ]
    },
    {
      name: "六大歷程解讀",
      rows: [
        ["歷程", "整理重點", "觀察線索", "決策解讀", "資料界線"],
        ...historyGuides.map((item) => [item.name, item.focus, item.lookFor, item.decisionMeaning, item.caution])
      ]
    },
    {
      name: "台灣制度背景",
      rows: [
        ["ID", "主題", "時間/制度", "民國參考年", "用途", "來源", "目前加入視覺時間軸"],
        ...contextTimelineRows.map((item) => [item.id, item.topic, item.period, item.rocYear, item.use, item.source, state.showContextTimeline ? "是" : "否"])
      ]
    },
    {
      name: "研究依據摘要",
      rows: [["來源類型", "研究觀察", "工具設計回應"], ...researchRows]
    },
    {
      name: "分享前檢查",
      rows: [["項目", "檢查內容", "狀態"], ...safetyItems.map(([name, description], index) => [name, description, state.checks[index]?.status || "通過"])]
    },
    {
      name: "非責備語言",
      rows: [["避免用語", "建議用語"], ...languageRows]
    }
  ];

  const files = {};
  files["[Content_Types].xml"] = contentTypes(sheets.length);
  files["_rels/.rels"] = rootRels();
  files["docProps/core.xml"] = coreProps();
  files["docProps/app.xml"] = appProps(sheets.map((s) => s.name));
  files["xl/workbook.xml"] = workbookXml(sheets.map((s) => s.name));
  files["xl/_rels/workbook.xml.rels"] = workbookRels(sheets.length);
  sheets.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = worksheetXml(sheet.rows);
  });
  return new Blob([zipFiles(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function xml(text) {
  return String(text ?? "").replace(/[<>&'"]/g, (ch) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[ch]);
}

function columnName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function worksheetXml(rows) {
  const sheetData = rows.map((row, r) => {
    const cells = row.map((value, c) => {
      const ref = `${columnName(c)}${r + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}" t="n"><v>${value}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`;
}

function contentTypes(count) {
  let overrides = "";
  for (let i = 1; i <= count; i++) {
    overrides += `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${overrides}
</Types>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function workbookXml(names) {
  const sheets = names.map((name, i) => `<sheet name="${xml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function workbookRels(count) {
  let rels = "";
  for (let i = 1; i <= count; i++) {
    rels += `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function coreProps() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>個案時間軸整理工具</dc:title>
  <dc:creator>Case Timeline Tool</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function appProps(names) {
  const titles = names.map((name) => `<vt:lpstr>${xml(name)}</vt:lpstr>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Case Timeline Tool</Application>
  <TitlesOfParts><vt:vector size="${names.length}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts>
</Properties>`;
}

function zipFiles(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(text);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, Object.keys(files).length, true);
  ev.setUint16(10, Object.keys(files).length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, eocd]);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

bindEvents();
render();

window.caseTimelineTool = {
  get state() {
    return state;
  },
  exportProbe() {
    const blob = buildXlsx();
    const relationCounts = timelineRelationCounts();
    const timelineSvg = buildTimelineSvgExport();
    return {
      version: state.version,
      eventCount: state.events.length,
      decisionCount: state.decisions.length,
      stakeholderCount: state.stakeholders.length,
      draftCount: state.drafts.length,
      selectedActorCount: selectedTimelineActorIds().length,
      filteredEventCount: filteredTimelineEvents().length,
      primaryAxisEventCount: relationCounts.primary,
      compareAxisEventCount: relationCounts.compare,
      sharedAxisEventCount: relationCounts.shared,
      caseAxisEventCount: relationCounts.case,
      policyTimelineCount: state.showContextTimeline ? contextTimelineRows.length : 0,
      timelineDecisionCount: visibleTimelineDecisionItems(filteredTimelineEvents().filter(eventHasTimelineYear)).length,
      timelineDraftPreviewCount: draftTimelinePreviewEvents().length,
      timelineSvgSize: timelineSvg.svg.length,
      timelineSvgEventCount: timelineSvg.eventCount,
      savedRecordCount: savedRecords.length,
      workbenchOpen: !document.querySelector("#workbenchPanel")?.hidden,
      durationEventCount: state.events.filter((event) => eventEndYear(event) > eventStartYear(event)).length,
      exampleEventCount: state.events.filter(isExampleItem).length,
      exampleStakeholderCount: state.stakeholders.filter(isExampleItem).length,
      historyCoverage: new Set(state.events.map((e) => normalizeLane(e.lane)).filter((lane) => lanes.includes(lane))).size,
      sheetCount: workbookSheetNames.length,
      historyGuideCount: historyGuides.length,
      researchRows: researchRows.length,
      workbookSheetNames,
      xlsxSize: blob.size,
      mimeType: blob.type
    };
  }
};
