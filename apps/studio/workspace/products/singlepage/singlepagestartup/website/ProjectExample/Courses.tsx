import { memo, useCallback, useMemo, useState, type FormEvent } from "react";
import { Icon } from "../../../../../design/singlepage/interface-kit/primitives";
import type { IExampleProps, IExampleCourse } from "./interface";
import { exampleCourses, examplePrice } from "./content";
import { Action, AppHeader, Back, CourseArt, Screen, ui } from "./primitives";

interface IExampleReceipt {
  items: IExampleCourse[];
  total: number;
  currency: "RUB" | "USD";
  email: string;
  method: string;
}

interface ICourseCardProps {
  course: IExampleCourse;
  price: string;
  inCart: boolean;
  labels: Record<string, string>;
  onOpen: (id: string) => void;
  onAdd: (id: string) => void;
  onCart: () => void;
}
const CourseCard = memo(function CourseCard({
  course,
  price,
  inCart,
  labels: l,
  onOpen,
  onAdd,
  onCart,
}: ICourseCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-[#e3e8eb] bg-white">
      <button
        type="button"
        aria-label={course.title}
        onClick={() => onOpen(course.id)}
        className={`block w-full p-3 text-left ${ui.focus}`}
      >
        <CourseArt title={course.title} compact />
        <p className="mt-3 text-[10px] text-[#61717c]">{course.lessons}</p>
        <h4 className="mt-2 text-sm font-semibold leading-5">{course.title}</h4>
        <p className="mt-2 text-xs leading-5 text-[#61717c]">
          {course.description}
        </p>
        <p className="mt-3 text-lg font-semibold">{price}</p>
      </button>
      <div className="px-3 pb-3">
        <Action
          className="w-full"
          onClick={() => (inCart ? onCart() : onAdd(course.id))}
        >
          <Icon name={inCart ? "check" : "plus"} size={20} />
          {l[inCart ? "demo-in-cart" : "demo-add-cart"]}
        </Action>
      </div>
    </article>
  );
});

