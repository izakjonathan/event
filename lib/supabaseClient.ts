const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const baseHeaders =
  url && anon
    ? {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
      }
    : null;

function buildQuery(params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  });
  const out = search.toString();
  return out ? `?${out}` : '';
}

async function parseResponse(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  if (!res.ok) {
    return { data: null, error: { message: data?.message || res.statusText || 'Request failed', status: res.status } };
  }
  return { data, error: null };
}

class SelectDeleteBuilder {
  private filters: Array<[string, string | number | boolean]> = [];
  private orderBy: string | null = null;
  private ascending = true;

  constructor(
    private table: string,
    private mode: 'select' | 'delete',
  ) {}

  eq(column: string, value: string | number | boolean) {
    this.filters.push([column, value]);
    return this;
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orderBy = column;
    this.ascending = opts?.ascending ?? true;
    return this;
  }

  private async execute() {
    if (!url || !baseHeaders) return { data: null, error: { message: 'Supabase not configured' } };
    const query: Record<string, string> = this.mode === 'select' ? { select: '*' } : {};
    for (const [key, value] of this.filters) query[key] = `eq.${String(value)}`;
    if (this.orderBy) query.order = `${this.orderBy}.${this.ascending ? 'asc' : 'desc'}`;
    const res = await fetch(`${url}/rest/v1/${this.table}${buildQuery(query)}`, {
      method: this.mode === 'select' ? 'GET' : 'DELETE',
      headers: {
        ...baseHeaders,
        Accept: 'application/json',
      },
    });
    return parseResponse(res);
  }

  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: any) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null) {
    return this.execute().catch(onrejected);
  }
}

function createSupabaseLite() {
  if (!url || !baseHeaders) return null;

  return {
    from(table: string) {
      return {
        select(_columns?: string) {
          void _columns;
          return new SelectDeleteBuilder(table, 'select');
        },
        delete() {
          return new SelectDeleteBuilder(table, 'delete');
        },
        async upsert(payload: any) {
          const res = await fetch(`${url}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              ...baseHeaders,
              'Content-Type': 'application/json',
              Prefer: 'resolution=merge-duplicates,return=representation',
            },
            body: JSON.stringify(payload),
          });
          return parseResponse(res);
        },
      };
    },
    storage: {
      from(bucket: string) {
        return {
          async upload(path: string, file: File, opts?: { upsert?: boolean }) {
            const res = await fetch(`${url}/storage/v1/object/${bucket}/${path}`, {
              method: 'POST',
              headers: {
                ...baseHeaders,
                'x-upsert': opts?.upsert ? 'true' : 'false',
              },
              body: file,
            });
            return parseResponse(res);
          },
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `${url}/storage/v1/object/public/${bucket}/${path}`,
              },
            };
          },
        };
      },
    },
  };
}

export const supabase = createSupabaseLite();
export const supabaseReady = Boolean(supabase);
