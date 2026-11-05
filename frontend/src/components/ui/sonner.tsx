import { Toaster as Sonner } from "sonner";
import { useLanguage } from "@/context/LanguageContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { direction } = useLanguage();
  const position = direction === "rtl" ? "bottom-left" : "bottom-right";

  return (
    <Sonner
      className="toaster group"
      dir={direction}
      position={position}
      toastOptions={{
        classNames: {
          toast: "group toast !rounded-xl !border-0 !text-white !shadow-lg",
          default: "!bg-slate-600",
          title: "!text-white !font-semibold",
          description: "!text-white/90",
          icon: "!text-white",
          success: "!bg-green-500",
          error: "!bg-red-500",
          info: "!bg-primary",
          warning: "!bg-amber-500",
          actionButton: "!bg-white/15 !text-white",
          cancelButton: "!bg-white/10 !text-white",
          closeButton: "!bg-transparent !text-white hover:!bg-white/15",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
