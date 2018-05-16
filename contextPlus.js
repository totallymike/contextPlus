let contextStore = {};

const contextMenuContainers = {
  // The context menu is re-created each time a tab is activated
  // to account for its context.
  contextualIdentities: undefined,
  colors: {
    blue: "37adff",
    turquoise: "00c79a",
    green: "51cd00",
    yellow: "ffcb00",
    orange: "ff9f00",
    red: "ff613d",
    pink: "ff4bda",
    purple: "af51f5"
  },
  defaultCookieStoreId: "firefox-default",
  async onActivatedTabHandler({ tabId }) {
    browser.contextMenus.removeAll();
    const parentId = browser.contextMenus.create({
      id: "moveContext",
      title: "Move to Context",
      contexts: ["tab", "page"]
    });

    const activeTab = await browser.tabs.get(tabId);
    if (
      activeTab.cookieStoreId !== contextMenuContainers.defaultCookieStoreId
    ) {
      browser.contextMenus.create({
        type: "normal",
        title: "No Context",
        id: "contextPlus-default",
        parentId
      });
      browser.contextMenus.create({
        type: "separator",
        id: "contextPlus-separator",
        parentId
      });
    }

    // Get the user's saved filter regex setting as set in the addon's options
    const filterStore = await browser.storage.sync.get("filterRegex");
    const filterRegex = filterStore.filterRegex;

    contextMenuContainers.contextualIdentities
      .filter(context => context.cookieStoreId !== activeTab.cookieStoreId)
      .filter(
        context =>
          filterRegex ? !context.name.match(new RegExp(filterRegex)) : true
      )
      .forEach(context => {
        fetch(`icons/usercontext-${context.icon}.svg`)
          .then(response => response.text())
          .then(svg => {
            const colors = contextMenuContainers.colors;
            svg = svg.replace("context-fill", `%23${colors[context.color]}`);

            browser.contextMenus.create({
              type: "normal",
              title: context.name,
              id: `contextPlus-${context.name}`,
              parentId,
              icons: {
                16: "data:image/svg+xml;utf8," + svg
              }
            });
          });
      });
  },

  async updateStore() {
    const contextualIdentities = await browser.contextualIdentities.query({});
    contextMenuContainers.contextualIdentities = contextualIdentities;
    contextStore = contextualIdentities.reduce(
      (store, context) => {
        return Object.assign({}, store, {
          [`contextPlus-${context.name}`]: context.cookieStoreId
        });
      },
      { "contextPlus-default": contextMenuContainers.defaultCookieStoreId }
    );
  },

  async init() {
    if (!browser.contextualIdentities) {
      return;
    }

    await contextMenuContainers.updateStore();

    browser.tabs.onActivated.addListener(
      contextMenuContainers.onActivatedTabHandler
    );

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
          windowId
        });
        if (moveTab) {
          await newTabPromise;
          browser.tabs.remove(tab.id);
        }
      }
    };
    browser.contextMenus.onClicked.addListener(onClickedHandler);
    browser.contextualIdentities.onCreated.addListener(async function() {
      await contextMenuContainers.updateStore();
      contextMenuContainers.onActivatedTabHandler();
    });
  }
};

contextMenuContainers.init();
