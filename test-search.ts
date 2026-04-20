import { combinedSearch } from './lib/search';
import { prisma } from './lib/prisma';

async function main() {
  const res = await combinedSearch({ query: "Pengantar Bisnis Modul 1", maxResults: 5 });
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
