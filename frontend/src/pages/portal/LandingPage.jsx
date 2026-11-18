import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { QRCodeSVG } from "qrcode.react";
import {
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  QrCode,
  MapPin,
  Activity,
  Check,
  ShieldCheck,
  Settings,
  Lock,
} from "lucide-react";
import { analyticsApi, recordsApi } from "../../api/client";
import { formatDateVN } from "../../utils/format";

gsap.registerPlugin(ScrollTrigger);

const FAQ_ITEMS = [
  {
    q: "Hệ thống tự nhận diện bảo hành sắp hết hạn như thế nào?",
    a: "WarrantyOps liên tục quét toàn bộ chứng từ trong MongoDB, tự động phân nhóm thiết bị còn dưới 30 ngày và cảnh báo khẩn cho nhóm dưới 7 ngày để bạn kịp kiểm tra miễn phí hoặc gia hạn trực tuyến.",
  },
  {
    q: "Tính năng trích xuất địa chỉ và định tuyến GPS hoạt động ra sao?",
    a: "AI đọc địa chỉ có sẵn trên giấy bảo hành, nơi mua hoặc ghi chú, sau đó lấy tọa độ GPS hiện tại để tính chính xác quãng đường (km), thời gian di chuyển và mở chỉ đường từng chặng trên Google Maps.",
  },
  {
    q: "Tôi có thể lưu thẻ bảo hành điện tử QR về điện thoại không?",
    a: "Có. Mọi hồ sơ đều hỗ trợ kết xuất ảnh thẻ bảo hành PNG độ phân giải cao kèm mã QR xác thực trực tuyến và tệp nhắc lịch (.ics) đồng bộ trực tiếp vào Apple / Google Calendar.",
  },
  {
    q: "Quy trình gửi máy và theo dõi sửa chữa gồm những bước nào?",
    a: "Bạn chọn mang máy tới trung tâm gần nhất hoặc đặt lịch thu nhận tận nơi. Toàn bộ 6 bước từ tiếp nhận, kiểm tra, thay linh kiện đến bàn giao đều cập nhật theo thời gian thực cùng kênh chat kỹ thuật viên.",
  },
];

