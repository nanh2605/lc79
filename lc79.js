// ============================================================
// lc79.js - API DỰ ĐOÁN TÀI XỈU LC79 SUPER VIP
// 50+ Thuật toán bắt cầu siêu VIP
// Author: Duy Bảo
// ============================================================

import fastify from "fastify";
import cors from "@fastify/cors";

const PORT = 3000;

// API LC79 - MD5 & Hũ
const API_MD5 = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=46222a746083a233212e676648d049b";
const API_HU = "https://wtx.tele68.com/v1/tx/sessions";

const app = fastify({ logger: false });
await app.register(cors, { origin: "*" });

// ============================================================
// HÀM LẤY DỮ LIỆU & PARSE
// ============================================================

async function fetchData(api) {
    try {
        const response = await fetch(api, {
            headers: { "User-Agent": "Mozilla/5.0" }
        });
        const json = await response.json();
        if (!json || !json.list) return null;
        return json.list;
    } catch (e) {
        return null;
    }
}

function parseData(list) {
    if (!list || !list.length) return [];
    return list.map(item => ({
        id: item.id,
        session: parseInt(item.id) || 0,
        dice: item.dices || [0, 0, 0],
        total: (item.dices || [0, 0, 0]).reduce((a, b) => a + b, 0),
        result: item.resultTruyenThong || ((item.dices || [0, 0, 0]).reduce((a, b) => a + b, 0) > 10 ? "TAI" : "XIU"),
        tx: item.resultTruyenThong === "TAI" ? "T" : "X"
    })).sort((a, b) => a.session - b.session);
}

// ============================================================
// HÀM HỖ TRỢ
// ============================================================

function countIn(arr, val, n) {
    let c = 0, m = Math.min(n || arr.length, arr.length);
    for (let i = 0; i < m; i++) if (arr[i] === val) c++;
    return c;
}

function streak(arr) {
    if (!arr.length) return 0;
    let s = 1;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === arr[i - 1]) s++;
        else break;
    }
    return s;
}

function bayesP(a, b) {
    return (a + 1) / (b + 2);
}

function average(nums) {
    if (!nums.length) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums) {
    if (nums.length < 2) return 0;
    let mean = average(nums);
    let variance = average(nums.map(n => Math.pow(n - mean, 2)));
    return Math.sqrt(variance);
}

function entropy(arr) {
    if (!arr.length) return 0;
    let freq = {};
    for (let v of arr) freq[v] = (freq[v] || 0) + 1;
    let e = 0, n = arr.length;
    for (let k in freq) {
        let p = freq[k] / n;
        e -= p * Math.log2(p);
    }
    return e;
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

function tanh(x) {
    return Math.tanh(x);
}

// ============================================================
// PATTERN DATABASE TỪ FILE MẪU
// ============================================================

const PATTERN_DB = {
  'tttt':     { t: 73, x: 27 }, 'xxxx':     { t: 27, x: 73 },
  'tttttt':   { t: 83, x: 17 }, 'xxxxxx':   { t: 17, x: 83 },
  'ttttx':    { t: 40, x: 60 }, 'xxxxt':    { t: 60, x: 40 },
  'ttttttx':  { t: 30, x: 70 }, 'xxxxxxt':  { t: 70, x: 30 },
  'ttxx':     { t: 62, x: 38 }, 'xxtt':     { t: 38, x: 62 },
  'txx':      { t: 60, x: 40 }, 'xtt':      { t: 40, x: 60 },
  'ttx':      { t: 65, x: 35 }, 'xxt':      { t: 35, x: 65 },
  'txt':      { t: 58, x: 42 }, 'xtx':      { t: 42, x: 58 },
  'tttx':     { t: 70, x: 30 }, 'xxxt':     { t: 30, x: 70 },
  'ttxt':     { t: 63, x: 37 }, 'xxtx':     { t: 37, x: 63 },
  'txxx':     { t: 25, x: 75 }, 'xttt':     { t: 75, x: 25 },
  'ttxtx':    { t: 62, x: 38 }, 'xxtxt':    { t: 38, x: 62 },
  'ttxxt':    { t: 55, x: 45 }, 'xxttx':    { t: 45, x: 55 },
  'txtx':     { t: 52, x: 48 }, 'xtxt':     { t: 48, x: 52 },
  'txtxt':    { t: 53, x: 47 }, 'xtxtx':    { t: 47, x: 53 },
  'txtxtxt':  { t: 57, x: 43 }, 'xtxtxtx':  { t: 43, x: 57 },
};

// ============================================================
// 50+ THUẬT TOÁN VIP
// ============================================================

// --- NHÓM 1: CẦU CƠ BẢN ---

function cau11(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    let alt = 0;
    for (let i = 1; i < Math.min(n, 30); i++) if (h[i] !== h[i - 1]) alt++;
    let altRate = alt / Math.min(n - 1, 29);
    if (altRate < 0.6) return null;
    let lastRun = 1;
    for (let i = 1; i < Math.min(n, 20); i++) { if (h[i] === h[i - 1]) lastRun++; else break; }
    if (lastRun >= 4) return { p: h[0] === 'T' ? 0.42 : 0.58, name: 'Cầu 11' };
    if (lastRun === 1 && n >= 3) {
        if (h[0] !== h[1] && h[1] !== h[2]) {
            let pred = h[2] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.55 : 0.45, name: 'Cầu 11' };
        }
        if (h[0] !== h[1]) {
            let pred = h[1] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.53 : 0.47, name: 'Cầu 11' };
        }
        return null;
    }
    return null;
}

function cau3Nhip(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    for (let i = 0; i <= Math.min(3, n - 6); i++) {
        let a = h.slice(i, i + 6);
        if (a[0] !== a[1] && a[1] === a[2] && a[2] !== a[3]) {
            if (n >= i + 7) {
                let pred = a[3] === 'T' ? 'X' : 'T';
                return { p: pred === 'T' ? 0.6 : 0.4, name: 'Cầu 3 nhịp' };
            }
        }
        if (a[0] === a[1] && a[1] === a[2] && a[2] !== a[3] && a[3] === a[4] && a[4] !== a[5]) {
            if (n >= i + 7) {
                let pred = a[5] === 'T' ? 'X' : 'T';
                return { p: pred === 'T' ? 0.58 : 0.42, name: 'Cầu 3 nhịp' };
            }
        }
    }
    return null;
}

function cauDao(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    if (curS < 2) return null;
    let curV = h[0];
    let revCount = 0, revTotal = 0;
    for (let i = 1; i < n; i++) {
        if (h[i] !== h[i - 1]) {
            revTotal++;
            if (i + 1 < n && h[i + 1] === curV) revCount++;
        }
    }
    if (revTotal < 2) return null;
    let revRate = revCount / revTotal;
    let prob = curV === 'T' ? (0.5 - revRate * 0.3) : (0.5 + revRate * 0.3);
    return { p: Math.min(Math.max(prob, 0.01), 0.99), name: 'Cầu đảo' };
}

function cauTong(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    let tC = countIn(h, 'T', n);
    let tR = tC / n;
    if (tR > 0.6) return { p: Math.min(tR + 0.05, 0.88), name: 'Cầu tổng' };
    if (tR < 0.4) return { p: Math.min(1 - tR + 0.05, 0.88), name: 'Cầu tổng' };
    let recent = countIn(h, 'T', Math.min(10, n)) / Math.min(10, n);
    let recentBias = countIn(h, 'T', Math.min(15, n)) / Math.min(15, n);
    let diff = recentBias - tR;
    if (Math.abs(diff) > 0.1) {
        let prob = recentBias + diff * 0.3;
        return { p: Math.min(Math.max(prob, 0.01), 0.99), name: 'Cầu tổng' };
    }
    return null;
}

function cauRongHo(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS >= 5) {
        let tC = countIn(h, 'T', n) / n;
        if (curV === 'T' && tC > 0.55) return { p: Math.min(tC + 0.1, 0.92), name: 'Cầu rồng hổ' };
        if (curV === 'X' && tC < 0.45) return { p: Math.min(1 - tC + 0.1, 0.92), name: 'Cầu rồng hổ' };
    }
    if (curS >= 3) {
        return { p: curV === 'T' ? 0.58 : 0.42, name: 'Cầu rồng hổ' };
    }
    return null;
}

