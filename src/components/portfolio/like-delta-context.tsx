"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * いいね delta を子コンポーネント (LikeButton) → 親集計 (Hero の総いいね) に
 * 伝搬するための Context。
 *
 * クリエイター詳細ページのように Hero の総いいね数と各 LikeButton が
 * 離れて配置されているケースで、prop-drilling せずに即時集計を実現する。
 *
 * - 一覧画面など onLikeChange prop で直接受けるケースは Context 不要
 * - 詳細画面では LikeDeltaProvider で囲い、TotalLikesBadge が delta を読む
 */
type LikeDeltaContextValue = {
  /** 個別 portfolio_item の delta マップ */
  deltas: Record<string, number>;
  /** 全 delta の合計 (Hero の総いいね 補正用) */
  totalDelta: number;
  /** LikeButton から呼び出される delta 通知 */
  applyDelta: (itemId: string, delta: number) => void;
};

const LikeDeltaContext = createContext<LikeDeltaContextValue | null>(null);

export function LikeDeltaProvider({ children }: { children: ReactNode }) {
  const [deltas, setDeltas] = useState<Record<string, number>>({});

  const applyDelta = useCallback((itemId: string, delta: number) => {
    setDeltas((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + delta,
    }));
  }, []);

  const totalDelta = useMemo(
    () => Object.values(deltas).reduce((sum, d) => sum + d, 0),
    [deltas]
  );

  const value = useMemo(
    () => ({ deltas, totalDelta, applyDelta }),
    [deltas, totalDelta, applyDelta]
  );

  return (
    <LikeDeltaContext.Provider value={value}>
      {children}
    </LikeDeltaContext.Provider>
  );
}

/**
 * Provider が無い文脈 (= 一覧画面など) で呼ばれても安全な no-op を返す。
 * LikeButton はこの hook を unconditional に呼んでいい。
 */
export function useLikeDeltaApply() {
  return useContext(LikeDeltaContext)?.applyDelta;
}

/** Hero の総いいねバッジ等で使う、全アイテム合計 delta */
export function useTotalLikeDelta() {
  return useContext(LikeDeltaContext)?.totalDelta ?? 0;
}
