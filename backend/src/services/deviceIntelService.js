import { DeviceInsight } from "../models/deviceInsightModel.js";
import { WarrantyTicket } from "../models/warrantyTicketModel.js";
import { IS_DB_CONNECTED } from "../config/mongodb.js";
import { normalizeVietnamese } from "../utils/formatters.js";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 giờ
const FETCH_TIMEOUT_MS = 8500;

/**
 * Bản đồ cộng đồng chính hãng (Official English Brand Communities) & API hỗ trợ
 */
const BRAND_COMMUNITIES = [
  {
    brand: "Acer",
    match: /\b(acer|nitro|predator|aspire|swift|helios)\b/i,
    communityLabel: "Acer Community",
    communitySites: ["community.acer.com"],
    vanillaApiBase: "https://community.acer.com/en/api/v2/search",
    subreddits: ["AcerNitro", "Acer"],
  },
  {
    brand: "Dell",
    match: /\b(dell|xps|ultrasharp|alienware|inspiron|latitude|precision)\b/i,
    communityLabel: "Dell Community",
    communitySites: ["dell.com/community"],
    subreddits: ["Dell", "DellXPS"],
  },
  {
    brand: "Apple",
    match: /\b(apple|macbook|iphone|ipad|imac|airpods|mac mini|apple watch)\b/i,
    communityLabel: "Apple Discussions",
    communitySites: ["discussions.apple.com"],
    subreddits: ["macbookpro", "iphone", "applehelp"],
  },
  {
    brand: "Lenovo",
    match: /\b(lenovo|thinkpad|legion|ideapad|yoga|loq)\b/i,
    communityLabel: "Lenovo Forums",
    communitySites: ["forums.lenovo.com"],
    subreddits: ["Lenovo", "thinkpad", "LenovoLegion"],
  },
  {
    brand: "ASUS",
    match: /\b(asus|rog|zephyrus|strix|tuf|zenbook|vivobook)\b/i,
    communityLabel: "ASUS / ROG Forum",
    communitySites: ["rog-forum.asus.com", "zentalk.asus.com"],
    subreddits: ["ASUS", "ASUSROG"],
  },
  {
    brand: "HP",
    match: /\b(hp|victus|omen|spectre|envy|pavilion|elitebook)\b/i,
    communityLabel: "HP Support Community",
    communitySites: ["h30434.www3.hp.com"],
    subreddits: ["Hewlett_Packard", "HPOmen"],
  },
  {
    brand: "Samsung",
    match: /\b(samsung|galaxy|odyssey)\b/i,
    communityLabel: "Samsung Community",
    communitySites: ["us.community.samsung.com", "eu.community.samsung.com"],
    subreddits: ["samsung", "GalaxyBook"],
  },
  {
    brand: "Sony",
    match: /\b(sony|wh-1000|wf-1000|bravia|xperia|playstation|ps5)\b/i,
    communityLabel: "Sony Community",
    communitySites: ["us.community.sony.com"],
    subreddits: ["sony", "SonyHeadphones"],
  },
  {
    brand: "MSI",
    match: /\b(msi|katana|stealth|raider|cyborg|thin gf)\b/i,
    communityLabel: "MSI Forum",
    communitySites: ["forum-en.msi.com"],
    subreddits: ["MSILaptops"],
  },
];

export const detectBrandCommunity = (deviceName = "") => {
  const norm = normalizeVietnamese(deviceName);
  return BRAND_COMMUNITIES.find((b) => b.match.test(norm)) || null;
};

/**
 * Rút gọn tên thiết bị dài để tìm bài viết & diễn đàn chuẩn xác hơn.
 */
