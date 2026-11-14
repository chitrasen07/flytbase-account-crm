import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(new URL("../data/accounts.json", import.meta.url), "utf8"));
const deals = data.accounts.flatMap((account) => account.opportunities);
const people = data.accounts.reduce((sum, account) => sum + account.stakeholders.length, 0);
const closedDeals = deals
  .filter((deal) => deal.stage === "agreed")
  .reduce((sum, deal) => sum + (deal.worth_up_to || 0), 0);
const won = data.accounts
  .flatMap((account) => account.offers)
  .filter((offer) => offer.status === "won")
  .reduce((sum, offer) => sum + offer.value, 0);

const closed = closedDeals + won;
if (closed !== 705000) throw new Error(`closed ${closed}`);
if (people !== 10) throw new Error(`people ${people}`);
if (deals.length !== 7) throw new Error(`deals ${deals.length}`);
if (data.accounts.map((account) => account.id).join() !== "A,B") {
  throw new Error("expected accounts A and B");
}
console.log("check ok", { closed, people, deals: deals.length });
