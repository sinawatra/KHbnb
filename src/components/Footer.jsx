"use client";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-10 border-t">
      <div className="p-10 text-center text-black bg-white flex">
        <div className="mx-auto text-left">
          <h1 className="text-primary font-bold text-xl mb-4">KHbnb</h1>
          <p className="text-gray-500 font-semibold">
            {t("footer.tagline")}
          </p>
        </div>
        <div className="mx-auto text-left">
          <h2 className="font-bold">{t("footer.province")}</h2>
          <p>{t("provinces.siem_reap")}</p>
          <p>{t("provinces.kep")}</p>
          <p>{t("provinces.kampot")}</p>
          <p>{t("provinces.sihanouk_ville")}</p>
          <p>{t("provinces.phnom_penh")}</p>
        </div>
      </div>
      <div className="p-10 text-center text-black border-t">
        {t("footer.copyright")}
      </div>
    </footer>
  );
}
