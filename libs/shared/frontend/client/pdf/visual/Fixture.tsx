import { useRef } from "react";
import { createRoot } from "react-dom/client";
import { useElementPdfDownload } from "../src";
import diagram from "./assets/diagram.svg";
import "./styles.css";

function Fixture() {
  const element = useRef<HTMLElement>(null);
  const pdf = useElementPdfDownload();
  return (
    <main className="bg-[#eee] p-6">
      <article
        ref={element}
        data-testid="pdf-fixture"
        className="flex h-[600px] w-[400px] flex-col overflow-hidden bg-[#fffdf7] p-7 font-['Fixture_Manrope'] text-[#102738]"
      >
        <p className="text-xs font-extrabold tracking-[0.18em]">
          ELEMENT PDF / 01
        </p>
        <h1 className="mt-5 text-[32px] font-extrabold leading-[1.08] tracking-[-0.04em]">
          Проверка шрифта и переносов текста
        </h1>
        <p className="mt-4 text-[15px] font-medium leading-[1.5]">
          Один макет, три размера: HTML, растр и PDF. Точный порядок, пропорции
          и чёткие буквы.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#e59eaf] p-4">
            <strong className="text-2xl">400 × 600</strong>
            <p className="mt-1 text-xs">CSS pixels</p>
          </div>
          <div className="rounded-xl bg-[#f2ba58] p-4">
            <strong className="text-2xl">300 × 450</strong>
            <p className="mt-1 text-xs">PDF points</p>
          </div>
        </div>
        <img
          className="mt-5 h-[120px] w-full rounded-xl object-cover object-center"
          src={diagram}
          alt="Centered gold circle with cropped pink and green panels"
        />
        <p className="mt-auto border-t border-[#102738] pt-3 text-xs font-bold">
          Lossless PNG · Кириллица · 0123456789
        </p>
      </article>
      <div className="mt-4 flex gap-4">
        <button
          className="rounded bg-[#102738] px-4 py-2 text-white"
          type="button"
          onClick={() =>
            void pdf.generate(() => {
              if (!element.current) {
                throw new Error("Fixture not mounted");
              }
              return {
                elements: [element.current],
                page: {
                  sourceWidthPx: 400,
                  sourceHeightPx: 600,
                  outputWidthPx: 1200,
                  outputHeightPx: 1800,
                  pdfWidthPt: 300,
                  pdfHeightPt: 450,
                },
                metadata: {
                  title: "Deterministic element PDF",
                  author: "SPS",
                  subject: "Visual regression",
                  creator: "Element PDF fixture",
                },
              };
            })
          }
        >
          Generate PDF
        </button>
        {pdf.url && (
          <a
            className="p-2 underline"
            href={pdf.url}
            download="element-pdf-fixture.pdf"
          >
            Download PDF
          </a>
        )}
        <p role="status">
          {pdf.status}
          {pdf.error ? `: ${pdf.error.message}` : ""}
        </p>
      </div>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Fixture />);
