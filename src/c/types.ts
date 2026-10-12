// Tipos de C tal como los entiende el intérprete.
// Tamaños como gcc en Linux/macOS de 64 bits (LP64): int 4, long 8, puntero 8.

export type IntName =
  | 'bool'
  | 'char'
  | 'schar'
  | 'uchar'
  | 'short'
  | 'ushort'
  | 'int'
  | 'uint'
  | 'long'
  | 'ulong'
  | 'llong'
  | 'ullong';

export interface Field {
  name: string;
  type: CType;
  offset: number;
}

export interface StructInfo {
  tag: string | null;
  union: boolean;
  fields: Field[] | null; // null = declarado pero sin definir todavía
  size: number;
  align: number;
  id: number;
}

export type CType =
  | { k: 'void'; c?: boolean }
  | { k: 'int'; name: IntName; size: number; signed: boolean; c?: boolean; isEnum?: boolean }
  | { k: 'float'; size: 4 | 8; c?: boolean }
  | { k: 'ptr'; to: CType; c?: boolean }
  | { k: 'array'; of: CType; len: number | null; vla?: VlaInfo; c?: boolean }
  | { k: 'struct'; s: StructInfo; c?: boolean }
  | { k: 'func'; ret: CType; params: CType[]; variadic: boolean; noProto: boolean; c?: boolean };

/** Longitud de un array que solo se conoce al ejecutar (VLA): se guarda en un hueco del marco. */
export interface VlaInfo {
  slot: number; // desplazamiento en el marco donde se guarda la longitud
}

const INT_INFO: Record<IntName, { size: number; signed: boolean }> = {
  bool: { size: 1, signed: false },
  char: { size: 1, signed: true },
  schar: { size: 1, signed: true },
  uchar: { size: 1, signed: false },
  short: { size: 2, signed: true },
  ushort: { size: 2, signed: false },
  int: { size: 4, signed: true },
  uint: { size: 4, signed: false },
  long: { size: 8, signed: true },
  ulong: { size: 8, signed: false },
  llong: { size: 8, signed: true },
  ullong: { size: 8, signed: false },
};

export function intType(name: IntName): CType {
  const i = INT_INFO[name];
  return { k: 'int', name, size: i.size, signed: i.signed };
}

export const T = {
  void: { k: 'void' } as CType,
  bool: intType('bool'),
  char: intType('char'),
  uchar: intType('uchar'),
  short: intType('short'),
  int: intType('int'),
  uint: intType('uint'),
  long: intType('long'),
  ulong: intType('ulong'),
  llong: intType('llong'),
  ullong: intType('ullong'),
  float: { k: 'float', size: 4 } as CType,
  double: { k: 'float', size: 8 } as CType,
};

export const ptrTo = (to: CType): CType => ({ k: 'ptr', to });
export const arrayOf = (of: CType, len: number | null): CType => ({ k: 'array', of, len });

export const isInt = (t: CType): t is Extract<CType, { k: 'int' }> => t.k === 'int';
export const isFloat = (t: CType): t is Extract<CType, { k: 'float' }> => t.k === 'float';
export const isArith = (t: CType): boolean => t.k === 'int' || t.k === 'float';
export const isPtr = (t: CType): t is Extract<CType, { k: 'ptr' }> => t.k === 'ptr';
export const isScalar = (t: CType): boolean => isArith(t) || t.k === 'ptr';
export const isStruct = (t: CType): t is Extract<CType, { k: 'struct' }> => t.k === 'struct';
export const isArray = (t: CType): t is Extract<CType, { k: 'array' }> => t.k === 'array';
export const isFunc = (t: CType): t is Extract<CType, { k: 'func' }> => t.k === 'func';
export const is64 = (t: CType): boolean => t.k === 'int' && t.size === 8;
export const isCharLike = (t: CType): boolean => t.k === 'int' && t.size === 1 && t.name !== 'bool';

export function sizeOf(t: CType): number {
  switch (t.k) {
    case 'void':
      return 1;
    case 'int':
    case 'float':
      return t.size;
    case 'ptr':
      return 8;
    case 'array':
      return t.len === null ? 0 : t.len * sizeOf(t.of);
    case 'struct':
      return t.s.size;
    case 'func':
      return 1;
  }
}

export function alignOf(t: CType): number {
  switch (t.k) {
    case 'array':
      return alignOf(t.of);
    case 'struct':
      return t.s.align;
    case 'void':
    case 'func':
      return 1;
    default:
      return sizeOf(t);
  }
}

/** ¿El tamaño depende de un VLA (solo se sabe al ejecutar)? */
export function hasVla(t: CType): boolean {
  if (t.k === 'array') return !!t.vla || hasVla(t.of);
  return false;
}

export function unqual(t: CType): CType {
  if (!t.c) return t;
  const { c: _c, ...rest } = t as CType & { c?: boolean };
  void _c;
  return rest as CType;
}

export function withConst(t: CType): CType {
  return t.c ? t : ({ ...t, c: true } as CType);
}

