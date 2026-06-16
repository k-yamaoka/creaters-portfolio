/**
 * サイト共通アイコン (lucide-react 内部実装、2026-06-16 切替)。
 *
 * 旧 Google Material Symbols は OS フォント依存で iOS で色味/重みが
 * 一定でないため、細線・モノクロでサイト全体トーンが揃う lucide-react に
 * 統一。既存呼び出しを壊さないため <MIcon name=... /> 互換のまま、
 * name → lucide コンポーネントのマッピングで実装する。
 *
 * 使い方:
 *   <MIcon name="favorite" />              // outline ハート
 *   <MIcon name="favorite" fill />         // 塗りハート (text-* で色付け)
 *   <MIcon name="check_circle" size={20} />
 *
 * 新しいアイコン名を追加するときは ICON_MAP に lucide コンポーネントを
 * 追加するだけ。NN/g: 「アイコン単独で意味を持たせない、必ずテキスト
 * ラベルを併記する」原則に従い、aria-hidden を既定とする。
 */
import * as React from "react";
import {
  AlertCircle,
  ArrowRight,
  Archive,
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clapperboard,
  CreditCard,
  Film,
  Frown,
  HelpCircle,
  Heart,
  Hourglass,
  Image as ImageIcon,
  Inbox,
  JapaneseYen,
  Link2,
  MessageCircle,
  Meh,
  Pause,
  Pencil,
  Phone,
  Play,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  User,
  Users,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";

// 互換マッピング (旧 Material Symbols 名 → lucide コンポーネント)
const ICON_MAP: Record<string, LucideIcon> = {
  // 旧 MIcon 名
  favorite: Heart,
  movie: Film,
  apartment: Building2,
  work: Briefcase,
  payments: CreditCard,
  yen: JapaneseYen,
  auto_awesome: Sparkles,
  star: Star,
  link: Link2,
  check: Check,
  check_circle: CheckCircle2,
  person: User,
  hourglass_empty: Hourglass,
  sentiment_very_satisfied: Smile,
  sentiment_neutral: Meh,
  sentiment_dissatisfied: Frown,
  verified: BadgeCheck,
  priority_high: AlertCircle,
  close: X,
  arrow_forward: ArrowRight,
  arrow_right: ArrowRight,
  // 追加アイコン (汎用)
  search: Search,
  message: MessageCircle,
  clapperboard: Clapperboard,
  shield_check: ShieldCheck,
  sparkles: Sparkles,
  heart: Heart,
  archive: Archive,
  trash: Trash2,
  calendar: Calendar,
  help: HelpCircle,
  pencil: Pencil,
  send: Send,
  settings: Settings,
  trending_up: TrendingUp,
  users: Users,
  inbox: Inbox,
  image: ImageIcon,
  play: Play,
  pause: Pause,
  volume: Volume2,
  phone: Phone,
};

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  /** アイコン名 (ICON_MAP のキー) */
  name: string;
  /**
   * 塗りつぶし (true で fill="currentColor" 相当)。
   * lucide は標準 outline。fill オプションは Heart / Star など塗り版が
   * 自然なアイコンで意味を持つ。
   */
  fill?: boolean;
  /** ストローク太さ。既定 2 (lucide のデフォルト) */
  weight?: number;
  /** 表示サイズ (px) */
  size?: number;
};

export function MIcon({
  name,
  fill = false,
  weight = 2,
  size = 18,
  className = "",
  style,
  ...rest
}: Props) {
  const Cmp = ICON_MAP[name];
  if (!Cmp) {
    // 開発時に未マッピングを気付かせるため、警告 + 空 span にフォールバック
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[MIcon] unknown icon: ${name}`);
    }
    return null;
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size, verticalAlign: "middle", ...style }}
      {...rest}
    >
      <Cmp
        size={size}
        strokeWidth={weight}
        fill={fill ? "currentColor" : "none"}
        // 線色はテキストカラー継承で統一
        color="currentColor"
      />
    </span>
  );
}
