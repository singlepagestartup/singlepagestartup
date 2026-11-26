import type { IOrderDownload } from "./interface";

export function downloadOrderFixture(file: IOrderDownload) {
  const title =
    file.kind === "receipt"
      ? "Studio receipt sample"
      : `Studio strategy sample: ${file.filename}`;
  const content = `BT /F1 18 Tf 50 740 Td (${title}) Tj ET\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const positions = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${positions.length + 1}\n0000000000 65535 f \n`;
  pdf += positions
    .map((position) => `${String(position).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Root 1 0 R /Size ${positions.length + 1} >>\nstartxref\n${xref}\n%%EOF\n`;

  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
