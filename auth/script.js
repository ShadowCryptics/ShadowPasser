(function() {
    const blockedDomain = "service-fb-examly-io-7tvaoi4e5q-uk.a.run.app";
    const pathPrefix = "/api";

    const fake403 = new Response("403 Forbidden", {
        status: 403,
        statusText: "Forbidden",
        headers: { "Content-Type": "text/plain" }
    });

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes(blockedDomain) && new URL(url).pathname.startsWith(pathPrefix)) {
            console.warn("[Blocked fetch] " + url);
            return Promise.resolve(fake403.clone());
        }
        return originalFetch(input, init);
    };

    // Intercept XMLHttpRequests
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url; // Store for later use in send()
        originalXHROpen.apply(this, arguments);
    };

    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        const url = this._url;
        if (url && url.includes(blockedDomain) && new URL(url).pathname.startsWith(pathPrefix)) {
            console.warn("[Blocked XHR] " + url);
            this.readyState = 4;
            this.status = 403;
            this.statusText = "Forbidden";
            this.responseText = "403 Forbidden";

            this.onreadystatechange && this.onreadystatechange();
            this.onload && this.onload();
        } else {
            originalXHRSend.apply(this, arguments);
        }
    };

    // Aggressively allow paste
    function forceEnablePaste() {
        const elements = document.querySelectorAll('input, textarea');
        elements.forEach(el => {
            try {
                el.onpaste = null;
                el.removeAttribute('onpaste');

                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);

                clone.addEventListener('paste', (e) => {
                    e.stopImmediatePropagation();
                }, true);
            } catch (err) {
                console.warn("Paste unblock failed on element:", err);
            }
        });
    }

    // Block new 'paste' listeners
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'paste') {
            console.warn("Blocked a paste event listener.");
            return;
        }
        return originalAddEventListener.apply(this, arguments);
    };

    // Watch DOM for new elements to keep enabling paste
    const observer = new MutationObserver(() => {
        forceEnablePaste();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Periodically reapply
    setInterval(forceEnablePaste, 500);
    forceEnablePaste();
})();
