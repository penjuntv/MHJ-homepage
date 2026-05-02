/**
 * insert-h2-headings.mjs
 * Inserts H2 subheadings into published blog posts that have none.
 *
 * Phase 1 (free): Convert <p><strong>TEXT</strong></p> → <h2>TEXT</h2>
 * Phase 2 (LLM):  Use Claude Sonnet to suggest natural break points
 *
 * Usage:
 *   node scripts/insert-h2-headings.mjs                    # dry-run (default, safe)
 *   node scripts/insert-h2-headings.mjs --live             # write to Supabase
 *   node scripts/insert-h2-headings.mjs --slugs a,b,c      # specific slugs only
 *   node scripts/insert-h2-headings.mjs --phase1            # pattern detection only
 *   node scripts/insert-h2-headings.mjs --phase2            # LLM only (skip phase 1)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── .env.local parsing ──────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envRaw.split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const SUPABASE_URL   = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY    = env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY  = env.ANTHROPIC_API_KEY;   // preferred (uncomment in .env.local to use)
const GOOGLE_AI_KEY  = env.GOOGLE_AI_API_KEY;   // fallback if Anthropic not available

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing in .env.local');
  process.exit(1);
}

const LLM_PROVIDER = ANTHROPIC_KEY ? 'anthropic' : GOOGLE_AI_KEY ? 'google' : null;
if (LLM_PROVIDER) console.log(`ℹ️  LLM provider: ${LLM_PROVIDER}\n`);
else console.log('ℹ️  No LLM key found — Phase 2 will be skipped (Phase 1 pattern detection still runs)\n');

// Use the Supabase JS client (same as createAdminClient) — handles non-JWT key formats
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ─── CLI flags ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const LIVE        = args.includes('--live');
const PHASE1_ONLY = args.includes('--phase1');
const PHASE2_ONLY = args.includes('--phase2');

// Support: --slugs a,b,c  OR  --slugs=a,b,c
const slugsIdx = args.findIndex(a => a === '--slugs' || a.startsWith('--slugs='));
let FILTER_SLUGS = null;
if (slugsIdx >= 0) {
  const raw = args[slugsIdx].includes('=')
    ? args[slugsIdx].split('=').slice(1).join('=')
    : args[slugsIdx + 1] || '';
  FILTER_SLUGS = raw.split(',').map(s => s.trim()).filter(Boolean);
}

if (!LIVE) {
  console.log('🔍 DRY-RUN MODE — no changes will be written to the database\n');
  console.log('    Run with --live to apply changes.\n');
}

// ─── Supabase helper ─────────────────────────────────────────────────────────
async function dbUpdate(id, payload) {
  const { error } = await supabase.from('blogs').update(payload).eq('id', id);
  if (error) throw new Error(`dbUpdate id=${id}: ${error.message}`);
}

// ─── HTML block parser ───────────────────────────────────────────────────────
/**
 * Split TipTap HTML into an ordered array of block elements.
 * Returns [{type:'p'|'h'|'img'|'other', html:string, text:string}]
 */
function parseBlocks(html) {
  if (!html) return [];
  const blocks = [];
  // Match block-level elements (including self-closing img)
  const BLOCK_RE = /(<(p|h[1-6]|ul|ol|blockquote|figure|div)(\s[^>]*)?>[\s\S]*?<\/\2\s*>|<img(\s[^>]*)?\s*\/?>|<hr(\s[^>]*)?\s*\/?>)/gi;
  let lastIdx = 0;
  let m;
  while ((m = BLOCK_RE.exec(html)) !== null) {
    if (m.index > lastIdx) {
      const between = html.slice(lastIdx, m.index);
      if (between.trim()) {
        blocks.push({ type: 'other', html: between.trim(), text: between.trim().replace(/<[^>]*>/g, '').trim() });
      }
    }
    const tag = (m[2] || '').toLowerCase();
    const type = tag === 'p' ? 'p' : tag.match(/^h[1-6]$/) ? 'h' : 'other';
    const text = m[0].replace(/<[^>]*>/g, '').trim();
    blocks.push({ type, html: m[0], text });
    lastIdx = BLOCK_RE.lastIndex;
  }
  if (lastIdx < html.length) {
    const tail = html.slice(lastIdx);
    if (tail.trim()) {
      blocks.push({ type: 'other', html: tail.trim(), text: tail.trim().replace(/<[^>]*>/g, '').trim() });
    }
  }
  return blocks;
}

/** Count <h2> tags in html */
function countH2(html) {
  return (html.match(/<h2[\s>]/gi) || []).length;
}

/** Reconstruct HTML from block array */
function blocksToHtml(blocks) {
  return blocks.map(b => b.html).join('\n');
}

// ─── Phase 1: Bold-paragraph → H2 ───────────────────────────────────────────
const BOLD_HEADING_RE = /^<p><strong>([^<]{1,80})<\/strong><\/p>$/;

/**
 * Scans blocks and converts standalone bold paragraphs to h2.
 * Returns {newBlocks, conversions:[string]}
 */
