// ============================================================
// lc79.js - API DỰ ĐOÁN TÀI XỈU LC79
// Sử dụng thuật toán phân tích từ dữ liệu 10000 phiên
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
// THUẬT TOÁN PHÂN TÍCH 10000 PHIÊN
// ============================================================

// Đếm số lần xuất hiện của giá trị trong mảng
function countIn(arr, val, n) {
    let c = 0, m = Math.min(n || arr.length, arr.length);
    for (let i = 0; i < m; i++) if (arr[i] === val) c++;
    return c;
}

// Đếm độ dài chuỗi lặp hiện tại
function streak(arr) {
    if (!arr.length) return 0;
    let s = 1;
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] === arr[i - 1]) s++;
        else break;
    }
    return s;
}

// ============================================================
// CÁC PHƯƠNG PHÁP DỰ ĐOÁN
// ============================================================

// 1. Đa số (Majority) - Đếm T/X trong lịch sử
function majorityPredict(h) {
    let n = Math.min(h.length, 200);
    if (n < 3) return 0.5;
    let tC = countIn(h, 'T', n);
    let xC = n - tC;
    return tC > xC ? 0.55 : (xC > tC ? 0.45 : 0.5);
}

// 2. Xu hướng (Trend) - Lấy 10 phiên gần nhất
function trendPredict(h) {
    let n = Math.min(h.length, 10);
    if (n < 3) return 0.5;
    let tC = countIn(h, 'T', n);
    return tC / n;
}

// 3. Chu kỳ (Cycle) - Phát hiện chu kỳ 2-5
function cyclePredict(h) {
    let n = Math.min(h.length, 200);
    if (n < 4) return 0.5;
    
    // Tìm chu kỳ phổ biến
    let cycles = {};
    for (let len = 2; len <= 5; len++) {
        if (n < len + 1) continue;
        let key = h.slice(0, len).join('');
        let count = 0, match = 0;
        for (let i = 0; i <= n - len - 1; i++) {
            let sub = h.slice(i, i + len).join('');
            if (sub === key) {
                count++;
                if (i + len < n && h[i + len] === h[0]) match++;
            }
        }
        if (count >= 3) {
            cycles[len] = match / count;
        }
    }
    
    if (Object.keys(cycles).length === 0) return 0.5;
    
    // Lấy chu kỳ có độ tin cậy cao nhất
    let best = 0, bestScore = 0;
    for (let len in cycles) {
        let score = cycles[len] * Math.abs(cycles[len] - 0.5);
        if (score > bestScore) {
            bestScore = score;
            best = cycles[len];
        }
    }
    return best > 0 ? best : 0.5;
}

// 4. Đảo chiều (Reversal) - Khi có ≥3 T hoặc X liên tiếp
function reversalPredict(h) {
    let n = Math.min(h.length, 200);
    if (n < 3) return 0.5;
    
    let s = streak(h);
    let curV = h[0];
    
    if (s >= 4) {
        // Xác suất đảo chiều cao
        return curV === 'T' ? 0.19 : 0.81; // 81% nếu đang T, 19% nếu đang X
    }
    if (s >= 3) {
        return curV === 'T' ? 0.28 : 0.72; // 72% nếu đang T, 28% nếu đang X
    }
    if (s >= 2) {
        return curV === 'T' ? 0.45 : 0.55;
    }
    return 0.5;
}

// 5. SMART - Kết hợp tất cả phương pháp
function smartPredict(h) {
    let n = Math.min(h.length, 200);
    if (n < 3) return 0.5;
    
    // Lấy kết quả từ các phương pháp
    let pMaj = majorityPredict(h);
    let pTrend = trendPredict(h);
    let pCycle = cyclePredict(h);
    let pRev = reversalPredict(h);
    
    // Trọng số dựa trên độ tin cậy của từng phương pháp
    let weights = {
        rev: 0.40,
        trend: 0.25,
        cycle: 0.20,
        maj: 0.15
    };
    
    // Điều chỉnh trọng số theo tình huống
    let s = streak(h);
    if (s >= 3) {
        weights.rev = 0.55;
        weights.trend = 0.15;
        weights.cycle = 0.15;
        weights.maj = 0.15;
    } else if (s === 1) {
        weights.rev = 0.20;
        weights.trend = 0.35;
        weights.cycle = 0.25;
        weights.maj = 0.20;
    }
    
    let finalP = pRev * weights.rev + pTrend * weights.trend + pCycle * weights.cycle + pMaj * weights.maj;
    
    // Điều chỉnh dựa trên tổng thể (48.32% T, 51.68% X)
    let globalBias = 0.4832;
    finalP = finalP * 0.9 + globalBias * 0.1;
    
    return Math.min(Math.max(finalP, 0.01), 0.99);
}

