import { RebuyableMechanicState } from "./game-mechanics";
import { SteamRuntime } from "@/steam";




export const shop = {};

export const ShopPurchaseData = {
  totalSTD: 0,
  spentSTD: 0,
  respecAvailable: false,
  lastRespec: "",
  unlockedCosmetics: [],

  get availableSTD() {
    return this.totalSTD - this.spentSTD;
  },

  get isIAPEnabled() {
    return Cloud.loggedIn && this.availableSTD >= 0 && player.IAP.enabled;
  },

  // We also allow for respecs if it's been at least 3 days since the last one
  get timeUntilRespec() {
    const msSinceLast = Date.now() - new Date(ShopPurchaseData.lastRespec).getTime();
    return TimeSpan.fromMilliseconds(3 * 86400 * 1000 - msSinceLast);
  },

  get canRespec() {
    return this.respecAvailable || this.timeUntilRespec.totalDays <= 0;
  },

  updateLocalSTD(newData) {
    this.totalSTD = newData.totalSTD;
    this.spentSTD = newData.spentSTD;
    this.respecAvailable = newData.respecAvailable;
    this.lastRespec = newData.lastRespec ?? 0;
    this.unlockedCosmetics = [...(newData.unlockedCosmetics ?? [])];
    for (const key of Object.keys(GameDatabase.shopPurchases)) this[key] = newData[key] ?? 0;
    if (this.allCosmeticSets > 0) this.unlockedCosmetics = Object.keys(GameDatabase.reality.glyphCosmeticSets);
    if (ShopPurchaseData.isIAPEnabled) Speedrun.setSTDUse(true);
    GameStorage.save();
  },

  clearLocalSTD() {
    this.totalSTD = 0;
    this.spentSTD = 0;
    this.respecAvailable = false;
    this.unlockedCosmetics = [];
    for (const key of Object.keys(GameDatabase.shopPurchases)) this[key] = 0;
  },

  get isAffordable() {
    return this.currency >= this.cost;
  },

  get description() {
    const desc = this.config.description;
    return typeof desc === "function" ? desc() : desc;
  },

  get cost() {
    const cost = this.config.cost;
    return typeof cost === "function" ? cost() : cost;
  },


  isUnlocked() {
    return player.records.fullGameCompletions > 0 || (this.config.isUnlocked?.() ?? true);
  },

  get lockText() {
    return this.config.lockText;
  },

  get shouldDisplayMult() {
    return Boolean(this.config.multiplier);
  },

  get currentMult() {
    if (!this.shouldDisplayMult) return "";
    return this.config.multiplier(ShopPurchaseData.isIAPEnabled ? this.purchases : 0);
  },

  get nextMult() {
    if (!this.shouldDisplayMult) return "";
    return this.config.multiplier(ShopPurchaseData.isIAPEnabled ? this.purchases + 1 : 0);
  },

  // We want to still display the correct value in the button, so we need separate getters for it
  get currentMultForDisplay() {
    if (!this.shouldDisplayMult) return "";
    return this.config.multiplier(this.purchases);
  },

  get nextMultForDisplay() {
    if (!this.shouldDisplayMult) return "";
    return this.config.multiplier(this.purchases + 1);
  },

  formatEffect(effect) {
    return this.config.formatEffect?.(effect) || formatX(effect, 2, 0);
  }
};
