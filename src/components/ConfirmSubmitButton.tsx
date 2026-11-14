"use client";

// Formos mygtukas negrįžtamam veiksmui: prieš siunčiant formą klausia patvirtinimo.
// Atšaukus forma neišsiunčiama (preventDefault), todėl server action nevykdomas.
export default function ConfirmSubmitButton({
  confirmText,
  className,
  children,
}: {
  confirmText: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
