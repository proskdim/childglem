// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  // @internal
  countLength() {
    let length5 = 0;
    for (let _ of this)
      length5++;
    return length5;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index6) {
    return this.buffer[index6];
  }
  // @internal
  floatFromSlice(start3, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start3, end, isBigEndian);
  }
  // @internal
  intFromSlice(start3, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start3, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start3, end) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + start3,
      end - start3
    );
    return new _BitArray(buffer);
  }
  // @internal
  sliceAfter(index6) {
    const buffer = new Uint8Array(
      this.buffer.buffer,
      this.buffer.byteOffset + index6,
      this.buffer.byteLength - index6
    );
    return new _BitArray(buffer);
  }
};
var UtfCodepoint = class {
  constructor(value4) {
    this.value = value4;
  }
};
function byteArrayToInt(byteArray, start3, end, isBigEndian, isSigned) {
  const byteSize = end - start3;
  if (byteSize <= 6) {
    let value4 = 0;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value4 = value4 * 256 + byteArray[i];
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value4 = value4 * 256 + byteArray[i];
      }
    }
    if (isSigned) {
      const highBit = 2 ** (byteSize * 8 - 1);
      if (value4 >= highBit) {
        value4 -= highBit * 2;
      }
    }
    return value4;
  } else {
    let value4 = 0n;
    if (isBigEndian) {
      for (let i = start3; i < end; i++) {
        value4 = (value4 << 8n) + BigInt(byteArray[i]);
      }
    } else {
      for (let i = end - 1; i >= start3; i--) {
        value4 = (value4 << 8n) + BigInt(byteArray[i]);
      }
    }
    if (isSigned) {
      const highBit = 1n << BigInt(byteSize * 8 - 1);
      if (value4 >= highBit) {
        value4 -= highBit * 2n;
      }
    }
    return Number(value4);
  }
}
function byteArrayToFloat(byteArray, start3, end, isBigEndian) {
  const view5 = new DataView(byteArray.buffer);
  const byteSize = end - start3;
  if (byteSize === 8) {
    return view5.getFloat64(start3, !isBigEndian);
  } else if (byteSize === 4) {
    return view5.getFloat32(start3, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value4) {
    super();
    this[0] = value4;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values2 = [x, y];
  while (values2.length) {
    let a = values2.pop();
    let b = values2.pop();
    if (a === b)
      continue;
    if (!isObject(a) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a, b) || unequalDates(a, b) || unequalBuffers(a, b) || unequalArrays(a, b) || unequalMaps(a, b) || unequalSets(a, b) || unequalRegExps(a, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get] = getters(a);
    for (let k of keys2(a)) {
      values2.push(get(a, k), get(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a, b) {
  return a instanceof Date && (a > b || a < b);
}
function unequalBuffers(a, b) {
  return a.buffer instanceof ArrayBuffer && a.BYTES_PER_ELEMENT && !(a.byteLength === b.byteLength && a.every((n, i) => n === b[i]));
}
function unequalArrays(a, b) {
  return Array.isArray(a) && a.length !== b.length;
}
function unequalMaps(a, b) {
  return a instanceof Map && a.size !== b.size;
}
function unequalSets(a, b) {
  return a instanceof Set && (a.size != b.size || [...a].some((e) => !b.has(e)));
}
function unequalRegExps(a, b) {
  return a instanceof RegExp && (a.source !== b.source || a.flags !== b.flags);
}
function isObject(a) {
  return typeof a === "object" && a !== null;
}
function structurallyCompatibleObjects(a, b) {
  if (typeof a !== "object" && typeof b !== "object" && (!a || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a instanceof c))
    return false;
  return a.constructor === b.constructor;
}
function remainderInt(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a % b;
  }
}
function divideInt(a, b) {
  return Math.trunc(divideFloat(a, b));
}
function divideFloat(a, b) {
  if (b === 0) {
    return 0;
  } else {
    return a / b;
  }
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.function = fn;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a = option[0];
    return new Ok(a);
  } else {
    return new Error(e);
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}
function flatten(option) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return new None();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function absolute_value(x) {
  let $ = x >= 0;
  if ($) {
    return x;
  } else {
    return x * -1;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function replace(string7, pattern, substitute) {
  let _pipe = string7;
  let _pipe$1 = identity(_pipe);
  let _pipe$2 = string_replace(_pipe$1, pattern, substitute);
  return identity(_pipe$2);
}
function slice(string7, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = string_length(string7) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return string_slice(string7, translated_idx, len);
      }
    } else {
      return string_slice(string7, idx, len);
    }
  }
}
function drop_end(string7, num_graphemes) {
  let $ = num_graphemes < 0;
  if ($) {
    return string7;
  } else {
    return slice(string7, 0, string_length(string7) - num_graphemes);
  }
}
function concat2(strings) {
  let _pipe = strings;
  let _pipe$1 = concat(_pipe);
  return identity(_pipe$1);
}
function repeat_loop(loop$string, loop$times, loop$acc) {
  while (true) {
    let string7 = loop$string;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$string = string7;
      loop$times = times - 1;
      loop$acc = acc + string7;
    }
  }
}
function repeat(string7, times) {
  return repeat_loop(string7, times, "");
}
function padding(size, pad_string) {
  let pad_string_length = string_length(pad_string);
  let num_pads = divideInt(size, pad_string_length);
  let extra = remainderInt(size, pad_string_length);
  return repeat(pad_string, num_pads) + slice(pad_string, 0, extra);
}
function pad_start(string7, desired_length, pad_string) {
  let current_length = string_length(string7);
  let to_pad_length = desired_length - current_length;
  let $ = to_pad_length <= 0;
  if ($) {
    return string7;
  } else {
    return padding(to_pad_length, pad_string) + string7;
  }
}
function pad_end(string7, desired_length, pad_string) {
  let current_length = string_length(string7);
  let to_pad_length = desired_length - current_length;
  let $ = to_pad_length <= 0;
  if ($) {
    return string7;
  } else {
    return string7 + padding(to_pad_length, pad_string);
  }
}
function trim(string7) {
  let _pipe = string7;
  let _pipe$1 = trim_start(_pipe);
  return trim_end(_pipe$1);
}
function drop_start(loop$string, loop$num_graphemes) {
  while (true) {
    let string7 = loop$string;
    let num_graphemes = loop$num_graphemes;
    let $ = num_graphemes > 0;
    if (!$) {
      return string7;
    } else {
      let $1 = pop_grapheme(string7);
      if ($1.isOk()) {
        let string$1 = $1[0][1];
        loop$string = string$1;
        loop$num_graphemes = num_graphemes - 1;
      } else {
        return string7;
      }
    }
  }
}
function split2(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = identity(_pipe);
    let _pipe$2 = split(_pipe$1, substring);
    return map2(_pipe$2, identity);
  }
}
function do_to_utf_codepoints(string7) {
  let _pipe = string7;
  let _pipe$1 = string_to_codepoint_integer_list(_pipe);
  return map2(_pipe$1, codepoint);
}
function to_utf_codepoints(string7) {
  return do_to_utf_codepoints(string7);
}
function first(string7) {
  let $ = pop_grapheme(string7);
  if ($.isOk()) {
    let first$1 = $[0][0];
    return new Ok(first$1);
  } else {
    let e = $[0];
    return new Error(e);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return identity(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function dynamic(value4) {
  return new Ok(value4);
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map2(_capture, f);
    }
  );
}
function string2(data) {
  return decode_string(data);
}
function int(data) {
  return decode_int(data);
}
function shallow_list(value4) {
  return decode_list(value4);
}
function do_any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify_dynamic(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded2 = $[0];
        return new Ok(decoded2);
      } else {
        return do_any(decoders$1)(data);
      }
    }
  };
}
function push_path(error, name) {
  let name$1 = identity(name);
  let decoder = do_any(
    toList([
      decode_string,
      (x) => {
        return map3(decode_int(x), to_string);
      }
    ])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify_dynamic(name$1), ">"]);
      let _pipe$1 = concat(_pipe);
      return identity(_pipe$1);
    }
  })();
  let _record = error;
  return new DecodeError(
    _record.expected,
    _record.found,
    prepend(name$2, error.path)
  );
}
function field(name, inner_type) {
  return (value4) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value4, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a, b) {
  return a ^ b + 2654435769 + (a << 6) + (a >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code2 = o.hashCode(o);
      if (typeof code2 === "number") {
        return code2;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key22, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key22, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key22,
    val2,
    addedLeaf
  );
}
function assoc(root, shift, hash, key3, val, addedLeaf) {
  switch (root.type) {
    case ARRAY_NODE:
      return assocArray(root, shift, hash, key3, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root, shift, hash, key3, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root, shift, hash, key3, val, addedLeaf);
  }
}
function assocArray(root, shift, hash, key3, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size + 1,
      array: cloneAndSet(root.array, idx, { type: ENTRY, k: key3, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key3, node.k)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: ARRAY_NODE,
        size: root.size,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key3,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root.size,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key3, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key3, val, addedLeaf);
  if (n === node) {
    return root;
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function assocIndex(root, shift, hash, key3, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root.bitmap, bit);
  if ((root.bitmap & bit) !== 0) {
    const node = root.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key3, val, addedLeaf);
      if (n === node) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key3, nodeKey)) {
      if (val === node.v) {
        return root;
      }
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, {
          type: ENTRY,
          k: key3,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap,
      array: cloneAndSet(
        root.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key3, val)
      )
    };
  } else {
    const n = root.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key3, val, addedLeaf);
      let j = 0;
      let bitmap = root.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root.array, idx, {
        type: ENTRY,
        k: key3,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root, shift, hash, key3, val, addedLeaf) {
  if (hash === root.hash) {
    const idx = collisionIndexOf(root, key3);
    if (idx !== -1) {
      const entry = root.array[idx];
      if (entry.v === val) {
        return root;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root.array, idx, { type: ENTRY, k: key3, v: val })
      };
    }
    const size = root.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root.array, size, { type: ENTRY, k: key3, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root.hash, shift),
      array: [root]
    },
    shift,
    hash,
    key3,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root, key3) {
  const size = root.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key3, root.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root, shift, hash, key3) {
  switch (root.type) {
    case ARRAY_NODE:
      return findArray(root, shift, hash, key3);
    case INDEX_NODE:
      return findIndex(root, shift, hash, key3);
    case COLLISION_NODE:
      return findCollision(root, key3);
  }
}
function findArray(root, shift, hash, key3) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key3);
  }
  if (isEqual(key3, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root, shift, hash, key3) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key3);
  }
  if (isEqual(key3, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root, key3) {
  const idx = collisionIndexOf(root, key3);
  if (idx < 0) {
    return void 0;
  }
  return root.array[idx];
}
function without(root, shift, hash, key3) {
  switch (root.type) {
    case ARRAY_NODE:
      return withoutArray(root, shift, hash, key3);
    case INDEX_NODE:
      return withoutIndex(root, shift, hash, key3);
    case COLLISION_NODE:
      return withoutCollision(root, key3);
  }
}
function withoutArray(root, shift, hash, key3) {
  const idx = mask(hash, shift);
  const node = root.array[idx];
  if (node === void 0) {
    return root;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key3)) {
      return root;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key3);
    if (n === node) {
      return root;
    }
  }
  if (n === void 0) {
    if (root.size <= MIN_ARRAY_NODE) {
      const arr = root.array;
      const out = new Array(root.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root.size - 1,
      array: cloneAndSet(root.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root.size,
    array: cloneAndSet(root.array, idx, n)
  };
}
function withoutIndex(root, shift, hash, key3) {
  const bit = bitpos(hash, shift);
  if ((root.bitmap & bit) === 0) {
    return root;
  }
  const idx = index(root.bitmap, bit);
  const node = root.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key3);
    if (n === node) {
      return root;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root.bitmap,
        array: cloneAndSet(root.array, idx, n)
      };
    }
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  if (isEqual(key3, node.k)) {
    if (root.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root.bitmap ^ bit,
      array: spliceOut(root.array, idx)
    };
  }
  return root;
}
function withoutCollision(root, key3) {
  const idx = collisionIndexOf(root, key3);
  if (idx < 0) {
    return root;
  }
  if (root.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root.hash,
    array: spliceOut(root.array, idx)
  };
}
function forEach(root, fn) {
  if (root === void 0) {
    return;
  }
  const items = root.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root, size) {
    this.root = root;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key3, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key3), key3);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key3, val) {
    const addedLeaf = { val: false };
    const root = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root, 0, getHash(key3), key3, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key3) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key3), key3);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key3) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key3), key3) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    try {
      this.forEach((v, k) => {
        if (!isEqual(o.get(k, !v), v)) {
          throw unequalDictSymbol;
        }
      });
      return true;
    } catch (e) {
      if (e === unequalDictSymbol) {
        return false;
      }
      throw e;
    }
  }
};
var unequalDictSymbol = Symbol();

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value4) {
  if (/^[-+]?(\d+)$/.test(value4)) {
    return new Ok(parseInt(value4));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function float_to_string(float4) {
  const string7 = float4.toString().replace("+", "");
  if (string7.indexOf(".") >= 0) {
    return string7;
  } else {
    const index6 = string7.indexOf("e");
    if (index6 >= 0) {
      return string7.slice(0, index6) + ".0" + string7.slice(index6);
    } else {
      return string7 + ".0";
    }
  }
}
function string_replace(string7, target2, substitute) {
  if (typeof string7.replaceAll !== "undefined") {
    return string7.replaceAll(target2, substitute);
  }
  return string7.replace(
    // $& means the whole matched string
    new RegExp(target2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
    substitute
  );
}
function string_length(string7) {
  if (string7 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string7);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string7.match(/./gsu).length;
  }
}
function graphemes(string7) {
  const iterator = graphemes_iterator(string7);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string7.match(/./gsu));
  }
}
var segmenter = void 0;
function graphemes_iterator(string7) {
  if (globalThis.Intl && Intl.Segmenter) {
    segmenter ||= new Intl.Segmenter();
    return segmenter.segment(string7)[Symbol.iterator]();
  }
}
function pop_grapheme(string7) {
  let first4;
  const iterator = graphemes_iterator(string7);
  if (iterator) {
    first4 = iterator.next().value?.segment;
  } else {
    first4 = string7.match(/./su)?.[0];
  }
  if (first4) {
    return new Ok([first4, string7.slice(first4.length)]);
  } else {
    return new Error(Nil);
  }
}
function pop_codeunit(str) {
  return [str.charCodeAt(0) | 0, str.slice(1)];
}
function lowercase(string7) {
  return string7.toLowerCase();
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function string_slice(string7, idx, len) {
  if (len <= 0 || idx >= string7.length) {
    return "";
  }
  const iterator = graphemes_iterator(string7);
  if (iterator) {
    while (idx-- > 0) {
      iterator.next();
    }
    let result = "";
    while (len-- > 0) {
      const v = iterator.next().value;
      if (v === void 0) {
        break;
      }
      result += v.segment;
    }
    return result;
  } else {
    return string7.match(/./gsu).slice(idx, idx + len).join("");
  }
}
function string_codeunit_slice(str, from2, length5) {
  return str.slice(from2, from2 + length5);
}
function contains_string(haystack, needle) {
  return haystack.indexOf(needle) >= 0;
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
function ends_with(haystack, needle) {
  return haystack.endsWith(needle);
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var trim_start_regex = new RegExp(`^[${unicode_whitespaces}]*`);
var trim_end_regex = new RegExp(`[${unicode_whitespaces}]*$`);
function trim_start(string7) {
  return string7.replace(trim_start_regex, "");
}
function trim_end(string7) {
  return string7.replace(trim_end_regex, "");
}
function print_debug(string7) {
  if (typeof process === "object" && process.stderr?.write) {
    process.stderr.write(string7 + "\n");
  } else if (typeof Deno === "object") {
    Deno.stderr.writeSync(new TextEncoder().encode(string7 + "\n"));
  } else {
    console.log(string7);
  }
}
function codepoint(int6) {
  return new UtfCodepoint(int6);
}
function string_to_codepoint_integer_list(string7) {
  return List.fromArray(Array.from(string7).map((item) => item.codePointAt(0)));
}
function utf_codepoint_to_int(utf_codepoint) {
  return utf_codepoint.value;
}
function new_map() {
  return Dict.new();
}
function map_to_list(map7) {
  return List.fromArray(map7.entries());
}
function map_get(map7, key3) {
  const value4 = map7.get(key3, NOT_FOUND);
  if (value4 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value4);
}
function map_insert(key3, value4, map7) {
  return map7.set(key3, value4);
}
function percent_encode(string7) {
  return encodeURIComponent(string7).replace("%2B", "+");
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_list(data) {
  if (Array.isArray(data)) {
    return new Ok(List.fromArray(data));
  }
  return data instanceof List ? new Ok(data) : decoder_error("List", data);
}
function decode_field(value4, name) {
  const not_a_map_error = () => decoder_error("Dict", value4);
  if (value4 instanceof Dict || value4 instanceof WeakMap || value4 instanceof Map) {
    const entry = map_get(value4, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value4 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value4) == Object.prototype) {
    return try_get_field(value4, name, () => new Ok(new None()));
  } else {
    return try_get_field(value4, name, not_a_map_error);
  }
}
function try_get_field(value4, field6, or_else) {
  try {
    return field6 in value4 ? new Ok(new Some(value4[field6])) : or_else();
  } catch {
    return or_else();
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return inspectString(v);
  if (t === "bigint" || Number.isInteger(v))
    return v.toString();
  if (t === "number")
    return float_to_string(v);
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectString(str) {
  let new_str = '"';
  for (let i = 0; i < str.length; i++) {
    let char = str[i];
    switch (char) {
      case "\n":
        new_str += "\\n";
        break;
      case "\r":
        new_str += "\\r";
        break;
      case "	":
        new_str += "\\t";
        break;
      case "\f":
        new_str += "\\f";
        break;
      case "\\":
        new_str += "\\\\";
        break;
      case '"':
        new_str += '\\"';
        break;
      default:
        if (char < " " || char > "~" && char < "\xA0") {
          new_str += "\\u{" + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0") + "}";
        } else {
          new_str += char;
        }
    }
  }
  new_str += '"';
  return new_str;
}
function inspectDict(map7) {
  let body2 = "dict.from_list([";
  let first4 = true;
  map7.forEach((value4, key3) => {
    if (!first4)
      body2 = body2 + ", ";
    body2 = body2 + "#(" + inspect(key3) + ", " + inspect(value4) + ")";
    first4 = false;
  });
  return body2 + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body2 = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body2}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label2) => {
    const value4 = inspect(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value4}` : value4;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list4) {
  return `[${list4.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/dict.mjs
function insert(dict2, key3, value4) {
  return map_insert(key3, value4, dict2);
}
function reverse_and_concat(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let first4 = remaining.head;
      let rest = remaining.tail;
      loop$remaining = rest;
      loop$accumulator = prepend(first4, accumulator);
    }
  }
}
function do_keys_loop(loop$list, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse_and_concat(acc, toList([]));
    } else {
      let key3 = list4.head[0];
      let rest = list4.tail;
      loop$list = rest;
      loop$acc = prepend(key3, acc);
    }
  }
}
function keys(dict2) {
  return do_keys_loop(map_to_list(dict2), toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function length_loop(loop$list, loop$count) {
  while (true) {
    let list4 = loop$list;
    let count = loop$count;
    if (list4.atLeastLength(1)) {
      let list$1 = list4.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length2(list4) {
  return length_loop(list4, 0);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function reverse(list4) {
  return reverse_and_prepend(list4, toList([]));
}
function contains(loop$list, loop$elem) {
  while (true) {
    let list4 = loop$list;
    let elem = loop$elem;
    if (list4.hasLength(0)) {
      return false;
    } else if (list4.atLeastLength(1) && isEqual(list4.head, elem)) {
      let first$1 = list4.head;
      return true;
    } else {
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$elem = elem;
    }
  }
}
function filter_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let new_acc = (() => {
        let $ = fun(first$1);
        if ($) {
          return prepend(first$1, acc);
        } else {
          return acc;
        }
      })();
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list4, predicate) {
  return filter_loop(list4, predicate, toList([]));
}
function map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$fun = fun;
      loop$acc = prepend(fun(first$1), acc);
    }
  }
}
function map2(list4, fun) {
  return map_loop(list4, fun, toList([]));
}
function try_map_loop(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(first$1);
      if ($.isOk()) {
        let first$2 = $[0];
        loop$list = rest$1;
        loop$fun = fun;
        loop$acc = prepend(first$2, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map(list4, fun) {
  return try_map_loop(list4, fun, toList([]));
}
function append_loop(loop$first, loop$second) {
  while (true) {
    let first4 = loop$first;
    let second2 = loop$second;
    if (first4.hasLength(0)) {
      return second2;
    } else {
      let first$1 = first4.head;
      let rest$1 = first4.tail;
      loop$first = rest$1;
      loop$second = prepend(first$1, second2);
    }
  }
}
function append3(first4, second2) {
  return append_loop(reverse(first4), second2);
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return initial;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, first$1);
      loop$fun = fun;
    }
  }
}
function index_fold_loop(loop$over, loop$acc, loop$with, loop$index) {
  while (true) {
    let over = loop$over;
    let acc = loop$acc;
    let with$ = loop$with;
    let index6 = loop$index;
    if (over.hasLength(0)) {
      return acc;
    } else {
      let first$1 = over.head;
      let rest$1 = over.tail;
      loop$over = rest$1;
      loop$acc = with$(acc, first$1, index6);
      loop$with = with$;
      loop$index = index6 + 1;
    }
  }
}
function index_fold(list4, initial, fun) {
  return index_fold_loop(list4, initial, fun, 0);
}
function find_map(loop$list, loop$fun) {
  while (true) {
    let list4 = loop$list;
    let fun = loop$fun;
    if (list4.hasLength(0)) {
      return new Error(void 0);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = fun(first$1);
      if ($.isOk()) {
        let first$2 = $[0];
        return new Ok(first$2);
      } else {
        loop$list = rest$1;
        loop$fun = fun;
      }
    }
  }
}
function any(loop$list, loop$predicate) {
  while (true) {
    let list4 = loop$list;
    let predicate = loop$predicate;
    if (list4.hasLength(0)) {
      return false;
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      let $ = predicate(first$1);
      if ($) {
        return true;
      } else {
        loop$list = rest$1;
        loop$predicate = predicate;
      }
    }
  }
}
function intersperse_loop(loop$list, loop$separator, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let separator = loop$separator;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return reverse(acc);
    } else {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$separator = separator;
      loop$acc = prepend(first$1, prepend(separator, acc));
    }
  }
}
function intersperse(list4, elem) {
  if (list4.hasLength(0)) {
    return list4;
  } else if (list4.hasLength(1)) {
    return list4;
  } else {
    let first$1 = list4.head;
    let rest$1 = list4.tail;
    return intersperse_loop(rest$1, elem, toList([first$1]));
  }
}
function key_find(keyword_list, desired_key) {
  return find_map(
    keyword_list,
    (keyword) => {
      let key3 = keyword[0];
      let value4 = keyword[1];
      let $ = isEqual(key3, desired_key);
      if ($) {
        return new Ok(value4);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function key_set_loop(loop$list, loop$key, loop$value, loop$inspected) {
  while (true) {
    let list4 = loop$list;
    let key3 = loop$key;
    let value4 = loop$value;
    let inspected = loop$inspected;
    if (list4.atLeastLength(1) && isEqual(list4.head[0], key3)) {
      let k = list4.head[0];
      let rest$1 = list4.tail;
      return reverse_and_prepend(inspected, prepend([k, value4], rest$1));
    } else if (list4.atLeastLength(1)) {
      let first$1 = list4.head;
      let rest$1 = list4.tail;
      loop$list = rest$1;
      loop$key = key3;
      loop$value = value4;
      loop$inspected = prepend(first$1, inspected);
    } else {
      return reverse(prepend([key3, value4], inspected));
    }
  }
}
function key_set(list4, key3, value4) {
  return key_set_loop(list4, key3, value4, toList([]));
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}
function unwrap2(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function unwrap_both(result) {
  if (result.isOk()) {
    let a = result[0];
    return a;
  } else {
    let a = result[0];
    return a;
  }
}
function replace_error(result, error) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    return new Error(error);
  }
}

// build/dev/javascript/gleam_stdlib/gleam_stdlib_decode_ffi.mjs
function index2(data, key3) {
  const int6 = Number.isInteger(key3);
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const token = {};
    const entry = data.get(key3, token);
    if (entry === token)
      return new Ok(new None());
    return new Ok(new Some(entry));
  }
  if ((key3 === 0 || key3 === 1 || key3 === 2) && data instanceof List) {
    let i = 0;
    for (const value4 of data) {
      if (i === key3)
        return new Ok(new Some(value4));
      i++;
    }
    return new Error("Indexable");
  }
  if (int6 && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    if (key3 in data)
      return new Ok(new Some(data[key3]));
    return new Ok(new None());
  }
  return new Error(int6 ? "Indexable" : "Dict");
}
function int2(data) {
  if (Number.isInteger(data))
    return new Ok(data);
  return new Error(0);
}
function string3(data) {
  if (typeof data === "string")
    return new Ok(data);
  return new Error(0);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic/decode.mjs
var DecodeError2 = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
var Decoder = class extends CustomType {
  constructor(function$) {
    super();
    this.function = function$;
  }
};
function run(data, decoder) {
  let $ = decoder.function(data);
  let maybe_invalid_data = $[0];
  let errors = $[1];
  if (errors.hasLength(0)) {
    return new Ok(maybe_invalid_data);
  } else {
    return new Error(errors);
  }
}
function success(data) {
  return new Decoder((_) => {
    return [data, toList([])];
  });
}
function map4(decoder, transformer) {
  return new Decoder(
    (d) => {
      let $ = decoder.function(d);
      let data = $[0];
      let errors = $[1];
      return [transformer(data), errors];
    }
  );
}
function run_decoders(loop$data, loop$failure, loop$decoders) {
  while (true) {
    let data = loop$data;
    let failure = loop$failure;
    let decoders = loop$decoders;
    if (decoders.hasLength(0)) {
      return failure;
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder.function(data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        loop$data = data;
        loop$failure = failure;
        loop$decoders = decoders$1;
      }
    }
  }
}
function one_of(first4, alternatives) {
  return new Decoder(
    (dynamic_data) => {
      let $ = first4.function(dynamic_data);
      let layer = $;
      let errors = $[1];
      if (errors.hasLength(0)) {
        return layer;
      } else {
        return run_decoders(dynamic_data, layer, alternatives);
      }
    }
  );
}
function run_dynamic_function(data, name, f) {
  let $ = f(data);
  if ($.isOk()) {
    let data$1 = $[0];
    return [data$1, toList([])];
  } else {
    let zero = $[0];
    return [
      zero,
      toList([new DecodeError2(name, classify_dynamic(data), toList([]))])
    ];
  }
}
function decode_int2(data) {
  return run_dynamic_function(data, "Int", int2);
}
var int3 = /* @__PURE__ */ new Decoder(decode_int2);
function decode_string2(data) {
  return run_dynamic_function(data, "String", string3);
}
var string4 = /* @__PURE__ */ new Decoder(decode_string2);
function push_path2(layer, path) {
  let decoder = one_of(
    string4,
    toList([
      (() => {
        let _pipe = int3;
        return map4(_pipe, to_string);
      })()
    ])
  );
  let path$1 = map2(
    path,
    (key3) => {
      let key$1 = identity(key3);
      let $ = run(key$1, decoder);
      if ($.isOk()) {
        let key$2 = $[0];
        return key$2;
      } else {
        return "<" + classify_dynamic(key$1) + ">";
      }
    }
  );
  let errors = map2(
    layer[1],
    (error) => {
      let _record = error;
      return new DecodeError2(
        _record.expected,
        _record.found,
        append3(path$1, error.path)
      );
    }
  );
  return [layer[0], errors];
}
function index3(loop$path, loop$position, loop$inner, loop$data, loop$handle_miss) {
  while (true) {
    let path = loop$path;
    let position = loop$position;
    let inner = loop$inner;
    let data = loop$data;
    let handle_miss = loop$handle_miss;
    if (path.hasLength(0)) {
      let _pipe = inner(data);
      return push_path2(_pipe, reverse(position));
    } else {
      let key3 = path.head;
      let path$1 = path.tail;
      let $ = index2(data, key3);
      if ($.isOk() && $[0] instanceof Some) {
        let data$1 = $[0][0];
        loop$path = path$1;
        loop$position = prepend(key3, position);
        loop$inner = inner;
        loop$data = data$1;
        loop$handle_miss = handle_miss;
      } else if ($.isOk() && $[0] instanceof None) {
        return handle_miss(data, prepend(key3, position));
      } else {
        let kind = $[0];
        let $1 = inner(data);
        let default$ = $1[0];
        let _pipe = [
          default$,
          toList([new DecodeError2(kind, classify_dynamic(data), toList([]))])
        ];
        return push_path2(_pipe, reverse(position));
      }
    }
  }
}
function subfield(field_path, field_decoder, next) {
  return new Decoder(
    (data) => {
      let $ = index3(
        field_path,
        toList([]),
        field_decoder.function,
        data,
        (data2, position) => {
          let $12 = field_decoder.function(data2);
          let default$ = $12[0];
          let _pipe = [
            default$,
            toList([new DecodeError2("Field", "Nothing", toList([]))])
          ];
          return push_path2(_pipe, reverse(position));
        }
      );
      let out = $[0];
      let errors1 = $[1];
      let $1 = next(out).function(data);
      let out$1 = $1[0];
      let errors2 = $1[1];
      return [out$1, append3(errors1, errors2)];
    }
  );
}
function field2(field_name, field_decoder, next) {
  return subfield(toList([field_name]), field_decoder, next);
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function json_to_string(json) {
  return JSON.stringify(json);
}
function object(entries) {
  return Object.fromEntries(entries);
}
function identity2(x) {
  return x;
}
function decode(string7) {
  try {
    const result = JSON.parse(string7);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string7));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string7) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string7.split("").find((char, idx) => {
    if (char === "\n")
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnexpectedFormat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToDecode = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_decode(json, decoder) {
  return then$(
    decode(json),
    (dynamic_value) => {
      let _pipe = decoder(dynamic_value);
      return map_error(
        _pipe,
        (var0) => {
          return new UnexpectedFormat(var0);
        }
      );
    }
  );
}
function decode2(json, decoder) {
  return do_decode(json, decoder);
}
function do_parse(json, decoder) {
  return then$(
    decode(json),
    (dynamic_value) => {
      let _pipe = run(dynamic_value, decoder);
      return map_error(
        _pipe,
        (var0) => {
          return new UnableToDecode(var0);
        }
      );
    }
  );
}
function parse(json, decoder) {
  return do_parse(json, decoder);
}
function to_string2(json) {
  return json_to_string(json);
}
function string5(input4) {
  return identity2(input4);
}
function object2(entries) {
  return object(entries);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function custom(run2) {
  return new Effect(
    toList([
      (actions) => {
        return run2(actions.dispatch, actions.emit, actions.select, actions.root);
      }
    ])
  );
}
function from(effect) {
  return custom((dispatch, _, _1, _2) => {
    return effect(dispatch);
  });
}
function none() {
  return new Effect(toList([]));
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element2 = class extends CustomType {
  constructor(key3, namespace, tag2, attrs, children2, self_closing, void$) {
    super();
    this.key = key3;
    this.namespace = namespace;
    this.tag = tag2;
    this.attrs = attrs;
    this.children = children2;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function attribute_to_event_handler(attribute2) {
  if (attribute2 instanceof Attribute) {
    return new Error(void 0);
  } else {
    let name = attribute2[0];
    let handler = attribute2[1];
    let name$1 = drop_start(name, 2);
    return new Ok([name$1, handler]);
  }
}
function do_element_list_handlers(elements2, handlers2, key3) {
  return index_fold(
    elements2,
    handlers2,
    (handlers3, element2, index6) => {
      let key$1 = key3 + "-" + to_string(index6);
      return do_handlers(element2, handlers3, key$1);
    }
  );
}
function do_handlers(loop$element, loop$handlers, loop$key) {
  while (true) {
    let element2 = loop$element;
    let handlers2 = loop$handlers;
    let key3 = loop$key;
    if (element2 instanceof Text) {
      return handlers2;
    } else if (element2 instanceof Map2) {
      let subtree = element2.subtree;
      loop$element = subtree();
      loop$handlers = handlers2;
      loop$key = key3;
    } else {
      let attrs = element2.attrs;
      let children2 = element2.children;
      let handlers$1 = fold(
        attrs,
        handlers2,
        (handlers3, attr) => {
          let $ = attribute_to_event_handler(attr);
          if ($.isOk()) {
            let name = $[0][0];
            let handler = $[0][1];
            return insert(handlers3, key3 + "-" + name, handler);
          } else {
            return handlers3;
          }
        }
      );
      return do_element_list_handlers(children2, handlers$1, key3);
    }
  }
}
function handlers(element2) {
  return do_handlers(element2, new_map(), "0");
}

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value4) {
  return new Attribute(name, identity(value4), false);
}
function on(name, handler) {
  return new Event2("on" + name, handler);
}
function style(properties) {
  return attribute(
    "style",
    fold(
      properties,
      "",
      (styles, _use1) => {
        let name$1 = _use1[0];
        let value$1 = _use1[1];
        return styles + name$1 + ":" + value$1 + ";";
      }
    )
  );
}
function class$(name) {
  return attribute("class", name);
}
function type_(name) {
  return attribute("type", name);
}
function value(val) {
  return attribute("value", val);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag2, attrs, children2) {
  if (tag2 === "area") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "base") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "br") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "col") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "embed") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "hr") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "img") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "input") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "link") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "meta") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "param") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "source") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "track") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "wbr") {
    return new Element2("", "", tag2, attrs, toList([]), false, true);
  } else {
    return new Element2("", "", tag2, attrs, children2, false, false);
  }
}
function text(content) {
  return new Text(content);
}

