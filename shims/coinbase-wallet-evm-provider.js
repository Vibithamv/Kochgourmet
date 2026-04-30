// Coinbase Wallet EVM Provider shim for React Native
export class WalletMobileSDKEVMProvider {
  constructor() {}
  enable() {
    return Promise.resolve([]);
  }
  request() {
    return Promise.resolve(null);
  }
}
export default WalletMobileSDKEVMProvider;
