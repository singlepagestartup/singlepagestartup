import { forwardRef, type SVGProps } from "react";
import { twMerge } from "tailwind-merge";
import starFillSvg from "../../assets/singlepage/icons/phosphor/star-fill.svg?raw";
import {
  Icon,
  type IconName,
} from "../../design/singlepage/interface-kit/primitives";

export interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
export type ModuleIcon = ReturnType<typeof createIcon>;

function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}

// Semantic names keep existing module interaction contracts; every glyph is official Phosphor Regular.
export const AlertTriangle = createIcon("warning");
export const ArrowDown = createIcon("arrow-down");
export const ArrowLeft = createIcon("arrow-left");
export const ArrowRight = createIcon("arrow-right");
export const ArrowUpRight = createIcon("arrow-up-right");
export const BarChart3 = createIcon("chart-bar");
export const Bell = createIcon("bell");
export const Bold = createIcon("text-b");
export const BookOpen = createIcon("book-open");
export const Bookmark = createIcon("bookmark-simple");
export const Bot = createIcon("robot");
export const Box = createIcon("cube");
export const Calendar = createIcon("calendar-blank");
export const Check = createIcon("check");
export const CheckCircle2 = createIcon("check-circle");
export const ChevronDown = createIcon("caret-down");
export const ChevronLeft = createIcon("caret-left");
export const ChevronRight = createIcon("caret-right");
export const Chrome = createIcon("google-chrome-logo");
export const CircleHelp = createIcon("question");
export const CircleDollarSign = createIcon("currency-circle-dollar");
export const CircleUserRound = createIcon("user-circle");
export const Clock = createIcon("clock");
export const Code = createIcon("code");
export const CreditCard = createIcon("credit-card");
export const Database = createIcon("database");
export const Edit = createIcon("pencil-simple");
export const ExternalLink = createIcon("arrow-square-out");
export const Eye = createIcon("eye");
export const EyeOff = createIcon("eye-slash");
export const FileText = createIcon("file-text");
export const Github = createIcon("github-logo");
export const Globe = createIcon("globe");
export const Hash = createIcon("hash");
export const Home = createIcon("house");
export const Image = createIcon("image");
export const Italic = createIcon("text-italic");
export const KeyRound = createIcon("key");
export const Landmark = createIcon("bank");
export const Layers = createIcon("stack");
export const LayoutDashboard = createIcon("squares-four");
export const Link = createIcon("link");
export const Link2 = createIcon("link");
export const Linkedin = createIcon("linkedin-logo");
export const List = createIcon("list");
export const Lock = createIcon("lock-key");
export const LogIn = createIcon("sign-in");
export const LogOut = createIcon("sign-out");
export const Mail = createIcon("envelope");
export const MapPin = createIcon("map-pin");
export const Megaphone = createIcon("megaphone");
export const Menu = createIcon("list");
export const MessageCircle = createIcon("chat-circle");
export const MessageSquare = createIcon("chat");
export const Minus = createIcon("minus");
export const Monitor = createIcon("monitor");
export const Newspaper = createIcon("newspaper");
export const Package = createIcon("package");
export const Palette = createIcon("palette");
export const Paperclip = createIcon("paperclip");
export const PartyPopper = createIcon("confetti");
export const Phone = createIcon("phone");
export const Pin = createIcon("push-pin");
export const Play = createIcon("play");
export const Plus = createIcon("plus");
export const Save = createIcon("floppy-disk");
export const Search = createIcon("magnifying-glass");
export const Send = createIcon("paper-plane-tilt");
export const Settings = createIcon("gear-six");
export const Share2 = createIcon("share-network");
export const Shield = createIcon("shield");
export const ShieldCheck = createIcon("shield-check");
export const ShoppingCart = createIcon("shopping-cart");
export const Smile = createIcon("smiley");
export const Star = createIcon("star");
/** Official Phosphor Fill geometry for filled rating values. */
export const StarFilled = forwardRef<SVGSVGElement, IModuleIconProps>(
  function StarFilled({ className, size = 20, children, ...props }, ref) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 256 256"
        fill="currentColor"
        width={size}
        height={size}
        className={twMerge("h-5 w-5 shrink-0", className)}
        {...props}
        ref={ref}
        dangerouslySetInnerHTML={{
          __html: starFillSvg
            .replace(/<svg[^>]*>/, "")
            .replace(/<\/svg>\s*$/, ""),
        }}
      />
    );
  },
);
export const Tag = createIcon("tag");
export const ThumbsUp = createIcon("thumbs-up");
export const Trash2 = createIcon("trash");
export const TrendingUp = createIcon("trend-up");
export const Twitter = createIcon("twitter-logo");
export const Unlink = createIcon("link-break");
export const User = createIcon("user");
export const UserPlus = createIcon("user-plus");
export const UserRound = createIcon("user");
export const Users = createIcon("users");
export const Wallet = createIcon("wallet");
export const X = createIcon("x");
export const Zap = createIcon("lightning");