// build/dev/javascript/gleam_stdlib/gleam/set.mjs
var Set2 = class extends CustomType {
  constructor(dict2) {
    super();
    this.dict = dict2;
  }
};
function new$2() {
  return new Set2(new_map());
}

// build/dev/javascript/lustre/lustre/internals/patch.mjs
var Diff = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Init = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
function is_empty_element_diff(diff2) {
  return isEqual(diff2.created, new_map()) && isEqual(
    diff2.removed,
    new$2()
  ) && isEqual(diff2.updated, new_map());
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Attrs = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Batch = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Emit2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Event3 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Shutdown = class extends CustomType {
};
var Subscribe = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unsubscribe = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
if (globalThis.customElements && !globalThis.customElements.get("lustre-fragment")) {
  globalThis.customElements.define(
    "lustre-fragment",
    class LustreFragment extends HTMLElement {
      constructor() {
        super();
      }
    }
  );
}
function morph(prev, next, dispatch) {
  let out;
  let stack2 = [{ prev, next, parent: prev.parentNode }];
  while (stack2.length) {
    let { prev: prev2, next: next2, parent } = stack2.pop();
    while (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack: stack2
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack: stack2 }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a) => a.name)) : null;
  let className = null;
  let style2 = null;
  let innerHTML = null;
  if (canMorph && next.tag === "textarea") {
    const innertText = next.children[Symbol.iterator]().next().value?.content;
    if (innertText !== void 0)
      el.value = innertText;
  }
  const delegated = [];
  for (const attr of next.attrs) {
    const name = attr[0];
    const value4 = attr[1];
    if (attr.as_property) {
      if (el[name] !== value4)
        el[name] = value4;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value4, eventName === "input");
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el.setAttribute(name, value4);
      if (canMorph) {
        prevHandlers.delete(eventName);
        prevAttributes.delete(name);
      }
    } else if (name.startsWith("delegate:data-") || name.startsWith("delegate:aria-")) {
      el.setAttribute(name, value4);
      delegated.push([name.slice(10), value4]);
    } else if (name === "class") {
      className = className === null ? value4 : className + " " + value4;
    } else if (name === "style") {
      style2 = style2 === null ? value4 : style2 + value4;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value4;
    } else {
      if (el.getAttribute(name) !== value4)
        el.setAttribute(name, value4);
      if (name === "value" || name === "selected")
        el[name] = value4;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style2 !== null) {
    el.setAttribute("style", style2);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.tag === "slot") {
    window.queueMicrotask(() => {
      for (const child of el.assignedElements()) {
        for (const [name, value4] of delegated) {
          if (!child.hasAttribute(name)) {
            child.setAttribute(name, value4);
          }
        }
      }
    });
  }
  if (next.key !== void 0 && next.key !== "") {
    el.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el.innerHTML = innerHTML;
    return el;
  }
  let prevChild = el.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = children(next).next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
    for (const child of children(next)) {
      prevChild = diffKeyedChild(
        prevChild,
        child,
        el,
        stack2,
        incomingKeyedChildren,
        keyedChildren,
        seenKeys
      );
    }
  } else {
    for (const child of children(next)) {
      stack2.unshift({ prev: prevChild, next: child, parent: el });
      prevChild = prevChild?.nextSibling;
    }
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = next2;
  }
  return el;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target2 = event2.currentTarget;
  if (!registeredHandlers.has(target2)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target2);
  if (!handlersForEventTarget.has(event2.type)) {
    target2.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el = event2.currentTarget;
  const tag2 = el.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag: tag2,
    data: include.reduce(
      (data2, property) => {
        const path = property.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el) {
    for (const child of children(el)) {
      const key3 = child?.key || child?.getAttribute?.("data-lustre-key");
      if (key3)
        keyedChildren.set(key3, child);
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el, stack2, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    stack2.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack2.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack2.unshift({ prev: null, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el.insertBefore(placeholder, prevChild);
    stack2.unshift({ prev: placeholder, next: child, parent: el });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack2.unshift({ prev: prevChild, next: child, parent: el });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el.insertBefore(keyedChild, prevChild);
  stack2.unshift({ prev: keyedChild, next: child, parent: el });
  return prevChild;
}
function* children(element2) {
  for (const child of element2.children) {
    yield* forceChild(child);
  }
}
function* forceChild(element2) {
  if (element2.subtree !== void 0) {
    yield* forceChild(element2.subtree());
  } else {
    yield element2;
  }
}

// build/dev/javascript/lustre/lustre.ffi.mjs
var LustreClientApplication = class _LustreClientApplication {
  /**
   * @template Flags
   *
   * @param {object} app
   * @param {(flags: Flags) => [Model, Lustre.Effect<Msg>]} app.init
   * @param {(msg: Msg, model: Model) => [Model, Lustre.Effect<Msg>]} app.update
   * @param {(model: Model) => Lustre.Element<Msg>} app.view
   * @param {string | HTMLElement} selector
   * @param {Flags} flags
   *
   * @returns {Gleam.Ok<(action: Lustre.Action<Lustre.Client, Msg>>) => void>}
   */
  static start({ init: init6, update: update5, view: view5 }, selector, flags) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root)
      return new Error(new ElementNotFound(selector));
    const app4 = new _LustreClientApplication(root, init6(flags), update5, view5);
    return new Ok((action) => app4.send(action));
  }
  /**
   * @param {Element} root
   * @param {[Model, Lustre.Effect<Msg>]} init
   * @param {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} update
   * @param {(model: Model) => Lustre.Element<Msg>} view
   *
   * @returns {LustreClientApplication}
   */
  constructor(root, [init6, effects], update5, view5) {
    this.root = root;
    this.#model = init6;
    this.#update = update5;
    this.#view = view5;
    this.#tickScheduled = window.requestAnimationFrame(
      () => this.#tick(effects.all.toArray(), true)
    );
  }
  /** @type {Element} */
  root;
  /**
   * @param {Lustre.Action<Lustre.Client, Msg>} action
   *
   * @returns {void}
   */
  send(action) {
    if (action instanceof Debug) {
      if (action[0] instanceof ForceModel) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#queue = [];
        this.#model = action[0][0];
        const vdom = this.#view(this.#model);
        const dispatch = (handler, immediate = false) => (event2) => {
          const result = handler(event2);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0], immediate));
          }
        };
        const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
        morph(prev, vdom, dispatch);
      }
    } else if (action instanceof Dispatch) {
      const msg = action[0];
      const immediate = action[1] ?? false;
      this.#queue.push(msg);
      if (immediate) {
        this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
        this.#tick();
      } else if (!this.#tickScheduled) {
        this.#tickScheduled = window.requestAnimationFrame(() => this.#tick());
      }
    } else if (action instanceof Emit2) {
      const event2 = action[0];
      const data = action[1];
      this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
    } else if (action instanceof Shutdown) {
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#model = null;
      this.#update = null;
      this.#view = null;
      this.#queue = null;
      while (this.root.firstChild) {
        this.root.firstChild.remove();
      }
    }
  }
  /** @type {Model} */
  #model;
  /** @type {(model: Model, msg: Msg) => [Model, Lustre.Effect<Msg>]} */
  #update;
  /** @type {(model: Model) => Lustre.Element<Msg>} */
  #view;
  /** @type {Array<Msg>} */
  #queue = [];
  /** @type {number | undefined} */
  #tickScheduled;
  /**
   * @param {Lustre.Effect<Msg>[]} effects
   */
  #tick(effects = []) {
    this.#tickScheduled = void 0;
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const dispatch = (handler, immediate = false) => (event2) => {
      const result = handler(event2);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0], immediate));
      }
    };
    const prev = this.root.firstChild ?? this.root.appendChild(document.createTextNode(""));
    morph(prev, vdom, dispatch);
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = this.root;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start = LustreClientApplication.start;
var make_lustre_client_component = ({ init: init6, update: update5, view: view5, on_attribute_change }, name) => {
  if (!is_browser())
    return new Error(new NotABrowser());
  if (!name.includes("-"))
    return new Error(new BadComponentName(name));
  if (window.customElements.get(name)) {
    return new Error(new ComponentAlreadyRegistered(name));
  }
  const [model, effects] = init6(void 0);
  const hasAttributes = on_attribute_change instanceof Some;
  const component = class LustreClientComponent extends HTMLElement {
    /**
     * @returns {string[]}
     */
    static get observedAttributes() {
      if (hasAttributes) {
        return on_attribute_change[0].entries().map(([name2]) => name2);
      } else {
        return [];
      }
    }
    /**
     * @returns {LustreClientComponent}
     */
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.internals = this.attachInternals();
      if (hasAttributes) {
        on_attribute_change[0].forEach((decoder, name2) => {
          Object.defineProperty(this, name2, {
            get() {
              return this[`__mirrored__${name2}`];
            },
            set(value4) {
              const prev = this[`__mirrored__${name2}`];
              if (this.#connected && isEqual(prev, value4))
                return;
              this[`__mirrorred__${name2}`] = value4;
              const decoded2 = decoder(value4);
              if (decoded2 instanceof Error)
                return;
              this.#queue.push(decoded2[0]);
              if (this.#connected && !this.#tickScheduled) {
                this.#tickScheduled = window.requestAnimationFrame(
                  () => this.#tick()
                );
              }
            }
          });
        });
      }
    }
    /**
     *
     */
    connectedCallback() {
      this.#adoptStyleSheets().finally(() => {
        this.#tick(effects.all.toArray(), true);
        this.#connected = true;
      });
    }
    /**
     * @param {string} key
     * @param {string} prev
     * @param {string} next
     */
    attributeChangedCallback(key3, prev, next) {
      if (prev !== next)
        this[key3] = next;
    }
    /**
     *
     */
    disconnectedCallback() {
      this.#model = null;
      this.#queue = [];
      this.#tickScheduled = window.cancelAnimationFrame(this.#tickScheduled);
      this.#connected = false;
    }
    /**
     * @param {Lustre.Action<Msg, Lustre.ClientSpa>} action
     */
    send(action) {
      if (action instanceof Debug) {
        if (action[0] instanceof ForceModel) {
          this.#tickScheduled = window.cancelAnimationFrame(
            this.#tickScheduled
          );
          this.#queue = [];
          this.#model = action[0][0];
          const vdom = view5(this.#model);
          const dispatch = (handler, immediate = false) => (event2) => {
            const result = handler(event2);
            if (result instanceof Ok) {
              this.send(new Dispatch(result[0], immediate));
            }
          };
          const prev = this.shadowRoot.childNodes[this.#adoptedStyleElements.length] ?? this.shadowRoot.appendChild(document.createTextNode(""));
          morph(prev, vdom, dispatch);
        }
      } else if (action instanceof Dispatch) {
        const msg = action[0];
        const immediate = action[1] ?? false;
        this.#queue.push(msg);
        if (immediate) {
          this.#tickScheduled = window.cancelAnimationFrame(
            this.#tickScheduled
          );
          this.#tick();
        } else if (!this.#tickScheduled) {
          this.#tickScheduled = window.requestAnimationFrame(
            () => this.#tick()
          );
        }
      } else if (action instanceof Emit2) {
        const event2 = action[0];
        const data = action[1];
        this.dispatchEvent(
          new CustomEvent(event2, {
            detail: data,
            bubbles: true,
            composed: true
          })
        );
      }
    }
    /** @type {Element[]} */
    #adoptedStyleElements = [];
    /** @type {Model} */
    #model = model;
    /** @type {Array<Msg>} */
    #queue = [];
    /** @type {number | undefined} */
    #tickScheduled;
    /** @type {boolean} */
    #connected = true;
    #tick(effects2 = []) {
      if (!this.#connected)
        return;
      this.#tickScheduled = void 0;
      this.#flush(effects2);
      const vdom = view5(this.#model);
      const dispatch = (handler, immediate = false) => (event2) => {
        const result = handler(event2);
        if (result instanceof Ok) {
          this.send(new Dispatch(result[0], immediate));
        }
      };
      const prev = this.shadowRoot.childNodes[this.#adoptedStyleElements.length] ?? this.shadowRoot.appendChild(document.createTextNode(""));
      morph(prev, vdom, dispatch);
    }
    #flush(effects2 = []) {
      while (this.#queue.length > 0) {
        const msg = this.#queue.shift();
        const [next, effect] = update5(this.#model, msg);
        effects2 = effects2.concat(effect.all.toArray());
        this.#model = next;
      }
      while (effects2.length > 0) {
        const effect = effects2.shift();
        const dispatch = (msg) => this.send(new Dispatch(msg));
        const emit2 = (event2, data) => this.dispatchEvent(
          new CustomEvent(event2, {
            detail: data,
            bubbles: true,
            composed: true
          })
        );
        const select = () => {
        };
        const root = this.shadowRoot;
        effect({ dispatch, emit: emit2, select, root });
      }
      if (this.#queue.length > 0) {
        this.#flush(effects2);
      }
    }
    async #adoptStyleSheets() {
      const pendingParentStylesheets = [];
      for (const link of document.querySelectorAll("link[rel=stylesheet]")) {
        if (link.sheet)
          continue;
        pendingParentStylesheets.push(
          new Promise((resolve2, reject2) => {
            link.addEventListener("load", resolve2);
            link.addEventListener("error", reject2);
          })
        );
      }
      await Promise.allSettled(pendingParentStylesheets);
      while (this.#adoptedStyleElements.length) {
        this.#adoptedStyleElements.shift().remove();
        this.shadowRoot.firstChild.remove();
      }
      this.shadowRoot.adoptedStyleSheets = this.getRootNode().adoptedStyleSheets;
      const pending = [];
      for (const sheet of document.styleSheets) {
        try {
          this.shadowRoot.adoptedStyleSheets.push(sheet);
        } catch {
          try {
            const adoptedSheet = new CSSStyleSheet();
            for (const rule of sheet.cssRules) {
              adoptedSheet.insertRule(
                rule.cssText,
                adoptedSheet.cssRules.length
              );
            }
            this.shadowRoot.adoptedStyleSheets.push(adoptedSheet);
          } catch {
            const node = sheet.ownerNode.cloneNode();
            this.shadowRoot.prepend(node);
            this.#adoptedStyleElements.push(node);
            pending.push(
              new Promise((resolve2, reject2) => {
                node.onload = resolve2;
                node.onerror = reject2;
              })
            );
          }
        }
      }
      return Promise.allSettled(pending);
    }
  };
  window.customElements.define(name, component);
  return new Ok(void 0);
};
var LustreServerApplication = class _LustreServerApplication {
  static start({ init: init6, update: update5, view: view5, on_attribute_change }, flags) {
    const app4 = new _LustreServerApplication(
      init6(flags),
      update5,
      view5,
      on_attribute_change
    );
    return new Ok((action) => app4.send(action));
  }
  constructor([model, effects], update5, view5, on_attribute_change) {
    this.#model = model;
    this.#update = update5;
    this.#view = view5;
    this.#html = view5(model);
    this.#onAttributeChange = on_attribute_change;
    this.#renderers = /* @__PURE__ */ new Map();
    this.#handlers = handlers(this.#html);
    this.#tick(effects.all.toArray());
  }
  send(action) {
    if (action instanceof Attrs) {
      for (const attr of action[0]) {
        const decoder = this.#onAttributeChange.get(attr[0]);
        if (!decoder)
          continue;
        const msg = decoder(attr[1]);
        if (msg instanceof Error)
          continue;
        this.#queue.push(msg);
      }
      this.#tick();
    } else if (action instanceof Batch) {
      this.#queue = this.#queue.concat(action[0].toArray());
      this.#tick(action[1].all.toArray());
    } else if (action instanceof Debug) {
    } else if (action instanceof Dispatch) {
      this.#queue.push(action[0]);
      this.#tick();
    } else if (action instanceof Emit2) {
      const event2 = new Emit(action[0], action[1]);
      for (const [_, renderer] of this.#renderers) {
        renderer(event2);
      }
    } else if (action instanceof Event3) {
      const handler = this.#handlers.get(action[0]);
      if (!handler)
        return;
      const msg = handler(action[1]);
      if (msg instanceof Error)
        return;
      this.#queue.push(msg[0]);
      this.#tick();
    } else if (action instanceof Subscribe) {
      const attrs = keys(this.#onAttributeChange);
      const patch = new Init(attrs, this.#html);
      this.#renderers = this.#renderers.set(action[0], action[1]);
      action[1](patch);
    } else if (action instanceof Unsubscribe) {
      this.#renderers = this.#renderers.delete(action[0]);
    }
  }
  #model;
  #update;
  #queue;
  #view;
  #html;
  #renderers;
  #handlers;
  #onAttributeChange;
  #tick(effects = []) {
    this.#flush(effects);
    const vdom = this.#view(this.#model);
    const diff2 = elements(this.#html, vdom);
    if (!is_empty_element_diff(diff2)) {
      const patch = new Diff(diff2);
      for (const [_, renderer] of this.#renderers) {
        renderer(patch);
      }
    }
    this.#html = vdom;
    this.#handlers = diff2.handlers;
  }
  #flush(effects = []) {
    while (this.#queue.length > 0) {
      const msg = this.#queue.shift();
      const [next, effect] = this.#update(this.#model, msg);
      effects = effects.concat(effect.all.toArray());
      this.#model = next;
    }
    while (effects.length > 0) {
      const effect = effects.shift();
      const dispatch = (msg) => this.send(new Dispatch(msg));
      const emit2 = (event2, data) => this.root.dispatchEvent(
        new CustomEvent(event2, {
          detail: data,
          bubbles: true,
          composed: true
        })
      );
      const select = () => {
      };
      const root = null;
      effect({ dispatch, emit: emit2, select, root });
    }
    if (this.#queue.length > 0) {
      this.#flush(effects);
    }
  }
};
var start_server_application = LustreServerApplication.start;
var is_browser = () => globalThis.window && window.document;

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init6, update5, view5, on_attribute_change) {
    super();
    this.init = init6;
    this.update = update5;
    this.view = view5;
    this.on_attribute_change = on_attribute_change;
  }
};
var BadComponentName = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var ComponentAlreadyRegistered = class extends CustomType {
  constructor(name) {
    super();
    this.name = name;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init6, update5, view5) {
  return new App(init6, update5, view5, new None());
}
function start2(app4, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app4, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function h1(attrs, children2) {
  return element("h1", attrs, children2);
}
function div(attrs, children2) {
  return element("div", attrs, children2);
}
function span(attrs, children2) {
  return element("span", attrs, children2);
}
function table(attrs, children2) {
  return element("table", attrs, children2);
}
function tbody(attrs, children2) {
  return element("tbody", attrs, children2);
}
function td(attrs, children2) {
  return element("td", attrs, children2);
}
function th(attrs, children2) {
  return element("th", attrs, children2);
}
function tr(attrs, children2) {
  return element("tr", attrs, children2);
}
function button(attrs, children2) {
  return element("button", attrs, children2);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}
function label(attrs, children2) {
  return element("label", attrs, children2);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function value2(event2) {
  let _pipe = event2;
  return field("target", field("value", string2))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value2(event2);
      return map3(_pipe, msg);
    }
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/aside.mjs
function of(element2, attributes, side, main2) {
  return element2(
    prepend(class$("lustre-ui-aside"), attributes),
    toList([side, main2])
  );
}
function aside(attributes, side, main2) {
  return of(div, attributes, side, main2);
}

// build/dev/javascript/lustre_ui/lustre/ui/button.mjs
function button2(attributes, children2) {
  return button(
    prepend(
      class$("lustre-ui-button"),
      prepend(type_("button"), attributes)
    ),
    children2
  );
}
function primary() {
  return attribute("data-variant", "primary");
}
function greyscale() {
  return attribute("data-variant", "greyscale");
}

// build/dev/javascript/lustre_ui/lustre/ui/centre.mjs
function of2(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-centre"), attributes),
    toList([children2])
  );
}
function centre(attributes, children2) {
  return of2(div, attributes, children2);
}

// build/dev/javascript/lustre_ui/lustre/ui/stack.mjs
function of3(element2, attributes, children2) {
  return element2(
    prepend(class$("lustre-ui-stack"), attributes),
    children2
  );
}
function packed() {
  return class$("packed");
}

// build/dev/javascript/lustre_ui/lustre/ui/field.mjs
function of4(element2, attributes, label2, input4, message) {
  return of3(
    element2,
    prepend(
      class$("lustre-ui-field"),
      prepend(packed(), attributes)
    ),
    toList([
      span(toList([class$("label")]), label2),
      input4,
      span(toList([class$("message")]), message)
    ])
  );
}
function field3(attributes, label2, input4, message) {
  return of4(label, attributes, label2, input4, message);
}

// build/dev/javascript/lustre_ui/lustre/ui/input.mjs
function input2(attributes) {
  return input(
    prepend(class$("lustre-ui-input"), attributes)
  );
}

// build/dev/javascript/lustre_ui/lustre/ui.mjs
var aside2 = aside;
var button3 = button2;
var centre2 = centre;
var field4 = field3;
var input3 = input2;

// build/dev/javascript/plinth/storage_ffi.mjs
function sessionStorage() {
  try {
    if (globalThis.Storage && globalThis.sessionStorage instanceof globalThis.Storage) {
      return new Ok(globalThis.sessionStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}
function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}
function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}
function removeItem(storage, keyName) {
  storage.removeItem(keyName);
}
function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}

// build/dev/javascript/childglem/env.mjs
var jwt_key = "7bc3c9fc";
var get_childs = "http://localhost:8080/api/v1/childs";
var post_signup = "http://localhost:8080/api/v1/signup";
var post_signin = "http://localhost:8080/api/v1/signin";

// build/dev/javascript/childglem/auth/jwt.mjs
function save(token) {
  return try$(
    sessionStorage(),
    (stor) => {
      return try$(
        setItem(stor, jwt_key, token),
        (res) => {
          return new Ok(res);
        }
      );
    }
  );
}
function fetch2() {
  return try$(
    sessionStorage(),
    (stor) => {
      return try$(
        getItem(stor, jwt_key),
        (item) => {
          return new Ok(item);
        }
      );
    }
  );
}
function delete$2() {
  return try$(
    sessionStorage(),
    (stor) => {
      return new Ok(removeItem(stor, jwt_key));
    }
  );
}

// build/dev/javascript/gleam_javascript/gleam_javascript_ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value4) {
    return value4 instanceof Promise ? new _PromiseLayer(value4) : value4;
  }
  static unwrap(value4) {
    return value4 instanceof _PromiseLayer ? value4.promise : value4;
  }
};
function resolve(value4) {
  return Promise.resolve(PromiseLayer.wrap(value4));
}
function then_await(promise, fn) {
  return promise.then((value4) => fn(PromiseLayer.unwrap(value4)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value4) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value4)))
  );
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a) => {
      callback(a);
      return a;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then_await(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a = result[0];
        return callback(a);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/plinth/window_ffi.mjs
function self() {
  return globalThis;
}
function alert2(message) {
  window.alert(message);
}
function prompt(message, defaultValue) {
  let text2 = window.prompt(message, defaultValue);
  if (text2 !== null) {
    return new Ok(text2);
  } else {
    return new Error();
  }
}
function addEventListener3(type, listener) {
  return window.addEventListener(type, listener);
}
function document2(window2) {
  return window2.document;
}
async function requestWakeLock() {
  try {
    return new Ok(await window.navigator.wakeLock.request("screen"));
  } catch (error) {
    return new Error(error.toString());
  }
}
function location() {
  return window.location.href;
}
function locationOf(w) {
  try {
    return new Ok(w.location.href);
  } catch (error) {
    return new Error(error.toString());
  }
}
function setLocation(w, url) {
  w.location.href = url;
}
function origin() {
  return window.location.origin;
}
function pathname() {
  return window.location.pathname;
}
function reload() {
  return window.location.reload();
}
function reloadOf(w) {
  return w.location.reload();
}
function focus2(w) {
  return w.focus();
}
function getHash2() {
  const hash = window.location.hash;
  if (hash == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(hash.slice(1)));
}
function getSearch() {
  const search = window.location.search;
  if (search == "") {
    return new Error();
  }
  return new Ok(decodeURIComponent(search.slice(1)));
}
function innerHeight(w) {
  return w.innerHeight;
}
function innerWidth(w) {
  return w.innerWidth;
}
function outerHeight(w) {
  return w.outerHeight;
}
function outerWidth(w) {
  return w.outerWidth;
}
function screenX(w) {
  return w.screenX;
}
function screenY(w) {
  return w.screenY;
}
function screenTop(w) {
  return w.screenTop;
}
function screenLeft(w) {
  return w.screenLeft;
}
function scrollX(w) {
  return w.scrollX;
}
function scrollY(w) {
  return w.scrollY;
}
function open(url, target2, features) {
  try {
    return new Ok(window.open(url, target2, features));
  } catch (error) {
    return new Error(error.toString());
  }
}
function close(w) {
  w.close();
}
function closed(w) {
  return w.closed;
}
function queueMicrotask(callback) {
  return window.queueMicrotask(callback);
}
function requestAnimationFrame(callback) {
  return window.requestAnimationFrame(callback);
}
function cancelAnimationFrame(callback) {
  return window.cancelAnimationFrame(callback);
}
function eval_(string) {
  try {
    return new Ok(eval(string));
  } catch (error) {
    return new Error(error.toString());
  }
}
async function import_(string7) {
  try {
    return new Ok(await import(string7));
  } catch (error) {
    return new Error(error.toString());
  }
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }
};
function is_valid_host_within_brackets_char(char) {
  return 48 >= char && char <= 57 || 65 >= char && char <= 90 || 97 >= char && char <= 122 || char === 58 || char === 46;
}
function parse_fragment(rest, pieces) {
  return new Ok(
    (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        _record.host,
        _record.port,
        _record.path,
        _record.query,
        new Some(rest)
      );
    })()
  );
}
function parse_query_with_question_mark_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let query = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          new Some(query),
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            _record.path,
            new Some(original),
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_query_with_question_mark(uri_string, pieces) {
  return parse_query_with_question_mark_loop(uri_string, uri_string, pieces, 0);
}
function parse_path_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let path = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          _record.port,
          path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_path(uri_string, pieces) {
  return parse_path_loop(uri_string, uri_string, pieces, 0);
}
function parse_port_loop(loop$uri_string, loop$pieces, loop$port) {
  while (true) {
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let port = loop$port;
    if (uri_string.startsWith("0")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10;
    } else if (uri_string.startsWith("1")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 1;
    } else if (uri_string.startsWith("2")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 2;
    } else if (uri_string.startsWith("3")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 3;
    } else if (uri_string.startsWith("4")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 4;
    } else if (uri_string.startsWith("5")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 5;
    } else if (uri_string.startsWith("6")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 6;
    } else if (uri_string.startsWith("7")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 7;
    } else if (uri_string.startsWith("8")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 8;
    } else if (uri_string.startsWith("9")) {
      let rest = uri_string.slice(1);
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$port = port * 10 + 9;
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          _record.host,
          new Some(port),
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            new Some(port),
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      return new Error(void 0);
    }
  }
}
function parse_port(uri_string, pieces) {
  if (uri_string.startsWith(":0")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 0);
  } else if (uri_string.startsWith(":1")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 1);
  } else if (uri_string.startsWith(":2")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 2);
  } else if (uri_string.startsWith(":3")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 3);
  } else if (uri_string.startsWith(":4")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 4);
  } else if (uri_string.startsWith(":5")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 5);
  } else if (uri_string.startsWith(":6")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 6);
  } else if (uri_string.startsWith(":7")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 7);
  } else if (uri_string.startsWith(":8")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 8);
  } else if (uri_string.startsWith(":9")) {
    let rest = uri_string.slice(2);
    return parse_port_loop(rest, pieces, 9);
  } else if (uri_string.startsWith(":")) {
    return new Error(void 0);
  } else if (uri_string.startsWith("?")) {
    let rest = uri_string.slice(1);
    return parse_query_with_question_mark(rest, pieces);
  } else if (uri_string.startsWith("#")) {
    let rest = uri_string.slice(1);
    return parse_fragment(rest, pieces);
  } else if (uri_string.startsWith("/")) {
    return parse_path(uri_string, pieces);
  } else if (uri_string === "") {
    return new Ok(pieces);
  } else {
    return new Error(void 0);
  }
}
function parse_host_outside_of_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(original),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith(":")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(uri_string, pieces$1);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_host_within_brackets_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            new Some(uri_string),
            _record.port,
            _record.path,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else if (uri_string.startsWith("]") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_port(rest, pieces);
    } else if (uri_string.startsWith("]")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size + 1);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_port(rest, pieces$1);
    } else if (uri_string.startsWith("/") && size === 0) {
      return parse_path(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_path(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let host = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(host),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else {
      let $ = pop_codeunit(uri_string);
      let char = $[0];
      let rest = $[1];
      let $1 = is_valid_host_within_brackets_char(char);
      if ($1) {
        loop$original = original;
        loop$uri_string = rest;
        loop$pieces = pieces;
        loop$size = size + 1;
      } else {
        return parse_host_outside_of_brackets_loop(
          original,
          original,
          pieces,
          0
        );
      }
    }
  }
}
function parse_host_within_brackets(uri_string, pieces) {
  return parse_host_within_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host_outside_of_brackets(uri_string, pieces) {
  return parse_host_outside_of_brackets_loop(uri_string, uri_string, pieces, 0);
}
function parse_host(uri_string, pieces) {
  if (uri_string.startsWith("[")) {
    return parse_host_within_brackets(uri_string, pieces);
  } else if (uri_string.startsWith(":")) {
    let pieces$1 = (() => {
      let _record = pieces;
      return new Uri(
        _record.scheme,
        _record.userinfo,
        new Some(""),
        _record.port,
        _record.path,
        _record.query,
        _record.fragment
      );
    })();
    return parse_port(uri_string, pieces$1);
  } else if (uri_string === "") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else {
    return parse_host_outside_of_brackets(uri_string, pieces);
  }
}
function parse_userinfo_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("@") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_host(rest, pieces);
    } else if (uri_string.startsWith("@")) {
      let rest = uri_string.slice(1);
      let userinfo = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          new Some(userinfo),
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_host(rest, pieces$1);
    } else if (uri_string === "") {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("/")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("?")) {
      return parse_host(original, pieces);
    } else if (uri_string.startsWith("#")) {
      return parse_host(original, pieces);
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse_authority_pieces(string7, pieces) {
  return parse_userinfo_loop(string7, string7, pieces, 0);
}
function parse_authority_with_slashes(uri_string, pieces) {
  if (uri_string === "//") {
    return new Ok(
      (() => {
        let _record = pieces;
        return new Uri(
          _record.scheme,
          _record.userinfo,
          new Some(""),
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })()
    );
  } else if (uri_string.startsWith("//")) {
    let rest = uri_string.slice(2);
    return parse_authority_pieces(rest, pieces);
  } else {
    return parse_path(uri_string, pieces);
  }
}
function parse_scheme_loop(loop$original, loop$uri_string, loop$pieces, loop$size) {
  while (true) {
    let original = loop$original;
    let uri_string = loop$uri_string;
    let pieces = loop$pieces;
    let size = loop$size;
    if (uri_string.startsWith("/") && size === 0) {
      return parse_authority_with_slashes(uri_string, pieces);
    } else if (uri_string.startsWith("/")) {
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(uri_string, pieces$1);
    } else if (uri_string.startsWith("?") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_query_with_question_mark(rest, pieces);
    } else if (uri_string.startsWith("?")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_query_with_question_mark(rest, pieces$1);
    } else if (uri_string.startsWith("#") && size === 0) {
      let rest = uri_string.slice(1);
      return parse_fragment(rest, pieces);
    } else if (uri_string.startsWith("#")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_fragment(rest, pieces$1);
    } else if (uri_string.startsWith(":") && size === 0) {
      return new Error(void 0);
    } else if (uri_string.startsWith(":")) {
      let rest = uri_string.slice(1);
      let scheme = string_codeunit_slice(original, 0, size);
      let pieces$1 = (() => {
        let _record = pieces;
        return new Uri(
          new Some(lowercase(scheme)),
          _record.userinfo,
          _record.host,
          _record.port,
          _record.path,
          _record.query,
          _record.fragment
        );
      })();
      return parse_authority_with_slashes(rest, pieces$1);
    } else if (uri_string === "") {
      return new Ok(
        (() => {
          let _record = pieces;
          return new Uri(
            _record.scheme,
            _record.userinfo,
            _record.host,
            _record.port,
            original,
            _record.query,
            _record.fragment
          );
        })()
      );
    } else {
      let $ = pop_codeunit(uri_string);
      let rest = $[1];
      loop$original = original;
      loop$uri_string = rest;
      loop$pieces = pieces;
      loop$size = size + 1;
    }
  }
}
function parse2(uri_string) {
  let default_pieces = new Uri(
    new None(),
    new None(),
    new None(),
    new None(),
    "",
    new None(),
    new None()
  );
  return parse_scheme_loop(uri_string, uri_string, default_pieces, 0);
}
function to_string3(uri) {
  let parts = (() => {
    let $ = uri.fragment;
    if ($ instanceof Some) {
      let fragment = $[0];
      return toList(["#", fragment]);
    } else {
      return toList([]);
    }
  })();
  let parts$1 = (() => {
    let $ = uri.query;
    if ($ instanceof Some) {
      let query = $[0];
      return prepend("?", prepend(query, parts));
    } else {
      return parts;
    }
  })();
  let parts$2 = prepend(uri.path, parts$1);
  let parts$3 = (() => {
    let $ = uri.host;
    let $1 = starts_with(uri.path, "/");
    if ($ instanceof Some && !$1 && $[0] !== "") {
      let host = $[0];
      return prepend("/", parts$2);
    } else {
      return parts$2;
    }
  })();
  let parts$4 = (() => {
    let $ = uri.host;
    let $1 = uri.port;
    if ($ instanceof Some && $1 instanceof Some) {
      let port = $1[0];
      return prepend(":", prepend(to_string(port), parts$3));
    } else {
      return parts$3;
    }
  })();
  let parts$5 = (() => {
    let $ = uri.scheme;
    let $1 = uri.userinfo;
    let $2 = uri.host;
    if ($ instanceof Some && $1 instanceof Some && $2 instanceof Some) {
      let s = $[0];
      let u = $1[0];
      let h = $2[0];
      return prepend(
        s,
        prepend(
          "://",
          prepend(u, prepend("@", prepend(h, parts$4)))
        )
      );
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof Some) {
      let s = $[0];
      let h = $2[0];
      return prepend(s, prepend("://", prepend(h, parts$4)));
    } else if ($ instanceof Some && $1 instanceof Some && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof None && $1 instanceof None && $2 instanceof Some) {
      let h = $2[0];
      return prepend("//", prepend(h, parts$4));
    } else {
      return parts$4;
    }
  })();
  return concat2(parts$5);
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "connect";
  } else if (method instanceof Delete) {
    return "delete";
  } else if (method instanceof Get) {
    return "get";
  } else if (method instanceof Head) {
    return "head";
  } else if (method instanceof Options) {
    return "options";
  } else if (method instanceof Patch) {
    return "patch";
  } else if (method instanceof Post) {
    return "post";
  } else if (method instanceof Put) {
    return "put";
  } else if (method instanceof Trace) {
    return "trace";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body2, scheme, host, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body2;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return then$(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function set_header(request, key3, value4) {
  let headers = key_set(request.headers, lowercase(key3), value4);
  let _record = request;
  return new Request(
    _record.method,
    headers,
    _record.body,
    _record.scheme,
    _record.host,
    _record.port,
    _record.path,
    _record.query
  );
}
function set_body(req, body2) {
  let method = req.method;
  let headers = req.headers;
  let scheme = req.scheme;
  let host = req.host;
  let port = req.port;
  let path = req.path;
  let query = req.query;
  return new Request(method, headers, body2, scheme, host, port, path, query);
}
function set_query(req, query) {
  let pair = (t) => {
    return percent_encode(t[0]) + "=" + percent_encode(t[1]);
  };
  let query$1 = (() => {
    let _pipe = query;
    let _pipe$1 = map2(_pipe, pair);
    let _pipe$2 = intersperse(_pipe$1, "&");
    let _pipe$3 = concat2(_pipe$2);
    return new Some(_pipe$3);
  })();
  let _record = req;
  return new Request(
    _record.method,
    _record.headers,
    _record.body,
    _record.scheme,
    _record.host,
    _record.port,
    _record.path,
    query$1
  );
}
function set_method(req, method) {
  let _record = req;
  return new Request(
    method,
    _record.headers,
    _record.body,
    _record.scheme,
    _record.host,
    _record.port,
    _record.path,
    _record.query
  );
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body2) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body2;
  }
};
function get_header(response, key3) {
  return key_find(response.headers, lowercase(key3));
}

// build/dev/javascript/gleam_fetch/gleam_fetch_ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error) {
    return new Error(new NetworkError(error.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function request_common(request) {
  let url = to_string3(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  return [url, options];
}
function to_fetch_request(request) {
  let [url, options] = request_common(request);
  if (options.method !== "GET" && options.method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body2;
  try {
    body2 = await response.body.text();
  } catch (error) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body: body2 }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/rsvp/rsvp.ffi.mjs
var from_relative_url = (url_string) => {
  if (!globalThis.location)
    return new Error(void 0);
  const url = new URL(url_string, globalThis.location.href);
  const uri = uri_from_url(url);
  return new Ok(uri);
};
var uri_from_url = (url) => {
  const optional = (value4) => value4 ? new Some(value4) : new None();
  return new Uri(
    /* scheme   */
    optional(url.protocol?.slice(0, -1)),
    /* userinfo */
    new None(),
    /* host     */
    optional(url.hostname),
    /* port     */
    optional(url.port && Number(url.port)),
    /* path     */
    url.pathname,
    /* query    */
    optional(url.search?.slice(1)),
    /* fragment */
    optional(url.hash?.slice(1))
  );
};

// build/dev/javascript/rsvp/rsvp.mjs
var BadBody = class extends CustomType {
};
var BadUrl = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var HttpError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var JsonError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NetworkError2 = class extends CustomType {
};
var UnhandledResponse = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Handler = class extends CustomType {
  constructor(run2) {
    super();
    this.run = run2;
  }
};
function expect_ok_response(handler) {
  return new Handler(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = response.status;
            if ($ >= 200 && $ < 300) {
              let code2 = $;
              return new Ok(response);
            } else if ($ >= 400 && $ < 600) {
              let code2 = $;
              return new Error(new HttpError(response));
            } else {
              return new Error(new UnhandledResponse(response));
            }
          }
        )
      );
    }
  );
}
function expect_json_response(handler) {
  return expect_ok_response(
    (result) => {
      return handler(
        try$(
          result,
          (response) => {
            let $ = get_header(response, "content-type");
            if ($.isOk() && $[0] === "application/json") {
              return new Ok(response);
            } else if ($.isOk() && $[0].startsWith("application/json;")) {
              return new Ok(response);
            } else {
              return new Error(new UnhandledResponse(response));
            }
          }
        )
      );
    }
  );
}
function do_send(request, handler) {
  return from(
    (dispatch) => {
      let _pipe = send(request);
      let _pipe$1 = try_await(_pipe, read_text_body);
      let _pipe$2 = map_promise(
        _pipe$1,
        (_capture) => {
          return map_error(
            _capture,
            (error) => {
              if (error instanceof NetworkError) {
                return new NetworkError2();
              } else if (error instanceof UnableToReadBody) {
                return new BadBody();
              } else {
                return new BadBody();
              }
            }
          );
        }
      );
      let _pipe$3 = map_promise(_pipe$2, handler.run);
      tap(_pipe$3, dispatch);
      return void 0;
    }
  );
}
function send2(request, handler) {
  return do_send(request, handler);
}
function reject(err, handler) {
  return from(
    (dispatch) => {
      let _pipe = new Error(err);
      let _pipe$1 = handler.run(_pipe);
      return dispatch(_pipe$1);
    }
  );
}
function decode_json_body(response, decoder) {
  let _pipe = response.body;
  let _pipe$1 = parse(_pipe, decoder);
  return map_error(_pipe$1, (var0) => {
    return new JsonError(var0);
  });
}
function expect_json(decoder, handler) {
  return expect_json_response(
    (result) => {
      let _pipe = result;
      let _pipe$1 = then$(
        _pipe,
        (_capture) => {
          return decode_json_body(_capture, decoder);
        }
      );
      return handler(_pipe$1);
    }
  );
}
function to_uri2(uri_string) {
  let _pipe = (() => {
    if (uri_string.startsWith("./")) {
      return from_relative_url(uri_string);
    } else if (uri_string.startsWith("/")) {
      return from_relative_url(uri_string);
    } else {
      return parse2(uri_string);
    }
  })();
  return replace_error(_pipe, new BadUrl(uri_string));
}
function post(url, body2, handler) {
  let $ = to_uri2(url);
  if ($.isOk()) {
    let uri = $[0];
    let _pipe = from_uri(uri);
    let _pipe$1 = map3(
      _pipe,
      (request) => {
        let _pipe$12 = request;
        let _pipe$22 = set_method(_pipe$12, new Post());
        let _pipe$3 = set_header(
          _pipe$22,
          "content-type",
          "application/json"
        );
        let _pipe$4 = set_body(_pipe$3, to_string2(body2));
        return send2(_pipe$4, handler);
      }
    );
    let _pipe$2 = map_error(
      _pipe$1,
      (_) => {
        return reject(new BadUrl(url), handler);
      }
    );
    return unwrap_both(_pipe$2);
  } else {
    let err = $[0];
    return reject(err, handler);
  }
}

// build/dev/javascript/childglem/auth/signin.mjs
var Auth = class extends CustomType {
  constructor(email, password, response) {
    super();
    this.email = email;
    this.password = password;
    this.response = response;
  }
};
var Init2 = class extends CustomType {
};
var EmailUpdateInput = class extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
};
var PasswordUpdateInput = class extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
};
var SendAuth = class extends CustomType {
};
var ApiAuthPost = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var SigninResponse = class extends CustomType {
  constructor(jwt_token) {
    super();
    this.jwt_token = jwt_token;
  }
};
function init2(_) {
  return [new Auth("", "", new None()), none()];
}
function decode_auth() {
  return field2(
    "jwt_token",
    string4,
    (token) => {
      return success(new SigninResponse(token));
    }
  );
}
function authorization(user) {
  let body2 = object2(
    toList([
      ["email", string5(user.email)],
      ["password", string5(user.password)]
    ])
  );
  let handler = expect_json(
    decode_auth(),
    (var0) => {
      return new ApiAuthPost(var0);
    }
  );
  return post(post_signin, body2, handler);
}
function view(model) {
  return div(
    toList([]),
    toList([
      centre2(
        toList([]),
        aside2(
          toList([
            style(
              toList([["margin-left", "300px"], ["margin-top", "50px"]])
            )
          ]),
          div(
            toList([]),
            toList([
              div(
                toList([]),
                toList([
                  (() => {
                    let $ = model.response;
                    if ($ instanceof Some) {
                      let result = $[0];
                      return div(
                        toList([]),
                        toList([text(result)])
                      );
                    } else {
                      return div(toList([]), toList([text("")]));
                    }
                  })()
                ])
              )
            ])
          ),
          aside2(
            toList([]),
            h1(
              toList([style(toList([["font-weight", "bold"]]))]),
              toList([text("Authorization form: ")])
            ),
            aside2(
              toList([
                style(
                  toList([["display", "flex"], ["flex-direction", "column"]])
                )
              ]),
              div(
                toList([]),
                toList([
                  aside2(
                    toList([]),
                    field4(
                      toList([]),
                      toList([text("Write Email: ")]),
                      input3(
                        toList([
                          value(model.email),
                          on_input(
                            (var0) => {
                              return new EmailUpdateInput(var0);
                            }
                          )
                        ])
                      ),
                      toList([])
                    ),
                    field4(
                      toList([]),
                      toList([text("Write password: ")]),
                      input3(
                        toList([
                          value(model.password),
                          on_input(
                            (var0) => {
                              return new PasswordUpdateInput(var0);
                            }
                          ),
                          type_("password")
                        ])
                      ),
                      toList([])
                    )
                  )
                ])
              ),
              button3(
                toList([on_click(new SendAuth())]),
                toList([text("Send")])
              )
            )
          )
        )
      )
    ])
  );
}
var http_200 = "success authorization";
var http_fail = "failed authorization";
function update(model, msg) {
  if (msg instanceof Init2) {
    return [model, none()];
  } else if (msg instanceof EmailUpdateInput) {
    let email = msg.value;
    return [
      (() => {
        let _record = model;
        return new Auth(email, _record.password, _record.response);
      })(),
      none()
    ];
  } else if (msg instanceof PasswordUpdateInput) {
    let password = msg.value;
    return [
      (() => {
        let _record = model;
        return new Auth(_record.email, password, _record.response);
      })(),
      none()
    ];
  } else if (msg instanceof SendAuth) {
    return [model, authorization(model)];
  } else if (msg instanceof ApiAuthPost && msg[0].isOk()) {
    let r = msg[0][0];
    let $ = save(r.jwt_token);
    if ($.isOk()) {
      reload();
      return [
        (() => {
          let _record = model;
          return new Auth(_record.email, _record.password, new Some(http_200));
        })(),
        none()
      ];
    } else {
      return [
        (() => {
          let _record = model;
          return new Auth(_record.email, _record.password, new Some(http_fail));
        })(),
        none()
      ];
    }
  } else {
    return [
      (() => {
        let _record = model;
        return new Auth(_record.email, _record.password, new Some(http_fail));
      })(),
      none()
    ];
  }
}
function app() {
  return application(init2, update, view);
}

// build/dev/javascript/childglem/auth/signup.mjs
var Auth2 = class extends CustomType {
  constructor(email, password, response) {
    super();
    this.email = email;
    this.password = password;
    this.response = response;
  }
};
var Init3 = class extends CustomType {
};
var EmailUpdateInput2 = class extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
};
var PasswordUpdateInput2 = class extends CustomType {
  constructor(value4) {
    super();
    this.value = value4;
  }
};
var CreateUser = class extends CustomType {
};
var ApiAuthPost2 = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function init3(_) {
  return [new Auth2("", "", new None()), none()];
}
function create_user(user) {
  let body2 = object2(
    toList([
      ["email", string5(user.email)],
      ["password", string5(user.password)]
    ])
  );
  let handler = expect_ok_response(
    (var0) => {
      return new ApiAuthPost2(var0);
    }
  );
  return post(post_signup, body2, handler);
}
function view2(model) {
  return div(
    toList([]),
    toList([
      centre2(
        toList([]),
        aside2(
          toList([
            style(
              toList([["margin-left", "300px"], ["margin-top", "50px"]])
            )
          ]),
          div(
            toList([]),
            toList([
              div(
                toList([]),
                toList([
                  (() => {
                    let $ = model.response;
                    if ($ instanceof Some) {
                      let text2 = $[0];
                      return div(
                        toList([]),
                        toList([text(text2)])
                      );
                    } else {
                      return div(toList([]), toList([text("")]));
                    }
                  })()
                ])
              )
            ])
          ),
          aside2(
            toList([]),
            h1(
              toList([style(toList([["font-weight", "bold"]]))]),
              toList([text("Authentication form: ")])
            ),
            aside2(
              toList([
                style(
                  toList([["display", "flex"], ["flex-direction", "column"]])
                )
              ]),
              div(
                toList([]),
                toList([
                  aside2(
                    toList([]),
                    field4(
                      toList([]),
                      toList([text("Write Email: ")]),
                      input3(
                        toList([
                          value(model.email),
                          on_input(
                            (var0) => {
                              return new EmailUpdateInput2(var0);
                            }
                          )
                        ])
                      ),
                      toList([])
                    ),
                    field4(
                      toList([]),
                      toList([text("Write password: ")]),
                      input3(
                        toList([
                          value(model.password),
                          on_input(
                            (var0) => {
                              return new PasswordUpdateInput2(var0);
                            }
                          ),
                          type_("password")
                        ])
                      ),
                      toList([])
                    )
                  )
                ])
              ),
              button3(
                toList([on_click(new CreateUser())]),
                toList([text("Send")])
              )
            )
          )
        )
      )
    ])
  );
}
var http_2002 = "success authentication";
var http_fail2 = "failed authentication";
function update2(model, msg) {
  if (msg instanceof Init3) {
    return [model, none()];
  } else if (msg instanceof EmailUpdateInput2) {
    let email = msg.value;
    return [
      (() => {
        let _record = model;
        return new Auth2(email, _record.password, _record.response);
      })(),
      none()
    ];
  } else if (msg instanceof PasswordUpdateInput2) {
    let password = msg.value;
    return [
      (() => {
        let _record = model;
        return new Auth2(_record.email, password, _record.response);
      })(),
      none()
    ];
  } else if (msg instanceof CreateUser) {
    return [model, create_user(model)];
  } else if (msg instanceof ApiAuthPost2 && msg[0].isOk()) {
    return [
      (() => {
        let _record = model;
        return new Auth2(_record.email, _record.password, new Some(http_2002));
      })(),
      none()
    ];
  } else {
    return [
      (() => {
        let _record = model;
        return new Auth2(_record.email, _record.password, new Some(http_fail2));
      })(),
      none()
    ];
  }
}
function app2() {
  return application(init3, update2, view2);
}

