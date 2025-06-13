const domain = "service-fb-examly-io-7tvaoi4e5q-uk.a.run.app";
const pathPrefix = "/api";

const fake403 = new Response("403 Forbidden", {
    status: 403,
    statusText: "Forbidden",
    headers: { "Content-Type": "text/plain" }
});

const originalFetch = window.fetch;
window.fetch = function(input, init) {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes(domain) && new URL(url).pathname.startsWith(pathPrefix)) {
        console.warn("[JS Blocked fetch] " + url);
        return Promise.resolve(fake403.clone());
    }
    return originalFetch(input, init);
};

const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url) {
    if (url.includes(domain) && new URL(url).pathname.startsWith(pathPrefix)) {
        console.warn("[JS Blocked XHR] " + url);
        this.send = function() {
            this.readyState = 4;
            this.status = 403;
            this.statusText = "Forbidden";
            this.responseText = "403 Forbidden";
            this.onreadystatechange && this.onreadystatechange();
            this.onload && this.onload();
        };
        return;
    }
    return originalXHROpen.apply(this, arguments);
};

(function() {
    function enablePaste() {
        const elements = document.querySelectorAll('input, textarea');
        elements.forEach(el => {
            el.onpaste = null;
            el.removeAttribute('onpaste');
            el.addEventListener('paste', (e) => {
                e.stopImmediatePropagation();
            }, true);
        });
    }

    enablePaste();

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'paste') {
            return;
        }
        return originalAddEventListener.apply(this, arguments);
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        if (node.matches('input, textarea')) {
                            node.onpaste = null;
                            node.removeAttribute('onpaste');
                            node.addEventListener('paste', (e) => {
                                e.stopImmediatePropagation();
                            }, true);
                        }
                        node.querySelectorAll('input, textarea').forEach((el) => {
                            el.onpaste = null;
                            el.removeAttribute('onpaste');
                            el.addEventListener('paste', (e) => {
                                e.stopImmediatePropagation();
                            }, true);
                        });
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    setInterval(enablePaste, 1000);
})();
