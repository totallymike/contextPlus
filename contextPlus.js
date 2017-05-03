if (browser.contextualIdentities !== undefined) {
  browser.contextualIdentities.query({})
    .then((contexts) => {
      const parentId = browser.contextMenus.create({
        id: "moveContext",
        title: "Move to context",
        contexts: ["tab"]
      });

      const contextStore = contexts.reduce((store, context) => {
        return Object.assign({}, store, {
          [`contextPlus-${context.name}`]: context.cookieStoreId
        });
      }, {});

      // Add a default context manually.
      // Hope the name of the default cookieStore never changes :)
      contextStore['contextPlus-default'] = 'firefox-default';
      browser.contextMenus.create({
        type: "normal",
        title: "Default",
        id: 'contextPlus-default',
        parentId
      });

      contexts.forEach(context => {
        browser.contextMenus.create({
          type: "normal",
          title: context.name,
          id: `contextPlus-${context.name}`,
          parentId
        });
      });

      browser.contextMenus.onClicked.addListener(function (info, tab) {
        if (contextStore.hasOwnProperty(info.menuItemId)) {
          const moveTab = !info.modifiers.includes('Ctrl');
          const cookieStoreId = contextStore[info.menuItemId];
          const newTabData = {
            active,
            index,
            pinned,
            url,
            windowId
          } = tab;

          const newTabPromise = browser.tabs.create({
            active,
            cookieStoreId,
            index: index + (moveTab ? 0 : 1),
            pinned,
            url,
            windowId
          });
          if (moveTab) {
            newTabPromise.then(() => browser.tabs.remove(tab.id));
          }
        }
      });
    });
}