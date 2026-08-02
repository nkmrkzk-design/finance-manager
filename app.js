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
  bank: { primary: "#0f766e", dark: "#0d5f58" }
};

function rankDisplay(card) {
  if (card.rankType === "custom") return card.rankCustom || "";
  return RANK_LABEL[card.rankType] || "";
}

let data = { cards: [], payments: [], banks: [], withdrawals: [] };
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
        withdrawals: parsed.withdrawals || []
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

function bankName(bankId) {
  const b = data.banks.find(b => b.id === bankId);
  return b ? b.name : "(削除済みの銀行)";
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

/* ---------- 画面切り替え(カード管理 / 銀行管理) ---------- */

function switchScreen(screen) {
  activeScreen = screen;
  document.getElementById("screenCard").hidden = screen !== "card";
  document.getElementById("screenBank").hidden = screen !== "bank";
  document.getElementById("tabCard").classList.toggle("active", screen === "card");
  document.getElementById("tabBank").classList.toggle("active", screen === "bank");
  document.querySelectorAll(".screen-card").forEach(el => { el.hidden = screen !== "card"; });
  document.querySelectorAll(".screen-bank").forEach(el => { el.hidden = screen !== "bank"; });
  document.getElementById("screenTitle").textContent = screen === "card" ? "カード管理" : "銀行管理";

  const theme = SCREEN_THEME[screen];
  document.documentElement.style.setProperty("--color-primary", theme.primary);
  document.documentElement.style.setProperty("--color-primary-dark", theme.dark);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute("content", theme.primary);

  adjustFooterSpacing();
}

document.getElementById("tabCard").addEventListener("click", () => switchScreen("card"));
document.getElementById("tabBank").addEventListener("click", () => switchScreen("bank"));

/* ---------- 描画まとめ ---------- */

function render() {
  renderCardSummary();
  renderCardList();
  renderBankSummary();
  renderWithdrawalList();
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
  const options = data.banks.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");

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

/* ---------- モーダル共通クローズ ---------- */

document.querySelectorAll("[data-close-modal]").forEach(btn => {
  btn.addEventListener("click", () => {
    const overlay = btn.closest(".modal-overlay");
    if (overlay) overlay.hidden = true;
  });
});

[cardModal, paymentModal, moveModal, withdrawalModal, banksModal, bankModal].forEach(overlay => {
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
      if (!confirm("現在のすべてのデータ(カード・銀行含む)を上書きしてインポートします。よろしいですか?")) return;
      data = {
        cards: parsed.cards || [],
        payments: parsed.payments || [],
        banks: parsed.banks || [],
        withdrawals: parsed.withdrawals || []
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

  if (activeScreen === "bank") {
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
switchScreen("card");
render();
adjustFooterSpacing();