function cau12(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    let p = [];
    for (let i = 0; i <= n - 6; i++) {
        let pat = h.slice(i, i + 6);
        if (pat[0] !== pat[1] && pat[1] === pat[2] && pat[2] !== pat[3]) {
            p.push({ pred: pat[3] === 'T' ? 'X' : 'T', conf: 0.55 });
        }
        if (pat[0] === pat[1] && pat[1] !== pat[2] && pat[2] !== pat[3]) {
            p.push({ pred: pat[3] === 'T' ? 'X' : 'T', conf: 0.53 });
        }
        if (pat[0] !== pat[1] && pat[1] !== pat[2] && pat[2] === pat[3]) {
            p.push({ pred: pat[3] === 'T' ? 'X' : 'T', conf: 0.52 });
        }
    }
    if (!p.length) return null;
    let best = p.reduce((a, b) => a.conf > b.conf ? a : b);
    return { p: best.pred === 'T' ? best.conf : 1 - best.conf, name: 'Cầu 12' };
}

function cau212(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    for (let i = 0; i <= n - 8; i++) {
        let pat = h.slice(i, i + 8);
        if (pat[0] === pat[2] && pat[2] !== pat[1] && pat[3] === pat[5] && pat[5] !== pat[4] && pat[6] === pat[7]) {
            let pred = pat[7] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.58 : 0.42, name: 'Cầu 212' };
        }
        if (pat[0] !== pat[1] && pat[1] === pat[2] && pat[2] !== pat[3] && pat[3] !== pat[4] && pat[4] === pat[5] && pat[5] !== pat[6] && pat[6] !== pat[7]) {
            let pred = pat[7] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.56 : 0.44, name: 'Cầu 212' };
        }
    }
    return null;
}

function cau33(h) {
    let n = Math.min(h.length, 200);
    if (n < 9) return null;
    for (let i = 0; i <= n - 9; i++) {
        let pat = h.slice(i, i + 9);
        let r1 = pat[0] === pat[1] && pat[1] === pat[2];
        let r2 = pat[3] === pat[4] && pat[4] === pat[5];
        let r3 = pat[6] === pat[7] && pat[7] === pat[8];
        if (r1 && r2 && r3 && pat[0] !== pat[3] && pat[3] !== pat[6]) {
            let pred = pat[8] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.6 : 0.4, name: 'Cầu 33' };
        }
        if (r1 && r2 && pat[0] !== pat[3] && pat[3] !== pat[6] && pat[6] === pat[7] && pat[7] === pat[8]) {
            let pred = pat[8] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.57 : 0.43, name: 'Cầu 33' };
        }
    }
    return null;
}

function cau42(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    for (let i = 0; i <= n - 8; i++) {
        let pat = h.slice(i, i + 8);
        if (pat[0] === pat[1] && pat[1] === pat[2] && pat[2] === pat[3] && pat[4] !== pat[5] && pat[5] === pat[6] && pat[6] === pat[7]) {
            let pred = pat[7] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.62 : 0.38, name: 'Cầu 42' };
        }
        if (pat[0] === pat[1] && pat[1] === pat[2] && pat[2] === pat[3] && pat[3] !== pat[4] && pat[4] === pat[5] && pat[5] === pat[6] && pat[6] === pat[7]) {
            let pred = pat[7] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.65 : 0.35, name: 'Cầu 42' };
        }
    }
    return null;
}

function cauDao1122(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    for (let i = 0; i <= n - 9; i++) {
        let pat = h.slice(i, i + 9);
        if (pat[0] !== pat[1] && pat[1] !== pat[2] && pat[2] === pat[3] && pat[3] === pat[4] && pat[4] !== pat[5] && pat[5] !== pat[6] && pat[6] === pat[7] && pat[7] === pat[8]) {
            let pred = pat[8] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.55 : 0.45, name: 'Cầu đảo 1122' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS >= 2) {
        let afterStream = 0, totalAfter = 0;
        for (let i = curS; i < n - 1; i++) {
            let s = 1;
            while (i + s < n && h[i + s] === h[i + s - 1]) s++;
            if (s >= 2 && i + s < n) { totalAfter++; if (h[i + s] !== curV) afterStream++; }
        }
        if (totalAfter >= 2) {
            let pRev = afterStream / totalAfter;
            return { p: curV === 'T' ? 0.5 - pRev * 0.3 : 0.5 + pRev * 0.3, name: 'Cầu đảo 1122' };
        }
    }
    return null;
}

function cauGay(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS >= 2 && curS <= 5) {
        let totalBreak = 0, breakContinue = 0;
        for (let i = 1; i < n - 1; i++) {
            let s = 1;
            while (i + s < n && h[i + s] === h[i + s - 1]) s++;
            if (s === curS && i + s < n) {
                totalBreak++;
                if (h[i + s] === h[i + s - 1]) breakContinue++;
                else { i += s + 1; }
            }
        }
        if (totalBreak >= 2) {
            let breakRate = breakContinue / totalBreak;
            if (breakRate > 0.6) {
                return { p: curV === 'T' ? Math.min(0.55 + breakRate * 0.15, 0.85) : Math.min(0.55 + (1 - breakRate) * 0.15, 0.85), name: 'Cầu gãy' };
            }
        }
    }
    if (curS >= 6) {
        let recent5 = h.slice(1, Math.min(6, n));
        let alt = 0;
        for (let i = 1; i < recent5.length; i++) if (recent5[i] !== recent5[i - 1]) alt++;
        if (alt >= 2) {
            return { p: curV === 'T' ? 0.55 : 0.45, name: 'Cầu gãy' };
        }
    }
    return null;
}

function cauThong(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS < 2) return null;
    let match = 0, total = 0;
    for (let i = 0; i < n - curS; i += 1) {
        let s = 1;
        while (i + s < n && h[i + s] === h[i + s - 1]) s++;
        if (s >= curS + 2 && i + s < n - 1) { total++; if (h[i + s] === curV) match++; }
        i += Math.max(1, s - 1);
    }
    if (total < 2) return null;
    let contRate = match / total;
    let prob = curV === 'T' ? 0.5 + (contRate - 0.5) * 0.4 : 0.5 - (contRate - 0.5) * 0.4;
    return { p: Math.min(Math.max(prob, 0.01), 0.99), name: 'Cầu thông' };
}

function cau2Nhip(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    let best = null;
    for (let i = 0; i <= n - 6; i++) {
        let pat = h.slice(i, i + 6);
        if (pat[0] === pat[1] && pat[2] === pat[3] && pat[4] === pat[5] && pat[0] !== pat[2] && pat[2] !== pat[4]) {
            let pred = pat[5] === 'T' ? 'X' : 'T';
            let pPred = pred === 'T' ? 0.6 : 0.4;
            if (!best || pPred > Math.abs(best.p - 0.5)) best = { p: pPred, name: 'Cầu 2 nhịp' };
        }
        if (pat[0] !== pat[1] && pat[2] !== pat[3] && pat[4] !== pat[5] && pat[0] === pat[2] && pat[2] === pat[4]) {
            let pred = pat[5] === 'T' ? 'X' : 'T';
            let pPred = pred === 'T' ? 0.58 : 0.42;
            if (!best || pPred > Math.abs(best.p - 0.5)) best = { p: pPred, name: 'Cầu 2 nhịp' };
        }
    }
    return best;
}

function cau4Nhip(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    for (let i = 0; i <= n - 10; i++) {
        let pat = h.slice(i, i + 10);
        if (pat[0] !== pat[1] && pat[1] === pat[2] && pat[2] !== pat[3] && pat[3] !== pat[4] && pat[4] === pat[5] && pat[5] !== pat[6] && pat[6] !== pat[7] && pat[7] === pat[8] && pat[8] !== pat[9]) {
            let pred = pat[9] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.54 : 0.46, name: 'Cầu 4 nhịp' };
        }
    }
    return null;
}

