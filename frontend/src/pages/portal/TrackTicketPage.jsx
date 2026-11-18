import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  ShieldCheck,
  UserCheck,
  Wrench,
  Cpu,
} from "lucide-react";
import { ticketsApi } from "../../api/client";
import {
  formatCurrencyVN,
  formatDateTimeVN,
  getTicketStatusMeta,
} from "../../utils/format";
import { useToast } from "../../context/ToastContext";

export const TrackTicketPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketParam = searchParams.get("ticket") || "";
  const toast = useToast();

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const loadTickets = async (preferCode = ticketParam) => {
    setLoading(true);
    try {
      const res = await ticketsApi.list({});
      const list = res.data || [];
      setTickets(list);

      const target = preferCode
        ? list.find((t) => t.warrantyCode.toUpperCase() === preferCode.toUpperCase())
        : list[0];

      if (target) {
        const detail = await ticketsApi.detail(target.warrantyCode);
        setSelected(detail.data);
      } else if (list[0]) {
        const detail = await ticketsApi.detail(list[0].warrantyCode);
        setSelected(detail.data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets(ticketParam);
  }, [ticketParam]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatText.trim() || !selected) return;
    setSendingChat(true);
    try {
      const res = await ticketsApi.addMessage(selected._id, { text: chatText });
      setSelected((prev) => ({ ...prev, messages: res.data.messages }));
      setChatText("");
      toast.success("Đã gửi tin nhắn tới kỹ thuật viên phụ trách.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingChat(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!selected) return;
    try {
      const res = await ticketsApi.confirmReceipt(selected._id);
      setSelected((prev) => ({ ...prev, ...res.data }));
      toast.success(res.message);
      loadTickets(selected.warrantyCode);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const statusMeta = selected ? getTicketStatusMeta(selected.status) : null;

  return (
    <div className="space-y-8">
      {/* Header & Ticket Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
            <Wrench className="w-4 h-4" />
            <span>Theo Dõi Tiến Độ Kỹ Thuật 6 Bước</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tiến độ xử lý hồ sơ bảo hành
          </h1>
          <p className="text-sm text-slate-500">
            Cập nhật minh bạch từng khâu chẩn đoán, xuất kho linh kiện và trao đổi trực tiếp với KTV.
          </p>
        </div>

        {/* Switcher */}
        <div className="flex flex-wrap gap-2">
          {tickets.slice(0, 5).map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => setSearchParams({ ticket: t.warrantyCode })}
              className={`px-3.5 py-2 rounded-xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                selected?.warrantyCode === t.warrantyCode
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.warrantyCode}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-sm text-slate-500">
          Đang tải tiến độ phiếu bảo hành...
        </div>
      )}

      {!loading && selected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 6-Step Progress + Parts */}
          <div className="lg:col-span-7 space-y-6">
            {/* Ticket Summary Header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 space-y-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-sm font-extrabold text-indigo-600">
                      #{selected.warrantyCode}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                      {selected.status}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                    {selected.productName}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Serial: {selected.productSerial} · Gói: {selected.servicePackage}
                  </p>
                </div>

                {selected.status !== "Đã trả khách" && selected.status !== "Từ chối bảo hành" && (
                  <button
                    type="button"
                    onClick={handleConfirmReceipt}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Nghiệm thu nhận máy</span>
                  </button>
                )}
              </div>

              {/* Technician Note Highlight */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                <div className="text-xs font-bold text-slate-700">Kết luận / Ghi chú kỹ thuật hiện tại</div>
                <p className="text-xs text-slate-600 leading-relaxed">{selected.technicianNotes}</p>
              </div>

              {/* 6-Step Vertical Timeline */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-slate-900">Quy trình xử lý tiêu chuẩn 6 bước</h3>
                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {(selected.timelineSteps || []).map((step) => {
                    const isDone = step.state === "completed";
                    const isActive = step.state === "active";
                    return (
                      <div key={step.step} className="relative">
                        <span
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isActive
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-2.5 h-2.5" />
                          )}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isActive
                              ? "bg-indigo-50/40 border-indigo-200"
                              : "bg-white border-slate-100"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              Bước {step.step}. {step.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {step.state !== "pending" ? formatDateTimeVN(step.timestamp) : "Đang chờ"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Replacement Parts Card */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>Linh kiện xuất kho &amp; Chi phí dự kiến</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  Tổng phí KH: {formatCurrencyVN(selected.repairCost)}
                </span>
              </div>

              {(selected.replacementParts || []).length > 0 ? (
                <div className="space-y-2.5">
                  {selected.replacementParts.map((part, i) => (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">
                          {part.partName}{" "}
                          <span className="font-mono text-indigo-600">({part.partCode})</span>
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {part.warehouseLocation} · {part.coveragePolicy}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        {formatCurrencyVN(part.customerPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Chưa phát sinh thay thế linh kiện phần cứng trên phiếu này.
                </p>
              )}
            </div>
          </div>

          {/* Right: Specialist Info + Live Chat */}
          <div className="lg:col-span-5 space-y-6">
            {/* Assigned Station & Specialist */}
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Kỹ thuật viên phụ trách
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selected.assignedTechnician?.name} ({selected.assignedTechnician?.level})
                  </div>
                  <div className="text-xs text-slate-500">{selected.assignedBranch?.name}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Địa chỉ trạm: {selected.assignedBranch?.address}</span>
              </div>
            </div>

            {/* Live Chat Box */}
            <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden flex flex-col h-[460px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Trao đổi trực tiếp trên phiếu</h3>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/50">
                {(selected.messages || []).map((m, idx) => {
                  const isCust = m.senderRole === "customer";
                  const isSys = m.senderRole === "system";
                  if (isSys) {
                    return (
                      <div
                        key={idx}
                        className="text-center text-[11px] text-slate-500 bg-white border border-slate-200/70 rounded-xl px-3 py-2"
                      >
                        {m.text}
                      </div>
                    );
                  }
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col max-w-[85%] ${
                        isCust ? "ml-auto items-end" : "mr-auto items-start"
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 mb-1 px-1">
                        {m.senderName} · {formatDateTimeVN(m.createdAt)}
                      </span>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isCust
                            ? "bg-indigo-600 text-white rounded-br-xs"
                            : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              <form
                onSubmit={handleSendChat}
                className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2"
              >
                <input
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Nhập câu hỏi hoặc ghi chú gửi kỹ thuật viên..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sendingChat}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
