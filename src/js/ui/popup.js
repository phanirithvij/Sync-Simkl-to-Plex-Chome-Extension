const DefaultSyncPeriod = 12;

const restartLibrarySync = async (durationHrs = DefaultSyncPeriod) => {
  if (!durationHrs) {
    durationHrs = DefaultSyncPeriod;
  }
  if (await isSyncRunning()) stopLibrarySync();
  console.debug("Starting library sync, duration", durationHrs, "hrs");
  chrome.alarms.create("plex-libray-sync", {
    when: Date.now() + 100, // start immediately
    periodInMinutes: 0.1,
    // periodInMinutes: durationHrs * 60,
  });
};

const stopLibrarySync = () => {
  console.debug("Stopping any running library sync");
  chrome.alarms.clear("plex-libray-sync");
};

const startLibrarySync = restartLibrarySync;

const isSyncRunning = async () => {
  return !!(await chrome.alarms.get("plex-libray-sync"));
};

const validateInputUrl = (inputUrl) => {
  if (inputUrl.trim() != "") {
    if (
      (inputUrl.startsWith("http://") || inputUrl.startsWith("https://")) &&
      // must be http{s}://something[/]
      // not http{s}://
      inputUrl.split("://")[1].endsWith("/")
    ) {
      document.body.classList.remove("error-url");
      document.body.classList.add("url-added");
    } else {
      document.body.classList.add("error-url");
    }
  }
};

const handleLogins = () => {
  if (window.location.hash == "#plex-oauth") {
    // this won't request new pin, code this time
    startPlexOauth();
    // remove #plex-oauth from url to be safe
    removeWindowHash();
  } else {
    // request service worker to validate and save oauth tokens
    checkPlexAuthTokenValidity();
  }
  if (window.location.hash == "#simkl-oauth") {
    startSimklOauth();
    // remove #simkl-oauth from url to be safe
    removeWindowHash();
  } else {
    // request service worker to validate and save oauth tokens
    checkSimklAuthTokenValidity();
  }
};

const removePlexURIPermissions = async (plexUrl) => {
  let { allowedOrigins } = await chrome.storage.local.get({
    allowedOrigins: [],
  });
  await chrome.storage.local.set({
    allowedOrigins: removeItemOnce(allowedOrigins, plexUrl.originUrl()),
  });
};

const requestPlexURIPermissions = async (plexUrl) => {
  let { allowedOrigins } = await chrome.storage.local.get({
    allowedOrigins: [],
  });
  if (!allowedOrigins.includes(plexUrl.originUrl())) {
    let allowed = false;
    try {
      allowed = await chrome.permissions.request({
        origins: [plexUrl.originUrl()],
      });
    } catch (error) {
      alert(`Invalid Url: ${plexUrl}\n${error}`);
    }
    if (!allowed) {
      alert(`Access for: ${plexUrl} denined by you, can't perform anything.`);
      return false;
    } else {
      allowedOrigins.push(plexUrl.originUrl());
      chrome.storage.local.set({ allowedOrigins });
    }
  }
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: "allowAllRequests",
        },
        condition: {
          urlFilter: "|http*",
          resourceTypes: ["main_frame"],
        },
      },
    ],
    removeRuleIds: [1],
  });
  return true;
};

const requestRedirectInterceptPermissions = async () => {
  let webNavigationPerm = {
    permissions: ["webNavigation"],
  };
  let havePermission = false;
  havePermission = await chrome.permissions.contains(webNavigationPerm);
  if (!havePermission) {
    // request permission
    alert(
      "Chrome will request for reading your browser history. Don't worry we need it to only to reopen extension after authentication"
    );
    havePermission = await chrome.permissions.request(webNavigationPerm);
    console.debug("Allowed?", havePermission);
  }
  if (!havePermission) {
    alert("Permission was denied by you, now I can't do shit!");
    return;
  }
  let message = {
    method: "bg.addInterceptListeners",
    type: "call",
  };
  await chrome.runtime.sendMessage(message);
};

const uiSyncStarted = () => {
  document.body.classList.add("sync-enabled");
};

const uiSyncStopped = () => {
  document.body.classList.remove("sync-enabled");
};

const uiSetLandscapeUrl = async (url) => {
  if (!!url) {
    // todo
  }
  setCssVar(
    "--background-image-url",
    "url('http://127.0.0.1:32400/photo/:/transcode?width=1920&height=1080&minSize=1&opacity=70&background=343a3f&url=%2Flibrary%2Fmetadata%2F910%2Fart%2F1643865295%3FX-Plex-Token%3DEkM9YQKSSua_MyxuDHK4&X-Plex-Token=EkM9YQKSSua_MyxuDHK4')"
  );
};

