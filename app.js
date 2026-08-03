"use strict";

const STORAGE_KEY = "financeManagerData_v1";

const CATEGORY_LABEL = { credit: "クレジット", etc: "ETC", prepaid: "プリペイド", debit: "デビット" };
const HOLDER_LABEL = { self: "本人", family: "家族" };
const REWARD_CALC_LABEL = { per_transaction: "1決済毎", monthly_total: "月額累計" };
const BRAND_LABEL = { visa: "VISA", mastercard: "Mastercard", jcb: "JCB", amex: "AMEX", diners: "Diners" };
const ANNUAL_FEE_LABEL = { free: "無料", conditional_free: "条件達成で無料", paid: "有料" };
const RANK_LABEL = { normal: "ノーマル", gold: "ゴールド", platinum: "プラチナ", black: "ブラック" };
const CARD_FORMAT_LABEL = { physical: "リアルカード", virtual: "バーチャルカード", both: "リアル・バーチャル両方" };

const WITHDRAWAL_CATEGORY_LABEL = {
  subscription: "サブスク",
  utility: "公共料金",
  rent: "家賃",
  insurance: "保険",
  loan: "ローン・分割払い",
  telecom: "通信費",
  membership: "会費・その他固定費",
  other: "その他"
};

const BANK_TYPE_LABEL = {
  net: "ネット銀行",
  regional: "地方銀行",
  city: "都市銀行",
  shinkin: "信用金庫・信用組合",
  yucho: "ゆうちょ銀行",
  other: "その他"
};

const SCREEN_THEME = {
  card: { primary: "#2563eb", dark: "#1d4ed8" },
  bank: { primary: "#0f766e", dark: "#0d5f58" },
  sim: { primary: "#7c3aed", dark: "#6d28d9" }
};

const CARRIER_TYPE_LABEL = { mainBrand: "本ブランド", subBrand: "サブブランド", onlineBrand: "オンライン専用ブランド", mvno: "格安SIM" };
const NETWORK_TYPE_LABEL = { docomo: "docomo回線", au: "au回線", softbank: "SoftBank回線", rakuten: "楽天回線", other: "その他" };
const CONTRACT_TYPE_LABEL = { new: "新規契約", mnp: "MNP契約" };
const SIM_TYPE_LABEL = { physical: "物理SIM", esim: "eSIM" };
const YESNO_LABEL = { yes: "あり", no: "なし" };

function rankDisplay(card) {
  if (card.rankType === "custom") return card.rankCustom || "";
  return RANK_LABEL[card.rankType] || "";
}

let data = { cards: [], payments: [], banks: [], withdrawals: [], lines: [] };
let activeScreen = "card";

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);
}

function dayLabel(day) {
  return day === "end" ? "月末" : day ? `${day}日` : "未設定";
}

function sortableDayValue(day) {
  if (day === "end") return 32;
  if (day) return Number(day);
  return 99;
}

function populateDaySelect(select) {
  select.innerHTML = '<option value="">未設定</option>';
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement("option");
    opt.value = String(d);
    opt.textContent = `${d}日`;
    select.appendChild(opt);
  }
  const endOpt = document.createElement("option");
  endOpt.value = "end";
  endOpt.textContent = "月末";
  select.appendChild(endOpt);
}

/* ---------- データ読み込み・保存 ---------- */

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      data = {
        cards: parsed.cards || [],
        payments: parsed.payments || [],
        banks: parsed.banks || [],
        withdrawals: parsed.withdrawals || [],
        lines: parsed.lines || []
      };
      return;
    } catch (e) {
      console.error("データの読み込みに失敗しました", e);
    }
  }
  seedSampleData();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function seedSampleData() {
  const bankA = { id: uid(), name: "サンプル: 楽天銀行", branchName: "第一営業支店", accountNumber: "普通 1234567", bankType: "net", memo: "サンプルデータです。編集・削除して自分の銀行情報に置き換えてください。" };
  const bankB = { id: uid(), name: "サンプル: ○○地方銀行", branchName: "渋谷支店", accountNumber: "普通 7654321", bankType: "regional", memo: "" };

  const cardA = {
    id: uid(), name: "サンプル: 楽天カード", last4: "1234", category: "credit", cardFormat: "physical", brand: "visa",
    holderType: "self", holderName: "", purpose: "生活費全般",
    rewardRate: 1.0, rewardCalcType: "per_transaction", pointsEarned: "楽天ポイント", creditLimit: 500000,
    annualFeeType: "free", annualFeeAmount: 0,
    rankType: "normal", rankCustom: "",
    closingDay: "end", paymentDay: "27", paymentAccount: "楽天銀行 普通 1234567", linkedBankId: bankA.id,
    cancelPlanned: "no", cancelNote: "", etcVehicle: "", memo: "サンプルデータです。編集・削除して自分のカード情報を登録してください。"
  };
  const cardB = {
    id: uid(), name: "サンプル: ETCカード", last4: "5678", category: "etc", cardFormat: "physical", brand: "",
    holderType: "self", holderName: "", purpose: "高速道路料金",
    rewardRate: 0, rewardCalcType: "monthly_total", pointsEarned: "", creditLimit: 0,
    annualFeeType: "free", annualFeeAmount: 0,
    rankType: "normal", rankCustom: "",
    closingDay: "end", paymentDay: "27", paymentAccount: "", linkedBankId: "",
    cancelPlanned: "no", cancelNote: "", etcVehicle: "自家用車(例: 品川300 あ12-34)", memo: "このカードはまだ銀行が未設定のサンプルです。「紐づける銀行」を設定すると反映対象になります。"
  };

  data.banks = [bankA, bankB];
  data.cards = [cardA, cardB];
  data.payments = [
    { id: uid(), cardId: cardA.id, name: "サンプル: 電気代", amount: 8000, note: "「🔗 カードの固定支払いを反映」を押すと銀行管理側に自動登録されます", history: [] }
  ];
  data.withdrawals = [
    { id: uid(), bankId: bankA.id, serviceName: "サンプル: Netflix", category: "subscription", day: "5", amount: 1490, cancelPlanned: "no", cancelNote: "", memo: "" },
    { id: uid(), bankId: bankB.id, serviceName: "サンプル: 東京電力", category: "utility", day: "27", amount: 8000, cancelPlanned: "no", cancelNote: "", memo: "" },
    { id: uid(), bankId: bankA.id, serviceName: "サンプル: 使っていないジム会費", category: "membership", day: "10", amount: 6000, cancelPlanned: "yes", cancelNote: "2026年内に解約予定", memo: "" }
  ];

  const today = new Date();
  const longAgo = new Date(today.getTime() - 220 * DAY_MS).toISOString().slice(0, 10);
  const recent = new Date(today.getTime() - 30 * DAY_MS).toISOString().slice(0, 10);

  const lineA = {
    id: uid(), brandName: "サンプル: IIJmio", carrierType: "mvno", networkType: "docomo",
    phoneNumber: "090-0000-0001", linkedCardId: cardA.id,
    contractDate: longAgo, contractType: "mnp", mnpFromCarrier: "docomo",
    contractCount: 1, cancelDate: "", cancelPlannedDate: "", terminationFee: 0, cancelReason: "",
    ngHistory: "no", ngDate: "",
    monthlyFee: 2000, dataAllowanceUnlimited: false, dataAllowanceGB: 20,
    discountEndDate: "", priceAfterDiscountFee: 0,
    simType: "esim", simCardNumber: "", contractHolder: "本人", lineUser: "本人",
    deviceNote: "おれのiPhone13mini", simultaneousApplication: "no",
    campaignUsed: "yes", campaignDetail: "契約事務手数料無料キャンペーン", pointSiteUsed: "no",
    memo: "サンプルデータです。編集・削除して自分の回線情報を登録してください。"
  };
  const lineB = {
    id: uid(), brandName: "サンプル: LINEMO", carrierType: "onlineBrand", networkType: "softbank",
    phoneNumber: "090-0000-0002", linkedCardId: "",
    contractDate: recent, contractType: "new", mnpFromCarrier: "",
    contractCount: 1, cancelDate: "", cancelPlannedDate: "", terminationFee: 0, cancelReason: "",
    ngHistory: "no", ngDate: "",
    monthlyFee: 990, dataAllowanceUnlimited: false, dataAllowanceGB: 3,
    discountEndDate: "", priceAfterDiscountFee: 0,
    simType: "physical", simCardNumber: "8981100000000000001", contractHolder: "本人", lineUser: "本人",
    deviceNote: "おれのPixel6a", simultaneousApplication: "no",
    campaignUsed: "no", campaignDetail: "", pointSiteUsed: "yes",
    memo: ""
  };
  data.lines = [lineA, lineB];

  saveData();
}

/* ---------- ユーティリティ ---------- */

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatYen(n) {
  const num = Number(n);
  if (!num) return "";
  return num.toLocaleString("ja-JP") + "円";
}

function cardName(cardId) {
  const c = data.cards.find(c => c.id === cardId);
  return c ? c.name : "(削除済みカード)";
}

function bankDisplayName(b) {
  return b.name + (b.branchName ? " " + b.branchName : "");
}

function bankName(bankId) {
  const b = data.banks.find(b => b.id === bankId);
  return b ? bankDisplayName(b) : "(削除済みの銀行)";
}

function paymentsForCard(cardId) {
  return data.payments.filter(p => p.cardId === cardId);
}

function withdrawalsForBank(bankId) {
  return data.withdrawals.filter(w => w.bankId === bankId);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  return String(str).replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

/* ---------- SIM: 派生値計算 ---------- */

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDateOnly(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return isNaN(d) ? null : d;
}

function daysSince(dateStr) {
  const d = parseDateOnly(dateStr);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - d) / DAY_MS);
}

function is180DaysPassed(line) {
  const days = daysSince(line.contractDate);
  return days !== null && days >= 180;
}

function nextMnpEligibleDate(line) {
  const d = parseDateOnly(line.contractDate);
  if (!d) return null;
  const result = new Date(d);
  result.setDate(result.getDate() + 180);
  return result.toISOString().slice(0, 10);
}

