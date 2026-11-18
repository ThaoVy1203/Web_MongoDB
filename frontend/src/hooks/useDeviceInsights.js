import { useCallback, useEffect, useRef, useState } from "react";
import { analyticsApi } from "../api/client";

// Memory cache phía client để chuyển qua lại giữa các trang/hồ sơ mở lên tức thì
const clientCache = new Map();

const makeKey = (name = "", months = 12) => `${String(name || "").trim().toLowerCase()}__${months}m`;

/**
 * Plug-and-play hook tra cứu xu hướng bảo hành & lỗi phổ biến gần đây cho bất kỳ thiết bị nào.
 * Có thể dùng ở mọi trang (Hồ sơ cá nhân, Tra cứu, Sổ thiết bị, Admin...).
 *
 * Ví dụ:
 *   const { insight, loading, error, analyze, refresh } = useDeviceInsights();
 *   analyze("Acer Nitro 5", "Laptop/Máy tính", { timeframeMonths: 6 });
 */
export const useDeviceInsights = (autoDeviceName = "", autoCategory = "") => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const lastQueryRef = useRef({ deviceName: "", category: "", timeframeMonths: 12 });
  const reqIdRef = useRef(0);

  const analyze = useCallback(
    async (deviceName, category = "", { timeframeMonths = 12, forceRefresh = false } = {}) => {
      const trimmed = String(deviceName || "").trim();
      if (trimmed.length < 2) {
        setError("Vui lòng nhập tên thiết bị (tối thiểu 2 ký tự).");
        return null;
      }

      const months = Number(timeframeMonths) === 6 ? 6 : 12;
      lastQueryRef.current = { deviceName: trimmed, category, timeframeMonths: months };
      const cacheKey = makeKey(trimmed, months);

      if (!forceRefresh && clientCache.has(cacheKey)) {
        const cached = clientCache.get(cacheKey);
        setInsight(cached);
        setError("");
        return cached;
      }

      const myReqId = ++reqIdRef.current;
      setLoading(true);
      setError("");

      try {
        const res = await analyticsApi.deviceInsights({
          deviceName: trimmed,
          category,
          timeframeMonths: months,
          forceRefresh,
        });
        if (myReqId !== reqIdRef.current) return null;
        const data = res?.data || null;
        if (data) {
          clientCache.set(cacheKey, data);
          setInsight(data);
        }
        return data;
      } catch (err) {
        if (myReqId !== reqIdRef.current) return null;
        setError(err.message || "Không thể tổng hợp dữ liệu thiết bị lúc này.");
        return null;
      } finally {
        if (myReqId === reqIdRef.current) setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(() => {
    const { deviceName, category, timeframeMonths } = lastQueryRef.current;
    if (!deviceName) return Promise.resolve(null);
    return analyze(deviceName, category, { timeframeMonths, forceRefresh: true });
  }, [analyze]);

  const reset = useCallback(() => {
    reqIdRef.current += 1;
    setInsight(null);
    setError("");
    setLoading(false);
  }, []);

  useEffect(() => {
    if (autoDeviceName && autoDeviceName.trim().length >= 2) {
      analyze(autoDeviceName, autoCategory);
    }
  }, [autoDeviceName, autoCategory, analyze]);

  return {
    insight,
    loading,
    error,
    analyze,
    refresh,
    reset,
  };
};