export const cleanDeviceSearchQuery = (raw = "") => {
  const withoutParens = String(raw || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(chinh hang|vn\/a|wireless|chong on|do hoa|titan tu nhien|laptop|dien thoai|man hinh|tai nghe)\b/gi, " ")
    .replace(/\b\d+\s?(gb|tb|inch|hz|w)\b/gi, " ")
    .replace(/[|/\\]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return withoutParens.split(" ").slice(0, 5).join(" ").trim() || String(raw || "").trim();
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "User-Agent": "WarrantyOpsBot/2.1 (+https://warrantyops.local)",
        Accept: "application/json, application/xml, text/xml, */*",
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
};

const decodeXmlEntities = (str = "") =>
  String(str)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractFirstImageUrl = (html = "") => {
  const m =
    String(html || "").match(/<media:content[^>]+url=["']([^"']+)["']/i) ||
    String(html || "").match(/<enclosure[^>]+url=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i) ||
    String(html || "").match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  const url = m?.[1] || "";
  if (!url || /googleusercontent\.com\/.*favicon|1x1|pixel/i.test(url)) return "";
  return url;
};

const parseGoogleNewsRss = (xml = "", { channel = "news", lang = "en", fallbackSource = "Google News" } = {}) => {
  const items = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  // Đọc tối đa 45 item để không bỏ lỡ bài mới nhất (Google News RSS không luôn xếp theo thời gian)
  for (const block of itemMatches.slice(0, 45)) {
    const title = decodeXmlEntities((block.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "");
    const link = decodeXmlEntities((block.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || "");
    const pubDate = decodeXmlEntities((block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
    const source =
      decodeXmlEntities((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || "") ||
      fallbackSource;
    const rawDesc = (block.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || "";
    const description = decodeXmlEntities(rawDesc);
    const imageUrl = extractFirstImageUrl(block);

    const parsedDate = pubDate ? new Date(pubDate) : null;
    const validIso =
      parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString().slice(0, 10) : "";

    if (title && link) {
      items.push({
        title: title.replace(/\s+-\s+[^-]+$/, "").trim(),
        source,
        channel,
        lang,
        publishedAt: validIso,
        url: link,
        imageUrl,
        snippet: description.slice(0, 220),
      });
    }
  }
  return items;
};

/**
 * 1A. Thu thập trực tiếp từ API cộng đồng chính hãng (VD: Acer Community Vanilla API v2 — bài tiếng Anh mới nhất!)
 */
const collectBrandDirectApi = async (query, brandInfo) => {
  if (!brandInfo?.vanillaApiBase) return [];
  const url = `${brandInfo.vanillaApiBase}?query=${encodeURIComponent(query)}&types[]=discussion&locale=en&sort=-dateInserted&limit=12`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const list = await res.json();
  if (!Array.isArray(list)) return [];

  return list
    .filter(
      (d) =>
        d?.name &&
        d?.url &&
        !/\/(es|fr|de|pt|ru|tr)\//i.test(String(d.url)) &&
        !/\b(actualizacion|arranque|ayuda|pantalla|bateria|problema con)\b/i.test(String(d.name))
    )
    .map((d) => ({
      title: String(d.name).replace(/^Re:\s*/i, "").trim(),
      source: brandInfo.communityLabel,
      channel: "brand_community",
      lang: "en",
      publishedAt: d.dateInserted ? String(d.dateInserted).slice(0, 10) : "",
      url: String(d.url).split("?")[0],
      imageUrl: extractFirstImageUrl(d.body || ""),
      snippet: decodeXmlEntities(d.body || "").slice(0, 240),
      _verifiedThread: true,
    }));
};

/**
 * 1B. Thu thập bài tiếng Anh từ Official Brand Community qua Google News RSS (Dell, Apple, Lenovo, ASUS, HP, Samsung, Sony, MSI...)
 */
const collectOfficialBrandRss = async (query, brandInfo) => {
  const siteExpr = brandInfo?.communitySites?.length
    ? `(${brandInfo.communitySites.map((s) => `site:${s.split("/")[0]}`).join(" OR ")})`
    : `(site:ifixit.com OR site:answers.microsoft.com)`;
  const q = `${siteExpr} ${query} (issue OR problem OR warranty OR screen OR battery OR overheat OR fix)`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) return [];
  const xml = await res.text();
  return parseGoogleNewsRss(xml, {
    channel: "brand_community",
    lang: "en",
    fallbackSource: brandInfo?.communityLabel || "Tech Community",
  });
};

/**
 * 2. Thu thập thảo luận tiếng Anh gần đây trên Reddit (qua Google News RSS — không bị chặn DNS tại VN)
 */
const collectEnglishRedditAndForums = async (query, brandInfo, timeframeMonths = 12) => {
  const whenToken = timeframeMonths <= 6 ? "when:1y" : "when:1y";
  const queries = [
    `site:reddit.com ${query} (issue OR problem OR warranty OR broken OR battery OR screen OR overheat) ${whenToken}`,
  ];

  const batches = await Promise.all(
    queries.map(async (q) => {
      try {
        const res = await fetchWithTimeout(
          `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`
        );
        if (!res.ok) return [];
        const xml = await res.text();
        return parseGoogleNewsRss(xml, {
          channel: "reddit",
          lang: "en",
          fallbackSource: brandInfo?.subreddits?.[0]
            ? `Reddit r/${brandInfo.subreddits[0]}`
            : "Reddit EN",
        });
      } catch {
        return [];
      }
    })
  );

  return batches.flat();
};

/**
 * 3. Thu thập tin tức công nghệ gần đây (EN + VN) có giới hạn thời gian rõ ràng
 */
const collectRecentTechNews = async (query, lang = "en", timeframeMonths = 12) => {
  const whenToken = timeframeMonths <= 6 ? "when:6m" : "when:1y";
  const q =
    lang === "vi"
      ? `${query} (lỗi OR "bảo hành" OR "sửa chữa" OR "triệu hồi" OR "hỏng") ${whenToken}`
      : `${query} (issue OR problem OR warranty OR defect OR recall OR repair OR failure) ${whenToken}`;
  const params =
    lang === "vi"
      ? `q=${encodeURIComponent(q)}&hl=vi&gl=VN&ceid=VN:vi`
      : `q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  const res = await fetchWithTimeout(`https://news.google.com/rss/search?${params}`);
  if (!res.ok) return [];
  const xml = await res.text();
  return parseGoogleNewsRss(xml, {
    channel: lang === "vi" ? "news_vi" : "news_en",
    lang,
    fallbackSource: lang === "vi" ? "Tin tức VN" : "Tech News EN",
  });
};

const PROMO_NOISE_REGEX =
  /\b(giam gia|khuyen mai|mua ngay|tra gop|mo hop|tren tay|unboxing|black friday|best deal|price drop|coupon|sale off|xuat sac|dang mua nhat|in store|prebuilt|\$\d+)\b/i;

const ISSUE_SIGNAL_REGEX =
  /\b(loi|bao hanh|sua chua|hong|trieu hoi|nong|quat|soc|pin|sac|ban le|treo|issue|problem|warranty|defect|broken|repair|recall|overheat|flicker|dead|fail|failure|crash|bsod|hinge|battery|charging|thermal|throttl|screen|motherboard|bios|tpm|boot|fix|help|stopped working|not turning on|warning|error|freeze|lag|fan|blue screen)\b/i;

const GENERIC_TOKENS = new Set([
  "laptop",
  "dien",
  "thoai",
  "man",
  "hinh",
  "tai",
  "nghe",
  "do",
  "hoa",
  "chong",
  "on",
  "chinh",
  "hang",
  "wireless",
  "titan",
  "tu",
  "nhien",
  "space",
  "black",
  "silver",
  "gray",
  "grey",
  "white",
  "core",
  "intel",
  "amd",
  "ryzen",
  "oled",
  "4k",
  "5g",
  "vn",
  "inch",
  "gaming",
]);

/**
 * Xây dựng chữ ký khớp CHÍNH XÁC từng mã máy / model của người dùng
 * (KHÔNG lấy các model anh em khác như XPS 13 khi hỏi XPS 15, hay Nitro V 15 / AN16 khi hỏi Nitro 5)
 */
export const buildExactModelMatcher = (rawDeviceName = "") => {
  const norm = normalizeVietnamese(rawDeviceName)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b\d+\s?(gb|tb|hz|w)\b/gi, " ")
    .replace(/\b(\d{2})-inch\b/gi, "$1")
    .replace(/[^a-z0-9\-\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Kiểm tra mã SKU/Model đặc định có cả chữ & số dài (VD: U2723QE, WH-1000XM5, AN515-58, 9530)
  const skuMatches = norm.match(/\b(?:[a-z]{1,4}\-?\d{3,5}[a-z0-9\-]*|\d{4}[a-z]{0,2})\b/g) || [];
  const exactSkus = skuMatches.filter((s) => !/^(202[0-9]|1080|2160|1440|4096)$/.test(s));

  // 2. Quy tắc chính xác cho các dòng máy phổ biến (tránh nhầm thế hệ/biến thể)
  if (/\bnitro\s*5\b|\ban515\b/.test(norm)) {
    return {
      exactPhrase: "Acer Nitro 5",
      match: (t) =>
        (/\bnitro\s*5\b/.test(t) || /\ban515\b/.test(t)) &&
        !/\bnitro\s*v\s*15\b|\bnitro\s*v15\b|\banv15\b|\banv16\b|\ban16\b|\bnitro\s*16\b|\bnitro\s*17\b/.test(t),
    };
  }

  if (/\bnitro\s*v\s*15\b|\bnitro\s*v15\b|\banv15\b/.test(norm)) {
    return {
      exactPhrase: "Acer Nitro V 15",
      match: (t) => /\bnitro\s*v\s*15\b|\bnitro\s*v15\b|\banv15\b/.test(t),
    };
  }

  const xpsMatch = norm.match(/\bxps\s*(13|14|15|16|17)\b/);
  if (xpsMatch) {
    const size = xpsMatch[1];
    const specificCode = exactSkus.find((s) => /^9[3567]\d{2}$/.test(s));
    const others = ["13", "14", "15", "16", "17"].filter((x) => x !== size);
    const otherRx = new RegExp(`\\bxps\\s*(?:${others.join("|")})\\b`);
    return {
      exactPhrase: specificCode ? `Dell XPS ${size} ${specificCode}` : `Dell XPS ${size}`,
      match: (t) => {
        if (specificCode) {
          // Nếu người dùng có đúng mã đời máy (VD: 9530) -> chỉ giữ đúng mã 9530, loại đời cũ (7590, 9500, 9510, 9520)
          return new RegExp(`\\b${specificCode}\\b`).test(t);
        }
        const hasExact = new RegExp(`\\bxps\\s*${size}\\b`).test(t);
        if (!hasExact) return false;
        if (otherRx.test(t)) return false;
        return true;
      },
    };
  }

  const iphoneMatch = norm.match(/\biphone\s*(\d{2})\s*(pro\s*max|pro|plus|mini)?\b/);
  if (iphoneMatch) {
    const gen = iphoneMatch[1];
    const tier = (iphoneMatch[2] || "").replace(/\s+/g, " ").trim();
    const phrase = `iPhone ${gen}${tier ? ` ${tier}` : ""}`;
    return {
      exactPhrase: phrase,
      match: (t) => {
        if (!new RegExp(`\\biphone\\s*${gen}\\b`).test(t)) return false;
        if (tier === "pro max") return new RegExp(`\\biphone\\s*${gen}\\s*pro\\s*max\\b`).test(t);
        if (tier === "pro") {
          return (
            new RegExp(`\\biphone\\s*${gen}\\s*pro\\b`).test(t) &&
            !new RegExp(`\\biphone\\s*${gen}\\s*pro\\s*max\\b`).test(t)
          );
        }
        if (tier === "plus") return new RegExp(`\\biphone\\s*${gen}\\s*plus\\b`).test(t);
        return true;
      },
    };
  }

  const macMatch = norm.match(/\bmacbook\s*(pro|air)\b/);
  if (macMatch) {
    const line = macMatch[1];
    const chip = (norm.match(/\bm[1-5](?:\s*(?:pro|max|ultra))?\b/) || [])[0] || "";
    const chipBase = chip ? chip.split(" ")[0] : "";
    const otherChips = ["m1", "m2", "m3", "m4", "m5"].filter((c) => c !== chipBase);
    const otherChipRx = new RegExp(`\\b(?:${otherChips.join("|")})\\b`);
    const phrase = `MacBook ${line === "pro" ? "Pro" : "Air"}${chipBase ? ` ${chipBase.toUpperCase()}` : ""}`;
    return {
      exactPhrase: phrase.trim(),
      match: (t) => {
        if (!new RegExp(`\\bmacbook\\s*${line}\\b`).test(t)) return false;
        if (chipBase) {
          if (!new RegExp(`\\b${chipBase}\\b`).test(t)) return false;
          if (otherChipRx.test(t) && !new RegExp(`\\b${chipBase}\\b`).test(t)) return false;
        }
        return true;
      },
    };
  }

  // 3. Nếu có mã SKU rõ ràng (VD: U2723QE, WH-1000XM5) -> bắt buộc khớp đúng mã SKU đó
  if (exactSkus.length > 0) {
    const primarySku = exactSkus[0];
    const skuCompact = primarySku.replace(/\-/g, "");
    return {
      exactPhrase: primarySku.toUpperCase(),
      match: (t) => {
        const tCompact = t.replace(/\-/g, "");
        return t.includes(primarySku) || tCompact.includes(skuCompact);
      },
    };
  }

  // 4. Fallback tổng quát nghiêm ngặt: bắt buộc chứa TOÀN BỘ token quan trọng của tên máy
  const coreTokens = norm
    .split(" ")
    .filter((tok) => tok.length >= 2 && !GENERIC_TOKENS.has(tok))
    .slice(0, 4);

  return {
    exactPhrase: coreTokens.join(" ") || cleanDeviceSearchQuery(rawDeviceName),
    match: (t) => coreTokens.length > 0 && coreTokens.every((tok) => new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t)),
  };
};

export const filterRecentRelevantArticles = (
  articles = [],
  rawDeviceName = "",
  timeframeMonths = 12
) => {
  const now = Date.now();
  const maxAgeMs = timeframeMonths * 31 * 24 * 60 * 60 * 1000;
  const matcher = buildExactModelMatcher(rawDeviceName);

  const seenUrls = new Set();
  const seenTitles = new Set();
  const cleaned = [];

  for (const a of articles) {
    if (!a?.url || !a?.title) continue;
    const titleKey = normalizeVietnamese(a.title).slice(0, 68);
    if (seenUrls.has(a.url) || seenTitles.has(titleKey)) continue;

    const combined = normalizeVietnamese(`${a.title} ${a.snippet || ""}`);
    // CHỈ giữ bài khớp CHÍNH XÁC mã máy / model của người dùng
    if (!matcher.match(combined)) continue;

    const hasIssueSignal = ISSUE_SIGNAL_REGEX.test(combined);
    const isPromoNoise = PROMO_NOISE_REGEX.test(combined);

    if (isPromoNoise && !hasIssueSignal) continue;
    if (!a._verifiedThread && !hasIssueSignal) continue;

    let ts = 0;
    if (a.publishedAt) {
      const parsed = new Date(a.publishedAt).getTime();
      if (!Number.isNaN(parsed)) {
        ts = parsed;
        if (now - parsed > maxAgeMs) continue;
      }
    }

    seenUrls.add(a.url);
    seenTitles.add(titleKey);
    cleaned.push({ ...a, _ts: ts });
  }

  // Sắp xếp mới nhất lên đầu; cùng khoảng thời gian gần nhau ưu tiên Official Brand Community & Reddit EN
  cleaned.sort((a, b) => {
    const channelRank = { brand_community: 3, reddit: 2, news_en: 1, news_vi: 0 };
    const dateDiff = (b._ts || 0) - (a._ts || 0);
    if (Math.abs(dateDiff) > 30 * 24 * 60 * 60 * 1000) return dateDiff;
    const rankDiff = (channelRank[b.channel] || 0) - (channelRank[a.channel] || 0);
    if (rankDiff !== 0) return rankDiff;
    return dateDiff;
  });

  return cleaned.map(({ _ts, _verifiedThread, ...rest }) => rest);
};

const collectInternalTicketStats = async (searchQuery) => {
  if (!IS_DB_CONNECTED()) {
    return { totalTickets: 0, recent30d: 0, previous30d: 0, changePercent: 0, sampleIssues: [] };
  }
  const tokens = searchQuery
    .split(" ")
    .filter((w) => w.length >= 2)
    .slice(0, 3);
  if (!tokens.length) {
    return { totalTickets: 0, recent30d: 0, previous30d: 0, changePercent: 0, sampleIssues: [] };
  }

  const regex = new RegExp(tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*"), "i");
  const tickets = await WarrantyTicket.find({ productName: regex })
    .select("createdAt issueCategories issueDescription status")
    .lean();

  const now = Date.now();
  const day30 = 30 * 24 * 60 * 60 * 1000;
  let recent30d = 0;
  let previous30d = 0;
  const sampleIssues = [];

  for (const t of tickets) {
    const ts = new Date(t.createdAt || now).getTime();
    if (now - ts <= day30) recent30d += 1;
    else if (now - ts <= day30 * 2) previous30d += 1;
    if (t.issueDescription) sampleIssues.push(t.issueDescription.slice(0, 140));
  }

  const changePercent =
    previous30d > 0
      ? Math.round(((recent30d - previous30d) / previous30d) * 100)
      : recent30d > 0
        ? 100
        : 0;

  return {
    totalTickets: tickets.length,
    recent30d,
    previous30d,
    changePercent,
    sampleIssues: sampleIssues.slice(0, 5),
  };
};

const getConfiguredLlmProviders = () => {
  const providers = [];

  if (process.env.DEEPSEEK_API_KEY) {
    providers.push({
      name: `DeepSeek (${process.env.DEEPSEEK_MODEL || "deepseek-chat"})`,
      baseUrl: (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/+$/, ""),
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
    });
  }

  if (process.env.GLM_API_KEY) {
    providers.push({
      name: `GLM (${process.env.GLM_MODEL || "glm-4-flash"})`,
      baseUrl: (process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4").replace(/\/+$/, ""),
      apiKey: process.env.GLM_API_KEY,
      model: process.env.GLM_MODEL || "glm-4-flash",
    });
  }

  if (process.env.LLM_API_KEY && process.env.LLM_BASE_URL) {
    providers.push({
      name: `LLM (${process.env.LLM_MODEL || "default"})`,
      baseUrl: process.env.LLM_BASE_URL.replace(/\/+$/, ""),
      apiKey: process.env.LLM_API_KEY,
      model: process.env.LLM_MODEL || "gpt-4o-mini",
    });
  }

  return providers;
};

const extractJsonObject = (rawText = "") => {
  const trimmed = String(rawText || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
};

const summarizeWithLlm = async ({ deviceName, category, timeframeMonths, articles, internalStats }) => {
  const providers = getConfiguredLlmProviders();
  if (!providers.length) return null;

  const articlesDigest = articles
    .slice(0, 16)
    .map(
      (a, idx) =>
        `[${idx + 1}] (${a.publishedAt || "recent"} | ${a.source} | ${a.lang?.toUpperCase() || "EN"}) ${a.title}${a.snippet ? ` — ${a.snippet}` : ""}`
    )
    .join("\n");

  const systemPrompt =
    "Bạn là chuyên gia phân tích độ tin cậy phần cứng & dữ liệu bảo hành. Hãy đọc kỹ các bài thảo luận tiếng Anh từ cộng đồng chính hãng, Reddit và báo công nghệ gần đây, rồi tổng hợp ngắn gọn, trung thực bằng tiếng Việt, CHỈ trả về JSON hợp lệ theo đúng schema.";

  const userPrompt = `Phân tích các lỗi hay gặp gần đây (${timeframeMonths} tháng qua) và xu hướng mang đi bảo hành cho thiết bị: "${deviceName}" (Nhóm: ${category || "Thiết bị điện tử"}).

Thống kê nội bộ hệ thống WarrantyOps:
- Tổng số phiếu bảo hành: ${internalStats.totalTickets} (30 ngày gần đây: ${internalStats.recent30d}, 30 ngày trước: ${internalStats.previous30d})
- Mô tả lỗi nội bộ: ${internalStats.sampleIssues.join("; ") || "Chưa có"}

Danh sách bài thảo luận gần đây từ cộng đồng chính hãng & diễn đàn (${articles.length} bài mới nhất):
${articlesDigest || "Không tìm thấy bài viết gần đây."}

Trả về JSON theo đúng cấu trúc:
{
  "riskLevel": "low" | "medium" | "high",
  "warrantyTrend": "rising" | "stable" | "low",
  "trendHeadline": "1 câu tiêu đề ngắn dưới 95 ký tự đánh giá xu hướng lỗi gần đây",
  "trendSummary": "2-3 câu tóm tắt khách quan từ các báo cáo cộng đồng hãng & diễn đàn gần đây",
  "topCommonIssues": [
    {
      "title": "Tên lỗi phổ biến bằng tiếng Việt",
      "sharePercent": 35,
      "severity": "high" | "medium" | "low",
      "symptoms": "1 câu mô tả dấu hiệu nhận biết ngắn gọn"
    }
  ],
  "preExpiryChecklist": [
    "3-4 đầu việc ngắn gọn cần test kỹ trước khi hết bảo hành"
  ]
}`;

  for (const provider of providers) {
    try {
      const res = await fetchWithTimeout(`${provider.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          temperature: 0.25,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      const parsed = extractJsonObject(content);
      if (parsed && Array.isArray(parsed.topCommonIssues)) {
        return {
          provider: provider.name,
          riskLevel: ["low", "medium", "high"].includes(parsed.riskLevel) ? parsed.riskLevel : "medium",
          warrantyTrend: ["rising", "stable", "low"].includes(parsed.warrantyTrend)
            ? parsed.warrantyTrend
            : "stable",
          trendHeadline: String(parsed.trendHeadline || "").slice(0, 140),
          trendSummary: String(parsed.trendSummary || "").slice(0, 600),
          topCommonIssues: parsed.topCommonIssues.slice(0, 5).map((it) => ({
            title: String(it.title || "Lỗi phần cứng").slice(0, 80),
            sharePercent: Math.min(100, Math.max(5, Number(it.sharePercent || 20))),
            severity: ["low", "medium", "high"].includes(it.severity) ? it.severity : "medium",
            symptoms: String(it.symptoms || "").slice(0, 200),
          })),
          preExpiryChecklist: (parsed.preExpiryChecklist || [])
            .slice(0, 5)
            .map((s) => String(s).slice(0, 140)),
        };
      }
    } catch {
      // Fallback sang provider tiếp theo
    }
  }

  return null;
};

const ISSUE_BUCKETS = [
  {
    key: "thermal",
    title: "Quá nhiệt, quạt kêu to & giảm xung (Thermal / Fan)",
    severity: "high",
    symptoms: "Nhiệt độ CPU/GPU tăng cao bất thường, quạt chạy ồn hoặc giảm xung (throttling) khi tải nặng.",
    keywords: ["overheat", "thermal", "fan", "hot", "heat", "temp", "throttl", "repast", "nhiet", "nong", "quat"],
  },
  {
    key: "display",
    title: "Màn hình sọc, nhấp nháy hoặc đen màn (Display)",
    severity: "high",
    symptoms: "Xuất hiện sọc ngang/dọc, nhấp nháy khi đổi 144Hz/60Hz, màn hình đen hoặc hở sáng.",
    keywords: ["screen", "display", "flicker", "black screen", "backlight", "bleed", "panel", "monitor", "man hinh", "soc"],
  },
  {
    key: "battery",
    title: "Không nhận sạc, sụt pin nhanh hoặc lỗi nguồn (Power / Battery)",
    severity: "high",
    symptoms: "Cắm sạc không vào, pin tụt nhanh bất thường, cổng sạc lỏng hoặc máy không lên nguồn.",
    keywords: ["battery", "charge", "charging", "power", "adapter", "turn on", "wont boot", "cmos", "pin", "sac", "nguon"],
  },
  {
    key: "motherboard",
    title: "Lỗi BIOS, Firmware/TPM, BSOD hoặc mất Wi-Fi / cổng kết nối",
    severity: "high",
    symptoms: "Cảnh báo fTPM/BIOS sau cập nhật, màn hình xanh (BSOD), kẹt boot loop hoặc cổng USB-C/Wi-Fi chập chờn.",
    keywords: ["motherboard", "bsod", "crash", "boot", "bios", "firmware", "tpm", "usb", "wifi", "gpu", "rtx", "freeze", "mainboard", "treo"],
  },
  {
    key: "hinge",
    title: "Bản lề lỏng, kêu hoặc hở viền khung (Hinge / Chassis)",
    severity: "medium",
    symptoms: "Đóng mở nắp máy phát tiếng kêu lạch cạch, bản lề cứng hoặc bung khung viền màn hình.",
    keywords: ["hinge", "chassis", "crack", "bezel", "lid", "ban le", "vo may", "khung"],
  },
  {
    key: "keyboard",
    title: "Bàn phím liệt phím hoặc loạn Trackpad",
    severity: "medium",
    symptoms: "Một số phím không nhận lệnh, gõ lặp ký tự hoặc bàn di chuột phản hồi chậm.",
    keywords: ["keyboard", "key", "trackpad", "touchpad", "ban phim", "phim", "chuot"],
  },
];

const buildHeuristicSummary = ({ deviceName, timeframeMonths, brandInfo, articles, internalStats }) => {
  const corpus = [
    ...articles.map((a) => normalizeVietnamese(`${a.title} ${a.snippet}`)),
    ...internalStats.sampleIssues.map((s) => normalizeVietnamese(s)),
  ];

  const scored = ISSUE_BUCKETS.map((b) => {
    let hits = 0;
    for (const text of corpus) {
      if (b.keywords.some((kw) => text.includes(kw))) hits += 1;
    }
    return { ...b, hits };
  })
    .filter((b) => b.hits > 0)
    .sort((a, b) => b.hits - a.hits);

  const totalHits = scored.reduce((sum, item) => sum + item.hits, 0);
  const topCommonIssues =
    scored.length > 0
      ? scored.slice(0, 4).map((item) => ({
          title: item.title,
          sharePercent: Math.max(12, Math.round((item.hits / totalHits) * 100)),
          severity: item.severity,
          symptoms: item.symptoms,
        }))
      : [
          {
            title: "Kiểm tra pin & bộ nguồn sạc",
            sharePercent: 35,
            severity: "medium",
            symptoms: "Đo độ chai pin và kiểm tra độ ổn định của cổng sạc / adapter.",
          },
          {
            title: "Tản nhiệt & vệ sinh linh kiện",
            sharePercent: 35,
            severity: "medium",
            symptoms: "Kiểm tra nhiệt độ vận hành và tiếng ồn quạt sau thời gian dài sử dụng.",
          },
          {
            title: "Màn hình & các cổng kết nối",
            sharePercent: 30,
            severity: "low",
            symptoms: "Kiểm tra điểm chết, độ đồng đều màu sắc và các cổng USB-C / HDMI.",
          },
        ];

  const recent90d = articles.filter((a) => {
    if (!a.publishedAt) return false;
    return Date.now() - new Date(a.publishedAt).getTime() <= 90 * 24 * 60 * 60 * 1000;
  }).length;
  const communityCount = articles.filter(
    (a) => a.channel === "brand_community" || a.channel === "reddit"
  ).length;

  const isRising = internalStats.changePercent >= 25 || recent90d >= 6;
  const warrantyTrend = isRising
    ? "rising"
    : articles.length >= 3 || internalStats.totalTickets > 0
      ? "stable"
      : "low";
  const riskLevel = isRising ? "high" : warrantyTrend === "stable" ? "medium" : "low";

  const trendHeadline =
    warrantyTrend === "rising"
      ? `Ghi nhận nhiều phản ánh lỗi mới trong ${timeframeMonths} tháng qua với ${deviceName}`
      : warrantyTrend === "stable"
        ? `Lượng báo lỗi & bảo hành của ${deviceName} trong ${timeframeMonths} tháng qua ở mức ổn định`
        : `Ít báo lỗi diện rộng mới trong ${timeframeMonths} tháng qua cho ${deviceName}`;

  const communityNote = brandInfo
    ? `${communityCount} bài từ ${brandInfo.communityLabel} & Reddit tiếng Anh`
    : `${communityCount} thảo luận cộng đồng quốc tế`;

  const trendSummary = `Đã lọc ${articles.length} bài báo lỗi gần đây trong ${timeframeMonths} tháng (${communityNote}, ${recent90d} bài trong 90 ngày qua) cùng ${internalStats.totalTickets} phiếu bảo hành nội bộ. Nên ưu tiên kiểm tra sớm nhóm lỗi phổ biến nhất trước ngày đáo hạn.`;

  return {
    provider: "Live Community Analyzer",
    riskLevel,
    warrantyTrend,
    trendHeadline,
    trendSummary,
    topCommonIssues,
    preExpiryChecklist: [
      `Kiểm tra kỹ nhóm lỗi "${topCommonIssues[0]?.title || "nguồn và tản nhiệt"}" khi còn hạn bảo hành`,
      "Chạy stress test nhiệt độ 15 phút & kiểm tra độ ồn quạt / mức giảm xung",
      "Test màn hình ở nhiều tần số quét, kiểm tra BIOS/Firmware và toàn bộ cổng USB-C / sạc",
      "Lưu sẵn ảnh thẻ QR bảo hành và sao lưu dữ liệu trước khi gửi trạm",
    ],
  };
};

export const getDeviceWarrantyInsights = async ({
  deviceName = "",
  category = "",
  timeframeMonths = 12,
  forceRefresh = false,
}) => {
  const cleanName = String(deviceName || "").trim();
  if (cleanName.length < 2) {
    const err = new Error("Vui lòng nhập tên thiết bị (tối thiểu 2 ký tự).");
    err.statusCode = 400;
    throw err;
  }

  const months = Number(timeframeMonths) === 6 ? 6 : 12;
  const matcher = buildExactModelMatcher(cleanName);
  const searchQuery = matcher.exactPhrase || cleanDeviceSearchQuery(cleanName);
  const brandInfo = detectBrandCommunity(cleanName);
  const queryKey = `${normalizeVietnamese(searchQuery)}__exact_${months}m`;

  // 1. Check 24h MongoDB Cache unless forceRefresh
  if (!forceRefresh && IS_DB_CONNECTED()) {
    const cached = await DeviceInsight.findOne({ queryKey }).lean();
    if (cached && cached.fetchedAt && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS) {
      return { ...cached, fromCache: true, searchQuery };
    }
  }

  // 2. Thu thập song song với đúng mã/model máy của người dùng (lọc nghiêm ngặt lại bằng matcher.match)
  const qExpr = searchQuery.split(" ").length <= 3 ? `"${searchQuery}"` : searchQuery;
  const qFlex = searchQuery;
  const [directBrandPosts, brandRssPosts, redditPosts, enNews, vnNews, internalStats] =
    await Promise.all([
      collectBrandDirectApi(searchQuery, brandInfo).catch(() => []),
      collectOfficialBrandRss(qFlex, brandInfo).catch(() => []),
      collectEnglishRedditAndForums(qFlex, brandInfo, months).catch(() => []),
      collectRecentTechNews(qExpr, "en", months).catch(() => []),
      collectRecentTechNews(qExpr, "vi", months).catch(() => []),
      collectInternalTicketStats(searchQuery).catch(() => ({
        totalTickets: 0,
        recent30d: 0,
        previous30d: 0,
        changePercent: 0,
        sampleIssues: [],
      })),
    ]);

  const rawCombined = [...directBrandPosts, ...brandRssPosts, ...redditPosts, ...enNews, ...vnNews];
  const articles = filterRecentRelevantArticles(rawCombined, cleanName, months);

  // 3. Phân tích bằng DeepSeek / GLM hoặc Live Community Analyzer trên danh sách bài gần đây đã lọc sạch
  const llmResult = await summarizeWithLlm({
    deviceName: cleanName,
    category,
    timeframeMonths: months,
    articles,
    internalStats,
  });

  const analysis =
    llmResult ||
    buildHeuristicSummary({
      deviceName: cleanName,
      timeframeMonths: months,
      brandInfo,
      articles,
      internalStats,
    });

  const payload = {
    queryKey,
    deviceName: cleanName,
    category,
    timeframeMonths: months,
    brandDetected: brandInfo?.communityLabel || "",
    provider: analysis.provider,
    riskLevel: analysis.riskLevel,
    warrantyTrend: analysis.warrantyTrend,
    trendHeadline: analysis.trendHeadline,
    trendSummary: analysis.trendSummary,
    internalStats: {
      totalTickets: internalStats.totalTickets,
      recent30d: internalStats.recent30d,
      previous30d: internalStats.previous30d,
      changePercent: internalStats.changePercent,
    },
    topCommonIssues: analysis.topCommonIssues,
    preExpiryChecklist: analysis.preExpiryChecklist,
    sources: articles.slice(0, 10),
    articleCount: articles.length,
    fetchedAt: new Date(),
  };

  if (IS_DB_CONNECTED()) {
    await DeviceInsight.findOneAndUpdate({ queryKey }, payload, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }).catch(() => null);
  }

  return { ...payload, fromCache: false, searchQuery };
};