function mnpEligibilityStatus(line) {
  const days = daysSince(line.contractDate);
  if (days === null) return null;
  const remaining = 180 - days;
  if (remaining <= 0) return "eligible";
  if (remaining <= 14) return "soon";
  return "notyet";
}

function costPerGB(line) {
  if (line.dataAllowanceUnlimited) return null;
  const gb = Number(line.dataAllowanceGB);
  const fee = Number(line.monthlyFee);
  if (!gb || gb <= 0 || !fee) return null;
  return fee / gb;
}

function formatCostPerGB(line) {
  const v = costPerGB(line);
  return v === null ? "―" : `${v.toFixed(1)}円/GB`;
}

function ngElapsedMonths(line) {
  if (line.ngHistory !== "yes" || !line.ngDate) return null;
  const ngDate = parseDateOnly(line.ngDate);
  if (!ngDate) return null;
  const today = new Date();
  let months = (today.getFullYear() - ngDate.getFullYear()) * 12 + (today.getMonth() - ngDate.getMonth());
  if (today.getDate() < ngDate.getDate()) months--;
  return Math.max(0, months);
}

function discountWarning(line) {
  if (!line.discountEndDate) return null;
  const days = daysSince(line.discountEndDate);
  if (days === null) return null;
  if (days >= 0) return { status: "ended", days };
  if (days >= -30) return { status: "imminent", days: -days };
  return null;
}

/* ---------- 画面切り替え(カード管理 / 銀行管理 / SIM管理) ---------- */

const SCREEN_TITLE = { card: "カード管理", bank: "銀行管理", sim: "SIM管理" };

function switchScreen(screen) {
  activeScreen = screen;
  document.getElementById("screenCard").hidden = screen !== "card";
  document.getElementById("screenBank").hidden = screen !== "bank";
  document.getElementById("screenSim").hidden = screen !== "sim";
  document.getElementById("tabCard").classList.toggle("active", screen === "card");
  document.getElementById("tabBank").classList.toggle("active", screen === "bank");
  document.getElementById("tabSim").classList.toggle("active", screen === "sim");
  document.querySelectorAll(".screen-card").forEach(el => { el.hidden = screen !== "card"; });
  document.querySelectorAll(".screen-bank").forEach(el => { el.hidden = screen !== "bank"; });
  document.querySelectorAll(".screen-sim").forEach(el => { el.hidden = screen !== "sim"; });
  document.getElementById("screenTitle").textContent = SCREEN_TITLE[screen] || "";

  const theme = SCREEN_THEME[screen];
  document.documentElement.style.setProperty("--color-primary", theme.primary);
  document.documentElement.style.setProperty("--color-primary-dark", theme.dark);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", theme.primary);

  adjustFooterSpacing();
}

document.getElementById("tabCard").addEventListener("click", () => switchScreen("card"));
document.getElementById("tabBank").addEventListener("click", () => switchScreen("bank"));
document.getElementById("tabSim").addEventListener("click", () => switchScreen("sim"));

/* ---------- 描画まとめ ---------- */

function render() {
  renderCardSummary();
  renderCardList();
  renderBankSummary();
  renderWithdrawalList();
  renderSimSummary();
  renderSimList();
  saveData();
}

/* ==================================================================
   カード管理画面
   ================================================================== */

function renderCardSummary() {
  const el = document.getElementById("cardSummary");
  const total = data.cards.length;
  const byCategory = {};
  let familyCount = 0;
  let cancelCount = 0;
  let limitTotal = 0;
  for (const c of data.cards) {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
    if (c.holderType === "family") familyCount++;
    if (c.cancelPlanned === "yes") cancelCount++;
    limitTotal += Number(c.creditLimit) || 0;
  }
  const paymentTotal = data.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  el.innerHTML = `
    <div class="stat"><span class="num">${total}</span><span class="label">総枚数</span></div>
    <div class="stat"><span class="num">${familyCount}</span><span class="label">家族カード</span></div>
    <div class="stat"><span class="num">${cancelCount}</span><span class="label">解約予定</span></div>
    <div class="stat"><span class="num">${limitTotal.toLocaleString("ja-JP")}</span><span class="label">カード利用枠合計(円)</span></div>
    <div class="stat"><span class="num">${paymentTotal.toLocaleString("ja-JP")}</span><span class="label">固定支払い月額合計(円)</span></div>
    <div class="summary-row-break"></div>
    <div class="stat"><span class="num">${byCategory.credit || 0}</span><span class="label">クレジット枚数</span></div>
    <div class="stat"><span class="num">${byCategory.etc || 0}</span><span class="label">ETC枚数</span></div>
    <div class="stat"><span class="num">${byCategory.debit || 0}</span><span class="label">デビット枚数</span></div>
    <div class="stat"><span class="num">${byCategory.prepaid || 0}</span><span class="label">プリペイド枚数</span></div>
  `;
}

function getFilteredSortedCards() {
  const search = document.getElementById("cardSearchInput").value.trim().toLowerCase();
  const fCategory = document.getElementById("filterCategory").value;
  const fHolder = document.getElementById("filterHolder").value;
  const fCancel = document.getElementById("filterCancel").value;
  const fRank = document.getElementById("filterRank").value;
  const fBrand = document.getElementById("filterBrand").value;
  const sortKey = document.getElementById("sortKey").value;

  let list = data.cards.filter(c => {
    if (fCategory && c.category !== fCategory) return false;
    if (fHolder && c.holderType !== fHolder) return false;
    if (fCancel && c.cancelPlanned !== fCancel) return false;
    if (fRank && (c.rankType || "normal") !== fRank) return false;
    if (fBrand && c.brand !== fBrand) return false;
    if (search) {
      const hay = [c.name, c.last4, c.memo, c.purpose, c.holderName, c.etcVehicle, rankDisplay(c)].join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (sortKey === "rewardRate") return (Number(b.rewardRate) || 0) - (Number(a.rewardRate) || 0);
    if (sortKey === "creditLimit") return (Number(b.creditLimit) || 0) - (Number(a.creditLimit) || 0);
    if (sortKey === "category") return (a.category || "").localeCompare(b.category || "");
    if (sortKey === "paymentDay") return sortableDayValue(a.paymentDay) - sortableDayValue(b.paymentDay);
    return (a.name || "").localeCompare(b.name || "", "ja");
  });

  return list;
}

function renderCardList() {
  const list = getFilteredSortedCards();
  const container = document.getElementById("cardList");
  const emptyState = document.getElementById("cardEmptyState");

  container.innerHTML = "";
  emptyState.hidden = list.length !== 0;

  for (const card of list) {
    const payments = paymentsForCard(card.id);
    const div = document.createElement("div");
    div.className = "card-item";
    div.dataset.id = card.id;

    const badges = [
      `<span class="badge category-${card.category}">${CATEGORY_LABEL[card.category] || card.category}</span>`
    ];
    badges.push(`<span class="badge">${escapeHtml(CARD_FORMAT_LABEL[card.cardFormat] || CARD_FORMAT_LABEL.physical)}</span>`);
    if (card.brand) badges.push(`<span class="badge">${escapeHtml(BRAND_LABEL[card.brand] || card.brand)}</span>`);
    if (rankDisplay(card)) badges.push(`<span class="badge">${escapeHtml(rankDisplay(card))}</span>`);
    if (card.holderType === "family") {
      badges.push(`<span class="badge holder-family">家族${card.holderName ? "・" + escapeHtml(card.holderName) : ""}</span>`);
    }
    if (card.linkedBankId && data.banks.some(b => b.id === card.linkedBankId)) {
      badges.push(`<span class="badge badge-bank">🏦 ${escapeHtml(bankName(card.linkedBankId))}</span>`);
    }
    if (card.cancelPlanned === "yes") badges.push(`<span class="badge cancel-yes">解約予定</span>`);

    div.innerHTML = `
      <div class="card-item-top">
        <span class="card-item-name">${escapeHtml(card.name)}</span>
        <span class="card-item-last4">${card.last4 ? "•••• " + escapeHtml(card.last4) : ""}</span>
      </div>
      <div class="badges">${badges.join("")}</div>
      <div class="card-item-meta">
        ${card.rewardRate ? `<span><b>${card.rewardRate}%</b> 還元(${REWARD_CALC_LABEL[card.rewardCalcType] || ""})</span>` : ""}
        ${card.pointsEarned ? `<span>貯まるポイント: <b>${escapeHtml(card.pointsEarned)}</b></span>` : ""}
        ${card.annualFeeType === "paid" ? `<span>年会費 <b>${formatYen(card.annualFeeAmount)}</b></span>` : ""}
        ${card.annualFeeType === "conditional_free" ? `<span>年会費 <b>条件達成で無料</b>(本来${formatYen(card.annualFeeAmount)})</span>` : ""}
        ${card.category !== "debit" && card.category !== "prepaid" && card.creditLimit ? `<span>カード利用枠 <b>${formatYen(card.creditLimit)}</b></span>` : ""}
        ${card.category === "debit" && (card.debitPerTxLimit || card.debitDailyLimit || card.debitMonthlyLimit) ? `<span>限度額 1回<b>${formatYen(card.debitPerTxLimit)}</b> / 1日<b>${formatYen(card.debitDailyLimit)}</b> / 1ヶ月<b>${formatYen(card.debitMonthlyLimit)}</b></span>` : ""}
        ${card.category === "prepaid" && card.balanceAccount ? `<span>残高口座: <b>${escapeHtml(card.balanceAccount)}</b></span>` : ""}
        ${card.category === "etc" && card.etcVehicle ? `<span>対象車両: <b>${escapeHtml(card.etcVehicle)}</b></span>` : ""}
        ${(card.category === "credit" || card.category === "etc") && (card.closingDay || card.paymentDay) ? `<span>締め<b>${dayLabel(card.closingDay)}</b> / 引落<b>${dayLabel(card.paymentDay)}</b></span>` : ""}
        ${(card.category === "credit" || card.category === "etc") && card.paymentAccount ? `<span>引落口座: <b>${escapeHtml(card.paymentAccount)}${card.branchName ? " " + escapeHtml(card.branchName) : ""}</b></span>` : ""}
      </div>
      ${payments.length ? `<div class="card-item-payments">固定支払い ${payments.length}件 / 月額計 ${formatYen(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0))}</div>` : ""}
    `;
    div.addEventListener("click", () => openCardModal(card.id));
    container.appendChild(div);
  }
}

