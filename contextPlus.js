const contextMenuContainers = {
  async init() {
    if (!browser.contextualIdentities) {
      return;
    }

    const contextualIdentities = await browser.contextualIdentities.query({});
    const parentId = browser.contextMenus.create({
      id: "moveContext",
      title: "Move to context",
      contexts: ["tab", "page"]
    });

    const contextStore = contextualIdentities.reduce((store, context) => {
      return Object.assign({}, store, {
        [`contextPlus-${context.name}`]: context.cookieStoreId
      });
    }, {});

    // Add a default context manually.
    // Hope the name of the default cookieStore never changes :)
    contextStore["contextPlus-default"] = "firefox-default";
    browser.contextMenus.create({
      type: "normal",
      title: "Default",
      id: "contextPlus-default",
      parentId
    });

    contextualIdentities.forEach(context => {
      browser.contextMenus.create({
        type: "normal",
        title: context.name,
        id: `contextPlus-${context.name}`,
        parentId
      });
    });

    const onClickedHandler = async function (info, tab) {
      if (contextStore.hasOwnProperty(info.menuItemId)) {
        const moveTab = !(info.modifiers && info.modifiers.includes("Ctrl"));
        const cookieStoreId = contextStore[info.menuItemId];
        const {
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
          await newTabPromise;
          browser.tabs.remove(tab.id);
        }
      }
    };
    browser.contextMenus.onClicked.addListener(onClickedHandler);
  }
};

contextMenuContainers.init();
