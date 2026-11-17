// 아이콘 클릭 → 모아보기 탭 열기 (이미 열려 있으면 그 탭으로 이동)
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('app.html');
  const [tab] = await chrome.tabs.query({ url });
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});

// 이 확장 화면에서 보내는 요청에만 각 사이트 Referer를 붙임 (이미지 핫링크 차단 대비)
async function setRefererRules() {
  const sites = [
    ['clien.net', 'https://www.clien.net/'],
    ['ppomppu.co.kr', 'https://www.ppomppu.co.kr/'],
    ['damoang.net', 'https://damoang.net/'],
  ];
  const addRules = sites.map(([domain, ref], i) => ({
    id: i + 1,
    priority: 1,
    action: { type: 'modifyHeaders', requestHeaders: [{ header: 'referer', operation: 'set', value: ref }] },
    condition: { requestDomains: [domain], initiatorDomains: [chrome.runtime.id], resourceTypes: ['image', 'media', 'xmlhttprequest'] },
  }));
  try {
    await chrome.declarativeNetRequest.updateSessionRules({ removeRuleIds: addRules.map((r) => r.id), addRules });
  } catch (e) {
    console.warn('referer rule', e);
  }
}
chrome.runtime.onInstalled.addListener(setRefererRules);
chrome.runtime.onStartup.addListener(setRefererRules);
setRefererRules();