/* ---------- カード追加・編集モーダル ---------- */

const cardModal = document.getElementById("cardModal");
const cardForm = document.getElementById("cardForm");

function openCardModal(cardId) {
  cardForm.reset();
  refreshAllBankSelects();
  document.getElementById("cardId").value = cardId || "";
  document.getElementById("btnDeleteCard").hidden = !cardId;
  document.getElementById("cardModalTitle").textContent = cardId ? "カードを編集" : "カードを追加";

  if (cardId) {
    const card = data.cards.find(c => c.id === cardId);
    fillCardForm(card);
    document.getElementById("paymentsSection").hidden = false;
    renderPaymentsList(cardId);
  } else {
    document.getElementById("f_category").value = "credit";
    document.getElementById("f_cardFormat").value = "physical";
    document.getElementById("f_brand").value = "";
    document.getElementById("f_holderType").value = "self";
    document.getElementById("f_rewardCalcType").value = "per_transaction";
    document.getElementById("f_pointsEarned").value = "";
    document.getElementById("f_annualFeeType").value = "free";
    document.getElementById("f_annualFeeAmount").value = "";
    document.getElementById("f_rankType").value = "normal";
    document.getElementById("f_rankCustom").value = "";
    document.getElementById("f_closingDay").value = "";
    document.getElementById("f_paymentDay").value = "";
    document.getElementById("f_paymentAccount").value = "";
    document.getElementById("f_branchName").value = "";
    document.getElementById("f_linkedBankId").value = "";
    document.getElementById("f_debitPerTxLimit").value = "";
    document.getElementById("f_debitDailyLimit").value = "";
    document.getElementById("f_debitMonthlyLimit").value = "";
    document.getElementById("f_balanceAccount").value = "";
    document.getElementById("f_cancelPlanned").value = "no";
    document.getElementById("paymentsSection").hidden = true;
    toggleCardConditionalFields();
  }
  cardModal.hidden = false;
  const modalBody = cardModal.querySelector(".modal-body");
  if (modalBody) modalBody.scrollTop = 0;
}

function fillCardForm(card) {
  document.getElementById("f_name").value = card.name || "";
  document.getElementById("f_last4").value = card.last4 || "";
  document.getElementById("f_category").value = card.category || "credit";
  document.getElementById("f_cardFormat").value = card.cardFormat || "physical";
  document.getElementById("f_brand").value = card.brand || "";
  document.getElementById("f_etcVehicle").value = card.etcVehicle || "";
  document.getElementById("f_holderType").value = card.holderType || "self";
  document.getElementById("f_holderName").value = card.holderName || "";
  document.getElementById("f_purpose").value = card.purpose || "";
  document.getElementById("f_rewardRate").value = card.rewardRate ?? "";
  document.getElementById("f_rewardCalcType").value = card.rewardCalcType || "per_transaction";
  document.getElementById("f_pointsEarned").value = card.pointsEarned || "";
  document.getElementById("f_annualFeeType").value = card.annualFeeType || "free";
  document.getElementById("f_annualFeeAmount").value = card.annualFeeAmount ?? "";
  document.getElementById("f_rankType").value = card.rankType || "normal";
  document.getElementById("f_rankCustom").value = card.rankCustom || "";
  document.getElementById("f_creditLimit").value = card.creditLimit ?? "";
  document.getElementById("f_debitPerTxLimit").value = card.debitPerTxLimit ?? "";
  document.getElementById("f_debitDailyLimit").value = card.debitDailyLimit ?? "";
  document.getElementById("f_debitMonthlyLimit").value = card.debitMonthlyLimit ?? "";
  document.getElementById("f_balanceAccount").value = card.balanceAccount || "";
  document.getElementById("f_closingDay").value = card.closingDay || "";
  document.getElementById("f_paymentDay").value = card.paymentDay || "";
  document.getElementById("f_paymentAccount").value = card.paymentAccount || "";
  document.getElementById("f_branchName").value = card.branchName || "";
  document.getElementById("f_linkedBankId").value = data.banks.some(b => b.id === card.linkedBankId) ? card.linkedBankId : "";
  document.getElementById("f_cancelPlanned").value = card.cancelPlanned || "no";
  document.getElementById("f_cancelNote").value = card.cancelNote || "";
  document.getElementById("f_memo").value = card.memo || "";
  toggleCardConditionalFields();
}

function toggleCardConditionalFields() {
  const category = document.getElementById("f_category").value;
  document.getElementById("wrap_etcVehicle").hidden = category !== "etc";
  document.getElementById("wrap_billingInfo").hidden = category !== "credit" && category !== "etc";
  const holderType = document.getElementById("f_holderType").value;
  document.getElementById("wrap_holderName").hidden = holderType !== "family";

  const annualFeeType = document.getElementById("f_annualFeeType").value;
  document.getElementById("wrap_annualFeeAmount").hidden = annualFeeType === "free";
  document.getElementById("lbl_annualFeeAmount").textContent = annualFeeType === "conditional_free" ? "本来の年会費(円)" : "年会費(円)";

  const rankType = document.getElementById("f_rankType").value;
  document.getElementById("wrap_rankCustom").hidden = rankType !== "custom";

  const rewardRate = Number(document.getElementById("f_rewardRate").value) || 0;
  document.getElementById("wrap_rewardCalcType").hidden = rewardRate === 0;
  document.getElementById("wrap_pointsEarned").hidden = rewardRate === 0;

  const isDebit = category === "debit";
  const isPrepaid = category === "prepaid";
  document.getElementById("wrap_creditLimit").hidden = isDebit || isPrepaid;
  document.getElementById("wrap_debitLimits").hidden = !isDebit;
  document.getElementById("wrap_balanceAccount").hidden = !isPrepaid;
}

document.getElementById("f_category").addEventListener("change", toggleCardConditionalFields);
document.getElementById("f_holderType").addEventListener("change", toggleCardConditionalFields);
document.getElementById("f_annualFeeType").addEventListener("change", toggleCardConditionalFields);
document.getElementById("f_rankType").addEventListener("change", toggleCardConditionalFields);
document.getElementById("f_rewardRate").addEventListener("input", toggleCardConditionalFields);

function closeCardModal() {
  cardModal.hidden = true;
}

function readCardFormInto(card) {
  card.name = document.getElementById("f_name").value.trim();
  card.last4 = document.getElementById("f_last4").value.trim().slice(0, 4);
  card.category = document.getElementById("f_category").value;
  card.cardFormat = document.getElementById("f_cardFormat").value;
  card.brand = document.getElementById("f_brand").value;
  card.etcVehicle = document.getElementById("f_etcVehicle").value.trim();
  card.holderType = document.getElementById("f_holderType").value;
  card.holderName = document.getElementById("f_holderName").value.trim();
  card.purpose = document.getElementById("f_purpose").value.trim();
  card.rewardRate = document.getElementById("f_rewardRate").value === "" ? 0 : Number(document.getElementById("f_rewardRate").value);
  card.rewardCalcType = document.getElementById("f_rewardCalcType").value;
  card.pointsEarned = document.getElementById("f_pointsEarned").value.trim();
  card.annualFeeType = document.getElementById("f_annualFeeType").value;
  card.annualFeeAmount = document.getElementById("f_annualFeeAmount").value === "" ? 0 : Number(document.getElementById("f_annualFeeAmount").value);
  card.rankType = document.getElementById("f_rankType").value;
  card.rankCustom = document.getElementById("f_rankCustom").value.trim();
  card.creditLimit = document.getElementById("f_creditLimit").value === "" ? 0 : Number(document.getElementById("f_creditLimit").value);
  card.debitPerTxLimit = document.getElementById("f_debitPerTxLimit").value === "" ? 0 : Number(document.getElementById("f_debitPerTxLimit").value);
  card.debitDailyLimit = document.getElementById("f_debitDailyLimit").value === "" ? 0 : Number(document.getElementById("f_debitDailyLimit").value);
  card.debitMonthlyLimit = document.getElementById("f_debitMonthlyLimit").value === "" ? 0 : Number(document.getElementById("f_debitMonthlyLimit").value);
  card.balanceAccount = document.getElementById("f_balanceAccount").value.trim();
  card.closingDay = document.getElementById("f_closingDay").value;
  card.paymentDay = document.getElementById("f_paymentDay").value;
  card.paymentAccount = document.getElementById("f_paymentAccount").value.trim();
  card.branchName = document.getElementById("f_branchName").value.trim();
  card.linkedBankId = document.getElementById("f_linkedBankId").value;
  card.cancelPlanned = document.getElementById("f_cancelPlanned").value;
  card.cancelNote = document.getElementById("f_cancelNote").value.trim();
  card.memo = document.getElementById("f_memo").value.trim();
  return card;
}

cardForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const idField = document.getElementById("cardId").value;
  if (idField) {
    const card = data.cards.find(c => c.id === idField);
    readCardFormInto(card);
    render();
    closeCardModal();
  } else {
    const card = readCardFormInto({ id: uid() });
    data.cards.push(card);
    render();
    openCardModal(card.id);
  }
});

document.getElementById("btnDeleteCard").addEventListener("click", () => {
  const cardId = document.getElementById("cardId").value;
  const payments = paymentsForCard(cardId);
  let msg = "このカードを削除しますか?";
  if (payments.length) {
    msg = `このカードには固定支払いが${payments.length}件紐づいています。カードを削除すると、これらの固定支払いの記録も削除されます(銀行管理側に反映済みの引き落としは残ります)。\n先に「移動」で他のカードへ移してから削除することをおすすめします。\n本当に削除しますか?`;
  }
  if (!confirm(msg)) return;
  data.cards = data.cards.filter(c => c.id !== cardId);
  data.payments = data.payments.filter(p => p.cardId !== cardId);
  render();
  closeCardModal();
});

