export const extensionProduct = {
  id: "example",
  name: "Extension fixture",
  summary: "Nested product pages.",
  product: "example/product.md",
  research: "example/research.md",
  sales: "example/sales.yaml",
  website: "example/website.md",
  marketing_creative: "example/marketing-creative.md",
  presentation: "example/presentation/Deck.tsx",
  presentation_data: "example/presentation/data.yaml",
  sections: [
    {
      id: "website",
      title: "Website",
      pages: [
        {
          id: "landing",
          title: "HTML landing",
          source: "example/website/index.html",
        },
        {
          id: "checkout",
          title: "JSX checkout",
          source: "example/website/pages/Checkout.jsx",
        },
      ],
    },
    {
      id: "creative",
      title: "Marketing Creative",
      pages: [
        {
          id: "launch",
          title: "Launch campaign",
          children: [
            {
              id: "banner",
              title: "Campaign banner",
              source: "example/website/campaign.svg",
            },
          ],
        },
      ],
    },
    {
      id: "academy",
      title: "Academy",
      pages: [
        {
          id: "course",
          title: "Course",
          children: [
            {
              id: "module",
              title: "Module one",
              children: [
                {
                  id: "lesson",
                  title: "Introduction",
                  source: "example/lessons/introduction.md",
                },
                {
                  id: "slides",
                  title: "Lesson slides",
                  source: "example/presentation/Deck.tsx",
                  export: "pdf",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
