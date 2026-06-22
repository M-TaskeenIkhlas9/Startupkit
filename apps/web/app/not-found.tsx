import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-bold text-ink">Company Object not found</h1>
      <p className="mt-2 text-ink-soft">
        It may have been created in a previous API session (the demo store is in-memory).
      </p>
      <Link href="/intake" className="mt-6 inline-block font-semibold text-teal">
        Create a new one →
      </Link>
    </div>
  );
}