document.getElementById("btnAddCard").addEventListener("click", () => openCardModal(null));

/* ---------- 固定支払い ---------- */

const paymentModal = document.getElementById("paymentModal");
const paymentForm = document.getElementById("paymentForm");

function renderPaymentsList(cardId) {
  const ul = document.getElementById("paymentList");
  const payments = paymentsForCard(cardId);
  ul.innerHTML = "";
  if (!payments.length) {
    ul.innerHTML = `<li class="payment-item"><span class="payment-item-amount">登録されている固定支払いはありません</span></li>`;
    return;
  }
  for (const p of payments) {
    const li = document.createElement("li");
    li.className = "payment-item";
    li.innerHTML = `
      <div class="payment-item-main">
        <span class="payment-item-name">${escapeHtml(p.name)}</span>
        <span class="payment-item-amount">${formatYen(p.amount)}${p.note ? " / " + escapeHtml(p.note) : ""}</span>
      </div>
      <div class="payment-item-actions">
        <button data-action="edit">編集</button>
        <button data-action="move">移動</button>
      </div>
    `;
    li.querySelector('[data-action="edit"]').addEventListener("click", () => openPaymentModal(cardId, p.id));
    li.querySelector('[data-action="move"]').addEventListener("click", () => openMoveModal(p.id));
    ul.appendChild(li);
  }
}

function openPaymentModal(cardId, paymentId) {
  paymentForm.reset();
  document.getElementById("p_cardId").value = cardId;
  document.getElementById("p_id").value = paymentId || "";
  document.getElementById("btnDeletePayment").hidden = !paymentId;
  document.getElementById("paymentModalTitle").textContent = paymentId ? "固定支払いを編集" : "固定支払いを追加";
  if (paymentId) {
    const p = data.payments.find(p => p.id === paymentId);
    document.getElementById("p_name").value = p.name || "";
    document.getElementById("p_amount").value = p.amount ?? "";
    document.getElementById("p_note").value = p.note || "";
  }
  paymentModal.hidden = false;
}

function closePaymentModal() {
  paymentModal.hidden = true;
}

paymentForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("p_id").value;
  const cardId = document.getElementById("p_cardId").value;
  const name = document.getElementById("p_name").value.trim();
  const amount = document.getElementById("p_amount").value === "" ? 0 : Number(document.getElementById("p_amount").value);
  const note = document.getElementById("p_note").value.trim();

  if (id) {
    const p = data.payments.find(p => p.id === id);
    p.name = name; p.amount = amount; p.note = note;
  } else {
    data.payments.push({ id: uid(), cardId, name, amount, note, history: [] });
  }
  saveData();
  renderPaymentsList(cardId);
  render();
  closePaymentModal();
});

document.getElementById("btnDeletePayment").addEventListener("click", () => {
  const id = document.getElementById("p_id").value;
  const cardId = document.getElementById("p_cardId").value;
  if (!confirm("この固定支払いを削除しますか?(銀行管理側に反映済みの引き落としは残ります)")) return;
  data.payments = data.payments.filter(p => p.id !== id);
  saveData();
  renderPaymentsList(cardId);
  render();
  closePaymentModal();
});

document.getElementById("btnAddPayment").addEventListener("click", () => {
  const cardId = document.getElementById("cardId").value;
  openPaymentModal(cardId, null);
});

/* ---------- 固定支払いの移動 ---------- */

const moveModal = document.getElementById("moveModal");
const moveForm = document.getElementById("moveForm");
let movingPaymentId = null;

function openMoveModal(paymentId) {
  movingPaymentId = paymentId;
  const p = data.payments.find(p => p.id === paymentId);
  document.getElementById("movePaymentLabel").textContent =
    `「${p.name}」(現在: ${cardName(p.cardId)}) の移動先を選んでください`;

  const select = document.getElementById("m_toCardId");
  select.innerHTML = "";
  for (const c of data.cards) {
    if (c.id === p.cardId) continue;
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  }
  document.getElementById("m_reason").value = "";
  renderMoveHistory(paymentId);
  moveModal.hidden = false;
}

function closeMoveModal() {
  moveModal.hidden = true;
  movingPaymentId = null;
}

function renderMoveHistory(paymentId) {
  const p = data.payments.find(p => p.id === paymentId);
  const el = document.getElementById("moveHistory");
  if (!p.history || !p.history.length) {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = "<b>移動履歴</b>" + p.history.map(h => `
    <div class="move-history-item">
      ${formatDate(h.date)}: ${escapeHtml(h.fromCardId ? cardName(h.fromCardId) : "―")} → ${escapeHtml(cardName(h.toCardId))}
      ${h.reason ? " / " + escapeHtml(h.reason) : ""}
    </div>
  `).join("");
}

moveForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const p = data.payments.find(p => p.id === movingPaymentId);
  const toCardId = document.getElementById("m_toCardId").value;
  const reason = document.getElementById("m_reason").value.trim();
  if (!toCardId) return;

  p.history = p.history || [];
  p.history.push({ date: new Date().toISOString(), fromCardId: p.cardId, toCardId, reason });
  p.cardId = toCardId;

  saveData();
  render();
  closeMoveModal();
  const openCardId = document.getElementById("cardId").value;
  if (openCardId && !cardModal.hidden) renderPaymentsList(openCardId);
});

/* ---------- 既存のカード管理アプリのデータを読み込む ---------- */

document.getElementById("btnImportLegacyCard").addEventListener("click", () => {
  document.getElementById("legacyCardImportFile").click();
});

document.getElementById("legacyCardImportFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.cards)) throw new Error("invalid");
      const msg = `現在のカードデータ(${data.cards.length}件)と固定支払いを、読み込むデータ(カード${parsed.cards.length}件)で上書きします。銀行管理のデータ(銀行・引き落とし)は影響を受けません。よろしいですか?`;
      if (!confirm(msg)) return;
      data.cards = parsed.cards || [];
      data.payments = parsed.payments || [];
      render();
      showToast("✓ カード管理データを読み込みました");
    } catch (err) {
      alert("読み込みに失敗しました。card-managerアプリのエクスポートファイルか確認してください。");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
});

/* ==================================================================
   銀行管理画面
   ================================================================== */

function renderBankSummary() {
  const el = document.getElementById("bankSummary");
  const bankCount = data.banks.length;
  const withdrawalCount = data.withdrawals.length;
  const cancelCount = data.withdrawals.filter(w => w.cancelPlanned === "yes").length;
  const monthlyTotal = data.withdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  el.innerHTML = `
    <div class="stat"><span class="num">${bankCount}</span><span class="label">登録銀行数</span></div>
    <div class="stat"><span class="num">${withdrawalCount}</span><span class="label">引き落とし件数</span></div>
    <div class="stat"><span class="num">${monthlyTotal.toLocaleString("ja-JP")}</span><span class="label">月間合計(円)</span></div>
    <div class="stat"><span class="num">${cancelCount}</span><span class="label">解約予定</span></div>
  `;
}

