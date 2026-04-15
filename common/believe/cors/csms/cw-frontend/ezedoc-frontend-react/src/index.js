/* eslint-disable no-param-reassign */
import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Cookies from "universal-cookie";
import axios from "axios";
import base64 from "base-64";
import * as serviceWorker from "./serviceWorker";

import App from "./App";
import store from "./store";

import "./index.css";
import PlatformDataStoreContext from "./platformDataStoreContext";

const IDENTITY_BASE_URL = process.env.REACT_APP_IDENTITY_BASE_URL;
const CLIENT_KEY = process.env.REACT_APP_CLIENT_KEY;

const auth = `Basic ${base64.encode(CLIENT_KEY)}`;
const AUTH_HEADERS = {
  "Content-Type": "application/json",
  Authorization: auth,
};

const EzeDoc = ({ platformDataStore, platformActions }) => (
  <div id="ezedox_main_container" className="ezedox_main_body">
    <div id="new_version_alert">
      <div id="new_version_card">
        <span id="message">A new app version is available</span>
        <span id="refresh_btn">TAP TO CONTINUE</span>
      </div>
    </div>
    <PlatformDataStoreContext.Provider
      value={{ ...platformDataStore, platformActions }}
    >
      <Provider store={store}>
        <BrowserRouter>
          <Switch>
            <Route path="/custom-workflow/org/:uuid" component={App} />
          </Switch>
        </BrowserRouter>
      </Provider>
    </PlatformDataStoreContext.Provider>
  </div>
);

axios.interceptors.request.use((config) => {
  if (config.skipAuthorization) return config;
  const cookies = new Cookies();
  const access_token = cookies.get("access_token");
  if (
    access_token !== undefined
    && config.headers.Authorization === undefined
  ) {
    config.headers.Authorization = `Bearer ${access_token}`;
  }
  return config;
});

let isAlreadyFetchingAccessToken = false;
let subscribers = [];

function onAccessTokenFetched(access_token) {
  subscribers = subscribers.filter((callback) => callback(access_token));
}

function addSubscriber(callback) {
  subscribers.push(callback);
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const {
      config,
      response: { status },
    } = error;
    const originalRequest = config;

    const hostNameParts = window.location.hostname.split(".");
    const subdomain = hostNameParts.shift();
    const upperleveldomain = hostNameParts.join(".");
    const domain = upperleveldomain === "" ? subdomain : `.${upperleveldomain}`;

    const api = config.url.split("/");
    if (status === 500 && api[api.length - 1] === "token") {
      const cookies = new Cookies();
      cookies.remove("refresh_token", { path: "/", domain });
      cookies.remove("access_token", { path: "/", domain });
      cookies.remove("code_verifier", { path: "/" });
      cookies.remove("sessionId", { path: "/" });
      window.location = "/";
    }
    if (status === 401 && api[api.length - 1] !== "token") {
      if (!isAlreadyFetchingAccessToken) {
        isAlreadyFetchingAccessToken = true;
        const cookies = new Cookies();
        const refreshToken = cookies.get("refresh_token");
        if (refreshToken && refreshToken !== undefined) {
          const requestBody = {
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          };
          axios
            .post(`${IDENTITY_BASE_URL}/token`, requestBody, {
              headers: AUTH_HEADERS,
            })
            .then((response) => {
              if (response.status === 200 || response.status === 201) {
                const newAccessToken = response.data.access_token;
                const accessTokenExpiry = response.data.access_token_expiry;
                const newRefreshToken = response.data.refresh_token;
                const refreshTokenExpiry = response.data.refresh_token_expiry;
                cookies.set("access_token", newAccessToken, {
                  path: "/",
                  expires: new Date(accessTokenExpiry),
                  domain,
                });
                cookies.set("refresh_token", newRefreshToken, {
                  path: "/",
                  expires: new Date(refreshTokenExpiry),
                  domain,
                });
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                isAlreadyFetchingAccessToken = false;
                onAccessTokenFetched(newAccessToken);
              }
            })
            .catch(() => {
              window.location.reload();
            });
        } else {
          window.location.reload();
        }
      }
      const retryOriginalRequest = new Promise((resolve) => {
        addSubscriber((access_token) => {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          resolve(axios(originalRequest));
        });
      });
      return retryOriginalRequest;
    }
    if (status > 399 && api[api.length - 1] === "token") {
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

serviceWorker.register();

export default EzeDoc;
