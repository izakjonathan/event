const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = () => ({
  apikey: anon || '',
  Authorization: `Bearer ${anon || ''}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

const ready = Boolean(url && anon);
const tableUrl = (table: string) => `${url}/rest/v1/${table}`;
const enc = encodeURIComponent;

type Result<T = any> = { data: T | null; error: any | null };
async function parse<T>(res: Response): Promise<Result<T>> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) return { data: null, error: body || { message: res.statusText } };
  return { data: body, error: null };
}

class QueryBuilder {
  private filters: string[] = [];
  private orderBy = '';
  private mode: 'select' | 'delete' | null = null;
  constructor(private table: string, private payload?: any) {}
  select(_cols = '*') { this.mode = 'select'; return this; }
  eq(col: string, value: any) { this.filters.push(`${enc(col)}=eq.${enc(String(value))}`); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderBy = `order=${enc(col)}.${opts?.ascending === false ? 'desc' : 'asc'}`; return this; }
  delete() { this.mode = 'delete'; return this; }
  async upsert(row: any) {
    if (!ready) return { data: null, error: { message: 'Supabase is not configured' } };
    const res = await fetch(tableUrl(this.table), { method: 'POST', headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(row) });
    return parse(res);
  }
  then<TResult1 = Result<any>, TResult2 = never>(onfulfilled?: ((value: Result<any>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null): PromiseLike<TResult1 | TResult2> { return this.run().then(onfulfilled as any, onrejected as any); }
  private async run() {
    if (!ready) return { data: null, error: { message: 'Supabase is not configured' } };
    const qs = [this.mode === 'select' ? 'select=*' : '', ...this.filters, this.orderBy].filter(Boolean).join('&');
    const res = await fetch(`${tableUrl(this.table)}${qs ? `?${qs}` : ''}`, { method: this.mode === 'delete' ? 'DELETE' : 'GET', headers: headers() });
    return parse(res);
  }
}

export const supabase = ready ? {
  from(table: string) { return new QueryBuilder(table); },
  storage: {
    from(bucket: string) {
      return {
        async upload(path: string, file: File, opts?: { upsert?: boolean }) {
          if (!ready) return { data: null, error: { message: 'Supabase is not configured' } };
          const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
            method: opts?.upsert ? 'POST' : 'POST',
            headers: { apikey: anon || '', Authorization: `Bearer ${anon || ''}`, ...(opts?.upsert ? { 'x-upsert': 'true' } : {}) },
            body: file,
          });
          return parse(res);
        },
        getPublicUrl(path: string) { return { data: { publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}` } }; },
      };
    },
  },
} : null;

export const supabaseReady = Boolean(supabase);