function getFilteredSortedWithdrawals() {
  const search = document.getElementById("withdrawalSearchInput").value.trim().toLowerCase();
  const fBank = document.getElementById("filterBank").value;
  const fCategory = document.getElementById("filterWithdrawalCategory").value;
  const fCancel = document.getElementById("filterWithdrawalCancel").value;
  const sortKey = document.getElementById("sortWithdrawalKey").value;

  let list = data.withdrawals.filter(w => {
    if (fBank && w.bankId !== fBank) return false;
    if (fCategory && w.category !== fCategory) return false;
    if (fCancel && w.cancelPlanned !== fCancel) return false;
    if (search) {
      const hay = [w.serviceName, w.memo, w.cancelNote, bankName(w.bankId)].join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (sortKey === "bank") return bankName(a.bankId).localeCompare(bankName(b.bankId), "ja");
    if (sortKey === "amount") return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    if (sortKey === "name") return (a.serviceName || "").localeCompare(b.serviceName || "", "ja");
    return sortableDayValue(a.day) - sortableDayValue(b.day);
  });

  return list;
}

function renderFilterSummary(list) {
  const el = document.getElementById("filterSummary");
  const total = list.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  el.textContent = `表示中 ${list.length}件 / 合計 ${total.toLocaleString("ja-JP")}円`;
}

function renderWithdrawalList() {
  const list = getFilteredSortedWithdrawals();
  const container = document.getElementById("withdrawalList");
  const emptyState = document.getElementById("withdrawalEmptyState");

  renderFilterSummary(list);

  container.innerHTML = "";
  emptyState.hidden = list.length !== 0;

  for (const w of list) {
    const div = document.createElement("div");
    div.className = "card-item";
    div.dataset.id = w.id;

    const badges = [
      `<span class="badge badge-bank">${escapeHtml(bankName(w.bankId))}</span>`,
      `<span class="badge">${WITHDRAWAL_CATEGORY_LABEL[w.category] || w.category}</span>`
    ];
    if (w.sourcePaymentId) badges.push(`<span class="badge badge-sync">🔗 カード連携</span>`);
    if (w.cancelPlanned === "yes") badges.push(`<span class="badge cancel-yes">解約予定</span>`);

    div.innerHTML = `
      <div class="card-item-top">
        <span class="card-item-name">${escapeHtml(w.serviceName)}</span>
        <span class="card-item-amount">${formatYen(w.amount)}</span>
      </div>
      <div class="card-item-day"><span class="day-label">引き落とし日</span>${dayLabel(w.day)}</div>
      <div class="badges">${badges.join("")}</div>
      <div class="card-item-meta">
        ${w.cancelPlanned === "yes" && w.cancelNote ? `<span>解約備考: <b>${escapeHtml(w.cancelNote)}</b></span>` : ""}
        ${w.memo ? `<span>${escapeHtml(w.memo)}</span>` : ""}
      </div>
    `;
    div.addEventListener("click", () => openWithdrawalModal(w.id));
    container.appendChild(div);
  }
}

/* ---------- 銀行セレクトの再構築(絞り込み・カードの紐づけ・引き落としの銀行) ---------- */

function refreshAllBankSelects() {
  const options = data.banks.map(b => `<option value="${b.id}">${escapeHtml(bankDisplayName(b))}</option>`).join("");

  const filterBank = document.getElementById("filterBank");
  const currentFilter = filterBank.value;
  filterBank.innerHTML = '<option value="">銀行: すべて</option>' + options;
  if (data.banks.some(b => b.id === currentFilter)) filterBank.value = currentFilter;

  const wBankId = document.getElementById("w_bankId");
  const currentSelected = wBankId.value;
  wBankId.innerHTML = options;
  if (data.banks.some(b => b.id === currentSelected)) wBankId.value = currentSelected;

  const linkedBankId = document.getElementById("f_linkedBankId");
  const currentLinked = linkedBankId.value;
  linkedBankId.innerHTML = '<option value="">未設定</option>' + options;
  if (data.banks.some(b => b.id === currentLinked)) linkedBankId.value = currentLinked;
}

/* ---------- 引き落とし追加・編集モーダル ---------- */

const withdrawalModal = document.getElementById("withdrawalModal");
const withdrawalForm = document.getElementById("withdrawalForm");

function openWithdrawalModal(withdrawalId) {
  if (!data.banks.length) {
    alert("先に「🏦 銀行」から銀行を1件以上登録してください。");
    return;
  }
  withdrawalForm.reset();
  refreshAllBankSelects();
  document.getElementById("w_id").value = withdrawalId || "";
  document.getElementById("btnDeleteWithdrawal").hidden = !withdrawalId;
  document.getElementById("withdrawalModalTitle").textContent = withdrawalId ? "引き落としを編集" : "引き落としを追加";

  if (withdrawalId) {
    const w = data.withdrawals.find(w => w.id === withdrawalId);
    fillWithdrawalForm(w);
  } else {
    document.getElementById("w_category").value = "subscription";
    document.getElementById("w_day").value = "1";
    document.getElementById("w_cancelPlanned").value = "no";
    document.getElementById("w_cancelNote").value = "";
    toggleWithdrawalConditionalFields();
  }
  withdrawalModal.hidden = false;
  const modalBody = withdrawalModal.querySelector(".modal-body");
  if (modalBody) modalBody.scrollTop = 0;
}

function fillWithdrawalForm(w) {
  document.getElementById("w_bankId").value = w.bankId || "";
  document.getElementById("w_serviceName").value = w.serviceName || "";
  document.getElementById("w_category").value = w.category || "subscription";
  document.getElementById("w_day").value = w.day || "1";
  document.getElementById("w_amount").value = w.amount ?? "";
  document.getElementById("w_cancelPlanned").value = w.cancelPlanned || "no";
  document.getElementById("w_cancelNote").value = w.cancelNote || "";
  document.getElementById("w_memo").value = w.memo || "";
  toggleWithdrawalConditionalFields();
}

function toggleWithdrawalConditionalFields() {
  const cancelPlanned = document.getElementById("w_cancelPlanned").value;
  document.getElementById("wrap_cancelNote").hidden = cancelPlanned !== "yes";
}

document.getElementById("w_cancelPlanned").addEventListener("change", toggleWithdrawalConditionalFields);

function closeWithdrawalModal() {
  withdrawalModal.hidden = true;
}

function readWithdrawalFormInto(w) {
  w.bankId = document.getElementById("w_bankId").value;
  w.serviceName = document.getElementById("w_serviceName").value.trim();
  w.category = document.getElementById("w_category").value;
  w.day = document.getElementById("w_day").value;
  w.amount = document.getElementById("w_amount").value === "" ? 0 : Number(document.getElementById("w_amount").value);
  w.cancelPlanned = document.getElementById("w_cancelPlanned").value;
  w.cancelNote = document.getElementById("w_cancelNote").value.trim();
  w.memo = document.getElementById("w_memo").value.trim();
  return w;
}

withdrawalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const idField = document.getElementById("w_id").value;
  if (idField) {
    const w = data.withdrawals.find(w => w.id === idField);
    readWithdrawalFormInto(w);
  } else {
    data.withdrawals.push(readWithdrawalFormInto({ id: uid() }));
  }
  render();
  closeWithdrawalModal();
  showToast("✓ 保存しました");
});

document.getElementById("btnDeleteWithdrawal").addEventListener("click", () => {
  const id = document.getElementById("w_id").value;
  if (!confirm("この引き落としを削除しますか?")) return;
  data.withdrawals = data.withdrawals.filter(w => w.id !== id);
  render();
  closeWithdrawalModal();
});

document.getElementById("btnAddWithdrawal").addEventListener("click", () => openWithdrawalModal(null));

/* ---------- 銀行管理 ---------- */

const banksModal = document.getElementById("banksModal");

function renderBanksList() {
  const ul = document.getElementById("bankList");
  ul.innerHTML = "";
  if (!data.banks.length) {
    ul.innerHTML = `<li class="bank-item"><span class="bank-item-meta">登録されている銀行はありません</span></li>`;
    return;
  }
  for (const b of data.banks) {
    const count = withdrawalsForBank(b.id).length;
    const li = document.createElement("li");
    li.className = "bank-item";
    const metaParts = [];
    if (b.branchName) metaParts.push(escapeHtml(b.branchName));
    if (b.accountNumber) metaParts.push(escapeHtml(b.accountNumber));
    metaParts.push(BANK_TYPE_LABEL[b.bankType] || "");
    if (b.memo) metaParts.push(escapeHtml(b.memo));
    metaParts.push(`引き落とし${count}件`);
    li.innerHTML = `
      <div class="bank-item-main">
        <span class="bank-item-name">${escapeHtml(b.name)}</span>
        <span class="bank-item-meta">${metaParts.join(" / ")}</span>
      </div>
    `;
    li.addEventListener("click", () => openBankModal(b.id));
    ul.appendChild(li);
  }
}

document.getElementById("btnBanks").addEventListener("click", () => {
  renderBanksList();
  banksModal.hidden = false;
});

/* ---------- 銀行追加・編集モーダル ---------- */

const bankModal = document.getElementById("bankModal");
const bankForm = document.getElementById("bankForm");

function openBankModal(bankId) {
  bankForm.reset();
  document.getElementById("b_id").value = bankId || "";
  document.getElementById("btnDeleteBank").hidden = !bankId;
  document.getElementById("bankModalTitle").textContent = bankId ? "銀行を編集" : "銀行を追加";
  if (bankId) {
    const b = data.banks.find(b => b.id === bankId);
    document.getElementById("b_name").value = b.name || "";
    document.getElementById("b_branchName").value = b.branchName || "";
    document.getElementById("b_accountNumber").value = b.accountNumber || "";
    document.getElementById("b_bankType").value = b.bankType || "net";
    document.getElementById("b_memo").value = b.memo || "";
  } else {
    document.getElementById("b_bankType").value = "net";
  }
  bankModal.hidden = false;
}

function closeBankModal() {
  bankModal.hidden = true;
}

bankForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("b_id").value;
  const name = document.getElementById("b_name").value.trim();
  const branchName = document.getElementById("b_branchName").value.trim();
  const accountNumber = document.getElementById("b_accountNumber").value.trim();
  const bankType = document.getElementById("b_bankType").value;
  const memo = document.getElementById("b_memo").value.trim();

  if (id) {
    const b = data.banks.find(b => b.id === id);
    b.name = name; b.branchName = branchName; b.accountNumber = accountNumber; b.bankType = bankType; b.memo = memo;
  } else {
    data.banks.push({ id: uid(), name, branchName, accountNumber, bankType, memo });
  }
  saveData();
  refreshAllBankSelects();
  renderBanksList();
  render();
  closeBankModal();
});

document.getElementById("btnDeleteBank").addEventListener("click", () => {
  const id = document.getElementById("b_id").value;
  const linked = withdrawalsForBank(id);
  const linkedCards = data.cards.filter(c => c.linkedBankId === id);
  let msg = "この銀行を削除しますか?";
  if (linked.length || linkedCards.length) {
    msg = `この銀行には引き落としが${linked.length}件、紐づいているカードが${linkedCards.length}件あります。銀行を削除すると引き落とし記録も削除され、カードの銀行の紐づけは解除されます。本当に削除しますか?`;
  }
  if (!confirm(msg)) return;
  data.banks = data.banks.filter(b => b.id !== id);
  data.withdrawals = data.withdrawals.filter(w => w.bankId !== id);
  for (const c of data.cards) {
    if (c.linkedBankId === id) c.linkedBankId = "";
  }
  saveData();
  refreshAllBankSelects();
  renderBanksList();
  render();
  closeBankModal();
});

document.getElementById("btnAddBank").addEventListener("click", () => openBankModal(null));

/* ---------- カードの固定支払いを銀行管理へ反映 ---------- */

document.getElementById("btnSyncFromCards").addEventListener("click", () => {
  let created = 0;
  let updated = 0;
  const cardsMissingBank = new Set();

  for (const card of data.cards) {
    const payments = paymentsForCard(card.id);
    if (!payments.length) continue;
    if (!card.linkedBankId || !data.banks.some(b => b.id === card.linkedBankId)) {
      cardsMissingBank.add(card.name);
      continue;
    }
    for (const p of payments) {
      let w = data.withdrawals.find(w => w.sourcePaymentId === p.id);
      if (w) {
        w.bankId = card.linkedBankId;
        w.serviceName = p.name;
        w.amount = p.amount;
        w.day = card.paymentDay || w.day || "1";
        updated++;
      } else {
        data.withdrawals.push({
          id: uid(),
          bankId: card.linkedBankId,
          serviceName: p.name,
          category: "other",
          day: card.paymentDay || "1",
          amount: p.amount,
          cancelPlanned: "no",
          cancelNote: "",
          memo: `カード連携: ${card.name}${p.note ? " / " + p.note : ""}`,
          sourceCardId: card.id,
          sourcePaymentId: p.id
        });
        created++;
      }
    }
  }

  render();

  if (created === 0 && updated === 0 && cardsMissingBank.size === 0) {
    showToast("反映対象の固定支払いがありません");
  } else {
    showToast(`✓ 反映完了(新規${created}件・更新${updated}件)`);
  }
  if (cardsMissingBank.size > 0) {
    alert(`次のカードは「紐づける銀行」が未設定のため反映されていません:\n${[...cardsMissingBank].join("\n")}\n\nカードの編集画面(引落先の項目)から銀行を設定して、もう一度反映してください。`);
  }
});