function applyPhase1(blocks) {
  const conversions = [];
  const newBlocks = blocks.map(block => {
    if (block.type !== 'p') return block;
    const m = block.html.match(BOLD_HEADING_RE);
    if (!m) return block;
    const text = m[1].trim();
    conversions.push(text);
    return { type: 'h', html: `<h2>${text}</h2>`, text };
  });
  return { newBlocks, conversions };
}

// ─── Phase 2: LLM insertion ──────────────────────────────────────────────────
function buildPrompt(blog, paragraphs) {
  const numbered = paragraphs
    .map(p => `[${p.paragraphIndex}] "${p.text.slice(0, 200)}${p.text.length > 200 ? '...' : ''}"`)
    .join('\n');

  return `You are editing a blog post for My Mairangi Journal — a NZ English family journal from Mairangi Bay, Auckland, written by a Korean immigrant family.

Title: ${blog.title}
Description: ${blog.meta_description || '(none)'}

Blog paragraphs (numbered, plain text):
${numbered}

Identify 2–4 natural break points where an H2 subheading would improve readability and SEO.

Rules:
- NEVER use names: 유민/유현/유진/Yumin/Yuhyeon/Yujin/Heejong
- Children referred to as: Min, Hyun, Jin — or "the kids" / "our children"
- Parents: PeNnY or Yussi only
- H2 text: 4–8 words, NZ English, natural tone, NOT keyword-stuffed
- Must reflect the topic of the paragraphs that follow
- Do NOT place H2 before paragraph [0]
- Do NOT place H2 after the final paragraph

Respond with ONLY a valid JSON array, no markdown fences, no explanation:
[{"paragraph_index": N, "h2_text": "Natural Section Title"}, ...]
If the content is too short or uniform for H2s, return: []`;
}

