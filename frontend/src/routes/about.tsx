import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/features/about/AboutPage";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Jadara — Our Story, Vision & Mission" },
      {
        name: "description",
        content: "Jadara bridges academic credentials and real job-market skills in Algeria.",
      },
      { property: "og:title", content: "About Jadara" },
      {
        property: "og:description",
        content: "Our story, vision, mission and partners.",
      },
    ],
  }),
  component: AboutPage,
});
