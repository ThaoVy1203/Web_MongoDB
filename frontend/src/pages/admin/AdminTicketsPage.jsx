import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Sparkles,
  Send,
  Cpu,
  Ban,
  UserCheck,
  Search,
} from "lucide-react";
import { ticketsApi } from "../../api/client";
import {
  formatCurrencyVN,
  formatDateTimeVN,
  getTicketStatusMeta,
} from "../../utils/format";
import { useToast } from "../../context/ToastContext";

const STATUS_OPTIONS = [
  "Tiếp nhận",
  "Đang kiểm tra",
  "Chờ linh kiện",
  "Chờ duyệt",
  "Đang sửa chữa",
  "Đã sửa xong",
  "Đã trả khách",
];

export const AdminTicketsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketParam = searchParams.get("ticket") || "";
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [queueCounts, setQueueCounts] = useState({});
  const [branches, setBranches] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [queue, setQueue] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  // Forms for selected ticket
  const [statusVal, setStatusVal] = useState("Tiếp nhận");
  const [techNote, setTechNote] = useState("");
  const [branchCode, setBranchCode] = useState("HN-CG");
  const [techCode, setTechCode] = useState("KTV-01");
  const [partForm, setPartForm] = useState({ partName: "", partCode: "", customerPrice: 0 });
  const [replyText, setReplyText] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const loadList = async (preferCode = ticketParam) => {
    try {
      const res = await ticketsApi.list({ queue, q });
      const list = res.data || [];
      setTickets(list);
      setQueueCounts(res.queueCounts || {});
      setBranches(res.branches || []);
      setTechnicians(res.technicians || []);

      const target =
        (preferCode && list.find((t) => t.warrantyCode === preferCode)) ||
        list[0];
      if (target) {
        selectTicket(target.warrantyCode);
      } else {
        setSelected(null);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const selectTicket = async (code) => {
    try {
      const res = await ticketsApi.detail(code);
      const d = res.data;
      setSelected(d);
      setStatusVal(d.status);
      setTechNote(d.technicianNotes || "");
      setBranchCode(d.assignedBranch?.code || "HN-CG");
      setTechCode(d.assignedTechnician?.code || "KTV-01");
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadList(ticketParam);
  }, [queue]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const res = await ticketsApi.updateStatus(selected._id, {
        status: statusVal,
        technicianNotes: techNote,
      });
      toast.success(res.message);
      selectTicket(selected.warrantyCode);
      loadList(selected.warrantyCode);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selected) return;
    try {
      const res = await ticketsApi.assign(selected._id, { branchCode, techCode });
      toast.success(res.message);
      selectTicket(selected.warrantyCode);
      loadList(selected.warrantyCode);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!selected || !partForm.partName.trim()) return;
    try {
      const res = await ticketsApi.addPart(selected._id, partForm);
      toast.success(res.message);
      setPartForm({ partName: "", partCode: "", customerPrice: 0 });
      selectTicket(selected.warrantyCode);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    try {
      const res = await ticketsApi.addMessage(selected._id, {
        text: replyText,
        senderRole: "technician",
        senderName: `KTV ${selected.assignedTechnician?.name || "WarrantyOps"}`,
      });
      setSelected((prev) => ({ ...prev, messages: res.data.messages }));
      setReplyText("");
      toast.success("Đã gửi phản hồi sang cổng Theo dõi của khách hàng!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    try {
      const res = await ticketsApi.reject(selected._id, {
        reason: rejectReason || "Thiết bị cấn móp/ngấm ẩm ngoài phạm vi bảo hành tiêu chuẩn",
      });
      toast.info(res.message);
      setRejectReason("");
      selectTicket(selected.warrantyCode);
      loadList(selected.warrantyCode);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const visibleList = tickets.filter((t) => {
    if (!q.trim()) return true;
    const kw = q.trim().toLowerCase();
    return (
      t.warrantyCode.toLowerCase().includes(kw) ||
      t.productName.toLowerCase().includes(kw) ||
      t.customerName.toLowerCase().includes(kw) ||
      t.productSerial.toLowerCase().includes(kw)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Bàn Điều Phối Phiếu RMA (Master-Detail)
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Xử lý trạng thái kỹ thuật, điều phối trạm theo gợi ý AI, xuất kho linh kiện và phản hồi khách hàng.
        </p>
      </div>

      {/* Queue Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: `Tất cả (${queueCounts.all || 0})` },
            { id: "waiting", label: `Tiếp nhận (${queueCounts.waiting || 0})` },
            { id: "processing", label: `Đang sửa (${queueCounts.processing || 0})` },
            { id: "parts", label: `Chờ linh kiện (${queueCounts.parts || 0})` },
            { id: "done", label: `Hoàn tất (${queueCounts.done || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setQueue(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                queue === tab.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Lọc nhanh mã phiếu, Serial..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Master-Detail Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List */}
        <div className="lg:col-span-4 space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
          {visibleList.map((item) => {
            const st = getTicketStatusMeta(item.status);
            const active = selected?.warrantyCode === item.warrantyCode;
            return (
              <button
                key={item._id}
                type="button"
                onClick={() => {
                  setSearchParams({ ticket: item.warrantyCode });
                  selectTicket(item.warrantyCode);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  active
                    ? "bg-white border-[#0A0A0A] ring-2 ring-black/10 shadow-xs"
                    : "bg-white border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#0A0A0A]">
                    {item.warrantyCode}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.badgeClass}`}>
                    {item.status}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 truncate mt-1.5">
                  {item.productName}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex justify-between">
                  <span>{item.customerName}</span>
                  <span className="font-mono text-[11px]">{item.productSerial}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Detail Workspace */}
        <div className="lg:col-span-8">
          {selected ? (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-8 space-y-7 shadow-[0_2px_10px_rgba(15,23,42,0.02)]">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="font-mono text-xs font-bold text-[#0A0A0A]">
                    PHIẾU #{selected.warrantyCode} · SN: {selected.productSerial}
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {selected.productName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Khách hàng: <span className="font-semibold text-slate-800">{selected.customerName}</span> ({selected.customerPhone}) · {selected.customerAddress}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                  {selected.status}
                </span>
              </div>

              {/* Issue + AI Station Match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-slate-400">Mô tả lỗi khách báo</div>
                  <p className="text-xs text-slate-700 leading-relaxed">{selected.issueDescription}</p>
                </div>

                {selected.aiSuggestion?.matched && (
                  <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0A0A0A]">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#0A0A0A]" /> AI Đề xuất Trạm
                      </span>
                      <span>{selected.aiSuggestion.confidence}% khớp</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {selected.aiSuggestion.primary.name}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-500">
                        KTV gợi ý: {selected.aiSuggestion.primary.recommendedTech?.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBranchCode(selected.aiSuggestion.primary.code);
                          if (selected.aiSuggestion.primary.recommendedTech?.code) {
                            setTechCode(selected.aiSuggestion.primary.recommendedTech.code);
                          }
                          toast.info("Đã chọn trạm & KTV theo đề xuất AI — bấm Phân công để lưu.");
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#0A0A0A] hover:bg-neutral-800 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                      >
                        Áp dụng AI
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update & Assign Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <form onSubmit={handleUpdateStatus} className="space-y-3 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-900">1. Cập nhật Tiến độ &amp; Chẩn đoán</div>
                  <select
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <textarea
                    rows={2}
                    value={techNote}
                    onChange={(e) => setTechNote(e.target.value)}
                    placeholder="Ghi chú kỹ thuật hiển thị trên timeline..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Lưu trạng thái mới
                  </button>
                </form>

                <form onSubmit={handleAssign} className="space-y-3 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#0A0A0A]" />
                    <span>2. Điều phối Chi nhánh &amp; Kỹ thuật viên</span>
                  </div>
                  <select
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    {branches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name} (Tải {b.loadPercent}%)
                      </option>
                    ))}
                  </select>
                  <select
                    value={techCode}
                    onChange={(e) => setTechCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  >
                    {technicians.map((t) => (
                      <option key={t.code} value={t.code}>
                        {t.name} — {t.level} ({t.branch})
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                  >
                    Phân công xử lý
                  </button>
                </form>
              </div>

              {/* Parts Export */}
              <div className="p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-[#0A0A0A]" /> Xuất kho Linh kiện Thay thế ({(selected.replacementParts || []).length})
                  </span>
                  <span className="text-xs font-semibold text-emerald-700">
                    Tổng thu KH: {formatCurrencyVN(selected.repairCost)}
                  </span>
                </div>

                {(selected.replacementParts || []).length > 0 && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 divide-y divide-slate-100 text-xs">
                    {selected.replacementParts.map((part, idx) => (
                      <div key={part.partCode || idx} className="px-3.5 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-800 truncate">{part.partName}</div>
                          <div className="font-mono text-[10px] text-slate-400">
                            {part.partCode} · {part.coveragePolicy || "Linh kiện chính hãng"}
                          </div>
                        </div>
                        <span className="font-bold text-slate-700 shrink-0 tabular-nums">
                          {formatCurrencyVN(part.customerPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddPart} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    placeholder="Tên linh kiện..."
                    value={partForm.partName}
                    onChange={(e) => setPartForm({ ...partForm, partName: e.target.value })}
                    className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Phí KH (0 = Miễn phí)"
                    value={partForm.customerPrice}
                    onChange={(e) => setPartForm({ ...partForm, customerPrice: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="submit"
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    + Xuất linh kiện
                  </button>
                </form>
              </div>

              {/* Customer Chat & Reject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-900">Phản hồi nhanh cho Khách hàng</div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    {(selected.messages || []).slice(-3).map((m, i) => (
                      <div key={i} className="text-slate-600">
                        <span className="font-bold text-slate-800">{m.senderName}:</span> {m.text}{" "}
                        <span className="text-[10px] text-slate-400">({formatDateTimeVN(m.createdAt)})</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Gửi thông báo tiến độ tới khách..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-rose-700 flex items-center gap-1">
                    <Ban className="w-3.5 h-3.5" /> Từ chối Bảo hành (Vi phạm điều khoản)
                  </div>
                  <input
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do biên bản (VD: Thiết bị vào nước)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleReject}
                    className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer"
                  >
                    Xác nhận Từ chối Bảo hành
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-sm text-slate-400">
              Chọn một phiếu RMA bên trái để bắt đầu xử lý.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
