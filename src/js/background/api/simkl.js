const SimklRedirectURI = `${HttpCrxRedirectStub}/popup.html#simkl-oauth`;

(() => {
  importScripts("./env.js");

  const checkTokenValiditiy = async (responseChannel, token) => {
    if (!!token) {
      let { valid } = await getLastActivity(null, token);
      responseChannel(makeSuccessResponse({ authToken: token, valid }));
      return;
    }
    let { simklOauthToken } = await chrome.storage.sync.get({
      simklOauthToken: null,
    });
    if (!!simklOauthToken) {
      let { valid } = await getLastActivity(null, simklOauthToken);
      responseChannel(
        makeSuccessResponse({ authToken: simklOauthToken, valid })
      );
      return;
    }
    // no token provided or found in localstorage
    responseChannel(makeErrorResponse({ authToken: null, valid: false }));
    return;
  };

  const getAuthToken = async (code) => {
    let req = {
      code: code,
      client_id: SimklClientID,
      client_secret: SimklClientSecret,
      redirect_uri: SimklRedirectURI,
      grant_type: "authorization_code",
    };
    return await (
      await fetch("https://api.simkl.com/oauth/token", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req),
      })
    ).json();
  };

  const loginURI = () => {
    // Docs: https://simkl.docs.apiary.io/#reference/authentication-oauth-2.0/authorize-application?console=1
    return (
      "https://simkl.com/oauth/authorize?" +
      stringify({
        response_type: "code",
        client_id: SimklClientID,
        redirect_uri: SimklRedirectURI,
      })
    );
  };

  const oauthStart = async (responseChannel, inPopup) => {
    let { simklPinCode } = await chrome.storage.local.get();
    console.debug("localStorage:", { simklPinCode });

    if (!!simklPinCode) {
      // after redirect step
      let response = await getAuthToken(simklPinCode);
      console.debug("Simkl access_token response:", response);
      if ("error" in response) {
        // failed to authenticate the user
        // TODO: this might be because code expired
        // it stayed in the local storage for too long
        responseChannel(makeErrorResponse(response));
        return;
      }
      if (response["access_token"] != null) {
        // got the plex authtoken
        // successfully logged in
        // code is one time use only forget it
        chrome.storage.local.set({ simklPinCode: null });
        responseChannel(
          makeSuccessResponse({ authToken: response["access_token"] })
        );
        return;
      }
      responseChannel(makeErrorResponse(response));
      return;
    }

    let appAuthorizeUrl = loginURI();
    console.debug("Simkl application auth URL:", appAuthorizeUrl);
    if (inPopup) {
      // open url in new tab
      chrome.tabs.create({ url: appAuthorizeUrl });
    } else {
      // open url in same tab
      chrome.tabs.update({ url: appAuthorizeUrl });
    }
    return true;
  };

  // const getAllItemsFullSync =
  const getAllItems = async (responseChannel, { dateFrom, token }) => {
    let types = ["shows", "movies", "anime"];
    let responses = await Promise.all(
      types.map((type) =>
        fetch(
          `https://api.simkl.com/sync/all-items/${type}?` +
            "episode_watched_at=yes" +
            (!dateFrom ? "" : `&date_from=${dateFrom}`) +
            (type == "movies" ? "" : "&extended=full"),
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              "simkl-api-key": SimklClientID,
            },
          }
        )
      )
    );
    responses.forEach(async (resp, i) => {
      if (resp.status == 200) {
        let items = await resp.json();
        console.debug("Got items: ", types[i], resp.headers);
      }
    });
    return true;
  };

  const getLastActivity = async (responseChannel, token) => {
    let resp = await fetch("https://api.simkl.com/sync/activities", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "simkl-api-key": SimklClientID,
      },
    });
    if (resp.status == 200) {
      let data = await resp.json();
      !!responseChannel && responseChannel(makeSuccessResponse(data));
      return { valid: true, info: data };
    }
    let data = await resp.json();
    !!responseChannel && responseChannel(makeErrorResponse(data));
    return { valid: false, info: data, status: resp.status };
  };

  const getUserInfo = async (token) => {
    let resp = await fetch("https://api.simkl.com/users/settings", {
      headers: {
        "Content-Type": "application/json",
        "simkl-api-key": SimklClientID,
        Authorization: `Bearer ${token}`,
      },
    });
    if (resp.status == 200) {
      return await resp.json();
    }
  };

  __API__.simkl.oauth.oauthStart = oauthStart;
  __API__.simkl.oauth.checkTokenValiditiy = checkTokenValiditiy;

  __API__.simkl.apis.getLastActivity = getLastActivity;
  __API__.simkl.apis.getAllItems = getAllItems;
  __API__.simkl.apis.getUserInfo = getUserInfo;
})();