// ============================================================
// HÀM CHÍNH DỰ ĐOÁN
// ============================================================

function computePrediction(h) {
    let d = h.slice(0, Math.min(h.length, 200));
    let n = d.length;
    if (n < 3) return { prediction: 'X', confidence: 50, streak: 0, prob: 0.5 };
    
    // Lấy dự đoán từ SMART
    let p = smartPredict(d);
    
    // Phân tích chuỗi hiện tại
    let s = streak(d);
    let curV = d[0];
    
    // Điều chỉnh dựa trên quy luật đảo chiều
    if (s >= 4) {
        let revProb = curV === 'T' ? 0.19 : 0.81;
        p = p * 0.4 + revProb * 0.6;
    } else if (s >= 3) {
        let revProb = curV === 'T' ? 0.28 : 0.72;
        p = p * 0.5 + revProb * 0.5;
    }
    
    // Quyết định cuối cùng
    let finalDecision = p >= 0.5 ? 'T' : 'X';
    let confidence = Math.min(98, Math.max(50, Math.round(Math.abs(p - 0.5) * 200)));
    
    // Nếu confidence thấp, ưu tiên dự đoán đảo chiều nếu có chuỗi dài
    if (confidence < 60 && s >= 3) {
        finalDecision = curV === 'T' ? 'X' : 'T';
        confidence = Math.min(85, confidence + 20);
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
    if (!data) {
        return { error: "Khong the lay du lieu tu API" };
    }
    
    let parsed = parseData(data);
    if (!parsed.length) {
        return { error: "Du lieu khong hop le" };
    }
    
    let h = parsed.map(r => r.tx);
    let result = computePrediction(h);
    let latest = parsed[parsed.length - 1];
    let nextSession = latest ? latest.session + 1 : 1;
    
    // Đếm tổng T/X từ dữ liệu
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
    if (!data) {
        return { error: "Khong the lay du lieu tu API" };
    }
    
    let parsed = parseData(data);
    if (!parsed.length) {
        return { error: "Du lieu khong hop le" };
    }
    
    // Lấy số lượng phiên theo limit, mặc định 50
    let history = parsed.slice(-Math.min(limit, parsed.length));
    
    // Đảo ngược để hiển thị mới nhất trước
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

// Dự đoán MD5
app.get("/lc79/md5", async (request, reply) => {
    let result = await handlePrediction(API_MD5, "LC79 MD5");
    if (result.error) {
        return reply.status(503).send({ error: result.error });
    }
    return result;
});

// Dự đoán Hũ
app.get("/lc79/hu", async (request, reply) => {
    let result = await handlePrediction(API_HU, "LC79 Hũ");
    if (result.error) {
        return reply.status(503).send({ error: result.error });
    }
    return result;
});

// Lịch sử MD5
app.get("/lc79/historymd5", async (request, reply) => {
    const limit = request.query.limit ? parseInt(request.query.limit) : 50;
    let result = await handleHistory(API_MD5, limit);
    if (result.error) {
        return reply.status(503).send({ error: result.error });
    }
    return result;
});

// Lịch sử Hũ
app.get("/lc79/historyhu", async (request, reply) => {
    const limit = request.query.limit ? parseInt(request.query.limit) : 50;
    let result = await handleHistory(API_HU, limit);
    if (result.error) {
        return reply.status(503).send({ error: result.error });
    }
    return result;
});

// Trang chủ
app.get("/", async () => {
    return {
        status: "active",
        service: "LC79 Prediction API",
        author: "Duy Bảo",
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
        console.log(`Server running on port ${PORT}`);
        console.log(`- Dự đoán MD5: http://localhost:${PORT}/lc79/md5`);
        console.log(`- Dự đoán Hũ: http://localhost:${PORT}/lc79/hu`);
        console.log(`- Lịch sử MD5: http://localhost:${PORT}/lc79/historymd5`);
        console.log(`- Lịch sử Hũ: http://localhost:${PORT}/lc79/historyhu`);
    } catch (err) {
        console.error("Error starting server:", err.message);
        process.exit(1);
    }
};

start();