/* ==================================================================
   SIM管理画面
   ================================================================== */

function linkedCardName(cardId) {
  if (!cardId) return "";
  const c = data.cards.find(c => c.id === cardId);
  return c ? c.name : "(削除済みカード)";
}

function renderSimSummary() {
  const el = document.getElementById("simSummary");
  const total = data.lines.length;
  const activeLines = data.lines.filter(l => !l.cancelDate);
  const mnpEligibleCount = activeLines.filter(is180DaysPassed).length;
  const monthlyFeeTotal = activeLines.reduce((sum, l) => sum + (Number(l.monthlyFee) || 0), 0);

  const costs = activeLines.map(costPerGB).filter(v => v !== null);
  const avgCostPerGB = costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : null;

  const ngCount = data.lines.filter(l => l.ngHistory === "yes").length;
  const cancelPlannedCount = data.lines.filter(l => l.cancelPlannedDate && !l.cancelDate).length;
  const discountImminentCount = data.lines.filter(l => {
    const w = discountWarning(l);
    return w && w.status === "imminent";
  }).length;

  el.innerHTML = `
    <div class="stat"><span class="num">${total}</span><span class="label">総回線数</span></div>
    <div class="stat"><span class="num">${activeLines.length}</span><span class="label">契約中</span></div>
    <div class="stat"><span class="num">${mnpEligibleCount}</span><span class="label">MNP可能(180日経過)</span></div>
    <div class="stat"><span class="num">${monthlyFeeTotal.toLocaleString("ja-JP")}</span><span class="label">月額料金合計(円/契約中)</span></div>
    <div class="summary-row-break"></div>
    <div class="stat"><span class="num">${avgCostPerGB === null ? "―" : avgCostPerGB.toFixed(1)}</span><span class="label">平均円/GB(契約中)</span></div>
    <div class="stat"><span class="num">${ngCount}</span><span class="label">審査NGあり件数</span></div>
    <div class="stat"><span class="num">${cancelPlannedCount}</span><span class="label">解約予定あり</span></div>
    <div class="stat"><span class="num">${discountImminentCount}</span><span class="label">割引終了間近(30日以内)</span></div>
  `;
}

