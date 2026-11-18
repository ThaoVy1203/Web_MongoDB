import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  Search,
  RefreshCw,
  Star,
  AlertTriangle,
  Ban,
  ExternalLink,
} from "lucide-react";
import { ticketsApi } from "../../api/client";
import {
  formatCurrencyVN,
  formatDateTimeVN,
  getTicketStatusMeta,
} from "../../utils/format";
import { Modal } from "../../components/common/Modal";
import { useToast } from "../../context/ToastContext";

export const TrackTicketPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketParam = searchParams.get("ticket") || "";
  const toast = useToast();
  const chatBottomRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [chatText, setChatText] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  // Confirm receipt + CSAT modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [csatScore, setCsatScore] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [confirming, setConfirming] = useState(false);

  const loadTickets = async (preferCode = ticketParam, silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await ticketsApi.list({});
      const list = res.data || [];
      setTickets(list);

      if (list.length === 0) {
        setSelected(null);
        return;
      }

      let target = preferCode
        ? list.find(
            (t) =>
              t.warrantyCode.toUpperCase() === preferCode.toUpperCase() ||
              t.productSerial.toUpperCase() === preferCode.toUpperCase()
          )
        : list[0];

      if (preferCode && !target) {
        toast.warning(`Không tìm thấy phiếu #${preferCode}. Đang hiển thị phiếu mới nhất.`);
        target = list[0];
      }

      if (target) {
        const detail = await ticketsApi.detail(target.warrantyCode);
        setSelected(detail.data);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets(ticketParam);
  }, [ticketParam]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messages?.length, selected?._id]);

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

  const handleConfirmReceipt = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setConfirming(true);
    try {
      const res = await ticketsApi.confirmReceipt(selected._id, {
        csatScore,
        feedback,
      });
      setSelected((prev) => ({ ...prev, ...res.data }));
      setConfirmOpen(false);
      setFeedback("");
      toast.success(res.message);
      loadTickets(selected.warrantyCode, true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirming(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchQ.trim()) return true;
    const kw = searchQ.trim().toLowerCase();
    return (
      t.warrantyCode.toLowerCase().includes(kw) ||
      t.productSerial.toLowerCase().includes(kw) ||
      t.productName.toLowerCase().includes(kw)
    );
  });

  const statusMeta = selected ? getTicketStatusMeta(selected.status) : null;
  const isClosed =
    selected && (selected.status === "Đã trả khách" || selected.status === "Từ chối bảo hành");
  const canConfirmReceipt = selected && selected.status === "Đã sửa xong";

  return (
    <div className="space-y-8">
      {/* Header & Ticket Search / Switcher */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A0A]">
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

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm mã phiếu, Serial..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <button
              type="button"
              onClick={() => loadTickets(selected?.warrantyCode || ticketParam, true)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              title="Làm mới trạng thái & tin nhắn"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#0A0A0A]" : ""}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Ticket Switcher */}
        {filteredTickets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {filteredTickets.map((t) => {
              const active = selected?.warrantyCode === t.warrantyCode;
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setSearchParams({ ticket: t.warrantyCode })}
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                    active
                      ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-mono">{t.warrantyCode}</span>
                  <span className={`text-[10px] ${active ? "text-neutral-300" : "text-slate-400"}`}>
                    · {t.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-sm text-slate-500">
          Đang tải tiến độ phiếu bảo hành...
        </div>
      )}

      {!loading && !selected && (
        <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center space-y-3">
          <img
            src="/assets/empty-vault.jpg"
            alt="Empty Tickets"
            className="w-28 h-28 object-cover rounded-2xl mx-auto"
          />
          <h3 className="text-base font-bold text-slate-900">Chưa có phiếu yêu cầu bảo hành nào</h3>
          <p className="text-xs text-slate-500">
            Khi bạn gửi yêu cầu bảo hành, tiến độ xử lý 6 bước sẽ hiển thị trực tiếp tại đây.
          </p>
          <Link
            to="/submit-request"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A0A0A] text-white text-xs font-semibold"
          >
            Tạo yêu cầu bảo hành mới
          </Link>
        </div>
      )}

      {!loading && selected && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 6-Step Progress + Parts */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white border border-slate-200/80 p-6 sm:p-7 space-y-5 shadow-[0_2px_10px_rgba(15,23,42,0.02)]"
            >
              {/* Rejection Notice Banner */}
              {selected.status === "Từ chối bảo hành" && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
                  <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Phiếu không đủ điều kiện bảo hành miễn phí</div>
                    <p className="mt-0.5 text-rose-700">
                      {selected.rejectionReason || "Thiết bị vi phạm điều kiện bảo hành chính hãng."}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-[#0A0A0A]">
                      #{selected.warrantyCode}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotClass}`} />
                      {selected.status}
                    </span>
                    {selected.isSlaBreached && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold">
                        <AlertTriangle className="w-3 h-3" /> Quá mốc SLA
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 pt-0.5">
                    {selected.productName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <Link
                      to={`/lookup?q=${encodeURIComponent(selected.productSerial)}`}
                      className="font-mono text-[#0A0A0A] hover:underline inline-flex items-center gap-1"
                    >
                      SN: {selected.productSerial}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span>·</span>
                    <span>{selected.servicePackage}</span>
                    {selected.estimatedReturnDate && !isClosed && (
                      <>
                        <span>·</span>
                        <span>Dự kiến trả: {formatDateTimeVN(selected.estimatedReturnDate)}</span>
                      </>
                    )}
                  </div>
                </div>

                {canConfirmReceipt && (
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Nghiệm thu &amp; Đánh giá</span>
                  </button>
                )}
              </div>

              {/* Fault Description + Tech Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Mô tả sự cố tiếp nhận
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{selected.issueDescription}</p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200 space-y-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]">
                    Kết luận kỹ thuật hiện tại
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {selected.technicianNotes || "Đang chờ kỹ thuật viên cập nhật chẩn đoán."}
                  </p>
                </div>
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
                                ? "bg-[#0A0A0A] text-white"
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
                              ? "bg-[#F4F5F7] border-neutral-300"
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
                  <Cpu className="w-4 h-4 text-[#0A0A0A]" />
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
                          <span className="font-mono text-[#0A0A0A]">({part.partCode})</span>
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
            <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#F4F5F7] text-[#0A0A0A] flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Kỹ thuật viên phụ trách
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    {selected.assignedTechnician?.name || "Đang phân công"}{" "}
                    {selected.assignedTechnician?.level ? `(${selected.assignedTechnician.level})` : ""}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selected.assignedBranch?.name || "Trung tâm WarrantyOps"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Địa chỉ trạm: {selected.assignedBranch?.address || "Đang cập nhật"}</span>
              </div>
            </div>

            {/* Live Chat Box */}
            <div className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden flex flex-col h-[460px]">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#0A0A0A]" />
                  <h3 className="text-sm font-bold text-slate-900">Trao đổi trực tiếp trên phiếu</h3>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                  <span className={`w-2 h-2 rounded-full ${isClosed ? "bg-slate-300" : "bg-emerald-500"}`} />
                  {isClosed ? "Đã đóng" : "Trực tuyến"}
                </span>
              </div>

              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/50">
                {(selected.messages || []).length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 text-center px-6">
                    Chưa có tin nhắn trao đổi nào. Hãy nhắn câu hỏi để kỹ thuật viên phụ trách hỗ trợ ngay.
                  </div>
                ) : (
                  (selected.messages || []).map((m, idx) => {
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
                              ? "bg-[#0A0A0A] text-white rounded-br-xs"
                              : "bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              <form
                onSubmit={handleSendChat}
                className="p-3.5 bg-white border-t border-slate-100 flex items-center gap-2"
              >
                <input
                  disabled={isClosed || sendingChat}
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder={
                    isClosed
                      ? "Hồ sơ đã đóng — không thể gửi thêm tin nhắn"
                      : "Nhập câu hỏi hoặc ghi chú gửi kỹ thuật viên..."
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-none focus:border-[#0A0A0A] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isClosed || sendingChat || !chatText.trim()}
                  className="p-2.5 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Receipt & CSAT Modal */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Xác nhận Nghiệm thu Bàn giao Thiết bị"
        subtitle={selected ? `Phiếu #${selected.warrantyCode} · ${selected.productName}` : ""}
      >
        <form onSubmit={handleConfirmReceipt} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Xác nhận bạn đã kiểm tra và nhận lại thiết bị hoạt động ổn định. Phiếu sẽ chuyển sang trạng thái{" "}
            <strong>Đã trả khách</strong> và lưu biên bản nghiệm thu điện tử.
          </p>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Đánh giá mức độ hài lòng dịch vụ (CSAT)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setCsatScore(star)}
                  className="p-1.5 rounded-xl hover:bg-amber-50 transition-colors cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= csatScore
                        ? "fill-amber-400 text-amber-500"
                        : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-slate-700 ml-1">{csatScore}/5 sao</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nhận xét cho kỹ thuật viên (tùy chọn)
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="VD: Sửa nhanh, máy chạy mát và ổn định..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0A0A0A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Để sau
            </button>
            <button
              type="submit"
              disabled={confirming}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {confirming ? "Đang xác nhận..." : "Xác nhận đã nhận máy"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