// build/dev/javascript/gleam_regexp/gleam_regexp_ffi.mjs
function compile(pattern, options) {
  try {
    let flags = "gu";
    if (options.case_insensitive)
      flags += "i";
    if (options.multi_line)
      flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error) {
    const number = (error.columnNumber || 0) | 0;
    return new Error(new CompileError(error.message, number));
  }
}
function split3(regex, string7) {
  return List.fromArray(
    string7.split(regex).map((item) => item === void 0 ? "" : item)
  );
}
function scan(regex, string7) {
  const matches = Array.from(string7.matchAll(regex)).map((match) => {
    const content = match[0];
    return new Match(content, submatches(match.slice(1)));
  });
  return List.fromArray(matches);
}
function submatches(groups) {
  const submatches2 = [];
  for (let n = groups.length - 1; n >= 0; n--) {
    if (groups[n]) {
      submatches2[n] = new Some(groups[n]);
      continue;
    }
    if (submatches2.length > 0) {
      submatches2[n] = new None();
    }
  }
  return List.fromArray(submatches2);
}

// build/dev/javascript/gleam_regexp/gleam/regexp.mjs
var Match = class extends CustomType {
  constructor(content, submatches2) {
    super();
    this.content = content;
    this.submatches = submatches2;
  }
};
var CompileError = class extends CustomType {
  constructor(error, byte_index) {
    super();
    this.error = error;
    this.byte_index = byte_index;
  }
};
var Options2 = class extends CustomType {
  constructor(case_insensitive, multi_line) {
    super();
    this.case_insensitive = case_insensitive;
    this.multi_line = multi_line;
  }
};
function compile2(pattern, options) {
  return compile(pattern, options);
}
function from_string(pattern) {
  return compile2(pattern, new Options2(false, false));
}
function split4(regexp, string7) {
  return split3(regexp, string7);
}
function scan2(regexp, string7) {
  return scan(regexp, string7);
}

