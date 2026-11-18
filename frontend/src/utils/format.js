export const formatDateVN = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDateTimeVN = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatCurrencyVN = (num) => {
  const n = Number(num || 0);
  if (n === 0) return "Miễn phí BH";
  return `${n.toLocaleString("vi-VN")} ₫`;
};

export const formatPriceNumber = (num) => {
  const n = Number(num || 0);
  return `${n.toLocaleString("vi-VN")} ₫`;
};

export const getRecordStatusMeta = (status, daysRemaining) => {
  if (status === "rejected") {
    return {
      label: "Đã thu hồi",
      badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/70",
      dotClass: "bg-rose-500",
      barClass: "bg-rose-500",
    };
  }
  if (status === "expired" || (typeof daysRemaining === "number" && daysRemaining < 0)) {
    return {
      label: typeof daysRemaining === "number" ? `Hết hạn ${Math.abs(daysRemaining)} ngày` : "Đã hết hạn",
      badgeClass: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
      dotClass: "bg-slate-400",
      barClass: "bg-slate-400",
    };
  }
  if (status === "expiring" || (typeof daysRemaining === "number" && daysRemaining <= 30)) {
    return {
      label: typeof daysRemaining === "number" ? `Sắp đáo hạn · ${daysRemaining} ngày` : "Sắp hết hạn",
      badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
      dotClass: "bg-amber-500",
      barClass: "bg-amber-500",
    };
  }
  return {
    label: typeof daysRemaining === "number" ? `Còn hiệu lực · ${daysRemaining} ngày` : "Còn hiệu lực",
    badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80",
    dotClass: "bg-emerald-500",
    barClass: "bg-indigo-600",
  };
};

export const getTicketStatusMeta = (status) => {
  switch (status) {
    case "Tiếp nhận":
      return {
        badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
        dotClass: "bg-slate-500",
      };
    case "Đang kiểm tra":
      return {
        badgeClass: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200/80",
        dotClass: "bg-sky-500",
      };
    case "Chờ linh kiện":
    case "Chờ duyệt":
      return {
        badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200/80",
        dotClass: "bg-amber-500",
      };
    case "Đang sửa chữa":
      return {
        badgeClass: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200/80",
        dotClass: "bg-indigo-600",
      };
    case "Đã sửa xong":
    case "Đã trả khách":
      return {
        badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80",
        dotClass: "bg-emerald-500",
      };
    case "Từ chối bảo hành":
      return {
        badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80",
        dotClass: "bg-rose-500",
      };
    default:
      return {
        badgeClass: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
        dotClass: "bg-slate-400",
      };
  }
};
