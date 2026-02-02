// ==UserScript==
// @name         Seeking Alpha Bilingual
// @namespace    https://seekingalpha.com/
// @version      1.5.0
// @match        *://*.seekingalpha.com/market-news*
// @grant        GM_xmlhttpRequest
// @connect      translate.googleapis.com
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 尝试多个可能的选择器
    const SELECTORS = [
        'a[data-test-id="post-list-item-title"]',
        'a[data-test-id="post-index-item-title"]',
        'a[class*="post-list-item-title"]',
        'a[class*="title---"]', // 针对混淆类名
        'h3 a' // 最后的保底手段
    ].join(',');

    console.log("[SA-Bilingual] 适配器模式启动...");

    const cache = new Map();

    async function translate(text) {
        if (cache.has(text)) return cache.get(text);
        return new Promise(resolve => {
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;
            GM_xmlhttpRequest({
                method: "GET", url,
                onload: r => {
                    try {
                        const res = JSON.parse(r.responseText);
                        const trans = res[0].map(x => x[0]).join('');
                        cache.set(text, trans);
                        resolve(trans);
                    } catch(e) { resolve(null); }
                },
                onerror: () => resolve(null)
            });
        });
    }

    async function process() {
        const elements = document.querySelectorAll(SELECTORS);

        for (let el of elements) {
            if (el.dataset.translated || el.querySelector('.sa-zh')) continue;

            const text = el.innerText.trim();
            if (text.length < 10) continue; // 过滤掉太短的按钮或日期

            el.dataset.translated = "true";
            const zh = await translate(text);

            if (zh) {
                const span = document.createElement('span');
                span.className = 'sa-zh';
                span.innerText = zh;
                span.style.cssText = "display:block; color:#ef7b00; font-size:0.9em; margin-top:4px; font-weight:normal;";
                el.appendChild(span);
            }
        }
    }

    // 监听与轮询
    setInterval(process, 10000);
    const observer = new MutationObserver(process);
    observer.observe(document.body, { childList: true, subtree: true });

    process();
})();