function cau3_2(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    for (let i = 0; i <= n - 10; i++) {
        let pat = h.slice(i, i + 10);
        let r1 = pat[0] === pat[1] && pat[1] === pat[2];
        let r2 = pat[3] === pat[4];
        let r3 = pat[5] === pat[6] && pat[6] === pat[7];
        let r4 = pat[8] === pat[9];
        if (r1 && r2 && pat[0] !== pat[3] && pat[3] === pat[4] && pat[4] !== pat[5] && r3 && pat[5] !== pat[8] && r4) {
            return { p: pat[9] === 'T' ? 0.58 : 0.42, name: 'Cầu 3_2' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS === 3) {
        let after32 = 0, total32 = 0;
        for (let i = curS; i < n - 2; i++) {
            if (h.slice(i, i + 2).every(v => v !== curV) && h.slice(i + 2, i + 5).every(v => v === curV)) { total32++; if (h[i + 4] === h[i + 2]) after32++; }
        }
        if (total32 >= 2) {
            let rate = after32 / total32;
            return { p: curV === 'T' ? 0.5 + rate * 0.15 : 0.5 - rate * 0.15, name: 'Cầu 3_2' };
        }
    }
    if (curS === 2) {
        let after23 = 0, total23 = 0;
        for (let i = curS; i < n - 3; i++) {
            if (h.slice(i, i + 3).every(v => v !== curV) && h.slice(i + 3, i + 5).every(v => v === curV)) { total23++; if (h[i + 4] === h[i + 2]) after23++; }
        }
        if (total23 >= 2) {
            let rate = after23 / total23;
            return { p: curV === 'T' ? 0.5 + rate * 0.12 : 0.5 - rate * 0.12, name: 'Cầu 3_2' };
        }
    }
    return null;
}

function cau1_2_3(h) {
    let n = Math.min(h.length, 200);
    if (n < 12) return null;
    for (let i = 0; i <= n - 12; i++) {
        let pat = h.slice(i, i + 12);
        if (pat[0] !== pat[1] && pat[1] === pat[2] && pat[2] !== pat[3] && pat[3] === pat[4] && pat[4] === pat[5] && pat[5] !== pat[6] && pat[6] === pat[7] && pat[7] === pat[8] && pat[8] === pat[9]) {
            let pred = pat[9] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.6 : 0.4, name: 'Cầu 1_2_3' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS >= 1 && curS <= 3) {
        let streamLens = [];
        let pos = 0;
        while (pos < Math.min(n, 20)) {
            let s = 1;
            for (let j = pos + 1; j < Math.min(n, 20); j++) { if (h[j] === h[j - 1]) s++; else break; }
            streamLens.push(s);
            pos += s;
            if (streamLens.length >= 3) break;
        }
        if (streamLens.length >= 3 && streamLens[0] < streamLens[1] && streamLens[1] < streamLens[2]) {
            return { p: curV === 'T' ? 0.46 : 0.54, name: 'Cầu 1_2_3' };
        }
    }
    return null;
}

function cauBac(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    let totalBac = 0, sameBac = 0;
    for (let i = curS; i < n - 1; i++) {
        let s = 1;
        while (i + s < n && h[i + s] === h[i + s - 1]) s++;
        if (s === 1 && i + 1 < n) {
            totalBac++;
            if (h[i + 1] === curV) sameBac++;
        }
        i += Math.max(1, s - 1);
    }
    if (totalBac < 2) return null;
    let bacRate = sameBac / totalBac;
    let prob = curV === 'T' ? 0.5 - bacRate * 0.25 : 0.5 + bacRate * 0.25;
    return { p: Math.min(Math.max(prob, 0.01), 0.99), name: 'Cầu bậc' };
}

function cau112(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS < 1) return null;
    let total112 = 0, match112 = 0;
    for (let i = curS; i < n - 3; i++) {
        if (h.slice(i, i + 4).join('') === curV + (curV === 'T' ? 'X' : 'T') + (curV === 'T' ? 'X' : 'T')) {
            total112++;
            if (i + 4 < n && h[i + 4] === curV) match112++;
        }
        i++;
    }
    if (total112 < 2) return null;
    let rate = match112 / total112;
    return { p: curV === 'T' ? 0.5 + rate * 0.15 : 0.5 - rate * 0.15, name: 'Cầu 112' };
}

function cau221(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS < 2) return null;
    let total221 = 0, match221 = 0;
    for (let i = curS; i < n - 4; i++) {
        if (h.slice(i, i + 5).join('') === curV + curV + (curV === 'T' ? 'X' : 'T') + (curV === 'T' ? 'X' : 'T') + curV) {
            total221++;
            if (i + 5 < n && h[i + 5] === (curV === 'T' ? 'X' : 'T')) match221++;
        }
        i++;
    }
    if (total221 < 2) return null;
    let rate = match221 / total221;
    return { p: curV === 'T' ? 0.5 - rate * 0.15 : 0.5 + rate * 0.15, name: 'Cầu 221' };
}

function cauDao22(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let total22 = 0, match22 = 0;
    for (let i = 0; i <= n - 5; i++) {
        let pat = h.slice(i, i + 4).join('');
        if (pat === 'TTXX' || pat === 'XXTT') {
            total22++;
            if (h[i + 4] === h[i]) match22++;
        }
        i++;
    }
    if (total22 < 2) return null;
    let rate = match22 / total22;
    let lastP = h.slice(0, 4).join('');
    let isTX = lastP === 'TTXX' || lastP === 'XXTT';
    if (!isTX) return { p: 0.5, name: 'Cầu đảo 22' };
    return { p: h[0] === 'T' ? 0.5 + rate * 0.12 : 0.5 - rate * 0.12, name: 'Cầu đảo 22' };
}

function cauCham(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS < 2) return null;
    let chamCount = 0, matchCham = 0;
    for (let i = curS; i < n - 2; i++) {
        if (h[i] !== h[i - 1] && h[i] !== h[i + 1]) {
            chamCount++;
            if (chamCount > 1 && h[i] === curV) matchCham++;
        }
    }
    if (chamCount < 3) return null;
    let rate = matchCham / (chamCount || 1);
    return { p: curV === 'T' ? 0.5 + rate * 0.15 : 0.5 - rate * 0.15, name: 'Cầu chạm' };
}