// build/dev/javascript/gleam_stdlib/gleam/function.mjs
function identity3(x) {
  return x;
}

// build/dev/javascript/birl/birl/duration.mjs
var Duration = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var MicroSecond = class extends CustomType {
};
var MilliSecond = class extends CustomType {
};
var Second = class extends CustomType {
};
var Minute = class extends CustomType {
};
var Hour = class extends CustomType {
};
var Day = class extends CustomType {
};
var Week = class extends CustomType {
};
var Month = class extends CustomType {
};
var Year = class extends CustomType {
};
function extract(duration, unit_value) {
  return [divideInt(duration, unit_value), remainderInt(duration, unit_value)];
}
var milli_second = 1e3;
var second = 1e6;
var minute = 6e7;
var hour = 36e8;
var day = 864e8;
var week = 6048e8;
var month = 2592e9;
var year = 31536e9;
function new$3(values2) {
  let _pipe = values2;
  let _pipe$1 = fold(
    _pipe,
    0,
    (total, current) => {
      if (current[1] instanceof MicroSecond) {
        let amount = current[0];
        return total + amount;
      } else if (current[1] instanceof MilliSecond) {
        let amount = current[0];
        return total + amount * milli_second;
      } else if (current[1] instanceof Second) {
        let amount = current[0];
        return total + amount * second;
      } else if (current[1] instanceof Minute) {
        let amount = current[0];
        return total + amount * minute;
      } else if (current[1] instanceof Hour) {
        let amount = current[0];
        return total + amount * hour;
      } else if (current[1] instanceof Day) {
        let amount = current[0];
        return total + amount * day;
      } else if (current[1] instanceof Week) {
        let amount = current[0];
        return total + amount * week;
      } else if (current[1] instanceof Month) {
        let amount = current[0];
        return total + amount * month;
      } else {
        let amount = current[0];
        return total + amount * year;
      }
    }
  );
  return new Duration(_pipe$1);
}
function decompose(duration) {
  let value4 = duration[0];
  let absolute_value2 = absolute_value(value4);
  let $ = extract(absolute_value2, year);
  let years$1 = $[0];
  let remaining = $[1];
  let $1 = extract(remaining, month);
  let months$1 = $1[0];
  let remaining$1 = $1[1];
  let $2 = extract(remaining$1, week);
  let weeks$1 = $2[0];
  let remaining$2 = $2[1];
  let $3 = extract(remaining$2, day);
  let days$1 = $3[0];
  let remaining$3 = $3[1];
  let $4 = extract(remaining$3, hour);
  let hours$1 = $4[0];
  let remaining$4 = $4[1];
  let $5 = extract(remaining$4, minute);
  let minutes$1 = $5[0];
  let remaining$5 = $5[1];
  let $6 = extract(remaining$5, second);
  let seconds$1 = $6[0];
  let remaining$6 = $6[1];
  let $7 = extract(remaining$6, milli_second);
  let milli_seconds$1 = $7[0];
  let remaining$7 = $7[1];
  let _pipe = toList([
    [years$1, new Year()],
    [months$1, new Month()],
    [weeks$1, new Week()],
    [days$1, new Day()],
    [hours$1, new Hour()],
    [minutes$1, new Minute()],
    [seconds$1, new Second()],
    [milli_seconds$1, new MilliSecond()],
    [remaining$7, new MicroSecond()]
  ]);
  let _pipe$1 = filter(_pipe, (item) => {
    return item[0] > 0;
  });
  return map2(
    _pipe$1,
    (item) => {
      let $8 = value4 < 0;
      if ($8) {
        return [-1 * item[0], item[1]];
      } else {
        return item;
      }
    }
  );
}