function getFilteredSortedLines() {
  const search = document.getElementById("simSearchInput").value.trim().toLowerCase();
  const fCarrierType = document.getElementById("filterSimCarrierType").value;
  const fNetworkType = document.getElementById("filterSimNetworkType").value;
  const fMnpEligible = document.getElementById("filterSimMnpEligible").value;
  const fNgFlag = document.getElementById("filterSimNgFlag").value;
  const fCancelStatus = document.getElementById("filterSimCancelStatus").value;
  const sortKey = document.getElementById("sortSimKey").value;

  let list = data.lines.filter(l => {
    if (fCarrierType && l.carrierType !== fCarrierType) return false;
    if (fNetworkType && l.networkType !== fNetworkType) return false;
    if (fMnpEligible === "eligible" && !is180DaysPassed(l)) return false;
    if (fMnpEligible === "notyet" && is180DaysPassed(l)) return false;
    if (fNgFlag && l.ngHistory !== fNgFlag) return false;
    if (fCancelStatus === "active" && l.cancelDate) return false;
    if (fCancelStatus === "cancelPlanned" && !(l.cancelPlannedDate && !l.cancelDate)) return false;
    if (fCancelStatus === "cancelled" && !l.cancelDate) return false;
    if (search) {
      const hay = [l.brandName, l.phoneNumber, l.contractHolder, l.lineUser, l.deviceNote, linkedCardName(l.linkedCardId), l.memo].join(" ").toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    if (sortKey === "contractDateAsc") return (a.contractDate || "").localeCompare(b.contractDate || "");
    if (sortKey === "monthlyFee") return (Number(b.monthlyFee) || 0) - (Number(a.monthlyFee) || 0);
    if (sortKey === "costPerGB") {
      const av = costPerGB(a), bv = costPerGB(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return av - bv;
    }
    if (sortKey === "nextMnpDate") return (nextMnpEligibleDate(a) || "").localeCompare(nextMnpEligibleDate(b) || "");
    if (sortKey === "contractCount") return (Number(b.contractCount) || 0) - (Number(a.contractCount) || 0);
    return (b.contractDate || "").localeCompare(a.contractDate || "");
  });

  return list;
}

function renderSimList() {
  const list = getFilteredSortedLines();
  const container = document.getElementById("simList");
  const emptyState = document.getElementById("simEmptyState");

  container.innerHTML = "";
  emptyState.hidden = list.length !== 0;

  for (const line of list) {
    const div = document.createElement("div");
    div.className = "card-item";
    div.dataset.id = line.id;

    const mnpStatus = mnpEligibilityStatus(line);
    const days = daysSince(line.contractDate);
    let mnpBadge = "";
    if (mnpStatus === "eligible") {
      mnpBadge = `<span class="badge mnp-eligible">MNP可能</span>`;
    } else if (mnpStatus === "soon") {
      mnpBadge = `<span class="badge mnp-soon">MNPまであと${180 - days}日</span>`;
    } else if (mnpStatus === "notyet") {
      mnpBadge = `<span class="badge mnp-notyet">MNPまであと${180 - days}日</span>`;
    }

    const ngMonths = ngElapsedMonths(line);
    const warning = discountWarning(line);

    const badges = [
      `<span class="badge carrier-${line.carrierType}">${CARRIER_TYPE_LABEL[line.carrierType] || line.carrierType}</span>`,
      `<span class="badge">${NETWORK_TYPE_LABEL[line.networkType] || line.networkType}</span>`,
      `<span class="badge">${CONTRACT_TYPE_LABEL[line.contractType] || line.contractType}</span>`,
      `<span class="badge sim-${line.simType}">${SIM_TYPE_LABEL[line.simType] || line.simType}</span>`,
      mnpBadge
    ];
    if (line.linkedCardId && data.cards.some(c => c.id === line.linkedCardId)) {
      badges.push(`<span class="badge badge-card">💳 ${escapeHtml(linkedCardName(line.linkedCardId))}</span>`);
    }
    if (line.ngHistory === "yes") {
      badges.push(`<span class="badge ng-flag">審査NGあり${ngMonths !== null ? `(${ngMonths}ヶ月経過)` : ""}</span>`);
    }
    if (line.cancelPlannedDate && !line.cancelDate) {
      badges.push(`<span class="badge cancel-yes">解約予定</span>`);
    }
    if (line.cancelDate) {
      badges.push(`<span class="badge cancel-yes">解約済み</span>`);
    }
    if (warning) {
      badges.push(`<span class="badge discount-warning">${warning.status === "ended" ? "割引終了済み(値上げ済みの可能性)" : `割引終了まであと${warning.days}日`}</span>`);
    }
    if (line.campaignUsed === "yes") {
      badges.push(`<span class="badge">キャンペーン利用</span>`);
    }

    div.innerHTML = `
      <div class="card-item-top">
        <span class="card-item-name">${escapeHtml(line.brandName)}</span>
        <span class="card-item-last4">${escapeHtml(line.phoneNumber)}</span>
      </div>
      <div class="badges">${badges.join("")}</div>
      <div class="card-item-meta">
        <span>月額 <b>${formatYen(line.monthlyFee) || "0円"}</b> / <b>${formatCostPerGB(line)}</b></span>
        <span>契約日 <b>${formatDate(line.contractDate)}</b> → 次回MNP可能日 <b>${formatDate(nextMnpEligibleDate(line)) || "―"}</b></span>
        ${(line.contractHolder || line.lineUser) ? `<span>契約者 <b>${escapeHtml(line.contractHolder)}</b> / 利用者 <b>${escapeHtml(line.lineUser)}</b></span>` : ""}
        ${line.deviceNote ? `<span>端末: <b>${escapeHtml(line.deviceNote)}</b></span>` : ""}
        ${line.discountEndDate ? `<span>割引終了 <b>${formatDate(line.discountEndDate)}</b>${line.priceAfterDiscountFee ? ` → 終了後 <b>${formatYen(line.priceAfterDiscountFee)}</b>` : ""}</span>` : ""}
      </div>
    `;
    div.addEventListener("click", () => openSimModal(line.id));
    container.appendChild(div);
  }
}

/* ---------- 支払いカードのセレクトの再構築(SIMの紐づけ) ---------- */

function refreshSimCardSelect() {
  const options = data.cards.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  const linkedCardId = document.getElementById("s_linkedCardId");
  const currentLinked = linkedCardId.value;
  linkedCardId.innerHTML = '<option value="">未設定</option>' + options;
  if (data.cards.some(c => c.id === currentLinked)) linkedCardId.value = currentLinked;
}

/* ---------- 回線追加・編集モーダル ---------- */

const simModal = document.getElementById("simModal");
const simForm = document.getElementById("simForm");

function openSimModal(lineId) {
  simForm.reset();
  refreshSimCardSelect();
  document.getElementById("simId").value = lineId || "";
  document.getElementById("btnDeleteSim").hidden = !lineId;
  document.getElementById("simModalTitle").textContent = lineId ? "回線を編集" : "回線を追加";

  if (lineId) {
    const line = data.lines.find(l => l.id === lineId);
    fillSimForm(line);
  } else {
    document.getElementById("s_carrierType").value = "mvno";
    document.getElementById("s_networkType").value = "docomo";
    document.getElementById("s_linkedCardId").value = "";
    document.getElementById("s_contractType").value = "new";
    document.getElementById("s_ngHistory").value = "no";
    document.getElementById("s_dataAllowanceUnlimited").checked = false;
    document.getElementById("s_simType").value = "physical";
    document.getElementById("s_simultaneousApplication").value = "no";
    document.getElementById("s_campaignUsed").value = "no";
    document.getElementById("s_pointSiteUsed").value = "no";
    toggleSimConditionalFields();
  }
  simModal.hidden = false;
  const modalBody = simModal.querySelector(".modal-body");
  if (modalBody) modalBody.scrollTop = 0;
}

function fillSimForm(line) {
  document.getElementById("s_brandName").value = line.brandName || "";
  document.getElementById("s_carrierType").value = line.carrierType || "mvno";
  document.getElementById("s_networkType").value = line.networkType || "docomo";
  document.getElementById("s_phoneNumber").value = line.phoneNumber || "";
  document.getElementById("s_linkedCardId").value = data.cards.some(c => c.id === line.linkedCardId) ? line.linkedCardId : "";
  document.getElementById("s_contractDate").value = line.contractDate || "";
  document.getElementById("s_contractType").value = line.contractType || "new";
  document.getElementById("s_mnpFromCarrier").value = line.mnpFromCarrier || "";
  document.getElementById("s_contractCount").value = line.contractCount ?? "";
  document.getElementById("s_cancelDate").value = line.cancelDate || "";
  document.getElementById("s_cancelPlannedDate").value = line.cancelPlannedDate || "";
  document.getElementById("s_terminationFee").value = line.terminationFee ?? "";
  document.getElementById("s_cancelReason").value = line.cancelReason || "";
  document.getElementById("s_ngHistory").value = line.ngHistory || "no";
  document.getElementById("s_ngDate").value = line.ngDate || "";
  document.getElementById("s_monthlyFee").value = line.monthlyFee ?? "";
  document.getElementById("s_dataAllowanceUnlimited").checked = !!line.dataAllowanceUnlimited;
  document.getElementById("s_dataAllowanceGB").value = line.dataAllowanceGB ?? "";
  document.getElementById("s_discountEndDate").value = line.discountEndDate || "";
  document.getElementById("s_priceAfterDiscountFee").value = line.priceAfterDiscountFee ?? "";
  document.getElementById("s_simType").value = line.simType || "physical";
  document.getElementById("s_simCardNumber").value = line.simCardNumber || "";
  document.getElementById("s_contractHolder").value = line.contractHolder || "";
  document.getElementById("s_lineUser").value = line.lineUser || "";
  document.getElementById("s_deviceNote").value = line.deviceNote || "";
  document.getElementById("s_simultaneousApplication").value = line.simultaneousApplication || "no";
  document.getElementById("s_campaignUsed").value = line.campaignUsed || "no";
  document.getElementById("s_campaignDetail").value = line.campaignDetail || "";
  document.getElementById("s_pointSiteUsed").value = line.pointSiteUsed || "no";
  document.getElementById("s_memo").value = line.memo || "";
  toggleSimConditionalFields();
}

function toggleSimConditionalFields() {
  const contractType = document.getElementById("s_contractType").value;
  document.getElementById("wrap_simMnp").hidden = contractType !== "mnp";

  const ngHistory = document.getElementById("s_ngHistory").value;
  document.getElementById("wrap_simNgDate").hidden = ngHistory !== "yes";

  const unlimited = document.getElementById("s_dataAllowanceUnlimited").checked;
  document.getElementById("wrap_simDataAllowanceGB").hidden = unlimited;

  const simType = document.getElementById("s_simType").value;
  document.getElementById("wrap_simCardNumberField").hidden = simType !== "physical";

  const campaignUsed = document.getElementById("s_campaignUsed").value;
  document.getElementById("wrap_simCampaignDetail").hidden = campaignUsed !== "yes";

  updateSimDerivedPreviews();
}

function updateSimDerivedPreviews() {
  const contractDate = document.getElementById("s_contractDate").value;
  const mnpPreview = document.getElementById("simMnpPreview");
  if (contractDate) {
    const previewLine = { contractDate };
    const passed = is180DaysPassed(previewLine);
    const nextDate = formatDate(nextMnpEligibleDate(previewLine));
    mnpPreview.textContent = passed
      ? `✓ 契約から180日経過済み(次回MNP可能日: ${nextDate})`
      : `契約から180日未経過。次回MNP可能日: ${nextDate}`;
  } else {
    mnpPreview.textContent = "";
  }

  const ngDate = document.getElementById("s_ngDate").value;
  const ngPreview = document.getElementById("simNgPreview");
  if (ngDate) {
    const months = ngElapsedMonths({ ngHistory: "yes", ngDate });
    ngPreview.textContent = months !== null ? `審査NGから約${months}ヶ月経過` : "";
  } else {
    ngPreview.textContent = "";
  }

  const unlimited = document.getElementById("s_dataAllowanceUnlimited").checked;
  const gb = document.getElementById("s_dataAllowanceGB").value;
  const fee = document.getElementById("s_monthlyFee").value;
  const costPreview = document.getElementById("simCostPerGBPreview");
  const v = costPerGB({ dataAllowanceUnlimited: unlimited, dataAllowanceGB: gb, monthlyFee: fee });
  costPreview.textContent = `実質コスパ: ${v === null ? "―(無制限、または未入力)" : v.toFixed(1) + "円/GB"}`;

  const discountEndDate = document.getElementById("s_discountEndDate").value;
  const priceAfter = document.getElementById("s_priceAfterDiscountFee").value;
  const discountPreview = document.getElementById("simDiscountPreview");
  if (discountEndDate) {
    const w = discountWarning({ discountEndDate });
    let msg = w
      ? (w.status === "ended" ? "⚠ 割引終了済み(値上げ済みの可能性)" : `⚠ 割引終了まであと${w.days}日`)
      : `割引終了日: ${formatDate(discountEndDate)}`;
    if (priceAfter && Number(priceAfter) > 0) {
      const current = Number(fee) || 0;
      const diff = Number(priceAfter) - current;
      msg += ` / 終了後 ${formatYen(priceAfter)}${diff > 0 ? `(+${diff.toLocaleString("ja-JP")}円)` : ""}`;
    }
    discountPreview.textContent = msg;
  } else {
    discountPreview.textContent = "";
  }
}

[
  "s_contractType", "s_ngHistory", "s_dataAllowanceUnlimited", "s_simType", "s_campaignUsed"
].forEach(id => document.getElementById(id).addEventListener("change", toggleSimConditionalFields));

[
  "s_contractDate", "s_ngDate", "s_monthlyFee", "s_dataAllowanceGB", "s_dataAllowanceUnlimited",
  "s_discountEndDate", "s_priceAfterDiscountFee"
].forEach(id => document.getElementById(id).addEventListener("input", updateSimDerivedPreviews));

function closeSimModal() {
  simModal.hidden = true;
}

function readSimFormInto(line) {
  line.brandName = document.getElementById("s_brandName").value.trim();
  line.carrierType = document.getElementById("s_carrierType").value;
  line.networkType = document.getElementById("s_networkType").value;
  line.phoneNumber = document.getElementById("s_phoneNumber").value.trim();
  line.linkedCardId = document.getElementById("s_linkedCardId").value;
  line.contractDate = document.getElementById("s_contractDate").value;
  line.contractType = document.getElementById("s_contractType").value;
  line.mnpFromCarrier = document.getElementById("s_mnpFromCarrier").value.trim();
  line.contractCount = document.getElementById("s_contractCount").value === "" ? 0 : Number(document.getElementById("s_contractCount").value);
  line.cancelDate = document.getElementById("s_cancelDate").value;
  line.cancelPlannedDate = document.getElementById("s_cancelPlannedDate").value;
  line.terminationFee = document.getElementById("s_terminationFee").value === "" ? 0 : Number(document.getElementById("s_terminationFee").value);
  line.cancelReason = document.getElementById("s_cancelReason").value.trim();
  line.ngHistory = document.getElementById("s_ngHistory").value;
  line.ngDate = document.getElementById("s_ngDate").value;
  line.monthlyFee = document.getElementById("s_monthlyFee").value === "" ? 0 : Number(document.getElementById("s_monthlyFee").value);
  line.dataAllowanceUnlimited = document.getElementById("s_dataAllowanceUnlimited").checked;
  line.dataAllowanceGB = document.getElementById("s_dataAllowanceGB").value === "" ? 0 : Number(document.getElementById("s_dataAllowanceGB").value);
  line.discountEndDate = document.getElementById("s_discountEndDate").value;
  line.priceAfterDiscountFee = document.getElementById("s_priceAfterDiscountFee").value === "" ? 0 : Number(document.getElementById("s_priceAfterDiscountFee").value);
  line.simType = document.getElementById("s_simType").value;
  line.simCardNumber = document.getElementById("s_simCardNumber").value.trim();
  line.contractHolder = document.getElementById("s_contractHolder").value.trim();
  line.lineUser = document.getElementById("s_lineUser").value.trim();
  line.deviceNote = document.getElementById("s_deviceNote").value.trim();
  line.simultaneousApplication = document.getElementById("s_simultaneousApplication").value;
  line.campaignUsed = document.getElementById("s_campaignUsed").value;
  line.campaignDetail = document.getElementById("s_campaignDetail").value.trim();
  line.pointSiteUsed = document.getElementById("s_pointSiteUsed").value;
  line.memo = document.getElementById("s_memo").value.trim();
  return line;
}

simForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const idField = document.getElementById("simId").value;
  if (idField) {
    const line = data.lines.find(l => l.id === idField);
    readSimFormInto(line);
  } else {
    const line = readSimFormInto({ id: uid() });
    data.lines.push(line);
  }
  render();
  closeSimModal();
  showToast("✓ 保存しました");
});

