import Title from "./pages/Title";

export default function Deck() {
  return (
    <div
      aria-label="Fixture deck"
      data-presentation-ready="true"
      data-slide-count="2"
    >
      {["First TSX page", "Second TSX page"].map((title, index) => (
        <section
          key={title}
          data-slide-id={`page-${index}`}
          aria-label={title}
          className="h-[180px] w-[320px]"
        >
          <Title title={title} />
        </section>
      ))}
    </div>
  );
}