export function Courses({ labels: l }: IExampleProps) {
  const courses = useMemo(() => exampleCourses(l), [l]);
  const [view, setView] = useState<
    "catalog" | "detail" | "cart" | "checkout" | "complete" | "lesson"
  >("catalog");
  const [selected, setSelected] = useState(courses[0].id);
  const [currency, setCurrency] = useState<"RUB" | "USD">("RUB");
  const [payment, setPayment] = useState("card");
  const [cart, setCart] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [receipt, setReceipt] = useState<IExampleReceipt | null>(null);
  const course = courses.find((item) => item.id === selected) ?? courses[0];
  const items = courses.filter((item) => cart.includes(item.id));
  const amount = (item: IExampleCourse) =>
    currency === "RUB" ? item.rub : item.usd;
  const total = items.reduce((sum, item) => sum + amount(item), 0);
  const add = useCallback(
    (id: string) =>
      setCart((previous) =>
        previous.includes(id) ? previous : [...previous, id],
      ),
    [],
  );
  const openCourse = useCallback((id: string) => {
    setSelected(id);
    setView("detail");
  }, []);
  const openCart = useCallback(() => setView("cart"), []);
  const checkout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.length) return;
    setReceipt({ items, total, currency, email, method: payment });
    setCart([]);
    setView("complete");
  };
  const price = (value: number) => examplePrice(value, currency);
  return (
    <>
      <AppHeader title={l["demo-courses-name"]} icon="book-open">
        <Action
          tone="quiet"
          aria-label={`${l["demo-cart"]}: ${cart.length}`}
          onClick={() => setView("cart")}
        >
          <Icon name="shopping-cart" size={20} />
          <span>{cart.length}</span>
        </Action>
      </AppHeader>
      <Screen screenKey={view}>
        {view === "catalog" || view === "detail" || view === "cart" ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#61717c]">
            <label htmlFor="sps-demo-currency">{l["demo-currency"]}</label>
            <select
              id="sps-demo-currency"
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as "RUB" | "USD");
                setPayment("card");
              }}
              className="min-h-10 rounded-xl border border-[#dce3e6] bg-white px-3 text-xs text-[#18232a]"
            >
              <option value="RUB">₽ RUB</option>
              <option value="USD">$ USD</option>
            </select>
          </div>
        ) : null}
        {view === "catalog" ? (
          <>
            <h3 className="text-xl font-semibold leading-tight">
              {l["demo-courses-title"]}
            </h3>
            <p className="text-xs leading-5 text-[#61717c]">
              {l["demo-courses-description"]}
            </p>
            {courses.map((item) => (
              <CourseCard
                key={item.id}
                course={item}
                price={price(amount(item))}
                inCart={cart.includes(item.id)}
                labels={l}
                onOpen={openCourse}
                onAdd={add}
                onCart={openCart}
              />
            ))}
          </>
        ) : null}
        {view === "detail" ? (
          <>
            <Back onClick={() => setView("catalog")}>{l["demo-catalog"]}</Back>
            <CourseArt title={course.title} />
            <h3 className="text-xl font-semibold leading-tight">
              {course.title}
            </h3>
            <p className="text-xs leading-5 text-[#61717c]">
              {course.description}
            </p>
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full bg-white px-3 py-2">
                {course.lessons}
              </span>
              <span className="rounded-full bg-white px-3 py-2">
                {l["demo-course-access"]}
              </span>
            </div>
            <h4 className="text-sm font-semibold">{l["demo-program"]}</h4>
            <ol className={`${ui.card} space-y-3`}>
              {["idea", "build", "launch"].map((key, index) => (
                <li key={key} className="flex gap-3 text-xs leading-5">
                  <span className="font-semibold">0{index + 1}</span>
                  {l[`demo-program-${key}`]}
                </li>
              ))}
            </ol>
            <p className="text-xl font-semibold">{price(amount(course))}</p>
            <Action
              className="w-full"
              onClick={() => {
                add(course.id);
                setView("cart");
              }}
            >
              {l["demo-add-cart"]}
            </Action>
          </>
        ) : null}
        {view === "cart" ? (
          <>
            <Back onClick={() => setView("catalog")}>{l["demo-catalog"]}</Back>
            <h3 className="text-xl font-semibold">{l["demo-cart"]}</h3>
            {items.length ? (
              <>
                {items.map((item) => (
                  <div key={item.id} className={`${ui.card} space-y-2`}>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs">{price(amount(item))}</span>
                      <Action
                        tone="quiet"
                        aria-label={`${l["demo-remove"]}: ${item.title}`}
                        onClick={() =>
                          setCart((previous) =>
                            previous.filter((id) => id !== item.id),
                          )
                        }
                      >
                        <Icon name="trash" size={20} />
                      </Action>
                    </div>
                  </div>
                ))}
                <p className="flex flex-wrap justify-between gap-2 border-t border-[#dce3e6] pt-4 text-sm font-semibold">
                  <span>{l["demo-total"]}</span>
                  <span>{price(total)}</span>
                </p>
                <Action className="w-full" onClick={() => setView("checkout")}>
                  {l["demo-checkout"]}
                </Action>
              </>
            ) : (
              <div className={`${ui.card} space-y-3`}>
                <Icon name="shopping-cart" size={24} />
                <p className="text-sm">{l["demo-cart-empty"]}</p>
                <Action onClick={() => setView("catalog")}>
                  {l["demo-choose-course"]}
                </Action>
              </div>
            )}
          </>
        ) : null}
        {view === "checkout" ? (
          <form onSubmit={checkout} className="space-y-4">
            <Back onClick={() => setView("cart")}>{l["demo-cart"]}</Back>
            <h3 className="text-xl font-semibold">{l["demo-checkout"]}</h3>
            <label className="block space-y-2 text-xs font-medium">
              <span>{l["demo-access-email"]}</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={ui.input}
                placeholder={l["demo-email-placeholder"]}
              />
            </label>
            <fieldset>
              <legend className="mb-2 text-xs font-medium">
                {l["demo-payment"]}
              </legend>
              {(currency === "RUB" ? ["card", "sbp"] : ["card"]).map(
                (method) => (
                  <label
                    key={method}
                    className="mb-2 flex min-h-11 items-center gap-2 rounded-xl border border-[#dce3e6] bg-white p-3 text-xs"
                  >
                    <input
                      type="radio"
                      name="sps-demo-payment"
                      checked={payment === method}
                      onChange={() => setPayment(method)}
                      className="accent-[#18232a]"
                    />
                    <Icon
                      name={method === "card" ? "credit-card" : "bank"}
                      size={20}
                    />
                    {l[`demo-payment-${method}`]}
                  </label>
                ),
              )}
            </fieldset>
            <div className={`${ui.card} space-y-2`}>
              {items.map((item) => (
                <p key={item.id} className="text-xs leading-5">
                  {item.title}
                </p>
              ))}
              <p className="border-t border-[#e3e8eb] pt-3 text-lg font-semibold">
                {price(total)}
              </p>
            </div>
            <p className="text-[10px] leading-4 text-[#61717c]">
              {l["demo-payment-note"]}
            </p>
            <Action type="submit" className="w-full">
              {l["demo-confirm-order"]}
            </Action>
          </form>
        ) : null}
        {view === "complete" && receipt ? (
          <div
            role="status"
            className="space-y-4 rounded-2xl border border-[#c7de9a] bg-[#edf6e1] p-4"
          >
            <Icon name="check-circle" size={24} />
            <h3 className="text-xl font-semibold">{l["demo-order-success"]}</h3>
            <p className="break-words text-xs leading-5">{receipt.email}</p>
            <p className="text-xs leading-5">
              {l["demo-payment"]}: {l[`demo-payment-${receipt.method}`]}
            </p>
            {receipt.items.map((item) => (
              <p key={item.id} className="text-sm font-medium">
                {item.title}
              </p>
            ))}
            <p className="text-lg font-semibold">
              {examplePrice(receipt.total, receipt.currency)}
            </p>
            <p className="text-[10px] leading-4 text-[#61717c]">
              {l["demo-payment-note"]}
            </p>
            <Action className="w-full" onClick={() => setView("lesson")}>
              {l["demo-open-course"]}
            </Action>
          </div>
        ) : null}
        {view === "lesson" ? (
          <>
            <Back onClick={() => setView("catalog")}>{l["demo-catalog"]}</Back>
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-[#18232a] text-[#bfef61]">
              <Icon name="book-open" size={24} />
            </div>
            <h3 className="text-xl font-semibold">{l["demo-lesson-title"]}</h3>
            <p className="text-xs leading-6 text-[#61717c]">
              {l["demo-lesson-body"]}
            </p>
            <ol className={`${ui.card} space-y-3 text-xs leading-5`}>
              {["idea", "build", "launch"].map((key) => (
                <li key={key} className="flex gap-2">
                  <Icon name="check-circle" size={20} />
                  {l[`demo-program-${key}`]}
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </Screen>
    </>
  );
}
