import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const out = "pages";
rmSync(out, { recursive: true, force: true });
cpSync(".vercel/output/static", out, { recursive: true });
const html = readFileSync(`${out}/index.html`, "utf8")
  .replaceAll('href="/__grok/', 'href="/headspace/__grok/')
  .replaceAll('href="/favicon.svg"', 'href="/headspace/favicon.svg"');
writeFileSync(`${out}/index.html`, html);
writeFileSync(`${out}/404.html`, html);
mkdirSync(`${out}/__grok`, { recursive: true });
writeFileSync(
  `${out}/__grok/manifest.webmanifest`,
  JSON.stringify(
    {
      name: "Headspace",
      short_name: "Headspace",
      id: "/headspace/",
      start_url: "/headspace/",
      scope: "/headspace/",
      display: "standalone",
      background_color: "#0e0d0c",
      theme_color: "#0e0d0c",
      icons: [
        {
          src: "/headspace/__grok/icon-180.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    null,
    2,
  ),
);
