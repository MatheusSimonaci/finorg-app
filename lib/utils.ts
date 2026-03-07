import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function generateTransactionHash(
  date: string,
  description: string,
  amount: number
): string {
  return createHash("sha256")
    .update(`${date}::${description}::${amount}`)
    .digest("hex")
    .slice(0, 16);
}
