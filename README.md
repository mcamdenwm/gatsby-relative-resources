# Gatsby resolve resources against any base path

This repo contains a series of changes to the Gatsby default app, which allow us to request resources against any base path. 

## Problem

*Gatsby by default expects a universal root path like /blog/*

Gatsby assumes that the entire app will either be under root, or the same base path like `/blog/`. This is an issue for us, because our PWA's may exist under a different base path like, `/payments` or `/org` and our root is actually the monolith. We rely on these paths to route the request to the appropriate server. The monolith doesn't know how to provide resources for the SPA, so we need to ensure that this path is correct.

*`pathPrefix` is mutated during build time*

If `pathPrefix` is assigned, it is mutated during the build process if it does not start with `/`. For example, if it is set to `.` it will become, `/./`. This kind of sucks, because it means we cannot just set it as a relative path and resolve resources using the `<base>` tag.

## Possible Solution

The solution I've come up with uses a couple of vectors to solve this problem.

### `pathPrefix` configuration / build

Assign `pathPrefix` a value that we can find, and replace during the build step. This will let us assign a relative value to the resource's href, which will force the resource to rely on the `<base href>` as its base URL.

```
gatsby-config.js
9: pathPrefix: '##WM_REPLACE_PATH_PREFIX##',
```

When building, provide the `--prefix-paths` flag

`gatsby build --prefix-paths`

### post-build plugin

During the post-build step, we are able to mutate the output of the gatsby build.

#### `##WM_REPLACE_PATH_PREFIX##` token replacement

Replace the `pathPrefix` token '##WM_REPLACE_PATH_PREFIX##', with a relative path `./`. 

```
gatsby-node.js
27: let replacedContent = data.replace(/\/##WM_REPLACE_PATH_PREFIX##/g, '.');
```

#### <base> tag injection

Inject a script which will dynamically generate the `<base>` tag with an href that matches the expected PWA path. *Note: we expect our PWA paths to match a certain pattern: one word, on the root path like wm.com/payments wm.com/org-structure*

This solution assumes that we do not know the PWA path until runtime. It grabs the first part of the url, and assumes it to be the base href.

```
gatsby-node.js
 4: const bootstrap = `
 5: <script>
 6: (function bootstrap() {
 7:   var path = location.pathname;
 8:   var pwaPath = path.split('/')[1];
 9:   var head = document.querySelector('head');
10: 
11:   // Unable to use tree manipulation because reasons
12:   head.innerHTML = '<base href="/'+pwaPath+'/" />' + head.innerHTML;
13: })();
...
32: replacedContent = replacedContent.replace('<head>', '<head>' + bootstrap);
```

#### Push preload <link>'s to resolve after <base> tag

Since the `<base>` tag is now being resolved dynamically, it will be processed after the static content like `<link>`'s within `<head>`. In order to have the `<link>` resolve against the `<base>` href, they will need to be resolved after `<base>` is resolved.

```
gatsby-node.js
14: function writeLink(link) {
15:   var head = document.querySelector('head');
16:   head.innerHTML += link;
17: }
...
33: replacedContent = replacedContent.replace(/<link rel="preload"(.*)?\/>/ig, '<script>writeLink(`<link rel="preload"$1`)</script>');
```

### Relativizer runtime plugin

Gatsby (I believe) uses the HTML5 History API to push routes. If each PWA is a 'page' in Gatsby, it would change the base path, which would potentially cause resources to be pulled from the wrong base. Like starting in '/org' and moving to '/payments' after clicking on a link.

#### Include plugin in config

``` gatsby-config.js
 7: `gatsby-plugin-relativizer`,
```

#### onInitialClientRender, onRouteUpdate lifecycle capture

During the initial render, and route update events we respond by examining the `href` property of the `<base>` tag and comparing it to the base path. If it is different, we rewrite `<base>` to match the current base path.

``` plugins/gatsby-plugin-relativizer/gatsby-browser.js
 1: function maybeUpdateBase() {
 2:   var path = location.pathname;
 3:   var pwaPath = path.split('/')[1];

17:   var baseEl = document.querySelector('base');
18:   baseEl.parentNode.removeChild(baseEl);
19:   head.innerHTML = `<base href="/${pwaPath}/" />${head.innerHTML}`;
...
23: exports.onInitialClientRender = maybeUpdateBase;
24: exports.onRouteUpdate = maybeUpdateBase;
```









