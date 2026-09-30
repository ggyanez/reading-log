import LibraryView from "@/components/LibraryView";
import { getBooks } from "@/lib/data";

export default async function BibliotecaPage() {
  const books = await getBooks();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Biblioteca</h1>
      <LibraryView books={books} />
    </div>
  );
}
