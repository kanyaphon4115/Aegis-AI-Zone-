/* mock ของ supabase-js เฉพาะรูปแบบที่ backend เรียกใช้ ใช้สำหรับทดสอบเท่านั้น */
const DB = { users: [], payments: [], scans: [], login_attempts: [], cache: [], otp: [] };
const FILES = new Map();
globalThis.__DB = DB;
globalThis.__FILES = FILES;

const clone = (o) => JSON.parse(JSON.stringify(o));

function table(name) {
  if (!DB[name]) DB[name] = [];
  return DB[name];
}

class Query {
  constructor(name, op, payload) {
    this.name = name; this.op = op; this.payload = payload;
    this.filters = []; this._order = null; this._limit = null;
  }
  select(cols) { this.cols = cols; return this; }
  eq(col, val) { this.filters.push([col, val]); return this; }
  order(col, opts) { this._order = [col, opts?.ascending !== false]; return this; }
  limit(n) { this._limit = n; return this; }
  rows() {
    let r = table(this.name).filter((row) => this.filters.every(([c, v]) => row[c] === v));
    if (this._order) {
      const [c, asc] = this._order;
      r = [...r].sort((a, b) => String(a[c] ?? "").localeCompare(String(b[c] ?? "")) * (asc ? 1 : -1));
    }
    if (this._limit != null) r = r.slice(0, this._limit);
    return r;
  }
  async maybeSingle() { const r = this.rows(); return { data: r.length ? clone(r[0]) : null, error: null }; }
  then(resolve) { return Promise.resolve(this.run()).then(resolve); }
  run() {
    const t = table(this.name);
    if (this.op === "select") return { data: clone(this.rows()), error: null };
    if (this.op === "insert") {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      const keyed = { users: "phone", payments: "id", login_attempts: "phone", cache: "key", otp: "phone" }[this.name];
      for (const row of rows) {
        if (keyed && t.some((x) => x[keyed] === row[keyed])) return { data: null, error: { message: "duplicate key" } };
        t.push({ created_at: new Date().toISOString(), ...row });
      }
      return { data: clone(rows), error: null };
    }
    if (this.op === "update") {
      for (const row of t) if (this.filters.every(([c, v]) => row[c] === v)) Object.assign(row, this.payload);
      return { data: null, error: null };
    }
    if (this.op === "upsert") {
      const keyed = { users: "phone", payments: "id", login_attempts: "phone", cache: "key", otp: "phone" }[this.name] || "id";
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
      for (const row of rows) {
        const hit = t.find((x) => x[keyed] === row[keyed]);
        if (hit) Object.assign(hit, row); else t.push({ created_at: new Date().toISOString(), ...row });
      }
      return { data: clone(rows), error: null };
    }
    if (this.op === "delete") {
      for (let i = t.length - 1; i >= 0; i--) if (this.filters.every(([c, v]) => t[i][c] === v)) t.splice(i, 1);
      return { data: null, error: null };
    }
    return { data: null, error: null };
  }
}

export function createClient() {
  return {
    from(name) {
      return {
        select: (cols) => new Query(name, "select").select(cols),
        insert: (payload) => new Query(name, "insert", payload),
        update: (payload) => new Query(name, "update", payload),
        upsert: (payload) => new Query(name, "upsert", payload),
        delete: () => new Query(name, "delete"),
      };
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, buf, opts) { FILES.set(`${bucket}/${path}`, { size: buf.length, ...opts }); return { data: { path }, error: null }; },
          async createSignedUrl(path, secs) { return { data: { signedUrl: `https://mock.test/${bucket}/${path}?exp=${secs}` }, error: null }; },
        };
      },
    },
  };
}