/** Compatibilidad de tipos (ignora const en el primer nivel). */
export function sameType(a: CType, b: CType): boolean {
  if (a.k !== b.k) return false;
  switch (a.k) {
    case 'void':
      return true;
    case 'int':
      return a.name === (b as typeof a).name;
    case 'float':
      return a.size === (b as typeof a).size;
    case 'ptr':
      return sameType(a.to, (b as typeof a).to);
    case 'array': {
      const bb = b as typeof a;
      return (a.len === null || bb.len === null || a.len === bb.len) && sameType(a.of, bb.of);
    }
    case 'struct':
      return a.s === (b as typeof a).s;
    case 'func': {
      const bb = b as typeof a;
      if (!sameType(a.ret, bb.ret)) return false;
      if (a.noProto || bb.noProto) return true;
      return (
        a.variadic === bb.variadic &&
        a.params.length === bb.params.length &&
        a.params.every((p, i) => sameType(p, bb.params[i]))
      );
    }
  }
}

const INT_NAMES: Record<IntName, string> = {
  bool: 'bool',
  char: 'char',
  schar: 'signed char',
  uchar: 'unsigned char',
  short: 'short',
  ushort: 'unsigned short',
  int: 'int',
  uint: 'unsigned int',
  long: 'long',
  ulong: 'unsigned long',
  llong: 'long long',
  ullong: 'unsigned long long',
};

/** Nombre legible del tipo, como lo escribiría una persona: `int *`, `char[20]`… */
export function typeName(t: CType): string {
  const q = t.c ? 'const ' : '';
  switch (t.k) {
    case 'void':
      return q + 'void';
    case 'int':
      return q + (t.isEnum ? 'enum' : INT_NAMES[t.name]);
    case 'float':
      return q + (t.size === 4 ? 'float' : 'double');
    case 'ptr':
      if (t.to.k === 'func') return typeName(t.to.ret) + ' (*)(' + funcParams(t.to) + ')';
      if (t.to.k === 'array') return typeName(t.to.of) + ' (*)[' + (t.to.len ?? '') + ']';
      return typeName(t.to) + ' *' + (t.c ? 'const' : '');
    case 'array': {
      let base: CType = t;
      let dims = '';
      while (base.k === 'array') {
        dims += '[' + (base.len ?? '') + ']';
        base = base.of;
      }
      return typeName(base) + dims;
    }
    case 'struct':
      return q + (t.s.union ? 'union ' : 'struct ') + (t.s.tag ?? '(anónima)');
    case 'func':
      return typeName(t.ret) + ' (' + funcParams(t) + ')';
  }
}

function funcParams(t: Extract<CType, { k: 'func' }>): string {
  const p = t.params.map(typeName);
  if (t.variadic) p.push('...');
  return p.join(', ');
}

/** Rango de enteros para el promoción entera y las conversiones habituales. */
export function intRank(t: CType): number {
  if (t.k !== 'int') return 0;
  switch (t.name) {
    case 'bool':
      return 1;
    case 'char':
    case 'schar':
    case 'uchar':
      return 2;
    case 'short':
    case 'ushort':
      return 3;
    case 'int':
    case 'uint':
      return 4;
    case 'long':
    case 'ulong':
      return 5;
    case 'llong':
    case 'ullong':
      return 6;
  }
}

/** Promoción entera: char, short y bool pasan a int. */
export function promote(t: CType): CType {
  if (t.k === 'int' && intRank(t) < 4) return T.int;
  if (t.k === 'int') return unqual(t);
  return unqual(t);
}

/** Conversiones aritméticas habituales: el tipo común de una operación binaria. */
export function commonType(a: CType, b: CType): CType {
  if (a.k === 'float' || b.k === 'float') {
    const sa = a.k === 'float' ? a.size : 0;
    const sb = b.k === 'float' ? b.size : 0;
    return Math.max(sa, sb) === 8 ? T.double : T.float;
  }
  const pa = promote(a);
  const pb = promote(b);
  if (pa.k !== 'int' || pb.k !== 'int') return T.int;
  if (pa.name === pb.name) return pa;
  const ra = intRank(pa);
  const rb = intRank(pb);
  if (pa.signed === pb.signed) return ra >= rb ? pa : pb;
  const [u, s] = pa.signed ? [pb, pa] : [pa, pb];
  const ru = intRank(u);
  const rs = intRank(s);
  if (ru >= rs) return u;
  if (s.size > u.size) return s;
  return unsignedOf(s);
}

export function unsignedOf(t: CType): CType {
  if (t.k !== 'int') return t;
  switch (t.name) {
    case 'int':
      return T.uint;
    case 'long':
      return T.ulong;
    case 'llong':
      return T.ullong;
    default:
      return t;
  }
}

/** Disposición de un struct o union con la alineación de gcc. */
export function layoutStruct(s: StructInfo, fields: { name: string; type: CType }[]): void {
  let off = 0;
  let align = 1;
  let size = 0;
  const out: Field[] = [];
  for (const f of fields) {
    const a = alignOf(f.type);
    const sz = sizeOf(f.type);
    align = Math.max(align, a);
    if (s.union) {
      out.push({ name: f.name, type: f.type, offset: 0 });
      size = Math.max(size, sz);
    } else {
      off = Math.ceil(off / a) * a;
      out.push({ name: f.name, type: f.type, offset: off });
      off += sz;
      size = off;
    }
  }
  s.fields = out;
  s.align = align;
  s.size = Math.ceil(size / align) * align || 0;
}
