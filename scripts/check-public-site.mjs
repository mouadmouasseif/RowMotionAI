import { readFileSync, existsSync } from "node:fs";
const required=["app/[locale]/[[...slug]]/page.tsx","app/sitemap.ts","app/robots.ts","components/public/PublicHeader.tsx","components/CookieConsent.tsx","content/blog.ts"];
for(const file of required){if(!existsSync(file))throw new Error(`Fichier public manquant: ${file}`)}
const blog=readFileSync("content/blog.ts","utf8");
const count=(blog.match(/\n\s*article\("/g)??[]).length;
if(count<8)throw new Error(`Le blog doit contenir au moins 8 articles, trouvé: ${count}`);
const header=readFileSync("components/public/PublicHeader.tsx","utf8");
if(header.includes('href="#"'))throw new Error("Le menu public contient encore un lien factice.");
console.log(`Public site check passed: ${required.length} core files and ${count} blog posts.`);
