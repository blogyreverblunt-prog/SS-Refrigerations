import { Pool } from "@neondatabase/serverless";
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const q = async (s: string) => (await pool.query(s)).rows as Record<string, unknown>[];
  try {
    console.log("--- leads ---");
    for (const r of await q(`select ref, type, name, email, phone, city, status,
        encode(ip_hash,'hex') is not null as ip_hashed, consent_at is not null as consented
        from lead order by ref`)) console.log(" ", JSON.stringify(r));
    console.log("--- outbox ---");
    for (const r of await q(`select id, aggregate_type, event_type,
        published_at is null as unpublished, attempts from outbox order by id`)) console.log(" ", JSON.stringify(r));
    console.log("--- counts ---");
    console.log(" ", JSON.stringify((await q(`select
        (select count(*) from lead)::int leads,
        (select count(*) from lead_item)::int items,
        (select count(*) from outbox)::int outbox,
        (select count(*) from product where status='live')::int live_products,
        (select count(*) from product_variant)::int variants`))[0]));
  } finally { await pool.end(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