const uiSetPortraitUrl = async (url) => {
  if (!!url) {
    // TODO: read from local storage or something
  }
  setCssVar(
    "--background-image-url",
    "url('http://127.0.0.1:32400/photo/:/transcode?width=800&height=600&minSize=1&upscale=1&opacity=30&url=%2Flibrary%2Fmetadata%2F932%2Fthumb%2F1643865288%3FX-Plex-Token%3DEkM9YQKSSua_MyxuDHK4&X-Plex-Token=EkM9YQKSSua_MyxuDHK4')"
  );
};

const uiHandleBackgroundImg = () => {
  let aspectRatio = document.body.clientWidth / document.body.clientHeight;
  Math.round(aspectRatio - 0.5) >= 1 ? uiSetLandscapeUrl() : uiSetPortraitUrl();
};

const uiSetPopupViewState = () => {
  let win = chrome.extension.getViews({ type: "popup" })[0];
  if (win !== undefined && win == window) {
    document.documentElement.classList.add("popupview");
  }
};

const onLoad = async () => {
  // TODO: service worker bug fix

  const plexBtn = document.querySelector("sync-buttons-button.Plex");
  const simklBtn = document.querySelector("sync-buttons-button.Simkl");
  const syncBtn = document.querySelector("sync-form-button");
  const urlInput = document.querySelector("sync-form-plex-url>input");
  const durationInput = document.querySelector("sync-form-select-time>select");

  plexBtn.addEventListener("click", async (_) => {
    let { plexOauthToken } = await chrome.storage.sync.get({
      plexOauthToken: null,
    });
    console.debug(`plexOauthToken is: ${plexOauthToken}`);
    if (!plexOauthToken) {
      await requestRedirectInterceptPermissions();
      startPlexOauth();
    } else {
      logoutPlex();
    }
  });
  simklBtn.addEventListener("click", async (_) => {
    await requestRedirectInterceptPermissions();
    let { simklOauthToken } = await chrome.storage.sync.get({
      simklOauthToken: null,
    });
    console.debug(`simklOauthToken is: ${simklOauthToken}`);
    // console.debug(e);
    if (!simklOauthToken) {
      startSimklOauth();
    } else {
      logoutSimkl();
    }
  });
  urlInput.addEventListener(
    "input",
    debounce(() => validateInputUrl(urlInput.value))
  );
  syncBtn.addEventListener("click", async (_) => {
    if (
      document.body.classList.contains("connected-plex") &&
      document.body.classList.contains("connected-simkl") &&
      document.body.classList.contains("url-added")
    ) {
      let { plexInstanceUrl: oldPlexUrl } = await chrome.storage.local.get({
        plexInstanceUrl: null,
      });
      await chrome.storage.local.set({
        plexInstanceUrl: urlInput.value,
        syncPeriod: durationInput.value,
      });
      if (await isSyncRunning()) {
        // sync enabled; stop it
        uiSyncStopped();
        stopLibrarySync();
        if (oldPlexUrl.originUrl() != urlInput.value.originUrl()) {
          // remove permissions for old url
          removePlexURIPermissions(oldPlexUrl);
        }
      } else {
        // https://stackoverflow.com/questions/27669590/chrome-extension-function-must-be-called-during-a-user-gesture
        if (await requestPlexURIPermissions(urlInput.value)) {
          uiSyncStarted();
          startLibrarySync(durationInput.value);
        }
      }
    }
  });

  handleLogins();
  // load settings from local storage and update UI
  (async () => {
    let { plexInstanceUrl, syncPeriod } = await chrome.storage.local.get({
      plexInstanceUrl: null,
      syncPeriod: DefaultSyncPeriod,
    });
    if (!!plexInstanceUrl) {
      urlInput.value = plexInstanceUrl;
      validateInputUrl(urlInput.value);
    }
    if (!!syncPeriod) {
      durationInput.value = syncPeriod;
    }
    if (await isSyncRunning()) {
      uiSyncStarted();
    }
  })();

  uiSetPopupViewState();
  uiHandleBackgroundImg();
};

window.addEventListener("load", onLoad);
window.addEventListener("resize", uiHandleBackgroundImg);

// Registering UI event handlers (actions)

chrome.runtime.onMessage.addListener((message, sender) => {
  console.debug("Got message:", message, "from:", sender);
  switch (message.type) {
    case "action":
      switch (message.action) {
        case "oauth.plex.login":
          finishPlexOauth(message);
          break;
        case "oauth.plex.logout":
          finishLogoutPlex(message);
          stopLibrarySync();
          break;
        case "oauth.simkl.login":
          finishSimklOauth(message);
          break;
        case "oauth.simkl.logout":
          stopLibrarySync();
          finishLogoutSimkl(message);
          break;
        default:
          console.debug("Unknown message format", message);
      }
      break;
    case "call":
      // ignore calls (they will be recieved by background.js)
      break;

    default:
      console.debug("Unknown message type", message);
  }
  // required if we don't use sendResponse
  return true;
});
