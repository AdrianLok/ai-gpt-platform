import { useEffect, useState } from "react";
import { creditsStorageKey, readStorageItem, writeStorageItem } from "../lib/storage";

export const initialCredits = 20;
export const generationCreditCost = 1;

export function useCredits(projectLoaded: boolean) {
  const [credits, setCredits] = useState(initialCredits);

  useEffect(() => {
    const creditsRaw = readStorageItem(creditsStorageKey);
    if (creditsRaw !== null) {
      const parsedCredits = Number(creditsRaw);
      if (Number.isFinite(parsedCredits)) {
        setCredits(Math.max(0, parsedCredits));
      }
    }
  }, []);

  useEffect(() => {
    if (!projectLoaded) return;

    writeStorageItem(creditsStorageKey, String(credits));
  }, [projectLoaded, credits]);

  function spendCredits(amount = generationCreditCost) {
    setCredits((current) => Math.max(0, current - amount));
  }

  function rechargeCredits(amount: number) {
    setCredits((current) => current + amount);
  }

  return { credits, setCredits, spendCredits, rechargeCredits };
}
