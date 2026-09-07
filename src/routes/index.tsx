import { createFileRoute } from "@tanstack/react-router";
import { ClassicHome } from "@/components/home/ClassicHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Audiomaxxer" },
      {
        name: "description",
        content:
          "Built for teens and young adults who live in headphones: measure sensitivity, speech in noise, discrimination, attention and memory, then train your weakest listening skill.",
      },
      { property: "og:title", content: "Audiomaxxer" },
      {
        property: "og:description",
        content:
          "Built for teens and young adults who live in headphones: measure sensitivity, speech in noise, discrimination, attention and memory, then train your weakest listening skill.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <ClassicHome />;
}