// build/dev/javascript/birl/birl/zones.mjs
var list2 = /* @__PURE__ */ toList([
  ["Africa/Abidjan", 0],
  ["Africa/Algiers", 3600],
  ["Africa/Bissau", 0],
  ["Africa/Cairo", 7200],
  ["Africa/Casablanca", 3600],
  ["Africa/Ceuta", 3600],
  ["Africa/El_Aaiun", 3600],
  ["Africa/Johannesburg", 7200],
  ["Africa/Juba", 7200],
  ["Africa/Khartoum", 7200],
  ["Africa/Lagos", 3600],
  ["Africa/Maputo", 7200],
  ["Africa/Monrovia", 0],
  ["Africa/Nairobi", 10800],
  ["Africa/Ndjamena", 3600],
  ["Africa/Sao_Tome", 0],
  ["Africa/Tripoli", 7200],
  ["Africa/Tunis", 3600],
  ["Africa/Windhoek", 7200],
  ["America/Adak", -36e3],
  ["America/Anchorage", -32400],
  ["America/Araguaina", -10800],
  ["America/Argentina/Buenos_Aires", -10800],
  ["America/Argentina/Catamarca", -10800],
  ["America/Argentina/Cordoba", -10800],
  ["America/Argentina/Jujuy", -10800],
  ["America/Argentina/La_Rioja", -10800],
  ["America/Argentina/Mendoza", -10800],
  ["America/Argentina/Rio_Gallegos", -10800],
  ["America/Argentina/Salta", -10800],
  ["America/Argentina/San_Juan", -10800],
  ["America/Argentina/San_Luis", -10800],
  ["America/Argentina/Tucuman", -10800],
  ["America/Argentina/Ushuaia", -10800],
  ["America/Asuncion", -14400],
  ["America/Bahia", -10800],
  ["America/Bahia_Banderas", -21600],
  ["America/Barbados", -14400],
  ["America/Belem", -10800],
  ["America/Belize", -21600],
  ["America/Boa_Vista", -14400],
  ["America/Bogota", -18e3],
  ["America/Boise", -25200],
  ["America/Cambridge_Bay", -25200],
  ["America/Campo_Grande", -14400],
  ["America/Cancun", -18e3],
  ["America/Caracas", -14400],
  ["America/Cayenne", -10800],
  ["America/Chicago", -21600],
  ["America/Chihuahua", -21600],
  ["America/Ciudad_Juarez", -25200],
  ["America/Costa_Rica", -21600],
  ["America/Cuiaba", -14400],
  ["America/Danmarkshavn", 0],
  ["America/Dawson", -25200],
  ["America/Dawson_Creek", -25200],
  ["America/Denver", -25200],
  ["America/Detroit", -18e3],
  ["America/Edmonton", -25200],
  ["America/Eirunepe", -18e3],
  ["America/El_Salvador", -21600],
  ["America/Fort_Nelson", -25200],
  ["America/Fortaleza", -10800],
  ["America/Glace_Bay", -14400],
  ["America/Goose_Bay", -14400],
  ["America/Grand_Turk", -18e3],
  ["America/Guatemala", -21600],
  ["America/Guayaquil", -18e3],
  ["America/Guyana", -14400],
  ["America/Halifax", -14400],
  ["America/Havana", -18e3],
  ["America/Hermosillo", -25200],
  ["America/Indiana/Indianapolis", -18e3],
  ["America/Indiana/Knox", -21600],
  ["America/Indiana/Marengo", -18e3],
  ["America/Indiana/Petersburg", -18e3],
  ["America/Indiana/Tell_City", -21600],
  ["America/Indiana/Vevay", -18e3],
  ["America/Indiana/Vincennes", -18e3],
  ["America/Indiana/Winamac", -18e3],
  ["America/Inuvik", -25200],
  ["America/Iqaluit", -18e3],
  ["America/Jamaica", -18e3],
  ["America/Juneau", -32400],
  ["America/Kentucky/Louisville", -18e3],
  ["America/Kentucky/Monticello", -18e3],
  ["America/La_Paz", -14400],
  ["America/Lima", -18e3],
  ["America/Los_Angeles", -28800],
  ["America/Maceio", -10800],
  ["America/Managua", -21600],
  ["America/Manaus", -14400],
  ["America/Martinique", -14400],
  ["America/Matamoros", -21600],
  ["America/Mazatlan", -25200],
  ["America/Menominee", -21600],
  ["America/Merida", -21600],
  ["America/Metlakatla", -32400],
  ["America/Mexico_City", -21600],
  ["America/Miquelon", -10800],
  ["America/Moncton", -14400],
  ["America/Monterrey", -21600],
  ["America/Montevideo", -10800],
  ["America/New_York", -18e3],
  ["America/Nome", -32400],
  ["America/Noronha", -7200],
  ["America/North_Dakota/Beulah", -21600],
  ["America/North_Dakota/Center", -21600],
  ["America/North_Dakota/New_Salem", -21600],
  ["America/Nuuk", -7200],
  ["America/Ojinaga", -21600],
  ["America/Panama", -18e3],
  ["America/Paramaribo", -10800],
  ["America/Phoenix", -25200],
  ["America/Port-au-Prince", -18e3],
  ["America/Porto_Velho", -14400],
  ["America/Puerto_Rico", -14400],
  ["America/Punta_Arenas", -10800],
  ["America/Rankin_Inlet", -21600],
  ["America/Recife", -10800],
  ["America/Regina", -21600],
  ["America/Resolute", -21600],
  ["America/Rio_Branco", -18e3],
  ["America/Santarem", -10800],
  ["America/Santiago", -14400],
  ["America/Santo_Domingo", -14400],
  ["America/Sao_Paulo", -10800],
  ["America/Scoresbysund", -7200],
  ["America/Sitka", -32400],
  ["America/St_Johns", -12600],
  ["America/Swift_Current", -21600],
  ["America/Tegucigalpa", -21600],
  ["America/Thule", -14400],
  ["America/Tijuana", -28800],
  ["America/Toronto", -18e3],
  ["America/Vancouver", -28800],
  ["America/Whitehorse", -25200],
  ["America/Winnipeg", -21600],
  ["America/Yakutat", -32400],
  ["Antarctica/Casey", 28800],
  ["Antarctica/Davis", 25200],
  ["Antarctica/Macquarie", 36e3],
  ["Antarctica/Mawson", 18e3],
  ["Antarctica/Palmer", -10800],
  ["Antarctica/Rothera", -10800],
  ["Antarctica/Troll", 0],
  ["Antarctica/Vostok", 18e3],
  ["Asia/Almaty", 18e3],
  ["Asia/Amman", 10800],
  ["Asia/Anadyr", 43200],
  ["Asia/Aqtau", 18e3],
  ["Asia/Aqtobe", 18e3],
  ["Asia/Ashgabat", 18e3],
  ["Asia/Atyrau", 18e3],
  ["Asia/Baghdad", 10800],
  ["Asia/Baku", 14400],
  ["Asia/Bangkok", 25200],
  ["Asia/Barnaul", 25200],
  ["Asia/Beirut", 7200],
  ["Asia/Bishkek", 21600],
  ["Asia/Chita", 32400],
  ["Asia/Colombo", 19800],
  ["Asia/Damascus", 10800],
  ["Asia/Dhaka", 21600],
  ["Asia/Dili", 32400],
  ["Asia/Dubai", 14400],
  ["Asia/Dushanbe", 18e3],
  ["Asia/Famagusta", 7200],
  ["Asia/Gaza", 7200],
  ["Asia/Hebron", 7200],
  ["Asia/Ho_Chi_Minh", 25200],
  ["Asia/Hong_Kong", 28800],
  ["Asia/Hovd", 25200],
  ["Asia/Irkutsk", 28800],
  ["Asia/Jakarta", 25200],
  ["Asia/Jayapura", 32400],
  ["Asia/Jerusalem", 7200],
  ["Asia/Kabul", 16200],
  ["Asia/Kamchatka", 43200],
  ["Asia/Karachi", 18e3],
  ["Asia/Kathmandu", 20700],
  ["Asia/Khandyga", 32400],
  ["Asia/Kolkata", 19800],
  ["Asia/Krasnoyarsk", 25200],
  ["Asia/Kuching", 28800],
  ["Asia/Macau", 28800],
  ["Asia/Magadan", 39600],
  ["Asia/Makassar", 28800],
  ["Asia/Manila", 28800],
  ["Asia/Nicosia", 7200],
  ["Asia/Novokuznetsk", 25200],
  ["Asia/Novosibirsk", 25200],
  ["Asia/Omsk", 21600],
  ["Asia/Oral", 18e3],
  ["Asia/Pontianak", 25200],
  ["Asia/Pyongyang", 32400],
  ["Asia/Qatar", 10800],
  ["Asia/Qostanay", 18e3],
  ["Asia/Qyzylorda", 18e3],
  ["Asia/Riyadh", 10800],
  ["Asia/Sakhalin", 39600],
  ["Asia/Samarkand", 18e3],
  ["Asia/Seoul", 32400],
  ["Asia/Shanghai", 28800],
  ["Asia/Singapore", 28800],
  ["Asia/Srednekolymsk", 39600],
  ["Asia/Taipei", 28800],
  ["Asia/Tashkent", 18e3],
  ["Asia/Tbilisi", 14400],
  ["Asia/Tehran", 12600],
  ["Asia/Thimphu", 21600],
  ["Asia/Tokyo", 32400],
  ["Asia/Tomsk", 25200],
  ["Asia/Ulaanbaatar", 28800],
  ["Asia/Urumqi", 21600],
  ["Asia/Ust-Nera", 36e3],
  ["Asia/Vladivostok", 36e3],
  ["Asia/Yakutsk", 32400],
  ["Asia/Yangon", 23400],
  ["Asia/Yekaterinburg", 18e3],
  ["Asia/Yerevan", 14400],
  ["Atlantic/Azores", -3600],
  ["Atlantic/Bermuda", -14400],
  ["Atlantic/Canary", 0],
  ["Atlantic/Cape_Verde", -3600],
  ["Atlantic/Faroe", 0],
  ["Atlantic/Madeira", 0],
  ["Atlantic/South_Georgia", -7200],
  ["Atlantic/Stanley", -10800],
  ["Australia/Adelaide", 34200],
  ["Australia/Brisbane", 36e3],
  ["Australia/Broken_Hill", 34200],
  ["Australia/Darwin", 34200],
  ["Australia/Eucla", 31500],
  ["Australia/Hobart", 36e3],
  ["Australia/Lindeman", 36e3],
  ["Australia/Lord_Howe", 37800],
  ["Australia/Melbourne", 36e3],
  ["Australia/Perth", 28800],
  ["Australia/Sydney", 36e3],
  ["Etc/GMT", 0],
  ["Etc/GMT+1", -3600],
  ["Etc/GMT+10", -36e3],
  ["Etc/GMT+11", -39600],
  ["Etc/GMT+12", -43200],
  ["Etc/GMT+2", -7200],
  ["Etc/GMT+3", -10800],
  ["Etc/GMT+4", -14400],
  ["Etc/GMT+5", -18e3],
  ["Etc/GMT+6", -21600],
  ["Etc/GMT+7", -25200],
  ["Etc/GMT+8", -28800],
  ["Etc/GMT+9", -32400],
  ["Etc/GMT-1", 3600],
  ["Etc/GMT-10", 36e3],
  ["Etc/GMT-11", 39600],
  ["Etc/GMT-12", 43200],
  ["Etc/GMT-13", 46800],
  ["Etc/GMT-14", 50400],
  ["Etc/GMT-2", 7200],
  ["Etc/GMT-3", 10800],
  ["Etc/GMT-4", 14400],
  ["Etc/GMT-5", 18e3],
  ["Etc/GMT-6", 21600],
  ["Etc/GMT-7", 25200],
  ["Etc/GMT-8", 28800],
  ["Etc/GMT-9", 32400],
  ["Etc/UTC", 0],
  ["Europe/Andorra", 3600],
  ["Europe/Astrakhan", 14400],
  ["Europe/Athens", 7200],
  ["Europe/Belgrade", 3600],
  ["Europe/Berlin", 3600],
  ["Europe/Brussels", 3600],
  ["Europe/Bucharest", 7200],
  ["Europe/Budapest", 3600],
  ["Europe/Chisinau", 7200],
  ["Europe/Dublin", 3600],
  ["Europe/Gibraltar", 3600],
  ["Europe/Helsinki", 7200],
  ["Europe/Istanbul", 10800],
  ["Europe/Kaliningrad", 7200],
  ["Europe/Kirov", 10800],
  ["Europe/Kyiv", 7200],
  ["Europe/Lisbon", 0],
  ["Europe/London", 0],
  ["Europe/Madrid", 3600],
  ["Europe/Malta", 3600],
  ["Europe/Minsk", 10800],
  ["Europe/Moscow", 10800],
  ["Europe/Paris", 3600],
  ["Europe/Prague", 3600],
  ["Europe/Riga", 7200],
  ["Europe/Rome", 3600],
  ["Europe/Samara", 14400],
  ["Europe/Saratov", 14400],
  ["Europe/Simferopol", 10800],
  ["Europe/Sofia", 7200],
  ["Europe/Tallinn", 7200],
  ["Europe/Tirane", 3600],
  ["Europe/Ulyanovsk", 14400],
  ["Europe/Vienna", 3600],
  ["Europe/Vilnius", 7200],
  ["Europe/Volgograd", 10800],
  ["Europe/Warsaw", 3600],
  ["Europe/Zurich", 3600],
  ["Indian/Chagos", 21600],
  ["Indian/Maldives", 18e3],
  ["Indian/Mauritius", 14400],
  ["Pacific/Apia", 46800],
  ["Pacific/Auckland", 43200],
  ["Pacific/Bougainville", 39600],
  ["Pacific/Chatham", 45900],
  ["Pacific/Easter", -21600],
  ["Pacific/Efate", 39600],
  ["Pacific/Fakaofo", 46800],
  ["Pacific/Fiji", 43200],
  ["Pacific/Galapagos", -21600],
  ["Pacific/Gambier", -32400],
  ["Pacific/Guadalcanal", 39600],
  ["Pacific/Guam", 36e3],
  ["Pacific/Honolulu", -36e3],
  ["Pacific/Kanton", 46800],
  ["Pacific/Kiritimati", 50400],
  ["Pacific/Kosrae", 39600],
  ["Pacific/Kwajalein", 43200],
  ["Pacific/Marquesas", -34200],
  ["Pacific/Nauru", 43200],
  ["Pacific/Niue", -39600],
  ["Pacific/Norfolk", 39600],
  ["Pacific/Noumea", 39600],
  ["Pacific/Pago_Pago", -39600],
  ["Pacific/Palau", 32400],
  ["Pacific/Pitcairn", -28800],
  ["Pacific/Port_Moresby", 36e3],
  ["Pacific/Rarotonga", -36e3],
  ["Pacific/Tahiti", -36e3],
  ["Pacific/Tarawa", 43200],
  ["Pacific/Tongatapu", 46800]
]);

