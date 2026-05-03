import { FormEvent, KeyboardEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type SearchBarProps = {
  onSearch: (query: string) => void;
};

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length >= 2) {
      onSearch(trimmedQuery);
    }
  }, [onSearch, query]);

  const submitSearch = () => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length > 0) {
      onSearch(trimmedQuery);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitSearch();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submitSearch();
    }
  };

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-2 shadow-xl shadow-slate-950/30 backdrop-blur">
        <input
          className="min-w-0 flex-1 rounded-2xl bg-transparent px-4 py-4 text-base text-slate-100 outline-none placeholder:text-slate-400 sm:text-lg"
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("search_placeholder")}
          type="search"
          value={query}
        />
        <button
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary"
          type="submit"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">{t("search_placeholder")}</span>
        </button>
      </div>
    </form>
  );
};
