import { createFileRoute } from "@tanstack/react-router";
import { FaqPage } from "@/features/faq/FaqPage";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Jadara" },
      {
        name: "description",
        content: "Frequently asked questions for youth, companies and reviewers on Jadara.",
      },
      { property: "og:title", content: "FAQ — Jadara" },
      {
        property: "og:description",
        content: "Answers for youth, companies and reviewers.",
      },
    ],
  }),
  component: FaqPage,
});