/* Sculptural Animated Floating Prism Cube sitting over Hero Typography */
const FloatingHeroPrism = ({ className = "" }) => (
  <svg
    viewBox="0 0 88 88"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="prismTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="55%" stopColor="#4F6DF5" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
      <linearGradient id="prismGlass" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
        <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0.6" />
      </linearGradient>
    </defs>
    <polygon
      points="44,8 78,26 44,44 10,26"
      fill="url(#prismTop)"
      stroke="#0A0A0A"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <polygon
      points="10,26 44,44 44,80 10,62"
      fill="url(#prismGlass)"
      stroke="#0A0A0A"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    <polygon
      points="78,26 44,44 44,80 78,62"
      fill="#FFFFFF"
      fillOpacity="0.78"
      stroke="#0A0A0A"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

/* Layered Isometric Control Scene — each layer floats independently via GSAP classes */
const SculpturalControlScene = () => (
  <svg
    viewBox="0 0 420 390"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[460px] h-auto select-none overflow-visible"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="sceneCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="52%" stopColor="#4F6DF5" />
        <stop offset="100%" stopColor="#F43F5E" />
      </linearGradient>
      <linearGradient id="sceneEdgeBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#4F6DF5" />
      </linearGradient>
    </defs>

    {/* Subtle architectural ground shadow plane */}
    <path
      d="M72 292 L222 362 L380 282 L230 212 Z"
      fill="#ECEEF2"
      fillOpacity="0.7"
    />

    {/* Layer 1: Main Back Isometric Control Window */}
    <g className="iso-layer-back" transform="translate(132, 22)">
      {/* 3D thickness edge */}
      <path
        d="M214 114 L224 109 L224 276 L214 281 Z"
        fill="url(#sceneEdgeBlue)"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M0 14 L10 9 L224 109 L214 114 Z"
        fill="#1D1D1F"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Main white panel */}
      <path
        d="M0 14 L214 114 L214 281 L0 181 Z"
        fill="#FFFFFF"
        stroke="#0A0A0A"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Top jet-black bar */}
      <path d="M0 14 L214 114 L214 136 L0 36 Z" fill="#0A0A0A" />
      <circle cx="16" cy="31" r="3" fill="#FFFFFF" />
      <circle cx="28" cy="36.5" r="3" fill="#9CA3AF" />
      <circle cx="40" cy="42" r="3" fill="#9CA3AF" />

      {/* Dashed isometric GPS route path */}
      <path
        d="M26 146 C62 128 96 154 128 164 C154 172 174 166 192 186"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeDasharray="5 5"
        fill="none"
      />
      <circle cx="26" cy="146" r="4.5" fill="#0A0A0A" />
      <circle cx="192" cy="186" r="5" fill="#4F6DF5" stroke="#0A0A0A" strokeWidth="1.8" />
    </g>

    {/* Layer 2: Vibrant Floating Cloud / Sync Shield */}
    <g className="iso-layer-cloud" transform="translate(178, 92)">
      <path
        d="M20 62 C18 38 42 26 66 39 C80 20 116 26 126 52 C146 61 151 86 135 99 C121 110 96 108 74 98 L32 78 C22 73 20 68 20 62 Z"
        fill="url(#sceneCloudGrad)"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Subtle glossy curve highlight */}
      <path
        d="M42 48 C50 40 64 41 72 47"
        stroke="#FFFFFF"
        strokeOpacity="0.65"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </g>

    {/* Layer 3: Front Overlapping Analytics / Warranty Card */}
    <g className="iso-layer-front" transform="translate(46, 152)">
      <path
        d="M112 64 L120 60 L120 198 L112 202 Z"
        fill="#E5E7EB"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M0 12 L112 64 L112 202 L0 150 Z"
        fill="#FFFFFF"
        stroke="#0A0A0A"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M0 12 L112 64 L112 82 L0 30 Z" fill="#0A0A0A" />
      {/* Sculptural Pie / Status Ring */}
      <ellipse
        cx="56"
        cy="108"
        rx="26"
        ry="32"
        transform="rotate(-18 56 108)"
        fill="#F4F5F7"
        stroke="#0A0A0A"
        strokeWidth="2"
      />
      <path
        d="M56 108 L56 76 A26 32 -18 0 1 80 116 Z"
        fill="#F43F5E"
        stroke="#0A0A0A"
        strokeWidth="1.8"
      />
      {/* Minimal content bars */}
      <line x1="18" y1="146" x2="88" y2="178" stroke="#0A0A0A" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="18" y1="158" x2="64" y2="179" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
    </g>

    {/* Layer 4: Bold Coral-Red 3D Geometric Padlock */}
    <g className="iso-layer-lock" transform="translate(232, 232)">
      <path
        d="M18 28 V16 C18 4 44 4 44 16 V28"
        stroke="#0A0A0A"
        strokeWidth="3.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M6 26 L54 46 L54 92 L6 72 Z"
        fill="#F43F5E"
        stroke="#0A0A0A"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M54 46 L68 39 L68 85 L54 92 Z"
        fill="#0A0A0A"
        stroke="#0A0A0A"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M6 26 L20 19 L68 39 L54 46 Z"
        fill="#FB7185"
        stroke="#0A0A0A"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="30" cy="56" r="4.5" fill="#0A0A0A" />
      <line x1="30" y1="60" x2="30" y2="70" stroke="#0A0A0A" strokeWidth="2.8" strokeLinecap="round" />
    </g>
  </svg>
);

