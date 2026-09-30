import { TRACKS, type Book } from "@/lib/books";
import { formatMinutes } from "@/lib/time";

const SELECTED_STYLES = {
  informatica: "border-career bg-career-soft",
  general: "border-personal bg-personal-soft",
};

const STRIPE = {
  informatica: "bg-career",
  general: "bg-personal",
};

/** A large, tappable book used to pick what you just read. */
export default function BookCard({
  book,
  selected,
  onSelect,
}: {
  book: Book;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex w-full overflow-hidden rounded-3xl border-2 text-left transition active:scale-[0.98] ${
        selected ? SELECTED_STYLES[book.library] : "border-line bg-surface"
      }`}
    >
      <span className={`w-1.5 shrink-0 ${STRIPE[book.library]}`} aria-hidden />
      <span className="min-w-0 flex-1 px-4 py-3.5">
        <span className="block text-xs font-medium tracking-wide text-muted uppercase">
          {TRACKS[book.library].label}
        </span>
        <span className="mt-0.5 block font-serif text-lg leading-snug font-semibold">
          {book.title}
        </span>
        <span className="mt-1 flex justify-between gap-3 text-sm text-muted">
          <span className="truncate">{book.author ?? ""}</span>
          <span className="tabular shrink-0">
            {book.totalMinutes > 0 ? formatMinutes(book.totalMinutes) : "Sin registros"}
          </span>
        </span>
      </span>
    </button>
  );
}
