import {
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";

export function Component() {
  return (
    <a
      href="/ai-chat/"
      data-ds-block="website-builder.logotype.ai-chat"
      data-module="website-builder"
      data-model="logotype"
      data-id="ai-chat-logotype"
      data-variant="ai-chat"
      className={`group relative isolate inline-flex shrink-0 items-center gap-3 rounded-xl ${kit.focus}`}
      aria-label="SPS AI Chat home"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-3 -z-10 rounded-full bg-linear-to-r from-sps-green via-sps-green/30 to-sps-grey opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 200 200"
        className="size-9 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-focus-visible:-rotate-6 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <path
          d="M100 -4.37114e-06C146.634 -2.33268e-06 169.952 -1.31346e-06 184.642 14.2361C185.022 14.6041 185.396 14.9781 185.764 15.3579C200 30.0484 200 53.3656 200 100C200 146.634 200 169.952 185.764 184.642C185.396 185.022 185.022 185.396 184.642 185.764C169.952 200 146.634 200 100 200C53.3656 200 30.0484 200 15.3579 185.764C14.9781 185.396 14.6041 185.022 14.236 184.642C-2.26876e-05 169.952 -2.16684e-05 146.634 -1.96299e-05 100C-1.75915e-05 53.3656 -1.65722e-05 30.0484 14.2361 15.3579C14.6041 14.9781 14.9781 14.6041 15.3579 14.2361C30.0484 -7.42882e-06 53.3656 -6.40959e-06 100 -4.37114e-06Z"
          fill="#111111"
        />
        <rect
          x="85.7234"
          y="28.6198"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="57.1724"
          y="57.1721"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="114.276"
          y="28.6199"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="142.828"
          y="57.1721"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="28.6194"
          y="114.276"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="57.1724"
          y="85.7238"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="85.7234"
          y="85.7238"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="114.276"
          y="114.276"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="114.276"
          y="85.7239"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <path
          d="M85.7234 57.1721L57.1709 57.1721L85.7234 28.6196L85.7234 57.1721Z"
          fill="white"
        />
        <path
          d="M114.276 142.828H142.829L114.276 171.381V142.828Z"
          fill="white"
        />
        <rect
          x="85.7234"
          y="142.828"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
        <rect
          x="57.1724"
          y="142.828"
          width="28.5525"
          height="28.5525"
          fill="white"
        />
      </svg>
      <span className="text-lg font-semibold tracking-tight">
        sps{" "}
        <span className="text-sps-muted transition-colors group-hover:text-sps-graphite group-focus-visible:text-sps-graphite motion-reduce:transition-none">
          ai chat
        </span>
      </span>
      <span
        aria-hidden="true"
        className="absolute -right-3 -top-2 scale-50 text-sps-green opacity-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
      >
        <Icon name="star" className="size-4" />
      </span>
    </a>
  );
}