export const LandingPage = () => {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const heroVisualRef = useRef(null);

  const [overview, setOverview] = useState(null);
  const [records, setRecords] = useState([]);
  const [quickQuery, setQuickQuery] = useState("");
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState(1);

  useEffect(() => {
    analyticsApi
      .overview("all")
      .then((res) => setOverview(res.data))
      .catch(() => null);
    recordsApi
      .list({ status: "all" })
      .then((res) => setRecords(res.data || []))
      .catch(() => null);
  }, []);

  // GSAP Master Choreography (Entrance + Floating Loops + ScrollTrigger Parallax + Counters)
  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return undefined;

    const ctx = gsap.context(() => {
      // 1. Crisp Kinetic Hero Entrance
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".hero-word", {
        y: 54,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
      })
        .from(
          ".hero-prism",
          {
            scale: 0.72,
            rotate: -14,
            opacity: 0,
            duration: 0.7,
            ease: "back.out(1.6)",
          },
          "-=0.55"
        )
        .from(
          ".hero-phone",
          {
            y: 44,
            opacity: 0,
            duration: 0.75,
          },
          "-=0.55"
        )
        .from(
          ".hero-copy-block",
          {
            y: 26,
            opacity: 0,
            duration: 0.65,
          },
          "-=0.55"
        )
        .from(
          ".hero-scene",
          {
            x: 34,
            opacity: 0,
            duration: 0.85,
          },
          "-=0.7"
        );

      // 2. Smooth Infinite Floating Loops for Hero Prism & Isometric Layers
      gsap.to(".hero-prism", {
        y: -10,
        rotate: 4,
        duration: 3.1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".iso-layer-cloud", {
        y: -12,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".iso-layer-front", {
        y: 8,
        duration: 3.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.4,
      });

      gsap.to(".iso-layer-lock", {
        y: -8,
        duration: 2.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.8,
      });

      // 3. Orbiting float accents in the dark CTA banner
      gsap.to(".cta-float-1", {
        y: -10,
        duration: 3.2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".cta-float-2", {
        y: 9,
        duration: 3.7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5,
      });
      gsap.to(".cta-spin-slow", {
        rotation: 360,
        duration: 18,
        repeat: -1,
        ease: "none",
      });

      // 4. ScrollTrigger Reveals for Editorial Sections
      gsap.utils.toArray(".gsap-reveal").forEach((el) => {
        gsap.from(el, {
          y: 36,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 84%",
            once: true,
          },
        });
      });

      // 5. Smooth Scrubbed Photo Depth Zoom on Scroll
      gsap.utils.toArray(".gsap-parallax-img").forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 1.09, y: -14 },
          {
            scale: 1.0,
            y: 14,
            ease: "none",
            scrollTrigger: {
              trigger: img.parentElement,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.6,
            },
          }
        );
      });

      // 6. Scroll-triggered Stat Counter for SLA
      const slaEl = document.querySelector(".gsap-sla-counter");
      if (slaEl) {
        const target = Number(slaEl.dataset.target || 99.6);
        const obj = { val: 85.0 };
        gsap.to(obj, {
          val: target,
          duration: 1.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: slaEl,
            start: "top 86%",
            once: true,
          },
          onUpdate: () => {
            slaEl.textContent = `${obj.val.toFixed(1)}%`;
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  // Subtle interactive mouse parallax on Hero visual scene
  const handleHeroMouseMove = (e) => {
    if (!heroVisualRef.current) return;
    const rect = heroVisualRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(".hero-scene", {
      x: relX * 18,
      y: relY * 14,
      duration: 0.6,
      ease: "power2.out",
    });
    gsap.to(".hero-prism", {
      x: relX * -14,
      duration: 0.6,
      ease: "power2.out",
    });
  };

  const handleHeroMouseLeave = () => {
    gsap.to(".hero-scene", { x: 0, y: 0, duration: 0.8, ease: "power3.out" });
    gsap.to(".hero-prism", { x: 0, duration: 0.8, ease: "power3.out" });
  };

  const kpis = overview?.kpis || {
    totalRecords: 5,
    expiringCount: 2,
    openTickets: 4,
    slaRate: 99.6,
  };

  const featuredRecord = records[0] || null;

  const baseIntegrations = [
    {
      id: "qr",
      icon: QrCode,
      iconBg: "bg-sky-50 text-sky-600",
      highlight: "Quản lý chứng nhận & xuất thẻ QR",
      rest: "độ phân giải cao chỉ trong một chạm, đồng bộ xuyên suốt trên mọi thiết bị.",
      to: "/home",
      label: "Mở kho chứng nhận",
    },
    {
      id: "ai-gps",
      icon: MapPin,
      iconBg: "bg-white text-[#0A0A0A]",
      highlight: "AI tự nhận diện sắp hết hạn & dẫn đường GPS",
      rest: "bóc tách địa chỉ trên giấy bảo hành và tìm trạm kỹ thuật gần vị trí bạn nhất.",
      to: "/home?tab=ai",
      label: "Mở trợ lý AI GPS",
    },
    {
      id: "rma",
      icon: Activity,
      iconBg: "bg-rose-50 text-rose-600",
      highlight: "Theo dõi tiến độ sửa chữa 6 bước",
      rest: "minh bạch linh kiện thay thế và trao đổi trực tiếp cùng kỹ thuật viên phụ trách.",
      to: "/track",
      label: "Xem phiếu RMA",
    },
  ];

  // Rotate cards so the spotlight card always sits in the center slot (index 1)
  const orderedCards = [
    baseIntegrations[(0 + carouselOffset) % 3],
    baseIntegrations[(1 + carouselOffset) % 3],
    baseIntegrations[(2 + carouselOffset) % 3],
  ];

  return (
    <div ref={rootRef} className="bg-[#F6F7F9] text-[#0A0A0A]">
      {/* 1. BOUNDLESS FULL-BLEED SCULPTURAL HERO — Zero box, zero frame, pure open canvas */}
      <section
        ref={heroVisualRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative w-full overflow-hidden bg-[#F6F7F9] border-b border-black/[0.06]"
      >
        <div className="max-w-[1380px] mx-auto px-6 sm:px-10 lg:px-14 pt-8 sm:pt-12 lg:pt-14 pb-0 min-h-[calc(100vh-64px)] flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-end flex-1">
            {/* Left + Middle 8 cols: Boundless Staggered Typography + Bottom-flush Phone Frame + Copy */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between gap-10 lg:gap-14 h-full">
              {/* Oversized Fluid Staggered Headline with Floating 3D Prism */}
              <div className="relative select-none pt-2 sm:pt-4">
                <h1 className="font-display font-semibold text-[clamp(56px,8.8vw,126px)] tracking-[-0.045em] leading-[0.98] text-[#0A0A0A]">
                  <span className="block overflow-hidden pl-[10%] sm:pl-[15%] pb-2 -mb-2">
                    <span className="hero-word inline-block">Warranty</span>
                  </span>
                  <span className="block overflow-hidden relative pb-1 -mb-1">
                    <span className="hero-word inline-block">Control</span>
                  </span>
                  <span className="block overflow-hidden pl-[6%] sm:pl-[10%] pb-1">
                    <span className="hero-word inline-block">Center</span>
                  </span>
                </h1>

                {/* Floating 3D Isometric Prism intersecting Warranty & Control */}
                <div className="hero-prism pointer-events-none absolute top-[24%] left-[44%] sm:left-[40%] lg:left-[38%] z-10">
                  <FloatingHeroPrism className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 drop-shadow-[0_18px_24px_rgba(79,109,245,0.22)]" />
                </div>
              </div>

              {/* Lower Hero Split: Phone Mockup flush to the bottom edge + Open Copy & Black Pill CTA */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-end">
                {/* Interactive Phone Mockup rising cleanly from the bottom horizon */}
                <div className="hero-phone md:col-span-6 lg:col-span-5">
                  <div className="rounded-t-[32px] border-[2.5px] border-b-0 border-[#0A0A0A] bg-white px-5 pt-5 pb-7 shadow-[0_-10px_36px_rgba(10,10,10,0.06)] space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-[#86868B]">Xin chào,</div>
                        <div className="text-sm font-semibold text-[#0A0A0A]">
                          Warranty Vault
                        </div>
                      </div>
                      <span className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center text-xs font-semibold">
                        {kpis.totalRecords}
                      </span>
                    </div>

                    {/* Working instant search right inside phone mockup */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        navigate(
                          `/lookup?q=${encodeURIComponent(
                            quickQuery.trim() || "DLXPS-99281-VN"
                          )}`
                        );
                      }}
                      className="relative"
                    >
                      <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={quickQuery}
                        onChange={(e) => setQuickQuery(e.target.value)}
                        placeholder="Tra cứu Serial, IMEI..."
                        className="w-full pl-9 pr-3 py-2 rounded-full bg-[#F4F5F7] text-xs text-[#0A0A0A] placeholder:text-[#86868B] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A0A0A]"
                      />
                    </form>

                    {/* Segmented mini tabs */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      <Link
                        to="/home"
                        className="px-3 py-1 rounded-full bg-[#0A0A0A] text-white"
                      >
                        Hồ sơ
                      </Link>
                      <Link
                        to="/home?tab=ai"
                        className="px-3 py-1 rounded-full bg-[#F4F5F7] text-[#6E6E73] hover:text-[#0A0A0A]"
                      >
                        Sắp hạn ({kpis.expiringCount})
                      </Link>
                      <Link
                        to="/track"
                        className="px-3 py-1 rounded-full bg-[#F4F5F7] text-[#6E6E73] hover:text-[#0A0A0A]"
                      >
                        RMA ({kpis.openTickets})
                      </Link>
                    </div>

                    {/* Crisp 3 app icon tiles */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <Link
                        to="/home"
                        className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-[#F4F5F7] hover:bg-[#EAECEF] transition-colors"
                      >
                        <QrCode className="w-4 h-4 text-[#0A0A0A]" />
                        <span className="text-[10px] font-medium text-[#6E6E73]">Thẻ QR</span>
                      </Link>
                      <Link
                        to="/home?tab=ai"
                        className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-[#F4F5F7] hover:bg-[#EAECEF] transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-[#4F6DF5]" />
                        <span className="text-[10px] font-medium text-[#6E6E73]">AI GPS</span>
                      </Link>
                      <Link
                        to="/home?tab=news"
                        className="flex flex-col items-center gap-1.5 py-2.5 rounded-2xl bg-[#F4F5F7] hover:bg-[#EAECEF] transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#0A0A0A]" />
                        <span className="text-[10px] font-medium text-[#6E6E73]">Bản tin lỗi</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Open Copy + Solid Jet-Black Pill CTA */}
                <div className="hero-copy-block md:col-span-6 lg:col-span-7 pb-10 sm:pb-14 space-y-6">
                  <p className="text-sm sm:text-[15px] text-[#6E6E73] leading-relaxed max-w-[330px]">
                    Bảo vệ mọi chứng từ thiết bị trong một không gian trực quan duy nhất — tự nhận diện sắp hết hạn, quét lỗi cộng đồng và dẫn đường GPS tới trung tâm gần nhất.
                  </p>

                  <div className="flex flex-wrap items-center gap-5">
                    <Link
                      to="/home"
                      className="editorial-pill-btn inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#0A0A0A] hover:bg-neutral-800 text-white text-[13px] font-semibold"
                    >
                      Mở không gian Home
                    </Link>
                    <Link
                      to="/lookup"
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0A0A0A] hover:text-[#6E6E73] transition-colors"
                    >
                      <span>Tra cứu QR</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 cols: Spacious Floating Isometric Scene in Open Air */}
            <div className="lg:col-span-5 xl:col-span-4 flex justify-center lg:justify-end pb-10 lg:pb-16">
              <div className="hero-scene w-full flex justify-center lg:justify-end">
                <SculpturalControlScene />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SIGNATURE "SEAMLESS INTEGRATION" 3-CARD CAROUSEL — Inline Circular Arrows BETWEEN Cards! */}
      <section className="gsap-reveal max-w-[1220px] mx-auto px-5 sm:px-8 py-16 sm:py-24 space-y-12">
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#4F6DF5] text-white text-[10px] font-semibold uppercase tracking-[0.16em]">
            INTEGRATION
          </span>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.1] text-[#0A0A0A]">
            Kết nối liền mạch
            <br />
            mọi trải nghiệm bảo hành
          </h2>
        </div>

        {/* Exact Reference Composition: [ White Card ] (←) [ SOLID BLACK CARD ] (→) [ White Card ] */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-5 lg:gap-4">
          {orderedCards.map((card, slotIdx) => {
            const isCenter = slotIdx === 1;
            const IconComp = card.icon;
            return (
              <div key={card.id} className="contents">
                {/* Inline Left Arrow before Center Card */}
                {slotIdx === 1 && (
                  <button
                    type="button"
                    aria-label="Tính năng trước"
                    onClick={() => setCarouselOffset((v) => (v + 2) % 3)}
                    className="hidden lg:flex w-10 h-10 rounded-full bg-white border border-black/15 hover:border-[#0A0A0A] hover:scale-105 active:scale-95 items-center justify-center text-[#0A0A0A] transition-all cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}

                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className={`w-full lg:flex-1 rounded-[30px] p-9 sm:p-10 flex flex-col items-center text-center justify-between gap-8 transition-colors ${
                    isCenter
                      ? "bg-[#0A0A0A] text-white shadow-[0_24px_54px_rgba(10,10,10,0.18)] lg:min-h-[340px]"
                      : "bg-white text-[#0A0A0A] border border-black/[0.08] lg:min-h-[310px]"
                  }`}
                >
                  <div className="space-y-6 flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        isCenter ? "bg-white text-[#0A0A0A]" : card.iconBg
                      }`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>

                    {/* Signature Two-Tone Sentence Contrast from Reference! */}
                    <p
                      className={`text-[15px] sm:text-base leading-relaxed max-w-[270px] ${
                        isCenter ? "text-[#9CA3AF]" : "text-[#6E6E73]"
                      }`}
                    >
                      <strong
                        className={`font-semibold ${
                          isCenter ? "text-white" : "text-[#0A0A0A]"
                        }`}
                      >
                        {card.highlight}
                      </strong>{" "}
                      {card.rest}
                    </p>
                  </div>

                  <Link
                    to={card.to}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-75 ${
                      isCenter ? "text-white" : "text-[#0A0A0A]"
                    }`}
                  >
                    <span>{card.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </motion.div>

                {/* Inline Right Arrow after Center Card */}
                {slotIdx === 1 && (
                  <button
                    type="button"
                    aria-label="Tính năng tiếp theo"
                    onClick={() => setCarouselOffset((v) => (v + 1) % 3)}
                    className="hidden lg:flex w-10 h-10 rounded-full bg-white border border-black/15 hover:border-[#0A0A0A] hover:scale-105 active:scale-95 items-center justify-center text-[#0A0A0A] transition-all cursor-pointer shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile arrows */}
        <div className="flex lg:hidden items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Tính năng trước"
            onClick={() => setCarouselOffset((v) => (v + 2) % 3)}
            className="w-10 h-10 rounded-full bg-white border border-black/15 flex items-center justify-center text-[#0A0A0A]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Tính năng tiếp theo"
            onClick={() => setCarouselOffset((v) => (v + 1) % 3)}
            className="w-10 h-10 rounded-full bg-white border border-black/15 flex items-center justify-center text-[#0A0A0A]"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. ARCHITECTURAL PHOTOGRAPHIC BENTO — Studio Photos + Live Interactive Apple Wallet Pass */}
      <section className="bg-white py-20 sm:py-28 border-y border-black/[0.05]">
        <div className="max-w-[1220px] mx-auto px-5 sm:px-8 space-y-12">
          <div className="gsap-reveal flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="text-xs font-medium text-[#6E6E73]">
                Trải nghiệm thực tế
              </div>
              <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.08] text-[#0A0A0A]">
                Mọi thiết bị. Một thẻ bảo hành số duy nhất.
              </h2>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A0A0A] hover:text-[#6E6E73] transition-colors"
            >
              <span>Vào không gian Home</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Asymmetric Creative Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Wide Studio Devices Photo (7 cols) */}
            <div className="gsap-reveal lg:col-span-7 rounded-[30px] overflow-hidden bg-[#F4F5F7] min-h-[340px]">
              <img
                src="/assets/apple-hero-devices.jpg"
                alt="Thiết bị điện tử và thẻ bảo hành tối giản trên bàn đá"
                className="gsap-parallax-img w-full h-full object-cover"
              />
            </div>

            {/* Interactive Matte-Black Digital Warranty Pass (5 cols) */}
            <div className="gsap-reveal lg:col-span-5 rounded-[30px] bg-[#F4F5F7] p-7 sm:p-9 flex flex-col justify-between gap-6">
              <div className="space-y-1">
                <div className="text-xs font-medium text-[#6E6E73]">Thẻ chứng nhận QR trực tiếp</div>
                <h3 className="text-xl font-semibold tracking-tight text-[#0A0A0A]">
                  Quét để xác thực tức thì.
                </h3>
              </div>

              <motion.div
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="rounded-[24px] bg-[#0A0A0A] text-white p-6 sm:p-7 shadow-[0_24px_48px_rgba(10,10,10,0.18)] space-y-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#A1A1A6]">WarrantyOps Pass</div>
                    <div className="font-mono text-xs text-white/90">
                      {featuredRecord?.wbCode || "WB-2026-9012"}
                    </div>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white">
                    <QRCodeSVG
                      value={`${window.location.origin}/lookup?q=${encodeURIComponent(
                        featuredRecord?.serialNumber || "MACM3P-77410-VN"
                      )}`}
                      size={48}
                      level="M"
                    />
                  </div>
                </div>

                <div>
                  <div className="text-base font-semibold leading-snug">
                    {featuredRecord?.productName || "MacBook Pro 14-inch M3 Pro"}
                  </div>
                  <div className="font-mono text-[11px] text-[#86868B] mt-0.5">
                    {featuredRecord?.serialNumber || "MACM3P-77410-VN"}
                  </div>
                </div>

                <div className="flex items-end justify-between pt-3 border-t border-white/10 text-xs">
                  <div>
                    <div className="text-[10px] text-[#86868B]">Chủ sở hữu</div>
                    <div className="font-medium mt-0.5">
                      {featuredRecord?.customerName || "Đặng Thảo Vy"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-[#86868B]">Hiệu lực đến</div>
                    <div className="font-medium mt-0.5">
                      {featuredRecord?.endDate ? formatDateVN(featuredRecord.endDate) : "19/08/2028"}
                    </div>
                  </div>
                </div>
              </motion.div>

              <Link
                to="/lookup"
                className="inline-flex items-center justify-between px-5 py-3.5 rounded-full bg-white hover:bg-[#0A0A0A] hover:text-white text-xs font-semibold text-[#0A0A0A] transition-colors"
              >
                <span>Xác thực &amp; xuất ảnh thẻ PNG</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Bottom Row Left: GPS Route Studio Photo + Copy (6 cols) */}
            <div className="gsap-reveal lg:col-span-6 rounded-[30px] bg-[#F4F5F7] overflow-hidden flex flex-col justify-between">
              <div className="p-8 sm:p-10 space-y-3">
                <div className="text-xs font-medium text-[#6E6E73]">AI &amp; Định vị GPS</div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0A0A0A]">
                  Tự đọc địa chỉ. Dẫn thẳng tới trạm gần nhất.
                </h3>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  Phát hiện thiết bị sắp đáo hạn, bóc tách địa chỉ trên hồ sơ, đo khoảng cách đường bộ từ GPS hiện tại và mở tuyến Google Maps.
                </p>
                <div className="pt-2">
                  <Link
                    to="/home?tab=ai"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0A0A0A] hover:text-[#6E6E73]"
                  >
                    <span>Thử định tuyến GPS ngay</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="overflow-hidden h-72 sm:h-80">
                <img
                  src="/assets/apple-gps-route.jpg"
                  alt="Điện thoại hiển thị tuyến đường định vị GPS tới trạm bảo hành"
                  className="gsap-parallax-img w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Bottom Row Right: Flagship Service Center Lounge + Copy (6 cols) */}
            <div className="gsap-reveal lg:col-span-6 rounded-[30px] bg-[#F4F5F7] overflow-hidden flex flex-col justify-between">
              <div className="p-8 sm:p-10 space-y-3">
                <div className="text-xs font-medium text-[#6E6E73]">Hệ thống 5 trung tâm</div>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-[-0.025em] text-[#0A0A0A]">
                  Hà Nội, Đà Nẵng và TP. Hồ Chí Minh.
                </h3>
                <p className="text-sm text-[#6E6E73] leading-relaxed">
                  Không gian tiếp nhận chuyên nghiệp, theo dõi công suất tải từng trạm theo thời gian thực và hỗ trợ giao nhận tận nơi.
                </p>
                <div className="pt-2">
                  <Link
                    to="/submit-request"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0A0A0A] hover:text-[#6E6E73]"
                  >
                    <span>Đặt lịch bảo hành trực tuyến</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="overflow-hidden h-72 sm:h-80">
                <img
                  src="/assets/apple-service-lounge.jpg"
                  alt="Không gian trung tâm bảo hành tối giản tràn ngập ánh sáng tự nhiên"
                  className="gsap-parallax-img w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. EXACT REFERENCE "FAQ" ACCORDION — Framer Motion AnimatePresence Smooth Expand */}
      <section className="gsap-reveal max-w-[1220px] mx-auto px-5 sm:px-8 py-20 sm:py-24">
        <div className="rounded-[34px] bg-white border border-black/[0.06] px-6 py-14 sm:px-14 sm:py-18 space-y-12">
          <div className="text-center space-y-3">
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#4F6DF5] text-white text-[10px] font-semibold uppercase tracking-[0.16em]">
              FAQ
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#0A0A0A]">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-2.5">
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className={`rounded-[22px] transition-colors duration-300 ${
                    isOpen ? "bg-[#F3F4F6] px-7 py-6" : "px-7 py-5 hover:bg-[#F3F4F6]/50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-[15px] sm:text-base font-semibold text-[#0A0A0A]">
                      {item.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ type: "spring", stiffness: 320, damping: 24 }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? "bg-[#0A0A0A] text-white"
                          : "border border-black/20 text-[#0A0A0A]"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-[#6E6E73] leading-relaxed pt-3 pr-10">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. EXACT REFERENCE ROUNDED JET-BLACK CTA BANNER — Floating Circular Medallions + GSAP Counter */}
      <section className="gsap-reveal max-w-[1220px] mx-auto px-5 sm:px-8 pb-20 sm:pb-24">
        <div className="relative overflow-hidden rounded-[34px] bg-[#0A0A0A] text-white px-8 py-12 sm:px-14 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left 7 cols: Bold Title + 2x2 Checkmarks + White & Outline Pill CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <h2 className="font-display text-3xl sm:text-5xl font-semibold tracking-[-0.035em] leading-[1.08]">
                Bắt đầu quản lý bảo hành
                <br className="hidden sm:block" /> thông minh ngay hôm nay!
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-6 text-xs sm:text-sm text-[#A1A1A6]">
                {[
                  "Tự động nhắc trước 30 ngày",
                  "AI bóc tách địa chỉ & định vị GPS",
                  "Xuất thẻ QR xác thực PNG",
                  "Theo dõi tiến độ sửa chữa 6 bước",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-white shrink-0" />
                    <span>{line}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/home"
                  className="editorial-pill-btn inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-white hover:bg-[#E5E7EB] text-[#0A0A0A] text-xs font-semibold"
                >
                  Mở không gian Home
                </Link>
                <Link
                  to="/lookup"
                  className="editorial-pill-btn inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-white/25 hover:border-white text-white text-xs font-semibold"
                >
                  Tra cứu chứng nhận
                </Link>
              </div>
            </div>

            {/* Right 5 cols: Sculptural Orbiting Photo Medallions + Oversized GSAP Stat Counter */}
            <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-between gap-6">
              <div className="relative w-full max-w-[300px] h-[168px]">
                {/* Top-center circular studio photo */}
                <div className="cta-float-1 absolute top-0 left-[34%] w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                  <img
                    src="/assets/apple-service-lounge.jpg"
                    alt="Trung tâm bảo hành"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Mid-left circular studio photo + tiny rose padlock */}
                <div className="cta-float-2 absolute top-11 left-2 w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                  <img
                    src="/assets/apple-hero-devices.jpg"
                    alt="Thiết bị bảo hành"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="cta-float-1 absolute top-8 left-0 w-7 h-7 rounded-full bg-[#F43F5E] text-white flex items-center justify-center shadow-md">
                  <Lock className="w-3.5 h-3.5" />
                </div>

                {/* Bottom-right large circular GPS studio photo + spinning coral gear */}
                <div className="cta-float-2 absolute bottom-0 right-2 w-28 h-28 rounded-full overflow-hidden border-2 border-white/25 shadow-xl">
                  <img
                    src="/assets/apple-gps-route.jpg"
                    alt="Định tuyến GPS"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="cta-spin-slow absolute top-12 right-0 w-9 h-9 rounded-full bg-[#F43F5E] text-white flex items-center justify-center shadow-md">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="cta-float-1 absolute top-1 right-16 w-7 h-7 rounded-full bg-[#4F6DF5] text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="lg:text-right">
                <div
                  className="gsap-sla-counter font-display text-5xl sm:text-6xl font-semibold tracking-[-0.04em] tabular-nums"
                  data-target={kpis.slaRate}
                >
                  {kpis.slaRate}%
                </div>
                <div className="text-xs text-[#86868B] mt-1">
                  Đúng hạn SLA · {kpis.totalRecords} hồ sơ đồng bộ · 5 trung tâm toàn quốc
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
