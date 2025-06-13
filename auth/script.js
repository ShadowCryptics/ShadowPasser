(function() {
    const blockedDomain = "service-fb-examly-io-7tvaoi4e5q-uk.a.run.app";
    const pathPrefix = "/api";

    // Fake 403 Response
    const fake403 = new Response("403 Forbidden", {
        status: 403,
        statusText: "Forbidden",
        headers: { "Content-Type": "text/plain" }
    });

    // Patch fetch to block specific API paths
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes(blockedDomain) && new URL(url).pathname.startsWith(pathPrefix)) {
            console.warn("[Blocked fetch]", url);
            return Promise.resolve(fake403.clone());
        }
        return originalFetch(input, init);
    };

    // Patch XMLHttpRequest to block specific API paths
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._url = url;
        originalXHROpen.apply(this, arguments);
    };
    const originalXHRSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function() {
        if (this._url && this._url.includes(blockedDomain) && new URL(this._url).pathname.startsWith(pathPrefix)) {
            console.warn("[Blocked XHR]", this._url);
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

    // Kill all paste-blocking behaviors
    function allowPaste() {
        document.querySelectorAll('input, textarea').forEach(el => {
            try {
                el.onpaste = null;
                el.removeAttribute('onpaste');

                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);

                clone.addEventListener('paste', e => e.stopImmediatePropagation(), true);
            } catch (err) {
                console.warn("Error unblocking paste on:", el, err);
            }
        });
    }

    // Intercept paste-blocking event listeners globally
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'paste') {
            console.warn("Blocked site from attaching a paste listener.");
            return;
        }
        return originalAddEventListener.apply(this, arguments);
    };

    // Keep cleaning up the DOM on every mutation
    const observer = new MutationObserver(() => allowPaste());
    observer.observe(document.body, { childList: true, subtree: true });

    // Also reapply periodically
    setInterval(allowPaste, 500);

    // Initial cleanup
    allowPaste();
})();
