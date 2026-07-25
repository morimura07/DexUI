import { API_BASE as BASE } from '../config';

const getToken = () => localStorage.getItem('ss_token');

export async function apiCall(method, endpoint, data = null, auth = false) {
  const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
  if (auth) { const t = getToken(); if (t) headers['Authorization'] = `Bearer ${t}`; }
  const config = { method, headers };
  if (data && method !== 'GET') config.body = JSON.stringify(data);
  const url = data && method === 'GET'
    ? `${BASE}/${endpoint}?${new URLSearchParams(data)}`
    : `${BASE}/${endpoint}`;
  try {
    const res = await fetch(url, config);
    const json = await res.json();
    // Attach HTTP status so callers can distinguish 401 from other errors
    return { ...json, status: res.status };
  } catch (e) { return { success: false, error: { message: e.message }, status: 0 }; }
}

// Multipart POST. apiCall() above hard-codes an application/json Content-Type and
// JSON.stringify's the body, so a file can't travel through it. Deliberately does
// NOT set Content-Type — the browser has to write its own multipart boundary, and
// setting the header by hand omits it and the server parses nothing.
export async function apiUpload(endpoint, formData) {
  const headers = { 'Accept': 'application/json' };
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;
  try {
    const res = await fetch(`${BASE}/${endpoint}`, { method: 'POST', headers, body: formData });
    // An oversized upload is rejected by PHP before the app runs, so the body is an
    // HTML error page, not JSON. Fall back to the status rather than throwing.
    const json = await res.json().catch(() => ({ success: false, error: { message: `HTTP ${res.status}` } }));
    return { ...json, status: res.status };
  } catch (e) { return { success: false, error: { message: e.message }, status: 0 }; }
}

export async function fetchCryptoNews(query = 'cryptocurrency bitcoin', pageSize = 12) {
  try {
    const res = await apiCall('GET', 'public/news/crypto', { q: query, sort: 'publishedAt', pageSize });
    if (res.success) return res.data.articles || [];
    return [];
  } catch (e) { return []; }
}

export async function fetchCryptoArticles() {
  try {
    const res = await apiCall('GET', 'public/news/crypto', { q: 'blockchain defi altcoin crypto trading', sort: 'popularity', pageSize: 8 });
    if (res.success) return res.data.articles || [];
    return [];
  } catch (e) { return []; }
}

// Fetches exchange routes from OUR backend (served from the exchange_routes table,
// admin-managed). Despite the endpoint path, this does not call BeeSwap.
export async function fetchRoutes() {
  try {
    const res  = await fetch(`${BASE}/public/beeswap/routes`);
    const data = await res.json();
    if (data.success) {
      return data.data.routes || [];
    }
    return [];
  } catch (e) { return []; }
}
// Backward-compatible alias (old name) so existing imports keep working.
export const fetchBeeSwapRoutes = fetchRoutes;

