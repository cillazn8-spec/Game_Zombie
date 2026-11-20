/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2306d39431333c6365ccdde896f405a1"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b47c15bdcc1bebba7d1d14e0602fc735"
  }, {
    "url": "pwa-192x192.png",
    "revision": "29b0535b222378d5b057ba76a78ecef9"
  }, {
    "url": "index.html",
    "revision": "78a646d49b35be5f7d18630de65d0bc4"
  }, {
    "url": "icon.svg",
    "revision": "4ea14e5dd171cbc2352faf1d29e0f659"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "23ea144ec88f829acf533f3b5bc99578"
  }, {
    "url": "src/assets/images/zombie_survival_icon_1795135790418.jpg",
    "revision": "ce67932683f6385d264c6b04634d2c2b"
  }, {
    "url": "assets/index-sr08ROVr.css",
    "revision": null
  }, {
    "url": "assets/index-seg35xve.js",
    "revision": null
  }, {
    "url": "assets/aistudio/zombiebos3_0f4a8117.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/zombie_bos_2_e264b743.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/zombie_bos1_65cc1254.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/zombie_60452499.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/zombie3_b81417a0.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/zombie2_db8ea1c7.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/zombie1_bde209ed.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/skinkarkter6_228e728e.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/skinkarkter5_6c2b404b.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/skinkarkter4_22255844.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/skinkarkter2_e692a642.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/skin_karkter3_e78d2d57.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/skin_karkter1_98537754.jpeg",
    "revision": null
  }, {
    "url": "assets/aistudio/karkter_3de907e9.jpeg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "23ea144ec88f829acf533f3b5bc99578"
  }, {
    "url": "icon.svg",
    "revision": "4ea14e5dd171cbc2352faf1d29e0f659"
  }, {
    "url": "pwa-192x192.png",
    "revision": "29b0535b222378d5b057ba76a78ecef9"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b47c15bdcc1bebba7d1d14e0602fc735"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "2306d39431333c6365ccdde896f405a1"
  }, {
    "url": "manifest.webmanifest",
    "revision": "ddd7964c82a2db3741955dfabf73868a"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html"), {
    denylist: [/^\/ws/, /^\/api/]
  }));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