function cauKep(h) {
    let n = Math.min(h.length, 200);
    if (n < 6) return null;
    for (let i = 0; i <= n - 5; i++) {
        let p = h.slice(i, i + 5).join('');
        if (p[0] === p[1] && p[3] === p[4] && p[1] !== p[2] && p[2] !== p[3] && p[1] === p[3]) {
            return { p: p[4] === 'T' ? 0.58 : 0.42, name: 'Cầu kép' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    if (curS >= 3) {
        return { p: h[0] === 'T' ? 0.55 : 0.45, name: 'Cầu kép' };
    }
    return null;
}

function cauPhanXa(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curV = h[0];
    let totalPX = 0, matchPX = 0;
    for (let len = 2; len <= 5; len++) {
        for (let i = 1; i <= Math.min(n - len - 1, 40); i++) {
            let pa = h.slice(0, len).join('');
            let pb = h.slice(i, i + len).join('');
            if (pa === pb) {
                totalPX++;
                if (i + len < n && h[i + len] === (curV === 'T' ? 'X' : 'T')) matchPX++;
            }
        }
    }
    if (totalPX < 3) return null;
    let rate = matchPX / totalPX;
    return { p: curV === 'T' ? 0.5 - rate * 0.2 : 0.5 + rate * 0.2, name: 'Cầu phản xạ' };
}

function cauLoRoi(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    if (curS < 3) return null;
    let totalR = 0, matchR = 0;
    for (let i = curS; i < n - 2; i++) {
        let s = 1;
        while (i + s < n && h[i + s] === h[i + s - 1]) s++;
        if (s >= curS && i + s < n) {
            totalR++;
            if (h[i + s] !== h[i]) matchR++;
        }
        i += s;
    }
    if (totalR < 2) return null;
    let rate = matchR / totalR;
    return { p: h[0] === 'T' ? 0.5 - rate * 0.18 : 0.5 + rate * 0.18, name: 'Cầu lỡ rơi' };
}

function cauSongHanh(h) {
    let n = Math.min(h.length, 200);
    if (n < 12) return null;
    let pairs = [];
    for (let i = 0; i <= n - 4; i += 2) {
        let p = h.slice(i, i + 2).join('');
        pairs.push(p);
    }
    if (pairs.length < 3) return null;
    let match = 0, total = 0;
    for (let i = 2; i < pairs.length; i++) {
        if (pairs[i - 2] === pairs[i - 1]) {
            total++;
            if (pairs[i] === pairs[i - 1]) match++;
        }
    }
    if (total < 2) return { p: 0.5, name: 'Cầu song hành' };
    let rate = match / total;
    let lastPair = pairs[pairs.length - 1];
    return { p: lastPair === 'TT' || lastPair === 'XX' ? 0.5 + rate * 0.12 : 0.5 - rate * 0.12, name: 'Cầu song hành' };
}

function cauGiaoNhau(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    let gnCount = 0, matchGN = 0;
    for (let i = curS; i < n - 2; i++) {
        let s = streak(h.slice(i));
        if (s === 1 && i + 2 < n && h[i + 1] === curV && h[i + 2] === (curV === 'T' ? 'X' : 'T')) {
            gnCount++;
            if (i + 3 < n && h[i + 3] === curV) matchGN++;
        }
    }
    if (gnCount < 2) return null;
    let rate = matchGN / gnCount;
    return { p: curV === 'T' ? 0.5 + rate * 0.12 : 0.5 - rate * 0.12, name: 'Cầu giao nhau' };
}

function cauBet12(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    if (curS < 1 || curS > 2) return null;
    let total = 0, match = 0;
    for (let i = curS; i < n - 2; i++) {
        let s = streak(h.slice(i));
        if (s === 2 && h[i] === curV) {
            total++;
            if (i + 2 < n && h[i + 2] === (curV === 'T' ? 'X' : 'T')) match++;
        }
        i += Math.max(1, s - 1);
    }
    if (total < 2) return null;
    let rate = match / total;
    return { p: curV === 'T' ? 0.5 + rate * 0.13 : 0.5 - rate * 0.13, name: 'Cầu bet 12' };
}

function cauXien22(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    let totalX = 0, matchX = 0;
    for (let i = 0; i <= n - 6; i += 2) {
        let p = h.slice(i, i + 4).join('');
        if (p[0] === p[1] && p[2] === p[3] && p[0] !== p[2]) {
            totalX++;
            if (i + 4 < n && h[i + 4] === h[i + 2]) matchX++;
        }
    }
    if (totalX < 2) return null;
    let rate = matchX / totalX;
    let last4 = h.slice(0, 4).join('');
    if (!(last4[0] === last4[1] && last4[2] === last4[3] && last4[0] !== last4[2])) return { p: 0.5, name: 'Cầu xiên 22' };
    return { p: h[0] === 'T' ? 0.5 + rate * 0.1 : 0.5 - rate * 0.1, name: 'Cầu xiên 22' };
}

function cau331(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    for (let i = 0; i <= n - 9; i++) {
        let p = h.slice(i, i + 7).join('');
        if (p[0] === p[1] && p[1] === p[2] && p[3] === p[4] && p[4] === p[5] && p[2] !== p[3] && p[5] === p[6]) {
            return { p: p[6] === 'T' ? 0.55 : 0.45, name: 'Cầu 331' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    if (curS === 3) {
        let total33 = 0, match33 = 0;
        for (let i = curS; i < n - 4; i++) {
            let s = streak(h.slice(i));
            if (s === 3 && h[i] !== h[0]) {
                total33++;
                if (i + 3 < n && h[i + 3] === h[0]) match33++;
            }
            i += s;
        }
        if (total33 >= 2) {
            let r = match33 / total33;
            return { p: h[0] === 'T' ? 0.5 + r * 0.12 : 0.5 - r * 0.12, name: 'Cầu 331' };
        }
    }
    return null;
}

function cau133(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    for (let i = 0; i <= n - 9; i++) {
        let p = h.slice(i, i + 7).join('');
        if (p[0] === p[1] && p[2] === p[3] && p[3] === p[4] && p[4] === p[5] && p[0] !== p[2] && p[5] === p[6]) {
            return { p: p[6] === 'T' ? 0.55 : 0.45, name: 'Cầu 133' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    if (curS === 1) {
        let total13 = 0, match13 = 0;
        for (let i = 1; i < n - 5; i++) {
            let s = streak(h.slice(i));
            if (s === 3 && h[i] !== h[0]) {
                total13++;
                if (i + 3 < n && h[i + 3] === h[0]) match13++;
            }
            i += s;
        }
        if (total13 >= 2) {
            let r = match13 / total13;
            return { p: h[0] === 'T' ? 0.5 + r * 0.15 : 0.5 - r * 0.15, name: 'Cầu 133' };
        }
    }
    return null;
}

function cauNhayCoc(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    let skipCount = 0, matchSkip = 0;
    for (let i = curS; i < n - 2; i += 2) {
        if (h[i] === curV) {
            skipCount++;
            if (i + 1 < n && h[i + 1] === (curV === 'T' ? 'X' : 'T')) matchSkip++;
        }
    }
    if (skipCount < 2) return null;
    let rate = matchSkip / skipCount;
    return { p: curV === 'T' ? 0.5 + rate * 0.12 : 0.5 - rate * 0.12, name: 'Cầu nhảy cóc' };
}

function cau421(h) {
    let n = Math.min(h.length, 200);
    if (n < 12) return null;
    for (let i = 0; i <= n - 10; i++) {
        let p = h.slice(i, i + 7).join('');
        if (p[0] === p[1] && p[1] === p[2] && p[2] === p[3] && p[4] === p[5] && p[3] !== p[4] && p[5] === p[6]) {
            return { p: p[6] === 'T' ? 0.54 : 0.46, name: 'Cầu 421' };
        }
    }
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    if (curS === 4) {
        let total = 0, match = 0;
        for (let i = curS; i < n - 4; i++) {
            let s = streak(h.slice(i));
            if (s === 2 && h[i] !== h[0]) {
                total++;
                if (i + 2 < n && h[i + 2] === (h[0] === 'T' ? 'X' : 'T')) match++;
            }
            i += s;
        }
        if (total >= 2) {
            let r = match / total;
            return { p: h[0] === 'T' ? 0.5 + r * 0.12 : 0.5 - r * 0.12, name: 'Cầu 421' };
        }
    }
    return null;
}

function cauDoiXung(h) {
    let n = Math.min(h.length, 200);
    if (n < 14) return null;
    let symCount = 0, matchSym = 0;
    let half = Math.min(6, Math.floor(n / 2));
    for (let i = half; i < n - half - 2; i++) {
        let sym = true;
        for (let j = 0; j < half; j++) {
            if (h[i - j - 1] !== h[i + j]) { sym = false; break; }
        }
        if (sym && i + half < n) {
            symCount++;
            let next = h[i + half];
            let mirror = h[i - half];
            if (next === mirror) matchSym++;
        }
    }
    if (symCount < 2) return null;
    let rate = matchSym / symCount;
    return { p: rate > 0.55 ? 0.52 : 0.48, name: 'Cầu đối xứng' };
}

function cauXenKe(h) {
    let n = Math.min(h.length, 200);
    if (n < 10) return null;
    let xkCount = 0, matchXK = 0;
    for (let i = 0; i <= n - 5; i++) {
        let p = h.slice(i, i + 4).join('');
        if (p[0] !== p[1] && p[1] !== p[2] && p[2] !== p[3] && p[0] === p[2] && p[1] === p[3]) {
            xkCount++;
            if (i + 4 < n && h[i + 4] === p[1]) matchXK++;
        }
    }
    if (xkCount < 2) return null;
    let rate = matchXK / xkCount;
    let lastP = h.slice(0, 4).join('');
    if (!(lastP[0] !== lastP[1] && lastP[1] !== lastP[2] && lastP[2] !== lastP[3] && lastP[0] === lastP[2] && lastP[1] === lastP[3])) {
        return { p: 0.48, name: 'Cầu xen kẽ' };
    }
    return { p: h[0] === 'T' ? 0.5 + rate * 0.1 : 0.5 - rate * 0.1, name: 'Cầu xen kẽ' };
}

function cauThep(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let curS = 1;
    for (let i = 1; i < n; i++) { if (h[i] === h[i - 1]) curS++; else break; }
    let curV = h[0];
    let tpCount = 0, matchTP = 0;
    for (let i = curS; i < n - 2; i++) {
        if (h[i] === (curV === 'T' ? 'X' : 'T') && h[i + 1] === curV && h[i + 2] === (curV === 'T' ? 'X' : 'T')) {
            tpCount++;
            if (i + 3 < n && h[i + 3] === curV) matchTP++;
        }
        i += 2;
    }
    if (tpCount < 2) return null;
    let rate = matchTP / tpCount;
    return { p: curV === 'T' ? 0.5 + rate * 0.11 : 0.5 - rate * 0.11, name: 'Cầu thép' };
}

function cauNhipTang(h) {
    let n = Math.min(h.length, 200);
    if (n < 12) return null;
    let runs = [];
    let i = 0;
    while (i < n) {
        let s = 1;
        while (i + s < n && h[i + s] === h[i + s - 1]) s++;
        runs.push({ v: h[i], len: s });
        i += s;
    }
    if (runs.length < 4) return null;
    for (let j = 0; j <= runs.length - 4; j++) {
        let r0 = runs[j], r1 = runs[j + 1], r2 = runs[j + 2], r3 = runs[j + 3];
        if (r0.v !== r1.v && r1.v !== r2.v && r2.v !== r3.v) continue;
        if (r0.len < r1.len && r1.len < r2.len && r2.len < r3.len) {
            let isUp = r0.v === 'T';
            let nextRun = runs[j + 4];
            if (nextRun) {
                let match = nextRun.v === r0.v;
                return { p: isUp ? (match ? 0.56 : 0.44) : (match ? 0.44 : 0.56), name: 'Cầu nhịp tăng' };
            }
        }
        if (r0.len > r1.len && r1.len > r2.len && r2.len > r3.len) {
            let isDown = r0.v === 'T';
            let nextRun = runs[j + 4];
            if (nextRun) {
                let match = nextRun.v !== r0.v;
                return { p: isDown ? (match ? 0.56 : 0.44) : (match ? 0.44 : 0.56), name: 'Cầu nhịp tăng' };
            }
        }
    }
    return null;
}

function cau343(h) {
    let n = Math.min(h.length, 200);
    if (n < 12) return null;
    for (let i = 0; i <= n - 10; i++) {
        let p = h.slice(i, i + 10).join('');
        if (p[0] === p[1] && p[1] === p[2] && p[3] === p[4] && p[4] === p[5] && p[6] === p[7] && p[7] === p[8] && p[8] === p[9] && p[2] !== p[3] && p[5] !== p[6]) {
            let pred = h[9] === 'T' ? 'X' : 'T';
            return { p: pred === 'T' ? 0.56 : 0.44, name: 'Cầu 343' };
        }
    }
    return null;
}

function cauXienCheo(h) {
    let n = Math.min(h.length, 200);
    if (n < 8) return null;
    let xcCount = 0, matchXC = 0;
    for (let i = 0; i <= n - 4; i++) {
        let p = h.slice(i, i + 4).join('');
        if (p[0] === p[2] && p[1] === p[3] && p[0] !== p[1]) {
            xcCount++;
            if (i + 4 < n && h[i + 4] === p[1]) matchXC++;
        }
    }
    if (xcCount < 3) return null;
    let rate = matchXC / xcCount;
    return { p: rate > 0.55 ? 0.52 : 0.48, name: 'Cầu xiên chéo' };
}

// --- NHÓM 2: THUẬT TOÁN TỪ FILE MẪU ---

function extractFeatures(history) {
    const tx = history.map(h => h.tx === 'T' ? 't' : 'x');
    const totals = history.map(h => h.total);
    const freq = {};
    for (const v of tx) freq[v] = (freq[v] || 0) + 1;
    let runs = [], cur = tx[0], len = 1;
    for (let i = 1; i < tx.length; i++) {
        if (tx[i] === cur) len++;
        else { runs.push({ val: cur, len }); cur = tx[i]; len = 1; }
    }
    if (tx.length) runs.push({ val: cur, len });
    return { tx, totals, freq, runs, maxRun: runs.reduce((m, r) => Math.max(m, r.len), 0) };
}

function detectPatternType(runs) {
    if (runs.length < 3) return null;
    const lastRuns = runs.slice(-6);
    const lengths = lastRuns.map(r => r.len);
    const values = lastRuns.map(r => r.val);
    if (lastRuns.length >= 3) {
        if (lengths.every(l => l === 1) && values.every((v, i) => i === 0 || v !== values[i-1])) return '1_1_pattern';
        if (lengths.every(l => l === 2) && values.every((v, i) => i === 0 || v !== values[i-1])) return '2_2_pattern';
        if (lengths.every(l => l === 3) && values.every((v, i) => i === 0 || v !== values[i-1])) return '3_3_pattern';
        if (lengths.length >= 5 && lengths[0]===2 && lengths[1]===1 && lengths[2]===2 && lengths[3]===1 && lengths[4]===2) return '2_1_2_pattern';
        if (lengths.length >= 5 && lengths[0]===1 && lengths[1]===2 && lengths[2]===1 && lengths[3]===2 && lengths[4]===1) return '1_2_1_pattern';
        if (lengths.length >= 5 && lengths[0]===3 && lengths[1]===2 && lengths[2]===3 && lengths[3]===2 && lengths[4]===3) return '3_2_3_pattern';
        if (lengths.length >= 5 && lengths[0]===4 && lengths[1]===2 && lengths[2]===4 && lengths[3]===2 && lengths[4]===4) return '4_2_4_pattern';
        if (lengths.length >= 5 && lengths[0]===2 && lengths[1]===2 && lengths[2]===1 && lengths[3]===2 && lengths[4]===2) return '2_2_1_pattern';
        if (lengths.length >= 5 && lengths[0]===1 && lengths[1]===3 && lengths[2]===1 && lengths[3]===3 && lengths[4]===1) return '1_3_1_pattern';
        if (lengths.length >= 5 && lengths[0]===3 && lengths[1]===1 && lengths[2]===3 && lengths[3]===1 && lengths[4]===3) return '3_1_3_pattern';
    }
    const lastRun = lastRuns[lastRuns.length - 1];
    if (lastRun && lastRun.len >= 5) return 'long_run_pattern';
    return null;
}

function predictFromPattern(patternType, runs, lastTx) {
    if (!patternType) return null;
    const lastRun = runs[runs.length - 1];
    switch (patternType) {
        case '1_1_pattern': return lastTx === 't' ? 'x' : 't';
        case '2_2_pattern': return lastRun.len === 2 ? (lastRun.val === 't' ? 'x' : 't') : lastRun.val;
        case '3_3_pattern': return lastRun.len === 3 ? (lastRun.val === 't' ? 'x' : 't') : lastRun.val;
        case '2_1_2_pattern':
            if (lastRun.len === 2) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len === 1) return lastRun.val;
            return null;
        case '1_2_1_pattern':
            if (lastRun.len === 1) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len === 2) return lastRun.val;
            return null;
        case '3_2_3_pattern':
        case '4_2_4_pattern':
            if (lastRun.len >= 3) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len === 2) return lastRun.val;
            return null;
        case '2_2_1_pattern':
            if (lastRun.len === 2) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len === 1) return lastRun.val === 't' ? 'x' : 't';
            return null;
        case '1_3_1_pattern':
            if (lastRun.len === 1) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len === 3) return lastRun.val;
            return null;
        case '3_1_3_pattern':
            if (lastRun.len === 3) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len === 1) return lastRun.val;
            return null;
        case 'long_run_pattern':
            if (lastRun.len > 7) return lastRun.val === 't' ? 'x' : 't';
            if (lastRun.len >= 4) return lastRun.val;
            return null;
        default: return null;
    }
}

function detectStreak(vals) {
  if (!vals.length) return { streak: 0, current: null, breakProb: 0 };
  let streak = 1;
  const current = vals[vals.length - 1];
  for (let i = vals.length - 2; i >= 0; i--) {
    if (vals[i] === current) streak++;
    else break;
  }
  const last15 = vals.slice(-15);
  let switches = 0;
  for (let i = 1; i < last15.length; i++) {
    if (last15[i] !== last15[i - 1]) switches++;
  }
  const tCount = last15.filter(v => v === 't').length;
  const imbalance = Math.abs(tCount - (last15.length - tCount)) / last15.length;
  let breakProb = 0;
  if (streak >= 8) breakProb = Math.min(0.6 + (switches / 15) + imbalance * 0.15, 0.9);
  else if (streak >= 5) breakProb = Math.min(0.35 + (switches / 10) + imbalance * 0.25, 0.85);
  else if (streak >= 3 && switches >= 7) breakProb = 0.3;
  return { streak, current, breakProb };
}

function ngramPredict(vals) {
  const results = [];
  for (let len = 2; len <= 5; len++) {
    if (vals.length < len + 1) continue;
    const pattern = vals.slice(-len).join('');
    let tCount = 0, xCount = 0, total = 0;
    for (let i = 0; i <= vals.length - len - 1; i++) {
      const seg = vals.slice(i, i + len).join('');
      if (seg === pattern) {
        total++;
        if (vals[i + len] === 't') tCount++;
        else xCount++;
      }
    }
    if (total >= 2) {
      const prob = tCount / total;
      results.push({
        len,
        prediction: prob > 0.5 ? 't' : 'x',
        confidence: Math.abs(prob - 0.5) * 200,
        samples: total,
        ratio: tCount + '/' + xCount
      });
    }
  }
  results.sort(function(a, b) { return (b.len * b.samples) - (a.len * a.samples); });
  return results[0] || null;
}

function weightedTrend(vals) {
  const last15 = vals.slice(-15);
  if (last15.length < 3) return null;
  const weights = last15.map(function(_, i) { return Math.pow(1.15, i); });
  var tW = 0, xW = 0, totalW = 0;
  last15.forEach(function(v, i) {
    totalW += weights[i];
    if (v === 't') tW += weights[i]; else xW += weights[i];
  });
  var ratio = (tW - xW) / totalW;
  return {
    prediction: ratio > 0 ? 't' : 'x',
    confidence: Math.abs(ratio) * 100
  };
}

function meanDeviation(vals) {
  var last12 = vals.slice(-12);
  if (last12.length < 3) return null;
  var tCount = last12.filter(function(v) { return v === 't'; }).length;
  var deviation = Math.abs(tCount - (last12.length - tCount)) / last12.length;
  if (deviation < 0.35) {
    return { prediction: last12[last12.length - 1] === 'x' ? 't' : 'x', confidence: 55 + deviation * 30 };
  }
  return { prediction: tCount > last12.length - tCount ? 't' : 'x', confidence: 50 + deviation * 50 };
}

function detectCycle(vals) {
  if (vals.length < 20) return null;
  var values = vals.map(function(v) { return v === 't' ? 1 : -1; });
  var n = values.length;
  var bestPeriod = 0, bestCorrelation = -1;
  for (var period = 2; period <= Math.floor(n / 3); period++) {
    var correlation = 0, count = 0;
    for (var i = 0; i < n - period; i++) {
      correlation += values[i] * values[i + period];
      count++;
    }
    correlation /= count;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }
  if (bestCorrelation < 0.2) return null;
  var position = vals.length % bestPeriod;
  var cycleResults = [];
  for (var j = position; j < vals.length; j += bestPeriod) {
    cycleResults.push(vals[j]);
  }
  var tCount2 = cycleResults.filter(function(r) { return r === 't'; }).length;
  return {
    period: bestPeriod,
    correlation: bestCorrelation,
    prediction: tCount2 > cycleResults.length / 2 ? 't' : 'x',
    confidence: Math.abs(tCount2 / cycleResults.length - 0.5) * 200
  };
}

function markovPredict(vals) {
  var orders = [3, 2, 1];
  for (var oi = 0; oi < orders.length; oi++) {
    var order = orders[oi];
    if (vals.length <= order) continue;
    var table = {};
    for (var i = 0; i <= vals.length - order - 1; i++) {
      var key = vals.slice(i, i + order).join('\u2192');
      var next = vals[i + order];
      if (!table[key]) table[key] = { t: 0, x: 0 };
      table[key][next]++;
    }
    var state = vals.slice(-order).join('\u2192');
    var cnt = table[state];
    if (!cnt) continue;
    var total = cnt.t + cnt.x;
    if (total < 3) continue;
    return {
      prediction: cnt.t >= cnt.x ? 't' : 'x',
      confidence: Math.round(Math.max(cnt.t, cnt.x) / total * 100),
      order: order,
      samples: total
    };
  }
  return null;
}

function fibonacciMomentum(vals) {
  if (vals.length < 10) return null;
  var fib = [1, 1, 2, 3, 5, 8, 13, 21];
  var tScore = 0, xScore = 0;
  for (var i = 0; i < Math.min(fib.length, vals.length); i++) {
    var idx = vals.length - 1 - i;
    if (vals[idx] === 't') tScore += fib[i];
    else xScore += fib[i];
  }
  var total = tScore + xScore;
  return {
    prediction: tScore > xScore ? 't' : 'x',
    confidence: Math.abs(tScore - xScore) / total * 100
  };
}

function smartBridgeBreak(vals) {
  if (vals.length < 3) return null;
  var si = detectStreak(vals);
  var streak = si.streak, current = si.current, breakProb = si.breakProb;
  if (streak < 3) return null;
  var last20 = vals.slice(-20);
  var pCounts = {};
  for (var i = 0; i <= last20.length - 3; i++) {
    var p = last20.slice(i, i + 3).join(',');
    pCounts[p] = (pCounts[p] || 0) + 1;
  }
  var entries = Object.entries(pCounts).sort(function(a, b) { return b[1] - a[1]; });
  var mc = entries[0];
  var isStable = mc && mc[1] >= 3;
  var breakProbability = breakProb;
  if (streak >= 6) breakProbability = Math.min(breakProbability + 0.15, 0.9);
  else if (streak >= 4) breakProbability = Math.min(breakProbability + 0.1, 0.85);
  else breakProbability = Math.max(breakProbability - 0.15, 0.15);
  var prediction = breakProbability > 0.65
    ? (current === 't' ? 'x' : 't')
    : (current === 't' ? 't' : 'x');
  return { prediction: prediction, confidence: breakProbability * 100, streak: streak, breakProb: breakProbability };
}

function patternDBLookup(vals) {
  if (vals.length < 3) return null;
  var keys = Object.keys(PATTERN_DB).sort(function(a, b) { return b.length - a.length; });
  var currentStr = vals.slice(0, 15).join('');
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (currentStr.endsWith(key)) {
      var data = PATTERN_DB[key];
      return { prediction: data.t > data.x ? 't' : 'x', confidence: Math.max(data.t, data.x), pattern: key };
    }
  }
  return null;
}

function detectSpecialPatterns(vals) {
  if (vals.length < 4) return null;
  var last4 = vals.slice(-4);
  if (last4[0] === last4[1] && last4[2] === last4[3] && last4[1] !== last4[2]) {
    return { prediction: last4[3] === 't' ? 't' : 'x', confidence: 62, pattern: 'AABB' };
  }
  if (vals.length >= 6) {
    var alternating = true;
    for (var i = vals.length - 6; i < vals.length; i++) {
      if (i > vals.length - 6 && vals[i] === vals[i - 1]) { alternating = false; break; }
    }
    if (alternating) return { prediction: vals[vals.length - 1] === 't' ? 'x' : 't', confidence: 65, pattern: '1-1' };
  }
  if (vals.length >= 5) {
    var m = vals.slice(-5);
    if (m[0] === m[1] && m[1] !== m[2] && m[3] === m[4] && m[0] === m[3]) {
      return { prediction: m[2], confidence: 62, pattern: '2-1' };
    }
  }
  return null;
}

// ============================================================
// THUẬT TOÁN DỰ ĐOÁN TỔNG HỢP SUPER VIP
// ============================================================

function smartPredict(h) {
    let n = Math.min(h.length, 200);
    if (n < 3) return 0.5;
    
    let signals = [];
    
    // Nhóm 1: Cầu cơ bản (38 cầu)
    let c11 = cau11(h); if (c11) signals.push({ p: c11.p, weight: 1.0, name: c11.name });
    let c3n = cau3Nhip(h); if (c3n) signals.push({ p: c3n.p, weight: 0.9, name: c3n.name });
    let cDao = cauDao(h); if (cDao) signals.push({ p: cDao.p, weight: 0.95, name: cDao.name });
    let cTong = cauTong(h); if (cTong) signals.push({ p: cTong.p, weight: 0.85, name: cTong.name });
    let cRong = cauRongHo(h); if (cRong) signals.push({ p: cRong.p, weight: 0.9, name: cRong.name });
    let c12 = cau12(h); if (c12) signals.push({ p: c12.p, weight: 0.8, name: c12.name });
    let c212 = cau212(h); if (c212) signals.push({ p: c212.p, weight: 0.85, name: c212.name });
    let c33 = cau33(h); if (c33) signals.push({ p: c33.p, weight: 0.9, name: c33.name });
    let c42 = cau42(h); if (c42) signals.push({ p: c42.p, weight: 0.85, name: c42.name });
    let cDao1122 = cauDao1122(h); if (cDao1122) signals.push({ p: cDao1122.p, weight: 0.8, name: cDao1122.name });
    let cGay = cauGay(h); if (cGay) signals.push({ p: cGay.p, weight: 0.7, name: cGay.name });
    let cThong = cauThong(h); if (cThong) signals.push({ p: cThong.p, weight: 0.85, name: cThong.name });
    let c2Nhip = cau2Nhip(h); if (c2Nhip) signals.push({ p: c2Nhip.p, weight: 0.75, name: c2Nhip.name });
    let c4Nhip = cau4Nhip(h); if (c4Nhip) signals.push({ p: c4Nhip.p, weight: 0.7, name: c4Nhip.name });
    let c3_2 = cau3_2(h); if (c3_2) signals.push({ p: c3_2.p, weight: 0.8, name: c3_2.name });
    let c1_2_3 = cau1_2_3(h); if (c1_2_3) signals.push({ p: c1_2_3.p, weight: 0.75, name: c1_2_3.name });
    let cBac = cauBac(h); if (cBac) signals.push({ p: cBac.p, weight: 0.7, name: cBac.name });
    let c112 = cau112(h); if (c112) signals.push({ p: c112.p, weight: 0.7, name: c112.name });
    let c221 = cau221(h); if (c221) signals.push({ p: c221.p, weight: 0.7, name: c221.name });
    let cDao22 = cauDao22(h); if (cDao22) signals.push({ p: cDao22.p, weight: 0.75, name: cDao22.name });
    let cCham = cauCham(h); if (cCham) signals.push({ p: cCham.p, weight: 0.7, name: cCham.name });
    let cKep = cauKep(h); if (cKep) signals.push({ p: cKep.p, weight: 0.75, name: cKep.name });
    let cPhanXa = cauPhanXa(h); if (cPhanXa) signals.push({ p: cPhanXa.p, weight: 0.7, name: cPhanXa.name });
    let cLoRoi = cauLoRoi(h); if (cLoRoi) signals.push({ p: cLoRoi.p, weight: 0.7, name: cLoRoi.name });
    let cSongHanh = cauSongHanh(h); if (cSongHanh) signals.push({ p: cSongHanh.p, weight: 0.65, name: cSongHanh.name });
    let cGiaoNhau = cauGiaoNhau(h); if (cGiaoNhau) signals.push({ p: cGiaoNhau.p, weight: 0.7, name: cGiaoNhau.name });
    let cBet12 = cauBet12(h); if (cBet12) signals.push({ p: cBet12.p, weight: 0.7, name: cBet12.name });
    let cXien22 = cauXien22(h); if (cXien22) signals.push({ p: cXien22.p, weight: 0.65, name: cXien22.name });
    let c331 = cau331(h); if (c331) signals.push({ p: c331.p, weight: 0.7, name: c331.name });
    let c133 = cau133(h); if (c133) signals.push({ p: c133.p, weight: 0.7, name: c133.name });
    let cNhayCoc = cauNhayCoc(h); if (cNhayCoc) signals.push({ p: cNhayCoc.p, weight: 0.65, name: cNhayCoc.name });
    let c421 = cau421(h); if (c421) signals.push({ p: c421.p, weight: 0.7, name: c421.name });
    let cDoiXung = cauDoiXung(h); if (cDoiXung) signals.push({ p: cDoiXung.p, weight: 0.65, name: cDoiXung.name });
    let cXenKe = cauXenKe(h); if (cXenKe) signals.push({ p: cXenKe.p, weight: 0.65, name: cXenKe.name });
    let cThep = cauThep(h); if (cThep) signals.push({ p: cThep.p, weight: 0.7, name: cThep.name });
    let cNhipTang = cauNhipTang(h); if (cNhipTang) signals.push({ p: cNhipTang.p, weight: 0.7, name: cNhipTang.name });
    let c343 = cau343(h); if (c343) signals.push({ p: c343.p, weight: 0.7, name: c343.name });
    let cXienCheo = cauXienCheo(h); if (cXienCheo) signals.push({ p: cXienCheo.p, weight: 0.6, name: cXienCheo.name });
    
    // Nhóm 2: Thuật toán từ file mẫu
    let vals = h.map(v => v === 'T' ? 't' : 'x');
    let features = extractFeatures(h.map(v => ({ tx: v, total: 0 })));
    let patternType = detectPatternType(features.runs);
    if (patternType) {
        let patPred = predictFromPattern(patternType, features.runs, vals[0]);
        if (patPred) {
            let patP = patPred === 't' ? 0.6 : 0.4;
            signals.push({ p: patP, weight: 0.9, name: 'Pattern Type: ' + patternType });
        }
    }
    
    let ng = ngramPredict(vals);
    if (ng) {
        let ngP = ng.prediction === 't' ? 0.5 + ng.confidence / 200 : 0.5 - ng.confidence / 200;
        signals.push({ p: ngP, weight: 0.85, name: 'N-gram (len=' + ng.len + ')' });
    }
    
    let wt = weightedTrend(vals);
    if (wt) {
        let wtP = wt.prediction === 't' ? 0.5 + wt.confidence / 200 : 0.5 - wt.confidence / 200;
        signals.push({ p: wtP, weight: 0.8, name: 'Weighted Trend' });
    }
    
    let md = meanDeviation(vals);
    if (md) {
        let mdP = md.prediction === 't' ? 0.5 + md.confidence / 200 : 0.5 - md.confidence / 200;
        signals.push({ p: mdP, weight: 0.75, name: 'Mean Deviation' });
    }
    
    let cy = detectCycle(vals);
    if (cy) {
        let cyP = cy.prediction === 't' ? 0.5 + cy.confidence / 200 : 0.5 - cy.confidence / 200;
        signals.push({ p: cyP, weight: 0.85, name: 'Cycle (period=' + cy.period + ')' });
    }
    
    let mk = markovPredict(vals);
    if (mk) {
        let mkP = mk.prediction === 't' ? mk.confidence / 100 : 1 - mk.confidence / 100;
        signals.push({ p: mkP, weight: 0.8, name: 'Markov (order=' + mk.order + ')' });
    }
    
    let fm = fibonacciMomentum(vals);
    if (fm) {
        let fmP = fm.prediction === 't' ? 0.5 + fm.confidence / 200 : 0.5 - fm.confidence / 200;
        signals.push({ p: fmP, weight: 0.75, name: 'Fibonacci Momentum' });
    }
    
    let sbb = smartBridgeBreak(vals);
    if (sbb) {
        let sbbP = sbb.prediction === 't' ? sbb.confidence / 100 : 1 - sbb.confidence / 100;
        signals.push({ p: sbbP, weight: 0.85, name: 'Smart Bridge Break' });
    }
    
    let pdb = patternDBLookup(vals);
    if (pdb) {
        let pdbP = pdb.prediction === 't' ? pdb.confidence / 100 : 1 - pdb.confidence / 100;
        signals.push({ p: pdbP, weight: 0.9, name: 'Pattern DB: ' + pdb.pattern });
    }
    
    let dsp = detectSpecialPatterns(vals);
    if (dsp) {
        let dspP = dsp.prediction === 't' ? dsp.confidence / 100 : 1 - dsp.confidence / 100;
        signals.push({ p: dspP, weight: 0.8, name: 'Special Pattern: ' + dsp.pattern });
    }
    
    // Nếu không có tín hiệu, dùng phương pháp đảo chiều cơ bản
    if (signals.length === 0) {
        let s = streak(h);
        let curV = h[0];
        if (s >= 4) return curV === 'T' ? 0.19 : 0.81;
        else if (s >= 3) return curV === 'T' ? 0.28 : 0.72;
        else return countIn(h, 'T', n) / n;
    }
    
    // Tính trọng số tổng hợp
    let totalWeight = 0;
    let weightedSum = 0;
    
    for (let signal of signals) {
        let strength = Math.abs(signal.p - 0.5) * 2;
        let finalWeight = signal.weight * (0.5 + strength);
        weightedSum += signal.p * finalWeight;
        totalWeight += finalWeight;
    }
    
    let result = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    
    // Điều chỉnh dựa trên chuỗi hiện tại
    let s = streak(h);
    let curV = h[0];
    if (s >= 4) {
        let revProb = curV === 'T' ? 0.19 : 0.81;
        result = result * 0.4 + revProb * 0.6;
    } else if (s >= 3) {
        let revProb = curV === 'T' ? 0.28 : 0.72;
        result = result * 0.5 + revProb * 0.5;
    }
    
    return Math.min(Math.max(result, 0.01), 0.99);
}

// ============================================================
// HÀM CHÍNH DỰ ĐOÁN SUPER VIP
// ============================================================

function computePrediction(h) {
    let d = h.slice(0, Math.min(h.length, 200));
    let n = d.length;
    if (n < 3) return { prediction: 'X', confidence: 50, streak: 0, prob: 0.5 };
    
    let p = smartPredict(d);
    let s = streak(d);
    let curV = d[0];
    
    let finalDecision = p >= 0.5 ? 'T' : 'X';
    let confidence = Math.min(99, Math.max(55, Math.round(Math.abs(p - 0.5) * 200) + 10));
    
    if (confidence < 65 && s >= 3) {
        finalDecision = curV === 'T' ? 'X' : 'T';
        confidence = Math.min(88, confidence + 20);
    }
    
    return {
        prediction: finalDecision,
        confidence: confidence,
        streak: s,
        prob: p
    };
}

// ============================================================
// API HANDLERS
// ============================================================

async function handlePrediction(api, gameName) {
    let data = await fetchData(api);
    if (!data) return { error: "Khong the lay du lieu tu API" };
    
    let parsed = parseData(data);
    if (!parsed.length) return { error: "Du lieu khong hop le" };
    
    let h = parsed.map(r => r.tx);
    let result = computePrediction(h);
    let latest = parsed[parsed.length - 1];
    let nextSession = latest ? latest.session + 1 : 1;
    
    let totalT = countIn(h, 'T', h.length);
    let totalX = h.length - totalT;
    let totalDice = h.length;
    
    return {
        author: "Duy Bảo",
        game: gameName,
        phien_truoc: latest ? latest.session : 0,
        xuc_xac1: latest ? latest.dice[0] : 0,
        xuc_xac2: latest ? latest.dice[1] : 0,
        xuc_xac3: latest ? latest.dice[2] : 0,
        tong: latest ? latest.total : 0,
        ket_qua: latest ? latest.result.toLowerCase() : 'N/A',
        phien_nay: nextSession,
        du_doan: result.prediction === "T" ? "tai" : "xiu",
        do_tin_cay: `${result.confidence}%`,
        chuoi_hien_tai: result.streak,
        thong_ke: {
            tong_phien: totalDice,
            so_T: totalT,
            so_X: totalX,
            ty_le_T: `${(totalT / totalDice * 100).toFixed(2)}%`,
            ty_le_X: `${(totalX / totalDice * 100).toFixed(2)}%`
        }
    };
}

async function handleHistory(api, limit = 50) {
    let data = await fetchData(api);
    if (!data) return { error: "Khong the lay du lieu tu API" };
    
    let parsed = parseData(data);
    if (!parsed.length) return { error: "Du lieu khong hop le" };
    
    let history = parsed.slice(-Math.min(limit, parsed.length));
    history = history.reverse();
    
    return {
        author: "Duy Bảo",
        total: history.length,
        list: history.map(item => ({
            phien: item.session,
            xuc_xac1: item.dice[0],
            xuc_xac2: item.dice[1],
            xuc_xac3: item.dice[2],
            tong: item.total,
            ket_qua: item.result.toLowerCase()
        }))
    };
}

// ============================================================
// ROUTES
// ============================================================

app.get("/lc79/md5", async (request, reply) => {
    let result = await handlePrediction(API_MD5, "LC79 MD5");
    if (result.error) return reply.status(503).send({ error: result.error });
    return result;
});

app.get("/lc79/hu", async (request, reply) => {
    let result = await handlePrediction(API_HU, "LC79 Hũ");
    if (result.error) return reply.status(503).send({ error: result.error });
    return result;
});

app.get("/lc79/historymd5", async (request, reply) => {
    const limit = request.query.limit ? parseInt(request.query.limit) : 50;
    let result = await handleHistory(API_MD5, limit);
    if (result.error) return reply.status(503).send({ error: result.error });
    return result;
});

app.get("/lc79/historyhu", async (request, reply) => {
    const limit = request.query.limit ? parseInt(request.query.limit) : 50;
    let result = await handleHistory(API_HU, limit);
    if (result.error) return reply.status(503).send({ error: result.error });
    return result;
});

app.get("/", async () => {
    return {
        status: "active",
        service: "LC79 Prediction API SUPER VIP",
        author: "Duy Bảo",
        version: "4.0",
        description: "50+ thuật toán bắt cầu siêu VIP",
        endpoints: {
            md5_prediction: "/lc79/md5",
            hu_prediction: "/lc79/hu",
            md5_history: "/lc79/historymd5?limit=50",
            hu_history: "/lc79/historyhu?limit=50"
        }
    };
});

// ============================================================
// START SERVER
// ============================================================

const start = async () => {
    try {
        await app.listen({ port: PORT, host: "0.0.0.0" });
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 LC79 Prediction API SUPER VIP - Author: Duy Bảo`);
        console.log(`🎯 50+ thuật toán bắt cầu siêu VIP`);
        console.log(`📍 Endpoints:`);
        console.log(`   - Dự đoán MD5: http://localhost:${PORT}/lc79/md5`);
        console.log(`   - Dự đoán Hũ: http://localhost:${PORT}/lc79/hu`);
        console.log(`   - Lịch sử MD5: http://localhost:${PORT}/lc79/historymd5`);
        console.log(`   - Lịch sử Hũ: http://localhost:${PORT}/lc79/historyhu`);
    } catch (err) {
        console.error("❌ Error starting server:", err.message);
        process.exit(1);
    }
};

start();
