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

/* Quiet, Apple-style status indicators: neutral typography + crisp 6px dot */
export const getRecordStatusMeta = (status, daysRemaining) => {
  if (status === "rejected") {
    return {
      label: "Đã thu hồi",
      badgeClass: "text-[#6E6E73] bg-[#F5F5F7]",
      dotClass: "bg-rose-500",
      barClass: "bg-rose-500",
    };
  }
  if (status === "expired" || (typeof daysRemaining === "number" && daysRemaining < 0)) {
    return {
      label: typeof daysRemaining === "number" ? `Hết hạn ${Math.abs(daysRemaining)} ngày` : "Đã hết hạn",
      badgeClass: "text-[#6E6E73] bg-[#F5F5F7]",
      dotClass: "bg-neutral-400",
      barClass: "bg-neutral-400",
    };
  }
  if (status === "expiring" || (typeof daysRemaining === "number" && daysRemaining <= 30)) {
    return {
      label: typeof daysRemaining === "number" ? `Còn ${daysRemaining} ngày` : "Sắp hết hạn",
      badgeClass: "text-[#1D1D1F] bg-[#F5F5F7]",
      dotClass: "bg-amber-500",
      barClass: "bg-amber-500",
    };
  }
  return {
    label: typeof daysRemaining === "number" ? `Còn ${daysRemaining} ngày` : "Còn hiệu lực",
    badgeClass: "text-[#1D1D1F] bg-[#F5F5F7]",
    dotClass: "bg-emerald-500",
    barClass: "bg-[#1D1D1F]",
  };
};

export const getTicketStatusMeta = (status) => {
  switch (status) {
    case "Tiếp nhận":
      return {
        badgeClass: "text-[#6E6E73] bg-[#F5F5F7]",
        dotClass: "bg-neutral-400",
      };
    case "Đang kiểm tra":
      return {
        badgeClass: "text-[#1D1D1F] bg-[#F5F5F7]",
        dotClass: "bg-sky-500",
      };
    case "Chờ linh kiện":
    case "Chờ duyệt":
      return {
        badgeClass: "text-[#1D1D1F] bg-[#F5F5F7]",
        dotClass: "bg-amber-500",
      };
    case "Đang sửa chữa":
      return {
        badgeClass: "text-[#1D1D1F] bg-[#F5F5F7]",
        dotClass: "bg-[#0071E3]",
      };
    case "Đã sửa xong":
    case "Đã trả khách":
      return {
        badgeClass: "text-[#1D1D1F] bg-[#F5F5F7]",
        dotClass: "bg-emerald-500",
      };
    case "Từ chối bảo hành":
      return {
        badgeClass: "text-[#6E6E73] bg-[#F5F5F7]",
        dotClass: "bg-rose-500",
      };
    default:
      return {
        badgeClass: "text-[#6E6E73] bg-[#F5F5F7]",
        dotClass: "bg-neutral-400",
      };
  }
};
