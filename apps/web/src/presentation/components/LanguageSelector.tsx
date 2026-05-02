import { useTranslation } from "react-i18next";

const languages = [
  { code: "ga", label: "Gaeilge", flag: "🇮🇪" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" }
] as const;

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (languageCode: (typeof languages)[number]["code"]) => {
    await i18n.changeLanguage(languageCode);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((language) => {
        const isActive = i18n.resolvedLanguage === language.code;

        return (
          <button
            className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-emerald-300 bg-emerald-300/20 text-emerald-100"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25 hover:bg-white/10"
            }`}
            key={language.code}
            onClick={() => {
              void changeLanguage(language.code);
            }}
            type="button"
          >
            <span className="mr-2">{language.flag}</span>
            <span>{language.code}</span>
          </button>
        );
      })}
    </div>
  );
};
