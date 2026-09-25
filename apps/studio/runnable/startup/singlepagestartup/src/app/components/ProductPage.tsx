import { useState, useCallback, useEffect } from "react";
import {
  getProductBySlug,
  getRelatedProducts,
  type ServiceProduct,
} from "../catalogData";
import { useCart } from "./CartContext";

import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ChevronRight,
  ShoppingCart,
  Minus,
  Plus,
  CheckCircle2,
  Star,
  ArrowRight,
  ArrowUpRight,
  Package,
  Clock,
  ZoomIn,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "./ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { useEscapeStack } from "../hooks/useEscapeStack";

/* ════════════════════════════════════════════════════════════════════════
   WPBakery-style page widgets — each one is a self-contained section
   that looks like a block placed by a visual page builder.
   ════════════════════════════════════════════════════════════════════════ */

/* ── [Widget] Hero Banner ──────────────────────────────────────────── */

function WidgetHeroBanner({ product }: { product: ServiceProduct }) {
  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white">
      <div className="absolute inset-0">
        <ImageWithFallback
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover opacity-[0.07]"
        />
      </div>
      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:py-20">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="transition hover:text-slate-600">
            Home
          </Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/services" className="transition hover:text-slate-600">
            Services
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-600">{product.title}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600 uppercase">
            {product.category}
          </span>
          {product.badge && (
            <span className="rounded-md border border-slate-300 bg-slate-900 px-2 py-0.5 text-[10px] text-white">
              {product.badge}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-3xl tracking-tight text-slate-900 lg:text-4xl">
          {product.title}
        </h1>
        <p className="mt-1 text-slate-500">{product.subtitle}</p>
        <p className="mt-4 max-w-2xl text-sm text-slate-600">
          {product.heroDescription}
        </p>
      </div>
    </section>
  );
}

/* ── [Widget] Product Info + Add to Cart ───────────────────────────── */

function WidgetProductCard({ product }: { product: ServiceProduct }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const handleAdd = () => {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        title: product.title,
        priceLabel: product.priceLabel,
        price: product.price,
        image: product.image,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className="py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Main image */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <ImageWithFallback
              src={product.image}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Cart sidebar */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl text-slate-900">
                  {product.priceLabel}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Project-based pricing. Final quote after discovery call.
              </p>

              {/* Quantity */}
              <div className="mt-5">
                <label className="mb-1.5 block text-xs text-slate-500">
                  Quantity / Licenses
                </label>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-l-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex h-10 w-12 items-center justify-center border-y border-slate-300 bg-white text-sm text-slate-900">
                    {qty}
                  </div>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-r-md border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add to cart */}
              <button
                onClick={handleAdd}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-md border px-4 py-3 text-sm transition ${
                  added
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-slate-400 bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </>
                )}
              </button>
            </div>

            {/* Deliverables */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 flex items-center gap-2 text-sm text-slate-900">
                <Package className="h-4 w-4 text-slate-400" />
                What You Get
              </h3>
              <ul className="space-y-2">
                {product.deliverables.map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-2 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech stack */}
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="mb-3 text-sm text-slate-900">Tech Stack</h3>
              <div className="flex flex-wrap gap-1.5">
                {product.techStack.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── [Widget] Stats Counter ────────────────────────────────────────── */

function WidgetStats({ product }: { product: ServiceProduct }) {
  return (
    <section className="border-y border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-slate-200 md:grid-cols-4">
        {product.stats.map((stat) => (
          <div key={stat.label} className="px-6 py-7 text-center">
            <p className="text-2xl text-slate-900">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── [Widget] Features Grid ────────────────────────────────────────── */

function WidgetFeatures({ product }: { product: ServiceProduct }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
          Capabilities
        </p>
        <h2 className="text-2xl tracking-tight text-slate-900">
          What's Included
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {product.features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
                <f.icon className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-sm text-slate-900">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── [Widget] Process Steps ───────────────────────────────────────── */

function WidgetProcess({ product }: { product: ServiceProduct }) {
  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
          How It Works
        </p>
        <h2 className="text-2xl tracking-tight text-slate-900">Our Process</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {product.process.map((p, idx) => (
            <div
              key={p.step}
              className="relative rounded-xl border border-slate-200 bg-[#eaf0f7] p-5"
            >
              <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm text-slate-900">
                {p.step}
              </span>
              {idx < product.process.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 md:block">
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              )}
              <h3 className="text-sm text-slate-900">{p.title}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── [Widget] Image Gallery ───────────────────────────────────────── */

function WidgetGallery({ product }: { product: ServiceProduct }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [thumbApi, setThumbApi] = useState<CarouselApi>();

  const images = product.galleryImages;
  const total = images.length;

  /* Sync carousel �� active thumbnail */
  const onMainSelect = useCallback(() => {
    if (!api) return;
    const idx = api.selectedScrollSnap();
    setActive(idx);
    thumbApi?.scrollTo(idx);
  }, [api, thumbApi]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onMainSelect);
    onMainSelect();
    return () => {
      api.off("select", onMainSelect);
    };
  }, [api, onMainSelect]);

  /* Click thumbnail → scroll main */
  const selectSlide = (idx: number) => {
    api?.scrollTo(idx);
    setActive(idx);
  };

  /* Lightbox open */
  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  /* Lightbox keyboard nav */
  const lightboxPrev = () => setLightboxIndex((i) => (i - 1 + total) % total);
  const lightboxNext = () => setLightboxIndex((i) => (i + 1) % total);

  useEscapeStack(lightboxOpen, () => setLightboxOpen(false));

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lightboxPrev();
      if (e.key === "ArrowRight") lightboxNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, total]);

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
              Portfolio
            </p>
            <h2 className="text-2xl tracking-tight text-slate-900">
              Project Gallery
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {active + 1} / {total}
          </span>
        </div>

        {/* ── Main Carousel ── */}
        <Carousel setApi={setApi} opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {images.map((img, idx) => (
              <CarouselItem key={idx}>
                <button
                  onClick={() => openLightbox(idx)}
                  className="group relative block w-full overflow-hidden rounded-xl border border-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  <ImageWithFallback
                    src={img}
                    alt={`Gallery ${idx + 1}`}
                    className="aspect-[2/1] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition duration-300 group-hover:bg-slate-900/20">
                    <span className="flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm text-slate-700 opacity-0 shadow-sm backdrop-blur-sm transition duration-300 group-hover:opacity-100">
                      <ZoomIn className="h-4 w-4" />
                      View full size
                    </span>
                  </div>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-3 border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white" />
          <CarouselNext className="right-3 border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm hover:bg-white" />
        </Carousel>

        {/* ── Thumbnails strip ── */}
        <div className="mt-4">
          <Carousel
            setApi={setThumbApi}
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 justify-center">
              {images.map((img, idx) => (
                <CarouselItem
                  key={idx}
                  className="basis-1/6 pl-2 sm:basis-1/7 md:basis-1/8"
                >
                  <button
                    onClick={() => selectSlide(idx)}
                    className={`relative block w-full overflow-hidden rounded-lg border-2 transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      active === idx
                        ? "border-slate-500 shadow-sm"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <ImageWithFallback
                      src={img}
                      alt={`Thumb ${idx + 1}`}
                      className="aspect-[3/2] w-full object-cover"
                    />
                    {active === idx && (
                      <div className="absolute inset-0 rounded-[6px] ring-1 ring-inset ring-slate-500/20" />
                    )}
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        {/* ── Lightbox Dialog ── */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-5xl [&>button]:hidden">
            <DialogTitle className="sr-only">
              Gallery image {lightboxIndex + 1} of {total}
            </DialogTitle>
            <div className="relative">
              {/* Close */}
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-sm transition hover:bg-slate-900/80"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Counter */}
              <div className="absolute top-3 left-3 z-10 rounded-full bg-slate-900/60 px-3 py-1 text-xs text-white backdrop-blur-sm">
                {lightboxIndex + 1} / {total}
              </div>

              {/* Image */}
              <ImageWithFallback
                src={images[lightboxIndex]}
                alt={`Gallery ${lightboxIndex + 1}`}
                className="w-full rounded-xl object-contain"
              />

              {/* Nav arrows */}
              {total > 1 && (
                <>
                  <button
                    onClick={lightboxPrev}
                    className="absolute top-1/2 left-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-sm transition hover:bg-slate-900/80"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={lightboxNext}
                    className="absolute top-1/2 right-3 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-sm transition hover:bg-slate-900/80"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox thumbnails */}
            <div className="mt-3 flex justify-center gap-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`overflow-hidden rounded-md border-2 transition ${
                    lightboxIndex === idx
                      ? "border-white shadow-lg"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`Thumb ${idx + 1}`}
                    className="h-12 w-18 object-cover"
                  />
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

/* ── [Widget] Testimonials ─────────────────────────────────────────── */

function WidgetTestimonials({ product }: { product: ServiceProduct }) {
  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
              Client Feedback
            </p>
            <h2 className="text-2xl tracking-tight text-slate-900">
              What Clients Say
            </h2>
          </div>
        </div>
        <Carousel opts={{ loop: true, align: "start" }} className="w-full">
          <CarouselContent className="-ml-4">
            {product.testimonials.map((t) => (
              <CarouselItem key={t.name} className="pl-4 md:basis-1/2">
                <div className="h-full rounded-xl border border-slate-200 bg-[#eaf0f7] p-6">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700">"{t.text}"</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
                    <ImageWithFallback
                      src={t.avatar}
                      alt={t.name}
                      className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-sm text-slate-900">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="mt-6 flex items-center justify-center gap-2">
            <CarouselPrevious className="static translate-y-0 border-slate-200 bg-white shadow-sm hover:bg-slate-50" />
            <CarouselNext className="static translate-y-0 border-slate-200 bg-white shadow-sm hover:bg-slate-50" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

/* ── [Widget] FAQ Accordion ────────────────────────────────────────── */

function WidgetFaq({ product }: { product: ServiceProduct }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
              FAQ
            </p>
            <h2 className="text-2xl tracking-tight text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Can't find the answer you're looking for? Reach out to our team
              and we'll get back to you within 24 hours.
            </p>
            <Link
              to="/#contact"
              className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-1">
            <Accordion type="single" collapsible className="w-full">
              {product.faq.map((item, idx) => (
                <AccordionItem
                  key={idx}
                  value={`faq-${idx}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <AccordionTrigger className="px-4 py-3 text-sm text-slate-900 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-slate-600">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── [Widget] Related Products ─────────────────────────────────────── */

function WidgetRelated({ product }: { product: ServiceProduct }) {
  const related = getRelatedProducts(product);
  if (related.length === 0) return null;

  return (
    <section className="border-y border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-2 text-xs tracking-widest text-slate-500 uppercase">
          You Might Also Need
        </p>
        <h2 className="text-2xl tracking-tight text-slate-900">
          Related Services
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {related.map((rel) => (
            <Link
              key={rel.id}
              to={`/services/${rel.slug}`}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-[#eaf0f7] transition hover:border-slate-400"
            >
              <div className="aspect-[16/9] overflow-hidden">
                <ImageWithFallback
                  src={rel.image}
                  alt={rel.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 uppercase">
                    {rel.category}
                  </span>
                  <span className="text-sm text-slate-900">
                    {rel.priceLabel}
                  </span>
                </div>
                <h3 className="text-sm text-slate-900 group-hover:text-slate-700">
                  {rel.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{rel.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── [Widget] CTA Banner ───────────────────────────────────────────── */

function WidgetCta({ product }: { product: ServiceProduct }) {
  const { addItem } = useCart();

  const handleCtaAdd = () => {
    addItem({
      id: product.id,
      slug: product.slug,
      title: product.title,
      priceLabel: product.priceLabel,
      price: product.price,
      image: product.image,
    });
  };

  return (
    <section className="bg-slate-900 py-16">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-2xl tracking-tight text-white lg:text-3xl">
          {product.ctaTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
          {product.ctaDescription}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleCtaAdd}
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-white px-5 py-2.5 text-sm text-slate-900 transition hover:bg-slate-100"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
          <Link
            to="/#contact"
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-5 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Book a Call
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Main Product Page — composes all widgets in a WPBakery-like layout
   ════════════════════════════════════════════════════════════════════════ */

export function ProductPage() {
  const { slug } = useParams();
  const product = slug ? getProductBySlug(slug) : undefined;

  if (!product) {
    return (
      <main className="flex flex-1 items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl text-slate-900">Service not found</h1>
          <p className="mt-2 text-sm text-slate-500">
            The service you're looking for doesn't exist.
          </p>
          <Link
            to="/services"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1">
      {/* Widget: Hero Banner */}
      <WidgetHeroBanner product={product} />

      {/* Widget: Product Card + Add to Cart */}
      <WidgetProductCard product={product} />

      {/* Widget: Stats Counter */}
      <WidgetStats product={product} />

      {/* Widget: Features Grid */}
      <WidgetFeatures product={product} />

      {/* Widget: Process Steps */}
      <WidgetProcess product={product} />

      {/* Widget: Image Gallery */}
      <WidgetGallery product={product} />

      {/* Widget: Testimonials */}
      <WidgetTestimonials product={product} />

      {/* Widget: FAQ Accordion */}
      <WidgetFaq product={product} />

      {/* Widget: Related Products */}
      <WidgetRelated product={product} />

      {/* Widget: CTA Banner */}
      <WidgetCta product={product} />
    </main>
  );
}
