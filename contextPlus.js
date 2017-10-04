const contextMenuContainers = {
  async init() {
    if (!browser.contextualIdentities) {
      return;
    }

    const defaultCookieStoreId = "firefox-default";

    const contextualIdentities = await browser.contextualIdentities.query({});
    const contextStore = contextualIdentities.reduce((store, context) => {
      return Object.assign(
        { "contextPlus-default": defaultCookieStoreId },
        store,
        { [`contextPlus-${context.name}`]: context.cookieStoreId }
      );
    }, {});

    // The context menu is re-created each time a tab is activated
    // to account for its context.
    const onActivatedTabHandler = async function({ tabId }) {
      browser.contextMenus.removeAll();
      const parentId = browser.contextMenus.create({
        id: "moveContext",
        title: "Move to Context",
        contexts: ["tab", "page"],
      });

      const activeTab = await browser.tabs.get(tabId);
      if (activeTab.cookieStoreId !== defaultCookieStoreId) {
        browser.contextMenus.create({
          type: "normal",
          title: "No Context",
          id: "contextPlus-default",
          parentId,
        });
        browser.contextMenus.create({
          type: "separator",
          id: "contextPlus-separator",
          parentId,
        });
      }

      contextualIdentities
        .filter(context => context.cookieStoreId !== activeTab.cookieStoreId)
        .forEach(context => {
          fetch(`icons/usercontext-${context.icon}.svg`)
            .then(response => response.text())
            .then(svg => {
              svg = svg.replace(
                "context-fill",
                context.colorCode.replace("#", "%23")
              );

              browser.contextMenus.create({
                type: "normal",
                title: context.name,
                id: `contextPlus-${context.name}`,
                parentId,
                icons: {
                  16: "data:image/svg+xml;utf8," + svg,
                },
              });
            });
        });
    };
    browser.tabs.onActivated.addListener(onActivatedTabHandler);

    const onClickedHandler = async function(info, tab) {
      if (contextStore.hasOwnProperty(info.menuItemId)) {
        const moveTab = !(info.modifiers && info.modifiers.includes("Ctrl"));
        const cookieStoreId = contextStore[info.menuItemId];
        const { active, index, pinned, url, windowId } = tab;

        const newTabPromise = browser.tabs.create({
          active,
          cookieStoreId,
          index: index + (moveTab ? 0 : 1),
          pinned,
          url,
          windowId,
        });
        if (moveTab) {
          await newTabPromise;
          browser.tabs.remove(tab.id);
        }
      }
    };
    browser.contextMenus.onClicked.addListener(onClickedHandler);
  },
};

contextMenuContainers.init();
