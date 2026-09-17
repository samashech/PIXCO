import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Blocks,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  Gamepad2,
  Grid2X2,
  Heart,
  Home,
  Keyboard,
  Layers,
  LayoutGrid,
  List,
  Menu,
  Pause,
  Play,
  Power,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
const icons = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  AudioLines,
  Blocks,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Expand,
  Gamepad2,
  Grid2X2,
  Heart,
  Home,
  Keyboard,
  Layers,
  LayoutGrid,
  List,
  Menu,
  Pause,
  Play,
  Power,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
  Star,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
};
export type IconName = keyof typeof icons;
export function Icon({
  name,
  size = 18,
  ...props
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Component = icons[name];
  return <Component size={size} strokeWidth={1.7} {...props} />;
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <div className={`brand ${small ? "brand-small" : ""}`}>
      <svg viewBox="0 0 29 29" aria-hidden="true">
        <path
          d="M1 1h8v8H1zm10 0h8v8h-8zm0 10h8v8h-8zm10 0h8v8h-8zm0 10h8v8h-8z"
          fill="currentColor"
        />
      </svg>
      <span>
        BRICKBOX<span className="brand-dot">™</span>
      </span>
    </div>
  );
}
