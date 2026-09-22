import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const out = "pages";
rmSync(out, { recursive: true, force: true });
cpSync(".vercel/output/static", out, { recursive: true });
const html = readFileSync(`${out}/index.html`, "utf8")
  .replaceAll('href="/__grok/', 'href="/twosips/__grok/')
  .replaceAll('href="/favicon.svg"', 'href="/twosips/favicon.svg"');
writeFileSync(`${out}/index.html`, html);
writeFileSync(`${out}/404.html`, html);
mkdirSync(`${out}/__grok`, { recursive: true });
writeFileSync(
  `${out}/__grok/manifest.webmanifest`,
  JSON.stringify(
    {
      name: "Headspace",
      short_name: "Headspace",
      id: "/twosips/",
      start_url: "/twosips/",
      scope: "/twosips/",
      display: "standalone",
      background_color: "#0e0d0c",
      theme_color: "#0e0d0c",
      icons: [
        {
          src: "/twosips/__grok/icon-180.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    null,
    2,
  ),
);
