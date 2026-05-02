const HOST = 'www.mhj.nz';
const KEY = process.env.INDEXNOW_KEY ?? '';

export async function submitToIndexNow(urls: string[]): Promise<void> {
  if (!KEY || urls.length === 0) return;
  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: urls,
      }),
    });
    if (res.ok) {
      console.log(`[IndexNow] submitted ${urls.length} URL(s): ${res.status}`);
    } else {
      console.error(`[IndexNow] failed: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    console.error('[IndexNow] network error:', err);
  }
}