async function callLLM(blog, blocks) {
  // Build numbered paragraph list (only <p> blocks)
  const paragraphs = [];
  blocks.forEach((block, blockIdx) => {
    if (block.type === 'p' && block.text.trim()) {
      paragraphs.push({ paragraphIndex: paragraphs.length, blockIdx, text: block.text });
    }
  });

  if (paragraphs.length < 3) return [];

  const prompt = buildPrompt(blog, paragraphs);
  let raw = '[]';

  try {
    if (LLM_PROVIDER === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
      const data = await res.json();
      raw = data.content?.[0]?.text?.trim() ?? '[]';
    } else if (LLM_PROVIDER === 'google') {
      const genAI = new GoogleGenerativeAI(GOOGLE_AI_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      raw = result.response.text().trim();
      // Strip markdown fences if model wrapped JSON
      raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    }
  } catch (e) {
    console.warn(`  ⚠️  LLM error: ${e.message}`);
    return [];
  }

  let insertions;
  try {
    insertions = JSON.parse(raw);
    if (!Array.isArray(insertions)) insertions = [];
  } catch {
    console.warn(`  ⚠️  Failed to parse LLM response: ${raw.slice(0, 80)}`);
    return [];
  }

  // Validate and map paragraph_index back to block index
  const result = [];
  for (const ins of insertions) {
    if (ins.paragraph_index === 0) continue;                        // no H2 before first paragraph
    if (ins.paragraph_index >= paragraphs.length) continue;        // out of bounds
    const p = paragraphs[ins.paragraph_index];
    if (!p) continue;
    if (!ins.h2_text || typeof ins.h2_text !== 'string') continue;
    const h2 = ins.h2_text.trim();
    if (!h2 || h2.length > 100) continue;
    result.push({ blockIdx: p.blockIdx, h2_text: h2, paragraph_index: ins.paragraph_index });
  }
  return result;
}

/**
 * Apply LLM insertions into blocks array.
 * insertions: [{blockIdx, h2_text}] — sorted descending to avoid index drift.
 */
function applyInsertions(blocks, insertions) {
  const sorted = [...insertions].sort((a, b) => b.blockIdx - a.blockIdx);
  const result = [...blocks];
  for (const ins of sorted) {
    result.splice(ins.blockIdx, 0, {
      type: 'h',
      html: `<h2>${ins.h2_text}</h2>`,
      text: ins.h2_text,
    });
  }
  return result;
}

// ─── Sleep helper ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Fetch blogs
  const now = new Date().toISOString();
  let { data: blogs, error: fetchErr } = await supabase
    .from('blogs')
    .select('id,slug,title,meta_description,content')
    .eq('published', true)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('id', { ascending: true });

  if (fetchErr) throw new Error(`Fetch error: ${fetchErr.message}`);
  blogs = blogs ?? [];

  if (FILTER_SLUGS) {
    blogs = blogs.filter(b => FILTER_SLUGS.includes(b.slug));
    console.log(`🔎 Filtering to ${blogs.length} blog(s): ${FILTER_SLUGS.join(', ')}\n`);
  } else {
    console.log(`📚 Loaded ${blogs.length} published blogs\n`);
  }

  const log = [];
  let phase1Count = 0;
  let phase2Count = 0;
  let skippedAlreadyHasH2 = 0;

  // ── Phase 1 ────────────────────────────────────────────────────────────────
  if (!PHASE2_ONLY) {
    console.log('═══════════════════════════════════════════════════');
    console.log('PHASE 1 — Bold-paragraph → H2 conversion');
    console.log('═══════════════════════════════════════════════════');

    for (const blog of blogs) {
      const existingH2 = countH2(blog.content ?? '');
      if (existingH2 > 0) {
        console.log(`  [${blog.slug}]  already has ${existingH2} H2(s) — skipping`);
        skippedAlreadyHasH2++;
        continue;
      }

      const blocks = parseBlocks(blog.content ?? '');
      const { newBlocks, conversions } = applyPhase1(blocks);

      if (conversions.length === 0) {
        console.log(`  [${blog.slug}]  no bold-heading patterns`);
        continue;
      }

      const newContent = blocksToHtml(newBlocks);
      console.log(`  [${blog.slug}]  ${conversions.length} conversion(s):`);
      for (const c of conversions) console.log(`    → <h2>${c}</h2>`);

      log.push({
        slug: blog.slug,
        phase: 1,
        h2s_added: conversions.length,
        conversions,
        full_content_before: blog.content,
        full_content_after: newContent,
      });

      // Always update in-memory so Phase 2 correctly skips this post
      blog.content = newContent;

      if (LIVE) {
        await dbUpdate(blog.id, { content: newContent });
        console.log(`    ✅ Updated in Supabase`);
      }

      phase1Count += conversions.length;
    }
    console.log(`\n  Phase 1 total: ${phase1Count} H2(s) converted\n`);
  }

  // ── Phase 2 ────────────────────────────────────────────────────────────────
  if (!PHASE1_ONLY) {
    // Only process blogs still with 0 H2s
    const needsLLM = blogs.filter(b => countH2(b.content ?? '') === 0);

    console.log('═══════════════════════════════════════════════════');
    console.log(`PHASE 2 — LLM H2 insertion (${needsLLM.length} blog(s))`);
    console.log('═══════════════════════════════════════════════════');

    if (!LLM_PROVIDER) {
      console.warn('  ⚠️  No LLM key available — Phase 2 skipped.\n');
      console.warn('      To enable: uncomment ANTHROPIC_API_KEY in .env.local\n');
    } else {
      let processed = 0;
      for (const blog of needsLLM) {
        processed++;
        console.log(`  [${blog.slug}]  (${processed}/${needsLLM.length})`);

        const blocks = parseBlocks(blog.content ?? '');
        const paragraphCount = blocks.filter(b => b.type === 'p').length;

        if (paragraphCount < 3) {
          console.log(`    → too short (${paragraphCount} paragraphs) — skipped`);
          log.push({ slug: blog.slug, phase: 2, h2s_added: 0, skipped: 'too_short' });
          continue;
        }

        const insertions = await callLLM(blog, blocks);

        if (insertions.length === 0) {
          console.log(`    → Claude returned no insertions`);
          log.push({ slug: blog.slug, phase: 2, h2s_added: 0, skipped: 'claude_empty' });
        } else {
          const newBlocks = applyInsertions(blocks, insertions);
          const newContent = blocksToHtml(newBlocks);

          for (const ins of insertions) {
            console.log(`    → INSERT "<h2>${ins.h2_text}</h2>" before ¶${ins.paragraph_index}`);
          }

          log.push({
            slug: blog.slug,
            phase: 2,
            h2s_added: insertions.length,
            insertions: insertions.map(i => ({ paragraph_index: i.paragraph_index, h2_text: i.h2_text })),
            full_content_before: blog.content,
            full_content_after: newContent,
          });

          if (LIVE) {
            await dbUpdate(blog.id, { content: newContent });
            console.log(`    ✅ Updated in Supabase`);
          }

          phase2Count += insertions.length;
        }

        // Rate-limit: 5 s between LLM calls
        if (processed < needsLLM.length) {
          await sleep(5000);
        }
      }
    }

    console.log(`\n  Phase 2 total: ${phase2Count} H2(s) inserted\n`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Phase 1 H2s converted : ${phase1Count}`);
  console.log(`  Phase 2 H2s inserted  : ${phase2Count}`);
  console.log(`  Total H2s added       : ${phase1Count + phase2Count}`);
  console.log(`  Already had H2s       : ${skippedAlreadyHasH2}`);
  if (!LIVE) {
    console.log('\n  ⚠️  DRY-RUN: no changes written. Run with --live to apply.');
  }

  // ── Write log ──────────────────────────────────────────────────────────────
  if (log.length > 0) {
    const outDir = path.join(__dirname, 'output');
    mkdirSync(outDir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 10);
    const outPath = path.join(outDir, `h2-insert-${stamp}.json`);
    writeFileSync(outPath, JSON.stringify(log, null, 2), 'utf-8');
    console.log(`\n  📄 Log written to scripts/output/h2-insert-${stamp}.json`);
    console.log('     (contains full_content_before for rollback if needed)');
  }
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