// build/dev/javascript/birl/birl_ffi.mjs
function now() {
  return Date.now() * 1e3;
}
function local_offset() {
  const date = /* @__PURE__ */ new Date();
  return -date.getTimezoneOffset();
}
function local_timezone() {
  return new Some(Intl.DateTimeFormat().resolvedOptions().timeZone);
}
function monotonic_now() {
  return Math.floor(globalThis.performance.now() * 1e3);
}
function to_parts(timestamp, offset) {
  const date = new Date((timestamp + offset) / 1e3);
  return [
    [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()],
    [
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds()
    ]
  ];
}
function from_parts(parts, offset) {
  const date = new Date(
    Date.UTC(
      parts[0][0],
      parts[0][1] - 1,
      parts[0][2],
      parts[1][0],
      parts[1][1],
      parts[1][2],
      parts[1][3]
    )
  );
  return date.getTime() * 1e3 - offset;
}

// build/dev/javascript/birl/birl.mjs
var Time = class extends CustomType {
  constructor(wall_time, offset, timezone, monotonic_time) {
    super();
    this.wall_time = wall_time;
    this.offset = offset;
    this.timezone = timezone;
    this.monotonic_time = monotonic_time;
  }
};
function parse_offset(offset) {
  return guard(
    contains(toList(["Z", "z"]), offset),
    new Ok(0),
    () => {
      let $ = from_string("([+-])");
      if (!$.isOk()) {
        throw makeError(
          "let_assert",
          "birl",
          1332,
          "",
          "Pattern match failed, no pattern matched the value.",
          { value: $ }
        );
      }
      let re = $[0];
      return then$(
        (() => {
          let $1 = split4(re, offset);
          if ($1.hasLength(3) && $1.head === "" && $1.tail.head === "+") {
            let offset$1 = $1.tail.tail.head;
            return new Ok([1, offset$1]);
          } else if ($1.hasLength(3) && $1.head === "" && $1.tail.head === "-") {
            let offset$1 = $1.tail.tail.head;
            return new Ok([-1, offset$1]);
          } else if ($1.hasLength(1)) {
            return new Ok([1, offset]);
          } else {
            return new Error(void 0);
          }
        })(),
        (_use0) => {
          let sign = _use0[0];
          let offset$1 = _use0[1];
          let $1 = split2(offset$1, ":");
          if ($1.hasLength(2)) {
            let hour_str = $1.head;
            let minute_str = $1.tail.head;
            return then$(
              parse_int(hour_str),
              (hour2) => {
                return then$(
                  parse_int(minute_str),
                  (minute2) => {
                    return new Ok(sign * (hour2 * 60 + minute2) * 60 * 1e6);
                  }
                );
              }
            );
          } else if ($1.hasLength(1)) {
            let offset$2 = $1.head;
            let $2 = string_length(offset$2);
            if ($2 === 1) {
              return then$(
                parse_int(offset$2),
                (hour2) => {
                  return new Ok(sign * hour2 * 3600 * 1e6);
                }
              );
            } else if ($2 === 2) {
              return then$(
                parse_int(offset$2),
                (number) => {
                  let $3 = number < 14;
                  if ($3) {
                    return new Ok(sign * number * 3600 * 1e6);
                  } else {
                    return new Ok(
                      sign * (divideInt(number, 10) * 60 + remainderInt(
                        number,
                        10
                      )) * 60 * 1e6
                    );
                  }
                }
              );
            } else if ($2 === 3) {
              let $3 = first(offset$2);
              if (!$3.isOk()) {
                throw makeError(
                  "let_assert",
                  "birl",
                  1362,
                  "",
                  "Pattern match failed, no pattern matched the value.",
                  { value: $3 }
                );
              }
              let hour_str = $3[0];
              let minute_str = slice(offset$2, 1, 2);
              return then$(
                parse_int(hour_str),
                (hour2) => {
                  return then$(
                    parse_int(minute_str),
                    (minute2) => {
                      return new Ok(
                        sign * (hour2 * 60 + minute2) * 60 * 1e6
                      );
                    }
                  );
                }
              );
            } else if ($2 === 4) {
              let hour_str = slice(offset$2, 0, 2);
              let minute_str = slice(offset$2, 2, 2);
              return then$(
                parse_int(hour_str),
                (hour2) => {
                  return then$(
                    parse_int(minute_str),
                    (minute2) => {
                      return new Ok(
                        sign * (hour2 * 60 + minute2) * 60 * 1e6
                      );
                    }
                  );
                }
              );
            } else {
              return new Error(void 0);
            }
          } else {
            return new Error(void 0);
          }
        }
      );
    }
  );
}
function generate_offset(offset) {
  return guard(
    offset === 0,
    new Ok("Z"),
    () => {
      let $ = (() => {
        let _pipe = toList([[offset, new MicroSecond()]]);
        let _pipe$1 = new$3(_pipe);
        return decompose(_pipe$1);
      })();
      if ($.hasLength(2) && $.head[1] instanceof Hour && $.tail.head[1] instanceof Minute) {
        let hour2 = $.head[0];
        let minute2 = $.tail.head[0];
        let _pipe = toList([
          (() => {
            let $1 = hour2 > 0;
            if ($1) {
              return concat2(
                toList([
                  "+",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = to_string(_pipe2);
                    return pad_start(_pipe$12, 2, "0");
                  })()
                ])
              );
            } else {
              return concat2(
                toList([
                  "-",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = absolute_value(_pipe2);
                    let _pipe$2 = to_string(_pipe$12);
                    return pad_start(_pipe$2, 2, "0");
                  })()
                ])
              );
            }
          })(),
          (() => {
            let _pipe2 = minute2;
            let _pipe$12 = absolute_value(_pipe2);
            let _pipe$2 = to_string(_pipe$12);
            return pad_start(_pipe$2, 2, "0");
          })()
        ]);
        let _pipe$1 = join(_pipe, ":");
        return new Ok(_pipe$1);
      } else if ($.hasLength(1) && $.head[1] instanceof Hour) {
        let hour2 = $.head[0];
        let _pipe = toList([
          (() => {
            let $1 = hour2 > 0;
            if ($1) {
              return concat2(
                toList([
                  "+",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = to_string(_pipe2);
                    return pad_start(_pipe$12, 2, "0");
                  })()
                ])
              );
            } else {
              return concat2(
                toList([
                  "-",
                  (() => {
                    let _pipe2 = hour2;
                    let _pipe$12 = absolute_value(_pipe2);
                    let _pipe$2 = to_string(_pipe$12);
                    return pad_start(_pipe$2, 2, "0");
                  })()
                ])
              );
            }
          })(),
          "00"
        ]);
        let _pipe$1 = join(_pipe, ":");
        return new Ok(_pipe$1);
      } else {
        return new Error(void 0);
      }
    }
  );
}
function is_invalid_date(date) {
  let _pipe = date;
  let _pipe$1 = to_utf_codepoints(_pipe);
  let _pipe$2 = map2(_pipe$1, utf_codepoint_to_int);
  return any(
    _pipe$2,
    (code2) => {
      if (code2 === 45) {
        return false;
      } else if (code2 >= 48 && code2 <= 57) {
        return false;
      } else {
        return true;
      }
    }
  );
}
function is_invalid_time(time) {
  let _pipe = time;
  let _pipe$1 = to_utf_codepoints(_pipe);
  let _pipe$2 = map2(_pipe$1, utf_codepoint_to_int);
  return any(
    _pipe$2,
    (code2) => {
      if (code2 >= 48 && code2 <= 58) {
        return false;
      } else {
        return true;
      }
    }
  );
}
function parse_section(section, pattern_string, default$) {
  let $ = from_string(pattern_string);
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      1527,
      "parse_section",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let pattern = $[0];
  let $1 = scan2(pattern, section);
  if ($1.hasLength(1) && $1.head instanceof Match && $1.head.submatches.hasLength(1) && $1.head.submatches.head instanceof Some) {
    let major = $1.head.submatches.head[0];
    return toList([parse_int(major), new Ok(default$), new Ok(default$)]);
  } else if ($1.hasLength(1) && $1.head instanceof Match && $1.head.submatches.hasLength(2) && $1.head.submatches.head instanceof Some && $1.head.submatches.tail.head instanceof Some) {
    let major = $1.head.submatches.head[0];
    let middle = $1.head.submatches.tail.head[0];
    return toList([parse_int(major), parse_int(middle), new Ok(default$)]);
  } else if ($1.hasLength(1) && $1.head instanceof Match && $1.head.submatches.hasLength(3) && $1.head.submatches.head instanceof Some && $1.head.submatches.tail.head instanceof Some && $1.head.submatches.tail.tail.head instanceof Some) {
    let major = $1.head.submatches.head[0];
    let middle = $1.head.submatches.tail.head[0];
    let minor = $1.head.submatches.tail.tail.head[0];
    return toList([parse_int(major), parse_int(middle), parse_int(minor)]);
  } else {
    return toList([new Error(void 0)]);
  }
}
function parse_date_section(date) {
  return guard(
    is_invalid_date(date),
    new Error(void 0),
    () => {
      let _pipe = (() => {
        let $ = contains_string(date, "-");
        if ($) {
          let $1 = from_string(
            "(\\d{4})(?:-(1[0-2]|0?[0-9]))?(?:-(3[0-1]|[1-2][0-9]|0?[0-9]))?"
          );
          if (!$1.isOk()) {
            throw makeError(
              "let_assert",
              "birl",
              1447,
              "",
              "Pattern match failed, no pattern matched the value.",
              { value: $1 }
            );
          }
          let dash_pattern = $1[0];
          let $2 = scan2(dash_pattern, date);
          if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(1) && $2.head.submatches.head instanceof Some) {
            let major = $2.head.submatches.head[0];
            return toList([parse_int(major), new Ok(1), new Ok(1)]);
          } else if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(2) && $2.head.submatches.head instanceof Some && $2.head.submatches.tail.head instanceof Some) {
            let major = $2.head.submatches.head[0];
            let middle = $2.head.submatches.tail.head[0];
            return toList([parse_int(major), parse_int(middle), new Ok(1)]);
          } else if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(3) && $2.head.submatches.head instanceof Some && $2.head.submatches.tail.head instanceof Some && $2.head.submatches.tail.tail.head instanceof Some) {
            let major = $2.head.submatches.head[0];
            let middle = $2.head.submatches.tail.head[0];
            let minor = $2.head.submatches.tail.tail.head[0];
            return toList([
              parse_int(major),
              parse_int(middle),
              parse_int(minor)
            ]);
          } else {
            return toList([new Error(void 0)]);
          }
        } else {
          return parse_section(
            date,
            "(\\d{4})(1[0-2]|0?[0-9])?(3[0-1]|[1-2][0-9]|0?[0-9])?",
            1
          );
        }
      })();
      return try_map(_pipe, identity3);
    }
  );
}
function parse_time_section(time) {
  return guard(
    is_invalid_time(time),
    new Error(void 0),
    () => {
      let _pipe = parse_section(
        time,
        "(2[0-3]|1[0-9]|0?[0-9])([1-5][0-9]|0?[0-9])?([1-5][0-9]|0?[0-9])?",
        0
      );
      return try_map(_pipe, identity3);
    }
  );
}
function to_parts2(value4) {
  {
    let t = value4.wall_time;
    let o = value4.offset;
    let $ = to_parts(t, o);
    let date = $[0];
    let time = $[1];
    let $1 = generate_offset(o);
    if (!$1.isOk()) {
      throw makeError(
        "let_assert",
        "birl",
        1324,
        "to_parts",
        "Pattern match failed, no pattern matched the value.",
        { value: $1 }
      );
    }
    let offset = $1[0];
    return [date, time, offset];
  }
}
function to_date_string(value4) {
  let $ = to_parts2(value4);
  let year2 = $[0][0];
  let month$1 = $[0][1];
  let day2 = $[0][2];
  let offset = $[2];
  return to_string(year2) + "-" + (() => {
    let _pipe = month$1;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 2, "0");
  })() + "-" + (() => {
    let _pipe = day2;
    let _pipe$1 = to_string(_pipe);
    return pad_start(_pipe$1, 2, "0");
  })() + offset;
}
function from_parts2(date, time, offset) {
  return then$(
    parse_offset(offset),
    (offset_number) => {
      let _pipe = from_parts([date, time], offset_number);
      let _pipe$1 = new Time(
        _pipe,
        offset_number,
        new None(),
        new None()
      );
      return new Ok(_pipe$1);
    }
  );
}
function parse4(value4) {
  let $ = from_string("(.*)([+|\\-].*)");
  if (!$.isOk()) {
    throw makeError(
      "let_assert",
      "birl",
      298,
      "parse",
      "Pattern match failed, no pattern matched the value.",
      { value: $ }
    );
  }
  let offset_pattern = $[0];
  let value$1 = trim(value4);
  return then$(
    (() => {
      let $1 = split2(value$1, "T");
      let $2 = split2(value$1, "t");
      let $3 = split2(value$1, " ");
      if ($1.hasLength(2)) {
        let day_string = $1.head;
        let time_string = $1.tail.head;
        return new Ok([day_string, time_string]);
      } else if ($2.hasLength(2)) {
        let day_string = $2.head;
        let time_string = $2.tail.head;
        return new Ok([day_string, time_string]);
      } else if ($3.hasLength(2)) {
        let day_string = $3.head;
        let time_string = $3.tail.head;
        return new Ok([day_string, time_string]);
      } else if ($1.hasLength(1) && $2.hasLength(1) && $3.hasLength(1)) {
        return new Ok([value$1, "00"]);
      } else {
        return new Error(void 0);
      }
    })(),
    (_use0) => {
      let day_string = _use0[0];
      let offsetted_time_string = _use0[1];
      let day_string$1 = trim(day_string);
      let offsetted_time_string$1 = trim(offsetted_time_string);
      return then$(
        (() => {
          let $1 = ends_with(offsetted_time_string$1, "Z") || ends_with(
            offsetted_time_string$1,
            "z"
          );
          if ($1) {
            return new Ok(
              [
                day_string$1,
                drop_end(offsetted_time_string$1, 1),
                "+00:00"
              ]
            );
          } else {
            let $2 = scan2(offset_pattern, offsetted_time_string$1);
            if ($2.hasLength(1) && $2.head instanceof Match && $2.head.submatches.hasLength(2) && $2.head.submatches.head instanceof Some && $2.head.submatches.tail.head instanceof Some) {
              let time_string = $2.head.submatches.head[0];
              let offset_string = $2.head.submatches.tail.head[0];
              return new Ok([day_string$1, time_string, offset_string]);
            } else {
              let $3 = scan2(offset_pattern, day_string$1);
              if ($3.hasLength(1) && $3.head instanceof Match && $3.head.submatches.hasLength(2) && $3.head.submatches.head instanceof Some && $3.head.submatches.tail.head instanceof Some) {
                let day_string$2 = $3.head.submatches.head[0];
                let offset_string = $3.head.submatches.tail.head[0];
                return new Ok([day_string$2, "00", offset_string]);
              } else {
                return new Error(void 0);
              }
            }
          }
        })(),
        (_use02) => {
          let day_string$2 = _use02[0];
          let time_string = _use02[1];
          let offset_string = _use02[2];
          let time_string$1 = replace(time_string, ":", "");
          return then$(
            (() => {
              let $1 = split2(time_string$1, ".");
              let $2 = split2(time_string$1, ",");
              if ($1.hasLength(1) && $2.hasLength(1)) {
                return new Ok([time_string$1, new Ok(0)]);
              } else if ($1.hasLength(2) && $2.hasLength(1)) {
                let time_string$2 = $1.head;
                let milli_seconds_string = $1.tail.head;
                return new Ok(
                  [
                    time_string$2,
                    (() => {
                      let _pipe = milli_seconds_string;
                      let _pipe$1 = slice(_pipe, 0, 3);
                      let _pipe$2 = pad_end(_pipe$1, 3, "0");
                      return parse_int(_pipe$2);
                    })()
                  ]
                );
              } else if ($1.hasLength(1) && $2.hasLength(2)) {
                let time_string$2 = $2.head;
                let milli_seconds_string = $2.tail.head;
                return new Ok(
                  [
                    time_string$2,
                    (() => {
                      let _pipe = milli_seconds_string;
                      let _pipe$1 = slice(_pipe, 0, 3);
                      let _pipe$2 = pad_end(_pipe$1, 3, "0");
                      return parse_int(_pipe$2);
                    })()
                  ]
                );
              } else {
                return new Error(void 0);
              }
            })(),
            (_use03) => {
              let time_string$2 = _use03[0];
              let milli_seconds_result = _use03[1];
              if (milli_seconds_result.isOk()) {
                let milli_seconds = milli_seconds_result[0];
                return then$(
                  parse_date_section(day_string$2),
                  (day2) => {
                    if (!day2.hasLength(3)) {
                      throw makeError(
                        "let_assert",
                        "birl",
                        370,
                        "",
                        "Pattern match failed, no pattern matched the value.",
                        { value: day2 }
                      );
                    }
                    let year2 = day2.head;
                    let month$1 = day2.tail.head;
                    let date = day2.tail.tail.head;
                    return then$(
                      parse_time_section(time_string$2),
                      (time_of_day) => {
                        if (!time_of_day.hasLength(3)) {
                          throw makeError(
                            "let_assert",
                            "birl",
                            373,
                            "",
                            "Pattern match failed, no pattern matched the value.",
                            { value: time_of_day }
                          );
                        }
                        let hour2 = time_of_day.head;
                        let minute2 = time_of_day.tail.head;
                        let second2 = time_of_day.tail.tail.head;
                        return from_parts2(
                          [year2, month$1, date],
                          [hour2, minute2, second2, milli_seconds],
                          offset_string
                        );
                      }
                    );
                  }
                );
              } else {
                return new Error(void 0);
              }
            }
          );
        }
      );
    }
  );
}
function now2() {
  let now$1 = now();
  let offset_in_minutes = local_offset();
  let monotonic_now$1 = monotonic_now();
  let timezone = local_timezone();
  return new Time(
    now$1,
    offset_in_minutes * 6e7,
    (() => {
      let _pipe = map(
        timezone,
        (tz) => {
          let $ = any(list2, (item) => {
            return item[0] === tz;
          });
          if ($) {
            return new Some(tz);
          } else {
            return new None();
          }
        }
      );
      return flatten(_pipe);
    })(),
    new Some(monotonic_now$1)
  );
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function debug(term) {
  let _pipe = term;
  let _pipe$1 = inspect2(_pipe);
  print_debug(_pipe$1);
  return term;
}

// build/dev/javascript/toy/toy_ffi.mjs
var NOTHING = Symbol.for("nothing");
function index5(data, key3) {
  const int6 = Number.isInteger(key3);
  if (data instanceof Dict || data instanceof WeakMap || data instanceof Map) {
    const entry = data.get(key3, NOTHING);
    if (entry != NOTHING) {
      return new Ok(new Some(entry));
    } else {
      return new Ok(new None());
    }
  }
  if (int6 && Array.isArray(data) || data && typeof data === "object" || data && Object.getPrototypeOf(data) === Object.prototype) {
    return new Ok(new Some(data[key3]));
  }
  return new Error(int6 ? "Indexable" : "Dict");
}

// build/dev/javascript/toy/toy.mjs
var Decoder2 = class extends CustomType {
  constructor(run2) {
    super();
    this.run = run2;
  }
};
var ToyError = class extends CustomType {
  constructor(error, path) {
    super();
    this.error = error;
    this.path = path;
  }
};
var InvalidType = class extends CustomType {
  constructor(expected, found) {
    super();
    this.expected = expected;
    this.found = found;
  }
};
var Missing = class extends CustomType {
  constructor(expected) {
    super();
    this.expected = expected;
  }
};
var ValidationFailed = class extends CustomType {
  constructor(check2, expected, found) {
    super();
    this.check = check2;
    this.expected = expected;
    this.found = found;
  }
};
function decoded(value4) {
  return new Decoder2((_) => {
    return [value4, new Ok(value4)];
  });
}
function do_try_map_with_index(loop$list, loop$index, loop$fun, loop$acc) {
  while (true) {
    let list4 = loop$list;
    let index6 = loop$index;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list4.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let x = list4.head;
      let xs = list4.tail;
      let $ = fun(index6, x);
      if ($.isOk()) {
        let y = $[0];
        loop$list = xs;
        loop$index = index6 + 1;
        loop$fun = fun;
        loop$acc = prepend(y, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map_with_index(value4, fun) {
  return do_try_map_with_index(value4, 0, fun, toList([]));
}
function list_nonempty(dec) {
  return new Decoder2(
    (data) => {
      let $ = dec.run(data);
      if ($[1].isOk()) {
        let default$ = $[0];
        let data$1 = $[1][0];
        if (data$1.atLeastLength(1)) {
          return [default$, new Ok(data$1)];
        } else {
          return [
            default$,
            new Error(
              toList([
                new ToyError(
                  new ValidationFailed("list_nonempty", "non_empty", "[]"),
                  toList([])
                )
              ])
            )
          ];
        }
      } else {
        let with_decode_error = $;
        return with_decode_error;
      }
    }
  );
}
function try_map2(dec, default$, fun) {
  return new Decoder2(
    (data) => {
      let $ = dec.run(data);
      if ($[1].isOk()) {
        let data$1 = $[1][0];
        let $1 = fun(data$1);
        if ($1.isOk()) {
          let new_value = $1[0];
          return [default$, new Ok(new_value)];
        } else {
          let errors = $1[0];
          return [default$, new Error(errors)];
        }
      } else {
        let errors = $[1][0];
        return [default$, new Error(errors)];
      }
    }
  );
}
function decode_string3(data) {
  return [
    "",
    (() => {
      let _pipe = string2(data);
      return map_error(_pipe, from_stdlib_errors);
    })()
  ];
}
function from_stdlib_errors(errors) {
  return map2(
    errors,
    (err) => {
      return new ToyError(new InvalidType(err.expected, err.found), err.path);
    }
  );
}
function list3(item) {
  return new Decoder2(
    (data) => {
      let $ = shallow_list(data);
      if ($.isOk()) {
        let value4 = $[0];
        let result = try_map_with_index(
          value4,
          (index6, val) => {
            let $1 = item.run(val);
            if ($1[1].isOk()) {
              let it = $1[1][0];
              return new Ok(it);
            } else {
              let errors = $1[1][0];
              return new Error(
                (() => {
                  let _pipe = errors;
                  return prepend_path(_pipe, toList([inspect2(index6)]));
                })()
              );
            }
          }
        );
        return [toList([]), result];
      } else {
        let errors = $[0];
        return [toList([]), new Error(from_stdlib_errors(errors))];
      }
    }
  );
}
var string6 = /* @__PURE__ */ new Decoder2(decode_string3);
function prepend_path(errors, path) {
  return map2(
    errors,
    (err) => {
      let _record = err;
      return new ToyError(_record.error, append3(path, err.path));
    }
  );
}
function decode3(data, decoder) {
  let _pipe = decoder.run(data)[1];
  return map_error(_pipe, reverse);
}
function field5(key3, decoder, next) {
  return new Decoder2(
    (data) => {
      let $ = index5(data, key3);
      if ($.isOk() && $[0] instanceof Some) {
        let value4 = $[0][0];
        let $1 = decoder.run(value4);
        if ($1[1].isOk()) {
          let value$1 = $1[1][0];
          return next(value$1).run(data);
        } else {
          let default$ = $1[0];
          let errors = $1[1][0];
          let $2 = next(default$).run(data);
          let next_default = $2[0];
          let result = $2[1];
          let errors$1 = prepend_path(errors, toList([inspect2(key3)]));
          let new_result = (() => {
            if (result.isOk()) {
              return new Error(errors$1);
            } else {
              let next_errors = result[0];
              return new Error(append3(next_errors, errors$1));
            }
          })();
          return [next_default, new_result];
        }
      } else if ($.isOk() && $[0] instanceof None) {
        let $1 = decoder.run(identity(void 0));
        let default$ = $1[0];
        let err = new ToyError(
          new Missing(classify_dynamic(identity(default$))),
          toList([inspect2(key3)])
        );
        let $2 = next(default$).run(identity(data));
        let next_default = $2[0];
        let result = $2[1];
        let new_result = (() => {
          if (result.isOk()) {
            return new Error(toList([err]));
          } else {
            let next_errors = result[0];
            return new Error(prepend(err, next_errors));
          }
        })();
        return [next_default, new_result];
      } else {
        let expected = $[0];
        let $1 = decoder.run(identity(void 0));
        let default$ = $1[0];
        let err = new ToyError(
          new InvalidType(expected, classify_dynamic(identity(data))),
          toList([inspect2(key3)])
        );
        let $2 = next(default$).run(identity(data));
        let next_default = $2[0];
        let result = $2[1];
        let new_result = (() => {
          if (result.isOk()) {
            return new Error(toList([err]));
          } else {
            let next_errors = result[0];
            return new Error(prepend(err, next_errors));
          }
        })();
        return [next_default, new_result];
      }
    }
  );
}
function decode_int3(data) {
  return [
    0,
    (() => {
      let _pipe = int(data);
      return map_error(_pipe, from_stdlib_errors);
    })()
  ];
}
var int5 = /* @__PURE__ */ new Decoder2(decode_int3);

// build/dev/javascript/childglem/table/table.mjs
var Reservation = class extends CustomType {
  constructor(childs, token, total, limit, page) {
    super();
    this.childs = childs;
    this.token = token;
    this.total = total;
    this.limit = limit;
    this.page = page;
  }
};
var Child = class extends CustomType {
  constructor(name, age, birthday) {
    super();
    this.name = name;
    this.age = age;
    this.birthday = birthday;
  }
};
var ApiReturnedChilds = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ApiNextChilds = class extends CustomType {
};
var ApiPreviousChilds = class extends CustomType {
};
function fetch_childs(api_token, page) {
  debug(api_token);
  let $ = parse2(get_childs);
  if ($.isOk()) {
    let uri = $[0];
    let $1 = from_uri(uri);
    if ($1.isOk()) {
      let req = $1[0];
      let request = (() => {
        let _pipe = req;
        let _pipe$1 = set_header(
          _pipe,
          "authorization",
          "Bearer " + api_token
        );
        return set_query(
          _pipe$1,
          toList([["page", to_string(page)]])
        );
      })();
      let handler = expect_ok_response(
        (var0) => {
          return new ApiReturnedChilds(var0);
        }
      );
      return send2(request, handler);
    } else {
      return none();
    }
  } else {
    return none();
  }
}
function init4(_) {
  let token = unwrap2(fetch2(), "");
  let page = 1;
  let f = fetch_childs(token, page);
  return [new Reservation(toList([]), token, 0, 10, page), f];
}
function time_decoder() {
  let _pipe = string6;
  return try_map2(
    _pipe,
    now2(),
    (val) => {
      let _pipe$1 = parse4(val);
      return replace_error(
        _pipe$1,
        toList([
          new ToyError(new InvalidType("DateTime", val), toList([]))
        ])
      );
    }
  );
}
function decode_childs(model) {
  return field5(
    "data",
    (() => {
      let _pipe = list3(
        field5(
          "name",
          string6,
          (name) => {
            return field5(
              "age",
              int5,
              (age) => {
                return field5(
                  "birthday",
                  time_decoder(),
                  (birthday) => {
                    return decoded(new Child(name, age, birthday));
                  }
                );
              }
            );
          }
        )
      );
      return list_nonempty(_pipe);
    })(),
    (childs) => {
      return field5(
        "total",
        int5,
        (total) => {
          return field5(
            "limit",
            int5,
            (limit) => {
              return field5(
                "page",
                int5,
                (page) => {
                  return decoded(
                    (() => {
                      let _record = model;
                      return new Reservation(
                        childs,
                        _record.token,
                        total,
                        limit,
                        page
                      );
                    })()
                  );
                }
              );
            }
          );
        }
      );
    }
  );
}
function update3(model, msg) {
  if (msg instanceof ApiReturnedChilds && msg[0].isOk()) {
    let resp = msg[0][0];
    let $ = decode2(resp.body, dynamic);
    if (!$.isOk()) {
      throw makeError(
        "let_assert",
        "table/table",
        65,
        "update",
        "Pattern match failed, no pattern matched the value.",
        { value: $ }
      );
    }
    let data = $[0];
    let decoded_data = decode3(data, decode_childs(model));
    if (decoded_data.isOk()) {
      let reserv = decoded_data[0];
      return [reserv, none()];
    } else {
      return [model, none()];
    }
  } else if (msg instanceof ApiNextChilds) {
    let $ = length2(model.childs) < model.limit;
    if ($) {
      return [model, none()];
    } else {
      return [model, fetch_childs(model.token, model.page + 1)];
    }
  } else if (msg instanceof ApiPreviousChilds) {
    let $ = model.page <= 1;
    if ($) {
      return [model, none()];
    } else {
      return [model, fetch_childs(model.token, model.page - 1)];
    }
  } else {
    return [model, none()];
  }
}
function view3(model) {
  let total = to_string(model.total);
  let limit = to_string(model.limit);
  let page = to_string(model.page);
  let table_style = toList([
    ["width", "100%"],
    ["margin-bottom", "20px"],
    ["border", "15px solid #F2F8F8"],
    ["border-top", "5px solid #F2F8F8"],
    ["border-collapse", "collapse"]
  ]);
  let table_th_style = toList([
    ["font-weight", "bold"],
    ["padding", "5px"],
    ["border", "none"],
    ["background", "#F2F8F8"],
    ["border-bottom", "5px solid #F2F8F8"],
    ["text-align", "left"]
  ]);
  let table_td_style = toList([
    ["padding", "5px"],
    ["border-bottom", "5px solid #F2F8F8"],
    ["border", "none"]
  ]);
  let info_style = toList([
    ["display", "flex"],
    ["gap", "5px"],
    ["margin-bottom", "10px"]
  ]);
  return div(
    toList([]),
    toList([
      div(
        toList([style(info_style)]),
        toList([
          span(toList([]), toList([text("Info: ")])),
          div(
            toList([
              style(toList([["display", "flex"], ["gap", "10px"]]))
            ]),
            toList([
              span(
                toList([]),
                toList([text("Total childs: " + total)])
              ),
              span(
                toList([]),
                toList([text("Limit rows: " + limit)])
              ),
              span(
                toList([]),
                toList([text("Page number: " + page)])
              )
            ])
          )
        ])
      ),
      table(
        toList([style(table_style)]),
        toList([
          tr(
            toList([]),
            toList([
              th(
                toList([style(table_th_style)]),
                toList([text("full name")])
              ),
              th(
                toList([style(table_th_style)]),
                toList([text("age")])
              ),
              th(
                toList([style(table_th_style)]),
                toList([text("birthday")])
              )
            ])
          ),
          tbody(
            toList([]),
            map2(
              model.childs,
              (child) => {
                return tr(
                  toList([]),
                  toList([
                    td(
                      toList([style(table_td_style)]),
                      toList([text(child.name)])
                    ),
                    td(
                      toList([style(table_td_style)]),
                      toList([text(to_string(child.age))])
                    ),
                    td(
                      toList([style(table_td_style)]),
                      toList([
                        text(to_date_string(child.birthday))
                      ])
                    )
                  ])
                );
              }
            )
          )
        ])
      ),
      div(
        toList([
          style(toList([["display", "flex"], ["gap", "10px"]]))
        ]),
        toList([
          button3(
            toList([on_click(new ApiPreviousChilds())]),
            toList([text("<")])
          ),
          button3(
            toList([on_click(new ApiNextChilds())]),
            toList([text(">")])
          )
        ])
      )
    ])
  );
}
function app3() {
  return application(init4, update3, view3);
}

// build/dev/javascript/childglem/childglem.mjs
var Router = class extends CustomType {
  constructor(page) {
    super();
    this.page = page;
  }
};
var AuthSignup = class extends CustomType {
};
var AuthSignin = class extends CustomType {
};
var AuthLogout = class extends CustomType {
};
function init5(_) {
  return [new Router(new AuthSignup()), none()];
}
function update4(_, msg) {
  if (msg instanceof AuthSignup) {
    return [new Router(new AuthSignup()), none()];
  } else if (msg instanceof AuthSignin) {
    return [new Router(new AuthSignin()), none()];
  } else {
    let $ = delete$2();
    return [new Router(new AuthSignin()), none()];
  }
}
function view4(router) {
  let button_style = toList([
    ["display", "flex"],
    ["gap", "10px"],
    ["justify-content", "end"],
    ["margin", "15px"]
  ]);
  let container_style = toList([["width", "80%"], ["margin", "auto"]]);
  let token = unwrap2(fetch2(), "");
  return div(
    toList([style(container_style)]),
    toList([
      div(
        toList([]),
        toList([
          (() => {
            let $ = string_length(token) <= 1;
            if ($) {
              return div(
                toList([style(button_style)]),
                toList([
                  button3(
                    toList([
                      greyscale(),
                      on_click(new AuthSignup())
                    ]),
                    toList([text("signup")])
                  ),
                  button3(
                    toList([
                      greyscale(),
                      on_click(new AuthSignin())
                    ]),
                    toList([text("signin")])
                  )
                ])
              );
            } else {
              return div(
                toList([style(button_style)]),
                toList([
                  button3(
                    toList([
                      primary(),
                      on_click(new AuthLogout())
                    ]),
                    toList([text("logout")])
                  )
                ])
              );
            }
          })(),
          (() => {
            let $ = string_length(token) <= 1;
            if ($) {
              let $1 = router.page;
              if ($1 instanceof AuthSignup) {
                return div(
                  toList([]),
                  toList([element("my-signup", toList([]), toList([]))])
                );
              } else if ($1 instanceof AuthSignin) {
                return div(
                  toList([]),
                  toList([element("my-signin", toList([]), toList([]))])
                );
              } else {
                return div(
                  toList([]),
                  toList([element("my-signin", toList([]), toList([]))])
                );
              }
            } else {
              return div(
                toList([]),
                toList([element("my-table", toList([]), toList([]))])
              );
            }
          })()
        ])
      )
    ])
  );
}
function main() {
  let $ = make_lustre_client_component(app2(), "my-signup");
  let $1 = make_lustre_client_component(app(), "my-signin");
  let $2 = make_lustre_client_component(app3(), "my-table");
  let app4 = application(init5, update4, view4);
  let $3 = start2(app4, "#app", 0);
  if (!$3.isOk()) {
    throw makeError(
      "let_assert",
      "childglem",
      35,
      "main",
      "Pattern match failed, no pattern matched the value.",
      { value: $3 }
    );
  }
  return $3;
}

// build/.lustre/entry.mjs
main();
