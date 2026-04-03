"use client";

import {
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Info,
  Clock,
  Heart,
  MessageCircle,
  Repeat,
  Share,
  User,
  Users,
  Star,
  Trophy,
  Zap,
  Flame,
  Gift,
  ImageIcon,
  Play,
  Pause,
  Wallet,
  Coins,
  Plus,
  Minus,
  RefreshCw,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
} from "lucide-react";
import { useSnapAccentScopeStyle } from "../hooks/use-snap-accent";

export const ICON_MAP: Record<string, LucideIcon> = {
  "arrow-right": ArrowRight,
  "arrow-left": ArrowLeft,
  "external-link": ExternalLink,
  "chevron-right": ChevronRight,
  check: Check,
  x: X,
  "alert-triangle": AlertTriangle,
  info: Info,
  clock: Clock,
  heart: Heart,
  "message-circle": MessageCircle,
  repeat: Repeat,
  share: Share,
  user: User,
  users: Users,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  flame: Flame,
  gift: Gift,
  image: ImageIcon,
  play: Play,
  pause: Pause,
  wallet: Wallet,
  coins: Coins,
  plus: Plus,
  minus: Minus,
  "refresh-cw": RefreshCw,
  bookmark: Bookmark,
  "thumbs-up": ThumbsUp,
  "thumbs-down": ThumbsDown,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
};

const SIZE_PX: Record<string, number> = {
  sm: 16,
  md: 20,
};

export function SnapIcon({
  element: { props },
}: {
  element: { props: Record<string, unknown> };
}) {
  const name = String(props.name ?? "info");
  const size = SIZE_PX[String(props.size ?? "md")] ?? 20;
  const color = props.color ? String(props.color) : undefined;
  const accentStyle = useSnapAccentScopeStyle();

  const Icon = ICON_MAP[name];
  if (!Icon) return null;

  const isAccent = !color || color === "accent";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...(isAccent ? accentStyle : {}),
      }}
    >
      <Icon
        size={size}
        style={
          isAccent
            ? { color: "var(--snap-accent, currentColor)" }
            : { color: `var(--snap-color-${color}, currentColor)` }
        }
      />
    </span>
  );
}