export async function fetchCryptoPrices() {
  try {
    const ids = 'bitcoin,ethereum,tether,binancecoin,usd-coin,ripple,solana,cardano,dogecoin,tron,polkadot,matic-network';
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h`
    );
    return await res.json();
  } catch (e) { return null; }
}

export const api = {
  register: d => apiCall('POST', 'user/auth/register', d),
  signIn: d => apiCall('POST', 'user/auth/sign-in', d),
  adminSignIn: d => apiCall('POST', 'admin/auth/sign-in', d),
  sessionGet: () => apiCall('GET', 'user/auth/session/get', null, true),
  sessionDestroy: () => apiCall('DELETE', 'user/auth/session/destroy', null, true),
  resetPassword: d => apiCall('POST', 'user/auth/reset-password', d),
  resetPasswordIsValid: d => apiCall('POST', 'user/auth/reset-password/is-valid', d),
  resetPasswordConfirm: d => apiCall('POST', 'user/auth/reset-password/confirm', d),
  confirmEmail: token => apiCall('GET', 'user/auth/register/confirm', { token }),
  resendVerification: d => apiCall('POST', 'user/auth/register/resend', d),
  getRoutes: p => apiCall('GET', 'public/exchanger/route/get', p),
  getRoute: p => apiCall('GET', 'public/exchanger/route/get/one', p),
  getRouteByUrl: url => apiCall('GET', 'public/exchanger/route/get/one/by-friendlyURL', { url }),
  getFavoriteRoutes: () => apiCall('GET', 'public/exchanger/favorite/get'),
  submitReview: d => apiCall('POST', 'public/reviews/submit', d, true),
  getReviews:   () => apiCall('GET',  'public/reviews'),
  createOrder: d => apiCall('POST', 'public/exchanger/order/create', d, true),
  getOrder: id => apiCall('GET', 'public/exchanger/order/get', { order_id: id }, true),
  updateOrderStatus: d => apiCall('PUT', 'public/exchanger/order/update-status', d, true),
  getLastOrders: n => apiCall('GET', 'public/exchanger/order/get-lasts', { limit: n || 10 }),
  myOrders: p => apiCall('GET', 'user/exchanger/order/history', p, true),
  orderChart: () => apiCall('GET', 'user/exchanger/order/chart', null, true),
  attachOrder: d => apiCall('PUT', 'user/exchanger/order/update/owner', d, true),
  verificationCreate: d => apiCall('POST', 'public/exchanger/verification/create', d),
  userVerificationGet: () => apiCall('GET', 'user/verification/get', null, true),
  profileGet: () => apiCall('GET', 'user/profile/details/get', null, true),
  profileEditMain: d => apiCall('POST', 'user/profile/edit/main', d, true),
  profileEditEmail: d => apiCall('PUT', 'user/profile/edit/email', d, true),
  profileEditPassword: d => apiCall('PUT', 'user/profile/edit/password', d, true),
  profileEditPartnerLink: d => apiCall('PUT', 'user/profile/edit/partner-link', d, true),
  profileLimits: () => apiCall('GET', 'user/profile/limits/get', null, true),
  kycStatus: () => apiCall('GET', 'user/profile/kyc/status', null, true),
  kycSubmit: fd => apiUpload('user/profile/kyc/submit', fd),
  profileBlock: () => apiCall('PUT', 'user/profile/access/block', null, true),
  profileDelete: () => apiCall('DELETE', 'user/profile/access/delete', null, true),
  otpCreate: () => apiCall('POST', 'user/profile/secure/otp/create', null, true),
  otpConfirm: d => apiCall('POST', 'user/profile/secure/otp/confirm', d, true),
  otpDelete: () => apiCall('DELETE', 'user/profile/secure/otp/delete', null, true),
  walletsAddress: () => apiCall('GET', 'user/wallets/address', null, true),
  walletsBalance: () => apiCall('GET', 'user/wallets/balance', null, true),
  walletsTxList: () => apiCall('GET', 'user/wallets/transaction/list', null, true),
  apiKeyCreate: d => apiCall('POST', 'user/auth/api/create', d, true),
  apiKeyList: () => apiCall('GET', 'user/auth/api/get/list', null, true),
  apiKeyDelete: id => apiCall('DELETE', 'user/auth/api/delete', { id }, true),
  fcmRegister: d => apiCall('POST', 'user/notify/fcm/register', d, true),
  fcmRemove: d => apiCall('DELETE', 'user/notify/fcm/remove', d, true),
  affiliateBasic: () => apiCall('GET', 'user/affiliate/basic/get', null, true),
  affiliateToday: () => apiCall('GET', 'user/affiliate/today/get', null, true),
  affiliateOrders: () => apiCall('GET', 'user/affiliate/orders', null, true),
  affiliateChart: () => apiCall('GET', 'user/affiliate/chart', null, true),
  partnerRoutes: () => apiCall('GET', 'user/exchanger/partner-route/get', null, true),
  partnerRouteOne: d => apiCall('GET', 'user/exchanger/partner-route/get/one', d, true),
  partnerOrderCreate: d => apiCall('POST', 'user/exchanger/order/partner/create', d, true),
  partnerOrderGet: id => apiCall('GET', 'user/exchanger/order/partner/get', { order_id: id }, true),
  partnerOrderHistory: () => apiCall('GET', 'user/exchanger/order/partner/history', null, true),
  reviewCreate: d => apiCall('POST', 'public/reviews/create', d),
  reviewGet: () => apiCall('GET', 'public/reviews/get'),
  ticketCreate: d => apiCall('POST', 'public/ticket/create', d),
  newsListBasic: () => apiCall('GET', 'public/news/list/basic'),
  newsGetOne: slug => apiCall('GET', 'public/news/get/one', { slug }),
  newsCommentGet: news_id => apiCall('GET', 'public/news/comment/get', { news_id }),
  newsCommentCreate: d => apiCall('POST', 'user/news/comment/create', d, true),
  faqList: () => apiCall('GET', 'public/faq/get/list'),
  faqGroups: () => apiCall('GET', 'public/faq/get/group'),
  ruleList: () => apiCall('GET', 'public/rule/list'),
  ruleGet: slug => apiCall('GET', 'public/rule/get', { slug }),
  staticPageContent: slug => apiCall('GET', 'public/site/page/static/content', { slug }),
  contactsList: () => apiCall('GET', 'public/contacts/list'),
  webAlerts: () => apiCall('GET', 'public/web-alerts/get/list'),
  partners: () => apiCall('GET', 'public/partners-block/list'),
  socialNetworks: () => apiCall('GET', 'public/social-networks/list'),
  productsList: () => apiCall('GET', 'public/products/list'),
  langAll: () => apiCall('GET', 'public/server/lang/all'),
  siteStatus: () => apiCall('GET', 'public/site/status/get'),
  visitRegister: d => apiCall('POST', 'public/visits/register', d),
  testHealth: () => apiCall('GET', 'test/health'),
  testIp: () => apiCall('GET', 'test/ip'),
};