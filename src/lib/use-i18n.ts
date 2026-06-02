import { translate, type I18nKey } from "./i18n";
import { useApp } from "./shiftora-store";

export function useI18n() {
  const language = useApp((s) => s.language);
  return {
    language,
    t: (key: I18nKey) => translate(language, key),
  };
}
