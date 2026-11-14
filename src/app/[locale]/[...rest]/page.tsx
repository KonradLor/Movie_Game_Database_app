import { notFound } from "next/navigation";

// Bet koks nežinomas adresas po /[locale] -> lokalizuotas not-found.tsx
// (be šito Next rodytų angliškąjį numatytąjį 404 be meniu).
export default function CatchAllPage() {
  notFound();
}