document.getElementById("btnDeleteSim").addEventListener("click", () => {
  const lineId = document.getElementById("simId").value;
  if (!confirm("この回線を削除しますか?")) return;
  data.lines = data.lines.filter(l => l.id !== lineId);
  render();
  closeSimModal();
  showToast("✓ 削除しました");
});

document.getElementById("btnAddSim").addEventListener("click", () => openSimModal(null));

/* ---------- 既存のSIM管理アプリのデータを読み込む ---------- */

document.getElementById("btnImportLegacySim").addEventListener("click", () => {
  document.getElementById("legacySimImportFile").click();
});

document.getElementById("legacySimImportFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!Array.isArray(parsed.lines)) throw new Error("invalid");
      const msg = `現在のSIM回線データ(${data.lines.length}件)を、読み込むデータ(${parsed.lines.length}件)で上書きします。カード・銀行のデータは影響を受けません。よろしいですか?`;
      if (!confirm(msg)) return;
      data.lines = (parsed.lines || []).map(l => {
        const line = { ...l, linkedCardId: "" };
        if (l.paymentCard) {
          line.memo = (l.memo ? l.memo + " / " : "") + `旧支払いカード欄: ${l.paymentCard}`;
        }
        delete line.paymentCard;
        return line;
      });
      render();
      showToast("✓ SIM管理データを読み込みました");
    } catch (err) {
      alert("読み込みに失敗しました。sim-managerアプリのエクスポートファイルか確認してください。");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
});

/* ---------- モーダル共通クローズ ---------- */

document.querySelectorAll("[data-close-modal]").forEach(btn => {
  btn.addEventListener("click", () => {
    const overlay = btn.closest(".modal-overlay");
    if (overlay) overlay.hidden = true;
  });
});

[cardModal, paymentModal, moveModal, withdrawalModal, banksModal, bankModal, simModal].forEach(overlay => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.hidden = true;
  });
});

/* ---------- 検索・フィルタ・並び替え ---------- */

["cardSearchInput", "filterCategory", "filterHolder", "filterCancel", "filterRank", "filterBrand", "sortKey"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderCardList);
  document.getElementById(id).addEventListener("change", renderCardList);
});

["withdrawalSearchInput", "filterBank", "filterWithdrawalCategory", "filterWithdrawalCancel", "sortWithdrawalKey"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderWithdrawalList);
  document.getElementById(id).addEventListener("change", renderWithdrawalList);
});

["simSearchInput", "filterSimCarrierType", "filterSimNetworkType", "filterSimMnpEligible", "filterSimNgFlag", "filterSimCancelStatus", "sortSimKey"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderSimList);
  document.getElementById(id).addEventListener("change", renderSimList);
});

/* ---------- トースト通知 ---------- */

let toastTimer = null;
function showToast(message) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2500);
}

/* ---------- エクスポート / インポート(フルバックアップ) ---------- */

document.getElementById("btnExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `finance-manager-backup-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✓ エクスポート完了");
});

document.getElementById("importFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!confirm("現在のすべてのデータ(カード・銀行・SIM含む)を上書きしてインポートします。よろしいですか?")) return;
      data = {
        cards: parsed.cards || [],
        payments: parsed.payments || [],
        banks: parsed.banks || [],
        withdrawals: parsed.withdrawals || [],
        lines: parsed.lines || []
      };
      refreshAllBankSelects();
      render();
      showToast("✓ インポート完了");
    } catch (err) {
      alert("インポートに失敗しました。ファイル形式を確認してください。");
    } finally {
      e.target.value = "";
    }
  };
  reader.readAsText(file);
});

document.getElementById("btnExportCsv").addEventListener("click", () => {
  const today = new Date().toISOString().slice(0, 10);

  if (activeScreen === "sim") {
    const headers = [
      "ブランド名", "通信回線の種別", "回線キャリア", "電話番号", "支払いカード",
      "契約日", "新規/MNP", "移行元キャリア", "契約回数",
      "180日経過", "次回MNP可能日",
      "解約日", "解約予定日", "違約金・解除料", "解約理由",
      "審査NG履歴", "審査NG発生日", "審査NGからの経過月数",
      "毎月の料金", "無制限プラン", "毎月の使用可能GB", "実質円/GB",
      "割引終了時期", "割引終了後の想定月額",
      "物理SIM/eSIM", "SIMカード番号", "回線契約者", "回線利用者", "端末メモ", "同時申込み",
      "キャンペーン利用", "キャンペーン詳細", "ポイントサイト経由", "備考"
    ];
    const rows = data.lines.map(l => [
      l.brandName, CARRIER_TYPE_LABEL[l.carrierType] || l.carrierType, NETWORK_TYPE_LABEL[l.networkType] || l.networkType,
      l.phoneNumber, linkedCardName(l.linkedCardId),
      l.contractDate, CONTRACT_TYPE_LABEL[l.contractType] || l.contractType, l.mnpFromCarrier, l.contractCount,
      is180DaysPassed(l) ? "済み" : "未経過", nextMnpEligibleDate(l) || "",
      l.cancelDate, l.cancelPlannedDate, l.terminationFee, l.cancelReason,
      YESNO_LABEL[l.ngHistory] || l.ngHistory, l.ngDate, ngElapsedMonths(l) ?? "",
      l.monthlyFee, l.dataAllowanceUnlimited ? "あり" : "なし", l.dataAllowanceUnlimited ? "" : l.dataAllowanceGB, costPerGB(l) === null ? "" : costPerGB(l).toFixed(1),
      l.discountEndDate, l.priceAfterDiscountFee,
      SIM_TYPE_LABEL[l.simType] || l.simType, l.simType === "physical" ? l.simCardNumber : "", l.contractHolder, l.lineUser, l.deviceNote, YESNO_LABEL[l.simultaneousApplication] || l.simultaneousApplication,
      YESNO_LABEL[l.campaignUsed] || l.campaignUsed, l.campaignUsed === "yes" ? l.campaignDetail : "", YESNO_LABEL[l.pointSiteUsed] || l.pointSiteUsed, l.memo
    ]);
    downloadCsv(headers, rows, `finance-manager-sim-${today}.csv`);
  } else if (activeScreen === "bank") {
    const headers = ["銀行名", "銀行種別", "サービス名・支払い先", "利用用途", "引き落とし日", "金額(円)", "解約予定", "解約備考", "カード連携", "備考"];
    const rows = data.withdrawals.map(w => [
      bankName(w.bankId),
      BANK_TYPE_LABEL[(data.banks.find(b => b.id === w.bankId) || {}).bankType] || "",
      w.serviceName,
      WITHDRAWAL_CATEGORY_LABEL[w.category] || w.category,
      dayLabel(w.day),
      w.amount || "",
      w.cancelPlanned === "yes" ? "あり" : "なし",
      w.cancelNote,
      w.sourcePaymentId ? "あり" : "",
      w.memo
    ]);
    downloadCsv(headers, rows, `finance-manager-withdrawals-${today}.csv`);
  } else {
    const headers = ["カード名称", "下4桁", "種別", "カードの形態", "国際ブランド", "カードランク", "名義区分", "家族の名前", "利用目的", "還元率(%)", "還元率計算方法", "貯まるポイント", "年会費区分", "年会費(円)", "カード利用枠", "1回の限度額", "1日の限度額", "1ヶ月の限度額", "残高口座", "締め日", "引落日", "引き落とし口座", "支店名", "紐づける銀行", "解約予定", "解約備考", "ETC対象車両", "備考"];
    const rows = data.cards.map(c => [
      c.name, c.last4, CATEGORY_LABEL[c.category] || c.category, CARD_FORMAT_LABEL[c.cardFormat] || "", BRAND_LABEL[c.brand] || "", rankDisplay(c),
      HOLDER_LABEL[c.holderType] || c.holderType,
      c.holderName, c.purpose, c.rewardRate,
      c.rewardRate ? (REWARD_CALC_LABEL[c.rewardCalcType] || "") : "", c.rewardRate ? c.pointsEarned : "",
      ANNUAL_FEE_LABEL[c.annualFeeType] || "", c.annualFeeType === "free" ? "" : c.annualFeeAmount,
      (c.category === "debit" || c.category === "prepaid") ? "" : c.creditLimit,
      c.category === "debit" ? c.debitPerTxLimit : "", c.category === "debit" ? c.debitDailyLimit : "", c.category === "debit" ? c.debitMonthlyLimit : "",
      c.category === "prepaid" ? c.balanceAccount : "",
      dayLabel(c.closingDay), dayLabel(c.paymentDay), c.paymentAccount, c.branchName,
      c.linkedBankId ? bankName(c.linkedBankId) : "",
      c.cancelPlanned === "yes" ? "あり" : "なし", c.cancelNote, c.etcVehicle, c.memo
    ]);
    downloadCsv(headers, rows, `finance-manager-cards-${today}.csv`);
  }
});

function downloadCsv(headers, rows, filename) {
  const csv = [headers, ...rows].map(row =>
    row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  showToast("✓ CSV出力完了");
}

/* ---------- PWA: Service Worker登録 ---------- */

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW登録に失敗しました", err));
  });
}

/* ---------- 固定フッターに隠れないよう本文下部の余白を調整 ---------- */

function adjustFooterSpacing() {
  const footer = document.querySelector(".app-footer");
  if (!footer) return;
  document.body.style.paddingBottom = (footer.offsetHeight + 16) + "px";
}

window.addEventListener("load", adjustFooterSpacing);
window.addEventListener("resize", adjustFooterSpacing);
if (window.ResizeObserver) {
  new ResizeObserver(adjustFooterSpacing).observe(document.querySelector(".app-footer"));
}

/* ---------- 初期化 ---------- */

populateDaySelect(document.getElementById("f_closingDay"));
populateDaySelect(document.getElementById("f_paymentDay"));
populateDaySelect(document.getElementById("w_day"));
loadData();
refreshAllBankSelects();
refreshSimCardSelect();
switchScreen("card");
render();
adjustFooterSpacing();
