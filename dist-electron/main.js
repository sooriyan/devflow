import { BrowserWindow as e, app as t, dialog as n, ipcMain as r, safeStorage as i } from "electron";
import a from "path";
import o from "fs/promises";
import { existsSync as s, mkdirSync as c } from "fs";
import { fileURLToPath as l } from "url";
import { exec as u, execSync as d } from "child_process";
//#region \0rolldown/runtime.js
var f = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports);
//#endregion
//#region node_modules/universal-user-agent/index.js
function p() {
	return typeof navigator == "object" && "userAgent" in navigator ? navigator.userAgent : typeof process == "object" && process.version !== void 0 ? `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})` : "<environment undetectable>";
}
//#endregion
//#region node_modules/before-after-hook/lib/register.js
function m(e, t, n, r) {
	if (typeof n != "function") throw Error("method for before hook must be a function");
	return r ||= {}, Array.isArray(t) ? t.reverse().reduce((t, n) => m.bind(null, e, n, t, r), n)() : Promise.resolve().then(() => e.registry[t] ? e.registry[t].reduce((e, t) => t.hook.bind(null, e, r), n)() : n(r));
}
//#endregion
//#region node_modules/before-after-hook/lib/add.js
function h(e, t, n, r) {
	let i = r;
	e.registry[n] || (e.registry[n] = []), t === "before" && (r = (e, t) => Promise.resolve().then(i.bind(null, t)).then(e.bind(null, t))), t === "after" && (r = (e, t) => {
		let n;
		return Promise.resolve().then(e.bind(null, t)).then((e) => (n = e, i(n, t))).then(() => n);
	}), t === "error" && (r = (e, t) => Promise.resolve().then(e.bind(null, t)).catch((e) => i(e, t))), e.registry[n].push({
		hook: r,
		orig: i
	});
}
//#endregion
//#region node_modules/before-after-hook/lib/remove.js
function g(e, t, n) {
	if (!e.registry[t]) return;
	let r = e.registry[t].map((e) => e.orig).indexOf(n);
	r !== -1 && e.registry[t].splice(r, 1);
}
//#endregion
//#region node_modules/before-after-hook/index.js
var ee = Function.bind, te = ee.bind(ee);
function ne(e, t, n) {
	let r = te(g, null).apply(null, n ? [t, n] : [t]);
	e.api = { remove: r }, e.remove = r, [
		"before",
		"error",
		"after",
		"wrap"
	].forEach((r) => {
		let i = n ? [
			t,
			r,
			n
		] : [t, r];
		e[r] = e.api[r] = te(h, null).apply(null, i);
	});
}
function re() {
	let e = Symbol("Singular"), t = { registry: {} }, n = m.bind(null, t, e);
	return ne(n, t, e), n;
}
function ie() {
	let e = { registry: {} }, t = m.bind(null, e);
	return ne(t, e), t;
}
var ae = {
	Singular: re,
	Collection: ie
}, oe = {
	method: "GET",
	baseUrl: "https://api.github.com",
	headers: {
		accept: "application/vnd.github.v3+json",
		"user-agent": `octokit-endpoint.js/0.0.0-development ${p()}`
	},
	mediaType: { format: "" }
};
function se(e) {
	return e ? Object.keys(e).reduce((t, n) => (t[n.toLowerCase()] = e[n], t), {}) : {};
}
function ce(e) {
	if (typeof e != "object" || !e || Object.prototype.toString.call(e) !== "[object Object]") return !1;
	let t = Object.getPrototypeOf(e);
	if (t === null) return !0;
	let n = Object.prototype.hasOwnProperty.call(t, "constructor") && t.constructor;
	return typeof n == "function" && n instanceof n && Function.prototype.call(n) === Function.prototype.call(e);
}
function _(e, t) {
	let n = Object.assign({}, e);
	return Object.keys(t).forEach((r) => {
		ce(t[r]) && r in e ? n[r] = _(e[r], t[r]) : Object.assign(n, { [r]: t[r] });
	}), n;
}
function v(e) {
	for (let t in e) e[t] === void 0 && delete e[t];
	return e;
}
function y(e, t, n) {
	if (typeof t == "string") {
		let [e, r] = t.split(" ");
		n = Object.assign(r ? {
			method: e,
			url: r
		} : { url: e }, n);
	} else n = Object.assign({}, t);
	n.headers = se(n.headers), v(n), v(n.headers);
	let r = _(e || {}, n);
	return n.url === "/graphql" && (e && e.mediaType.previews?.length && (r.mediaType.previews = e.mediaType.previews.filter((e) => !r.mediaType.previews.includes(e)).concat(r.mediaType.previews)), r.mediaType.previews = (r.mediaType.previews || []).map((e) => e.replace(/-preview/, ""))), r;
}
function le(e, t) {
	let n = /\?/.test(e) ? "&" : "?", r = Object.keys(t);
	return r.length === 0 ? e : e + n + r.map((e) => e === "q" ? "q=" + t.q.split("+").map(encodeURIComponent).join("+") : `${e}=${encodeURIComponent(t[e])}`).join("&");
}
var ue = /\{[^{}}]+\}/g;
function de(e) {
	return e.replace(/(?:^\W+)|(?:(?<!\W)\W+$)/g, "").split(/,/);
}
function fe(e) {
	let t = e.match(ue);
	return t ? t.map(de).reduce((e, t) => e.concat(t), []) : [];
}
function pe(e, t) {
	let n = { __proto__: null };
	for (let r of Object.keys(e)) t.indexOf(r) === -1 && (n[r] = e[r]);
	return n;
}
function me(e) {
	return e.split(/(%[0-9A-Fa-f]{2})/g).map(function(e) {
		return /%[0-9A-Fa-f]/.test(e) || (e = encodeURI(e).replace(/%5B/g, "[").replace(/%5D/g, "]")), e;
	}).join("");
}
function b(e) {
	return encodeURIComponent(e).replace(/[!'()*]/g, function(e) {
		return "%" + e.charCodeAt(0).toString(16).toUpperCase();
	});
}
function x(e, t, n) {
	return t = e === "+" || e === "#" ? me(t) : b(t), n ? b(n) + "=" + t : t;
}
function S(e) {
	return e != null;
}
function C(e) {
	return e === ";" || e === "&" || e === "?";
}
function he(e, t, n, r) {
	var i = e[n], a = [];
	if (S(i) && i !== "") if (typeof i == "string" || typeof i == "number" || typeof i == "bigint" || typeof i == "boolean") i = i.toString(), r && r !== "*" && (i = i.substring(0, parseInt(r, 10))), a.push(x(t, i, C(t) ? n : ""));
	else if (r === "*") Array.isArray(i) ? i.filter(S).forEach(function(e) {
		a.push(x(t, e, C(t) ? n : ""));
	}) : Object.keys(i).forEach(function(e) {
		S(i[e]) && a.push(x(t, i[e], e));
	});
	else {
		let e = [];
		Array.isArray(i) ? i.filter(S).forEach(function(n) {
			e.push(x(t, n));
		}) : Object.keys(i).forEach(function(n) {
			S(i[n]) && (e.push(b(n)), e.push(x(t, i[n].toString())));
		}), C(t) ? a.push(b(n) + "=" + e.join(",")) : e.length !== 0 && a.push(e.join(","));
	}
	else t === ";" ? S(i) && a.push(b(n)) : i === "" && (t === "&" || t === "?") ? a.push(b(n) + "=") : i === "" && a.push("");
	return a;
}
function ge(e) {
	return { expand: _e.bind(null, e) };
}
function _e(e, t) {
	var n = [
		"+",
		"#",
		".",
		"/",
		";",
		"?",
		"&"
	];
	return e = e.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function(e, r, i) {
		if (r) {
			let e = "", i = [];
			if (n.indexOf(r.charAt(0)) !== -1 && (e = r.charAt(0), r = r.substr(1)), r.split(/,/g).forEach(function(n) {
				var r = /([^:\*]*)(?::(\d+)|(\*))?/.exec(n);
				i.push(he(t, e, r[1], r[2] || r[3]));
			}), e && e !== "+") {
				var a = ",";
				return e === "?" ? a = "&" : e !== "#" && (a = e), (i.length === 0 ? "" : e) + i.join(a);
			} else return i.join(",");
		} else return me(i);
	}), e === "/" ? e : e.replace(/\/$/, "");
}
function w(e) {
	let t = e.method.toUpperCase(), n = (e.url || "/").replace(/:([a-z]\w+)/g, "{$1}"), r = Object.assign({}, e.headers), i, a = pe(e, [
		"method",
		"baseUrl",
		"url",
		"headers",
		"request",
		"mediaType"
	]), o = fe(n);
	n = ge(n).expand(a), /^http/.test(n) || (n = e.baseUrl + n);
	let s = pe(a, Object.keys(e).filter((e) => o.includes(e)).concat("baseUrl"));
	return /application\/octet-stream/i.test(r.accept) || (e.mediaType.format && (r.accept = r.accept.split(/,/).map((t) => t.replace(/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/, `application/vnd$1$2.${e.mediaType.format}`)).join(",")), n.endsWith("/graphql") && e.mediaType.previews?.length && (r.accept = (r.accept.match(/(?<![\w-])[\w-]+(?=-preview)/g) || []).concat(e.mediaType.previews).map((t) => `application/vnd.github.${t}-preview${e.mediaType.format ? `.${e.mediaType.format}` : "+json"}`).join(","))), ["GET", "HEAD"].includes(t) ? n = le(n, s) : "data" in s ? i = s.data : Object.keys(s).length && (i = s), !r["content-type"] && i !== void 0 && (r["content-type"] = "application/json; charset=utf-8"), ["PATCH", "PUT"].includes(t) && i === void 0 && (i = ""), Object.assign({
		method: t,
		url: n,
		headers: r
	}, i === void 0 ? null : { body: i }, e.request ? { request: e.request } : null);
}
function ve(e, t, n) {
	return w(y(e, t, n));
}
function T(e, t) {
	let n = y(e, t), r = ve.bind(null, n);
	return Object.assign(r, {
		DEFAULTS: n,
		defaults: T.bind(null, n),
		merge: y.bind(null, n),
		parse: w
	});
}
var ye = T(null, oe), be = (/* @__PURE__ */ f(((e) => {
	Object.defineProperty(e, "__esModule", { value: !0 }), e.parse = n;
	var t = /* @__PURE__ */ (() => {
		let e = function() {};
		return e.prototype = Object.create(null), e;
	})();
	function n(e, n) {
		let r = e.length, i = d(e, 0, r), a = i;
		i = u(e, i, r);
		let o = f(e, a, i);
		return {
			type: e.slice(a, o).toLowerCase(),
			parameters: n?.parameters === !1 ? new t() : l(e, i, r)
		};
	}
	var r = 32, i = 9, a = 59, o = 61, s = 34, c = 92;
	function l(e, n, r) {
		let i = new t();
		parameter: for (; n < r;) {
			n = d(e, n + 1, r);
			let t = n;
			for (; n < r;) {
				let l = e.charCodeAt(n);
				if (l === a) continue parameter;
				if (l === o) {
					let a = f(e, t, n), o = e.slice(t, a).toLowerCase();
					if (n = d(e, n + 1, r), n < r && e.charCodeAt(n) === s) {
						n++;
						let t = "";
						for (; n < r;) {
							let a = e.charCodeAt(n++);
							if (a === s) {
								n = u(e, n, r), i[o] === void 0 && (i[o] = t);
								break;
							}
							if (a === c && n < r) {
								t += e[n++];
								continue;
							}
							t += String.fromCharCode(a);
						}
						continue parameter;
					}
					let l = n;
					if (n = u(e, n, r), i[o] === void 0) {
						let t = f(e, l, n);
						i[o] = e.slice(l, t);
					}
					continue parameter;
				}
				n++;
			}
		}
		return i;
	}
	function u(e, t, n) {
		for (; t < n && e.charCodeAt(t) !== a;) t++;
		return t;
	}
	function d(e, t, n) {
		for (; t < n;) {
			let n = e.charCodeAt(t);
			if (n !== r && n !== i) break;
			t++;
		}
		return t;
	}
	function f(e, t, n) {
		for (; n > t;) {
			let t = e.charCodeAt(n - 1);
			if (t !== r && t !== i) break;
			n--;
		}
		return n;
	}
})))(), xe = /^-?\d+$/, E = /^-?\d+n+$/, D = JSON.stringify, O = JSON.parse, Se = /^-?\d+n$/, Ce = /([\[:])?"(-?\d+)n"($|([\\n]|\s)*(\s|[\\n])*[,\}\]])/g, we = /([\[:])?("-?\d+n+)n("$|"([\\n]|\s)*(\s|[\\n])*[,\}\]])/g, Te = (e, t, n) => "rawJSON" in JSON ? D(e, (e, n) => typeof n == "bigint" ? JSON.rawJSON(n.toString()) : typeof t == "function" ? t(e, n) : (Array.isArray(t) && t.includes(e), n), n) : e ? D(e, (e, n) => typeof n == "string" && E.test(n) || typeof n == "bigint" ? n.toString() + "n" : typeof t == "function" ? t(e, n) : (Array.isArray(t) && t.includes(e), n), n).replace(Ce, "$1$2$3").replace(we, "$1$2$3") : D(e, t, n), k = /* @__PURE__ */ new Map(), Ee = () => {
	let e = JSON.parse.toString();
	if (k.has(e)) return k.get(e);
	try {
		let t = JSON.parse("1", (e, t, n) => !!n?.source && n.source === "1");
		return k.set(e, t), t;
	} catch {
		return k.set(e, !1), !1;
	}
}, De = (e, t, n, r) => typeof t == "string" && Se.test(t) ? BigInt(t.slice(0, -1)) : typeof t == "string" && E.test(t) ? t.slice(0, -1) : typeof r == "function" ? r(e, t, n) : t, Oe = (e, t) => JSON.parse(e, (e, n, r) => {
	let i = typeof n == "number" && (n > 2 ** 53 - 1 || n < -(2 ** 53 - 1)), a = r && xe.test(r.source);
	return i && a ? BigInt(r.source) : typeof t == "function" ? t(e, n, r) : n;
}), A = (2 ** 53 - 1).toString(), j = A.length, ke = /"(?:\\.|[^"])*"|-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/g, Ae = /^"-?\d+n+"$/, je = (e, t) => e ? Ee() ? Oe(e, t) : O(e.replace(ke, (e, t, n, r) => {
	let i = e[0] === "\"";
	if (i && Ae.test(e)) return e.substring(0, e.length - 1) + "n\"";
	let a = n || r, o = t && (t.length < j || t.length === j && t <= A);
	return i || a || o ? e : "\"" + e + "n\"";
}), (e, n, r) => De(e, n, r, t)) : O(e, t), M = class extends Error {
	name;
	status;
	request;
	response;
	constructor(e, t, n) {
		/* v8 ignore else -- @preserve -- Bug with vitest coverage where it sees an else branch that doesn't exist */
		super(e, { cause: n.cause }), this.name = "HttpError", this.status = Number.parseInt(t), Number.isNaN(this.status) && (this.status = 0), "response" in n && (this.response = n.response);
		let r = Object.assign({}, n.request);
		n.request.headers.authorization && (r.headers = Object.assign({}, n.request.headers, { authorization: n.request.headers.authorization.replace(/(?<! ) .*$/, " [REDACTED]") })), r.url = r.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]"), this.request = r;
	}
}, Me = { headers: { "user-agent": `octokit-request.js/10.0.10 ${p()}` } };
function Ne(e) {
	if (typeof e != "object" || !e || Object.prototype.toString.call(e) !== "[object Object]") return !1;
	let t = Object.getPrototypeOf(e);
	if (t === null) return !0;
	let n = Object.prototype.hasOwnProperty.call(t, "constructor") && t.constructor;
	return typeof n == "function" && n instanceof n && Function.prototype.call(n) === Function.prototype.call(e);
}
var N = () => "";
async function P(e) {
	let t = e.request?.fetch || globalThis.fetch;
	if (!t) throw Error("fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing");
	let n = e.request?.log || console, r = e.request?.parseSuccessResponseBody !== !1, i = Ne(e.body) || Array.isArray(e.body) ? Te(e.body) : e.body, a = Object.fromEntries(Object.entries(e.headers).map(([e, t]) => [e, String(t)])), o;
	try {
		o = await t(e.url, {
			method: e.method,
			body: i,
			redirect: e.request?.redirect,
			headers: a,
			signal: e.request?.signal,
			...e.body && { duplex: "half" }
		});
	} catch (t) {
		let n = "Unknown Error";
		if (t instanceof Error) {
			if (t.name === "AbortError") throw t.status = 500, t;
			n = t.message, t.name === "TypeError" && "cause" in t && (t.cause instanceof Error ? n = t.cause.message : typeof t.cause == "string" && (n = t.cause));
		}
		let r = new M(n, 500, { request: e });
		throw r.cause = t, r;
	}
	let s = o.status, c = o.url, l = {};
	for (let [e, t] of o.headers) l[e] = t;
	let u = {
		url: c,
		status: s,
		headers: l,
		data: ""
	};
	if ("deprecation" in l) {
		let t = l.link && l.link.match(/<([^<>]+)>; rel="deprecation"/), r = t && t.pop();
		n.warn(`[@octokit/request] "${e.method} ${e.url}" is deprecated. It is scheduled to be removed on ${l.sunset}${r ? `. See ${r}` : ""}`);
	}
	if (s === 204 || s === 205) return u;
	if (e.method === "HEAD") {
		if (s < 400) return u;
		throw new M(o.statusText, s, {
			response: u,
			request: e
		});
	}
	if (s === 304) throw u.data = await F(o), new M("Not modified", s, {
		response: u,
		request: e
	});
	if (s >= 400) throw u.data = await F(o), new M(Fe(u.data), s, {
		response: u,
		request: e
	});
	return u.data = r ? await F(o) : o.body, u;
}
async function F(e) {
	let t = e.headers.get("content-type");
	if (!t) return e.text().catch(N);
	let n = (0, be.parse)(t);
	if (Pe(n)) {
		let t = "";
		try {
			return t = await e.text(), je(t);
		} catch {
			return t;
		}
	} else if (n.type.startsWith("text/") || n.parameters.charset?.toLowerCase() === "utf-8") return e.text().catch(N);
	else return e.arrayBuffer().catch(
		/* v8 ignore next -- @preserve */
		() => /* @__PURE__ */ new ArrayBuffer(0)
	);
}
function Pe(e) {
	return e.type === "application/json" || e.type === "application/scim+json";
}
function Fe(e) {
	if (typeof e == "string") return e;
	if (e instanceof ArrayBuffer) return "Unknown error";
	if ("message" in e) {
		let t = "documentation_url" in e ? ` - ${e.documentation_url}` : "";
		return Array.isArray(e.errors) ? `${e.message}: ${e.errors.map((e) => JSON.stringify(e)).join(", ")}${t}` : `${e.message}${t}`;
	}
	return `Unknown error: ${JSON.stringify(e)}`;
}
function I(e, t) {
	let n = e.defaults(t);
	return Object.assign(function(e, t) {
		let r = n.merge(e, t);
		if (!r.request || !r.request.hook) return P(n.parse(r));
		let i = (e, t) => P(n.parse(n.merge(e, t)));
		return Object.assign(i, {
			endpoint: n,
			defaults: I.bind(null, n)
		}), r.request.hook(i, r);
	}, {
		endpoint: n,
		defaults: I.bind(null, n)
	});
}
var L = I(ye, Me), Ie = "0.0.0-development";
function Le(e) {
	return "Request failed due to following response errors:\n" + e.errors.map((e) => ` - ${e.message}`).join("\n");
}
var Re = class extends Error {
	constructor(e, t, n) {
		super(Le(n)), this.request = e, this.headers = t, this.response = n, this.errors = n.errors, this.data = n.data, Error.captureStackTrace && Error.captureStackTrace(this, this.constructor);
	}
	name = "GraphqlResponseError";
	errors;
	data;
}, ze = [
	"method",
	"baseUrl",
	"url",
	"headers",
	"request",
	"query",
	"mediaType",
	"operationName"
], Be = [
	"query",
	"method",
	"url"
], R = /\/api\/v3\/?$/;
function Ve(e, t, n) {
	if (n) {
		if (typeof t == "string" && "query" in n) return Promise.reject(/* @__PURE__ */ Error("[@octokit/graphql] \"query\" cannot be used as variable name"));
		for (let e in n) if (Be.includes(e)) return Promise.reject(/* @__PURE__ */ Error(`[@octokit/graphql] "${e}" cannot be used as variable name`));
	}
	let r = typeof t == "string" ? Object.assign({ query: t }, n) : t, i = Object.keys(r).reduce((e, t) => ze.includes(t) ? (e[t] = r[t], e) : (e.variables ||= {}, e.variables[t] = r[t], e), {}), a = r.baseUrl || e.endpoint.DEFAULTS.baseUrl;
	return R.test(a) && (i.url = a.replace(R, "/api/graphql")), e(i).then((e) => {
		if (e.data.errors) {
			let t = {};
			for (let n of Object.keys(e.headers)) t[n] = e.headers[n];
			throw new Re(i, t, e.data);
		}
		return e.data.data;
	});
}
function z(e, t) {
	let n = e.defaults(t);
	return Object.assign((e, t) => Ve(n, e, t), {
		defaults: z.bind(null, n),
		endpoint: n.endpoint
	});
}
z(L, {
	headers: { "user-agent": `octokit-graphql.js/${Ie} ${p()}` },
	method: "POST",
	url: "/graphql"
});
function He(e) {
	return z(e, {
		method: "POST",
		url: "/graphql"
	});
}
//#endregion
//#region node_modules/@octokit/auth-token/dist-bundle/index.js
var B = "(?:[a-zA-Z0-9_-]+)", V = "\\.", H = RegExp(`^${B}${V}${B}${V}${B}$`), Ue = H.test.bind(H);
async function We(e) {
	let t = Ue(e), n = e.startsWith("v1.") || e.startsWith("ghs_"), r = e.startsWith("ghu_");
	return {
		type: "token",
		token: e,
		tokenType: t ? "app" : n ? "installation" : r ? "user-to-server" : "oauth"
	};
}
function Ge(e) {
	return e.split(/\./).length === 3 ? `bearer ${e}` : `token ${e}`;
}
async function Ke(e, t, n, r) {
	let i = t.endpoint.merge(n, r);
	return i.headers.authorization = Ge(e), t(i);
}
var qe = function(e) {
	if (!e) throw Error("[@octokit/auth-token] No token passed to createTokenAuth");
	if (typeof e != "string") throw Error("[@octokit/auth-token] Token passed to createTokenAuth is not a string");
	return e = e.replace(/^(token|bearer) +/i, ""), Object.assign(We.bind(null, e), { hook: Ke.bind(null, e) });
}, U = "7.0.6", W = () => {}, Je = console.warn.bind(console), Ye = console.error.bind(console);
function Xe(e = {}) {
	return typeof e.debug != "function" && (e.debug = W), typeof e.info != "function" && (e.info = W), typeof e.warn != "function" && (e.warn = Je), typeof e.error != "function" && (e.error = Ye), e;
}
var Ze = `octokit-core.js/${U} ${p()}`, Qe = class {
	static VERSION = U;
	static defaults(e) {
		return class extends this {
			constructor(...t) {
				let n = t[0] || {};
				if (typeof e == "function") {
					super(e(n));
					return;
				}
				super(Object.assign({}, e, n, n.userAgent && e.userAgent ? { userAgent: `${n.userAgent} ${e.userAgent}` } : null));
			}
		};
	}
	static plugins = [];
	static plugin(...e) {
		let t = this.plugins;
		return class extends this {
			static plugins = t.concat(e.filter((e) => !t.includes(e)));
		};
	}
	constructor(e = {}) {
		let t = new ae.Collection(), n = {
			baseUrl: L.endpoint.DEFAULTS.baseUrl,
			headers: {},
			request: Object.assign({}, e.request, { hook: t.bind(null, "request") }),
			mediaType: {
				previews: [],
				format: ""
			}
		};
		if (n.headers["user-agent"] = e.userAgent ? `${e.userAgent} ${Ze}` : Ze, e.baseUrl && (n.baseUrl = e.baseUrl), e.previews && (n.mediaType.previews = e.previews), e.timeZone && (n.headers["time-zone"] = e.timeZone), this.request = L.defaults(n), this.graphql = He(this.request).defaults(n), this.log = Xe(e.log), this.hook = t, e.authStrategy) {
			let { authStrategy: n, ...r } = e, i = n(Object.assign({
				request: this.request,
				log: this.log,
				octokit: this,
				octokitOptions: r
			}, e.auth));
			t.wrap("request", i.hook), this.auth = i;
		} else if (!e.auth) this.auth = async () => ({ type: "unauthenticated" });
		else {
			let n = qe(e.auth);
			t.wrap("request", n.hook), this.auth = n;
		}
		let r = this.constructor;
		for (let t = 0; t < r.plugins.length; ++t) Object.assign(this, r.plugins[t](this, e));
	}
	request;
	graphql;
	log;
	hook;
	auth;
}, $e = "6.0.0";
//#endregion
//#region node_modules/@octokit/plugin-request-log/dist-src/index.js
function et(e) {
	e.hook.wrap("request", (t, n) => {
		e.log.debug("request", n);
		let r = Date.now(), i = e.request.endpoint.parse(n), a = i.url.replace(n.baseUrl, "");
		return t(n).then((t) => {
			let n = t.headers["x-github-request-id"];
			return e.log.info(`${i.method} ${a} - ${t.status} with id ${n} in ${Date.now() - r}ms`), t;
		}).catch((t) => {
			let n = t.response?.headers["x-github-request-id"] || "UNKNOWN";
			throw e.log.error(`${i.method} ${a} - ${t.status} with id ${n} in ${Date.now() - r}ms`), t;
		});
	});
}
et.VERSION = $e;
//#endregion
//#region node_modules/@octokit/plugin-paginate-rest/dist-bundle/index.js
var tt = "0.0.0-development";
function nt(e) {
	if (!e.data) return {
		...e,
		data: []
	};
	if (!(("total_count" in e.data || "total_commits" in e.data) && !("url" in e.data))) return e;
	let t = e.data.incomplete_results, n = e.data.repository_selection, r = e.data.total_count, i = e.data.total_commits;
	delete e.data.incomplete_results, delete e.data.repository_selection, delete e.data.total_count, delete e.data.total_commits;
	let a = Object.keys(e.data)[0];
	return e.data = e.data[a], t !== void 0 && (e.data.incomplete_results = t), n !== void 0 && (e.data.repository_selection = n), e.data.total_count = r, e.data.total_commits = i, e;
}
function G(e, t, n) {
	let r = typeof t == "function" ? t.endpoint(n) : e.request.endpoint(t, n), i = typeof t == "function" ? t : e.request, a = r.method, o = r.headers, s = r.url;
	return { [Symbol.asyncIterator]: () => ({ async next() {
		if (!s) return { done: !0 };
		try {
			let e = nt(await i({
				method: a,
				url: s,
				headers: o
			}));
			if (s = ((e.headers.link || "").match(/<([^<>]+)>;\s*rel="next"/) || [])[1], !s && "total_commits" in e.data) {
				let t = new URL(e.url), n = t.searchParams, r = parseInt(n.get("page") || "1", 10);
				r * parseInt(n.get("per_page") || "250", 10) < e.data.total_commits && (n.set("page", String(r + 1)), s = t.toString());
			}
			return { value: e };
		} catch (e) {
			if (e.status !== 409) throw e;
			return s = "", { value: {
				status: 200,
				headers: {},
				data: []
			} };
		}
	} }) };
}
function rt(e, t, n, r) {
	return typeof n == "function" && (r = n, n = void 0), it(e, [], G(e, t, n)[Symbol.asyncIterator](), r);
}
function it(e, t, n, r) {
	return n.next().then((i) => {
		if (i.done) return t;
		let a = !1;
		function o() {
			a = !0;
		}
		return t = t.concat(r ? r(i.value, o) : i.value.data), a ? t : it(e, t, n, r);
	});
}
Object.assign(rt, { iterator: G });
function at(e) {
	return { paginate: Object.assign(rt.bind(null, e), { iterator: G.bind(null, e) }) };
}
at.VERSION = tt;
//#endregion
//#region node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/version.js
var ot = "17.0.0", st = {
	actions: {
		addCustomLabelsToSelfHostedRunnerForOrg: ["POST /orgs/{org}/actions/runners/{runner_id}/labels"],
		addCustomLabelsToSelfHostedRunnerForRepo: ["POST /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"],
		addRepoAccessToSelfHostedRunnerGroupInOrg: ["PUT /orgs/{org}/actions/runner-groups/{runner_group_id}/repositories/{repository_id}"],
		addSelectedRepoToOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"],
		addSelectedRepoToOrgVariable: ["PUT /orgs/{org}/actions/variables/{name}/repositories/{repository_id}"],
		approveWorkflowRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/approve"],
		cancelWorkflowRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/cancel"],
		createEnvironmentVariable: ["POST /repos/{owner}/{repo}/environments/{environment_name}/variables"],
		createHostedRunnerForOrg: ["POST /orgs/{org}/actions/hosted-runners"],
		createOrUpdateEnvironmentSecret: ["PUT /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"],
		createOrUpdateOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}"],
		createOrUpdateRepoSecret: ["PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
		createOrgVariable: ["POST /orgs/{org}/actions/variables"],
		createRegistrationTokenForOrg: ["POST /orgs/{org}/actions/runners/registration-token"],
		createRegistrationTokenForRepo: ["POST /repos/{owner}/{repo}/actions/runners/registration-token"],
		createRemoveTokenForOrg: ["POST /orgs/{org}/actions/runners/remove-token"],
		createRemoveTokenForRepo: ["POST /repos/{owner}/{repo}/actions/runners/remove-token"],
		createRepoVariable: ["POST /repos/{owner}/{repo}/actions/variables"],
		createWorkflowDispatch: ["POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches"],
		deleteActionsCacheById: ["DELETE /repos/{owner}/{repo}/actions/caches/{cache_id}"],
		deleteActionsCacheByKey: ["DELETE /repos/{owner}/{repo}/actions/caches{?key,ref}"],
		deleteArtifact: ["DELETE /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
		deleteCustomImageFromOrg: ["DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}"],
		deleteCustomImageVersionFromOrg: ["DELETE /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version}"],
		deleteEnvironmentSecret: ["DELETE /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"],
		deleteEnvironmentVariable: ["DELETE /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"],
		deleteHostedRunnerForOrg: ["DELETE /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"],
		deleteOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}"],
		deleteOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}"],
		deleteRepoSecret: ["DELETE /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
		deleteRepoVariable: ["DELETE /repos/{owner}/{repo}/actions/variables/{name}"],
		deleteSelfHostedRunnerFromOrg: ["DELETE /orgs/{org}/actions/runners/{runner_id}"],
		deleteSelfHostedRunnerFromRepo: ["DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}"],
		deleteWorkflowRun: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}"],
		deleteWorkflowRunLogs: ["DELETE /repos/{owner}/{repo}/actions/runs/{run_id}/logs"],
		disableSelectedRepositoryGithubActionsOrganization: ["DELETE /orgs/{org}/actions/permissions/repositories/{repository_id}"],
		disableWorkflow: ["PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/disable"],
		downloadArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}/{archive_format}"],
		downloadJobLogsForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}/logs"],
		downloadWorkflowRunAttemptLogs: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/logs"],
		downloadWorkflowRunLogs: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/logs"],
		enableSelectedRepositoryGithubActionsOrganization: ["PUT /orgs/{org}/actions/permissions/repositories/{repository_id}"],
		enableWorkflow: ["PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable"],
		forceCancelWorkflowRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/force-cancel"],
		generateRunnerJitconfigForOrg: ["POST /orgs/{org}/actions/runners/generate-jitconfig"],
		generateRunnerJitconfigForRepo: ["POST /repos/{owner}/{repo}/actions/runners/generate-jitconfig"],
		getActionsCacheList: ["GET /repos/{owner}/{repo}/actions/caches"],
		getActionsCacheUsage: ["GET /repos/{owner}/{repo}/actions/cache/usage"],
		getActionsCacheUsageByRepoForOrg: ["GET /orgs/{org}/actions/cache/usage-by-repository"],
		getActionsCacheUsageForOrg: ["GET /orgs/{org}/actions/cache/usage"],
		getAllowedActionsOrganization: ["GET /orgs/{org}/actions/permissions/selected-actions"],
		getAllowedActionsRepository: ["GET /repos/{owner}/{repo}/actions/permissions/selected-actions"],
		getArtifact: ["GET /repos/{owner}/{repo}/actions/artifacts/{artifact_id}"],
		getCustomImageForOrg: ["GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}"],
		getCustomImageVersionForOrg: ["GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions/{version}"],
		getCustomOidcSubClaimForRepo: ["GET /repos/{owner}/{repo}/actions/oidc/customization/sub"],
		getEnvironmentPublicKey: ["GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/public-key"],
		getEnvironmentSecret: ["GET /repos/{owner}/{repo}/environments/{environment_name}/secrets/{secret_name}"],
		getEnvironmentVariable: ["GET /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"],
		getGithubActionsDefaultWorkflowPermissionsOrganization: ["GET /orgs/{org}/actions/permissions/workflow"],
		getGithubActionsDefaultWorkflowPermissionsRepository: ["GET /repos/{owner}/{repo}/actions/permissions/workflow"],
		getGithubActionsPermissionsOrganization: ["GET /orgs/{org}/actions/permissions"],
		getGithubActionsPermissionsRepository: ["GET /repos/{owner}/{repo}/actions/permissions"],
		getHostedRunnerForOrg: ["GET /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"],
		getHostedRunnersGithubOwnedImagesForOrg: ["GET /orgs/{org}/actions/hosted-runners/images/github-owned"],
		getHostedRunnersLimitsForOrg: ["GET /orgs/{org}/actions/hosted-runners/limits"],
		getHostedRunnersMachineSpecsForOrg: ["GET /orgs/{org}/actions/hosted-runners/machine-sizes"],
		getHostedRunnersPartnerImagesForOrg: ["GET /orgs/{org}/actions/hosted-runners/images/partner"],
		getHostedRunnersPlatformsForOrg: ["GET /orgs/{org}/actions/hosted-runners/platforms"],
		getJobForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"],
		getOrgPublicKey: ["GET /orgs/{org}/actions/secrets/public-key"],
		getOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}"],
		getOrgVariable: ["GET /orgs/{org}/actions/variables/{name}"],
		getPendingDeploymentsForRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"],
		getRepoPermissions: [
			"GET /repos/{owner}/{repo}/actions/permissions",
			{},
			{ renamed: ["actions", "getGithubActionsPermissionsRepository"] }
		],
		getRepoPublicKey: ["GET /repos/{owner}/{repo}/actions/secrets/public-key"],
		getRepoSecret: ["GET /repos/{owner}/{repo}/actions/secrets/{secret_name}"],
		getRepoVariable: ["GET /repos/{owner}/{repo}/actions/variables/{name}"],
		getReviewsForRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/approvals"],
		getSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}"],
		getSelfHostedRunnerForRepo: ["GET /repos/{owner}/{repo}/actions/runners/{runner_id}"],
		getWorkflow: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}"],
		getWorkflowAccessToRepository: ["GET /repos/{owner}/{repo}/actions/permissions/access"],
		getWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}"],
		getWorkflowRunAttempt: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}"],
		getWorkflowRunUsage: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/timing"],
		getWorkflowUsage: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/timing"],
		listArtifactsForRepo: ["GET /repos/{owner}/{repo}/actions/artifacts"],
		listCustomImageVersionsForOrg: ["GET /orgs/{org}/actions/hosted-runners/images/custom/{image_definition_id}/versions"],
		listCustomImagesForOrg: ["GET /orgs/{org}/actions/hosted-runners/images/custom"],
		listEnvironmentSecrets: ["GET /repos/{owner}/{repo}/environments/{environment_name}/secrets"],
		listEnvironmentVariables: ["GET /repos/{owner}/{repo}/environments/{environment_name}/variables"],
		listGithubHostedRunnersInGroupForOrg: ["GET /orgs/{org}/actions/runner-groups/{runner_group_id}/hosted-runners"],
		listHostedRunnersForOrg: ["GET /orgs/{org}/actions/hosted-runners"],
		listJobsForWorkflowRun: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"],
		listJobsForWorkflowRunAttempt: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs"],
		listLabelsForSelfHostedRunnerForOrg: ["GET /orgs/{org}/actions/runners/{runner_id}/labels"],
		listLabelsForSelfHostedRunnerForRepo: ["GET /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"],
		listOrgSecrets: ["GET /orgs/{org}/actions/secrets"],
		listOrgVariables: ["GET /orgs/{org}/actions/variables"],
		listRepoOrganizationSecrets: ["GET /repos/{owner}/{repo}/actions/organization-secrets"],
		listRepoOrganizationVariables: ["GET /repos/{owner}/{repo}/actions/organization-variables"],
		listRepoSecrets: ["GET /repos/{owner}/{repo}/actions/secrets"],
		listRepoVariables: ["GET /repos/{owner}/{repo}/actions/variables"],
		listRepoWorkflows: ["GET /repos/{owner}/{repo}/actions/workflows"],
		listRunnerApplicationsForOrg: ["GET /orgs/{org}/actions/runners/downloads"],
		listRunnerApplicationsForRepo: ["GET /repos/{owner}/{repo}/actions/runners/downloads"],
		listSelectedReposForOrgSecret: ["GET /orgs/{org}/actions/secrets/{secret_name}/repositories"],
		listSelectedReposForOrgVariable: ["GET /orgs/{org}/actions/variables/{name}/repositories"],
		listSelectedRepositoriesEnabledGithubActionsOrganization: ["GET /orgs/{org}/actions/permissions/repositories"],
		listSelfHostedRunnersForOrg: ["GET /orgs/{org}/actions/runners"],
		listSelfHostedRunnersForRepo: ["GET /repos/{owner}/{repo}/actions/runners"],
		listWorkflowRunArtifacts: ["GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts"],
		listWorkflowRuns: ["GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"],
		listWorkflowRunsForRepo: ["GET /repos/{owner}/{repo}/actions/runs"],
		reRunJobForWorkflowRun: ["POST /repos/{owner}/{repo}/actions/jobs/{job_id}/rerun"],
		reRunWorkflow: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun"],
		reRunWorkflowFailedJobs: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/rerun-failed-jobs"],
		removeAllCustomLabelsFromSelfHostedRunnerForOrg: ["DELETE /orgs/{org}/actions/runners/{runner_id}/labels"],
		removeAllCustomLabelsFromSelfHostedRunnerForRepo: ["DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"],
		removeCustomLabelFromSelfHostedRunnerForOrg: ["DELETE /orgs/{org}/actions/runners/{runner_id}/labels/{name}"],
		removeCustomLabelFromSelfHostedRunnerForRepo: ["DELETE /repos/{owner}/{repo}/actions/runners/{runner_id}/labels/{name}"],
		removeSelectedRepoFromOrgSecret: ["DELETE /orgs/{org}/actions/secrets/{secret_name}/repositories/{repository_id}"],
		removeSelectedRepoFromOrgVariable: ["DELETE /orgs/{org}/actions/variables/{name}/repositories/{repository_id}"],
		reviewCustomGatesForRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/deployment_protection_rule"],
		reviewPendingDeploymentsForRun: ["POST /repos/{owner}/{repo}/actions/runs/{run_id}/pending_deployments"],
		setAllowedActionsOrganization: ["PUT /orgs/{org}/actions/permissions/selected-actions"],
		setAllowedActionsRepository: ["PUT /repos/{owner}/{repo}/actions/permissions/selected-actions"],
		setCustomLabelsForSelfHostedRunnerForOrg: ["PUT /orgs/{org}/actions/runners/{runner_id}/labels"],
		setCustomLabelsForSelfHostedRunnerForRepo: ["PUT /repos/{owner}/{repo}/actions/runners/{runner_id}/labels"],
		setCustomOidcSubClaimForRepo: ["PUT /repos/{owner}/{repo}/actions/oidc/customization/sub"],
		setGithubActionsDefaultWorkflowPermissionsOrganization: ["PUT /orgs/{org}/actions/permissions/workflow"],
		setGithubActionsDefaultWorkflowPermissionsRepository: ["PUT /repos/{owner}/{repo}/actions/permissions/workflow"],
		setGithubActionsPermissionsOrganization: ["PUT /orgs/{org}/actions/permissions"],
		setGithubActionsPermissionsRepository: ["PUT /repos/{owner}/{repo}/actions/permissions"],
		setSelectedReposForOrgSecret: ["PUT /orgs/{org}/actions/secrets/{secret_name}/repositories"],
		setSelectedReposForOrgVariable: ["PUT /orgs/{org}/actions/variables/{name}/repositories"],
		setSelectedRepositoriesEnabledGithubActionsOrganization: ["PUT /orgs/{org}/actions/permissions/repositories"],
		setWorkflowAccessToRepository: ["PUT /repos/{owner}/{repo}/actions/permissions/access"],
		updateEnvironmentVariable: ["PATCH /repos/{owner}/{repo}/environments/{environment_name}/variables/{name}"],
		updateHostedRunnerForOrg: ["PATCH /orgs/{org}/actions/hosted-runners/{hosted_runner_id}"],
		updateOrgVariable: ["PATCH /orgs/{org}/actions/variables/{name}"],
		updateRepoVariable: ["PATCH /repos/{owner}/{repo}/actions/variables/{name}"]
	},
	activity: {
		checkRepoIsStarredByAuthenticatedUser: ["GET /user/starred/{owner}/{repo}"],
		deleteRepoSubscription: ["DELETE /repos/{owner}/{repo}/subscription"],
		deleteThreadSubscription: ["DELETE /notifications/threads/{thread_id}/subscription"],
		getFeeds: ["GET /feeds"],
		getRepoSubscription: ["GET /repos/{owner}/{repo}/subscription"],
		getThread: ["GET /notifications/threads/{thread_id}"],
		getThreadSubscriptionForAuthenticatedUser: ["GET /notifications/threads/{thread_id}/subscription"],
		listEventsForAuthenticatedUser: ["GET /users/{username}/events"],
		listNotificationsForAuthenticatedUser: ["GET /notifications"],
		listOrgEventsForAuthenticatedUser: ["GET /users/{username}/events/orgs/{org}"],
		listPublicEvents: ["GET /events"],
		listPublicEventsForRepoNetwork: ["GET /networks/{owner}/{repo}/events"],
		listPublicEventsForUser: ["GET /users/{username}/events/public"],
		listPublicOrgEvents: ["GET /orgs/{org}/events"],
		listReceivedEventsForUser: ["GET /users/{username}/received_events"],
		listReceivedPublicEventsForUser: ["GET /users/{username}/received_events/public"],
		listRepoEvents: ["GET /repos/{owner}/{repo}/events"],
		listRepoNotificationsForAuthenticatedUser: ["GET /repos/{owner}/{repo}/notifications"],
		listReposStarredByAuthenticatedUser: ["GET /user/starred"],
		listReposStarredByUser: ["GET /users/{username}/starred"],
		listReposWatchedByUser: ["GET /users/{username}/subscriptions"],
		listStargazersForRepo: ["GET /repos/{owner}/{repo}/stargazers"],
		listWatchedReposForAuthenticatedUser: ["GET /user/subscriptions"],
		listWatchersForRepo: ["GET /repos/{owner}/{repo}/subscribers"],
		markNotificationsAsRead: ["PUT /notifications"],
		markRepoNotificationsAsRead: ["PUT /repos/{owner}/{repo}/notifications"],
		markThreadAsDone: ["DELETE /notifications/threads/{thread_id}"],
		markThreadAsRead: ["PATCH /notifications/threads/{thread_id}"],
		setRepoSubscription: ["PUT /repos/{owner}/{repo}/subscription"],
		setThreadSubscription: ["PUT /notifications/threads/{thread_id}/subscription"],
		starRepoForAuthenticatedUser: ["PUT /user/starred/{owner}/{repo}"],
		unstarRepoForAuthenticatedUser: ["DELETE /user/starred/{owner}/{repo}"]
	},
	apps: {
		addRepoToInstallation: [
			"PUT /user/installations/{installation_id}/repositories/{repository_id}",
			{},
			{ renamed: ["apps", "addRepoToInstallationForAuthenticatedUser"] }
		],
		addRepoToInstallationForAuthenticatedUser: ["PUT /user/installations/{installation_id}/repositories/{repository_id}"],
		checkToken: ["POST /applications/{client_id}/token"],
		createFromManifest: ["POST /app-manifests/{code}/conversions"],
		createInstallationAccessToken: ["POST /app/installations/{installation_id}/access_tokens"],
		deleteAuthorization: ["DELETE /applications/{client_id}/grant"],
		deleteInstallation: ["DELETE /app/installations/{installation_id}"],
		deleteToken: ["DELETE /applications/{client_id}/token"],
		getAuthenticated: ["GET /app"],
		getBySlug: ["GET /apps/{app_slug}"],
		getInstallation: ["GET /app/installations/{installation_id}"],
		getOrgInstallation: ["GET /orgs/{org}/installation"],
		getRepoInstallation: ["GET /repos/{owner}/{repo}/installation"],
		getSubscriptionPlanForAccount: ["GET /marketplace_listing/accounts/{account_id}"],
		getSubscriptionPlanForAccountStubbed: ["GET /marketplace_listing/stubbed/accounts/{account_id}"],
		getUserInstallation: ["GET /users/{username}/installation"],
		getWebhookConfigForApp: ["GET /app/hook/config"],
		getWebhookDelivery: ["GET /app/hook/deliveries/{delivery_id}"],
		listAccountsForPlan: ["GET /marketplace_listing/plans/{plan_id}/accounts"],
		listAccountsForPlanStubbed: ["GET /marketplace_listing/stubbed/plans/{plan_id}/accounts"],
		listInstallationReposForAuthenticatedUser: ["GET /user/installations/{installation_id}/repositories"],
		listInstallationRequestsForAuthenticatedApp: ["GET /app/installation-requests"],
		listInstallations: ["GET /app/installations"],
		listInstallationsForAuthenticatedUser: ["GET /user/installations"],
		listPlans: ["GET /marketplace_listing/plans"],
		listPlansStubbed: ["GET /marketplace_listing/stubbed/plans"],
		listReposAccessibleToInstallation: ["GET /installation/repositories"],
		listSubscriptionsForAuthenticatedUser: ["GET /user/marketplace_purchases"],
		listSubscriptionsForAuthenticatedUserStubbed: ["GET /user/marketplace_purchases/stubbed"],
		listWebhookDeliveries: ["GET /app/hook/deliveries"],
		redeliverWebhookDelivery: ["POST /app/hook/deliveries/{delivery_id}/attempts"],
		removeRepoFromInstallation: [
			"DELETE /user/installations/{installation_id}/repositories/{repository_id}",
			{},
			{ renamed: ["apps", "removeRepoFromInstallationForAuthenticatedUser"] }
		],
		removeRepoFromInstallationForAuthenticatedUser: ["DELETE /user/installations/{installation_id}/repositories/{repository_id}"],
		resetToken: ["PATCH /applications/{client_id}/token"],
		revokeInstallationAccessToken: ["DELETE /installation/token"],
		scopeToken: ["POST /applications/{client_id}/token/scoped"],
		suspendInstallation: ["PUT /app/installations/{installation_id}/suspended"],
		unsuspendInstallation: ["DELETE /app/installations/{installation_id}/suspended"],
		updateWebhookConfigForApp: ["PATCH /app/hook/config"]
	},
	billing: {
		getGithubActionsBillingOrg: ["GET /orgs/{org}/settings/billing/actions"],
		getGithubActionsBillingUser: ["GET /users/{username}/settings/billing/actions"],
		getGithubBillingPremiumRequestUsageReportOrg: ["GET /organizations/{org}/settings/billing/premium_request/usage"],
		getGithubBillingPremiumRequestUsageReportUser: ["GET /users/{username}/settings/billing/premium_request/usage"],
		getGithubBillingUsageReportOrg: ["GET /organizations/{org}/settings/billing/usage"],
		getGithubBillingUsageReportUser: ["GET /users/{username}/settings/billing/usage"],
		getGithubPackagesBillingOrg: ["GET /orgs/{org}/settings/billing/packages"],
		getGithubPackagesBillingUser: ["GET /users/{username}/settings/billing/packages"],
		getSharedStorageBillingOrg: ["GET /orgs/{org}/settings/billing/shared-storage"],
		getSharedStorageBillingUser: ["GET /users/{username}/settings/billing/shared-storage"]
	},
	campaigns: {
		createCampaign: ["POST /orgs/{org}/campaigns"],
		deleteCampaign: ["DELETE /orgs/{org}/campaigns/{campaign_number}"],
		getCampaignSummary: ["GET /orgs/{org}/campaigns/{campaign_number}"],
		listOrgCampaigns: ["GET /orgs/{org}/campaigns"],
		updateCampaign: ["PATCH /orgs/{org}/campaigns/{campaign_number}"]
	},
	checks: {
		create: ["POST /repos/{owner}/{repo}/check-runs"],
		createSuite: ["POST /repos/{owner}/{repo}/check-suites"],
		get: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}"],
		getSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}"],
		listAnnotations: ["GET /repos/{owner}/{repo}/check-runs/{check_run_id}/annotations"],
		listForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-runs"],
		listForSuite: ["GET /repos/{owner}/{repo}/check-suites/{check_suite_id}/check-runs"],
		listSuitesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/check-suites"],
		rerequestRun: ["POST /repos/{owner}/{repo}/check-runs/{check_run_id}/rerequest"],
		rerequestSuite: ["POST /repos/{owner}/{repo}/check-suites/{check_suite_id}/rerequest"],
		setSuitesPreferences: ["PATCH /repos/{owner}/{repo}/check-suites/preferences"],
		update: ["PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}"]
	},
	codeScanning: {
		commitAutofix: ["POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits"],
		createAutofix: ["POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix"],
		createVariantAnalysis: ["POST /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses"],
		deleteAnalysis: ["DELETE /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}{?confirm_delete}"],
		deleteCodeqlDatabase: ["DELETE /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}"],
		getAlert: [
			"GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}",
			{},
			{ renamedParameters: { alert_id: "alert_number" } }
		],
		getAnalysis: ["GET /repos/{owner}/{repo}/code-scanning/analyses/{analysis_id}"],
		getAutofix: ["GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix"],
		getCodeqlDatabase: ["GET /repos/{owner}/{repo}/code-scanning/codeql/databases/{language}"],
		getDefaultSetup: ["GET /repos/{owner}/{repo}/code-scanning/default-setup"],
		getSarif: ["GET /repos/{owner}/{repo}/code-scanning/sarifs/{sarif_id}"],
		getVariantAnalysis: ["GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}"],
		getVariantAnalysisRepoTask: ["GET /repos/{owner}/{repo}/code-scanning/codeql/variant-analyses/{codeql_variant_analysis_id}/repos/{repo_owner}/{repo_name}"],
		listAlertInstances: ["GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances"],
		listAlertsForOrg: ["GET /orgs/{org}/code-scanning/alerts"],
		listAlertsForRepo: ["GET /repos/{owner}/{repo}/code-scanning/alerts"],
		listAlertsInstances: [
			"GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/instances",
			{},
			{ renamed: ["codeScanning", "listAlertInstances"] }
		],
		listCodeqlDatabases: ["GET /repos/{owner}/{repo}/code-scanning/codeql/databases"],
		listRecentAnalyses: ["GET /repos/{owner}/{repo}/code-scanning/analyses"],
		updateAlert: ["PATCH /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}"],
		updateDefaultSetup: ["PATCH /repos/{owner}/{repo}/code-scanning/default-setup"],
		uploadSarif: ["POST /repos/{owner}/{repo}/code-scanning/sarifs"]
	},
	codeSecurity: {
		attachConfiguration: ["POST /orgs/{org}/code-security/configurations/{configuration_id}/attach"],
		attachEnterpriseConfiguration: ["POST /enterprises/{enterprise}/code-security/configurations/{configuration_id}/attach"],
		createConfiguration: ["POST /orgs/{org}/code-security/configurations"],
		createConfigurationForEnterprise: ["POST /enterprises/{enterprise}/code-security/configurations"],
		deleteConfiguration: ["DELETE /orgs/{org}/code-security/configurations/{configuration_id}"],
		deleteConfigurationForEnterprise: ["DELETE /enterprises/{enterprise}/code-security/configurations/{configuration_id}"],
		detachConfiguration: ["DELETE /orgs/{org}/code-security/configurations/detach"],
		getConfiguration: ["GET /orgs/{org}/code-security/configurations/{configuration_id}"],
		getConfigurationForRepository: ["GET /repos/{owner}/{repo}/code-security-configuration"],
		getConfigurationsForEnterprise: ["GET /enterprises/{enterprise}/code-security/configurations"],
		getConfigurationsForOrg: ["GET /orgs/{org}/code-security/configurations"],
		getDefaultConfigurations: ["GET /orgs/{org}/code-security/configurations/defaults"],
		getDefaultConfigurationsForEnterprise: ["GET /enterprises/{enterprise}/code-security/configurations/defaults"],
		getRepositoriesForConfiguration: ["GET /orgs/{org}/code-security/configurations/{configuration_id}/repositories"],
		getRepositoriesForEnterpriseConfiguration: ["GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}/repositories"],
		getSingleConfigurationForEnterprise: ["GET /enterprises/{enterprise}/code-security/configurations/{configuration_id}"],
		setConfigurationAsDefault: ["PUT /orgs/{org}/code-security/configurations/{configuration_id}/defaults"],
		setConfigurationAsDefaultForEnterprise: ["PUT /enterprises/{enterprise}/code-security/configurations/{configuration_id}/defaults"],
		updateConfiguration: ["PATCH /orgs/{org}/code-security/configurations/{configuration_id}"],
		updateEnterpriseConfiguration: ["PATCH /enterprises/{enterprise}/code-security/configurations/{configuration_id}"]
	},
	codesOfConduct: {
		getAllCodesOfConduct: ["GET /codes_of_conduct"],
		getConductCode: ["GET /codes_of_conduct/{key}"]
	},
	codespaces: {
		addRepositoryForSecretForAuthenticatedUser: ["PUT /user/codespaces/secrets/{secret_name}/repositories/{repository_id}"],
		addSelectedRepoToOrgSecret: ["PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}"],
		checkPermissionsForDevcontainer: ["GET /repos/{owner}/{repo}/codespaces/permissions_check"],
		codespaceMachinesForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}/machines"],
		createForAuthenticatedUser: ["POST /user/codespaces"],
		createOrUpdateOrgSecret: ["PUT /orgs/{org}/codespaces/secrets/{secret_name}"],
		createOrUpdateRepoSecret: ["PUT /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"],
		createOrUpdateSecretForAuthenticatedUser: ["PUT /user/codespaces/secrets/{secret_name}"],
		createWithPrForAuthenticatedUser: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/codespaces"],
		createWithRepoForAuthenticatedUser: ["POST /repos/{owner}/{repo}/codespaces"],
		deleteForAuthenticatedUser: ["DELETE /user/codespaces/{codespace_name}"],
		deleteFromOrganization: ["DELETE /orgs/{org}/members/{username}/codespaces/{codespace_name}"],
		deleteOrgSecret: ["DELETE /orgs/{org}/codespaces/secrets/{secret_name}"],
		deleteRepoSecret: ["DELETE /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"],
		deleteSecretForAuthenticatedUser: ["DELETE /user/codespaces/secrets/{secret_name}"],
		exportForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/exports"],
		getCodespacesForUserInOrg: ["GET /orgs/{org}/members/{username}/codespaces"],
		getExportDetailsForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}/exports/{export_id}"],
		getForAuthenticatedUser: ["GET /user/codespaces/{codespace_name}"],
		getOrgPublicKey: ["GET /orgs/{org}/codespaces/secrets/public-key"],
		getOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}"],
		getPublicKeyForAuthenticatedUser: ["GET /user/codespaces/secrets/public-key"],
		getRepoPublicKey: ["GET /repos/{owner}/{repo}/codespaces/secrets/public-key"],
		getRepoSecret: ["GET /repos/{owner}/{repo}/codespaces/secrets/{secret_name}"],
		getSecretForAuthenticatedUser: ["GET /user/codespaces/secrets/{secret_name}"],
		listDevcontainersInRepositoryForAuthenticatedUser: ["GET /repos/{owner}/{repo}/codespaces/devcontainers"],
		listForAuthenticatedUser: ["GET /user/codespaces"],
		listInOrganization: [
			"GET /orgs/{org}/codespaces",
			{},
			{ renamedParameters: { org_id: "org" } }
		],
		listInRepositoryForAuthenticatedUser: ["GET /repos/{owner}/{repo}/codespaces"],
		listOrgSecrets: ["GET /orgs/{org}/codespaces/secrets"],
		listRepoSecrets: ["GET /repos/{owner}/{repo}/codespaces/secrets"],
		listRepositoriesForSecretForAuthenticatedUser: ["GET /user/codespaces/secrets/{secret_name}/repositories"],
		listSecretsForAuthenticatedUser: ["GET /user/codespaces/secrets"],
		listSelectedReposForOrgSecret: ["GET /orgs/{org}/codespaces/secrets/{secret_name}/repositories"],
		preFlightWithRepoForAuthenticatedUser: ["GET /repos/{owner}/{repo}/codespaces/new"],
		publishForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/publish"],
		removeRepositoryForSecretForAuthenticatedUser: ["DELETE /user/codespaces/secrets/{secret_name}/repositories/{repository_id}"],
		removeSelectedRepoFromOrgSecret: ["DELETE /orgs/{org}/codespaces/secrets/{secret_name}/repositories/{repository_id}"],
		repoMachinesForAuthenticatedUser: ["GET /repos/{owner}/{repo}/codespaces/machines"],
		setRepositoriesForSecretForAuthenticatedUser: ["PUT /user/codespaces/secrets/{secret_name}/repositories"],
		setSelectedReposForOrgSecret: ["PUT /orgs/{org}/codespaces/secrets/{secret_name}/repositories"],
		startForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/start"],
		stopForAuthenticatedUser: ["POST /user/codespaces/{codespace_name}/stop"],
		stopInOrganization: ["POST /orgs/{org}/members/{username}/codespaces/{codespace_name}/stop"],
		updateForAuthenticatedUser: ["PATCH /user/codespaces/{codespace_name}"]
	},
	copilot: {
		addCopilotSeatsForTeams: ["POST /orgs/{org}/copilot/billing/selected_teams"],
		addCopilotSeatsForUsers: ["POST /orgs/{org}/copilot/billing/selected_users"],
		cancelCopilotSeatAssignmentForTeams: ["DELETE /orgs/{org}/copilot/billing/selected_teams"],
		cancelCopilotSeatAssignmentForUsers: ["DELETE /orgs/{org}/copilot/billing/selected_users"],
		copilotMetricsForOrganization: ["GET /orgs/{org}/copilot/metrics"],
		copilotMetricsForTeam: ["GET /orgs/{org}/team/{team_slug}/copilot/metrics"],
		getCopilotOrganizationDetails: ["GET /orgs/{org}/copilot/billing"],
		getCopilotSeatDetailsForUser: ["GET /orgs/{org}/members/{username}/copilot"],
		listCopilotSeats: ["GET /orgs/{org}/copilot/billing/seats"]
	},
	credentials: { revoke: ["POST /credentials/revoke"] },
	dependabot: {
		addSelectedRepoToOrgSecret: ["PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}"],
		createOrUpdateOrgSecret: ["PUT /orgs/{org}/dependabot/secrets/{secret_name}"],
		createOrUpdateRepoSecret: ["PUT /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"],
		deleteOrgSecret: ["DELETE /orgs/{org}/dependabot/secrets/{secret_name}"],
		deleteRepoSecret: ["DELETE /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"],
		getAlert: ["GET /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"],
		getOrgPublicKey: ["GET /orgs/{org}/dependabot/secrets/public-key"],
		getOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}"],
		getRepoPublicKey: ["GET /repos/{owner}/{repo}/dependabot/secrets/public-key"],
		getRepoSecret: ["GET /repos/{owner}/{repo}/dependabot/secrets/{secret_name}"],
		listAlertsForEnterprise: ["GET /enterprises/{enterprise}/dependabot/alerts"],
		listAlertsForOrg: ["GET /orgs/{org}/dependabot/alerts"],
		listAlertsForRepo: ["GET /repos/{owner}/{repo}/dependabot/alerts"],
		listOrgSecrets: ["GET /orgs/{org}/dependabot/secrets"],
		listRepoSecrets: ["GET /repos/{owner}/{repo}/dependabot/secrets"],
		listSelectedReposForOrgSecret: ["GET /orgs/{org}/dependabot/secrets/{secret_name}/repositories"],
		removeSelectedRepoFromOrgSecret: ["DELETE /orgs/{org}/dependabot/secrets/{secret_name}/repositories/{repository_id}"],
		repositoryAccessForOrg: ["GET /organizations/{org}/dependabot/repository-access"],
		setRepositoryAccessDefaultLevel: ["PUT /organizations/{org}/dependabot/repository-access/default-level"],
		setSelectedReposForOrgSecret: ["PUT /orgs/{org}/dependabot/secrets/{secret_name}/repositories"],
		updateAlert: ["PATCH /repos/{owner}/{repo}/dependabot/alerts/{alert_number}"],
		updateRepositoryAccessForOrg: ["PATCH /organizations/{org}/dependabot/repository-access"]
	},
	dependencyGraph: {
		createRepositorySnapshot: ["POST /repos/{owner}/{repo}/dependency-graph/snapshots"],
		diffRange: ["GET /repos/{owner}/{repo}/dependency-graph/compare/{basehead}"],
		exportSbom: ["GET /repos/{owner}/{repo}/dependency-graph/sbom"]
	},
	emojis: { get: ["GET /emojis"] },
	enterpriseTeamMemberships: {
		add: ["PUT /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"],
		bulkAdd: ["POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/add"],
		bulkRemove: ["POST /enterprises/{enterprise}/teams/{enterprise-team}/memberships/remove"],
		get: ["GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"],
		list: ["GET /enterprises/{enterprise}/teams/{enterprise-team}/memberships"],
		remove: ["DELETE /enterprises/{enterprise}/teams/{enterprise-team}/memberships/{username}"]
	},
	enterpriseTeamOrganizations: {
		add: ["PUT /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"],
		bulkAdd: ["POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/add"],
		bulkRemove: ["POST /enterprises/{enterprise}/teams/{enterprise-team}/organizations/remove"],
		delete: ["DELETE /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"],
		getAssignment: ["GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations/{org}"],
		getAssignments: ["GET /enterprises/{enterprise}/teams/{enterprise-team}/organizations"]
	},
	enterpriseTeams: {
		create: ["POST /enterprises/{enterprise}/teams"],
		delete: ["DELETE /enterprises/{enterprise}/teams/{team_slug}"],
		get: ["GET /enterprises/{enterprise}/teams/{team_slug}"],
		list: ["GET /enterprises/{enterprise}/teams"],
		update: ["PATCH /enterprises/{enterprise}/teams/{team_slug}"]
	},
	gists: {
		checkIsStarred: ["GET /gists/{gist_id}/star"],
		create: ["POST /gists"],
		createComment: ["POST /gists/{gist_id}/comments"],
		delete: ["DELETE /gists/{gist_id}"],
		deleteComment: ["DELETE /gists/{gist_id}/comments/{comment_id}"],
		fork: ["POST /gists/{gist_id}/forks"],
		get: ["GET /gists/{gist_id}"],
		getComment: ["GET /gists/{gist_id}/comments/{comment_id}"],
		getRevision: ["GET /gists/{gist_id}/{sha}"],
		list: ["GET /gists"],
		listComments: ["GET /gists/{gist_id}/comments"],
		listCommits: ["GET /gists/{gist_id}/commits"],
		listForUser: ["GET /users/{username}/gists"],
		listForks: ["GET /gists/{gist_id}/forks"],
		listPublic: ["GET /gists/public"],
		listStarred: ["GET /gists/starred"],
		star: ["PUT /gists/{gist_id}/star"],
		unstar: ["DELETE /gists/{gist_id}/star"],
		update: ["PATCH /gists/{gist_id}"],
		updateComment: ["PATCH /gists/{gist_id}/comments/{comment_id}"]
	},
	git: {
		createBlob: ["POST /repos/{owner}/{repo}/git/blobs"],
		createCommit: ["POST /repos/{owner}/{repo}/git/commits"],
		createRef: ["POST /repos/{owner}/{repo}/git/refs"],
		createTag: ["POST /repos/{owner}/{repo}/git/tags"],
		createTree: ["POST /repos/{owner}/{repo}/git/trees"],
		deleteRef: ["DELETE /repos/{owner}/{repo}/git/refs/{ref}"],
		getBlob: ["GET /repos/{owner}/{repo}/git/blobs/{file_sha}"],
		getCommit: ["GET /repos/{owner}/{repo}/git/commits/{commit_sha}"],
		getRef: ["GET /repos/{owner}/{repo}/git/ref/{ref}"],
		getTag: ["GET /repos/{owner}/{repo}/git/tags/{tag_sha}"],
		getTree: ["GET /repos/{owner}/{repo}/git/trees/{tree_sha}"],
		listMatchingRefs: ["GET /repos/{owner}/{repo}/git/matching-refs/{ref}"],
		updateRef: ["PATCH /repos/{owner}/{repo}/git/refs/{ref}"]
	},
	gitignore: {
		getAllTemplates: ["GET /gitignore/templates"],
		getTemplate: ["GET /gitignore/templates/{name}"]
	},
	hostedCompute: {
		createNetworkConfigurationForOrg: ["POST /orgs/{org}/settings/network-configurations"],
		deleteNetworkConfigurationFromOrg: ["DELETE /orgs/{org}/settings/network-configurations/{network_configuration_id}"],
		getNetworkConfigurationForOrg: ["GET /orgs/{org}/settings/network-configurations/{network_configuration_id}"],
		getNetworkSettingsForOrg: ["GET /orgs/{org}/settings/network-settings/{network_settings_id}"],
		listNetworkConfigurationsForOrg: ["GET /orgs/{org}/settings/network-configurations"],
		updateNetworkConfigurationForOrg: ["PATCH /orgs/{org}/settings/network-configurations/{network_configuration_id}"]
	},
	interactions: {
		getRestrictionsForAuthenticatedUser: ["GET /user/interaction-limits"],
		getRestrictionsForOrg: ["GET /orgs/{org}/interaction-limits"],
		getRestrictionsForRepo: ["GET /repos/{owner}/{repo}/interaction-limits"],
		getRestrictionsForYourPublicRepos: [
			"GET /user/interaction-limits",
			{},
			{ renamed: ["interactions", "getRestrictionsForAuthenticatedUser"] }
		],
		removeRestrictionsForAuthenticatedUser: ["DELETE /user/interaction-limits"],
		removeRestrictionsForOrg: ["DELETE /orgs/{org}/interaction-limits"],
		removeRestrictionsForRepo: ["DELETE /repos/{owner}/{repo}/interaction-limits"],
		removeRestrictionsForYourPublicRepos: [
			"DELETE /user/interaction-limits",
			{},
			{ renamed: ["interactions", "removeRestrictionsForAuthenticatedUser"] }
		],
		setRestrictionsForAuthenticatedUser: ["PUT /user/interaction-limits"],
		setRestrictionsForOrg: ["PUT /orgs/{org}/interaction-limits"],
		setRestrictionsForRepo: ["PUT /repos/{owner}/{repo}/interaction-limits"],
		setRestrictionsForYourPublicRepos: [
			"PUT /user/interaction-limits",
			{},
			{ renamed: ["interactions", "setRestrictionsForAuthenticatedUser"] }
		]
	},
	issues: {
		addAssignees: ["POST /repos/{owner}/{repo}/issues/{issue_number}/assignees"],
		addBlockedByDependency: ["POST /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by"],
		addLabels: ["POST /repos/{owner}/{repo}/issues/{issue_number}/labels"],
		addSubIssue: ["POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues"],
		checkUserCanBeAssigned: ["GET /repos/{owner}/{repo}/assignees/{assignee}"],
		checkUserCanBeAssignedToIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/assignees/{assignee}"],
		create: ["POST /repos/{owner}/{repo}/issues"],
		createComment: ["POST /repos/{owner}/{repo}/issues/{issue_number}/comments"],
		createLabel: ["POST /repos/{owner}/{repo}/labels"],
		createMilestone: ["POST /repos/{owner}/{repo}/milestones"],
		deleteComment: ["DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}"],
		deleteLabel: ["DELETE /repos/{owner}/{repo}/labels/{name}"],
		deleteMilestone: ["DELETE /repos/{owner}/{repo}/milestones/{milestone_number}"],
		get: ["GET /repos/{owner}/{repo}/issues/{issue_number}"],
		getComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}"],
		getEvent: ["GET /repos/{owner}/{repo}/issues/events/{event_id}"],
		getLabel: ["GET /repos/{owner}/{repo}/labels/{name}"],
		getMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}"],
		getParent: ["GET /repos/{owner}/{repo}/issues/{issue_number}/parent"],
		list: ["GET /issues"],
		listAssignees: ["GET /repos/{owner}/{repo}/assignees"],
		listComments: ["GET /repos/{owner}/{repo}/issues/{issue_number}/comments"],
		listCommentsForRepo: ["GET /repos/{owner}/{repo}/issues/comments"],
		listDependenciesBlockedBy: ["GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by"],
		listDependenciesBlocking: ["GET /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocking"],
		listEvents: ["GET /repos/{owner}/{repo}/issues/{issue_number}/events"],
		listEventsForRepo: ["GET /repos/{owner}/{repo}/issues/events"],
		listEventsForTimeline: ["GET /repos/{owner}/{repo}/issues/{issue_number}/timeline"],
		listForAuthenticatedUser: ["GET /user/issues"],
		listForOrg: ["GET /orgs/{org}/issues"],
		listForRepo: ["GET /repos/{owner}/{repo}/issues"],
		listLabelsForMilestone: ["GET /repos/{owner}/{repo}/milestones/{milestone_number}/labels"],
		listLabelsForRepo: ["GET /repos/{owner}/{repo}/labels"],
		listLabelsOnIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/labels"],
		listMilestones: ["GET /repos/{owner}/{repo}/milestones"],
		listSubIssues: ["GET /repos/{owner}/{repo}/issues/{issue_number}/sub_issues"],
		lock: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/lock"],
		removeAllLabels: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels"],
		removeAssignees: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/assignees"],
		removeDependencyBlockedBy: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/dependencies/blocked_by/{issue_id}"],
		removeLabel: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}"],
		removeSubIssue: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/sub_issue"],
		reprioritizeSubIssue: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}/sub_issues/priority"],
		setLabels: ["PUT /repos/{owner}/{repo}/issues/{issue_number}/labels"],
		unlock: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/lock"],
		update: ["PATCH /repos/{owner}/{repo}/issues/{issue_number}"],
		updateComment: ["PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}"],
		updateLabel: ["PATCH /repos/{owner}/{repo}/labels/{name}"],
		updateMilestone: ["PATCH /repos/{owner}/{repo}/milestones/{milestone_number}"]
	},
	licenses: {
		get: ["GET /licenses/{license}"],
		getAllCommonlyUsed: ["GET /licenses"],
		getForRepo: ["GET /repos/{owner}/{repo}/license"]
	},
	markdown: {
		render: ["POST /markdown"],
		renderRaw: ["POST /markdown/raw", { headers: { "content-type": "text/plain; charset=utf-8" } }]
	},
	meta: {
		get: ["GET /meta"],
		getAllVersions: ["GET /versions"],
		getOctocat: ["GET /octocat"],
		getZen: ["GET /zen"],
		root: ["GET /"]
	},
	migrations: {
		deleteArchiveForAuthenticatedUser: ["DELETE /user/migrations/{migration_id}/archive"],
		deleteArchiveForOrg: ["DELETE /orgs/{org}/migrations/{migration_id}/archive"],
		downloadArchiveForOrg: ["GET /orgs/{org}/migrations/{migration_id}/archive"],
		getArchiveForAuthenticatedUser: ["GET /user/migrations/{migration_id}/archive"],
		getStatusForAuthenticatedUser: ["GET /user/migrations/{migration_id}"],
		getStatusForOrg: ["GET /orgs/{org}/migrations/{migration_id}"],
		listForAuthenticatedUser: ["GET /user/migrations"],
		listForOrg: ["GET /orgs/{org}/migrations"],
		listReposForAuthenticatedUser: ["GET /user/migrations/{migration_id}/repositories"],
		listReposForOrg: ["GET /orgs/{org}/migrations/{migration_id}/repositories"],
		listReposForUser: [
			"GET /user/migrations/{migration_id}/repositories",
			{},
			{ renamed: ["migrations", "listReposForAuthenticatedUser"] }
		],
		startForAuthenticatedUser: ["POST /user/migrations"],
		startForOrg: ["POST /orgs/{org}/migrations"],
		unlockRepoForAuthenticatedUser: ["DELETE /user/migrations/{migration_id}/repos/{repo_name}/lock"],
		unlockRepoForOrg: ["DELETE /orgs/{org}/migrations/{migration_id}/repos/{repo_name}/lock"]
	},
	oidc: {
		getOidcCustomSubTemplateForOrg: ["GET /orgs/{org}/actions/oidc/customization/sub"],
		updateOidcCustomSubTemplateForOrg: ["PUT /orgs/{org}/actions/oidc/customization/sub"]
	},
	orgs: {
		addSecurityManagerTeam: [
			"PUT /orgs/{org}/security-managers/teams/{team_slug}",
			{},
			{ deprecated: "octokit.rest.orgs.addSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#add-a-security-manager-team" }
		],
		assignTeamToOrgRole: ["PUT /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}"],
		assignUserToOrgRole: ["PUT /orgs/{org}/organization-roles/users/{username}/{role_id}"],
		blockUser: ["PUT /orgs/{org}/blocks/{username}"],
		cancelInvitation: ["DELETE /orgs/{org}/invitations/{invitation_id}"],
		checkBlockedUser: ["GET /orgs/{org}/blocks/{username}"],
		checkMembershipForUser: ["GET /orgs/{org}/members/{username}"],
		checkPublicMembershipForUser: ["GET /orgs/{org}/public_members/{username}"],
		convertMemberToOutsideCollaborator: ["PUT /orgs/{org}/outside_collaborators/{username}"],
		createArtifactStorageRecord: ["POST /orgs/{org}/artifacts/metadata/storage-record"],
		createInvitation: ["POST /orgs/{org}/invitations"],
		createIssueType: ["POST /orgs/{org}/issue-types"],
		createWebhook: ["POST /orgs/{org}/hooks"],
		customPropertiesForOrgsCreateOrUpdateOrganizationValues: ["PATCH /organizations/{org}/org-properties/values"],
		customPropertiesForOrgsGetOrganizationValues: ["GET /organizations/{org}/org-properties/values"],
		customPropertiesForReposCreateOrUpdateOrganizationDefinition: ["PUT /orgs/{org}/properties/schema/{custom_property_name}"],
		customPropertiesForReposCreateOrUpdateOrganizationDefinitions: ["PATCH /orgs/{org}/properties/schema"],
		customPropertiesForReposCreateOrUpdateOrganizationValues: ["PATCH /orgs/{org}/properties/values"],
		customPropertiesForReposDeleteOrganizationDefinition: ["DELETE /orgs/{org}/properties/schema/{custom_property_name}"],
		customPropertiesForReposGetOrganizationDefinition: ["GET /orgs/{org}/properties/schema/{custom_property_name}"],
		customPropertiesForReposGetOrganizationDefinitions: ["GET /orgs/{org}/properties/schema"],
		customPropertiesForReposGetOrganizationValues: ["GET /orgs/{org}/properties/values"],
		delete: ["DELETE /orgs/{org}"],
		deleteAttestationsBulk: ["POST /orgs/{org}/attestations/delete-request"],
		deleteAttestationsById: ["DELETE /orgs/{org}/attestations/{attestation_id}"],
		deleteAttestationsBySubjectDigest: ["DELETE /orgs/{org}/attestations/digest/{subject_digest}"],
		deleteIssueType: ["DELETE /orgs/{org}/issue-types/{issue_type_id}"],
		deleteWebhook: ["DELETE /orgs/{org}/hooks/{hook_id}"],
		disableSelectedRepositoryImmutableReleasesOrganization: ["DELETE /orgs/{org}/settings/immutable-releases/repositories/{repository_id}"],
		enableSelectedRepositoryImmutableReleasesOrganization: ["PUT /orgs/{org}/settings/immutable-releases/repositories/{repository_id}"],
		get: ["GET /orgs/{org}"],
		getImmutableReleasesSettings: ["GET /orgs/{org}/settings/immutable-releases"],
		getImmutableReleasesSettingsRepositories: ["GET /orgs/{org}/settings/immutable-releases/repositories"],
		getMembershipForAuthenticatedUser: ["GET /user/memberships/orgs/{org}"],
		getMembershipForUser: ["GET /orgs/{org}/memberships/{username}"],
		getOrgRole: ["GET /orgs/{org}/organization-roles/{role_id}"],
		getOrgRulesetHistory: ["GET /orgs/{org}/rulesets/{ruleset_id}/history"],
		getOrgRulesetVersion: ["GET /orgs/{org}/rulesets/{ruleset_id}/history/{version_id}"],
		getWebhook: ["GET /orgs/{org}/hooks/{hook_id}"],
		getWebhookConfigForOrg: ["GET /orgs/{org}/hooks/{hook_id}/config"],
		getWebhookDelivery: ["GET /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}"],
		list: ["GET /organizations"],
		listAppInstallations: ["GET /orgs/{org}/installations"],
		listArtifactStorageRecords: ["GET /orgs/{org}/artifacts/{subject_digest}/metadata/storage-records"],
		listAttestationRepositories: ["GET /orgs/{org}/attestations/repositories"],
		listAttestations: ["GET /orgs/{org}/attestations/{subject_digest}"],
		listAttestationsBulk: ["POST /orgs/{org}/attestations/bulk-list{?per_page,before,after}"],
		listBlockedUsers: ["GET /orgs/{org}/blocks"],
		listFailedInvitations: ["GET /orgs/{org}/failed_invitations"],
		listForAuthenticatedUser: ["GET /user/orgs"],
		listForUser: ["GET /users/{username}/orgs"],
		listInvitationTeams: ["GET /orgs/{org}/invitations/{invitation_id}/teams"],
		listIssueTypes: ["GET /orgs/{org}/issue-types"],
		listMembers: ["GET /orgs/{org}/members"],
		listMembershipsForAuthenticatedUser: ["GET /user/memberships/orgs"],
		listOrgRoleTeams: ["GET /orgs/{org}/organization-roles/{role_id}/teams"],
		listOrgRoleUsers: ["GET /orgs/{org}/organization-roles/{role_id}/users"],
		listOrgRoles: ["GET /orgs/{org}/organization-roles"],
		listOrganizationFineGrainedPermissions: ["GET /orgs/{org}/organization-fine-grained-permissions"],
		listOutsideCollaborators: ["GET /orgs/{org}/outside_collaborators"],
		listPatGrantRepositories: ["GET /orgs/{org}/personal-access-tokens/{pat_id}/repositories"],
		listPatGrantRequestRepositories: ["GET /orgs/{org}/personal-access-token-requests/{pat_request_id}/repositories"],
		listPatGrantRequests: ["GET /orgs/{org}/personal-access-token-requests"],
		listPatGrants: ["GET /orgs/{org}/personal-access-tokens"],
		listPendingInvitations: ["GET /orgs/{org}/invitations"],
		listPublicMembers: ["GET /orgs/{org}/public_members"],
		listSecurityManagerTeams: [
			"GET /orgs/{org}/security-managers",
			{},
			{ deprecated: "octokit.rest.orgs.listSecurityManagerTeams() is deprecated, see https://docs.github.com/rest/orgs/security-managers#list-security-manager-teams" }
		],
		listWebhookDeliveries: ["GET /orgs/{org}/hooks/{hook_id}/deliveries"],
		listWebhooks: ["GET /orgs/{org}/hooks"],
		pingWebhook: ["POST /orgs/{org}/hooks/{hook_id}/pings"],
		redeliverWebhookDelivery: ["POST /orgs/{org}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"],
		removeMember: ["DELETE /orgs/{org}/members/{username}"],
		removeMembershipForUser: ["DELETE /orgs/{org}/memberships/{username}"],
		removeOutsideCollaborator: ["DELETE /orgs/{org}/outside_collaborators/{username}"],
		removePublicMembershipForAuthenticatedUser: ["DELETE /orgs/{org}/public_members/{username}"],
		removeSecurityManagerTeam: [
			"DELETE /orgs/{org}/security-managers/teams/{team_slug}",
			{},
			{ deprecated: "octokit.rest.orgs.removeSecurityManagerTeam() is deprecated, see https://docs.github.com/rest/orgs/security-managers#remove-a-security-manager-team" }
		],
		reviewPatGrantRequest: ["POST /orgs/{org}/personal-access-token-requests/{pat_request_id}"],
		reviewPatGrantRequestsInBulk: ["POST /orgs/{org}/personal-access-token-requests"],
		revokeAllOrgRolesTeam: ["DELETE /orgs/{org}/organization-roles/teams/{team_slug}"],
		revokeAllOrgRolesUser: ["DELETE /orgs/{org}/organization-roles/users/{username}"],
		revokeOrgRoleTeam: ["DELETE /orgs/{org}/organization-roles/teams/{team_slug}/{role_id}"],
		revokeOrgRoleUser: ["DELETE /orgs/{org}/organization-roles/users/{username}/{role_id}"],
		setImmutableReleasesSettings: ["PUT /orgs/{org}/settings/immutable-releases"],
		setImmutableReleasesSettingsRepositories: ["PUT /orgs/{org}/settings/immutable-releases/repositories"],
		setMembershipForUser: ["PUT /orgs/{org}/memberships/{username}"],
		setPublicMembershipForAuthenticatedUser: ["PUT /orgs/{org}/public_members/{username}"],
		unblockUser: ["DELETE /orgs/{org}/blocks/{username}"],
		update: ["PATCH /orgs/{org}"],
		updateIssueType: ["PUT /orgs/{org}/issue-types/{issue_type_id}"],
		updateMembershipForAuthenticatedUser: ["PATCH /user/memberships/orgs/{org}"],
		updatePatAccess: ["POST /orgs/{org}/personal-access-tokens/{pat_id}"],
		updatePatAccesses: ["POST /orgs/{org}/personal-access-tokens"],
		updateWebhook: ["PATCH /orgs/{org}/hooks/{hook_id}"],
		updateWebhookConfigForOrg: ["PATCH /orgs/{org}/hooks/{hook_id}/config"]
	},
	packages: {
		deletePackageForAuthenticatedUser: ["DELETE /user/packages/{package_type}/{package_name}"],
		deletePackageForOrg: ["DELETE /orgs/{org}/packages/{package_type}/{package_name}"],
		deletePackageForUser: ["DELETE /users/{username}/packages/{package_type}/{package_name}"],
		deletePackageVersionForAuthenticatedUser: ["DELETE /user/packages/{package_type}/{package_name}/versions/{package_version_id}"],
		deletePackageVersionForOrg: ["DELETE /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
		deletePackageVersionForUser: ["DELETE /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
		getAllPackageVersionsForAPackageOwnedByAnOrg: [
			"GET /orgs/{org}/packages/{package_type}/{package_name}/versions",
			{},
			{ renamed: ["packages", "getAllPackageVersionsForPackageOwnedByOrg"] }
		],
		getAllPackageVersionsForAPackageOwnedByTheAuthenticatedUser: [
			"GET /user/packages/{package_type}/{package_name}/versions",
			{},
			{ renamed: ["packages", "getAllPackageVersionsForPackageOwnedByAuthenticatedUser"] }
		],
		getAllPackageVersionsForPackageOwnedByAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}/versions"],
		getAllPackageVersionsForPackageOwnedByOrg: ["GET /orgs/{org}/packages/{package_type}/{package_name}/versions"],
		getAllPackageVersionsForPackageOwnedByUser: ["GET /users/{username}/packages/{package_type}/{package_name}/versions"],
		getPackageForAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}"],
		getPackageForOrganization: ["GET /orgs/{org}/packages/{package_type}/{package_name}"],
		getPackageForUser: ["GET /users/{username}/packages/{package_type}/{package_name}"],
		getPackageVersionForAuthenticatedUser: ["GET /user/packages/{package_type}/{package_name}/versions/{package_version_id}"],
		getPackageVersionForOrganization: ["GET /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
		getPackageVersionForUser: ["GET /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}"],
		listDockerMigrationConflictingPackagesForAuthenticatedUser: ["GET /user/docker/conflicts"],
		listDockerMigrationConflictingPackagesForOrganization: ["GET /orgs/{org}/docker/conflicts"],
		listDockerMigrationConflictingPackagesForUser: ["GET /users/{username}/docker/conflicts"],
		listPackagesForAuthenticatedUser: ["GET /user/packages"],
		listPackagesForOrganization: ["GET /orgs/{org}/packages"],
		listPackagesForUser: ["GET /users/{username}/packages"],
		restorePackageForAuthenticatedUser: ["POST /user/packages/{package_type}/{package_name}/restore{?token}"],
		restorePackageForOrg: ["POST /orgs/{org}/packages/{package_type}/{package_name}/restore{?token}"],
		restorePackageForUser: ["POST /users/{username}/packages/{package_type}/{package_name}/restore{?token}"],
		restorePackageVersionForAuthenticatedUser: ["POST /user/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"],
		restorePackageVersionForOrg: ["POST /orgs/{org}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"],
		restorePackageVersionForUser: ["POST /users/{username}/packages/{package_type}/{package_name}/versions/{package_version_id}/restore"]
	},
	privateRegistries: {
		createOrgPrivateRegistry: ["POST /orgs/{org}/private-registries"],
		deleteOrgPrivateRegistry: ["DELETE /orgs/{org}/private-registries/{secret_name}"],
		getOrgPrivateRegistry: ["GET /orgs/{org}/private-registries/{secret_name}"],
		getOrgPublicKey: ["GET /orgs/{org}/private-registries/public-key"],
		listOrgPrivateRegistries: ["GET /orgs/{org}/private-registries"],
		updateOrgPrivateRegistry: ["PATCH /orgs/{org}/private-registries/{secret_name}"]
	},
	projects: {
		addItemForOrg: ["POST /orgs/{org}/projectsV2/{project_number}/items"],
		addItemForUser: ["POST /users/{username}/projectsV2/{project_number}/items"],
		deleteItemForOrg: ["DELETE /orgs/{org}/projectsV2/{project_number}/items/{item_id}"],
		deleteItemForUser: ["DELETE /users/{username}/projectsV2/{project_number}/items/{item_id}"],
		getFieldForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/fields/{field_id}"],
		getFieldForUser: ["GET /users/{username}/projectsV2/{project_number}/fields/{field_id}"],
		getForOrg: ["GET /orgs/{org}/projectsV2/{project_number}"],
		getForUser: ["GET /users/{username}/projectsV2/{project_number}"],
		getOrgItem: ["GET /orgs/{org}/projectsV2/{project_number}/items/{item_id}"],
		getUserItem: ["GET /users/{username}/projectsV2/{project_number}/items/{item_id}"],
		listFieldsForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/fields"],
		listFieldsForUser: ["GET /users/{username}/projectsV2/{project_number}/fields"],
		listForOrg: ["GET /orgs/{org}/projectsV2"],
		listForUser: ["GET /users/{username}/projectsV2"],
		listItemsForOrg: ["GET /orgs/{org}/projectsV2/{project_number}/items"],
		listItemsForUser: ["GET /users/{username}/projectsV2/{project_number}/items"],
		updateItemForOrg: ["PATCH /orgs/{org}/projectsV2/{project_number}/items/{item_id}"],
		updateItemForUser: ["PATCH /users/{username}/projectsV2/{project_number}/items/{item_id}"]
	},
	pulls: {
		checkIfMerged: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
		create: ["POST /repos/{owner}/{repo}/pulls"],
		createReplyForReviewComment: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies"],
		createReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
		createReviewComment: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/comments"],
		deletePendingReview: ["DELETE /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"],
		deleteReviewComment: ["DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
		dismissReview: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/dismissals"],
		get: ["GET /repos/{owner}/{repo}/pulls/{pull_number}"],
		getReview: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"],
		getReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}"],
		list: ["GET /repos/{owner}/{repo}/pulls"],
		listCommentsForReview: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/comments"],
		listCommits: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/commits"],
		listFiles: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/files"],
		listRequestedReviewers: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"],
		listReviewComments: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/comments"],
		listReviewCommentsForRepo: ["GET /repos/{owner}/{repo}/pulls/comments"],
		listReviews: ["GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews"],
		merge: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge"],
		removeRequestedReviewers: ["DELETE /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"],
		requestReviewers: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers"],
		submitReview: ["POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}/events"],
		update: ["PATCH /repos/{owner}/{repo}/pulls/{pull_number}"],
		updateBranch: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/update-branch"],
		updateReview: ["PUT /repos/{owner}/{repo}/pulls/{pull_number}/reviews/{review_id}"],
		updateReviewComment: ["PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}"]
	},
	rateLimit: { get: ["GET /rate_limit"] },
	reactions: {
		createForCommitComment: ["POST /repos/{owner}/{repo}/comments/{comment_id}/reactions"],
		createForIssue: ["POST /repos/{owner}/{repo}/issues/{issue_number}/reactions"],
		createForIssueComment: ["POST /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions"],
		createForPullRequestReviewComment: ["POST /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions"],
		createForRelease: ["POST /repos/{owner}/{repo}/releases/{release_id}/reactions"],
		createForTeamDiscussionCommentInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions"],
		createForTeamDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions"],
		deleteForCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}/reactions/{reaction_id}"],
		deleteForIssue: ["DELETE /repos/{owner}/{repo}/issues/{issue_number}/reactions/{reaction_id}"],
		deleteForIssueComment: ["DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions/{reaction_id}"],
		deleteForPullRequestComment: ["DELETE /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions/{reaction_id}"],
		deleteForRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}/reactions/{reaction_id}"],
		deleteForTeamDiscussion: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions/{reaction_id}"],
		deleteForTeamDiscussionComment: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions/{reaction_id}"],
		listForCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}/reactions"],
		listForIssue: ["GET /repos/{owner}/{repo}/issues/{issue_number}/reactions"],
		listForIssueComment: ["GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions"],
		listForPullRequestReviewComment: ["GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions"],
		listForRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}/reactions"],
		listForTeamDiscussionCommentInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}/reactions"],
		listForTeamDiscussionInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/reactions"]
	},
	repos: {
		acceptInvitation: [
			"PATCH /user/repository_invitations/{invitation_id}",
			{},
			{ renamed: ["repos", "acceptInvitationForAuthenticatedUser"] }
		],
		acceptInvitationForAuthenticatedUser: ["PATCH /user/repository_invitations/{invitation_id}"],
		addAppAccessRestrictions: [
			"POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
			{},
			{ mapToData: "apps" }
		],
		addCollaborator: ["PUT /repos/{owner}/{repo}/collaborators/{username}"],
		addStatusCheckContexts: [
			"POST /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
			{},
			{ mapToData: "contexts" }
		],
		addTeamAccessRestrictions: [
			"POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
			{},
			{ mapToData: "teams" }
		],
		addUserAccessRestrictions: [
			"POST /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
			{},
			{ mapToData: "users" }
		],
		cancelPagesDeployment: ["POST /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}/cancel"],
		checkAutomatedSecurityFixes: ["GET /repos/{owner}/{repo}/automated-security-fixes"],
		checkCollaborator: ["GET /repos/{owner}/{repo}/collaborators/{username}"],
		checkImmutableReleases: ["GET /repos/{owner}/{repo}/immutable-releases"],
		checkPrivateVulnerabilityReporting: ["GET /repos/{owner}/{repo}/private-vulnerability-reporting"],
		checkVulnerabilityAlerts: ["GET /repos/{owner}/{repo}/vulnerability-alerts"],
		codeownersErrors: ["GET /repos/{owner}/{repo}/codeowners/errors"],
		compareCommits: ["GET /repos/{owner}/{repo}/compare/{base}...{head}"],
		compareCommitsWithBasehead: ["GET /repos/{owner}/{repo}/compare/{basehead}"],
		createAttestation: ["POST /repos/{owner}/{repo}/attestations"],
		createAutolink: ["POST /repos/{owner}/{repo}/autolinks"],
		createCommitComment: ["POST /repos/{owner}/{repo}/commits/{commit_sha}/comments"],
		createCommitSignatureProtection: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"],
		createCommitStatus: ["POST /repos/{owner}/{repo}/statuses/{sha}"],
		createDeployKey: ["POST /repos/{owner}/{repo}/keys"],
		createDeployment: ["POST /repos/{owner}/{repo}/deployments"],
		createDeploymentBranchPolicy: ["POST /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies"],
		createDeploymentProtectionRule: ["POST /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules"],
		createDeploymentStatus: ["POST /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"],
		createDispatchEvent: ["POST /repos/{owner}/{repo}/dispatches"],
		createForAuthenticatedUser: ["POST /user/repos"],
		createFork: ["POST /repos/{owner}/{repo}/forks"],
		createInOrg: ["POST /orgs/{org}/repos"],
		createOrUpdateEnvironment: ["PUT /repos/{owner}/{repo}/environments/{environment_name}"],
		createOrUpdateFileContents: ["PUT /repos/{owner}/{repo}/contents/{path}"],
		createOrgRuleset: ["POST /orgs/{org}/rulesets"],
		createPagesDeployment: ["POST /repos/{owner}/{repo}/pages/deployments"],
		createPagesSite: ["POST /repos/{owner}/{repo}/pages"],
		createRelease: ["POST /repos/{owner}/{repo}/releases"],
		createRepoRuleset: ["POST /repos/{owner}/{repo}/rulesets"],
		createUsingTemplate: ["POST /repos/{template_owner}/{template_repo}/generate"],
		createWebhook: ["POST /repos/{owner}/{repo}/hooks"],
		customPropertiesForReposCreateOrUpdateRepositoryValues: ["PATCH /repos/{owner}/{repo}/properties/values"],
		customPropertiesForReposGetRepositoryValues: ["GET /repos/{owner}/{repo}/properties/values"],
		declineInvitation: [
			"DELETE /user/repository_invitations/{invitation_id}",
			{},
			{ renamed: ["repos", "declineInvitationForAuthenticatedUser"] }
		],
		declineInvitationForAuthenticatedUser: ["DELETE /user/repository_invitations/{invitation_id}"],
		delete: ["DELETE /repos/{owner}/{repo}"],
		deleteAccessRestrictions: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"],
		deleteAdminBranchProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"],
		deleteAnEnvironment: ["DELETE /repos/{owner}/{repo}/environments/{environment_name}"],
		deleteAutolink: ["DELETE /repos/{owner}/{repo}/autolinks/{autolink_id}"],
		deleteBranchProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection"],
		deleteCommitComment: ["DELETE /repos/{owner}/{repo}/comments/{comment_id}"],
		deleteCommitSignatureProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"],
		deleteDeployKey: ["DELETE /repos/{owner}/{repo}/keys/{key_id}"],
		deleteDeployment: ["DELETE /repos/{owner}/{repo}/deployments/{deployment_id}"],
		deleteDeploymentBranchPolicy: ["DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"],
		deleteFile: ["DELETE /repos/{owner}/{repo}/contents/{path}"],
		deleteInvitation: ["DELETE /repos/{owner}/{repo}/invitations/{invitation_id}"],
		deleteOrgRuleset: ["DELETE /orgs/{org}/rulesets/{ruleset_id}"],
		deletePagesSite: ["DELETE /repos/{owner}/{repo}/pages"],
		deletePullRequestReviewProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"],
		deleteRelease: ["DELETE /repos/{owner}/{repo}/releases/{release_id}"],
		deleteReleaseAsset: ["DELETE /repos/{owner}/{repo}/releases/assets/{asset_id}"],
		deleteRepoRuleset: ["DELETE /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
		deleteWebhook: ["DELETE /repos/{owner}/{repo}/hooks/{hook_id}"],
		disableAutomatedSecurityFixes: ["DELETE /repos/{owner}/{repo}/automated-security-fixes"],
		disableDeploymentProtectionRule: ["DELETE /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}"],
		disableImmutableReleases: ["DELETE /repos/{owner}/{repo}/immutable-releases"],
		disablePrivateVulnerabilityReporting: ["DELETE /repos/{owner}/{repo}/private-vulnerability-reporting"],
		disableVulnerabilityAlerts: ["DELETE /repos/{owner}/{repo}/vulnerability-alerts"],
		downloadArchive: [
			"GET /repos/{owner}/{repo}/zipball/{ref}",
			{},
			{ renamed: ["repos", "downloadZipballArchive"] }
		],
		downloadTarballArchive: ["GET /repos/{owner}/{repo}/tarball/{ref}"],
		downloadZipballArchive: ["GET /repos/{owner}/{repo}/zipball/{ref}"],
		enableAutomatedSecurityFixes: ["PUT /repos/{owner}/{repo}/automated-security-fixes"],
		enableImmutableReleases: ["PUT /repos/{owner}/{repo}/immutable-releases"],
		enablePrivateVulnerabilityReporting: ["PUT /repos/{owner}/{repo}/private-vulnerability-reporting"],
		enableVulnerabilityAlerts: ["PUT /repos/{owner}/{repo}/vulnerability-alerts"],
		generateReleaseNotes: ["POST /repos/{owner}/{repo}/releases/generate-notes"],
		get: ["GET /repos/{owner}/{repo}"],
		getAccessRestrictions: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions"],
		getAdminBranchProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"],
		getAllDeploymentProtectionRules: ["GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules"],
		getAllEnvironments: ["GET /repos/{owner}/{repo}/environments"],
		getAllStatusCheckContexts: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts"],
		getAllTopics: ["GET /repos/{owner}/{repo}/topics"],
		getAppsWithAccessToProtectedBranch: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps"],
		getAutolink: ["GET /repos/{owner}/{repo}/autolinks/{autolink_id}"],
		getBranch: ["GET /repos/{owner}/{repo}/branches/{branch}"],
		getBranchProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection"],
		getBranchRules: ["GET /repos/{owner}/{repo}/rules/branches/{branch}"],
		getClones: ["GET /repos/{owner}/{repo}/traffic/clones"],
		getCodeFrequencyStats: ["GET /repos/{owner}/{repo}/stats/code_frequency"],
		getCollaboratorPermissionLevel: ["GET /repos/{owner}/{repo}/collaborators/{username}/permission"],
		getCombinedStatusForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/status"],
		getCommit: ["GET /repos/{owner}/{repo}/commits/{ref}"],
		getCommitActivityStats: ["GET /repos/{owner}/{repo}/stats/commit_activity"],
		getCommitComment: ["GET /repos/{owner}/{repo}/comments/{comment_id}"],
		getCommitSignatureProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_signatures"],
		getCommunityProfileMetrics: ["GET /repos/{owner}/{repo}/community/profile"],
		getContent: ["GET /repos/{owner}/{repo}/contents/{path}"],
		getContributorsStats: ["GET /repos/{owner}/{repo}/stats/contributors"],
		getCustomDeploymentProtectionRule: ["GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/{protection_rule_id}"],
		getDeployKey: ["GET /repos/{owner}/{repo}/keys/{key_id}"],
		getDeployment: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}"],
		getDeploymentBranchPolicy: ["GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"],
		getDeploymentStatus: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses/{status_id}"],
		getEnvironment: ["GET /repos/{owner}/{repo}/environments/{environment_name}"],
		getLatestPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/latest"],
		getLatestRelease: ["GET /repos/{owner}/{repo}/releases/latest"],
		getOrgRuleSuite: ["GET /orgs/{org}/rulesets/rule-suites/{rule_suite_id}"],
		getOrgRuleSuites: ["GET /orgs/{org}/rulesets/rule-suites"],
		getOrgRuleset: ["GET /orgs/{org}/rulesets/{ruleset_id}"],
		getOrgRulesets: ["GET /orgs/{org}/rulesets"],
		getPages: ["GET /repos/{owner}/{repo}/pages"],
		getPagesBuild: ["GET /repos/{owner}/{repo}/pages/builds/{build_id}"],
		getPagesDeployment: ["GET /repos/{owner}/{repo}/pages/deployments/{pages_deployment_id}"],
		getPagesHealthCheck: ["GET /repos/{owner}/{repo}/pages/health"],
		getParticipationStats: ["GET /repos/{owner}/{repo}/stats/participation"],
		getPullRequestReviewProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"],
		getPunchCardStats: ["GET /repos/{owner}/{repo}/stats/punch_card"],
		getReadme: ["GET /repos/{owner}/{repo}/readme"],
		getReadmeInDirectory: ["GET /repos/{owner}/{repo}/readme/{dir}"],
		getRelease: ["GET /repos/{owner}/{repo}/releases/{release_id}"],
		getReleaseAsset: ["GET /repos/{owner}/{repo}/releases/assets/{asset_id}"],
		getReleaseByTag: ["GET /repos/{owner}/{repo}/releases/tags/{tag}"],
		getRepoRuleSuite: ["GET /repos/{owner}/{repo}/rulesets/rule-suites/{rule_suite_id}"],
		getRepoRuleSuites: ["GET /repos/{owner}/{repo}/rulesets/rule-suites"],
		getRepoRuleset: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
		getRepoRulesetHistory: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history"],
		getRepoRulesetVersion: ["GET /repos/{owner}/{repo}/rulesets/{ruleset_id}/history/{version_id}"],
		getRepoRulesets: ["GET /repos/{owner}/{repo}/rulesets"],
		getStatusChecksProtection: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"],
		getTeamsWithAccessToProtectedBranch: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams"],
		getTopPaths: ["GET /repos/{owner}/{repo}/traffic/popular/paths"],
		getTopReferrers: ["GET /repos/{owner}/{repo}/traffic/popular/referrers"],
		getUsersWithAccessToProtectedBranch: ["GET /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users"],
		getViews: ["GET /repos/{owner}/{repo}/traffic/views"],
		getWebhook: ["GET /repos/{owner}/{repo}/hooks/{hook_id}"],
		getWebhookConfigForRepo: ["GET /repos/{owner}/{repo}/hooks/{hook_id}/config"],
		getWebhookDelivery: ["GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}"],
		listActivities: ["GET /repos/{owner}/{repo}/activity"],
		listAttestations: ["GET /repos/{owner}/{repo}/attestations/{subject_digest}"],
		listAutolinks: ["GET /repos/{owner}/{repo}/autolinks"],
		listBranches: ["GET /repos/{owner}/{repo}/branches"],
		listBranchesForHeadCommit: ["GET /repos/{owner}/{repo}/commits/{commit_sha}/branches-where-head"],
		listCollaborators: ["GET /repos/{owner}/{repo}/collaborators"],
		listCommentsForCommit: ["GET /repos/{owner}/{repo}/commits/{commit_sha}/comments"],
		listCommitCommentsForRepo: ["GET /repos/{owner}/{repo}/comments"],
		listCommitStatusesForRef: ["GET /repos/{owner}/{repo}/commits/{ref}/statuses"],
		listCommits: ["GET /repos/{owner}/{repo}/commits"],
		listContributors: ["GET /repos/{owner}/{repo}/contributors"],
		listCustomDeploymentRuleIntegrations: ["GET /repos/{owner}/{repo}/environments/{environment_name}/deployment_protection_rules/apps"],
		listDeployKeys: ["GET /repos/{owner}/{repo}/keys"],
		listDeploymentBranchPolicies: ["GET /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies"],
		listDeploymentStatuses: ["GET /repos/{owner}/{repo}/deployments/{deployment_id}/statuses"],
		listDeployments: ["GET /repos/{owner}/{repo}/deployments"],
		listForAuthenticatedUser: ["GET /user/repos"],
		listForOrg: ["GET /orgs/{org}/repos"],
		listForUser: ["GET /users/{username}/repos"],
		listForks: ["GET /repos/{owner}/{repo}/forks"],
		listInvitations: ["GET /repos/{owner}/{repo}/invitations"],
		listInvitationsForAuthenticatedUser: ["GET /user/repository_invitations"],
		listLanguages: ["GET /repos/{owner}/{repo}/languages"],
		listPagesBuilds: ["GET /repos/{owner}/{repo}/pages/builds"],
		listPublic: ["GET /repositories"],
		listPullRequestsAssociatedWithCommit: ["GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls"],
		listReleaseAssets: ["GET /repos/{owner}/{repo}/releases/{release_id}/assets"],
		listReleases: ["GET /repos/{owner}/{repo}/releases"],
		listTags: ["GET /repos/{owner}/{repo}/tags"],
		listTeams: ["GET /repos/{owner}/{repo}/teams"],
		listWebhookDeliveries: ["GET /repos/{owner}/{repo}/hooks/{hook_id}/deliveries"],
		listWebhooks: ["GET /repos/{owner}/{repo}/hooks"],
		merge: ["POST /repos/{owner}/{repo}/merges"],
		mergeUpstream: ["POST /repos/{owner}/{repo}/merge-upstream"],
		pingWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/pings"],
		redeliverWebhookDelivery: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/deliveries/{delivery_id}/attempts"],
		removeAppAccessRestrictions: [
			"DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
			{},
			{ mapToData: "apps" }
		],
		removeCollaborator: ["DELETE /repos/{owner}/{repo}/collaborators/{username}"],
		removeStatusCheckContexts: [
			"DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
			{},
			{ mapToData: "contexts" }
		],
		removeStatusCheckProtection: ["DELETE /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"],
		removeTeamAccessRestrictions: [
			"DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
			{},
			{ mapToData: "teams" }
		],
		removeUserAccessRestrictions: [
			"DELETE /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
			{},
			{ mapToData: "users" }
		],
		renameBranch: ["POST /repos/{owner}/{repo}/branches/{branch}/rename"],
		replaceAllTopics: ["PUT /repos/{owner}/{repo}/topics"],
		requestPagesBuild: ["POST /repos/{owner}/{repo}/pages/builds"],
		setAdminBranchProtection: ["POST /repos/{owner}/{repo}/branches/{branch}/protection/enforce_admins"],
		setAppAccessRestrictions: [
			"PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/apps",
			{},
			{ mapToData: "apps" }
		],
		setStatusCheckContexts: [
			"PUT /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks/contexts",
			{},
			{ mapToData: "contexts" }
		],
		setTeamAccessRestrictions: [
			"PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/teams",
			{},
			{ mapToData: "teams" }
		],
		setUserAccessRestrictions: [
			"PUT /repos/{owner}/{repo}/branches/{branch}/protection/restrictions/users",
			{},
			{ mapToData: "users" }
		],
		testPushWebhook: ["POST /repos/{owner}/{repo}/hooks/{hook_id}/tests"],
		transfer: ["POST /repos/{owner}/{repo}/transfer"],
		update: ["PATCH /repos/{owner}/{repo}"],
		updateBranchProtection: ["PUT /repos/{owner}/{repo}/branches/{branch}/protection"],
		updateCommitComment: ["PATCH /repos/{owner}/{repo}/comments/{comment_id}"],
		updateDeploymentBranchPolicy: ["PUT /repos/{owner}/{repo}/environments/{environment_name}/deployment-branch-policies/{branch_policy_id}"],
		updateInformationAboutPagesSite: ["PUT /repos/{owner}/{repo}/pages"],
		updateInvitation: ["PATCH /repos/{owner}/{repo}/invitations/{invitation_id}"],
		updateOrgRuleset: ["PUT /orgs/{org}/rulesets/{ruleset_id}"],
		updatePullRequestReviewProtection: ["PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_pull_request_reviews"],
		updateRelease: ["PATCH /repos/{owner}/{repo}/releases/{release_id}"],
		updateReleaseAsset: ["PATCH /repos/{owner}/{repo}/releases/assets/{asset_id}"],
		updateRepoRuleset: ["PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}"],
		updateStatusCheckPotection: [
			"PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks",
			{},
			{ renamed: ["repos", "updateStatusCheckProtection"] }
		],
		updateStatusCheckProtection: ["PATCH /repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks"],
		updateWebhook: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}"],
		updateWebhookConfigForRepo: ["PATCH /repos/{owner}/{repo}/hooks/{hook_id}/config"],
		uploadReleaseAsset: ["POST /repos/{owner}/{repo}/releases/{release_id}/assets{?name,label}", { baseUrl: "https://uploads.github.com" }]
	},
	search: {
		code: ["GET /search/code"],
		commits: ["GET /search/commits"],
		issuesAndPullRequests: ["GET /search/issues"],
		labels: ["GET /search/labels"],
		repos: ["GET /search/repositories"],
		topics: ["GET /search/topics"],
		users: ["GET /search/users"]
	},
	secretScanning: {
		createPushProtectionBypass: ["POST /repos/{owner}/{repo}/secret-scanning/push-protection-bypasses"],
		getAlert: ["GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"],
		getScanHistory: ["GET /repos/{owner}/{repo}/secret-scanning/scan-history"],
		listAlertsForOrg: ["GET /orgs/{org}/secret-scanning/alerts"],
		listAlertsForRepo: ["GET /repos/{owner}/{repo}/secret-scanning/alerts"],
		listLocationsForAlert: ["GET /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}/locations"],
		listOrgPatternConfigs: ["GET /orgs/{org}/secret-scanning/pattern-configurations"],
		updateAlert: ["PATCH /repos/{owner}/{repo}/secret-scanning/alerts/{alert_number}"],
		updateOrgPatternConfigs: ["PATCH /orgs/{org}/secret-scanning/pattern-configurations"]
	},
	securityAdvisories: {
		createFork: ["POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/forks"],
		createPrivateVulnerabilityReport: ["POST /repos/{owner}/{repo}/security-advisories/reports"],
		createRepositoryAdvisory: ["POST /repos/{owner}/{repo}/security-advisories"],
		createRepositoryAdvisoryCveRequest: ["POST /repos/{owner}/{repo}/security-advisories/{ghsa_id}/cve"],
		getGlobalAdvisory: ["GET /advisories/{ghsa_id}"],
		getRepositoryAdvisory: ["GET /repos/{owner}/{repo}/security-advisories/{ghsa_id}"],
		listGlobalAdvisories: ["GET /advisories"],
		listOrgRepositoryAdvisories: ["GET /orgs/{org}/security-advisories"],
		listRepositoryAdvisories: ["GET /repos/{owner}/{repo}/security-advisories"],
		updateRepositoryAdvisory: ["PATCH /repos/{owner}/{repo}/security-advisories/{ghsa_id}"]
	},
	teams: {
		addOrUpdateMembershipForUserInOrg: ["PUT /orgs/{org}/teams/{team_slug}/memberships/{username}"],
		addOrUpdateRepoPermissionsInOrg: ["PUT /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"],
		checkPermissionsForRepoInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"],
		create: ["POST /orgs/{org}/teams"],
		createDiscussionCommentInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"],
		createDiscussionInOrg: ["POST /orgs/{org}/teams/{team_slug}/discussions"],
		deleteDiscussionCommentInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"],
		deleteDiscussionInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"],
		deleteInOrg: ["DELETE /orgs/{org}/teams/{team_slug}"],
		getByName: ["GET /orgs/{org}/teams/{team_slug}"],
		getDiscussionCommentInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"],
		getDiscussionInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"],
		getMembershipForUserInOrg: ["GET /orgs/{org}/teams/{team_slug}/memberships/{username}"],
		list: ["GET /orgs/{org}/teams"],
		listChildInOrg: ["GET /orgs/{org}/teams/{team_slug}/teams"],
		listDiscussionCommentsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments"],
		listDiscussionsInOrg: ["GET /orgs/{org}/teams/{team_slug}/discussions"],
		listForAuthenticatedUser: ["GET /user/teams"],
		listMembersInOrg: ["GET /orgs/{org}/teams/{team_slug}/members"],
		listPendingInvitationsInOrg: ["GET /orgs/{org}/teams/{team_slug}/invitations"],
		listReposInOrg: ["GET /orgs/{org}/teams/{team_slug}/repos"],
		removeMembershipForUserInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/memberships/{username}"],
		removeRepoInOrg: ["DELETE /orgs/{org}/teams/{team_slug}/repos/{owner}/{repo}"],
		updateDiscussionCommentInOrg: ["PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}/comments/{comment_number}"],
		updateDiscussionInOrg: ["PATCH /orgs/{org}/teams/{team_slug}/discussions/{discussion_number}"],
		updateInOrg: ["PATCH /orgs/{org}/teams/{team_slug}"]
	},
	users: {
		addEmailForAuthenticated: [
			"POST /user/emails",
			{},
			{ renamed: ["users", "addEmailForAuthenticatedUser"] }
		],
		addEmailForAuthenticatedUser: ["POST /user/emails"],
		addSocialAccountForAuthenticatedUser: ["POST /user/social_accounts"],
		block: ["PUT /user/blocks/{username}"],
		checkBlocked: ["GET /user/blocks/{username}"],
		checkFollowingForUser: ["GET /users/{username}/following/{target_user}"],
		checkPersonIsFollowedByAuthenticated: ["GET /user/following/{username}"],
		createGpgKeyForAuthenticated: [
			"POST /user/gpg_keys",
			{},
			{ renamed: ["users", "createGpgKeyForAuthenticatedUser"] }
		],
		createGpgKeyForAuthenticatedUser: ["POST /user/gpg_keys"],
		createPublicSshKeyForAuthenticated: [
			"POST /user/keys",
			{},
			{ renamed: ["users", "createPublicSshKeyForAuthenticatedUser"] }
		],
		createPublicSshKeyForAuthenticatedUser: ["POST /user/keys"],
		createSshSigningKeyForAuthenticatedUser: ["POST /user/ssh_signing_keys"],
		deleteAttestationsBulk: ["POST /users/{username}/attestations/delete-request"],
		deleteAttestationsById: ["DELETE /users/{username}/attestations/{attestation_id}"],
		deleteAttestationsBySubjectDigest: ["DELETE /users/{username}/attestations/digest/{subject_digest}"],
		deleteEmailForAuthenticated: [
			"DELETE /user/emails",
			{},
			{ renamed: ["users", "deleteEmailForAuthenticatedUser"] }
		],
		deleteEmailForAuthenticatedUser: ["DELETE /user/emails"],
		deleteGpgKeyForAuthenticated: [
			"DELETE /user/gpg_keys/{gpg_key_id}",
			{},
			{ renamed: ["users", "deleteGpgKeyForAuthenticatedUser"] }
		],
		deleteGpgKeyForAuthenticatedUser: ["DELETE /user/gpg_keys/{gpg_key_id}"],
		deletePublicSshKeyForAuthenticated: [
			"DELETE /user/keys/{key_id}",
			{},
			{ renamed: ["users", "deletePublicSshKeyForAuthenticatedUser"] }
		],
		deletePublicSshKeyForAuthenticatedUser: ["DELETE /user/keys/{key_id}"],
		deleteSocialAccountForAuthenticatedUser: ["DELETE /user/social_accounts"],
		deleteSshSigningKeyForAuthenticatedUser: ["DELETE /user/ssh_signing_keys/{ssh_signing_key_id}"],
		follow: ["PUT /user/following/{username}"],
		getAuthenticated: ["GET /user"],
		getById: ["GET /user/{account_id}"],
		getByUsername: ["GET /users/{username}"],
		getContextForUser: ["GET /users/{username}/hovercard"],
		getGpgKeyForAuthenticated: [
			"GET /user/gpg_keys/{gpg_key_id}",
			{},
			{ renamed: ["users", "getGpgKeyForAuthenticatedUser"] }
		],
		getGpgKeyForAuthenticatedUser: ["GET /user/gpg_keys/{gpg_key_id}"],
		getPublicSshKeyForAuthenticated: [
			"GET /user/keys/{key_id}",
			{},
			{ renamed: ["users", "getPublicSshKeyForAuthenticatedUser"] }
		],
		getPublicSshKeyForAuthenticatedUser: ["GET /user/keys/{key_id}"],
		getSshSigningKeyForAuthenticatedUser: ["GET /user/ssh_signing_keys/{ssh_signing_key_id}"],
		list: ["GET /users"],
		listAttestations: ["GET /users/{username}/attestations/{subject_digest}"],
		listAttestationsBulk: ["POST /users/{username}/attestations/bulk-list{?per_page,before,after}"],
		listBlockedByAuthenticated: [
			"GET /user/blocks",
			{},
			{ renamed: ["users", "listBlockedByAuthenticatedUser"] }
		],
		listBlockedByAuthenticatedUser: ["GET /user/blocks"],
		listEmailsForAuthenticated: [
			"GET /user/emails",
			{},
			{ renamed: ["users", "listEmailsForAuthenticatedUser"] }
		],
		listEmailsForAuthenticatedUser: ["GET /user/emails"],
		listFollowedByAuthenticated: [
			"GET /user/following",
			{},
			{ renamed: ["users", "listFollowedByAuthenticatedUser"] }
		],
		listFollowedByAuthenticatedUser: ["GET /user/following"],
		listFollowersForAuthenticatedUser: ["GET /user/followers"],
		listFollowersForUser: ["GET /users/{username}/followers"],
		listFollowingForUser: ["GET /users/{username}/following"],
		listGpgKeysForAuthenticated: [
			"GET /user/gpg_keys",
			{},
			{ renamed: ["users", "listGpgKeysForAuthenticatedUser"] }
		],
		listGpgKeysForAuthenticatedUser: ["GET /user/gpg_keys"],
		listGpgKeysForUser: ["GET /users/{username}/gpg_keys"],
		listPublicEmailsForAuthenticated: [
			"GET /user/public_emails",
			{},
			{ renamed: ["users", "listPublicEmailsForAuthenticatedUser"] }
		],
		listPublicEmailsForAuthenticatedUser: ["GET /user/public_emails"],
		listPublicKeysForUser: ["GET /users/{username}/keys"],
		listPublicSshKeysForAuthenticated: [
			"GET /user/keys",
			{},
			{ renamed: ["users", "listPublicSshKeysForAuthenticatedUser"] }
		],
		listPublicSshKeysForAuthenticatedUser: ["GET /user/keys"],
		listSocialAccountsForAuthenticatedUser: ["GET /user/social_accounts"],
		listSocialAccountsForUser: ["GET /users/{username}/social_accounts"],
		listSshSigningKeysForAuthenticatedUser: ["GET /user/ssh_signing_keys"],
		listSshSigningKeysForUser: ["GET /users/{username}/ssh_signing_keys"],
		setPrimaryEmailVisibilityForAuthenticated: [
			"PATCH /user/email/visibility",
			{},
			{ renamed: ["users", "setPrimaryEmailVisibilityForAuthenticatedUser"] }
		],
		setPrimaryEmailVisibilityForAuthenticatedUser: ["PATCH /user/email/visibility"],
		unblock: ["DELETE /user/blocks/{username}"],
		unfollow: ["DELETE /user/following/{username}"],
		updateAuthenticated: ["PATCH /user"]
	}
}, K = /* @__PURE__ */ new Map();
for (let [e, t] of Object.entries(st)) for (let [n, r] of Object.entries(t)) {
	let [t, i, a] = r, [o, s] = t.split(/ /), c = Object.assign({
		method: o,
		url: s
	}, i);
	K.has(e) || K.set(e, /* @__PURE__ */ new Map()), K.get(e).set(n, {
		scope: e,
		methodName: n,
		endpointDefaults: c,
		decorations: a
	});
}
var ct = {
	has({ scope: e }, t) {
		return K.get(e).has(t);
	},
	getOwnPropertyDescriptor(e, t) {
		return {
			value: this.get(e, t),
			configurable: !0,
			writable: !0,
			enumerable: !0
		};
	},
	defineProperty(e, t, n) {
		return Object.defineProperty(e.cache, t, n), !0;
	},
	deleteProperty(e, t) {
		return delete e.cache[t], !0;
	},
	ownKeys({ scope: e }) {
		return [...K.get(e).keys()];
	},
	set(e, t, n) {
		return e.cache[t] = n;
	},
	get({ octokit: e, scope: t, cache: n }, r) {
		if (n[r]) return n[r];
		let i = K.get(t).get(r);
		if (!i) return;
		let { endpointDefaults: a, decorations: o } = i;
		return o ? n[r] = ut(e, t, r, a, o) : n[r] = e.request.defaults(a), n[r];
	}
};
function lt(e) {
	let t = {};
	for (let n of K.keys()) t[n] = new Proxy({
		octokit: e,
		scope: n,
		cache: {}
	}, ct);
	return t;
}
function ut(e, t, n, r, i) {
	let a = e.request.defaults(r);
	function o(...r) {
		let o = a.endpoint.merge(...r);
		if (i.mapToData) return o = Object.assign({}, o, {
			data: o[i.mapToData],
			[i.mapToData]: void 0
		}), a(o);
		if (i.renamed) {
			let [r, a] = i.renamed;
			e.log.warn(`octokit.${t}.${n}() has been renamed to octokit.${r}.${a}()`);
		}
		if (i.deprecated && e.log.warn(i.deprecated), i.renamedParameters) {
			let o = a.endpoint.merge(...r);
			for (let [r, a] of Object.entries(i.renamedParameters)) r in o && (e.log.warn(`"${r}" parameter is deprecated for "octokit.${t}.${n}()". Use "${a}" instead`), a in o || (o[a] = o[r]), delete o[r]);
			return a(o);
		}
		return a(...r);
	}
	return Object.assign(o, a);
}
//#endregion
//#region node_modules/@octokit/plugin-rest-endpoint-methods/dist-src/index.js
function dt(e) {
	return { rest: lt(e) };
}
dt.VERSION = ot;
function ft(e) {
	let t = lt(e);
	return {
		...t,
		rest: t
	};
}
ft.VERSION = ot;
//#endregion
//#region node_modules/@octokit/rest/dist-src/index.js
var pt = Qe.plugin(et, ft, at).defaults({ userAgent: "octokit-rest.js/22.0.1" });
//#endregion
//#region electron/engine/nodeRegistry.ts
function q(e, t) {
	return typeof e == "string" ? e.replace(/\{\{\s*([^}]+)\s*\}\}/g, (e, n) => {
		let r = n.trim().split("."), i = r[0];
		if (i === "globals") {
			let e = r[1];
			return t.credentials[e] || "";
		}
		let a = t.nodeOutputs[i];
		if (!a) return "";
		let o = a;
		for (let e = 1; e < r.length; e++) if (o && typeof o == "object") o = o[r[e]];
		else return "";
		return typeof o == "object" ? JSON.stringify(o) : o === void 0 ? "" : String(o);
	}) : e;
}
var mt = {
	trigger: async (e, t) => (t.log(e.id, "Workflow triggered manually", "success"), {
		triggered: !0,
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	}),
	terminal: async (e, t) => {
		let n = e.data.command || "", r = q(e.data.cwd || "", t) || process.cwd(), i = e.data.shellType || "default", a;
		i === "default" ? a = process.platform === "win32" ? void 0 : process.env.SHELL || "/bin/zsh" : i === "bash" ? a = "bash" : i === "zsh" ? a = "zsh" : i === "powershell" ? a = "powershell" : i === "cmd" ? a = "cmd.exe" : i === "custom" && e.data.customShell && (a = q(e.data.customShell, t));
		let o = q(n, t);
		if (!o.trim()) return t.log(e.id, "No commands to execute", "warn"), {
			stdout: "",
			stderr: "",
			exitCode: 0
		};
		let s = o;
		process.platform !== "win32" && (s = "\nif [ -s \"$NVM_DIR/nvm.sh\" ]; then\n  . \"$NVM_DIR/nvm.sh\"\nelif [ -s \"$HOME/.nvm/nvm.sh\" ]; then\n  . \"$HOME/.nvm/nvm.sh\"\nelif [ -s \"/usr/local/opt/nvm/nvm.sh\" ]; then\n  . \"/usr/local/opt/nvm/nvm.sh\"\nelif [ -s \"/opt/homebrew/opt/nvm/nvm.sh\" ]; then\n  . \"/opt/homebrew/opt/nvm/nvm.sh\"\nfi\n\n" + o);
		let c = null, l = !1, d = t.onCancel(() => {
			l = !0, c && (t.log(e.id, "Killing terminal command process", "warn"), c.kill());
		}), f = "", p = "", m = "", h = "", g = a ? ` (shell: ${a})` : "";
		t.log(e.id, `Executing terminal commands${g} in ${r}`, "info");
		try {
			if (l) throw Error("Terminal execution cancelled by user");
			let n = await new Promise((n, i) => {
				let o = u(s, {
					cwd: r,
					shell: a
				}, (r, a, o) => {
					if (c = null, m.trim() && t.log(e.id, m.trimEnd(), "info"), h.trim() && t.log(e.id, h.trimEnd(), "warn"), r) if (l) i(/* @__PURE__ */ Error("Terminal execution cancelled by user"));
					else {
						t.log(e.id, `Command failed: ${r.message}`, "error");
						let n = Error(r.message);
						n.stdout = f, n.stderr = p, n.exitCode = r.code || 1, i(n);
					}
					else n({
						stdout: f,
						stderr: p,
						exitCode: 0
					});
				});
				o.stdout?.on("data", (n) => {
					let r = n.toString();
					f += r, m += r;
					let i = m.split("\n");
					for (let n = 0; n < i.length - 1; n++) t.log(e.id, i[n].trimEnd(), "info");
					m = i[i.length - 1];
				}), o.stderr?.on("data", (n) => {
					let r = n.toString();
					p += r, h += r;
					let i = h.split("\n");
					for (let n = 0; n < i.length - 1; n++) t.log(e.id, i[n].trimEnd(), "warn");
					h = i[i.length - 1];
				}), c = o;
			});
			return t.log(e.id, "All commands completed successfully", "success"), {
				stdout: n.stdout.trim(),
				stderr: n.stderr.trim(),
				exitCode: 0
			};
		} finally {
			d();
		}
	},
	git: async (e, t) => {
		let n = e.data.operation, r = q(e.data.cwd || "", t) || process.cwd(), i = (e) => new Promise((t, n) => {
			u(e, { cwd: r }, (e, r, i) => {
				e ? n(Error(i || e.message)) : t(r.trim());
			});
		});
		t.log(e.id, `Starting Git Operation: ${n}`, "info");
		try {
			if (n === "branch") {
				let n = q(e.data.branchName || "", t);
				if (!n) throw Error("Branch name is required");
				t.log(e.id, `Creating and switching to branch: ${n}`, "info");
				try {
					await i(`git checkout ${n}`), t.log(e.id, `Switched to existing branch: ${n}`, "success");
				} catch {
					await i(`git checkout -b ${n}`), t.log(e.id, `Created and switched to branch: ${n}`, "success");
				}
				return {
					branchName: n,
					success: !0
				};
			} else if (n === "commit") {
				let n = q(e.data.commitMessage || "", t) || "Commit from DevFlow";
				t.log(e.id, `Staging files and committing with message: "${n}"`, "info"), await i("git add .");
				let r = await i(`git commit -m "${n.replace(/"/g, "\\\"")}"`);
				return t.log(e.id, `Committed successfully: ${r}`, "success"), {
					commitResult: r,
					success: !0
				};
			} else if (n === "cherry-pick") {
				let n = q(e.data.commitHash || "", t);
				if (!n) throw Error("Commit hash is required");
				t.log(e.id, `Cherry picking commit: ${n}`, "info");
				let r = await i(`git cherry-pick ${n}`);
				return t.log(e.id, "Cherry pick successful", "success"), {
					cherryPickResult: r,
					success: !0
				};
			} else if (n === "push") {
				let n = q(e.data.remote || "", t) || "origin", r = q(e.data.branchName || "", t);
				if (!r) throw Error("Branch name is required to push");
				t.log(e.id, `Pushing branch ${r} to ${n}`, "info");
				let a = await i(`git push ${n} ${r}`);
				return t.log(e.id, "Push completed", "success"), {
					pushResult: a,
					success: !0
				};
			}
			throw Error(`Unsupported Git operation: ${n}`);
		} catch (n) {
			throw t.log(e.id, `Git operation failed: ${n.message}`, "error"), n;
		}
	},
	github: async (e, t) => {
		let n = e.data.operation, r = t.credentials.githubToken;
		if (!r) throw Error("GitHub Personal Access Token (githubToken) is missing in credentials settings.");
		let i = new pt({ auth: r }), a = q(e.data.owner || "", t), o = q(e.data.repo || "", t);
		t.log(e.id, `Starting GitHub Operation: ${n} on ${a}/${o}`, "info");
		try {
			if (n === "create-pr") {
				let n = q(e.data.prTitle || "", t), r = q(e.data.headBranch || "", t), s = q(e.data.baseBranch || "", t) || "main", c = q(e.data.prBody || "", t) || "Automated PR by DevFlow";
				t.log(e.id, `Creating PR from ${r} to ${s}...`, "info");
				let l = await i.pulls.create({
					owner: a,
					repo: o,
					title: n,
					head: r,
					base: s,
					body: c,
					draft: !0
				});
				return t.log(e.id, `PR created successfully: ${l.data.html_url}`, "success"), {
					prNumber: l.data.number,
					prUrl: l.data.html_url,
					success: !0
				};
			} else if (n === "pr-comment") {
				let n = q(e.data.prNumber || "", t), r = parseInt(n, 10), s = q(e.data.commentBody || "", t);
				if (isNaN(r)) throw Error("Valid PR number is required");
				if (!s) throw Error("Comment body is required");
				t.log(e.id, `Adding comment to PR #${r}...`, "info");
				let c = await i.issues.createComment({
					owner: a,
					repo: o,
					issue_number: r,
					body: s
				});
				return t.log(e.id, `Comment added: ${c.data.html_url}`, "success"), {
					commentUrl: c.data.html_url,
					success: !0
				};
			}
			throw Error(`Unsupported GitHub operation: ${n}`);
		} catch (n) {
			throw t.log(e.id, `GitHub operation failed: ${n.message}`, "error"), n;
		}
	},
	jira: async (e, t) => {
		let n = e.data.operation, r = t.credentials.jiraHost, i = t.credentials.jiraEmail, a = t.credentials.jiraToken;
		if (!r || !i || !a) throw Error("Jira credentials (jiraHost, jiraEmail, jiraToken) are incomplete in settings.");
		let o = q(e.data.issueKey || "", t);
		if (!o) throw Error("Jira Issue Key (e.g. PROJ-123) is required");
		let s = `Basic ${Buffer.from(`${i}:${a}`).toString("base64")}`, c = `https://${r.replace(/^https?:\/\//, "")}/rest/api/3`;
		t.log(e.id, `Starting Jira Operation: ${n} for ${o}`, "info");
		try {
			if (n === "comment") {
				let n = q(e.data.comment || "", t);
				if (!n) throw Error("Comment text is required");
				t.log(e.id, `Adding comment to Jira ticket ${o}...`, "info");
				let r = { body: {
					version: 1,
					type: "doc",
					content: [{
						type: "paragraph",
						content: [{
							type: "text",
							text: n
						}]
					}]
				} }, i = await fetch(`${c}/issue/${o}/comment`, {
					method: "POST",
					headers: {
						Authorization: s,
						"Content-Type": "application/json",
						Accept: "application/json"
					},
					body: JSON.stringify(r)
				});
				if (!i.ok) {
					let e = await i.text();
					throw Error(`Jira API error ${i.status}: ${e}`);
				}
				let a = await i.json();
				return t.log(e.id, "Jira comment added successfully", "success"), {
					commentId: a.id,
					success: !0
				};
			} else if (n === "transition") {
				let n = q(e.data.transitionName || "", t);
				if (!n) throw Error("Transition target is required");
				t.log(e.id, `Fetching transitions for ${o}...`, "info");
				let r = await fetch(`${c}/issue/${o}/transitions`, { headers: { Authorization: s } });
				if (!r.ok) throw Error(`Failed to fetch transitions: ${r.statusText}`);
				let i = await r.json(), a = i.transitions.find((e) => e.name.toLowerCase() === n.toLowerCase() || e.id === n);
				if (!a) throw Error(`Jira transition "${n}" not found on issue ${o}. Available: ${i.transitions.map((e) => e.name).join(", ")}`);
				t.log(e.id, `Executing transition to status: ${a.name} (ID: ${a.id})`, "info");
				let l = await fetch(`${c}/issue/${o}/transitions`, {
					method: "POST",
					headers: {
						Authorization: s,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ transition: { id: a.id } })
				});
				if (!l.ok) {
					let e = await l.text();
					throw Error(`Failed to apply transition: ${e}`);
				}
				return t.log(e.id, `Jira issue transitioned successfully to "${a.name}"`, "success"), {
					transitionedTo: a.name,
					success: !0
				};
			}
			throw Error(`Unsupported Jira operation: ${n}`);
		} catch (n) {
			throw t.log(e.id, `Jira operation failed: ${n.message}`, "error"), n;
		}
	},
	mcp: async (e, t) => {
		let n = q(e.data.serverCmd || "", t), r = q(e.data.serverArgs || "", t), i = q(e.data.toolName || "", t), a = q(e.data.toolArgs || "", t) || "{}";
		if (!n) throw Error("MCP server command (e.g. npx) is required");
		if (!i) throw Error("MCP Tool Name is required");
		let o = r ? r.split(" ").filter(Boolean) : [], s = JSON.parse(a);
		t.log(e.id, `Starting MCP Connection to Server: "${n} ${o.join(" ")}"`, "info"), t.log(e.id, `Calling tool: "${i}" with args: ${JSON.stringify(s)}`, "info");
		let c = null, l = !1, d = t.onCancel(() => {
			l = !0, c && (t.log(e.id, "Killing MCP process", "warn"), c.kill());
		});
		try {
			return await new Promise((r, a) => {
				let d = u(`${n} ${o.join(" ")}`);
				c = d;
				let f = "", p = !1;
				d.stdout?.on("data", (n) => {
					f += n;
					let i = f.split("\n");
					for (let n = 0; n < i.length - 1; n++) {
						let o = i[n].trim();
						if (o) try {
							let n = JSON.parse(o);
							if (n.id === 1 && (n.result || n.error)) {
								p = !0, d.kill(), n.error ? (t.log(e.id, `MCP Tool execution failed: ${n.error.message}`, "error"), a(Error(n.error.message))) : (t.log(e.id, "MCP Tool execution succeeded", "success"), r(n.result));
								break;
							}
						} catch {}
					}
					f = i[i.length - 1];
				}), d.stderr?.on("data", (n) => {
					t.log(e.id, `[MCP Server Log] ${n}`, "warn");
				}), d.on("close", (e) => {
					c = null, l ? a(/* @__PURE__ */ Error("MCP execution cancelled by user")) : p || a(/* @__PURE__ */ Error(`MCP server closed prematurely with code ${e}`));
				});
				let m = {
					jsonrpc: "2.0",
					id: 1,
					method: "tools/call",
					params: {
						name: i,
						arguments: s
					}
				};
				t.log(e.id, "Sending JSON-RPC request to MCP stdin", "info"), d.stdin?.write(JSON.stringify(m) + "\n");
			});
		} finally {
			d();
		}
	},
	javascript: async (e, t) => {
		let n = e.data.code || "";
		t.log(e.id, "Running custom JavaScript code", "info");
		try {
			let r = t.nodeOutputs, i = {
				inputs: r,
				console: { log: (n) => t.log(e.id, `[Console] ${String(n)}`, "info") }
			}, a = Function("inputs", "console", `
        ${n}
      `)(r, i.console);
			return t.log(e.id, "Code executed successfully", "success"), a || { success: !0 };
		} catch (n) {
			throw t.log(e.id, `Code execution failed: ${n.message}`, "error"), n;
		}
	}
}, ht = class {
	isCancelled = !1;
	isPaused = !1;
	pausedNodeId = null;
	pausePromiseResolve = null;
	proceedNext = !1;
	activeNodeId = null;
	window;
	cancelCallbacks = /* @__PURE__ */ new Set();
	constructor(e) {
		this.window = e;
	}
	cancel() {
		this.isCancelled = !0, this.isPaused = !1, this.pausePromiseResolve && this.pausePromiseResolve();
		for (let e of this.cancelCallbacks) try {
			e();
		} catch (e) {
			console.error("Error running execution cancel callback:", e);
		}
		this.activeNodeId && this.log(this.activeNodeId, "Workflow execution cancelled by user", "error");
	}
	pause() {
		this.isPaused = !0, this.activeNodeId ? this.log(this.activeNodeId, "Pause requested. Execution will pause before the next node.", "info") : this.window.webContents.send("workflow-log", {
			nodeId: "system",
			message: "Pause requested.",
			type: "info",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	resume() {
		this.isPaused = !1, this.proceedNext = !1, this.pausePromiseResolve && this.pausePromiseResolve();
	}
	proceed() {
		this.isPaused = !1, this.proceedNext = !0, this.pausePromiseResolve && this.pausePromiseResolve();
	}
	async checkPause(e, t) {
		(t || this.isPaused) && (this.isPaused = !0, this.pausedNodeId = e, this.updateStatus(e, "paused"), this.log(e, "Execution paused. Right-click node to resume (unpause) or proceed to next node.", "warn"), await new Promise((e) => {
			this.pausePromiseResolve = e;
		}), this.pausedNodeId = null, this.pausePromiseResolve = null);
	}
	log(e, t, n = "info") {
		this.window.webContents.send("workflow-log", {
			nodeId: e,
			message: t,
			type: n,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	updateStatus(e, t, n, r) {
		this.window.webContents.send("workflow-status", {
			nodeId: e,
			status: t,
			output: n,
			error: r
		});
	}
	async execute(e, t) {
		this.isCancelled = !1, this.activeNodeId = null;
		let n = e.nodes, r = e.edges, i = {}, a = {};
		n.forEach((e) => {
			i[e.id] = [], a[e.id] = 0, this.updateStatus(e.id, "idle");
		}), r.forEach((e) => {
			i[e.source] && i[e.source].push(e.target), a[e.target] !== void 0 && a[e.target]++;
		});
		let o = [], s = n.filter((e) => e.type === "trigger");
		if (s.length > 0 ? s.forEach((e) => o.push(e.id)) : n.forEach((e) => {
			a[e.id] === 0 && o.push(e.id);
		}), o.length === 0 && n.length > 0) return this.window.webContents.send("workflow-log", {
			nodeId: "system",
			message: "No entry point (trigger or 0-indegree node) found in workflow.",
			type: "error",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}), {
			success: !1,
			error: "No entry point"
		};
		let c = {}, l = {
			nodeOutputs: c,
			credentials: t,
			log: (e, t, n) => this.log(e, t, n),
			onCancel: (e) => (this.cancelCallbacks.add(e), () => this.cancelCallbacks.delete(e))
		}, u = /* @__PURE__ */ new Set();
		for (this.window.webContents.send("workflow-log", {
			nodeId: "system",
			message: "Starting workflow execution...",
			type: "info",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}); o.length > 0;) {
			if (this.isCancelled) return this.window.webContents.send("workflow-log", {
				nodeId: "system",
				message: "Workflow execution aborted.",
				type: "error",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			}), {
				success: !1,
				cancelled: !0
			};
			let e = o.shift(), t = n.find((t) => t.id === e);
			if (t) {
				if (t.data?.isDisabled === !0) {
					this.log(e, "Node is paused (disabled). Skipping execution.", "info"), this.updateStatus(e, "success", { skipped: !0 }), c[e] = { skipped: !0 };
					let n = (t.data.label || "").replace(/[^a-zA-Z0-9]/g, "");
					n && (c[n] = { skipped: !0 }), u.add(e), i[e].forEach((e) => {
						a[e]--, a[e] === 0 && !u.has(e) && o.push(e);
					});
					continue;
				}
				if (await this.checkPause(e, t.data?.isPaused === !0), this.isCancelled) return this.window.webContents.send("workflow-log", {
					nodeId: "system",
					message: "Workflow execution aborted.",
					type: "error",
					timestamp: (/* @__PURE__ */ new Date()).toISOString()
				}), {
					success: !1,
					cancelled: !0
				};
				if (this.proceedNext) {
					this.proceedNext = !1, this.log(e, "Skipped executing node and proceeding to next", "info"), this.updateStatus(e, "success", {}), c[e] = {}, u.add(e), i[e].forEach((e) => {
						a[e]--, a[e] === 0 && !u.has(e) && o.push(e);
					});
					continue;
				}
				this.activeNodeId = e, this.updateStatus(e, "running"), this.log(e, `Executing node: ${t.data.label || t.type}`, "info");
				try {
					let n = mt[t.type];
					if (!n) throw Error(`Executor for node type "${t.type}" not found.`);
					let r = await n(t, l);
					c[t.id] = r;
					let s = (t.data.label || "").replace(/[^a-zA-Z0-9]/g, "");
					s && (c[s] = r), this.updateStatus(e, "success", r), u.add(e), i[e].forEach((e) => {
						a[e]--, a[e] === 0 && !u.has(e) && o.push(e);
					});
				} catch (n) {
					return this.updateStatus(e, "error", null, n.message), this.log(e, `Failed executing node: ${n.message}`, "error"), this.window.webContents.send("workflow-log", {
						nodeId: "system",
						message: `Workflow halted due to error in node "${t.data.label || t.type}"`,
						type: "error",
						timestamp: (/* @__PURE__ */ new Date()).toISOString()
					}), {
						success: !1,
						error: n.message
					};
				}
			}
		}
		return this.activeNodeId = null, this.window.webContents.send("workflow-log", {
			nodeId: "system",
			message: "Workflow execution completed successfully.",
			type: "success",
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		}), {
			success: !0,
			outputs: c
		};
	}
};
//#endregion
//#region electron/main.ts
t.name = "DevFlow";
var J = a.dirname(l(import.meta.url)), Y = null, X = null, Z = a.join(t.getPath("userData"), "workflows"), Q = a.join(t.getPath("userData"), "credentials.enc");
s(Z) || c(Z, { recursive: !0 });
async function gt() {
	Y = new e({
		width: 1280,
		height: 800,
		icon: process.env.VITE_DEV_SERVER_URL ? a.join(J, "../public/icon.png") : a.join(J, "../dist/icon.png"),
		webPreferences: {
			preload: a.join(J, "preload.js"),
			nodeIntegration: !1,
			contextIsolation: !0
		},
		titleBarStyle: "hidden",
		titleBarOverlay: {
			color: "#09090b",
			symbolColor: "#f4f4f5",
			height: 35
		},
		backgroundColor: "#09090b"
	}), process.env.VITE_DEV_SERVER_URL ? (Y.loadURL(process.env.VITE_DEV_SERVER_URL), Y.webContents.openDevTools()) : Y.loadFile(a.join(J, "../dist/index.html"));
}
function _t() {
	if (process.platform !== "win32") try {
		let e = d(`${process.env.SHELL || "/bin/zsh"} -l -c 'env'`, {
			encoding: "utf-8",
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			],
			timeout: 5e3
		}).split("\n");
		for (let t of e) {
			let e = t.split("=");
			if (e.length >= 2) {
				let t = e[0], n = e.slice(1).join("=");
				t && t !== "_" && t !== "PWD" && (process.env[t] = n);
			}
		}
	} catch (e) {
		console.error("Failed to load shell environment:", e);
	}
}
t.whenReady().then(() => {
	_t(), gt(), t.on("activate", () => {
		e.getAllWindows().length === 0 && gt();
	});
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && t.quit();
}), r.handle("select-directory", async () => {
	let t = e.getFocusedWindow() || Y || void 0, r = await n.showOpenDialog(t, { properties: ["openDirectory"] });
	return r.canceled ? null : r.filePaths[0];
}), r.handle("save-workflow", async (e, t, n) => {
	let r = a.join(Z, `${t}.json`);
	return await o.writeFile(r, JSON.stringify(n, null, 2), "utf-8"), { success: !0 };
}), r.handle("load-workflow", async (e, t) => {
	let n = a.join(Z, `${t}.json`), r = await o.readFile(n, "utf-8");
	return JSON.parse(r);
}), r.handle("list-workflows", async () => {
	let e = await o.readdir(Z), t = [];
	for (let n of e) n.endsWith(".json") && t.push(a.basename(n, ".json"));
	return t;
}), r.handle("delete-workflow", async (e, t) => {
	let n = a.join(Z, `${t}.json`);
	return await o.unlink(n), { success: !0 };
}), r.handle("run-workflow", async (e, t) => {
	if (!Y) return {
		success: !1,
		error: "No main window"
	};
	X = new ht(Y);
	let n = await $();
	try {
		return await X.execute(t, n);
	} catch (e) {
		return {
			success: !1,
			error: e.message
		};
	} finally {
		X = null;
	}
}), r.handle("stop-workflow", async () => X ? (X.cancel(), { success: !0 }) : {
	success: !1,
	error: "No active workflow running"
}), r.handle("pause-workflow", async () => X ? (X.pause(), { success: !0 }) : {
	success: !1,
	error: "No active workflow running"
}), r.handle("resume-workflow", async () => X ? (X.resume(), { success: !0 }) : {
	success: !1,
	error: "No active workflow running"
}), r.handle("proceed-workflow", async () => X ? (X.proceed(), { success: !0 }) : {
	success: !1,
	error: "No active workflow running"
});
async function $() {
	try {
		if (!s(Q)) return {};
		let e = await o.readFile(Q);
		if (i.isEncryptionAvailable()) try {
			let t = i.decryptString(e);
			return JSON.parse(t);
		} catch {
			return JSON.parse(e.toString("utf-8"));
		}
		else return JSON.parse(e.toString("utf-8"));
	} catch {
		return {};
	}
}
r.handle("get-credentials", async () => await $()), r.handle("save-credentials", async (e, t) => {
	let n = JSON.stringify(t);
	if (i.isEncryptionAvailable()) {
		let e = i.encryptString(n);
		return await o.writeFile(Q, e), {
			success: !0,
			encrypted: !0
		};
	} else return await o.writeFile(Q, Buffer.from(n, "utf-8")), {
		success: !0,
		encrypted: !1
	};
});
//#endregion
export {};
